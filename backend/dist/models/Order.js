"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Order = void 0;
const mongoose_1 = require("mongoose");
const OrderSchema = new mongoose_1.Schema({
    restaurantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    orderId: { type: String, required: true, unique: true },
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    tableNumber: { type: String, required: true },
    items: [
        {
            productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true },
            name: { type: String, required: true },
            variantName: { type: String },
            quantity: { type: Number, required: true, default: 1 },
            price: { type: Number, required: true },
        },
    ],
    subtotal: { type: Number, required: true, default: 0 },
    vat: { type: Number, required: true, default: 0 },
    discountAmount: { type: Number, default: 0 },
    discountNote: { type: String, default: '' },
    originalTotal: { type: Number, default: 0 },
    grandTotal: { type: Number, required: true, default: 0 },
    status: { type: String, enum: ['pending', 'accepted', 'completed', 'cancelled'], default: 'pending' },
}, { timestamps: true });
exports.Order = (0, mongoose_1.model)('Order', OrderSchema);
