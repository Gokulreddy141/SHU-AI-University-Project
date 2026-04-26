import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Global caching to prevent multiple connections in development
let cached = (global as { mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } }).mongoose;

if (!cached) {
  cached = (global as { mongoose?: { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null } }).mongoose = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!cached!.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,   // fail fast if Atlas is unreachable
      connectTimeoutMS: 10000,           // max time to establish a connection
      socketTimeoutMS: 45000,            // max time for a socket operation
    };

    cached!.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    }).catch((err) => {
      // Reset cached promise so the next request retries instead of hanging on a dead promise
      cached!.promise = null;
      throw err;
    });
  }
  cached!.conn = await cached!.promise;
  return cached!.conn;
}

export default connectToDatabase;