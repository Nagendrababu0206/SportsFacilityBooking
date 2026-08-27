const mongoose = require('mongoose');
require('dotenv').config();
const Court = require('./models/Court');
const User = require('./models/User');

const courts = [
  { name: "Osmania University Tennis Court", sport: "Tennis", description: "Professional synthetic tennis courts located inside the scenic Osmania University campus. Features floodlighting for evening sessions.", pricePerHour: 150, capacity: 4, location: { lat: 17.4137, lng: 78.5284, address: "Osmania University Campus, Tarnaka, Hyderabad, Telangana 500007" }, imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800", rules: ["Non-marking shoes required.", "Maximum 4 players per court.", "Bring own rackets and tennis balls.", "Leave 5 mins early for court watering."] },
  { name: "JNTU Hyderabad Basketball Arena", sport: "Basketball", description: "Well-maintained indoor basketball court with wooden flooring and adjustable hoops in the JNTUH Sports Complex.", pricePerHour: 300, capacity: 10, location: { lat: 17.4975, lng: 78.3845, address: "JNTUH Campus, Kukatpally, Hyderabad, Telangana 500085" }, imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800", rules: ["Clean indoor sports shoes only.", "No food or sugary drinks on court.", "Max 10 players inside the hoop zone.", "No hanging on rims."] },
  { name: "HCU Badminton Stadium Court A", sport: "Badminton", description: "Indoor badminton court with standard synthetic mats and glare-free lighting at the University of Hyderabad Sports Complex.", pricePerHour: 150, capacity: 4, location: { lat: 17.4583, lng: 78.3242, address: "HCU Campus, Gachibowli, Hyderabad, Telangana 500046" }, imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800", rules: ["Non-marking badminton shoes compulsory.", "Maximum 4 players.", "Shuttlecocks available on purchase.", "Keep the court clean."] },
  { name: "IIIT Hyderabad Football Ground", sport: "Football", description: "Premium 7-a-side outdoor astro-turf football ground with professional floodlights at the IIIT-H campus.", pricePerHour: 600, capacity: 14, location: { lat: 17.4448, lng: 78.3498, address: "IIIT-H Campus, Gachibowli,Hyderabad,Telangana 500032" }, imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800", rules: ["Turf shoes only. Strictly no metal studs.", "Max 14 players allowed on turf.", "Shin guards highly recommended.", "Clean up trash after the session."] },
  { name: "CBIT Volleyball Court", sport: "Volleyball", description: "Premium clay volleyball court with professional net and boundary markers at CBIT sports campus.", pricePerHour: 200, capacity: 12, location: { lat: 17.3916, lng: 78.3182, address: "CBIT Campus, Gandipet, Telangana 500075" }, imageUrl: "https://images.unsplash.com/photo-1592656094270-3c1d94f2ea0e?auto=format&fit=crop&q=80&w=800", rules: ["Sport shoes mandatory.", "Maximum 12 players.", "Do not damage net/poles.", "Report any damage immediately."] },
  { name: "VNR VJIET Squash Arena", sport: "Squash", description: "State-of-the-art glass-back indoor squash court at VNR VJIET campus with professional wooden flooring.", pricePerHour: 250, capacity: 2, location: { lat: 17.5385, lng: 78.3862, address: "VNR VJIET Campus, Bachupally, Hyderabad, Telangana 500090" }, imageUrl: "https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?auto=format&fit=crop&q=80&w=800", rules: ["Non-marking shoes mandatory.", "Strictly max 2 players.", "Goggles recommended.", "Bring own squash balls."] },
  { name: "NIT Warangal Cricket Ground", sport: "Cricket", description: "International standard cricket ground with proper pitch and floodlights at NIT Warangal campus.", pricePerHour: 800, capacity: 22, location: { lat: 18.0095, lng: 79.5676, address: "NIT Warangal Campus, Warangal, Telangana 506004" }, imageUrl: "https://images.unsplash.com/photo-1521315630216-2c93ba39d6b5?auto=format&fit=crop&q=80&w=800", rules: ["Pitch maintenance required.", "No shoe polishing.", "Maximum 22 players.", "Keep area clean."] },
  { name: "University of Hyderabad Cricket Stadium", sport: "Cricket", description: "Well-maintained cricket stadium with pavilion and practice nets.", pricePerHour: 900, capacity: 22, location: { lat: 17.4594, lng: 78.3133, address: "University of Hyderabad Campus, Gachibowli, Telangana 500046" }, imageUrl: "https://images.unsplash.com/photo-1544126588-5b5c70b13125?auto=format&fit=crop&q=80&w=800", rules: ["Floodlights operational after 6pm.", "No metal cleats.", "Maintain silence in pavilion."] },
  { name: "Kakatiya University Cricket Ground", sport: "Cricket", description: "Grass cricket field with practice nets and seating.", pricePerHour: 700, capacity: 18, location: { lat: 18.2065, lng: 79.1040, address: "Kakatiya University Campus, Warangal, Telangana 506001" }, imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=800", rules: ["Footwear must be non-marking.", "No food on field.", "Maximum 18 players."] },
  { name: "Malla Reddy College Cricket Ground", sport: "Cricket", description: "College cricket ground with evening lights.", pricePerHour: 600, capacity: 16, location: { lat: 17.4181, lng: 78.6167, address: "Malla Reddy College, Hyderabad, Telangana 500062" }, imageUrl: "https://images.unsplash.com/photo-1579583421086-d1951a3d5e6e?auto=format&fit=crop&q=80&w=800", rules: ["No metal spikes.", "Keep equipment tidy."] },
  { name: "SRM Hyderabad Tennis Court", sport: "Tennis", description: "Professional synthetic tennis court at SRM Hyderabad campus.", pricePerHour: 200, capacity: 4, location: { lat: 17.5275, lng: 78.3245, address: "SRM Institute of Science and Technology, Hyderabad, Telangana 500084" }, imageUrl: "https://images.unsplash.com/photo-1579247267598-8c16b6b0c4f6?auto=format&fit=crop&q=80&w=800", rules: ["Non-marking shoes required.", "Maximum 4 players.", "Bring own rackets and balls."] },
  { name: "BITS Pilani Hyderabad Tennis Court", sport: "Tennis", description: "High-quality tennis court with lighting for night play.", pricePerHour: 220, capacity: 4, location: { lat: 17.4512, lng: 78.3780, address: "BITS Pilani Hyderabad Campus, Hyderabad, Telangana 500084" }, imageUrl: "https://images.unsplash.com/photo-1556484688-2e7518e628cb?auto=format&fit=crop&q=80&w=800", rules: ["Clean shoes only.", "Max 4 players.", "No food on court."] },
  { name: "MGIT Tennis Court", sport: "Tennis", description: "Indoor tennis court with synthetic floor at Mahatma Gandhi Institute of Technology.", pricePerHour: 180, capacity: 4, location: { lat: 17.5700, lng: 78.4270, address: "MGIT Campus, Hyderabad, Telangana 500032" }, imageUrl: "https://images.unsplash.com/photo-1517805325132-1dfc6b569e79?auto=format&fit=crop&q=80&w=800", rules: ["Non-marking shoes.", "Bring own equipment.", "Maximum 4 players."] },
  { name: "GITAM Hyderabad Tennis Court", sport: "Tennis", description: "Premium tennis court with floodlights at GITAM Hyderabad.", pricePerHour: 210, capacity: 4, location: { lat: 17.4756, lng: 78.3852, address: "GITAM University, Hyderabad, Telangana 500075" }, imageUrl: "https://images.unsplash.com/photo-1508606572321-901ea4439b13?auto=format&fit=crop&q=80&w=800", rules: ["Shoes must be non-marking.", "Maximum 4 players.", "Keep court clean."] },
  { name: "University College of Engineering (Osmania) Tennis Court", sport: "Tennis", description: "Well-maintained tennis court within the UCE campus.", pricePerHour: 190, capacity: 4, location: { lat: 17.4245, lng: 78.4745, address: "UCE Campus, Osmania University, Hyderabad, Telangana 500007" }, imageUrl: "https://images.unsplash.com/photo-1539425997880-0e0e0a0f19a8?auto=format&fit=crop&q=80&w=800", rules: ["Non-marking shoes.", "Maximum 4 players.", "No food or drinks."] },
];

async function seed() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is required to seed MongoDB');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Overwrite courts to ensure Hyderabad venues are populated
    await Court.deleteMany({});
    await Court.insertMany(courts);
    console.log(`Seeded ${courts.length} courts`);

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
