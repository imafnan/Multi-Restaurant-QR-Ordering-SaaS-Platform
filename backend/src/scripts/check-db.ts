import mongoose from 'mongoose';
import { User } from '../models/User';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../.env') });

const checkDb = async () => {
  try {
    const connStr = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/qr_ordering';
    console.log('Connecting to:', connStr);
    await mongoose.connect(connStr);
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
