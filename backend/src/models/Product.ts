import { Schema, model, Document } from 'mongoose';

export interface IVariant {
  name: string;
  price: number;
  discountPrice?: number;
}

export interface IProduct extends Document {
  restaurantId: Schema.Types.ObjectId;
  categoryId: Schema.Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  image?: string; // Singular fallback image URL
  images: string[]; // List of up to 3 image URLs
  status: 'active' | 'inactive';
  quantity?: number;
  variants: IVariant[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, default: 0 },
    discountPrice: { type: Number },
    image: { type: String, default: '' },
    images: { type: [String], default: [] },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    quantity: { type: Number },
    variants: [
      {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        discountPrice: { type: Number },
      },
    ],
  },
  { timestamps: true }
);

export const Product = model<IProduct>('Product', ProductSchema);

