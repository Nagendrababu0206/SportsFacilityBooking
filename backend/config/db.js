const mongoose = require('mongoose');
const { setMockDbMode } = require('../utils/db');

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGODB_URI not set in production');
    }
    setMockDbMode(true);
    return;
  }
  try {
    mongoose.set('bufferCommands', false);
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT || 10000)
    });
    setMockDbMode(false);
    console.log(`MongoDB: ${conn.connection.host}`);
  } catch (err) {
    if (process.env.NODE_ENV === 'production') throw err;
    console.log(`MongoDB failed: ${err.message}. Falling back to mock DB.`);
    setMockDbMode(true);
  }
};
module.exports = connectDB;
