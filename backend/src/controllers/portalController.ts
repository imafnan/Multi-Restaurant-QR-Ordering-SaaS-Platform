import { Request, Response } from 'express';
import { Restaurant } from '../models/Restaurant';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { Alert } from '../models/Alert';
import { SmsLog } from '../models/SmsLog';

// 1. Get Portal Data
export const getPortalData = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const restaurant = await Restaurant.findOne({ slug });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    const isExpired = restaurant.paymentStatus !== 'completed' && new Date() > restaurant.subscriptionExpiryDate;
    if (restaurant.status === 'disabled' || (!isDev && isExpired)) {
      return res.status(403).json({ message: 'Restaurant is temporarily unavailable.' });
    }

    // Get Active Categories
    const categories = await Category.find({ restaurantId: restaurant._id, status: 'active' }).sort({ createdAt: 1 });
    const activeCategoryIds = categories.map(c => c._id);

    // Get Active Products in Active Categories
    const products = await Product.find({
      restaurantId: restaurant._id,
      categoryId: { $in: activeCategoryIds },
      status: 'active'
    }).sort({ createdAt: -1 });

    // Fetch alerts from Super Admin
    const alert = await Alert.findOne({ restaurantId: restaurant._id });

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
  } catch (error) {
    console.error('Get portal data error:', error);
    return res.status(500).json({ message: 'Server error loading QR Menu details' });
  }
};

// 2. Increment Visitors
export const incrementVisitors = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const restaurant = await Restaurant.findOneAndUpdate(
      { slug },
      { $inc: { visitorsCount: 1 } },
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    return res.status(200).json({ success: true, visitorsCount: restaurant.visitorsCount });
  } catch (error) {
    console.error('Increment visitors error:', error);
    return res.status(500).json({ message: 'Server error incrementing visitors' });
  }
};

// 3. Create Checkout Order
export const createCheckoutOrder = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { fullName, phone, tableNumber, items } = req.body;

    if (!fullName || !phone || !tableNumber || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Customer name, phone, table number and items are required' });
    }

    const restaurant = await Restaurant.findOne({ slug });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
    const isExpired = restaurant.paymentStatus !== 'completed' && new Date() > restaurant.subscriptionExpiryDate;
    if (restaurant.status === 'disabled' || (!isDev && isExpired)) {
      return res.status(403).json({ message: 'Restaurant is temporarily unavailable.' });
    }

    const calculatedItems = [];
    let subtotal = 0;

    for (const item of items) {
      const product = await Product.findOne({ _id: item.productId, restaurantId: restaurant._id });
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
      } else {
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

    const todayCount = await Order.countDocuments({
      restaurantId: restaurant._id,
      createdAt: { $gte: startOfToday }
    });

    let seq = todayCount + 1;
    let orderId = `ORD-${dateStr}-${String(seq).padStart(4, '0')}`;
    let exists = await Order.findOne({ orderId });
    while (exists) {
      seq += 1;
      orderId = `ORD-${dateStr}-${String(seq).padStart(4, '0')}`;
      exists = await Order.findOne({ orderId });
    }

    // Create Order Record
    const order = await Order.create({
      restaurantId: restaurant._id,
      orderId,
      fullName: fullName.trim(),
      phone: phone.trim(),
      tableNumber: tableNumber.trim(),
      items: calculatedItems,
      subtotal,
      vat: vatAmount,
      grandTotal,
      status: 'pending'
    });

    // Generate SMS Notice Log
    const smsMessage = `[${restaurant.name}] Order confirmed! ID: ${orderId}. Table: ${tableNumber}. Subtotal: $${subtotal.toFixed(2)}, VAT (${vatPercentage}%): $${vatAmount.toFixed(2)}, Total: $${grandTotal.toFixed(2)}.`;
    await SmsLog.create({
      mobile: phone.trim(),
      message: smsMessage
    });

    return res.status(201).json({
      message: 'Order created successfully',
      orderId,
      order
    });
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ message: 'Server error processing checkout' });
  }
};

// 4. Get Latest SMS Log (Public dev helper for checkout page Notice Box)
export const getLatestSmsLog = async (req: Request, res: Response) => {
  try {
    const log = await SmsLog.findOne().sort({ createdAt: -1 });
    return res.status(200).json(log ? [log] : []);
  } catch (error) {
    console.error('Get latest SMS error:', error);
    return res.status(500).json({ message: 'Server error fetching latest SMS log' });
  }
};
