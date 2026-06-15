const mongoose = require('mongoose');

const BlockedSlotSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true
  },
  startTime: {
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    default: 'Maintenance / Event'
  }
});

const FacilitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a facility name'],
    unique: true
  },
  sport: {
    type: String,
    required: [true, 'Please specify the sport'],
    enum: ['Tennis', 'Basketball', 'Badminton', 'Football', 'Squash', 'Volleyball']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  pricePerHour: {
    type: Number,
    required: [true, 'Please specify hourly booking price']
  },
  capacity: {
    type: Number,
    required: [true, 'Please specify max capacity limit'],
    default: 4
  },
  location: {
    lat: { type: Number, default: 0 },
    lng: { type: Number, default: 0 },
    address: { type: String, default: '' }
  },
  imageUrl: {
    type: String,
    default: ''
  },
  rules: {
    type: [String],
    default: []
  },
  blockedSlots: {
    type: [BlockedSlotSchema],
    default: []
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Facility', FacilitySchema);