const mongoose = require('mongoose');
const { setMockDbMode } = require('../utils/db');

const connectDB = async () => {
  const mongoUri = (process.env.MONGODB_URI || '').trim();

  if (!mongoUri) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('MONGODB_URI not set in production');
    }
    setMockDbMode(true);
    return;
  }

  if (!/^mongodb(\+srv)?:\/\//i.test(mongoUri)) {
    throw new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  }

  try {
    mongoose.set('bufferCommands', false);
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT || 10000),
      connectTimeoutMS: Number(process.env.MONGO_TIMEOUT || 10000),
      maxPoolSize: 10,
      tls: true
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
