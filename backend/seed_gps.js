const mongoose = require('mongoose');
const dns = require('dns');
require('dotenv').config();
const Court = require('./models/Court');

try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (err) {}

const baseLat = 17.3850;
const baseLng = 78.4867;

const aiImages = [
  "https://images.unsplash.com/photo-1595435934249-5df7ed86e1f4?auto=format&fit=crop&q=80&w=800", // Tennis
  
  "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800", // Basketball
  
  "https://images.unsplash.com/photo-1518605368461-1eb5d45d3151?auto=format&fit=crop&q=80&w=800", // Football
  "https://images.unsplash.com/photo-1622228262959-8cead91ed5be?auto=format&fit=crop&q=80&w=800"  // Badminton
];

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for Seeding...');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};

const seedGPS = async () => {
  await connectDB();
  try {
    const courts = await Court.find();
    console.log(`Found ${courts.length} courts.`);
    
    for (let i = 0; i < courts.length; i++) {
      const court = courts[i];
      // Generate a slight variation in lat/lng (within ~5-10km)
      const latOffset = (Math.random() - 0.5) * 0.1;
      const lngOffset = (Math.random() - 0.5) * 0.1;
      
      court.location = {
        lat: baseLat + latOffset,
        lng: baseLng + lngOffset,
        address: 'Randomly Generated Location'
      };
      
      // Update image
      court.imageUrl = aiImages[i % aiImages.length];
      
      await court.save();
      console.log(`Updated GPS for ${court.name}: ${court.location.lat}, ${court.location.lng}`);
    }
    
    console.log('Successfully seeded GPS locations!');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedGPS();
