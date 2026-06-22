const mongoose = require('mongoose');

const connectDB = async () => {
  if (process.env.MOCK_DB === 'true') return;
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI not set');
    mongoose.set('bufferCommands', false);
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT || 10000)
    });
    console.log(`MongoDB: ${conn.connection.host}`);
  } catch (err) {
    console.log(`MongoDB failed: ${err.message}. Falling back to mock DB.`);
    process.env.MOCK_DB = 'true';
  }
};
module.exports = connectDB;