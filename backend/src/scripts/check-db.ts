import mongoose from 'mongoose';
import { User } from '../models/User';
import dotenv from 'dotenv';
import path from 'path';
import dns from 'dns';

// Adjust Node.js DNS servers to query public resolvers if the default resolver is 127.0.0.1
try {
  const currentServers = dns.getServers();
  if (currentServers.includes('127.0.0.1') || currentServers.length === 0) {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
  }
} catch (dnsError) {
  console.warn('Unable to adjust Node DNS servers:', dnsError);
}

dotenv.config({ path: path.join(__dirname, '../../.env') });

const checkDb = async () => {
  try {
    const connStr = process.env.MONGODB_URI;
    if (!connStr) {
      console.error('MONGODB_URI is not defined in .env');
      return;
    }
    const sanitizedConnStr = connStr.replace(/:([^@]+)@/, ':******@');
    console.log('Connecting to:', sanitizedConnStr);
    await mongoose.connect(connStr, { serverSelectionTimeoutMS: 5000 });
    console.log('Connected!');

    const users = await User.find({});
    console.log('Users in Database:', users.map(u => ({
      id: u._id,
      name: u.name,
      mobile: u.mobile,
      role: u.role,
      status: u.status
    })));

    await mongoose.disconnect();
  } catch (error) {
    console.error('Inspection failed:', error);
  }
};

checkDb();

