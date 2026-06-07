/**
 * 🌟 Sports Facility Booking System - Main Server File
 * ----------------------------------------------------
 * Hey there! This is the backend entrypoint for our Sports Sync app.
 * We built this to help students reserve facilities (like tennis & basketball courts) easily.
 * 
 * Features:
 * - Handles CORS so our React frontend can talk to us
 * - Integrated database (MongoDB Atlas + custom In-Memory Failover so our demo never crashes!)
 * - Asynchronous startup flow to avoid race conditions during seeding
 */

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const dns = require('dns');
const path = require('path');

// 📡 Application-level DNS Override
// Many school/university Wi-Fi networks block SRV lookups on default DNS.
// We force Node.js to use Google (8.8.8.8) and Cloudflare (1.1.1.1) DNS to bypass the block!
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (err) {
  console.log('⚠️ DNS Override failed:', err.message);
}

const connectDB = require('./config/db');
const Court = require('./models/Court');
const User = require('./models/User');

// Step 1: Load up all our keys/ports from the .env file
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });
console.log(`🔐 Loaded environment variables from ${envPath}`);

// Step 2: Initialize our Express Application instance
const app = express();

// Step 3: Add our standard middlewares
app.use(cors()); // Permits requests from our Vite server on port 5173
app.use(express.json()); // Parses incoming json payloads so we can read req.body easily

// Step 4: Hook up all our modular api routers
app.use('/api/auth', require('./routes/auth'));           // Sign up & Login logic
app.use('/api/courts', require('./routes/courts'));       // Fetch courts, block slots (Admin)
app.use('/api/bookings', require('./routes/bookings'));   // Reservations & Simulated Refunds calculations
app.use('/api/analytics', require('./routes/analytics')); // AI Peak predictions & graphs

// Simple root checkpoint to ensure our server is up and running in our browser
app.get('/', (req, res) => {
  res.send('🏫 University Sports Facility Booking API is running beautifully!');
});

/**
 * 💡 Initial Database Seeder
 * ----------------------------
 * If we are running this for the first time, we want to pre-load a set of sports facilities
 * and demo user accounts so the professor (or us!) don't have to register accounts manually to start.
 */
const seedCourts = async () => {
  // If we had to failover to the local mock database, we skip seeding Mongoose database models
  if (process.env.MOCK_DB === 'true') {
    console.log('💡 [Seeder] In-Memory high-availability Mock Datastore activated. Bypassing Atlas seeding.');
    return;
  }

  try {
    const courtCount = await Court.countDocuments();
    if (courtCount === 0) {
      console.log('🌱 [Seeder] Cloud database empty. Populating sports facilities...');
      
      const initialCourts = [
        {
          name: "Grand Slam Arena (Indoor)",
          sport: "Tennis",
          description: "Premium synthetic tennis court with advanced indoor temperature regulation, crystal-clear lighting, and professional ball machines.",
          pricePerHour: 40,
          capacity: 4,
          imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800",
          rules: [
            "Non-marking tennis shoes required at all times.",
            "Maximum 4 players on the court per session.",
            "Please bring your own tennis rackets and balls.",
            "Please leave the court 5 minutes early to allow for surface prep."
          ]
        },
        {
          name: "Apex Hoop Center",
          sport: "Basketball",
          description: "Vibrant indoor court with premium maple wood flooring, adjustable hoops, electronic scoreboards, and full surround-sound audio.",
          pricePerHour: 60,
          capacity: 10,
          imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800",
          rules: [
            "Proper indoor basketball shoes are required.",
            "Maximum capacity is 10 players on the court.",
            "Hanging on rims or nets is strictly prohibited.",
            "No food or colored sugary beverages allowed on the hardwood flooring."
          ]
        },
        {
          name: "Smash Arena Court A",
          sport: "Badminton",
          description: "Ultra-cushioned court mats with dedicated high-performance glare-free LED lighting to track your shuttles perfectly.",
          pricePerHour: 25,
          capacity: 4,
          imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800",
          rules: [
            "Badminton non-marking shoes are compulsory.",
            "Maximum 4 players allowed per court.",
            "Shuttlecocks and rental rackets are available at the front desk.",
            "Keep court borders clear of bags and personal items."
          ]
        },
        {
          name: "Bernabéu Astro Turf",
          sport: "Football",
          description: "Elite outdoor 5-a-side AstroTurf football pitch equipped with stadium-grade floodlights, premium netting, and rebound walls.",
          pricePerHour: 80,
          capacity: 12,
          imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800",
          rules: [
            "Astroturf or flat-soled football shoes only (No metal cleats allowed).",
            "Maximum of 12 players per pitch.",
            "Shin guards are highly recommended.",
            "Climbing boundary nets is strictly prohibited."
          ]
        }
      ];

      await Court.insertMany(initialCourts);
      console.log('🎉 [Seeder] Sports facilities successfully imported to cloud!');
    }

    // Now let's register two default accounts so the demo works right out of the box!
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 [Seeder] Creating pre-configured student and admin accounts...');
      await User.create([
        {
          name: 'Demo Student',
          email: 'student@demo.com',
          password: '123456',
          role: 'user'
        },
        {
          name: 'Demo Sports Admin',
          email: 'admin@demo.com',
          password: '123456',
          role: 'admin'
        }
      ]);
      console.log('🎉 [Seeder] Demo accounts successfully preseeded!');
    }
  } catch (error) {
    console.error(`⚠️ [Seeder] Seed failed: ${error.message}`);
  }
};

/**
 * 🚀 Sequential Startup Function
 * ---------------------------------
 * We use an asynchronous start function to guarantee that the server waits
 * for database connection (or failover timeout) before initiating port binding and database seeding!
 */
const startServer = async () => {
  console.log('🏫 Starting up University Sports booking gateway...');
  
  // Step 1: Establish our Database Connection
  await connectDB();
  
  // Step 2: Seed courts and profiles
  await seedCourts();

  // Step 3: Start listening for incoming traffic on our designated port
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server fully operational on port ${PORT}!`);
  });
};

startServer();
