const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { MockUser } = require('../utils/mockDb');
const { protect } = require('../middleware/auth');
const passport = require('passport');

// Helper to determine active DB
const dbUser = () => process.env.MOCK_DB === 'true' ? MockUser : User;

// Helper to generate and return token response
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

// Helper to generate and return token response for OAuth
const sendOAuthTokenResponse = (user, res, redirectUrl) => {
  const token = jwt.sign(
    { id: user._id },
    process.env.JWT_SECRET || 'super_secret_sports_facility_booking_key_123!@#',
    { expiresIn: '30d' }
  );

  const userData = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
  };

  res.redirect(`${redirectUrl}?token=${token}&user=${encodeURIComponent(JSON.stringify(userData))}`);
};

const oauthCallbackHandler = (req, res) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  if (!req.user) {
    return res.redirect(`${clientUrl}/login?error=oauth_failed`);
  }
  const redirectUrl = clientUrl;
  const model = dbUser();
  model.findOne({ email: req.user.email }).then(user => {
    if (!user) {
      return model.create({
        name: req.user.name,
        email: req.user.email,
        password: 'oauth',
        role: 'user'
      }).then(newUser => {
        sendOAuthTokenResponse(newUser, res, redirectUrl);
      });
    }
    sendOAuthTokenResponse(user, res, redirectUrl);
  }).catch(error => {
    res.redirect(`${redirectUrl}/login?error=${encodeURIComponent(error.message)}`);
  });
};

// @desc    Google OAuth
// @route   GET /api/auth/google
// @access  Public
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @desc    Google OAuth callback
// @route   GET /api/auth/google/callback
// @access  Public
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login?error=oauth_failed', session: false }),
  oauthCallbackHandler
);

// @desc    GitHub OAuth
// @route   GET /api/auth/github
// @access  Public
router.get('/github', passport.authenticate('github', { scope: ['user:email'] }));

// @desc    GitHub OAuth callback
// @route   GET /api/auth/github/callback
// @access  Public
router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: 'http://localhost:5173/login?error=oauth_failed', session: false }),
  oauthCallbackHandler
);

module.exports = router;