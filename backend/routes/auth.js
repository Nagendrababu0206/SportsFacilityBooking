const express = require('express');
const jwt = require('jsonwebtoken');
const { protect } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();
const SECRET = process.env.JWT_SECRET || 'sfb_secret_2024';

const sendToken = (user, status, res) => {
  const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: '30d' });
  res.status(status).json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
};

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const normalized = email.trim().toLowerCase();
    if (await User.findOne({ email: normalized })) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const name = normalized.split('@')[0].replace(/[^a-zA-Z0-9]/g, ' ') || 'User';
    const user = await User.create({ name, email: normalized, password, role: 'user' });
    sendToken(user, 201, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email and password required' });
    const normalized = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalized }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    const match = await user.matchPassword(password);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid credentials' });
    sendToken(user, 200, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/me', protect, (req, res) => {
  res.json({ success: true, user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role } });
});

module.exports = router;
