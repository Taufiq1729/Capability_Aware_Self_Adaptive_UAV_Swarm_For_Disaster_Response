import mongoose from 'mongoose';

export let isDbConnected = false;

export const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/uav_swarm_db';
  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });
    isDbConnected = true;
    console.log(`[MongoDB] Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    isDbConnected = false;
    console.warn(`[MongoDB Warning] Could not connect to MongoDB at ${mongoUri}. Operating in resilient memory-store fallback mode: ${err.message}`);
  }
};
