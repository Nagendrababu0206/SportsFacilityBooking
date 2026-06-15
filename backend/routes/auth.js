const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { MockUser } = require('../utils/mockDb');
const { protect } = require('../middleware/auth');

const dbUser = () => process.env.MOCK_DB === 'true' ? MockUser : User;

const sendTokenResponse = (user, statusCode, res) => {
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

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const model = dbUser();

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    let user;
    if (process.env.MOCK_DB === 'true') {
      user = await model.findOne({ email: normalizedEmail });
    } else {
      user = await User.findOne({ email: normalizedEmail }).select('+password');
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    let isMatch;
    if (process.env.MOCK_DB === 'true') {
      isMatch = await model.matchPassword(password, user.password);
    } else {
      isMatch = await user.matchPassword(password);
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/me', protect, async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;