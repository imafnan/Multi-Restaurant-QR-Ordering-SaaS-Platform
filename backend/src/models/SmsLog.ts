import { Schema, model, Document } from 'mongoose';

export interface ISmsLog extends Document {
  mobile: string;
  message: string;
  createdAt: Date;
}

const SmsLogSchema = new Schema<ISmsLog>(
  {
    mobile: { type: String, required: true },
    message: { type: String, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const SmsLog = model<ISmsLog>('SmsLog', SmsLogSchema);
