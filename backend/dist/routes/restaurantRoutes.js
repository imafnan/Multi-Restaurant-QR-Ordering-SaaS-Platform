"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware");
const restaurantController_1 = require("../controllers/restaurantController");
const router = (0, express_1.Router)();
// All restaurant admin routes require logging in and being a restaurant_admin
router.use(authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(['restaurant_admin']));
// Stats
router.get('/stats', restaurantController_1.getDashboardStats);
// Categories
router.get('/categories', restaurantController_1.getCategories);
router.post('/categories', restaurantController_1.addCategory);
router.put('/categories/:id', restaurantController_1.updateCategory);
router.delete('/categories/:id', restaurantController_1.deleteCategory);
// Products
router.get('/products', restaurantController_1.getProducts);
router.post('/products', uploadMiddleware_1.upload.array('images', 3), restaurantController_1.addProduct);
router.put('/products/:id', uploadMiddleware_1.upload.array('images', 3), restaurantController_1.updateProduct);
router.delete('/products/:id', restaurantController_1.deleteProduct);
// Settings
router.get('/settings', restaurantController_1.getSettings);
router.put('/settings', uploadMiddleware_1.upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
]), restaurantController_1.updateSettings);
// Orders integration
router.get('/orders', restaurantController_1.getOrders);
router.delete('/orders', restaurantController_1.clearOrders);
router.put('/orders/:id/status', restaurantController_1.updateOrderStatus);
// Analytics
router.get('/analytics/products', restaurantController_1.getProductAnalysis);
router.get('/analytics/summary', restaurantController_1.getMonthlyAnalytics);
exports.default = router;
