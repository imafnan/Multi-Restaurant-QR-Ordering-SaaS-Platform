"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductSales = void 0;
const mongoose_1 = require("mongoose");
const ProductSalesSchema = new mongoose_1.Schema({
    restaurantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    productId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Product', required: true },
    productName: { type: String, required: true },
    categoryName: { type: String, required: true },
    variantName: { type: String },
    totalSold: { type: Number, required: true, default: 0 }
}, { timestamps: true });
// Unique index to prevent duplicate entries for the same product and variant combo
ProductSalesSchema.index({ restaurantId: 1, productId: 1, variantName: 1 }, { unique: true });
exports.ProductSales = (0, mongoose_1.model)('ProductSales', ProductSalesSchema);
