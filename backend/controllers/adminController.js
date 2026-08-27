const { db, isMock } = require('../utils/db');

const findUsers = async () => {
  const User = db().User;
  if (isMock()) return User.find();
  return User.find().select('-password').sort({ createdAt: -1 });
};

// @desc    Get all users
// @route   GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const users = await findUsers();
    const data = users.map(u => ({
      id: u._id, name: u.name, email: u.email, role: u.role,
      interests: u.interests || [], feedback: u.feedback || [],
      createdAt: u.createdAt, lastLoginAt: u.lastLoginAt || null,
      feedbackCount: (u.feedback || []).length
    }));
    res.json({ success: true, count: data.length, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all courts (incl. inactive)
// @route   GET /api/admin/courts
exports.getCourts = async (req, res) => {
  try {
    const courts = await db().Court.find();
    res.json({ success: true, count: courts.length, data: courts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all bookings
// @route   GET /api/admin/bookings
exports.getBookings = async (req, res) => {
  try {
    const Booking = db().Booking;
    const bookings = await (isMock()
      ? Booking.find()
      : Booking.find()
          .populate('court', 'name sport pricePerHour capacity')
          .populate('user', 'name email')
          .sort({ createdAt: -1 }));
    res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get admin summary counts
// @route   GET /api/admin/summary
exports.getSummary = async (req, res) => {
  try {
    const [users, courts, bookings] = await Promise.all([
      findUsers(),
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
};
