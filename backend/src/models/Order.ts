import { Schema, model, Document } from 'mongoose';

export interface IOrder extends Document {
  restaurantId: Schema.Types.ObjectId;
  orderId: string; // Unique human-readable code e.g. #ORD-123456
  fullName: string;
  phone: string;
  tableNumber: string;
  items: Array<{
    productId: Schema.Types.ObjectId;
    name: string;
    variantName?: string; // e.g. "Small" or "Cheese"
    quantity: number;
    price: number;
  }>;
  subtotal: number;
  vat: number;
  grandTotal: number;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    orderId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    tableNumber: { type: String, required: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        name: { type: String, required: true },
        variantName: { type: String },
        quantity: { type: Number, required: true, default: 1 },
        price: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true, default: 0 },
    vat: { type: Number, required: true, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['pending', 'accepted', 'completed', 'cancelled'], default: 'pending' },
  },
  { timestamps: true }
);

export const Order = model<IOrder>('Order', OrderSchema);

