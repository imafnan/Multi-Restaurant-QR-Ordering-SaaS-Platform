import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export const checkDbConnection = (req: Request, res: Response, next: NextFunction) => {
  if (mongoose.connection.readyState !== 1) {
    console.error(`Database request failed: Database is disconnected. Current Mongoose state: ${mongoose.connection.readyState}`);
    return res.status(500).json({
      message: 'Database connection is not established. Please check backend connection logs.',
    });
  }
  next();
};
