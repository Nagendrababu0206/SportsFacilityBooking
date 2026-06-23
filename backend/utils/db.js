const { MockUser, MockCourt, MockBooking } = require('./mockDb');
const User = require('../models/User');
const Court = require('../models/Court');
const Booking = require('../models/Booking');

let mockDbMode = !process.env.MONGODB_URI && process.env.MOCK_DB === 'true';

const setMockDbMode = (value) => {
  mockDbMode = Boolean(value);
  process.env.MOCK_DB = mockDbMode ? 'true' : 'false';
};

const isMock = () => mockDbMode;

const db = () => ({
  User: isMock() ? MockUser : User,
  Court: isMock() ? MockCourt : Court,
  Booking: isMock() ? MockBooking : Booking
});

module.exports = { db, isMock, setMockDbMode };
