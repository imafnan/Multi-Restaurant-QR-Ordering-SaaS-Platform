import { Schema, model, Document } from 'mongoose';

export interface ICategory extends Document {
  restaurantId: Schema.Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const Category = model<ICategory>('Category', CategorySchema);
