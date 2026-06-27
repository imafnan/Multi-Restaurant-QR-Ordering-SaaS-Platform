import { Schema, model, Document } from 'mongoose';

export interface IDailyAnalytics extends Document {
  restaurantId: Schema.Types.ObjectId;
  date: Date; // Normalized to starting hour of the day (YYYY-MM-DD)
  sales: number;
  ordersCount: number;
}

const DailyAnalyticsSchema = new Schema<IDailyAnalytics>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    date: { type: Date, required: true },
    sales: { type: Number, required: true, default: 0 },
    ordersCount: { type: Number, required: true, default: 0 }
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness per day per restaurant
DailyAnalyticsSchema.index({ restaurantId: 1, date: 1 }, { unique: true });

export const DailyAnalytics = model<IDailyAnalytics>('DailyAnalytics', DailyAnalyticsSchema);
