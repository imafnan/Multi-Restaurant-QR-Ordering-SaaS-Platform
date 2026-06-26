import { SmsLog } from '../models/SmsLog';

export interface ISmsProvider {
  sendSms(mobile: string, message: string): Promise<boolean>;
}

// Development provider logging SMS to MongoDB
export class DevelopmentSmsProvider implements ISmsProvider {
  async sendSms(mobile: string, message: string): Promise<boolean> {
    try {
      console.log(`[SMS Simulator] To: ${mobile} - Msg: ${message}`);
      await SmsLog.create({ mobile, message });
      return true;
    } catch (error) {
      console.error('Failed to log SMS:', error);
      return false;
    }
  }
}

// Future Production SMS Gateway provider
export class ProductionSmsProvider implements ISmsProvider {
  async sendSms(mobile: string, message: string): Promise<boolean> {
    // Integrate Twilio, Nexmo, or local operator here.
    // Replace API URL and credentials here only.
    throw new Error('ProductionSmsProvider not implemented yet');
  }
}

// Active SMS Service
class SmsService {
  private provider: ISmsProvider;

  constructor() {
    // Switch between DevelopmentSmsProvider and ProductionSmsProvider
    this.provider = new DevelopmentSmsProvider();
  }

  async sendOtp(mobile: string, otp: string): Promise<boolean> {
    const message = `Your QR Ordering platform OTP is: ${otp}. Valid for 5 minutes.`;
    return this.provider.sendSms(mobile, message);
  }

  async sendPasswordResetOtp(mobile: string, otp: string): Promise<boolean> {
    const message = `Your password reset OTP is: ${otp}. Valid for 5 minutes.`;
    return this.provider.sendSms(mobile, message);
  }

  async sendCustomSms(mobile: string, message: string): Promise<boolean> {
    return this.provider.sendSms(mobile, message);
  }
}

export const smsService = new SmsService();
