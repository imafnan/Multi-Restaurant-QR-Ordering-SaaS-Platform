"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Settings = void 0;
const mongoose_1 = require("mongoose");
const SettingsSchema = new mongoose_1.Schema({
    globalLogo: { type: String, default: '' },
}, { timestamps: true });
exports.Settings = (0, mongoose_1.model)('Settings', SettingsSchema);
