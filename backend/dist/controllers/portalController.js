"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLatestSmsLog = exports.createCheckoutOrder = exports.incrementVisitors = exports.getPortalData = void 0;
const Restaurant_1 = require("../models/Restaurant");
const Category_1 = require("../models/Category");
const Product_1 = require("../models/Product");
const Order_1 = require("../models/Order");
const Alert_1 = require("../models/Alert");
const SmsLog_1 = require("../models/SmsLog");
// 1. Get Portal Data
const getPortalData = async (req, res) => {
    try {
        const { slug } = req.params;
        const restaurant = await Restaurant_1.Restaurant.findOne({ slug });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
        const isExpired = restaurant.paymentStatus !== 'completed' && new Date() > restaurant.subscriptionExpiryDate;
        if (restaurant.status === 'disabled' || (!isDev && isExpired)) {
            return res.status(403).json({ message: 'This restaurant is temporarily unavailable.' });
        }
        // Get Active Categories
        const categories = await Category_1.Category.find({ restaurantId: restaurant._id, status: 'active' }).sort({ createdAt: 1 });
        const activeCategoryIds = categories.map(c => c._id);
        // Get Active Products in Active Categories
        const products = await Product_1.Product.find({
            restaurantId: restaurant._id,
            categoryId: { $in: activeCategoryIds },
            status: 'active'
        }).sort({ createdAt: -1 });
        // Fetch alerts from Super Admin
        const alert = await Alert_1.Alert.findOne({ restaurantId: restaurant._id });
        return res.status(200).json({
            restaurant: {
                id: restaurant._id,
                name: restaurant.name,
                slug: restaurant.slug,
                location: restaurant.location,
                logo: restaurant.logo,
                banner: restaurant.banner,
                vatPercentage: restaurant.vatPercentage,
            },
            categories,
            products,
            alert: alert ? alert.message : null
        });
    }
    catch (error) {
        console.error('Get portal data error:', error);
        return res.status(500).json({ message: 'Server error loading QR Menu details' });
    }
};
exports.getPortalData = getPortalData;
// 2. Increment Visitors
const incrementVisitors = async (req, res) => {
    try {
        const { slug } = req.params;
        const restaurant = await Restaurant_1.Restaurant.findOneAndUpdate({ slug }, { $inc: { visitorsCount: 1 } }, { new: true });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        return res.status(200).json({ success: true, visitorsCount: restaurant.visitorsCount });
    }
    catch (error) {
        console.error('Increment visitors error:', error);
        return res.status(500).json({ message: 'Server error incrementing visitors' });
    }
};
exports.incrementVisitors = incrementVisitors;
// 3. Create Checkout Order
const createCheckoutOrder = async (req, res) => {
    try {
        const { slug } = req.params;
        const { fullName, phone, tableNumber, items } = req.body;
        if (!fullName || !phone || !tableNumber || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({ message: 'Customer name, phone, table number and items are required' });
        }
        const restaurant = await Restaurant_1.Restaurant.findOne({ slug });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
        const isExpired = restaurant.paymentStatus !== 'completed' && new Date() > restaurant.subscriptionExpiryDate;
        if (restaurant.status === 'disabled' || (!isDev && isExpired)) {
            return res.status(403).json({ message: 'This restaurant is temporarily unavailable.' });
        }
        const calculatedItems = [];
        let subtotal = 0;
        for (const item of items) {
            const product = await Product_1.Product.findOne({ _id: item.productId, restaurantId: restaurant._id });
            if (!product) {
                return res.status(404).json({ message: `Product not found: ${item.productId}` });
            }
            if (product.status === 'inactive') {
                return res.status(400).json({ message: `Product is inactive: ${product.name}` });
            }
            // Check stock quantity limits (if specified)
            if (product.quantity !== undefined) {
                if (product.quantity <= 0) {
                    return res.status(400).json({ message: `Product is out of stock: ${product.name}` });
                }
                if (product.quantity < item.quantity) {
                    return res.status(400).json({ message: `Insufficient stock for: ${product.name}. Available: ${product.quantity}` });
                }
            }
            let price = product.price;
            let name = product.name;
            if (item.variantName) {
                // Variant selected
                const variant = product.variants.find(v => v.name === item.variantName);
                if (!variant) {
                    return res.status(404).json({ message: `Variant ${item.variantName} not found for product ${product.name}` });
                }
                price = variant.discountPrice !== undefined ? variant.discountPrice : variant.price;
            }
            else {
                // No variant, use product discountPrice if exists
                price = product.discountPrice !== undefined ? product.discountPrice : product.price;
            }
            const itemTotal = price * item.quantity;
            subtotal += itemTotal;
            calculatedItems.push({
                productId: product._id,
                name: product.name,
                variantName: item.variantName || undefined,
                quantity: item.quantity,
                price
            });
        }
        const vatPercentage = restaurant.vatPercentage || 0;
        const vatAmount = subtotal * (vatPercentage / 100);
        const grandTotal = subtotal + vatAmount;
        // Generate dynamic sequential readable Order ID (ORD-YYYYMMDD-XXXX)
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const todayCount = await Order_1.Order.countDocuments({
            restaurantId: restaurant._id,
            createdAt: { $gte: startOfToday }
        });
        let seq = todayCount + 1;
        let orderId = `ORD-${dateStr}-${String(seq).padStart(4, '0')}`;
        let exists = await Order_1.Order.findOne({ orderId });
        while (exists) {
            seq += 1;
            orderId = `ORD-${dateStr}-${String(seq).padStart(4, '0')}`;
            exists = await Order_1.Order.findOne({ orderId });
        }
        // Create Order Record
        const order = await Order_1.Order.create({
            restaurantId: restaurant._id,
            orderId,
            fullName: fullName.trim(),
            phone: phone.trim(),
            tableNumber: tableNumber.trim(),
            items: calculatedItems,
            subtotal,
            vat: vatAmount,
            discountAmount: 0,
            discountNote: '',
            originalTotal: grandTotal,
            grandTotal,
            status: 'pending'
        });
        // Generate SMS Notice Log
        const smsMessage = `[${restaurant.name}] Order confirmed! ID: ${orderId}. Table: ${tableNumber}. Subtotal: $${subtotal.toFixed(2)}, VAT (${vatPercentage}%): $${vatAmount.toFixed(2)}, Total: $${grandTotal.toFixed(2)}.`;
        await SmsLog_1.SmsLog.create({
            mobile: phone.trim(),
            message: smsMessage
        });
        return res.status(201).json({
            message: 'Order created successfully',
            orderId,
            order
        });
    }
    catch (error) {
        console.error('Checkout error:', error);
        return res.status(500).json({ message: 'Server error processing checkout' });
    }
};
exports.createCheckoutOrder = createCheckoutOrder;
// 4. Get Latest SMS Log (Public dev helper for checkout page Notice Box)
const getLatestSmsLog = async (req, res) => {
    try {
        const log = await SmsLog_1.SmsLog.findOne().sort({ createdAt: -1 });
        return res.status(200).json(log ? [log] : []);
    }
    catch (error) {
        console.error('Get latest SMS error:', error);
        return res.status(500).json({ message: 'Server error fetching latest SMS log' });
    }
};
exports.getLatestSmsLog = getLatestSmsLog;
