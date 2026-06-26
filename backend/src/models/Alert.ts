import { Schema, model, Document } from 'mongoose';

export interface IAlert extends Document {
  restaurantId: Schema.Types.ObjectId;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const AlertSchema = new Schema<IAlert>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export const Alert = model<IAlert>('Alert', AlertSchema);
