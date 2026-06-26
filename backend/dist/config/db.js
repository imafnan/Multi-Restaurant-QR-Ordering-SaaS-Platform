"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.disconnectDB = exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const mongodb_memory_server_1 = require("mongodb-memory-server");
let mongoMemoryServer = null;
const connectDB = async () => {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/qr_ordering';
    try {
        console.log(`Connecting to MongoDB at: ${connStr}`);
        // Short timeout so we fail fast and fall back to in-memory if local service is stopped
        await mongoose_1.default.connect(connStr, {
            serverSelectionTimeoutMS: 2000,
        });
        console.log(`MongoDB Connected successfully to: ${connStr}`);
    }
    catch (error) {
        console.warn(`Local MongoDB connection failed: ${error.message}`);
        console.log('Starting MongoMemoryServer as fallback...');
        try {
            mongoMemoryServer = await mongodb_memory_server_1.MongoMemoryServer.create();
            const inMemoryUri = mongoMemoryServer.getUri();
            console.log(`In-Memory MongoDB Server started successfully! URI: ${inMemoryUri}`);
            await mongoose_1.default.connect(inMemoryUri);
            console.log(`Connected to In-Memory MongoDB.`);
        }
        catch (memError) {
            console.error('Failed to start In-Memory MongoDB:', memError);
            process.exit(1);
        }
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    await mongoose_1.default.disconnect();
    if (mongoMemoryServer) {
        await mongoMemoryServer.stop();
    }
};
exports.disconnectDB = disconnectDB;
