// backend/scripts/updateCourts.js
// Run with: node backend/scripts/updateCourts.js
// This script updates all court documents with new placeholder images and the KPHB address.

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const Court = require('../models/Court');

const newAddress = 'KPHB Layout, Hyderabad, Telangana, India';
const placeholders = {
  Tennis: 'https://placehold.co/800x520?text=Grand+Slam+Arena',
  Basketball: 'https://placehold.co/800x520?text=Apex+Hoop+Center',
  Badminton: 'https://placehold.co/800x520?text=Smash+Arena+A',
  Football: 'https://placehold.co/800x520?text=Bernab%C3%A9u+Astro+Turf',
  // Add more sports if needed
};

(async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI not set in .env');
      process.exit(1);
    }
    await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const courts = await Court.find();
    for (const court of courts) {
      const imageUrl = placeholders[court.sport] || placeholders['Tennis'];
      court.imageUrl = imageUrl;
      court.location.address = newAddress;
      await court.save();
      console.log(`Updated ${court.name}`);
    }
    console.log('All courts updated');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error updating courts:', err);
    process.exit(1);
  }
})();
