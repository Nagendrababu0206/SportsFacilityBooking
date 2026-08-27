const jwt = require('jsonwebtoken');
const { db } = require('../utils/db');

const SECRET = process.env.JWT_SECRET || 'sfb_secret_2024';

// ── protect: verify JWT and attach user from token payload (no DB hit) ────────
const protect = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  try {
    // Trust the JWT payload — id, role, name are embedded at login time
    // This avoids a DB round-trip on every single API request
    const decoded = jwt.verify(auth.split(' ')[1], SECRET);
    req.user = {
      _id:   decoded.id,
      id:    decoded.id,
      name:  decoded.name,
      email: decoded.email,
      role:  decoded.role
    };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

// ── adminProtect: same as protect BUT does a fresh DB lookup (used for ─────────
//    sensitive admin mutations to ensure role hasn't changed since token issued)
const adminProtect = async (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Not authorized' });
  }
  try {
    const decoded = jwt.verify(auth.split(' ')[1], SECRET);
    const User = db().User;
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Not authorized' });
  }
};

// ── authorize: role-based access guard ───────────────────────────────────────
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: `Role '${req.user.role}' not authorized` });
  }
  next();
};

module.exports = { protect, adminProtect, authorize };
