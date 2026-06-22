import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { ArrowLeft, Calendar, ShieldCheck, Sparkles, Receipt } from 'lucide-react';
import { MotionDiv, MotionSection, fadeUp, stagger } from '../utils/animations';

const HOURS = [
  { start: '07:00', end: '08:00', label: '07:00 - 08:00' }, { start: '08:00', end: '09:00', label: '08:00 - 09:00' },
  { start: '09:00', end: '10:00', label: '09:00 - 10:00' }, { start: '10:00', end: '11:00', label: '10:00 - 11:00' },
  { start: '11:00', end: '12:00', label: '11:00 - 12:00' }, { start: '12:00', end: '13:00', label: '12:00 - 13:00' },
  { start: '13:00', end: '14:00', label: '13:00 - 14:00' }, { start: '14:00', end: '15:00', label: '14:00 - 15:00' },
  { start: '15:00', end: '16:00', label: '15:00 - 16:00' }, { start: '16:00', end: '17:00', label: '16:00 - 17:00' },
  { start: '17:00', end: '18:00', label: '17:00 - 18:00' }, { start: '18:00', end: '19:00', label: '18:00 - 19:00' },
  { start: '19:00', end: '20:00', label: '19:00 - 20:00' }, { start: '20:00', end: '21:00', label: '20:00 - 21:00' },
  { start: '21:00', end: '22:00', label: '21:00 - 22:00' }
];

function parseTime(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export default function BookingPage() {
  const { courtId } = useParams();
  const navigate = useNavigate();
  const [court, setCourt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [numberOfPlayers, setNumberOfPlayers] = useState(2);
  const [heatmap, setHeatmap] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const token = localStorage.getItem('token');

  useEffect(() => { fetchCourt(); }, []);
  useEffect(() => { if (courtId && selectedDate) { fetchSlots(); fetchHeatmap(); setSelectedSlot(null); } }, [courtId, selectedDate]);

  const fetchCourt = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/courts/${courtId}`);
      const data = await res.json();
      if (data.success) setCourt(data.data);
      else setError('Court not found.');
    } catch { setError('Connection failed.'); }
    finally { setLoading(false); }
  };

  const fetchSlots = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/slots?courtId=${courtId}&date=${selectedDate}`);
      const data = await res.json();
      if (data.success) setBookedSlots(data.bookedSlots || []);
    } catch { setBookedSlots([]); }
  };

  const fetchHeatmap = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/analytics/heatmap?courtId=${courtId}&date=${selectedDate}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setHeatmap(data.success && data.heatmap?.[0] ? data.heatmap[0] : null);
    } catch { setHeatmap(null); }
  };

  const getSlotStatus = (start, end) => {
    const s = parseTime(start), e = parseTime(end);
    for (const bs of bookedSlots) {
      const bS = parseTime(bs.startTime), bE = parseTime(bs.endTime);
      if (s < bE && bS < e) return bs.type;
    }
    return 'available';
  };

  const handleBook = async () => {
    if (!selectedSlot) { setError('Select a time slot.'); return; }
    if (!token) { navigate('/login'); return; }
    setBookingLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ courtId, date: selectedDate, startTime: selectedSlot.start, endTime: selectedSlot.end, numberOfPlayers })
      });
      const data = await res.json();
      if (data.success) { setSuccessMsg('Booking confirmed!'); setTimeout(() => navigate('/dashboard'), 1500); }
      else setError(data.message || 'Booking failed.');
    } catch { setError('Could not process booking.'); }
    finally { setBookingLoading(false); }
  };

  if (loading) return <div className="page-loader"><div className="loader-ring" /></div>;
  if (!court) return <div className="container" style={{ padding: '4rem', textAlign: 'center' }}><h2>Court not found</h2><button onClick={() => navigate('/')} className="btn btn-secondary"><ArrowLeft size={16} /> Back</button></div>;

  return (
    <div className="container" style={{ padding: '3rem 2rem 5rem' }}>
      <MotionDiv variants={fadeUp} initial="initial" animate="animate">
        <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ marginBottom: '2rem' }}><ArrowLeft size={16} /> Back to Venues</button>
      </MotionDiv>
      <div className="grid-2">
        <MotionDiv variants={fadeUp} initial="initial" animate="animate" className="glass-panel" style={{ padding: '1.5rem' }}>
          <div style={{ position: 'relative', height: '280px', borderRadius: '12px', overflow: 'hidden', marginBottom: '1rem' }}>
            <img src={court.imageUrl || 'https://placehold.co/800x520?text=Court'} alt={court.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <span className="court-badge">{court.sport}</span>
          </div>
          <h1 style={{ fontSize: '2rem' }}>{court.name}</h1>
          <p style={{ color: 'var(--text-secondary)', margin: '0.5rem 0 1rem' }}>{court.description}</p>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1rem', marginTop: '1rem' }}>
            <h3 style={{ color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}><ShieldCheck size={18} style={{ verticalAlign: 'middle' }} /> Rules</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {court.rules.map((r, i) => <li key={i} style={{ marginBottom: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>✓ {r}</li>)}
            </ul>
          </div>
        </MotionDiv>

        <MotionSection
          initial="initial" animate="animate"
          variants={stagger}
          className="glass-panel" style={{ padding: '1.5rem' }}
        >
          <MotionDiv variants={fadeUp}><h2 style={{ marginBottom: '1.5rem' }}><Calendar className="gradient-text" size={24} style={{ verticalAlign: 'middle' }} /> Select Date & Time</h2></MotionDiv>
          {error && <MotionDiv variants={fadeUp} className="alert-card"><span>{error}</span></MotionDiv>}
          {successMsg && <MotionDiv variants={fadeUp} style={{ borderLeft: '4px solid var(--success)', padding: '1rem', background: 'rgba(16,185,129,0.05)', borderRadius: '8px', marginBottom: '1rem' }}>{successMsg}</MotionDiv>}

          <MotionDiv variants={fadeUp} className="form-group">
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={selectedDate} min={new Date().toISOString().substring(0, 10)}
              onChange={e => setSelectedDate(e.target.value)} />
          </MotionDiv>

          <MotionDiv variants={fadeUp} style={{ marginBottom: '1rem' }}>
            <label className="form-label">Available Slots (7AM - 10PM)</label>
            <div className="slots-grid">
              {HOURS.map(h => {
                const status = getSlotStatus(h.start, h.end);
                const sel = selectedSlot?.start === h.start;
                return (
                  <div key={h.start} onClick={() => { if (status === 'available') { setSelectedSlot(h); setError(''); } }}
                    className={`slot-chip ${sel ? 'selected' : ''} ${status === 'booked' ? 'booked' : ''} ${status === 'blocked' ? 'blocked' : ''}`}>
                    {h.start}<div style={{ fontSize: '0.65rem', opacity: 0.8 }}>{status === 'blocked' ? 'Event' : status === 'booked' ? 'Booked' : 'Open'}</div>
                  </div>
                );
              })}
            </div>
          </MotionDiv>

          {heatmap?.slots && (
            <MotionDiv variants={fadeUp} className="heatmap" style={{ marginBottom: '1rem' }}>
              <div className="heatmap-header"><span className="heatmap-title"><Sparkles size={18} /> Demand Heatmap</span></div>
              <div style={{ padding: '0.85rem' }}>
                {[['Morning', [6, 7, 8, 9, 10, 11], '🌅'], ['Afternoon', [12, 13, 14, 15, 16], '☀️'], ['Evening', [17, 18, 19, 20, 21], '🌆']].map(([label, hrs, icon]) => {
                  const slots = heatmap.slots.filter(s => hrs.includes(s.hour));
                  if (!slots.length) return null;
                  const max = Math.max(...slots.map(s => s.demand || 0), 1);
                  return (
                    <div key={label} style={{ marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>{icon} {label}</div>
                      {slots.map(s => {
                        const w = Math.max(((s.demand || 0) / max) * 100, 8);
                        const lvl = (s.level || '').toLowerCase();
                        const c = lvl === 'high' ? 'rgba(248,113,113,0.85)' : lvl === 'moderate' ? 'rgba(251,191,36,0.85)' : 'rgba(16,185,129,0.85)';
                        return (
                          <div key={s.hour} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem', fontSize: '0.85rem' }}>
                            <span style={{ width: '70px', fontWeight: 600 }}>{s.start}</span>
                            <div style={{ flex: 1, height: '8px', borderRadius: '999px', background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                              <div style={{ width: `${w}%`, height: '100%', borderRadius: '999px', background: c }} />
                            </div>
                            <span style={{ width: '60px', textAlign: 'right', color: 'var(--text-secondary)' }}>{s.demand > 0 ? `${s.demand} booked` : 'Open'}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
                <div className="heatmap-legend">
                  <span className="heatmap-legend-dot quiet" /> Quiet
                  <span className="heatmap-legend-dot moderate" /> Moderate
                  <span className="heatmap-legend-dot high" /> High
                </div>
              </div>
            </MotionDiv>
          )}

          <MotionDiv variants={fadeUp} className="form-group">
            <label className="form-label">Players</label>
            <input type="number" className="form-input" value={numberOfPlayers} min="1" max={court.capacity}
              onChange={e => setNumberOfPlayers(Math.min(court.capacity, Math.max(1, parseInt(e.target.value) || 1)))} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Max {court.capacity} players</span>
          </MotionDiv>

          {selectedSlot && (
            <MotionDiv variants={fadeUp} style={{ background: 'rgba(79,172,254,0.05)', border: '1px solid rgba(79,172,254,0.15)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem' }}>
              <h4 style={{ marginBottom: '0.5rem', color: '#fff' }}><Receipt size={16} style={{ verticalAlign: 'middle' }} /> Booking Summary</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <span>{court.name} — 1 hour</span><span>${court.pricePerHour}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem', color: '#fff', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span>Total</span><span className="gradient-text">${court.pricePerHour}</span>
              </div>
            </MotionDiv>
          )}

          <MotionDiv variants={fadeUp}>
            <button onClick={handleBook} disabled={!selectedSlot || bookingLoading} className="btn btn-primary" style={{ width: '100%', padding: '1rem', fontSize: '1.1rem' }}>
              {bookingLoading ? 'Booking...' : 'Confirm Booking'}
            </button>
          </MotionDiv>
        </MotionSection>
      </div>
    </div>
  );
}