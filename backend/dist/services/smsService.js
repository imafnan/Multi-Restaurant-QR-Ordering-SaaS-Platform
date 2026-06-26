"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smsService = exports.ProductionSmsProvider = exports.DevelopmentSmsProvider = void 0;
const SmsLog_1 = require("../models/SmsLog");
// Development provider logging SMS to MongoDB
class DevelopmentSmsProvider {
    async sendSms(mobile, message) {
        try {
            console.log(`[SMS Simulator] To: ${mobile} - Msg: ${message}`);
            await SmsLog_1.SmsLog.create({ mobile, message });
            return true;
        }
        catch (error) {
            console.error('Failed to log SMS:', error);
            return false;
        }
    }
}
exports.DevelopmentSmsProvider = DevelopmentSmsProvider;
// Future Production SMS Gateway provider
class ProductionSmsProvider {
    async sendSms(mobile, message) {
        // Integrate Twilio, Nexmo, or local operator here.
        // Replace API URL and credentials here only.
        throw new Error('ProductionSmsProvider not implemented yet');
    }
}
exports.ProductionSmsProvider = ProductionSmsProvider;
// Active SMS Service
class SmsService {
    constructor() {
        // Switch between DevelopmentSmsProvider and ProductionSmsProvider
        this.provider = new DevelopmentSmsProvider();
    }
    async sendOtp(mobile, otp) {
        const message = `Your QR Ordering platform OTP is: ${otp}. Valid for 5 minutes.`;
        return this.provider.sendSms(mobile, message);
    }
    async sendPasswordResetOtp(mobile, otp) {
        const message = `Your password reset OTP is: ${otp}. Valid for 5 minutes.`;
        return this.provider.sendSms(mobile, message);
    }
    async sendCustomSms(mobile, message) {
        return this.provider.sendSms(mobile, message);
    }
}
exports.smsService = new SmsService();
