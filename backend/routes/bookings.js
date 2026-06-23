const express = require('express');
const { protect } = require('../middleware/auth');
const { db, isMock } = require('../utils/db');

const router = express.Router();

const findBookings = async () => {
  const Booking = db().Booking;
  if (isMock()) return Booking.find();
  return Booking.find()
    .populate('court', 'name sport pricePerHour capacity')
    .populate('user', 'name email')
    .sort({ createdAt: -1 });
};

const findBookingById = async (id) => {
  const Booking = db().Booking;
  if (isMock()) return Booking.findById(id);
  return Booking.findById(id)
    .populate('court', 'name sport pricePerHour capacity')
    .populate('user', 'name email');
};

const overlap = (s1, e1, s2, e2) => {
  const toM = (t) => t.split(':').reduce((h, m) => h * 60 + Number(m), 0);
  return toM(s1) < toM(e2) && toM(s2) < toM(e1);
};

router.get('/', protect, async (req, res) => {
  try {
    let bookings = await findBookings();
    if (req.user.role !== 'admin') {
      const userId = (req.user._id || req.user.id)?.toString();
      bookings = bookings.filter(b => (b.user?._id || b.user)?.toString() === userId);
    }
    bookings.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/slots', async (req, res) => {
  try {
    const { courtId, date } = req.query;
    if (!courtId || !date) return res.status(400).json({ success: false, message: 'courtId and date required' });
    const Court = db().Court;
    const court = await Court.findById(courtId);
    if (!court) return res.status(404).json({ success: false, message: 'Court not found' });
    const allBookings = await findBookings();
    const courtBookings = allBookings.filter(b =>
      (b.court?._id || b.court)?.toString() === courtId && b.date === date && b.status === 'confirmed'
    );
    const booked = courtBookings.map(b => ({ startTime: b.startTime, endTime: b.endTime, type: 'booking' }));
    const blocked = (court.blockedSlots || []).filter(bs => bs.date === date).map(bs => ({
      startTime: bs.startTime, endTime: bs.endTime, reason: bs.reason, type: 'blocked'
    }));
    res.json({ success: true, bookedSlots: [...booked, ...blocked] });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { courtId, date, startTime, endTime, numberOfPlayers } = req.body;
    if (!courtId || !date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const Court = db().Court;
    const court = await Court.findById(courtId);
    if (!court?.isActive) return res.status(404).json({ success: false, message: 'Court not found or inactive' });
    const players = Number(numberOfPlayers) || 1;
    if (players > court.capacity) {
      return res.status(400).json({ success: false, message: `Max capacity is ${court.capacity} players` });
    }
    const dur = (endTime.split(':').reduce((h, m) => h * 60 + Number(m), 0) - startTime.split(':').reduce((h, m) => h * 60 + Number(m), 0)) / 60;
    if (dur <= 0) return res.status(400).json({ success: false, message: 'End time must be after start time' });
    const price = dur * court.pricePerHour;
    for (const bs of court.blockedSlots || []) {
      if (bs.date === date && overlap(startTime, endTime, bs.startTime, bs.endTime)) {
        return res.status(400).json({ success: false, message: `Slot blocked: ${bs.reason}` });
      }
    }
    const existing = await findBookings();
    for (const eb of existing.filter(b => (b.court?._id || b.court)?.toString() === courtId && b.date === date && b.status === 'confirmed')) {
      if (overlap(startTime, endTime, eb.startTime, eb.endTime)) {
        return res.status(400).json({ success: false, message: 'Slot overlaps with existing booking' });
      }
    }
    const Booking = db().Booking;
    const booking = await Booking.create({
      user: req.user._id || req.user.id, court: courtId, date, startTime, endTime, duration: dur,
      totalPrice: price, numberOfPlayers: players, shortcutUsed: false
    });
    res.status(201).json({ success: true, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/cancel', protect, async (req, res) => {
  try {
    const booking = await findBookingById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: 'Booking not found' });
    const userId = (booking.user?._id || booking.user)?.toString();
    if (userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ success: false, message: 'Not authorized' });
    }
    if (booking.status === 'cancelled') return res.status(400).json({ success: false, message: 'Already cancelled' });
    const start = new Date(`${booking.date}T${booking.startTime}:00`);
    const hoursDiff = (start - new Date()) / (1000 * 60 * 60);
    let refund = hoursDiff >= 24 ? booking.totalPrice : hoursDiff >= 12 ? booking.totalPrice * 0.5 : 0;
    let refundStatus = hoursDiff >= 24 ? 'full' : hoursDiff >= 12 ? 'partial' : 'none';
    booking.status = 'cancelled';
    booking.refundAmount = refund;
    booking.refundStatus = refundStatus;
    booking.cancellationTime = new Date();
    await booking.save();
    res.json({ success: true, message: `Cancelled. Refund: ${refundStatus} ($${refund.toFixed(2)})`, data: booking });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
