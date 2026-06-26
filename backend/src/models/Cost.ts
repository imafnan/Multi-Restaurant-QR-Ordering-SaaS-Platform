import { Schema, model, Document } from 'mongoose';

export interface ICost extends Document {
  name: string;
  amount: number;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CostSchema = new Schema<ICost>(
  {
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const Cost = model<ICost>('Cost', CostSchema);
