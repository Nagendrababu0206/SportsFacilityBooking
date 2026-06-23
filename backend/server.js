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
const { isMock } = require('./utils/db');
const app = express();

app.use(cors());
app.options('*', cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/courts', require('./routes/courts'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/admin', require('./routes/admin'));

app.get('/', (req, res) => res.json({ message: 'Sports Facility Booking API' }));
app.get('/health', (req, res) => res.json({ status: 'ok', mock: isMock() }));

const PORT = parseInt(process.env.PORT, 10) || 10000;
const MAX_PORT_RETRIES = 3;
const PORT_RETRY_DELAY = 1000;

const start = async () => {
  try {
    await connectDB();
    console.log('Database mode:', isMock() ? 'mock (in-memory)' : 'MongoDB');
  } catch (err) {
    console.error('Failed to start:', err.message);
    process.exit(1);
  }

  const tryListen = (attempt = 0) => {
    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE' && attempt < MAX_PORT_RETRIES) {
        console.log(`Port ${PORT} in use, retrying in ${PORT_RETRY_DELAY}ms (${attempt + 1}/${MAX_PORT_RETRIES})...`);
        setTimeout(() => tryListen(attempt + 1), PORT_RETRY_DELAY);
      } else {
        console.error(`Failed to start on port ${PORT}: ${err.message}`);
        process.exit(1);
      }
    });
  };

  tryListen();
};
start();
