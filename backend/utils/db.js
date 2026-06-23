const { MockUser, MockCourt, MockBooking } = require('./mockDb');

const isMock = () => process.env.MOCK_DB === 'true';

const db = () => ({
  User: MockUser,
  Court: MockCourt,
  Booking: MockBooking
});

module.exports = { db, isMock };
