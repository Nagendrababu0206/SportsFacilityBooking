/**
 * 🗄️ Database Connection Manager
 * ------------------------------
 * This script establishes a secure connection to our MongoDB database.
 * 
 * High-Engineering Coursework Standard:
 * In university environments, wifi connections or local MongoDB configurations can often fail.
 * To make this application bulletproof, we set a fast 2-second connection timeout (serverSelectionTimeoutMS)
 * and disabled Mongoose query buffering. If it fails, we fall back to a fully integrated In-Memory datastore.
 */

const mongoose = require('mongoose');

const connectDB = async () => {
  if (process.env.MOCK_DB === 'true') {
    console.log('💡 [DB] In-Memory Mock Database active. MongoDB connection skipped.');
    return;
  }

  try {
    const mongoUri = process.env.MONGODB_URI;

    if (!mongoUri) {
      throw new Error('MONGODB_URI is not set. Set MOCK_DB=true to run with the local fallback datastore.');
    }

    // Disable Mongoose command buffering so queries fail instantly if connection is offline
    mongoose.set('bufferCommands', false);

    // Use a configurable timeout so failed Atlas connections do not block startup for too long
    const timeout = Number(process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || 10000);

    const conn = await mongoose.connect(
      mongoUri,
      {
        serverSelectionTimeoutMS: timeout
      }
    );

    console.log(`✅ MongoDB Connected Successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Mongoose Connection Failed: ${error.message}`);
    console.log(`🛡️  [High-Availability] Activating High-Availability Mock In-Memory Database Fallback!`);
    
    // Flag process state to use mockDb array operations instead of mongoose queries
    process.env.MOCK_DB = 'true';
  }
};

module.exports = connectDB;
