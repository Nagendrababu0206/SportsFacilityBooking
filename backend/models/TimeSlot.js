const mongoose = require('mongoose');

const TimeSlotSchema = new mongoose.Schema({
  facility: {
    type: mongoose.Schema.ObjectId,
    ref: 'Facility',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: [true, 'Please specify the date']
  },
  startTime: {
    type: String, // HH:MM
    required: [true, 'Please specify start time']
  },
  endTime: {
    type: String, // HH:MM
    required: [true, 'Please specify end time']
  },
  isAvailable: {
    type: Boolean,
    default: true
  },
  isBlocked: {
    type: Boolean,
    default: false
  },
  blockReason: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TimeSlot', TimeSlotSchema);