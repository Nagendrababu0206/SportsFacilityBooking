const mongoose = require('mongoose');

const UsageStatsSchema = new mongoose.Schema({
  facility: {
    type: mongoose.Schema.ObjectId,
    ref: 'Facility',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: [true, 'Please specify the date']
  },
  totalBookings: {
    type: Number,
    default: 0
  },
  totalHours: {
    type: Number,
    default: 0
  },
  totalRevenue: {
    type: Number,
    default: 0
  },
  occupancyRate: {
    type: Number,
    default: 0
  },
  peakHours: [{
    startTime: String,
    endTime: String,
    bookingCount: Number
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('UsageStats', UsageStatsSchema);