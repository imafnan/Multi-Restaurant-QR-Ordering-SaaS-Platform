import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Restaurant } from '../models/Restaurant';
import { smsService } from '../services/smsService';

export const login = async (req: Request, res: Response) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({ message: 'Mobile number and password are required' });
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return res.status(401).json({ message: 'Invalid mobile number or password' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ message: 'Your user account is disabled' });
    }

    // If Restaurant Admin, check if restaurant exists and is active
    if (user.role === 'restaurant_admin') {
      if (!user.restaurant) {
        return res.status(403).json({ message: 'Restaurant association missing' });
      }
      const restaurant = await Restaurant.findById(user.restaurant);
      if (!restaurant) {
        return res.status(404).json({ message: 'Restaurant not found' });
      }
      if (restaurant.status === 'disabled') {
        return res.status(403).json({ message: 'Your restaurant is disabled. Dashboard is inaccessible.' });
      }
      const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
      const isExpired = restaurant.paymentStatus !== 'completed' && new Date() > restaurant.subscriptionExpiryDate;
      if (!isDev && isExpired) {
        return res.status(403).json({ message: 'Restaurant subscription has expired or is unpaid' });
      }
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid mobile number or password' });
    }

    // Sign JWT
    const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkeyforqrorderingsaas';
    const token = jwt.sign(
      { id: user.id, role: user.role },
      jwtSecret,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any }
    );

    // If Restaurant Admin, find restaurant details to return
    let restaurantSlug = '';
    if (user.role === 'restaurant_admin' && user.restaurant) {
      const restaurant = await Restaurant.findById(user.restaurant);
      restaurantSlug = restaurant ? restaurant.slug : '';
    }

    return res.status(200).json({
      token,
      user: {
        id: user.id,
        name: user.name,
        mobile: user.mobile,
        role: user.role,
        restaurant: user.restaurant,
        restaurantSlug,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
};

// Get Restaurant by Slug (Public status check)
export const getRestaurantBySlug = async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const restaurant = await Restaurant.findOne({ slug });
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (restaurant.status === 'disabled') {
      return res.status(403).json({ message: 'This restaurant is currently disabled.' });
    }

    return res.status(200).json({
      id: restaurant._id,
      name: restaurant.name,
      slug: restaurant.slug,
      location: restaurant.location,
      status: restaurant.status,
    });
  } catch (error) {
    console.error('Get restaurant by slug error:', error);
    return res.status(500).json({ message: 'Server error fetching restaurant details' });
  }
};

// Forgot password - Step 1: Send OTP
export const requestResetOtp = async (req: Request, res: Response) => {
  try {
    const { mobile } = req.body;
    if (!mobile) {
      return res.status(400).json({ message: 'Mobile number is required' });
    }

    const user = await User.findOne({ mobile, role: 'restaurant_admin' });
    if (!user) {
      return res.status(404).json({ message: 'Restaurant Admin with this mobile number does not exist' });
    }

    if (user.status === 'disabled') {
      return res.status(403).json({ message: 'Your account is disabled' });
    }

    // Generate 4-digit OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiration

    user.otpCode = otp;
    user.otpExpiresAt = expires;
    await user.save();

    // Trigger SMS
    await smsService.sendPasswordResetOtp(mobile, otp);

    return res.status(200).json({
      message: 'OTP has been generated. In development, check the notification box.',
      mobile,
    });
  } catch (error) {
    console.error('Request OTP error:', error);
    return res.status(500).json({ message: 'Server error generating OTP' });
  }
};

// Forgot password - Step 2: Verify OTP
export const verifyResetOtp = async (req: Request, res: Response) => {
  try {
    const { mobile, otp } = req.body;
    if (!mobile || !otp) {
      return res.status(400).json({ message: 'Mobile number and OTP are required' });
    }

    const user = await User.findOne({
      mobile,
      role: 'restaurant_admin',
      otpCode: otp,
      otpExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    return res.status(200).json({ message: 'OTP verified successfully', verified: true });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ message: 'Server error verifying OTP' });
  }
};

// Forgot password - Step 3: Reset Password
export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { mobile, otp, newPassword } = req.body;
    if (!mobile || !otp || !newPassword) {
      return res.status(400).json({ message: 'Mobile number, OTP, and new password are required' });
    }

    const user = await User.findOne({
      mobile,
      role: 'restaurant_admin',
      otpCode: otp,
      otpExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired OTP session' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    user.password = newPassword;
    user.otpCode = undefined;
    user.otpExpiresAt = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password reset successful. You can log in now.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error resetting password' });
  }
};
