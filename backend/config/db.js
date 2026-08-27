const mongoose = require('mongoose');

const connectDB = async () => {
  const useMock = process.env.MOCK_DB === 'true';
  const mongoUri = (process.env.MONGODB_URI || '').trim();

  if (!mongoUri) {
    console.log('No MONGODB_URI configured, using in-memory mock database.');
    process.env.MOCK_DB = 'true';
    return;
  }

  if (useMock && !mongoUri) {
    console.log('Using in-memory mock database (MOCK_DB=true, no MONGODB_URI)');
    return;
  }

  if (!/^mongodb(\+srv)?:\/\//i.test(mongoUri)) {
    throw new Error('MONGODB_URI must start with mongodb:// or mongodb+srv://');
  }

  try {
    mongoose.set('bufferCommands', false);
    const isLocal = mongoUri.includes('localhost') || mongoUri.includes('127.0.0.1');
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: Number(process.env.MONGO_TIMEOUT || 4000),
      connectTimeoutMS: Number(process.env.MONGO_TIMEOUT || 4000),
      maxPoolSize: 10,
      tls: !isLocal
    });
    process.env.MOCK_DB = 'false';
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.warn(`\n==================================================`);
    console.warn(`WARNING: MongoDB connection failed: ${err.message}`);
    console.warn(`Falling back to in-memory mock database (MOCK_DB=true).`);
    console.warn(`==================================================\n`);
    process.env.MOCK_DB = 'true';
    return;
  }
};
module.exports = connectDB;
