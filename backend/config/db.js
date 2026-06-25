const mongoose = require('mongoose');

const connectDB = async () => {
  const useMock = process.env.MOCK_DB === 'true';
  const mongoUri = (process.env.MONGODB_URI || '').trim();

  if (useMock && !mongoUri) {
    console.log('Using in-memory mock database (MOCK_DB=true, no MONGODB_URI)');
    return;
  }

  if (!mongoUri) {
    throw new Error('MONGODB_URI not set. Add your Atlas URI to backend/.env or set MOCK_DB=true for demo mode.');
  }

  if (!/^mongodb(\+srv)?:\/\//i.test(mongoUri)) {
    throw new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  }

  try {
    mongoose.set('bufferCommands', false);
    const isLocal = mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1');
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT || 10000),
      connectTimeoutMS: Number(process.env.MONGO_TIMEOUT || 10000),
      maxPoolSize: 10,
      tls: !isLocal
    });
    process.env.MOCK_DB = 'false';
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    if (useMock) {
      console.log(`MongoDB failed: ${err.message}. Using mock DB (MOCK_DB=true).`);
      return;
    }
    throw new Error(`MongoDB connection failed: ${err.message}`);
  }
};
module.exports = connectDB;
