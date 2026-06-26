import { Router } from 'express';
import { authenticate, requireRole } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/uploadMiddleware';
import {
  getDashboardStats,
  addCost,
  getCosts,
  updateCost,
  deleteCost,
  getRestaurants,
  createRestaurant,
  viewRestaurant,
  toggleRestaurantStatus,
  deleteRestaurant,
  getPaymentsList,
  updatePaymentStatus,
  sendAlert,
  getRestaurantAlert,
  removeAlert,
  uploadGlobalLogo,
  getGlobalSettings,
  createSuperAdmin,
  listSuperAdmins,
  deleteSuperAdmin,
  sendManualSms,
  getSmsLogs,
  clearSmsLogs,
} from '../controllers/superAdminController';

const router = Router();

// Public / Authenticated endpoints for Restaurant alerts
// A restaurant admin needs to fetch their own alerts, so we allow both roles
router.get('/alerts/:restaurantId', authenticate, getRestaurantAlert);

// All other endpoints require super_admin role
router.use(authenticate, requireRole(['super_admin']));

// Dashboard Stats
router.get('/stats', getDashboardStats);

// Cost CRUD
router.get('/costs', getCosts);
router.post('/costs', addCost);
router.put('/costs/:id', updateCost);
router.delete('/costs/:id', deleteCost);

// Restaurants CRUD
router.get('/restaurants', getRestaurants);
router.post(
  '/restaurants',
  upload.fields([
    { name: 'registrationFormImage', maxCount: 1 },
    { name: 'tradeLicenseImage', maxCount: 1 },
  ]),
  createRestaurant
);
router.get('/restaurants/:id', viewRestaurant);
router.put('/restaurants/:id/status', toggleRestaurantStatus);
router.delete('/restaurants/:id', deleteRestaurant);

// Payments
router.get('/payments', getPaymentsList);
router.put('/payments/:id/status', updatePaymentStatus);

// Alerts (Send, Delete)
router.post('/alerts', sendAlert);
router.delete('/alerts/:restaurantId', removeAlert);

// Settings & Branding
router.post('/settings/logo', upload.single('logo'), uploadGlobalLogo);
router.get('/settings', getGlobalSettings);
router.post('/settings/admins', createSuperAdmin);
router.get('/settings/admins', listSuperAdmins);
router.delete('/settings/admins/:id', deleteSuperAdmin);

// SMS Simulator
router.post('/sms/send', sendManualSms);
router.get('/sms/logs', getSmsLogs);
router.delete('/sms/logs', clearSmsLogs);

export default router;
