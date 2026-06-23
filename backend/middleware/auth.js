const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { MockUser } = require('../utils/mockDb');
const { isMock } = require('../utils/db');

const getModel = () => isMock() ? MockUser : User;
const SECRET = process.env.JWT_SECRET || 'sfb_secret_2024';

const protect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  try {
    const decoded = jwt.verify(auth.split(' ')[1], SECRET);
    req.user = await getModel().findById(decoded.id);
    if (!req.user) return res.status(401).json({ success: false, message: 'User not found' });
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Role '${req.user.role}' not authorized` });
  }
  next();
};

module.exports = { protect, authorize };
