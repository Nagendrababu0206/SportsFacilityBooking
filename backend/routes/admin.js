const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { MockUser } = require('../utils/mockDb');
const { protect, authorize } = require('../middleware/auth');

const dbUser = () => process.env.MOCK_DB === 'true' ? MockUser : User;

// Get all users with interests and feedback (admin only)
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    let users = await dbUser().find();
    if (process.env.MOCK_DB === 'true') {
      users = users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        interests: u.interests || [],
        feedback: u.feedback || [],
        createdAt: u.createdAt,
        feedbackCount: u.feedback ? u.feedback.length : 0
      }));
    } else {
      users = users.map(u => ({
        id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        interests: u.interests || [],
        feedback: u.feedback || [],
        createdAt: u.createdAt,
        feedbackCount: u.feedback ? u.feedback.length : 0
      }));
    }
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;