"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cost = void 0;
const mongoose_1 = require("mongoose");
const CostSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
}, { timestamps: true });
exports.Cost = (0, mongoose_1.model)('Cost', CostSchema);
