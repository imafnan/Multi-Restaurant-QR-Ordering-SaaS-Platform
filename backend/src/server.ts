import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import { connectDB } from './config/db';
import mongoose from 'mongoose';
import { User } from './models/User';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Register event listener to seed/update Super Admin once connected (handles startup and reconnects)
    mongoose.connection.on('connected', async () => {
      try {
        let superAdmin = await User.findOne({ mobile: '01644612999' });
        if (!superAdmin) {
          await User.deleteMany({ role: 'super_admin' });
          await User.create({
            name: 'Primary Super Admin',
            mobile: '01644612999',
            password: '@123456#',
            role: 'super_admin',
            status: 'active',
          });
          console.log('----------------------------------------------------');
          console.log('Seeded Default Super Admin (Database Connected):');
          console.log('Mobile: 01644612999');
          console.log('Password: @123456#');
          console.log('----------------------------------------------------');
        } else {
          superAdmin.password = '@123456#';
          superAdmin.role = 'super_admin';
          superAdmin.status = 'active';
          await superAdmin.save();
          console.log('----------------------------------------------------');
          console.log('Updated/Verified Default Super Admin Credentials:');
          console.log('Mobile: 01644612999');
          console.log('Password: @123456#');
          console.log('----------------------------------------------------');
        }
      } catch (err) {
        console.error('Error seeding/updating default Super Admin:', err);
      }
    });

    // Connect to DB
    await connectDB();

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    // Do not crash the process; attempt to start the server anyway so it doesn't fail silently
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (with database offline)`);
    });
  }
};

startServer();

