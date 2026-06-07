const bcrypt = require('bcryptjs');

// In-Memory Storage
const db = {
  users: [
    {
      _id: 'user123',
      name: 'Demo Student',
      email: 'student@demo.com',
      password: '', // hashed below
      role: 'user',
      createdAt: new Date()
    },
    {
      _id: 'admin123',
      name: 'Demo Sports Admin',
      email: 'admin@demo.com',
      password: '', // hashed below
      role: 'admin',
      createdAt: new Date()
    }
  ],
  courts: [
    {
      _id: 'court1',
      name: "Grand Slam Arena (Indoor)",
      sport: "Tennis",
      description: "Premium synthetic tennis court with advanced indoor temperature regulation, crystal-clear lighting, and professional ball machines.",
      pricePerHour: 450,
      capacity: 4,
      location: {
        lat: 37.4275,
        lng: -122.1697,
        address: "1 Tennis Ave, Campus City"
      },
      imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800",
      rules: [
        "Non-marking tennis shoes required at all times.",
        "Maximum 4 players on the court per session.",
        "Please bring your own tennis rackets and balls.",
        "Please leave the court 5 minutes early to allow for surface prep."
      ],
      blockedSlots: [],
      isActive: true,
      createdAt: new Date()
    },
    {
      _id: 'court2',
      name: "Apex Hoop Center",
      sport: "Basketball",
      description: "Vibrant indoor court with premium maple wood flooring, adjustable hoops, electronic scoreboards, and full surround-sound audio.",
      pricePerHour: 420,
      capacity: 10,
      location: {
        lat: 37.4260,
        lng: -122.1710,
        address: "22 Champion Way, Campus City"
      },
      imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800",
      rules: [
        "Proper indoor basketball shoes are required.",
        "Maximum capacity is 10 players on the court.",
        "Hanging on rims or nets is strictly prohibited.",
        "No food or colored sugary beverages allowed on the hardwood flooring."
      ],
      blockedSlots: [],
      isActive: true,
      createdAt: new Date()
    },
    {
      _id: 'court3',
      name: "Smash Arena Court A",
      sport: "Badminton",
      description: "Ultra-cushioned court mats with dedicated high-performance glare-free LED lighting to track your shuttles perfectly.",
      pricePerHour: 220,
      capacity: 4,
      location: {
        lat: 37.4286,
        lng: -122.1694,
        address: "8 Shuttle Drive, Campus City"
      },
      imageUrl: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=800",
      rules: [
        "Badminton non-marking shoes are compulsory.",
        "Maximum 4 players allowed per court.",
        "Shuttlecocks and rental rackets are available at the front desk.",
        "Keep court borders clear of bags and personal items."
      ],
      blockedSlots: [],
      isActive: true,
      createdAt: new Date()
    },
    {
      _id: 'court4',
      name: "Bernabéu Astro Turf",
      sport: "Football",
      description: "Elite outdoor 5-a-side AstroTurf football pitch equipped with stadium-grade floodlights, premium netting, and rebound walls.",
      pricePerHour: 620,
      capacity: 12,
      location: {
        lat: 37.4252,
        lng: -122.1708,
        address: "46 Turf Lane, Campus City"
      },
      imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=800",
      rules: [
        "Astroturf or flat-soled football shoes only (No metal cleats allowed).",
        "Maximum of 12 players per pitch.",
        "Shin guards are highly recommended.",
        "Climbing boundary nets is strictly prohibited."
      ],
      blockedSlots: [],
      isActive: true,
      createdAt: new Date()
    }
  ],
  bookings: []
};

// Initialize hashes for demo users
const initMockHashes = async () => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash('123456', salt);
  db.users[0].password = hash;
  db.users[1].password = hash;
};
initMockHashes();

// Mock Models API Mocking Mongoose interfaces
const MockUser = {
  find: async () => db.users,
  findOne: async (query) => {
    if (query.email) {
      return db.users.find(u => u.email.toLowerCase() === query.email.toLowerCase()) || null;
    }
    return null;
  },
  findById: async (id) => db.users.find(u => u._id === id) || null,
  create: async (userData) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);
    const newUser = {
      _id: 'user_' + Math.random().toString(36).substr(2, 9),
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || 'user',
      createdAt: new Date()
    };
    db.users.push(newUser);
    return newUser;
  },
  matchPassword: async (enteredPassword, hashedPassword) => {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  }
};

const MockCourt = {
  find: async () => db.courts.filter(c => c.isActive),
  findById: async (id) => db.courts.find(c => c._id === id) || null,
  create: async (courtData) => {
    const newCourt = {
      _id: 'court_' + Math.random().toString(36).substr(2, 9),
      ...courtData,
      blockedSlots: [],
      isActive: true,
      createdAt: new Date()
    };
    db.courts.push(newCourt);
    return newCourt;
  },
  findByIdAndUpdate: async (id, updateData) => {
    const idx = db.courts.findIndex(c => c._id === id);
    if (idx === -1) return null;
    db.courts[idx] = { ...db.courts[idx], ...updateData };
    return db.courts[idx];
  },
  findByIdAndDelete: async (id) => {
    const idx = db.courts.findIndex(c => c._id === id);
    if (idx === -1) return null;
    const deleted = db.courts[idx];
    db.courts.splice(idx, 1);
    return deleted;
  },
  // Custom blocked slots operations helper
  addBlockedSlot: async (courtId, slotData) => {
    const court = db.courts.find(c => c._id === courtId);
    if (!court) return null;
    const newBlock = {
      _id: 'block_' + Math.random().toString(36).substr(2, 9),
      ...slotData
    };
    court.blockedSlots.push(newBlock);
    return court;
  },
  removeBlockedSlot: async (courtId, blockId) => {
    const court = db.courts.find(c => c._id === courtId);
    if (!court) return null;
    court.blockedSlots = court.blockedSlots.filter(s => s._id !== blockId);
    return court;
  }
};

const MockBooking = {
  find: async (filter = {}) => {
    let list = [...db.bookings];
    if (filter.user) {
      list = list.filter(b => b.user.toString() === filter.user.toString());
    }
    if (filter.court && filter.date && filter.status) {
      list = list.filter(b => 
        b.court.toString() === filter.court.toString() &&
        b.date === filter.date &&
        b.status === filter.status
      );
    }
    
    // Simulate population
    return list.map(b => {
      const court = db.courts.find(c => c._id === b.court) || null;
      const user = db.users.find(u => u._id === b.user) || null;
      return {
        ...b,
        court,
        user: user ? { _id: user._id, name: user.name, email: user.email } : null
      };
    });
  },
  findById: async (id) => {
    const b = db.bookings.find(x => x._id === id);
    if (!b) return null;
    const court = db.courts.find(c => c._id === b.court) || null;
    const user = db.users.find(u => u._id === b.user) || null;
    return {
      ...b,
      court,
      user,
      save: async function() {
        const idx = db.bookings.findIndex(x => x._id === this._id);
        if (idx !== -1) {
          db.bookings[idx] = {
            _id: this._id,
            user: this.user._id || this.user,
            court: this.court._id || this.court,
            date: this.date,
            startTime: this.startTime,
            endTime: this.endTime,
            duration: this.duration,
            totalPrice: this.totalPrice,
            numberOfPlayers: this.numberOfPlayers,
            shortcutUsed: this.shortcutUsed,
            status: this.status,
            refundAmount: this.refundAmount,
            refundStatus: this.refundStatus,
            cancellationTime: this.cancellationTime,
            createdAt: this.createdAt
          };
        }
        return this;
      }
    };
  },
  create: async (bookingData) => {
    const newBooking = {
      _id: 'booking_' + Math.random().toString(36).substr(2, 9),
      ...bookingData,
      status: 'confirmed',
      refundAmount: 0,
      refundStatus: 'none',
      createdAt: new Date()
    };
    db.bookings.push(newBooking);
    return newBooking;
  }
};

module.exports = { MockUser, MockCourt, MockBooking };
