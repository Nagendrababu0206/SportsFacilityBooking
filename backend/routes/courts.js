const express = require('express');
const router = express.Router();
const Court = require('../models/Court');
const { MockCourt } = require('../utils/mockDb');
const { protect, authorize } = require('../middleware/auth');

// Helper to determine active DB
const dbCourt = () => process.env.MOCK_DB === 'true' ? MockCourt : Court;

// @desc    Get all courts
// @route   GET /api/courts
// @access  Public
router.get('/', async (req, res) => {
  try {
    const model = dbCourt();
    const courts = await model.find({ isActive: true });
    res.status(200).json({ success: true, count: courts.length, data: courts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get single court
// @route   GET /api/courts/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const model = dbCourt();
    const court = await model.findById(req.params.id);
    if (!court) {
      return res.status(404).json({ success: false, message: 'Court not found' });
    }
    res.status(200).json({ success: true, data: court });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create new court
// @route   POST /api/courts
// @access  Private/Admin
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const model = dbCourt();
    const court = await model.create(req.body);
    res.status(201).json({ success: true, data: court });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Update court
// @route   PUT /api/courts/:id
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const model = dbCourt();
    const court = await model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!court) {
      return res.status(404).json({ success: false, message: 'Court not found' });
    }
    res.status(200).json({ success: true, data: court });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// @desc    Delete court
// @route   DELETE /api/courts/:id
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const model = dbCourt();
    const court = await model.findByIdAndDelete(req.params.id);
    if (!court) {
      return res.status(404).json({ success: false, message: 'Court not found' });
    }
    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Block a time slot for events (Admin Only)
// @route   POST /api/courts/:id/block
// @access  Private/Admin
router.post('/:id/block', protect, authorize('admin'), async (req, res) => {
  try {
    const { date, startTime, endTime, reason } = req.body;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({ success: false, message: 'Please provide date, startTime, and endTime' });
    }

    if (process.env.MOCK_DB === 'true') {
      const court = await MockCourt.addBlockedSlot(req.params.id, { date, startTime, endTime, reason: reason || 'Event / Reservation' });
      if (!court) {
        return res.status(404).json({ success: false, message: 'Court not found' });
      }
      return res.status(200).json({ success: true, message: 'Time slot blocked successfully for events', data: court });
    }

    const court = await Court.findById(req.params.id);
    if (!court) {
      return res.status(404).json({ success: false, message: 'Court not found' });
    }

    court.blockedSlots.push({ date, startTime, endTime, reason: reason || 'Event / Reservation' });
    await court.save();

    res.status(200).json({ success: true, message: 'Time slot blocked successfully for events', data: court });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Unblock a time slot (Admin Only)
// @route   DELETE /api/courts/:id/block/:blockId
// @access  Private/Admin
router.delete('/:id/block/:blockId', protect, authorize('admin'), async (req, res) => {
  try {
    if (process.env.MOCK_DB === 'true') {
      const court = await MockCourt.removeBlockedSlot(req.params.id, req.params.blockId);
      if (!court) {
        return res.status(404).json({ success: false, message: 'Court not found' });
      }
      return res.status(200).json({ success: true, message: 'Time slot unblocked successfully', data: court });
    }

    const court = await Court.findById(req.params.id);
    if (!court) {
      return res.status(404).json({ success: false, message: 'Court not found' });
    }

    court.blockedSlots = court.blockedSlots.filter(
      slot => slot._id.toString() !== req.params.blockId
    );

    await court.save();

    res.status(200).json({ success: true, message: 'Time slot unblocked successfully', data: court });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
