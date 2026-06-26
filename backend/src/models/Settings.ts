import { Schema, model, Document } from 'mongoose';

export interface ISettings extends Document {
  globalLogo?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    globalLogo: { type: String, default: '' },
  },
  { timestamps: true }
);

export const Settings = model<ISettings>('Settings', SettingsSchema);
