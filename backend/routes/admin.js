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

module.exports = router;