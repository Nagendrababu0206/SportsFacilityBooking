const { db } = require('../utils/db');

// ── In-memory court cache (60s TTL) ─────────────────────────────────────────
// Courts are read on every Venues page load but rarely change.
// Caching eliminates redundant DB queries for all concurrent users.
let _courtCache = null;
let _courtCacheTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

const bustCourtCache = () => { _courtCache = null; _courtCacheTime = 0; };

const Court = () => db().Court;

// @desc    Find courts near a location
// @route   GET /api/courts/near
exports.getNear = async (req, res) => {
  try {
    const { lat, lng, radius = 5 } = req.query;
    if (!lat || !lng) {
      return res.status(400).json({ success: false, message: 'lat and lng query parameters required' });
    }
    const toRad = (value) => (value * Math.PI) / 180;
    const haversine = (lat1, lng1, lat2, lng2) => {
      const R = 6371; // Earth radius km
      const dLat = toRad(lat2 - lat1);
      const dLng = toRad(lng2 - lng1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };
    const courts = await Court().find({ isActive: true });
    const filtered = courts.filter(c => {
      const d = haversine(parseFloat(lat), parseFloat(lng), c.location.lat, c.location.lng);
      return d <= parseFloat(radius);
    });
    res.json({ success: true, count: filtered.length, data: filtered });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get all active courts
// @route   GET /api/courts
exports.getCourts = async (req, res) => {
  try {
    // Serve from cache if fresh (within 60 seconds)
    if (_courtCache && Date.now() - _courtCacheTime < CACHE_TTL_MS) {
      return res.json({ success: true, count: _courtCache.length, data: _courtCache, cached: true });
    }
    const courts = await Court().find({ isActive: true });
    _courtCache = courts;
    _courtCacheTime = Date.now();
    res.json({ success: true, count: courts.length, data: courts, cached: false });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get a single court
// @route   GET /api/courts/:id
exports.getCourt = async (req, res) => {
  try {
    const court = await Court().findById(req.params.id);
    if (!court) return res.status(404).json({ success: false, message: 'Court not found' });
    res.json({ success: true, data: court });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Create a court
// @route   POST /api/courts
exports.createCourt = async (req, res) => {
  try {
    const court = await Court().create(req.body);
    bustCourtCache(); // invalidate cache after new court added
    res.status(201).json({ success: true, data: court });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Update a court
// @route   PUT /api/courts/:id
exports.updateCourt = async (req, res) => {
  try {
    const court = await Court().findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!court) return res.status(404).json({ success: false, message: 'Court not found' });
    bustCourtCache(); // invalidate cache after update
    res.json({ success: true, data: court });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Delete a court
// @route   DELETE /api/courts/:id
exports.deleteCourt = async (req, res) => {
  try {
    const court = await Court().findByIdAndDelete(req.params.id);
    if (!court) return res.status(404).json({ success: false, message: 'Court not found' });
    bustCourtCache(); // invalidate cache after delete
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Block a slot on a court
// @route   POST /api/courts/:id/block
exports.blockSlot = async (req, res) => {
  try {
    const { date, startTime, endTime, reason } = req.body;
    if (!date || !startTime || !endTime) return res.status(400).json({ success: false, message: 'Provide date, startTime, endTime' });
    const court = await Court().findById(req.params.id);
    if (!court) return res.status(404).json({ success: false, message: 'Court not found' });
    court.blockedSlots.push({ date, startTime, endTime, reason: reason || 'Event' });
    await court.save();
    res.json({ success: true, message: 'Slot blocked', data: court });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Unblock a slot on a court
// @route   DELETE /api/courts/:id/block/:blockId
exports.unblockSlot = async (req, res) => {
  try {
    const court = await Court().findById(req.params.id);
    if (!court) return res.status(404).json({ success: false, message: 'Court not found' });
    court.blockedSlots = (court.blockedSlots || []).filter(slot => slot._id.toString() !== req.params.blockId);
    await court.save();
    res.json({ success: true, message: 'Slot unblocked', data: court });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
