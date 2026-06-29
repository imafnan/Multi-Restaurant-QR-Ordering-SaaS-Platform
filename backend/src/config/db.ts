import mongoose from 'mongoose';
import dns from 'dns';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoMemoryServer: MongoMemoryServer | null = null;

// Adjust Node.js DNS servers to query public resolvers if the default resolver is 127.0.0.1
// This ensures MongoDB Atlas SRV records can be resolved in sandboxed environments.
try {
  const currentServers = dns.getServers();
  if (currentServers.includes('127.0.0.1') || currentServers.length === 0) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
} catch (dnsError) {
  console.warn('Unable to adjust Node DNS servers:', dnsError);
}

// Disable Mongoose buffering globally so that queries fail-fast when offline instead of hanging
mongoose.set('bufferCommands', false);

export const connectDB = async () => {
  const connStr = process.env.MONGODB_URI;

  if (!connStr) {
    console.warn('MONGODB_URI environment variable is not defined. Starting MongoMemoryServer as fallback...');
    try {
      mongoMemoryServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoMemoryServer.getUri();
      console.log(`In-Memory MongoDB Server started successfully! URI: ${inMemoryUri}`);
      await mongoose.connect(inMemoryUri);
      console.log('Connected to In-Memory MongoDB.');
    } catch (memError) {
      console.error('Failed to start In-Memory MongoDB:', memError);
    }
    return;
  }

  // Sanitize the connection string for logging to avoid printing passwords
  const sanitizedConnStr = connStr.replace(/:([^@]+)@/, ':******@');

  try {
    console.log(`Connecting to MongoDB Atlas...`);
    await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('MongoDB Connected successfully.');
  } catch (error: any) {
    console.error(`Database connection error for ${sanitizedConnStr}: ${error.message}`);
    console.log('Starting MongoMemoryServer as fallback...');
    try {
      mongoMemoryServer = await MongoMemoryServer.create();
      const inMemoryUri = mongoMemoryServer.getUri();
      console.log(`In-Memory MongoDB Server started successfully! URI: ${inMemoryUri}`);
      await mongoose.connect(inMemoryUri);
      console.log('Connected to In-Memory MongoDB.');
    } catch (memError) {
      console.error('Failed to start In-Memory MongoDB:', memError);
    }
  }
};

export const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    await mongoMemoryServer.stop();
  }
};

