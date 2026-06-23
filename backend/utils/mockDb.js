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
    { _id: 'court1', name: "Grand Slam Arena (Indoor)", sport: "Tennis", description: "Premium synthetic tennis court with indoor regulation and professional ball machines.", pricePerHour: 40, capacity: 4, location: { lat: 37.4275, lng: -122.1697, address: "1 Tennis Ave, Campus City" }, imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800", rules: ["Non-marking tennis shoes required.", "Maximum 4 players per session.", "Bring your own rackets and balls.", "Leave 5 min early for surface prep."], blockedSlots: [], isActive: true, createdAt: new Date() },
    { _id: 'court2', name: "Apex Hoop Center", sport: "Basketball", description: "Indoor court with maple wood flooring, adjustable hoops, and electronic scoreboards.", pricePerHour: 60, capacity: 10, location: { lat: 37.426, lng: -122.171, address: "22 Champion Way, Campus City" }, imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800", rules: ["Indoor basketball shoes required.", "Max 10 players.", "No hanging on rims.", "No food on hardwood."], blockedSlots: [], isActive: true, createdAt: new Date() },
    { _id: 'court3', name: "Smash Arena Court A", sport: "Badminton", description: "Cushioned mats with glare-free LED lighting for shuttle tracking.", pricePerHour: 25, capacity: 4, location: { lat: 37.4286, lng: -122.1694, address: "8 Shuttle Drive, Campus City" }, imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800", rules: ["Non-marking shoes compulsory.", "Max 4 players per court.", "Shuttlecocks available at front desk.", "Keep bags off court."], blockedSlots: [], isActive: true, createdAt: new Date() },
    { _id: 'court4', name: "Bernabéu Astro Turf", sport: "Football", description: "Outdoor 5-a-side AstroTurf pitch with floodlights and rebound walls.", pricePerHour: 80, capacity: 12, location: { lat: 37.4252, lng: -122.1708, address: "46 Turf Lane, Campus City" }, imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800", rules: ["Astroturf shoes only, no metal cleats.", "Max 12 players.", "Shin guards recommended.", "No climbing nets."], blockedSlots: [], isActive: true, createdAt: new Date() }
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
  findById: async (id) => db.courts.find(c => c._id === id) || null,
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
