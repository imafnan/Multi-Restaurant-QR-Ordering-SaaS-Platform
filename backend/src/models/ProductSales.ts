import { Schema, model, Document } from 'mongoose';

export interface IProductSales extends Document {
  restaurantId: Schema.Types.ObjectId;
  productId: Schema.Types.ObjectId;
  productName: string;
  categoryName: string;
  variantName?: string;
  totalSold: number;
}

const ProductSalesSchema = new Schema<IProductSales>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    categoryName: { type: String, required: true },
    variantName: { type: String },
    totalSold: { type: Number, required: true, default: 0 }
  },
  { timestamps: true }
);

// Unique index to prevent duplicate entries for the same product and variant combo
ProductSalesSchema.index({ restaurantId: 1, productId: 1, variantName: 1 }, { unique: true });

export const ProductSales = model<IProductSales>('ProductSales', ProductSalesSchema);
