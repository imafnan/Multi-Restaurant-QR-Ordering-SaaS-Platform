"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const mongoose_1 = require("mongoose");
const ProductSchema = new mongoose_1.Schema({
    restaurantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    categoryId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true, default: 0 },
    discountPrice: { type: Number },
    image: { type: String, default: '' },
    images: { type: [String], default: [] },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    quantity: { type: Number },
    variants: [
        {
            name: { type: String, required: true },
            price: { type: Number, required: true },
            discountPrice: { type: Number },
        },
    ],
}, { timestamps: true });
exports.Product = (0, mongoose_1.model)('Product', ProductSchema);
