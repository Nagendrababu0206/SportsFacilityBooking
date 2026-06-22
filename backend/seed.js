const mongoose = require('mongoose');
require('dotenv').config();
const Court = require('./models/Court');
const User = require('./models/User');

const courts = [
  { name: "Grand Slam Arena (Indoor)", sport: "Tennis", description: "Premium synthetic tennis court with indoor regulation.", pricePerHour: 40, capacity: 4, location: { lat: 37.4275, lng: -122.1697, address: "1 Tennis Ave, Campus City" }, imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800", rules: ["Non-marking shoes required.", "Max 4 players.", "Bring own rackets.", "Leave 5 min early."] },
  { name: "Apex Hoop Center", sport: "Basketball", description: "Indoor court with maple flooring and adjustable hoops.", pricePerHour: 60, capacity: 10, location: { lat: 37.426, lng: -122.171, address: "22 Champion Way" }, imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800", rules: ["Indoor shoes required.", "Max 10 players.", "No hanging on rims."] },
  { name: "Smash Arena Court A", sport: "Badminton", description: "Cushioned mats with glare-free LED lighting.", pricePerHour: 25, capacity: 4, location: { lat: 37.4286, lng: -122.1694, address: "8 Shuttle Drive" }, imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800", rules: ["Non-marking shoes only.", "Max 4 players.", "Rackets at front desk."] },
  { name: "Bernab\u00e9u Astro Turf", sport: "Football", description: "Outdoor 5-a-side AstroTurf pitch with floodlights.", pricePerHour: 80, capacity: 12, location: { lat: 37.4252, lng: -122.1708, address: "46 Turf Lane" }, imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800", rules: ["Astroturf shoes only.", "Max 12 players.", "Shin guards recommended."] }
];

async function seed() {
  try {
    if (!process.env.MONGODB_URI) {
      console.log('Set MONGODB_URI to seed MongoDB. Using MOCK_DB=true for in-memory.');
      process.exit(0);
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const courtCount = await Court.countDocuments();
    if (courtCount === 0) {
      await Court.insertMany(courts);
      console.log(`Seeded ${courts.length} courts`);
    } else {
      console.log(`${courtCount} courts already exist, skipping`);
    }

    const userCount = await User.countDocuments();
    if (userCount === 0) {
      await User.create({ name: 'Demo Student', email: 'student@demo.com', password: '123456', role: 'user' });
      await User.create({ name: 'Demo Sports Admin', email: 'admin@demo.com', password: '123456', role: 'admin' });
      console.log('Seeded demo users');
    } else {
      console.log(`${userCount} users already exist, skipping`);
    }

    console.log('Seed complete');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}
seed();