"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Restaurant = void 0;
const mongoose_1 = require("mongoose");
const RestaurantSchema = new mongoose_1.Schema({
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
}, { timestamps: true });
exports.Restaurant = (0, mongoose_1.model)('Restaurant', RestaurantSchema);
