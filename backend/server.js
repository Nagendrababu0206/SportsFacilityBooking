const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

// Only load .env if the file exists (Render uses environment variables directly)
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const connectDB = require('./config/db');
const app = express();

const corsOrigin = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(s => s.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({ origin: corsOrigin, credentials: true }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/courts', require('./routes/courts'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => res.json({ message: 'Sports Facility Booking API' }));
app.get('/health', (req, res) => res.json({ status: 'ok', mock: !!process.env.MOCK_DB }));

const PORT = parseInt(process.env.PORT, 10) || 10000;

const start = async () => {
  try {
    await connectDB();
    console.log('MOCK_DB:', process.env.MOCK_DB || 'true');
  } catch (err) {
    console.log('DB error, starting without DB:', err.message);
  }
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};
start();