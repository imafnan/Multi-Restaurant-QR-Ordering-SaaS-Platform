"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsLog = void 0;
const mongoose_1 = require("mongoose");
const SmsLogSchema = new mongoose_1.Schema({
    mobile: { type: String, required: true },
    message: { type: String, required: true },
}, { timestamps: { createdAt: true, updatedAt: false } });
exports.SmsLog = (0, mongoose_1.model)('SmsLog', SmsLogSchema);
