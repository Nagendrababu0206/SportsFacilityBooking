// ── Business logic helpers shared across controllers ─────────────────────────

// Time-only "HH:MM" -> minutes since midnight
const toMinutes = (time) => time.split(':').reduce((h, m) => h * 60 + Number(m), 0);

// Duration in hours between two "HH:MM" times
const durationHours = (startTime, endTime) =>
  (toMinutes(endTime) - toMinutes(startTime)) / 60;

// Do two [start,end] time ranges overlap?
const overlap = (s1, e1, s2, e2) => toMinutes(s1) < toMinutes(e2) && toMinutes(s2) < toMinutes(e1);

// Dynamic hourly pricing multiplier based on start hour
const getPriceMultiplier = (startStr) => {
  const h = parseInt(startStr.split(':')[0], 10);
  if (h >= 16 && h < 21) return 1.0;   // Peak hours: 4 PM - 9 PM (100% price)
  if ((h >= 7 && h < 10) || (h >= 21 && h < 22)) return 0.9; // Moderate: 10% off
  return 0.8; // Off-Peak / Weak hours: 20% off
};

// Compute total price for a booking
const computePrice = (courtPricePerHour, startTime, endTime) => {
  const dur = durationHours(startTime, endTime);
  return dur * courtPricePerHour * getPriceMultiplier(startTime);
};

// Compute refund based on cancellation policy
const computeRefund = ({ role, booking, now = new Date() }) => {
  const start = new Date(`${booking.date}T${booking.startTime}:00`);
  const hoursDiff = (start - now) / (1000 * 60 * 60);

  if (role === 'admin') {
    return { refund: booking.totalPrice, refundStatus: 'full' };
  }
  if (hoursDiff >= 12) {
    return { refund: booking.totalPrice, refundStatus: 'full' };
  }
  if (hoursDiff >= 6) {
    return { refund: booking.totalPrice * 0.5, refundStatus: 'partial' };
  }
  return { refund: 0, refundStatus: 'none' };
};

module.exports = { toMinutes, durationHours, overlap, getPriceMultiplier, computePrice, computeRefund };
