const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { db } = require('../utils/db');

const router = express.Router();

router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await db().User.find();
    const data = users.map(u => ({
      id: u._id, name: u.name, email: u.email, role: u.role,
      interests: u.interests || [], feedback: u.feedback || [],
      createdAt: u.createdAt, feedbackCount: (u.feedback || []).length
    }));
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/courts', protect, authorize('admin'), async (req, res) => {
  try {
    const courts = await db().Court.find();
    res.json({ success: true, count: courts.length, data: courts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/bookings', protect, authorize('admin'), async (req, res) => {
  try {
    const Booking = db().Booking;
    const bookings = await Booking.find();
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/summary', protect, authorize('admin'), async (req, res) => {
  try {
    const [users, courts, bookings] = await Promise.all([
      db().User.find(),
      db().Court.find(),
      db().Booking.find()
    ]);
    res.json({
      success: true,
      data: {
        users: users.length,
        courts: courts.length,
        activeCourts: courts.filter(c => c.isActive).length,
        bookings: bookings.length,
        confirmedBookings: bookings.filter(b => b.status === 'confirmed').length,
        cancelledBookings: bookings.filter(b => b.status === 'cancelled').length
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
