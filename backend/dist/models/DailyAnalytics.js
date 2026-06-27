"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DailyAnalytics = void 0;
const mongoose_1 = require("mongoose");
const DailyAnalyticsSchema = new mongoose_1.Schema({
    restaurantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    date: { type: Date, required: true },
    sales: { type: Number, required: true, default: 0 },
    ordersCount: { type: Number, required: true, default: 0 }
}, { timestamps: true });
// Compound index to ensure uniqueness per day per restaurant
DailyAnalyticsSchema.index({ restaurantId: 1, date: 1 }, { unique: true });
exports.DailyAnalytics = (0, mongoose_1.model)('DailyAnalytics', DailyAnalyticsSchema);
