const bcrypt = require('bcryptjs');

const db = {
  users: [
    {
      _id: 'user123',
      name: 'Demo Student', email: 'student@demo.com',
      password: '$2a$10$x2dXXF251kgxsocMJyN4oe2E3LWPvsKPHhiAdDhX4NFeKoKlkVw2y',
      role: 'user', interests: ['Tennis', 'Basketball'], feedback: [], createdAt: new Date()
    },
    {
      _id: 'admin123', name: 'Demo Sports Admin', email: 'admin@demo.com',
      password: '$2a$10$x2dXXF251kgxsocMJyN4oe2E3LWPvsKPHhiAdDhX4NFeKoKlkVw2y',
      role: 'admin', interests: [], feedback: [], createdAt: new Date()
    }
  ],
  courts: [
    { _id: 'court1', name: "Osmania University Tennis Court", sport: "Tennis", description: "Professional synthetic tennis courts located inside the scenic Osmania University campus. Features floodlighting for evening sessions.", pricePerHour: 150, capacity: 4, location: { lat: 17.4137, lng: 78.5284, address: "Osmania University Campus, Tarnaka, Hyderabad, Telangana 500007" }, imageUrl: "/images/osmania_university_tennis_court_nano_1783335752684.png", rules: ["Non-marking shoes required.", "Maximum 4 players per court.", "Bring own rackets and tennis balls.", "Leave 5 mins early for court watering."], blockedSlots: [], isActive: true, createdAt: new Date() },
    { _id: 'court2', name: "JNTU Hyderabad Basketball Arena", sport: "Basketball", description: "Well-maintained indoor basketball court with wooden flooring and adjustable hoops in the JNTUH Sports Complex.", pricePerHour: 300, capacity: 10, location: { lat: 17.4975, lng: 78.3845, address: "JNTUH Campus, Kukatpally, Hyderabad, Telangana 500085" }, imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800", rules: ["Clean indoor sports shoes only.", "No food or sugary drinks on court.", "Max 10 players inside the hoop zone.", "No hanging on rims."], blockedSlots: [], isActive: true, createdAt: new Date() },
    { _id: 'court3', name: "HCU Badminton Stadium Court A", sport: "Badminton", description: "Indoor badminton court with standard synthetic mats and glare-free lighting at the University of Hyderabad Sports Complex.", pricePerHour: 150, capacity: 4, location: { lat: 17.4583, lng: 78.3242, address: "HCU Campus, Gachibowli, Hyderabad, Telangana 500046" }, imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800", rules: ["Non-marking badminton shoes compulsory.", "Maximum 4 players.", "Shuttlecocks available on purchase.", "Keep the court clean."], blockedSlots: [], isActive: true, createdAt: new Date() },
    { _id: 'court4', name: "IIIT Hyderabad Football Ground", sport: "Football", description: "Premium 7-a-side outdoor astro-turf football ground with professional floodlights at the IIIT-H campus.", pricePerHour: 600, capacity: 14, location: { lat: 17.4448, lng: 78.3498, address: "IIIT-H Campus, Gachibowli, Hyderabad, Telangana 500032" }, imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800", rules: ["Turf shoes only. Strictly no metal studs.", "Max 14 players allowed on turf.", "Shin guards highly recommended.", "Clean up trash after the session."], blockedSlots: [], isActive: true, createdAt: new Date() },
    { _id: 'court5', name: "CBIT Volleyball Court", sport: "Volleyball", description: "Premium clay volleyball court with professional net and boundary markers at CBIT sports campus.", pricePerHour: 200, capacity: 12, location: { lat: 17.3916, lng: 78.3182, address: "CBIT Campus, Gandipet, Hyderabad, Telangana 500075" }, imageUrl: "https://images.unsplash.com/photo-1592656094270-3c1d94f2ea0e?auto=format&fit=crop&q=80&w=800", rules: ["Sport shoes mandatory.", "Maximum 12 players.", "Do not damage net/poles.", "Report any damage immediately."], blockedSlots: [], isActive: true, createdAt: new Date() },
    { _id: 'court6', name: "VNR VJIET Squash Arena", sport: "Squash", description: "State-of-the-art glass-back indoor squash court at VNR VJIET campus with professional wooden flooring.", pricePerHour: 250, capacity: 2, location: { lat: 17.5385, lng: 78.3862, address: "VNR VJIET Campus, Bachupally, Hyderabad, Telangana 500090" }, imageUrl: "https://images.unsplash.com/photo-1530541930197-ff16ac917b0e?auto=format&fit=crop&q=80&w=800", rules: ["Non-marking shoes mandatory.", "Strictly max 2 players.", "Goggles recommended.", "Bring own squash balls."], blockedSlots: [], isActive: true, createdAt: new Date() },
    { _id: 'court7', name: "NIT Warangal Cricket Ground", sport: "Cricket", description: "International standard cricket ground with proper pitch and floodlights at NIT Warangal campus.", pricePerHour: 800, capacity: 22, location: { lat: 18.0095, lng: 79.5676, address: "NIT Warangal Campus, Warangal, Telangana 506004" }, imageUrl: "/images/nit_warangal_cricket_ground_1783335560263.png", rules: ["Pitch maintenance required.", "No shoe polishing.", "Maximum 22 players.", "Keep area clean."] , blockedSlots: [], isActive: true, createdAt: new Date() },
    { _id: 'court8', name: "University of Hyderabad Cricket Stadium", sport: "Cricket", description: "Well-maintained cricket stadium with pavilion and practice nets.", pricePerHour: 900, capacity: 22, location: { lat: 17.4594, lng: 78.3133, address: "University of Hyderabad Campus, Gachibowli, Telangana 500046" }, imageUrl: "/images/university_of_hyderabad_cricket_stadium_1783335647924.png", rules: ["Floodlights operational after 6pm.", "No metal cleats.", "Maintain silence in pavilion."], blockedSlots: [], isActive: true, createdAt: new Date() },
    { _id: 'court9', name: "Kakatiya University Cricket Ground", sport: "Cricket", description: "Grass cricket field with practice nets and seating.", pricePerHour: 700, capacity: 18, location: { lat: 18.2065, lng: 79.1040, address: "Kakatiya University Campus, Warangal, Telangana 506001" }, imageUrl: "/images/kakatiya_university_cricket_ground_1783335666898.png", rules: ["Footwear must be non-marking.", "No food on field.", "Maximum 18 players."], blockedSlots: [], isActive: true, createdAt: new Date() },
    { _id: 'court10', name: "SRM Hyderabad Tennis Court", sport: "Tennis", description: "Professional synthetic tennis court with lighting for night play.", pricePerHour: 200, capacity: 4, location: { lat: 17.5275, lng: 78.3245, address: "SRM Institute of Science and Technology, Hyderabad, Telangana 500084" }, imageUrl: "/images/srm_hyderabad_tennis_court_1783335729512.png", rules: ["Non-marking shoes required.", "Maximum 4 players.", "Bring own rackets and balls."], blockedSlots: [], isActive: true, createdAt: new Date() }
  ],
  bookings: [],
  facilities: [],
  timeSlots: [],
  cancellationLogs: [],
  usageStats: []
};

const MockUser = {
  find: async () => db.users.map(u => ({ _id: u._id, name: u.name, email: u.email, role: u.role, interests: u.interests, feedback: u.feedback, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt })),
  findOne: async (q) => { const u = db.users.find(u => u.email.toLowerCase() === (q.email || '').toLowerCase()); return u ? { ...u } : null; },
  findById: async (id) => { const u = db.users.find(u => u._id === id); return u ? { ...u } : null; },
  create: async (d) => {
    const salt = await bcrypt.genSalt(10);
    const u = { _id: 'user_' + Math.random().toString(36).slice(2, 11), name: d.name, email: d.email, password: await bcrypt.hash(d.password, salt), role: d.role || 'user', interests: [], feedback: [], createdAt: new Date(), lastLoginAt: null };
    db.users.push(u);
    return { _id: u._id, name: u.name, email: u.email, role: u.role, interests: u.interests, feedback: u.feedback, createdAt: u.createdAt, lastLoginAt: u.lastLoginAt };
  },
  recordLogin: async (email) => {
    const u = db.users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    if (u) u.lastLoginAt = new Date();
  },
  matchPassword: async (pw, hash) => bcrypt.compare(pw, hash)
};

const MockCourt = {
  find: async (f) => (f?.isActive !== undefined ? db.courts.filter(c => c.isActive) : db.courts),
  findById: async (id) => {
    const c = db.courts.find(x => x._id === id);
    if (!c) return null;
    return {
      ...c,
      save: async function () {
        const i = db.courts.findIndex(x => x._id === this._id);
        if (i !== -1) {
          db.courts[i] = { ...this };
        }
        return this;
      }
    };
  },
  create: async (d) => { const c = { _id: 'court_' + Math.random().toString(36).slice(2, 11), ...d, blockedSlots: [], isActive: true, createdAt: new Date() }; db.courts.push(c); return c; },
  findByIdAndUpdate: async (id, u) => { const i = db.courts.findIndex(c => c._id === id); if (i === -1) return null; db.courts[i] = { ...db.courts[i], ...u }; return db.courts[i]; },
  findByIdAndDelete: async (id) => { const i = db.courts.findIndex(c => c._id === id); if (i === -1) return null; return db.courts.splice(i, 1)[0]; },
  addBlockedSlot: async (id, s) => { const c = db.courts.find(c => c._id === id); if (!c) return null; c.blockedSlots.push({ _id: 'block_' + Math.random().toString(36).slice(2, 11), ...s }); return c; },
  removeBlockedSlot: async (cid, bid) => { const c = db.courts.find(c => c._id === cid); if (!c) return null; c.blockedSlots = c.blockedSlots.filter(s => s._id !== bid); return c; }
};

const MockBooking = {
  find: async () => db.bookings.map(b => { const court = db.courts.find(c => c._id === b.court) || null; const user = db.users.find(u => u._id === b.user) || null; return { ...b, court, user: user ? { _id: user._id, name: user.name, email: user.email } : null }; }),
  findById: async (id) => { const b = db.bookings.find(x => x._id === id); if (!b) return null; const court = db.courts.find(c => c._id === b.court) || null; const user = db.users.find(u => u._id === b.user) || null; return { ...b, court, user, save: async function () { const i = db.bookings.findIndex(x => x._id === this._id); if (i !== -1) db.bookings[i] = { ...this, _id: this._id, user: this.user?._id || this.user, court: this.court?._id || this.court }; return this; } }; },
  create: async (d) => { const b = { _id: 'booking_' + Math.random().toString(36).slice(2, 11), ...d, status: 'confirmed', refundAmount: 0, refundStatus: 'none', createdAt: new Date() }; db.bookings.push(b); return b; }
};

module.exports = { MockUser, MockCourt, MockBooking };
