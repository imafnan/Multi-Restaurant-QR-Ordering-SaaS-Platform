import { Router } from 'express';
import { login, requestResetOtp, verifyResetOtp, resetPassword, getRestaurantBySlug } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/request-otp', requestResetOtp);
router.post('/verify-otp', verifyResetOtp);
router.post('/reset-password', resetPassword);
router.get('/restaurant/:slug', getRestaurantBySlug);

export default router;
