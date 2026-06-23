const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = (process.env.MONGODB_URI || '').trim();

  if (!mongoUri) {
    throw new Error('MONGODB_URI not set');
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
    console.log(`MongoDB: ${conn.connection.host}`);
  } catch (err) {
    throw err;
  }
};
module.exports = connectDB;
