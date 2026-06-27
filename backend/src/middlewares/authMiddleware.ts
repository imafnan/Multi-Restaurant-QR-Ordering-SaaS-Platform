import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { Restaurant } from '../models/Restaurant';

export interface AuthRequest extends Request {
  user?: IUser;
  restaurantId?: string;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkeyforqrorderingsaas';

    const decoded = jwt.verify(token, jwtSecret) as { id: string; role: string };

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found or deleted' });
    }

    // Check if user is disabled
    if (user.status === 'disabled') {
      return res.status(403).json({ message: 'User account is disabled' });
    }

    // Check if restaurant is disabled or subscription expired (for restaurant admins)
    if (user.role === 'restaurant_admin' && user.restaurant) {
      const restaurant = await Restaurant.findById(user.restaurant);
      if (!restaurant) {
        return res.status(401).json({ message: 'Restaurant not found' });
      }
      if (restaurant.status === 'disabled') {
        return res.status(403).json({ message: 'Restaurant is deactivated by Super Admin' });
      }
      
      const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;
      const isExpired = restaurant.paymentStatus !== 'completed' && new Date() > restaurant.subscriptionExpiryDate;
      if (!isDev && isExpired) {
        return res.status(403).json({ message: 'Restaurant subscription has expired or is unpaid' });
      }
      req.restaurantId = restaurant.id;
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: Array<'super_admin' | 'restaurant_admin'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    next();
  };
};
