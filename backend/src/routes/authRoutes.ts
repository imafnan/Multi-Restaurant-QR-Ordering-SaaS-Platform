import { Router } from 'express';
import { login, requestResetOtp, verifyResetOtp, resetPassword, getRestaurantBySlug } from '../controllers/authController';
import { getPortalData, incrementVisitors, createCheckoutOrder, getLatestSmsLog } from '../controllers/portalController';

const router = Router();

router.post('/login', login);
router.post('/request-otp', requestResetOtp);
router.post('/verify-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);
router.get('/restaurant/:slug', getRestaurantBySlug);

// Portal QR Menu public routes
router.get('/restaurant/:slug/portal', getPortalData);
router.post('/restaurant/:slug/visit', incrementVisitors);
router.post('/restaurant/:slug/checkout', createCheckoutOrder);
router.get('/sms/latest', getLatestSmsLog);

export default router;

