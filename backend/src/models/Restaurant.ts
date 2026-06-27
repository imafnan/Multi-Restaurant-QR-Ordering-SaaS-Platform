import { Schema, model, Document } from 'mongoose';

export interface IRestaurant extends Document {
  name: string;
  slug: string;
  mobile: string;
  email?: string;
  location: string;
  subscriptionFee: number;
  registrationFormImage?: string;
  tradeLicenseImage?: string;
  openingDate: Date;
  status: 'active' | 'disabled';
  visitorsCount: number;
  paymentStatus: 'pending' | 'completed';
  paymentMethod?: string;
  paymentDate?: Date;
  logo?: string;
  banner?: string;
  vatPercentage: number;
  subscriptionStatus: 'active' | 'pending_payment' | 'expired';
  subscriptionExpiryDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantSchema = new Schema<IRestaurant>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    mobile: { type: String, required: true, unique: true, trim: true },
    email: { type: String, trim: true },
    location: { type: String, required: true },
    subscriptionFee: { type: Number, required: true, default: 0 },
    registrationFormImage: { type: String },
    tradeLicenseImage: { type: String },
    openingDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['active', 'disabled'], default: 'active' },
    visitorsCount: { type: Number, default: 0 },
    paymentStatus: { type: String, enum: ['pending', 'completed'], default: 'pending' },
    paymentMethod: { type: String },
    paymentDate: { type: Date },
    logo: { type: String, default: '' },
    banner: { type: String, default: '' },
    vatPercentage: { type: Number, default: 0 },
    subscriptionStatus: { type: String, enum: ['active', 'pending_payment', 'expired'], default: 'pending_payment' },
    subscriptionExpiryDate: { type: Date, default: () => new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
  },
  { timestamps: true }
);

export const Restaurant = model<IRestaurant>('Restaurant', RestaurantSchema);

