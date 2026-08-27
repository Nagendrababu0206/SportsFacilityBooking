// ── Pure analytics computation helpers (no DB) ───────────────────────────────

// Return pricing/demand bucket for a given hour
const slotStatus = (h) => {
  if (h >= 16 && h < 21) return { label: 'Peak', discount: 0, desc: 'High demand' };
  if ((h >= 7 && h < 10) || (h >= 21 && h < 22)) return { label: 'Moderate', discount: 10, desc: 'Good availability' };
  return { label: 'Off-Peak', discount: 20, desc: 'Super saver' };
};

const fmtHour = (h) => String(h).padStart(2, '0') + ':00';

// Format a full hourly slot range, e.g. "08:00 - 09:00"
const fmtSlot = (h) => `${fmtHour(h)} - ${fmtHour(h + 1)}`;

module.exports = { slotStatus, fmtHour, fmtSlot };
