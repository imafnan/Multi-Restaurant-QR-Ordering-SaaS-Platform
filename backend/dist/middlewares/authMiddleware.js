"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const Restaurant_1 = require("../models/Restaurant");
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Authorization token required' });
        }
        const token = authHeader.split(' ')[1];
        const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtkeyforqrorderingsaas';
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const user = await User_1.User.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ message: 'User not found or deleted' });
        }
        // Check if user is disabled
        if (user.status === 'disabled') {
            return res.status(403).json({ message: 'User account is disabled' });
        }
        // Check if restaurant is disabled (for restaurant admins)
        if (user.role === 'restaurant_admin' && user.restaurant) {
            const restaurant = await Restaurant_1.Restaurant.findById(user.restaurant);
            if (!restaurant) {
                return res.status(401).json({ message: 'Restaurant not found' });
            }
            if (restaurant.status === 'disabled') {
                return res.status(403).json({ message: 'Restaurant is disabled' });
            }
            req.restaurantId = restaurant.id;
        }
        req.user = user;
        next();
    }
    catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};
exports.authenticate = authenticate;
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied: insufficient permissions' });
        }
        next();
    };
};
exports.requireRole = requireRole;
