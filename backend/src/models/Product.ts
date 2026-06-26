import { Schema, model, Document } from 'mongoose';

export interface IProduct extends Document {
  restaurantId: Schema.Types.ObjectId;
  categoryId: Schema.Types.ObjectId;
  name: string;
  price: number;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true, trim: true },
    price: { type: Number, required: true, default: 0 },
    image: { type: String },
  },
  { timestamps: true }
);

export const Product = model<IProduct>('Product', ProductSchema);
