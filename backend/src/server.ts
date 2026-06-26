import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';
import { User } from './models/User';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to DB
    await connectDB();

    // Seed default Super Admin if none exists
    const superAdminExists = await User.findOne({ mobile: '01644612999' });
    if (!superAdminExists) {
      // Clear any other default super admin to avoid collision
      await User.deleteMany({ role: 'super_admin' });

      await User.create({
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

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
