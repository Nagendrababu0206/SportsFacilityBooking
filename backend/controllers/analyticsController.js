const { db, isMock } = require('../utils/db');
const { slotStatus, fmtSlot } = require('../services/analyticsService');

const findBookings = async () => {
  const Booking = db().Booking;
  if (isMock()) return Booking.find();
  return Booking.find().populate('court', 'name sport pricePerHour capacity').populate('user', 'name email');
};

// @desc    Suggest best slots per court
// @route   GET /api/analytics/suggestions
exports.getSuggestions = async (req, res) => {
  try {
    const { courtId } = req.query;
    const Court = db().Court;
    let courts = courtId ? [await Court.findById(courtId)].filter(Boolean) : await Court.find({ isActive: true });
    const allBookings = await findBookings();

    const suggestions = courts.map(court => {
      const courtIdStr = court._id.toString();
      const courtBks = allBookings.filter(b => (b.court?._id || b.court)?.toString() === courtIdStr);
      const byHour = {};
      courtBks.forEach(b => { const h = parseInt(b.startTime.split(':')[0]); byHour[h] = (byHour[h] || 0) + 1; });
      let best = { slot: '10:00 - 11:00', discount: 20, label: 'Off-Peak' };
      const peak = [], off = [];
      for (let h = 6; h < 22; h++) {
        const s = fmtSlot(h);
        const cnt = byHour[h] || 0;
        const st = cnt > 3 ? { label: 'High Usage', discount: 0, desc: 'Popular hour' } : slotStatus(h);
        if (st.label.includes('Peak') || st.label.includes('High')) peak.push(s);
        else { off.push({ slot: s, ...st, cnt }); if (cnt < (best.cnt ?? Infinity)) best = { slot: s, label: st.label, discount: st.discount, cnt }; }
      }
      return {
        courtId: court._id, courtName: court.name, sport: court.sport,
        capacity: court.capacity, pricePerHour: court.pricePerHour,
        bestSlotToBook: best.slot, bestSlotDiscount: best.discount,
        peakHoursSummary: peak, offPeakHoursSummary: off.map(o => o.slot),
        aiRecommendation: `Book ${best.slot} for best availability at ${court.name}.`
      };
    });
    res.json({ success: true, suggestions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get demand heatmap per court
// @route   GET /api/analytics/heatmap
exports.getHeatmap = async (req, res) => {
  try {
    const { courtId, date, days = '7' } = req.query;
    const Court = db().Court;
    const courts = courtId ? [await Court.findById(courtId)].filter(Boolean) : await Court.find({ isActive: true });
    const all = await findBookings();
    const reqDate = date || new Date().toISOString().split('T')[0];
    const range = Math.min(parseInt(days) || 7, 90);
    const start = new Date(reqDate); start.setDate(start.getDate() - range);
    const startStr = start.toISOString().split('T')[0];

    const heatmap = courts.map(court => {
      const idStr = court._id.toString();
      const filtered = all.filter(b => (b.court?._id || b.court)?.toString() === idStr && b.date >= startStr && b.date <= reqDate);
      const todayBks = filtered.filter(b => b.date === reqDate);
      const byHour = new Array(24).fill(0);
      todayBks.forEach(b => { for (let h = parseInt(b.startTime); h < parseInt(b.endTime) && h < 24; h++) byHour[h]++; });
      const histByHour = new Array(24).fill(0);
      filtered.forEach(b => { for (let h = parseInt(b.startTime); h < parseInt(b.endTime) && h < 24; h++) histByHour[h]++; });
      const maxD = Math.max(...byHour, 1);

      const slots = byHour.map((demand, hour) => {
        const hist = histByHour[hour] || 0;
        const r = demand / maxD;
        const level = r >= 0.75 ? 'High' : r >= 0.3 ? 'Moderate' : 'Quiet';
        return {
          hour, start: `${String(hour).padStart(2, '0')}:00`,
          end: `${String(hour + 1).padStart(2, '0')}:00`,
          label: `${String(hour).padStart(2, '0')}:00-${String(hour + 1).padStart(2, '0')}`,
          demand, level, ratio: Math.round(r * 100) / 100,
          historicalAvg: Math.round((hist / Math.max(range, 1)) * 100) / 100,
          anomaly: hist > 0 && demand / hist > 1.5,
          belowAverage: hist > 0 && demand / hist < 0.5
        };
      });
      const quiet = slots.filter(s => s.level === 'Quiet').map(s => s.label);
      const moderate = slots.filter(s => s.level === 'Moderate').map(s => s.label);
      const peakSlots = slots.filter(s => s.level === 'High').map(s => s.label);
      const bestQuiet = quiet.length ? quiet.reduce((b, c) => slots.find(s => s.label === c)?.historicalAvg < slots.find(s => s.label === b)?.historicalAvg ? c : b) : null;
      return {
        courtId: court._id, courtName: court.name, sport: court.sport,
        capacity: court.capacity, pricePerHour: court.pricePerHour,
        analysisDate: reqDate, slots, quietSlots: quiet, moderateSlots: moderate,
        peakSlots, bestQuietSlot: bestQuiet,
        dataConfidence: filtered.length < 5 ? 'Low' : filtered.length < 20 ? 'Medium' : 'High',
        insights: [], trends: []
      };
    });
    res.json({ success: true, heatmap });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// @desc    Get personal usage stats for the logged-in user
// @route   GET /api/analytics/usage
exports.getUsage = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id)?.toString();
    const all = await findBookings();
    const bookings = all.filter(b => (b.user?._id || b.user)?.toString() === userId);
    let totalSpend = 0, totalHours = 0, cancelled = 0, active = 0, refunds = 0;
    const sportUsage = { Tennis: 0, Basketball: 0, Badminton: 0, Football: 0, Squash: 0, Volleyball: 0 };
    const monthly = {};
    bookings.forEach(b => {
      if (b.status === 'confirmed') {
        active++; totalSpend += b.totalPrice || 0; totalHours += b.duration || 0;
        if (b.court?.sport) sportUsage[b.court.sport] = (sportUsage[b.court.sport] || 0) + (b.duration || 0);
        const key = (b.date || '').substring(0, 7);
        if (key) monthly[key] = (monthly[key] || 0) + (b.totalPrice || 0);
      } else { cancelled++; refunds += b.refundAmount || 0; }
    });
    res.json({
      success: true,
      data: {
        summary: { totalBookings: bookings.length, activeBookings: active, cancelledBookings: cancelled, totalSpend, totalHours, totalRefundsReceived: refunds },
        sportBreakdown: Object.entries(sportUsage).map(([sport, hours]) => ({ sport, hours })),
        monthlyTrends: Object.entries(monthly).sort(([a], [b]) => a.localeCompare(b)).map(([month, spend]) => ({ month, spend }))
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
