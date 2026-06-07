const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  court: {
    type: mongoose.Schema.ObjectId,
    ref: 'Court',
    required: true
  },
  date: {
    type: String, // YYYY-MM-DD
    required: [true, 'Please specify the booking date']
  },
  startTime: {
    type: String, // HH:MM
    required: [true, 'Please specify start time']
  },
  endTime: {
    type: String, // HH:MM
    required: [true, 'Please specify end time']
  },
  duration: {
    type: Number, // in hours
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  numberOfPlayers: {
    type: Number,
    required: [true, 'Please specify the number of players for capacity enforcement'],
    default: 1
  },
  shortcutUsed: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['confirmed', 'cancelled'],
    default: 'confirmed'
  },
  refundAmount: {
    type: Number,
    default: 0
  },
  refundStatus: {
    type: String,
    enum: ['none', 'partial', 'full'],
    default: 'none'
  },
  cancellationTime: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Booking', BookingSchema);
