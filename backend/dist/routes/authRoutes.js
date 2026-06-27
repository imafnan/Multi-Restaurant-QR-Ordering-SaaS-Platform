"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const portalController_1 = require("../controllers/portalController");
const router = (0, express_1.Router)();
router.post('/login', authController_1.login);
router.post('/request-otp', authController_1.requestResetOtp);
router.post('/verify-otp', authController_1.verifyResetOtp);
router.post('/reset-password', authController_1.resetPassword);
router.get('/restaurant/:slug', authController_1.getRestaurantBySlug);
// Portal QR Menu public routes
router.get('/restaurant/:slug/portal', portalController_1.getPortalData);
router.post('/restaurant/:slug/visit', portalController_1.incrementVisitors);
router.post('/restaurant/:slug/checkout', portalController_1.createCheckoutOrder);
router.get('/sms/latest', portalController_1.getLatestSmsLog);
exports.default = router;
