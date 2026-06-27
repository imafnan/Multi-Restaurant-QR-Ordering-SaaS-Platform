import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/uploadMiddleware';
import {
  getDashboardStats,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getSettings,
  updateSettings,
  getOrders,
  clearOrders,
  updateOrderStatus,
  getProductAnalysis,
  getMonthlyAnalytics,
} from '../controllers/restaurantController';

const router = Router();

// All restaurant admin routes require logging in and being a restaurant_admin
router.use(authenticate, requireRole(['restaurant_admin']));

// Stats
router.get('/stats', getDashboardStats);

// Categories
router.get('/categories', getCategories);
router.post('/categories', addCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

// Products
router.get('/products', getProducts);
router.post('/products', upload.array('images', 3), addProduct);
router.put('/products/:id', upload.array('images', 3), updateProduct);
router.delete('/products/:id', deleteProduct);

// Settings
router.get('/settings', getSettings);
router.put(
  '/settings',
  upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'banner', maxCount: 1 },
  ]),
  updateSettings
);

// Orders integration
router.get('/orders', getOrders);
router.delete('/orders', clearOrders);
router.put('/orders/:id/status', updateOrderStatus);

// Analytics
router.get('/analytics/products', getProductAnalysis);
router.get('/analytics/summary', getMonthlyAnalytics);

export default router;

