const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Court = require('../models/Court');
const { MockBooking, MockCourt } = require('../utils/mockDb');
const { protect } = require('../middleware/auth');

// Helpers for active database adapters
const dbBooking = () => process.env.MOCK_DB === 'true' ? MockBooking : Booking;
const dbCourt = () => process.env.MOCK_DB === 'true' ? MockCourt : Court;

// Helper to check if two slot intervals overlap
const isOverlapping = (s1, e1, s2, e2) => {
  const [h1s, m1s] = s1.split(':').map(Number);
  const [h1e, m1e] = e1.split(':').map(Number);
  const [h2s, m2s] = s2.split(':').map(Number);
  const [h2e, m2e] = e2.split(':').map(Number);

  const start1 = h1s * 60 + m1s;
  const end1 = h1e * 60 + m1e;
  const start2 = h2s * 60 + m2s;
  const end2 = h2e * 60 + m2e;

  return start1 < end2 && start2 < end1;
};

// @desc    Get user bookings or all bookings (if Admin)
// @route   GET /api/bookings
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const model = dbBooking();
    let bookings;

    if (process.env.MOCK_DB === 'true') {
      bookings = await model.find();
      if (req.user.role !== 'admin') {
        bookings = bookings.filter(b => b.user._id === req.user.id || b.user === req.user.id);
      }
      // Sort desc by date/time
      bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else {
      let query;
      if (req.user.role === 'admin') {
        query = Booking.find().populate('user', 'name email').populate('court');
      } else {
        query = Booking.find({ user: req.user.id }).populate('court');
      }
      bookings = await query.sort({ createdAt: -1 });
    }

    res.status(200).json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get booked and blocked slots for a court on a date
// @route   GET /api/bookings/slots
// @access  Public
router.get('/slots', async (req, res) => {
  try {
    const { courtId, date } = req.query;

    if (!courtId || !date) {
      return res.status(400).json({ success: false, message: 'Please specify courtId and date' });
    }

    const courtModel = dbCourt();
    const court = await courtModel.findById(courtId);
    if (!court) {
      return res.status(404).json({ success: false, message: 'Court not found' });
    }

    let bookedSlots = [];

    if (process.env.MOCK_DB === 'true') {
      const bookingModel = dbBooking();
      const bookings = await bookingModel.find();
      const courtBookings = bookings.filter(b => 
        (b.court._id === courtId || b.court === courtId) && 
        b.date === date && 
        b.status === 'confirmed'
      );
      
      bookedSlots = courtBookings.map(b => ({
        startTime: b.startTime,
        endTime: b.endTime,
        type: 'booking'
      }));
    } else {
      const bookings = await Booking.find({
        court: courtId,
        date,
        status: 'confirmed'
      });
      bookedSlots = bookings.map(b => ({
        startTime: b.startTime,
        endTime: b.endTime,
        type: 'booking'
      }));
    }

    // Find admin blocked slots for this date
    const blockedSlots = court.blockedSlots
      .filter(bs => bs.date === date)
      .map(bs => ({
        startTime: bs.startTime,
        endTime: bs.endTime,
        reason: bs.reason,
        type: 'blocked'
      }));

    const allReservedSlots = [...bookedSlots, ...blockedSlots];
    res.status(200).json({ success: true, bookedSlots: allReservedSlots });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { courtId, date, startTime, endTime, numberOfPlayers, shortcutUsed } = req.body;

    if (!courtId || !date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Missing required booking fields' });
    }

    const courtModel = dbCourt();
    const court = await courtModel.findById(courtId);
    if (!court || !court.isActive) {
      return res.status(404).json({ success: false, message: 'Court not found or inactive' });
    }

    // Capacity limit enforcement
    const playersCount = Number(numberOfPlayers) || 1;
    if (playersCount > court.capacity) {
      return res.status(400).json({
        success: false,
        message: `Capacity limit exceeded. Max capacity for ${court.name} is ${court.capacity} players.`
      });
    }

    // Calculate booking duration and price
    const [hStart, mStart] = startTime.split(':').map(Number);
    const [hEnd, mEnd] = endTime.split(':').map(Number);
    const startMinutes = hStart * 60 + mStart;
    const endMinutes = hEnd * 60 + mEnd;

    if (endMinutes <= startMinutes) {
      return res.status(400).json({ success: false, message: 'End time must be after start time' });
    }

    const duration = (endMinutes - startMinutes) / 60;
    const totalPrice = duration * court.pricePerHour;

    // Check if slot overlaps with admin blocked slots
    const eventBlocks = court.blockedSlots.filter(bs => bs.date === date);
    for (const eb of eventBlocks) {
      if (isOverlapping(startTime, endTime, eb.startTime, eb.endTime)) {
        return res.status(400).json({
          success: false,
          message: `The selected slot is blocked for an event: ${eb.reason}`
        });
      }
    }

    // Check if slot overlaps with existing bookings
    const bookingModel = dbBooking();
    if (process.env.MOCK_DB === 'true') {
      const allBookings = await bookingModel.find();
      const existingBookings = allBookings.filter(b => 
        (b.court._id === courtId || b.court === courtId) && 
        b.date === date && 
        b.status === 'confirmed'
      );
      for (const eb of existingBookings) {
        if (isOverlapping(startTime, endTime, eb.startTime, eb.endTime)) {
          return res.status(400).json({
            success: false,
            message: 'The selected slot overlaps with an existing reservation.'
          });
        }
      }
    } else {
      const existingBookings = await Booking.find({
        court: courtId,
        date,
        status: 'confirmed'
      });
      for (const eb of existingBookings) {
        if (isOverlapping(startTime, endTime, eb.startTime, eb.endTime)) {
          return res.status(400).json({
            success: false,
            message: 'The selected slot overlaps with an existing reservation.'
          });
        }
      }
    }

    // Create the booking
    let booking;
    if (process.env.MOCK_DB === 'true') {
      booking = await bookingModel.create({
        user: req.user.id || req.user._id,
        court: courtId,
        date,
        startTime,
        endTime,
        duration,
        totalPrice,
        numberOfPlayers: playersCount,
        shortcutUsed: !!shortcutUsed
      });
      // populate court info
      booking.court = court;
    } else {
      booking = await Booking.create({
        user: req.user.id,
        court: courtId,
        date,
        startTime,
        endTime,
        duration,
        totalPrice,
        numberOfPlayers: playersCount,
        shortcutUsed: !!shortcutUsed,
        status: 'confirmed'
      });
      booking = await Booking.findById(booking._id).populate('court');
    }

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Cancel a booking with refund logic
// @route   PUT /api/bookings/:id/cancel
// @access  Private
router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const bookingModel = dbBooking();
    let booking = await bookingModel.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const bookingUserId = booking.user._id ? booking.user._id.toString() : booking.user.toString();
    const reqUserId = req.user.id || req.user._id.toString();

    // Ensure user owns booking or is admin
    if (bookingUserId !== reqUserId && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Booking is already cancelled' });
    }

    // Refund logic calculation
    const bookingStartStr = `${booking.date}T${booking.startTime}:00`;
    const bookingStart = new Date(bookingStartStr);
    const now = new Date();

    const hoursDifference = (bookingStart - now) / (1000 * 60 * 60);

    let refundAmount = 0;
    let refundStatus = 'none';

    if (hoursDifference >= 24) {
      refundAmount = booking.totalPrice;
      refundStatus = 'full';
    } else if (hoursDifference >= 12) {
      refundAmount = booking.totalPrice * 0.5;
      refundStatus = 'partial';
    } else {
      refundAmount = 0;
      refundStatus = 'none';
    }

    booking.status = 'cancelled';
    booking.refundAmount = refundAmount;
    booking.refundStatus = refundStatus;
    booking.cancellationTime = now;

    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking cancelled. Refund Status: ${refundStatus} ($${refundAmount.toFixed(2)} refunded)`,
      data: booking
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
