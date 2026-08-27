const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { getUsers, getCourts, getBookings, getSummary } = require('../controllers/adminController');

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/users', getUsers);
router.get('/courts', getCourts);
router.get('/bookings', getBookings);
router.get('/summary', getSummary);

module.exports = router;
