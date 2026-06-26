"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const User_1 = require("../models/User");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const checkDb = async () => {
    try {
        const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/qr_ordering';
        console.log('Connecting to:', connStr);
        await mongoose_1.default.connect(connStr);
        console.log('Connected!');
        const users = await User_1.User.find({});
        console.log('Users in Database:', users.map(u => ({
            id: u._id,
            name: u.name,
            mobile: u.mobile,
            role: u.role,
            status: u.status
        })));
        await mongoose_1.default.disconnect();
    }
    catch (error) {
        console.error('Inspection failed:', error);
    }
};
checkDb();
