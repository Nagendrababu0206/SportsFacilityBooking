const mongoose = require('mongoose');

const BlockedSlotSchema = new mongoose.Schema({
  date: {
    type: String, // YYYY-MM-DD
    required: true
  },
  startTime: {
    type: String, // HH:MM
    required: true
  },
  endTime: {
    type: String, // HH:MM
    required: true
  },
  reason: {
    type: String,
    default: 'Maintenance / Event'
  }
});

const CourtSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a court name'],
    unique: true
  },
  sport: {
    type: String,
    required: [true, 'Please specify the sport'],
    enum: ['Tennis', 'Basketball', 'Badminton', 'Football', 'Squash', 'Volleyball', 'Cricket']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  pricePerHour: {
    type: Number,
    required: [true, 'Please specify hourly booking price']
  },
  imageUrl: {
    type: String,
    default: ''
  },
  rules: {
    type: [String],
    default: []
  },
  capacity: {
    type: Number,
    required: [true, 'Please specify max capacity limit'],
    default: 4
  },
  blockedSlots: {
    type: [BlockedSlotSchema],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    address: { type: String, default: '' }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Court', CourtSchema);
