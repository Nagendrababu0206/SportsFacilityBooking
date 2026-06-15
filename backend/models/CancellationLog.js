const mongoose = require('mongoose');

const CancellationLogSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.ObjectId,
    ref: 'Booking',
    required: true
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  facility: {
    type: mongoose.Schema.ObjectId,
    ref: 'Facility'
  },
  cancellationReason: {
    type: String,
    default: ''
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
  cancelledAt: {
    type: Date,
    default: Date.now
  },
  originalBookingDate: {
    type: String
  },
  originalStartTime: {
    type: String
  },
  originalEndTime: {
    type: String
  }
});

module.exports = mongoose.model('CancellationLog', CancellationLogSchema);