import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;

export const connectDB = async () => {
  const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/qr_ordering';
  
  try {
    console.log(`Connecting to MongoDB at: ${connStr}`);
    // Short timeout so we fail fast and fall back to in-memory if local service is stopped
    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`MongoDB Connected successfully to: ${connStr}`);
  } catch (error: any) {
    console.warn(`Local MongoDB connection failed: ${error.message}`);
    console.log('Starting MongoMemoryServer as fallback...');
    
    try {
      mongoMemoryServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoMemoryServer.getUri();
      console.log(`In-Memory MongoDB Server started successfully! URI: ${inMemoryUri}`);
      
      await mongoose.connect(inMemoryUri);
      console.log(`Connected to In-Memory MongoDB.`);
    } catch (memError) {
      console.error('Failed to start In-Memory MongoDB:', memError);
      process.exit(1);
    }
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};
