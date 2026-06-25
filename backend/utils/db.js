const { MockUser, MockCourt, MockBooking } = require('./mockDb');
const User = require('../models/User');
const Court = require('../models/Court');
const Booking = require('../models/Booking');

const isMock = () => process.env.MOCK_DB === 'true';

const db = () => {
  if (isMock()) {
    return {
      User: MockUser,
      Court: MockCourt,
      Booking: MockBooking
    };
  }
  return {
    User,
    Court,
    Booking
  };
};

module.exports = { db, isMock };
