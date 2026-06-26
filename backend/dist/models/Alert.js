"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Alert = void 0;
const mongoose_1 = require("mongoose");
const AlertSchema = new mongoose_1.Schema({
    restaurantId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    message: { type: String, required: true },
}, { timestamps: true });
exports.Alert = (0, mongoose_1.model)('Alert', AlertSchema);
