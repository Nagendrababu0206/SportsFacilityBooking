const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const rateLimit = require('express-rate-limit');

// Only load .env if the file exists (Render uses environment variables directly)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const connectDB = require('./config/db');
const { isMock } = require('./utils/db');
const app = express();

app.use(cors());
app.options('*', cors());
app.use(express.json());

// ── Rate Limiting ────────────────────────────────────────────────────────────
// General API limit: 200 requests per 15 minutes per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please wait and try again.' }
});

// Auth limit: 10 attempts per 15 minutes (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many login attempts. Please wait 15 minutes.' }
});

app.use('/api/', apiLimiter);
app.use('/api/auth', authLimiter);

app.use('/api/auth', require('./routes/auth'));
app.use('/api/courts', require('./routes/courts'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/admin', require('./routes/admin'));
app.get('/', (req, res) => res.json({ message: 'Sports Facility Booking API' }));
app.get('/health', (req, res) => res.json({ status: 'ok', mock: isMock() }));

const PORT = process.env.PORT || 5001;

const start = async () => {
  try {
    await connectDB();
    console.log('Database mode:', isMock() ? 'mock (in-memory)' : 'MongoDB');
  } catch (err) {
    console.error('Failed to start:', err.message);
    process.exit(1);
  }

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${server.address().port}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the process using it, then restart the backend on ${PORT}.`);
      process.exit(1);
    } else {
      console.error(`Failed to start on port ${PORT}: ${err.message}`);
      process.exit(1);
    }
  });
};
start();
