import { Request, Response } from 'express';
import { Restaurant } from '../models/Restaurant';
import { User } from '../models/User';
import { Cost } from '../models/Cost';
import { Settings } from '../models/Settings';
import { Alert } from '../models/Alert';
import { Category } from '../models/Category';
import { Product } from '../models/Product';
import { Order } from '../models/Order';
import { SmsLog } from '../models/SmsLog';
import { smsService } from '../services/smsService';
import { storageService } from '../services/storageService';
import { slugify } from '../utils/slugify';

// -------------------------------------------------------------
// 1. Dashboard Statistics
// -------------------------------------------------------------
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const totalRestaurants = await Restaurant.countDocuments();

    // Total Profit = sum of subscriptionFee of all restaurants
    const profitSum = await Restaurant.aggregate([
      { $group: { _id: null, total: { $sum: '$subscriptionFee' } } }
    ]);
    const totalProfit = profitSum.length > 0 ? profitSum[0].total : 0;

    // Total Cost = sum of amount in Cost model
    const costsSum = await Cost.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalCost = costsSum.length > 0 ? costsSum[0].total : 0;

    // Net Profit = Total Profit - Total Cost
    const netProfit = totalProfit - totalCost;

    // Total Website Visitors = sum of visitorsCount in Restaurant model
    const visitorsSum = await Restaurant.aggregate([
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
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ message: 'Server error fetching stats' });
  }
};

// -------------------------------------------------------------
// 2. Cost Management
// -------------------------------------------------------------
export const addCost = async (req: Request, res: Response) => {
  try {
    const { name, amount, date } = req.body;
    if (!name || !amount) {
      return res.status(400).json({ message: 'Cost name and amount are required' });
    }

    const newCost = await Cost.create({
      name,
      amount: Number(amount),
      date: date ? new Date(date) : new Date(),
    });

    return res.status(201).json(newCost);
  } catch (error) {
    console.error('Add cost error:', error);
    return res.status(500).json({ message: 'Server error adding cost' });
  }
};

export const getCosts = async (req: Request, res: Response) => {
  try {
    const costs = await Cost.find().sort({ date: -1 });
    return res.status(200).json(costs);
  } catch (error) {
    console.error('Get costs error:', error);
    return res.status(500).json({ message: 'Server error fetching costs' });
  }
};

export const updateCost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, amount, date } = req.body;

    const cost = await Cost.findById(id);
    if (!cost) {
      return res.status(404).json({ message: 'Cost item not found' });
    }

    if (name) cost.name = name;
    if (amount !== undefined) cost.amount = Number(amount);
    if (date) cost.date = new Date(date);

    await cost.save();
    return res.status(200).json(cost);
  } catch (error) {
    console.error('Update cost error:', error);
    return res.status(500).json({ message: 'Server error updating cost' });
  }
};

export const deleteCost = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const cost = await Cost.findByIdAndDelete(id);
    if (!cost) {
      return res.status(404).json({ message: 'Cost item not found' });
    }
    return res.status(200).json({ message: 'Cost item deleted successfully' });
  } catch (error) {
    console.error('Delete cost error:', error);
    return res.status(500).json({ message: 'Server error deleting cost' });
  }
};

// -------------------------------------------------------------
// 3. User & Restaurant Management
// -------------------------------------------------------------
export const getRestaurants = async (req: Request, res: Response) => {
  try {
    const { search, status } = req.query;
    const query: any = {};

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
    const restaurants = await Restaurant.find(query).sort({ createdAt: -1 });

    const data = await Promise.all(
      restaurants.map(async (rest) => {
        const admin = await User.findOne({ restaurant: rest._id, role: 'restaurant_admin' });
        const alert = await Alert.findOne({ restaurantId: rest._id });
        return {
          ...rest.toObject(),
          adminMobile: admin ? admin.mobile : '',
          hasAlert: !!alert,
          alertMessage: alert ? alert.message : '',
        };
      })
    );

    return res.status(200).json(data);
  } catch (error) {
    console.error('Get restaurants error:', error);
    return res.status(500).json({ message: 'Server error fetching restaurants' });
  }
};

export const createRestaurant = async (req: Request, res: Response) => {
  try {
    const {
      name,
      mobile,
      email,
      location,
      subscriptionFee,
      adminMobile,
      adminPassword,
    } = req.body;

    if (!name || !mobile || !location || !subscriptionFee || !adminMobile || !adminPassword) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    // Slug generation
    const slug = slugify(name);

    // Unique checks
    const existingRestaurant = await Restaurant.findOne({ $or: [{ mobile }, { slug }] });
    if (existingRestaurant) {
      return res.status(400).json({ message: 'Restaurant name/slug or mobile already exists' });
    }

    const existingUser = await User.findOne({ mobile: adminMobile });
    if (existingUser) {
      return res.status(400).json({ message: 'Admin mobile number is already registered' });
    }

    // Upload Files
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    let registrationFormImage = '';
    let tradeLicenseImage = '';

    if (files) {
      if (files['registrationFormImage'] && files['registrationFormImage'][0]) {
        registrationFormImage = await storageService.uploadFile(files['registrationFormImage'][0]);
      }
      if (files['tradeLicenseImage'] && files['tradeLicenseImage'][0]) {
        tradeLicenseImage = await storageService.uploadFile(files['tradeLicenseImage'][0]);
      }
    }

    // Create Restaurant
    const newRestaurant = await Restaurant.create({
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
      subscriptionStatus: 'pending_payment',
      subscriptionExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days trial/grace period
    });

    // Create default category
    await Category.create({
      restaurantId: newRestaurant._id,
      name: 'Uncategorized',
      status: 'active'
    });

    // Create Restaurant Admin User
    await User.create({
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
  } catch (error: any) {
    console.error('Create restaurant error:', error);
    return res.status(500).json({ message: error.message || 'Server error creating restaurant' });
  }
};

export const viewRestaurant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const admin = await User.findOne({ restaurant: restaurant._id, role: 'restaurant_admin' });

    return res.status(200).json({
      ...restaurant.toObject(),
      adminMobile: admin ? admin.mobile : '',
    });
  } catch (error) {
    console.error('View restaurant error:', error);
    return res.status(500).json({ message: 'Server error fetching restaurant details' });
  }
};

export const toggleRestaurantStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'active' | 'disabled'

    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    restaurant.status = status;
    await restaurant.save();

    // Sync status with the restaurant admin users
    await User.updateMany({ restaurant: id }, { status });

    return res.status(200).json({
      message: `Restaurant has been ${status === 'active' ? 'enabled' : 'disabled'} successfully.`,
      restaurant,
    });
  } catch (error) {
    console.error('Toggle status error:', error);
    return res.status(500).json({ message: 'Server error updating restaurant status' });
  }
};

export const deleteRestaurant = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // 1. Delete Restaurant Files
    if (restaurant.registrationFormImage) {
      await storageService.deleteFile(restaurant.registrationFormImage);
    }
    if (restaurant.tradeLicenseImage) {
      await storageService.deleteFile(restaurant.tradeLicenseImage);
    }

    // 2. Find and Delete Product images
    const products = await Product.find({ restaurantId: id });
    for (const prod of products) {
      if (prod.image) {
        await storageService.deleteFile(prod.image);
      }
    }

    // 3. Delete database records
    await Product.deleteMany({ restaurantId: id });
    await Category.deleteMany({ restaurantId: id });
    await Order.deleteMany({ restaurantId: id });
    await User.deleteMany({ restaurant: id });
    await Alert.deleteMany({ restaurantId: id });
    await Restaurant.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Restaurant and all associated data permanently deleted.' });
  } catch (error) {
    console.error('Delete restaurant error:', error);
    return res.status(500).json({ message: 'Server error deleting restaurant' });
  }
};

// -------------------------------------------------------------
// 4. Payments
// -------------------------------------------------------------
export const getPaymentsList = async (req: Request, res: Response) => {
  try {
    const { search, paymentStatus } = req.query;
    const query: any = {};

    if (paymentStatus && ['pending', 'completed'].includes(paymentStatus as string)) {
      query.paymentStatus = paymentStatus;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
      ];
    }

    const restaurants = await Restaurant.find(query).sort({ createdAt: -1 });
    const data = await Promise.all(
      restaurants.map(async (rest) => {
        const alert = await Alert.findOne({ restaurantId: rest._id });
        return {
          ...rest.toObject(),
          hasAlert: !!alert,
          alertMessage: alert ? alert.message : '',
        };
      })
    );
    return res.status(200).json(data);
  } catch (error) {
    console.error('Get payments error:', error);
    return res.status(500).json({ message: 'Server error fetching payments list' });
  }
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { paymentMethod } = req.body;

    const allowedMethods = ['Cash', 'Bank', 'Bkash', 'Nagad', 'Rocket', 'Other'];
    if (!paymentMethod || !allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({ message: 'Valid payment method is required' });
    }

    const restaurant = await Restaurant.findById(id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    restaurant.paymentStatus = 'completed';
    restaurant.paymentMethod = paymentMethod;
    restaurant.paymentDate = new Date();
    restaurant.subscriptionStatus = 'active';
    restaurant.subscriptionExpiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Extended by 30 days
    await restaurant.save();

    return res.status(200).json({
      message: 'Payment completed successfully',
      restaurant,
    });
  } catch (error) {
    console.error('Update payment error:', error);
    return res.status(500).json({ message: 'Server error updating payment status' });
  }
};

// -------------------------------------------------------------
// 5. Alerts System
// -------------------------------------------------------------
export const sendAlert = async (req: Request, res: Response) => {
  try {
    const { restaurantId, message } = req.body;
    if (!restaurantId || !message) {
      return res.status(400).json({ message: 'Restaurant ID and message are required' });
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Check if an alert already exists for this restaurant, if so overwrite or create new.
    // The requirement: "After alert sent, Button changes into Already Sent. Click Again -> View Alert, Remove Alert."
    // So one alert per restaurant is fine. Let's delete existing and create new or update.
    await Alert.deleteMany({ restaurantId });
    const alert = await Alert.create({ restaurantId, message });

    return res.status(201).json({
      message: 'Alert sent successfully',
      alert,
    });
  } catch (error) {
    console.error('Send alert error:', error);
    return res.status(500).json({ message: 'Server error sending alert' });
  }
};

export const getRestaurantAlert = async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;
    const alert = await Alert.findOne({ restaurantId });
    return res.status(200).json(alert);
  } catch (error) {
    console.error('Get alert error:', error);
    return res.status(500).json({ message: 'Server error fetching alert' });
  }
};

export const removeAlert = async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;
    await Alert.deleteMany({ restaurantId });
    return res.status(200).json({ message: 'Alert removed successfully' });
  } catch (error) {
    console.error('Remove alert error:', error);
    return res.status(500).json({ message: 'Server error removing alert' });
  }
};

// -------------------------------------------------------------
// 6. Global Settings & Super Admins
// -------------------------------------------------------------
export const uploadGlobalLogo = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Logo file is required' });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    // If previous logo exists, delete it
    if (settings.globalLogo) {
      await storageService.deleteFile(settings.globalLogo);
    }

    const logoUrl = await storageService.uploadFile(req.file);
    settings.globalLogo = logoUrl;
    await settings.save();

    return res.status(200).json({
      message: 'Global logo uploaded successfully',
      globalLogo: logoUrl,
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    return res.status(500).json({ message: 'Server error uploading global logo' });
  }
};

export const getGlobalSettings = async (req: Request, res: Response) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({ globalLogo: '' });
    }
    return res.status(200).json(settings);
  } catch (error) {
    console.error('Get settings error:', error);
    return res.status(500).json({ message: 'Server error fetching global settings' });
  }
};

export const createSuperAdmin = async (req: Request, res: Response) => {
  try {
    const { mobile, password } = req.body;
    if (!mobile || !password) {
      return res.status(400).json({ message: 'Mobile and password are required' });
    }

    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return res.status(400).json({ message: 'Mobile number is already registered' });
    }

    const newAdmin = await User.create({
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
  } catch (error) {
    console.error('Create admin error:', error);
    return res.status(500).json({ message: 'Server error creating Super Admin login' });
  }
};

export const listSuperAdmins = async (req: Request, res: Response) => {
  try {
    const admins = await User.find({ role: 'super_admin' })
      .select('mobile createdAt')
      .sort({ createdAt: -1 });
    return res.status(200).json(admins);
  } catch (error) {
    console.error('List admins error:', error);
    return res.status(500).json({ message: 'Server error fetching Super Admins' });
  }
};

export const deleteSuperAdmin = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Check that we aren't deleting the last super admin
    const superAdminCount = await User.countDocuments({ role: 'super_admin' });
    if (superAdminCount <= 1) {
      return res.status(400).json({ message: 'Cannot delete the only Super Admin login.' });
    }

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: 'Super Admin not found' });
    }

    return res.status(200).json({ message: 'Super Admin login deleted successfully' });
  } catch (error) {
    console.error('Delete admin error:', error);
    return res.status(500).json({ message: 'Server error deleting Super Admin' });
  }
};

// -------------------------------------------------------------
// 7. SMS Logs & Simulated Sender
// -------------------------------------------------------------
export const sendManualSms = async (req: Request, res: Response) => {
  try {
    const { mobile, message } = req.body;
    if (!mobile || !message) {
      return res.status(400).json({ message: 'Mobile number and message are required' });
    }

    await smsService.sendCustomSms(mobile, message);

    return res.status(200).json({ message: 'Simulated SMS triggered. Check logs.' });
  } catch (error) {
    console.error('Send manual SMS error:', error);
    return res.status(500).json({ message: 'Server error sending SMS' });
  }
};

export const getSmsLogs = async (req: Request, res: Response) => {
  try {
    // Get latest 50 SMS logs for preview box
    const logs = await SmsLog.find().sort({ createdAt: -1 }).limit(50);
    return res.status(200).json(logs);
  } catch (error) {
    console.error('Get SMS logs error:', error);
    return res.status(500).json({ message: 'Server error fetching SMS logs' });
  }
};

export const clearSmsLogs = async (req: Request, res: Response) => {
  try {
    await SmsLog.deleteMany({});
    return res.status(200).json({ message: 'SMS logs cleared' });
  } catch (error) {
    console.error('Clear SMS logs error:', error);
    return res.status(500).json({ message: 'Server error clearing SMS logs' });
  }
};
