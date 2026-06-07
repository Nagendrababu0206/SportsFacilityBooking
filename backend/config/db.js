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
  try {
    // Disable Mongoose command buffering so queries fail instantly if connection is offline
    mongoose.set('bufferCommands', false);

    // Set a generous 10-second timeout for cloud database handshakes, or a fast 2-second timeout for local DBs
    const isCloud = (process.env.MONGODB_URI || '').includes('mongodb.net');
    const timeout = isCloud ? 10000 : 2000;

    const conn = await mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/sports_facility_booking',
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
