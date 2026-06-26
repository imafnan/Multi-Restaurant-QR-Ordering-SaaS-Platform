"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const User_1 = require("./models/User");
const PORT = process.env.PORT || 5000;
const startServer = async () => {
    try {
        // Connect to DB
        await (0, db_1.connectDB)();
        // Seed default Super Admin if none exists
        const superAdminExists = await User_1.User.findOne({ mobile: '01644612999' });
        if (!superAdminExists) {
            // Clear any other default super admin to avoid collision
            await User_1.User.deleteMany({ role: 'super_admin' });
            await User_1.User.create({
                name: 'Primary Super Admin',
                mobile: '01644612999',
                password: '@123456',
                role: 'super_admin',
                status: 'active',
            });
            console.log('----------------------------------------------------');
            console.log('Seeded Default Super Admin:');
            console.log('Mobile: 01644612999');
            console.log('Password: @123456');
            console.log('----------------------------------------------------');
        }
        app_1.default.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
