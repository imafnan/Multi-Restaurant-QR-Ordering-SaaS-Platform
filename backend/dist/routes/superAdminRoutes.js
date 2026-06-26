"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_1 = require("../middlewares/authMiddleware");
const uploadMiddleware_1 = require("../middlewares/uploadMiddleware");
const superAdminController_1 = require("../controllers/superAdminController");
const router = (0, express_1.Router)();
// Public / Authenticated endpoints for Restaurant alerts
// A restaurant admin needs to fetch their own alerts, so we allow both roles
router.get('/alerts/:restaurantId', authMiddleware_1.authenticate, superAdminController_1.getRestaurantAlert);
// All other endpoints require super_admin role
router.use(authMiddleware_1.authenticate, (0, authMiddleware_1.requireRole)(['super_admin']));
// Dashboard Stats
router.get('/stats', superAdminController_1.getDashboardStats);
// Cost CRUD
router.get('/costs', superAdminController_1.getCosts);
router.post('/costs', superAdminController_1.addCost);
router.put('/costs/:id', superAdminController_1.updateCost);
router.delete('/costs/:id', superAdminController_1.deleteCost);
// Restaurants CRUD
router.get('/restaurants', superAdminController_1.getRestaurants);
router.post('/restaurants', uploadMiddleware_1.upload.fields([
    { name: 'registrationFormImage', maxCount: 1 },
    { name: 'tradeLicenseImage', maxCount: 1 },
]), superAdminController_1.createRestaurant);
router.get('/restaurants/:id', superAdminController_1.viewRestaurant);
router.put('/restaurants/:id/status', superAdminController_1.toggleRestaurantStatus);
router.delete('/restaurants/:id', superAdminController_1.deleteRestaurant);
// Payments
router.get('/payments', superAdminController_1.getPaymentsList);
router.put('/payments/:id/status', superAdminController_1.updatePaymentStatus);
// Alerts (Send, Delete)
router.post('/alerts', superAdminController_1.sendAlert);
router.delete('/alerts/:restaurantId', superAdminController_1.removeAlert);
// Settings & Branding
router.post('/settings/logo', uploadMiddleware_1.upload.single('logo'), superAdminController_1.uploadGlobalLogo);
router.get('/settings', superAdminController_1.getGlobalSettings);
router.post('/settings/admins', superAdminController_1.createSuperAdmin);
router.get('/settings/admins', superAdminController_1.listSuperAdmins);
router.delete('/settings/admins/:id', superAdminController_1.deleteSuperAdmin);
// SMS Simulator
router.post('/sms/send', superAdminController_1.sendManualSms);
router.get('/sms/logs', superAdminController_1.getSmsLogs);
router.delete('/sms/logs', superAdminController_1.clearSmsLogs);
exports.default = router;
