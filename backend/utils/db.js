const { MockUser, MockCourt, MockBooking } = require('./mockDb');
const User = require('../models/User');
const Court = require('../models/Court');
const Booking = require('../models/Booking');

const isMock = () => process.env.MOCK_DB === 'true';

const db = () => ({
  User: isMock() ? MockUser : User,
  Court: isMock() ? MockCourt : Court,
  Booking: isMock() ? MockBooking : Booking
});

module.exports = { db, isMock };