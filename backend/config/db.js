const mongoose = require('mongoose');
const { setMockDbMode } = require('../utils/db');

const connectDB = async () => {
  if (!process.env.MONGODB_URI && process.env.MOCK_DB === 'true') {
    setMockDbMode(true);
    return;
  }
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI not set');
    mongoose.set('bufferCommands', false);
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT || 10000)
    });
    setMockDbMode(false);
    console.log(`MongoDB: ${conn.connection.host}`);
  } catch (err) {
    console.log(`MongoDB failed: ${err.message}. Falling back to mock DB.`);
    setMockDbMode(true);
  }
};
module.exports = connectDB;
