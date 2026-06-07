import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { ArrowLeft, Calendar, ShieldCheck, ShieldAlert, Sparkles, Receipt, Zap, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function BookingPage() {
  const { courtId } = useParams();
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);

  const [court, setCourt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Scheduling States
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10));
  const [bookedSlots, setBookedSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null); // format: { start, end, label }
  const [numberOfPlayers, setNumberOfPlayers] = useState(2);
  
  // Payment & Submission States
  const [showUpiModal, setShowUpiModal] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const formatINR = (value) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  // Define full operating slots (07:00 to 22:00)
  const availableHours = [
    { start: '07:00', end: '08:00', label: '07:00 - 08:00 AM' },
    { start: '08:00', end: '09:00', label: '08:00 - 09:00 AM' },
    { start: '09:00', end: '10:00', label: '09:00 - 10:00 AM' },
    { start: '10:00', end: '11:00', label: '10:00 - 11:00 AM' },
    { start: '11:00', end: '12:00', label: '11:00 - 12:00 PM' },
    { start: '12:00', end: '13:00', label: '12:00 - 01:00 PM' },
    { start: '13:00', end: '14:00', label: '01:00 - 02:00 PM' },
    { start: '14:00', end: '15:00', label: '02:00 - 03:00 PM' },
    { start: '15:00', end: '16:00', label: '03:00 - 04:00 PM' },
    { start: '16:00', end: '17:00', label: '04:00 - 05:00 PM' },
    { start: '17:00', end: '18:00', label: '05:00 - 06:00 PM' },
    { start: '18:00', end: '19:00', label: '06:00 - 07:00 PM' },
    { start: '19:00', end: '20:00', label: '07:00 - 08:00 PM' },
    { start: '20:00', end: '21:00', label: '08:00 - 09:00 PM' },
    { start: '21:00', end: '22:00', label: '09:00 - 10:00 PM' }
  ];

  useEffect(() => {
    fetchCourtDetails();
  }, [courtId]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    if (courtId && selectedDate) {
      fetchBookedAndBlockedSlots();
      setSelectedSlot(null);
    }
  }, [courtId, selectedDate, token, navigate]);

  const fetchCourtDetails = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/courts/${courtId}`);
      const data = await res.json();
      if (data.success) {
        setCourt(data.data);
      } else {
        setError('Facility details not found.');
      }
    } catch (err) {
      setError('Could not connect to database.');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookedAndBlockedSlots = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/slots?courtId=${courtId}&date=${selectedDate}`);
      const data = await res.json();
      if (data.success) {
        setBookedSlots(data.bookedSlots);
      }
    } catch (err) {
      console.error('Error fetching slots:', err);
    }
  };

  // Helper check status of a specific hourly slot
  const getSlotStatus = (start, end) => {
    const parseTime = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    
    const sMinutes = parseTime(start);
    const eMinutes = parseTime(end);

    for (const bs of bookedSlots) {
      const bsStart = parseTime(bs.startTime);
      const bsEnd = parseTime(bs.endTime);
      
      if (sMinutes < bsEnd && bsStart < eMinutes) {
        return bs.type === 'blocked' ? 'blocked' : 'booked';
      }
    }
    return 'available';
  };

  const handlePrePaymentCheck = (e) => {
    e.preventDefault();
    if (!token) {
      navigate('/login');
      return;
    }
    if (!selectedSlot) {
      setError('Please select a time slot first.');
      return;
    }
    if (numberOfPlayers > court.capacity) {
      setError(`Capacity Limit Enforcement: A maximum of ${court.capacity} players can book this facility.`);
      return;
    }
    
    setError('');
    // Open payment modal
    setShowUpiModal(true);
  };

  const handleBookingSubmit = async () => {
    setBookingLoading(true);
    setError('');
    
    try {
      const res = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          courtId,
          date: selectedDate,
          startTime: selectedSlot.start,
          endTime: selectedSlot.end,
          numberOfPlayers
        })
      });

      const data = await res.json();
      if (data.success) {
        setShowUpiModal(false);
        setSuccessMsg(`Reservation Confirmed! Slot successfully booked.`);
        setTimeout(() => navigate('/dashboard'), 2000);
      } else {
        setError(data.message || 'Failed to complete reservation.');
        setShowUpiModal(false);
      }
    } catch (err) {
      setError('Could not process slot reservation.');
      setShowUpiModal(false);
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <div style={{ width: '40px', height: '40px', border: '4px solid var(--bg-tertiary)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
      </div>
    );
  }

  if (!court) {
    return (
      <div className="container" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        <h2>Facility not found</h2>
        <button onClick={() => navigate('/')} className="btn btn-secondary" style={{ marginTop: '1.5rem' }}>
          <ArrowLeft size={16} /> Back to Facilities
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '3rem 2rem 5rem 2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button onClick={() => navigate('/')} className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Facilities
        </button>
        <button 
          onClick={() => {
            navigator.clipboard.writeText(window.location.href);
            alert('Facility link copied to clipboard!');
          }} 
          className="btn btn-outline" 
          style={{ padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <span style={{ fontSize: '1.1rem' }}>🔗</span> Share Facility
        </button>
      </div>

      <div className="grid-2">
        {/* Left Side: Court Details, Rules and Photos */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ position: 'relative', height: '280px', borderRadius: '12px', overflow: 'hidden' }}>
            <img
              src={court.imageUrl || "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=800"}
              alt={court.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <span className="court-badge">{court.sport}</span>
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{court.name}</h1>
              <span style={{ fontSize: '0.9rem', background: 'rgba(255,180,123,0.1)', color: 'var(--accent-pink)', padding: '4px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 'bold' }}>
                ⭐ 4.9
              </span>
            </div>
            <div style={{ display: 'flex', gap: '15px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                ⛅ Ideal Conditions
              </span>
              <span>•</span>
              <span>128 verified reviews</span>
            </div>
            <p style={{ color: 'var(--text-secondary)' }}>{court.description}</p>
          </div>

          <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '1.2rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.8rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={18} /> Facility Rules & Requirements
            </h3>
            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
              {court.rules.map((rule, idx) => (
                <li key={idx} style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--accent-cyan)', fontWeight: 'bold' }}>✓</span>
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          <div style={{ background: 'rgba(255, 126, 95, 0.05)', border: '1px solid rgba(255, 126, 95, 0.2)', borderRadius: '12px', padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ShieldAlert style={{ color: 'var(--accent-orange)' }} size={24} />
            <div>
              <h4 style={{ color: '#fff', fontSize: '0.95rem' }}>Capacity Limits Strictly Enforced</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Maximum occupancy for this court is <strong>{court.capacity} players</strong>. Bookings exceeding this count will be blocked.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Native Interactive Booking Engine */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.8rem' }}>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar className="gradient-text" size={24} />
            <span>Select Date & Time</span>
          </h2>

          {error && (
            <div style={{ borderLeft: '4px solid var(--danger)', display: 'flex', alignItems: 'center', gap: '10px', padding: '1rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>{error}</span>
            </div>
          )}

          {successMsg && (
            <div style={{ borderLeft: '4px solid var(--success)', display: 'flex', alignItems: 'center', gap: '10px', padding: '1rem', background: 'rgba(16, 185, 129, 0.05)', borderRadius: '8px' }}>
              <span style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: 'bold' }}>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handlePrePaymentCheck} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Reservation Date</label>
              <input
                type="date"
                className="form-input"
                value={selectedDate}
                min={new Date().toISOString().substring(0, 10)}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Available Slots</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Operating: 07:00 AM - 10:00 PM</span>
              </label>

              <div className="slots-grid">
                {availableHours.map((hour, idx) => {
                  const status = getSlotStatus(hour.start, hour.end);
                  const isSelected = selectedSlot && selectedSlot.start === hour.start;

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        if (status === 'available') {
                          setSelectedSlot(hour);
                          setError('');
                        }
                      }}
                      className={`slot-chip ${isSelected ? 'selected' : ''} ${status === 'booked' ? 'booked' : ''} ${status === 'blocked' ? 'blocked' : ''}`}
                      title={status === 'blocked' ? 'Blocked by admin for event' : status === 'booked' ? 'Already booked' : 'Available'}
                    >
                      {hour.start}
                      <div style={{ fontSize: '0.65rem', fontWeight: 'normal', opacity: 0.8, marginTop: '2px' }}>
                        {status === 'blocked' ? 'Event' : status === 'booked' ? 'Booked' : 'Open'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Number of Expected Players</label>
              <input
                type="number"
                className="form-input"
                value={numberOfPlayers}
                min="1"
                max={court.capacity}
                onChange={(e) => setNumberOfPlayers(Math.min(court.capacity, Math.max(1, parseInt(e.target.value) || 1)))}
                required
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.4rem' }}>
                Must be between 1 and {court.capacity} players.
              </span>
            </div>

            {selectedSlot && (
              <div style={{ background: 'rgba(79, 172, 254, 0.05)', border: '1px solid rgba(79, 172, 254, 0.15)', padding: '1.2rem', borderRadius: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', marginBottom: '0.6rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Receipt size={16} /> Estimated Fees & Rates
                </h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.3rem' }}>
                  <span>Base Booking (1 hour)</span>
                  <span>{formatINR(court.pricePerHour)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1rem', color: '#fff', marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <span>Total Amount</span>
                  <span className="gradient-text">{formatINR(court.pricePerHour)}</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={!selectedSlot}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '1rem', padding: '1rem', fontSize: '1.1rem' }}
            >
              Secure Booking & Pay
            </button>
          </form>
        </div>
      </div>

      {/* Payment Gateway Modal */}
      {showUpiModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
          <div className="glass-panel" style={{ 
            width: '100%', maxWidth: '420px', padding: '2.5rem 2rem', 
            position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center',
            border: '1px solid rgba(0, 242, 254, 0.3)', boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          }}>
            {!bookingLoading && (
              <button 
                onClick={() => setShowUpiModal(false)}
                style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            )}
            
            <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Zap size={24} className="gradient-text" /> Finalize Payment
            </h3>
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '1.5rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
              Scan the precise QR code below using any UPI app (Google Pay, PhonePe, Paytm). The slot is reserved ONLY after payment is completed.
            </p>
            
            <div style={{ background: '#fff', padding: '20px', borderRadius: '16px', marginBottom: '1.5rem', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
              <QRCodeSVG 
                value={`upi://pay?pa=sportsbooking@upi&pn=${encodeURIComponent('Premium Sports Booking')}&am=${(court.pricePerHour || 250).toFixed(0)}&cu=INR`} 
                size={220} 
                level="H" 
              />
            </div>

            <div style={{ fontSize: '1.8rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#fff' }}>
              Amount: <span className="gradient-text">{formatINR(court.pricePerHour)}</span>
            </div>

            <button 
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1.1rem', opacity: bookingLoading ? 0.7 : 1 }}
              onClick={handleBookingSubmit}
              disabled={bookingLoading}
            >
              {bookingLoading ? 'Processing & Locking Slot...' : 'I Have Paid - Complete Booking'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
