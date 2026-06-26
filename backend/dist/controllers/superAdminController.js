"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearSmsLogs = exports.getSmsLogs = exports.sendManualSms = exports.deleteSuperAdmin = exports.listSuperAdmins = exports.createSuperAdmin = exports.getGlobalSettings = exports.uploadGlobalLogo = exports.removeAlert = exports.getRestaurantAlert = exports.sendAlert = exports.updatePaymentStatus = exports.getPaymentsList = exports.deleteRestaurant = exports.toggleRestaurantStatus = exports.viewRestaurant = exports.createRestaurant = exports.getRestaurants = exports.deleteCost = exports.updateCost = exports.getCosts = exports.addCost = exports.getDashboardStats = void 0;
const Restaurant_1 = require("../models/Restaurant");
const User_1 = require("../models/User");
const Cost_1 = require("../models/Cost");
const Settings_1 = require("../models/Settings");
const Alert_1 = require("../models/Alert");
const Category_1 = require("../models/Category");
const Product_1 = require("../models/Product");
const Order_1 = require("../models/Order");
const SmsLog_1 = require("../models/SmsLog");
const smsService_1 = require("../services/smsService");
const storageService_1 = require("../services/storageService");
const slugify_1 = require("../utils/slugify");
// -------------------------------------------------------------
// 1. Dashboard Statistics
// -------------------------------------------------------------
const getDashboardStats = async (req, res) => {
    try {
        const totalRestaurants = await Restaurant_1.Restaurant.countDocuments();
        // Total Profit = sum of subscriptionFee of all restaurants
        const profitSum = await Restaurant_1.Restaurant.aggregate([
            { $group: { _id: null, total: { $sum: '$subscriptionFee' } } }
        ]);
        const totalProfit = profitSum.length > 0 ? profitSum[0].total : 0;
        // Total Cost = sum of amount in Cost model
        const costsSum = await Cost_1.Cost.aggregate([
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        const totalCost = costsSum.length > 0 ? costsSum[0].total : 0;
        // Net Profit = Total Profit - Total Cost
        const netProfit = totalProfit - totalCost;
        // Total Website Visitors = sum of visitorsCount in Restaurant model
        const visitorsSum = await Restaurant_1.Restaurant.aggregate([
            { $group: { _id: null, total: { $sum: '$visitorsCount' } } }
        ]);
        const totalVisitors = visitorsSum.length > 0 ? visitorsSum[0].total : 0;
        return res.status(200).json({
            totalRestaurants,
            totalProfit,
            totalCost,
            netProfit,
            totalVisitors
        });
    }
    catch (error) {
        console.error('Stats error:', error);
        return res.status(500).json({ message: 'Server error fetching stats' });
    }
};
exports.getDashboardStats = getDashboardStats;
// -------------------------------------------------------------
// 2. Cost Management
// -------------------------------------------------------------
const addCost = async (req, res) => {
    try {
        const { name, amount, date } = req.body;
        if (!name || !amount) {
            return res.status(400).json({ message: 'Cost name and amount are required' });
        }
        const newCost = await Cost_1.Cost.create({
            name,
            amount: Number(amount),
            date: date ? new Date(date) : new Date(),
        });
        return res.status(201).json(newCost);
    }
    catch (error) {
        console.error('Add cost error:', error);
        return res.status(500).json({ message: 'Server error adding cost' });
    }
};
exports.addCost = addCost;
const getCosts = async (req, res) => {
    try {
        const costs = await Cost_1.Cost.find().sort({ date: -1 });
        return res.status(200).json(costs);
    }
    catch (error) {
        console.error('Get costs error:', error);
        return res.status(500).json({ message: 'Server error fetching costs' });
    }
};
exports.getCosts = getCosts;
const updateCost = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, amount, date } = req.body;
        const cost = await Cost_1.Cost.findById(id);
        if (!cost) {
            return res.status(404).json({ message: 'Cost item not found' });
        }
        if (name)
            cost.name = name;
        if (amount !== undefined)
            cost.amount = Number(amount);
        if (date)
            cost.date = new Date(date);
        await cost.save();
        return res.status(200).json(cost);
    }
    catch (error) {
        console.error('Update cost error:', error);
        return res.status(500).json({ message: 'Server error updating cost' });
    }
};
exports.updateCost = updateCost;
const deleteCost = async (req, res) => {
    try {
        const { id } = req.params;
        const cost = await Cost_1.Cost.findByIdAndDelete(id);
        if (!cost) {
            return res.status(404).json({ message: 'Cost item not found' });
        }
        return res.status(200).json({ message: 'Cost item deleted successfully' });
    }
    catch (error) {
        console.error('Delete cost error:', error);
        return res.status(500).json({ message: 'Server error deleting cost' });
    }
};
exports.deleteCost = deleteCost;
// -------------------------------------------------------------
// 3. User & Restaurant Management
// -------------------------------------------------------------
const getRestaurants = async (req, res) => {
    try {
        const { search, status } = req.query;
        const query = {};
        if (status && (status === 'active' || status === 'disabled')) {
            query.status = status;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } },
            ];
        }
        // Retrieve restaurants with admin details populated
        const restaurants = await Restaurant_1.Restaurant.find(query).sort({ createdAt: -1 });
        const data = await Promise.all(restaurants.map(async (rest) => {
            const admin = await User_1.User.findOne({ restaurant: rest._id, role: 'restaurant_admin' });
            const alert = await Alert_1.Alert.findOne({ restaurantId: rest._id });
            return {
                ...rest.toObject(),
                adminMobile: admin ? admin.mobile : '',
                hasAlert: !!alert,
                alertMessage: alert ? alert.message : '',
            };
        }));
        return res.status(200).json(data);
    }
    catch (error) {
        console.error('Get restaurants error:', error);
        return res.status(500).json({ message: 'Server error fetching restaurants' });
    }
};
exports.getRestaurants = getRestaurants;
const createRestaurant = async (req, res) => {
    try {
        const { name, mobile, email, location, subscriptionFee, adminMobile, adminPassword, } = req.body;
        if (!name || !mobile || !location || !subscriptionFee || !adminMobile || !adminPassword) {
            return res.status(400).json({ message: 'All required fields must be provided' });
        }
        // Slug generation
        const slug = (0, slugify_1.slugify)(name);
        // Unique checks
        const existingRestaurant = await Restaurant_1.Restaurant.findOne({ $or: [{ mobile }, { slug }] });
        if (existingRestaurant) {
            return res.status(400).json({ message: 'Restaurant name/slug or mobile already exists' });
        }
        const existingUser = await User_1.User.findOne({ mobile: adminMobile });
        if (existingUser) {
            return res.status(400).json({ message: 'Admin mobile number is already registered' });
        }
        // Upload Files
        const files = req.files;
        let registrationFormImage = '';
        let tradeLicenseImage = '';
        if (files) {
            if (files['registrationFormImage'] && files['registrationFormImage'][0]) {
                registrationFormImage = await storageService_1.storageService.uploadFile(files['registrationFormImage'][0]);
            }
            if (files['tradeLicenseImage'] && files['tradeLicenseImage'][0]) {
                tradeLicenseImage = await storageService_1.storageService.uploadFile(files['tradeLicenseImage'][0]);
            }
        }
        // Create Restaurant
        const newRestaurant = await Restaurant_1.Restaurant.create({
            name,
            slug,
            mobile,
            email,
            location,
            subscriptionFee: Number(subscriptionFee),
            registrationFormImage,
            tradeLicenseImage,
            status: 'active',
            paymentStatus: 'pending',
        });
        // Create Restaurant Admin User
        await User_1.User.create({
            name: `${name} Admin`,
            mobile: adminMobile,
            password: adminPassword,
            role: 'restaurant_admin',
            restaurant: newRestaurant._id,
            status: 'active',
        });
        return res.status(201).json({
            message: 'Restaurant created successfully',
            restaurant: newRestaurant,
        });
    }
    catch (error) {
        console.error('Create restaurant error:', error);
        return res.status(500).json({ message: error.message || 'Server error creating restaurant' });
    }
};
exports.createRestaurant = createRestaurant;
const viewRestaurant = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant_1.Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        const admin = await User_1.User.findOne({ restaurant: restaurant._id, role: 'restaurant_admin' });
        return res.status(200).json({
            ...restaurant.toObject(),
            adminMobile: admin ? admin.mobile : '',
        });
    }
    catch (error) {
        console.error('View restaurant error:', error);
        return res.status(500).json({ message: 'Server error fetching restaurant details' });
    }
};
exports.viewRestaurant = viewRestaurant;
const toggleRestaurantStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // 'active' | 'disabled'
        if (!['active', 'disabled'].includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }
        const restaurant = await Restaurant_1.Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        restaurant.status = status;
        await restaurant.save();
        // Sync status with the restaurant admin users
        await User_1.User.updateMany({ restaurant: id }, { status });
        return res.status(200).json({
            message: `Restaurant has been ${status === 'active' ? 'enabled' : 'disabled'} successfully.`,
            restaurant,
        });
    }
    catch (error) {
        console.error('Toggle status error:', error);
        return res.status(500).json({ message: 'Server error updating restaurant status' });
    }
};
exports.toggleRestaurantStatus = toggleRestaurantStatus;
const deleteRestaurant = async (req, res) => {
    try {
        const { id } = req.params;
        const restaurant = await Restaurant_1.Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        // 1. Delete Restaurant Files
        if (restaurant.registrationFormImage) {
            await storageService_1.storageService.deleteFile(restaurant.registrationFormImage);
        }
        if (restaurant.tradeLicenseImage) {
            await storageService_1.storageService.deleteFile(restaurant.tradeLicenseImage);
        }
        // 2. Find and Delete Product images
        const products = await Product_1.Product.find({ restaurantId: id });
        for (const prod of products) {
            if (prod.image) {
                await storageService_1.storageService.deleteFile(prod.image);
            }
        }
        // 3. Delete database records
        await Product_1.Product.deleteMany({ restaurantId: id });
        await Category_1.Category.deleteMany({ restaurantId: id });
        await Order_1.Order.deleteMany({ restaurantId: id });
        await User_1.User.deleteMany({ restaurant: id });
        await Alert_1.Alert.deleteMany({ restaurantId: id });
        await Restaurant_1.Restaurant.findByIdAndDelete(id);
        return res.status(200).json({ message: 'Restaurant and all associated data permanently deleted.' });
    }
    catch (error) {
        console.error('Delete restaurant error:', error);
        return res.status(500).json({ message: 'Server error deleting restaurant' });
    }
};
exports.deleteRestaurant = deleteRestaurant;
// -------------------------------------------------------------
// 4. Payments
// -------------------------------------------------------------
const getPaymentsList = async (req, res) => {
    try {
        const { search, paymentStatus } = req.query;
        const query = {};
        if (paymentStatus && ['pending', 'completed'].includes(paymentStatus)) {
            query.paymentStatus = paymentStatus;
        }
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { mobile: { $regex: search, $options: 'i' } },
            ];
        }
        const restaurants = await Restaurant_1.Restaurant.find(query).sort({ createdAt: -1 });
        const data = await Promise.all(restaurants.map(async (rest) => {
            const alert = await Alert_1.Alert.findOne({ restaurantId: rest._id });
            return {
                ...rest.toObject(),
                hasAlert: !!alert,
                alertMessage: alert ? alert.message : '',
            };
        }));
        return res.status(200).json(data);
    }
    catch (error) {
        console.error('Get payments error:', error);
        return res.status(500).json({ message: 'Server error fetching payments list' });
    }
};
exports.getPaymentsList = getPaymentsList;
const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { paymentMethod } = req.body;
        const allowedMethods = ['Cash', 'Bank', 'Bkash', 'Nagad', 'Rocket', 'Other'];
        if (!paymentMethod || !allowedMethods.includes(paymentMethod)) {
            return res.status(400).json({ message: 'Valid payment method is required' });
        }
        const restaurant = await Restaurant_1.Restaurant.findById(id);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        restaurant.paymentStatus = 'completed';
        restaurant.paymentMethod = paymentMethod;
        restaurant.paymentDate = new Date();
        await restaurant.save();
        return res.status(200).json({
            message: 'Payment completed successfully',
            restaurant,
        });
    }
    catch (error) {
        console.error('Update payment error:', error);
        return res.status(500).json({ message: 'Server error updating payment status' });
    }
};
exports.updatePaymentStatus = updatePaymentStatus;
// -------------------------------------------------------------
// 5. Alerts System
// -------------------------------------------------------------
const sendAlert = async (req, res) => {
    try {
        const { restaurantId, message } = req.body;
        if (!restaurantId || !message) {
            return res.status(400).json({ message: 'Restaurant ID and message are required' });
        }
        const restaurant = await Restaurant_1.Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }
        // Check if an alert already exists for this restaurant, if so overwrite or create new.
        // The requirement: "After alert sent, Button changes into Already Sent. Click Again -> View Alert, Remove Alert."
        // So one alert per restaurant is fine. Let's delete existing and create new or update.
        await Alert_1.Alert.deleteMany({ restaurantId });
        const alert = await Alert_1.Alert.create({ restaurantId, message });
        return res.status(201).json({
            message: 'Alert sent successfully',
            alert,
        });
    }
    catch (error) {
        console.error('Send alert error:', error);
        return res.status(500).json({ message: 'Server error sending alert' });
    }
};
exports.sendAlert = sendAlert;
const getRestaurantAlert = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const alert = await Alert_1.Alert.findOne({ restaurantId });
        return res.status(200).json(alert);
    }
    catch (error) {
        console.error('Get alert error:', error);
        return res.status(500).json({ message: 'Server error fetching alert' });
    }
};
exports.getRestaurantAlert = getRestaurantAlert;
const removeAlert = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        await Alert_1.Alert.deleteMany({ restaurantId });
        return res.status(200).json({ message: 'Alert removed successfully' });
    }
    catch (error) {
        console.error('Remove alert error:', error);
        return res.status(500).json({ message: 'Server error removing alert' });
    }
};
exports.removeAlert = removeAlert;
// -------------------------------------------------------------
// 6. Global Settings & Super Admins
// -------------------------------------------------------------
const uploadGlobalLogo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Logo file is required' });
        }
        let settings = await Settings_1.Settings.findOne();
        if (!settings) {
            settings = new Settings_1.Settings();
        }
        // If previous logo exists, delete it
        if (settings.globalLogo) {
            await storageService_1.storageService.deleteFile(settings.globalLogo);
        }
        const logoUrl = await storageService_1.storageService.uploadFile(req.file);
        settings.globalLogo = logoUrl;
        await settings.save();
        return res.status(200).json({
            message: 'Global logo uploaded successfully',
            globalLogo: logoUrl,
        });
    }
    catch (error) {
        console.error('Upload logo error:', error);
        return res.status(500).json({ message: 'Server error uploading global logo' });
    }
};
exports.uploadGlobalLogo = uploadGlobalLogo;
const getGlobalSettings = async (req, res) => {
    try {
        let settings = await Settings_1.Settings.findOne();
        if (!settings) {
            settings = await Settings_1.Settings.create({ globalLogo: '' });
        }
        return res.status(200).json(settings);
    }
    catch (error) {
        console.error('Get settings error:', error);
        return res.status(500).json({ message: 'Server error fetching global settings' });
    }
};
exports.getGlobalSettings = getGlobalSettings;
const createSuperAdmin = async (req, res) => {
    try {
        const { mobile, password } = req.body;
        if (!mobile || !password) {
            return res.status(400).json({ message: 'Mobile and password are required' });
        }
        const existingUser = await User_1.User.findOne({ mobile });
        if (existingUser) {
            return res.status(400).json({ message: 'Mobile number is already registered' });
        }
        const newAdmin = await User_1.User.create({
            name: 'Super Admin',
            mobile,
            password,
            role: 'super_admin',
            status: 'active',
        });
        return res.status(201).json({
            message: 'Super Admin created successfully',
            admin: {
                id: newAdmin._id,
                mobile: newAdmin.mobile,
                createdAt: newAdmin.createdAt,
            },
        });
    }
    catch (error) {
        console.error('Create admin error:', error);
        return res.status(500).json({ message: 'Server error creating Super Admin login' });
    }
};
exports.createSuperAdmin = createSuperAdmin;
const listSuperAdmins = async (req, res) => {
    try {
        const admins = await User_1.User.find({ role: 'super_admin' })
            .select('mobile createdAt')
            .sort({ createdAt: -1 });
        return res.status(200).json(admins);
    }
    catch (error) {
        console.error('List admins error:', error);
        return res.status(500).json({ message: 'Server error fetching Super Admins' });
    }
};
exports.listSuperAdmins = listSuperAdmins;
const deleteSuperAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        // Check that we aren't deleting the last super admin
        const superAdminCount = await User_1.User.countDocuments({ role: 'super_admin' });
        if (superAdminCount <= 1) {
            return res.status(400).json({ message: 'Cannot delete the only Super Admin login.' });
        }
        const deleted = await User_1.User.findByIdAndDelete(id);
        if (!deleted) {
            return res.status(404).json({ message: 'Super Admin not found' });
        }
        return res.status(200).json({ message: 'Super Admin login deleted successfully' });
    }
    catch (error) {
        console.error('Delete admin error:', error);
        return res.status(500).json({ message: 'Server error deleting Super Admin' });
    }
};
exports.deleteSuperAdmin = deleteSuperAdmin;
// -------------------------------------------------------------
// 7. SMS Logs & Simulated Sender
// -------------------------------------------------------------
const sendManualSms = async (req, res) => {
    try {
        const { mobile, message } = req.body;
        if (!mobile || !message) {
            return res.status(400).json({ message: 'Mobile number and message are required' });
        }
        await smsService_1.smsService.sendCustomSms(mobile, message);
        return res.status(200).json({ message: 'Simulated SMS triggered. Check logs.' });
    }
    catch (error) {
        console.error('Send manual SMS error:', error);
        return res.status(500).json({ message: 'Server error sending SMS' });
    }
};
exports.sendManualSms = sendManualSms;
const getSmsLogs = async (req, res) => {
    try {
        // Get latest 50 SMS logs for preview box
        const logs = await SmsLog_1.SmsLog.find().sort({ createdAt: -1 }).limit(50);
        return res.status(200).json(logs);
    }
    catch (error) {
        console.error('Get SMS logs error:', error);
        return res.status(500).json({ message: 'Server error fetching SMS logs' });
    }
};
exports.getSmsLogs = getSmsLogs;
const clearSmsLogs = async (req, res) => {
    try {
        await SmsLog_1.SmsLog.deleteMany({});
        return res.status(200).json({ message: 'SMS logs cleared' });
    }
    catch (error) {
        console.error('Clear SMS logs error:', error);
        return res.status(500).json({ message: 'Server error clearing SMS logs' });
    }
};
exports.clearSmsLogs = clearSmsLogs;
