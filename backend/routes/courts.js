const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const { db } = require('../utils/db');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const Court = db().Court;
    const courts = await Court.find({ isActive: true });
    res.json({ success: true, count: courts.length, data: courts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const court = await db().Court.findById(req.params.id);
    if (!court) return res.status(404).json({ success: false, message: 'Court not found' });
    res.json({ success: true, data: court });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const court = await db().Court.create(req.body);
    res.status(201).json({ success: true, data: court });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const court = await db().Court.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!court) return res.status(404).json({ success: false, message: 'Court not found' });
    res.json({ success: true, data: court });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const court = await db().Court.findByIdAndDelete(req.params.id);
    if (!court) return res.status(404).json({ success: false, message: 'Court not found' });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/block', protect, authorize('admin'), async (req, res) => {
  try {
    const { date, startTime, endTime, reason } = req.body;
    if (!date || !startTime || !endTime) return res.status(400).json({ success: false, message: 'Provide date, startTime, endTime' });
    const Court = db().Court;
    const court = await Court.addBlockedSlot(req.params.id, { date, startTime, endTime, reason: reason || 'Event' });
    if (!court) return res.status(404).json({ success: false, message: 'Court not found' });
    res.json({ success: true, message: 'Slot blocked', data: court });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id/block/:blockId', protect, authorize('admin'), async (req, res) => {
  try {
    const Court = db().Court;
    const court = await Court.removeBlockedSlot(req.params.id, req.params.blockId);
    if (!court) return res.status(404).json({ success: false, message: 'Court not found' });
    res.json({ success: true, message: 'Slot unblocked', data: court });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;