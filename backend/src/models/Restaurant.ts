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
  },
  { timestamps: true }
);

export const Restaurant = model<IRestaurant>('Restaurant', RestaurantSchema);
