"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongodb_memory_server_1 = require("mongodb-memory-server");
const testMongo = async () => {
    try {
        console.log('Starting MongoMemoryServer...');
        const mongoServer = await mongodb_memory_server_1.MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        console.log('MongoMemoryServer started successfully! URI:', uri);
        await mongoServer.stop();
        console.log('Stopped.');
    }
    catch (error) {
        console.error('Failed to start MongoMemoryServer:', error);
    }
};
testMongo();
