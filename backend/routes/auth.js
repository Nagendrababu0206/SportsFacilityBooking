const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { MockUser } = require('../utils/mockDb');
const { protect } = require('../middleware/auth');

// Helper to determine active DB
const dbUser = () => process.env.MOCK_DB === 'true' ? MockUser : User;

// Helper to generate and return token response
const sendTokenResponse = (user, statusCode, res) => {
  // Create token
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'super_secret_sports_facility_booking_key_123!@#',
    { expiresIn: '30d' }
  );

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    const model = dbUser();

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const userExists = await model.findOne({ email: normalizedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email' });
    }

    const username = normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ').trim() || 'SportSync User';

    const user = await model.create({
      name: username,
      email: normalizedEmail,
      password,
      role: 'user'
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const model = dbUser();

    // Validate email & password
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    console.log(`🔐 [LOGIN] Attempting login for email: ${normalizedEmail}`);

    let user;
    if (process.env.MOCK_DB === 'true') {
      user = await model.findOne({ email: normalizedEmail });
      console.log(`🔐 [MOCK_DB] User found: ${user ? 'Yes' : 'No'}`);
    } else {
      user = await User.findOne({ email: normalizedEmail }).select('+password');
      console.log(`🔐 [MongoDB] User found: ${user ? 'Yes' : 'No'}`);
    }

    if (!user) {
      console.log(`❌ [LOGIN] User not found with email: ${normalizedEmail}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Check if password matches
    let isMatch;
    if (process.env.MOCK_DB === 'true') {
      isMatch = await model.matchPassword(password, user.password);
      console.log(`🔐 [MOCK_DB] Password match: ${isMatch}`);
    } else {
      isMatch = await user.matchPassword(password);
      console.log(`🔐 [MongoDB] Password match: ${isMatch}`);
    }

    if (!isMatch) {
      console.log(`❌ [LOGIN] Password mismatch for email: ${normalizedEmail}`);
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    console.log(`✅ [LOGIN] Successful login for email: ${normalizedEmail}`);
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error(`❌ [LOGIN ERROR]: ${error.message}`);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const model = dbUser();
    const user = await model.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
