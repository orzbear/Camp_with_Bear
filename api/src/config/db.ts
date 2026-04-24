import mongoose from 'mongoose';
import { MONGO_URI } from './env.js';

let isConnected = false;

export async function connectDB() {
  if (isConnected) {
    return;
  }

  const maxRetries = 5;
  let retries = 0;

  while (retries < maxRetries) {
    try {
      await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 10000, // fail fast if Atlas is unreachable
        socketTimeoutMS: 45000,          // drop idle sockets before Render's 60s timeout
        maxPoolSize: 10,
      });
      isConnected = true;
      console.log('✅ MongoDB connected successfully');
      return;
    } catch (error) {
      retries++;
      const backoff = Math.min(1000 * Math.pow(2, retries), 10000);
      console.error(`❌ MongoDB connection failed (attempt ${retries}/${maxRetries}):`, error);
      
      if (retries >= maxRetries) {
        throw new Error('Failed to connect to MongoDB after maximum retries');
      }
      
      console.log(`Retrying in ${backoff}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
}

