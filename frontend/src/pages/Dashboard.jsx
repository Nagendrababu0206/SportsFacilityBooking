import React, { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BarChart2, Calendar, Clock, DollarSign, Plus, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { token, user } = useContext(AuthContext);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  const [analytics, setAnalytics] = useState(null);
  const [interests, setInterests] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);

  const formatINR = (value) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  const deriveInterests = (sportBreakdown = []) => {
    const interestSports = [...sportBreakdown]
      .filter((item) => item.hours > 0)
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 3);

    return interestSports.map((item) => ({
      sport: item.sport,
      hours: item.hours,
      description: `You have spent ${item.hours.toFixed(1)} hrs playing ${item.sport}. Explore more ${item.sport} slots and improve your game.`
    }));
  };

  const [error, setError] = useState('');
  const [blockCourtId, setBlockCourtId] = useState('');
  const [blockDate, setBlockDate] = useState(new Date().toISOString().substring(0, 10));
  const [blockStart, setBlockStart] = useState('09:00');
  const [blockEnd, setBlockEnd] = useState('12:00');
  const [blockReason, setBlockReason] = useState('Campus Sports Event');
  const [adminSuccess, setAdminSuccess] = useState('');

  useEffect(() => {
    if (token) {
      fetchDashboardData();
      if (user?.role === 'admin') {
        fetchCourts();
      }
    }
  }, [token, user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const resBookings = await fetch('http://localhost:5000/api/bookings', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataBookings = await resBookings.json();

      const resAnalytics = await fetch('http://localhost:5000/api/analytics/usage', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataAnalytics = await resAnalytics.json();

      if (dataBookings.success && dataAnalytics.success) {
        setBookings(dataBookings.data);
        setAnalytics(dataAnalytics.data);
        setInterests(deriveInterests(dataAnalytics.data.sportBreakdown));
      } else {
        setError('Failed to load dashboard data.');
      }
    } catch (err) {
      setError('Could not connect to the dashboard service.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCourts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/courts');
      const data = await res.json();
      if (data.success) {
        setCourts(data.data);
        if (data.data.length > 0) setBlockCourtId(data.data[0]._id);
      }
    } catch (err) {
      console.error('Error fetching courts:', err);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    const confirmed = window.confirm(
      'Cancellation policy:\n' +
      '24 hours or more: 100% refund\n' +
      '12 hours or more: 50% refund\n' +
      'Less than 12 hours: no refund\n\n' +
      'Are you sure you want to cancel this booking?'
    );

    if (!confirmed) return;

    try {
      const res = await fetch(`http://localhost:5000/api/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message || 'Booking cancelled successfully.');
        fetchDashboardData();
      } else {
        alert(data.message || 'Could not cancel booking.');
      }
    } catch (err) {
      alert('Could not cancel the booking. Please try again.');
    }
  };

  const handleAdminBlockSubmit = async (event) => {
    event.preventDefault();
    if (!blockCourtId) return;

    setAdminSuccess('');
    setError('');

    try {
      const res = await fetch(`http://localhost:5000/api/courts/${blockCourtId}/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          date: blockDate,
          startTime: blockStart,
          endTime: blockEnd,
          reason: blockReason
        })
      });

      const data = await res.json(); 
      if (data.success) {
        setAdminSuccess('Slot blocked successfully. Students will not be able to reserve it.');
        setBlockReason('Campus Sports Event');
        fetchDashboardData();
      } else {
        setError(data.message || 'Failed to block slot.');
      }
    } catch (err) {
      setError('Could not update the venue schedule.');
    }
  };

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-ring"></div>
      </div>
    );
  }

  return (
    <div className="container dashboard-page">
      <div className="dashboard-header">
        <div>
          <span className="eyebrow">Account workspace</span>
          <h1>Dashboard</h1>
          <p>Manage reservations, refunds, and usage from one organized view.</p>
        </div>
        <button onClick={fetchDashboardData} className="btn btn-secondary">
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="alert-card">
          <span>{error}</span>
        </div>
      )}

      {analytics && (
        <>
          <div className="stats-container">
            <StatCard icon={<Calendar size={16} />} label="Total Bookings" value={analytics.summary.totalBookings} hint={`${analytics.summary.activeBookings} active, ${analytics.summary.cancelledBookings} cancelled`} />
            <StatCard icon={<Clock size={16} />} label="Hours Played" value={`${analytics.summary.totalHours.toFixed(1)} hrs`} hint="Across confirmed court slots" />
            <StatCard icon={<DollarSign size={16} />} label="Total Spend" value={formatINR(analytics.summary.totalSpend)} hint="Calculated hourly charges" />
            <StatCard icon={<RefreshCw size={16} />} label="Refunds" value={formatINR(analytics.summary.totalRefundsReceived)} hint="Recovered from cancellations" />
          </div>

          <div className="grid-2 dashboard-charts">
            <ChartPanel title="Hours Played per Sport" icon={<BarChart2 size={18} />}>
              {analytics.sportBreakdown.map((item) => {
                const maxHours = Math.max(...analytics.sportBreakdown.map((sport) => sport.hours), 1);
                return (
                  <ChartRow key={item.sport} label={item.sport} value={`${item.hours.toFixed(1)}h`} width={(item.hours / maxHours) * 100} />
                );
              })}
            </ChartPanel>

            <ChartPanel title="Monthly Spending" icon={<DollarSign size={18} />}>
              {analytics.monthlyTrends.length === 0 ? (
                <div className="empty-state">Book a court to generate spending insights.</div>
              ) : (
                analytics.monthlyTrends.map((trend) => {
                  const maxSpend = Math.max(...analytics.monthlyTrends.map((item) => item.spend), 1);
                  return (
                    <ChartRow key={trend.month} label={trend.month} value={formatINR(trend.spend)} width={(trend.spend / maxSpend) * 100} />
                  );
                })
              )}
            </ChartPanel>
          </div>

          <section className="glass-panel interest-panel">
            <div className="panel-heading">
              <Sparkles size={20} />
              <div>
                <h2>My Interests</h2>
                <p>Based on your recent bookings and most-played sports.</p>
              </div>
            </div>
            {interests.length === 0 ? (
              <div className="empty-state">No interest data yet. Book a court to see personalized recommendations here.</div>
            ) : (
              <div className="interest-grid">
                {interests.map((interest) => (
                  <div key={interest.sport} className="glass-panel interest-card">
                    <h3>{interest.sport}</h3>
                    <p>{interest.description}</p>
                    <span className="muted-text">{interest.hours.toFixed(1)} hrs booked</span>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}

      {user?.role === 'admin' && (
        <section className="glass-panel admin-panel">
          <div className="panel-heading">
            <ShieldAlert size={20} />
            <div>
              <h2>Admin Slot Control</h2>
              <p>Block court availability for events, maintenance, or tournaments.</p>
            </div>
          </div>

          {adminSuccess && <div className="success-card">{adminSuccess}</div>}

          <form onSubmit={handleAdminBlockSubmit} className="admin-form">
            <label className="form-group">
              <span className="form-label">Facility</span>
              <select className="form-input" value={blockCourtId} onChange={(event) => setBlockCourtId(event.target.value)} required>
                {courts.map((court) => (
                  <option key={court._id} value={court._id}>{court.name} ({court.sport})</option>
                ))}
              </select>
            </label>
            <label className="form-group">
              <span className="form-label">Date</span>
              <input type="date" className="form-input" value={blockDate} onChange={(event) => setBlockDate(event.target.value)} required />
            </label>
            <label className="form-group">
              <span className="form-label">Start Time</span>
              <input type="text" className="form-input" value={blockStart} onChange={(event) => setBlockStart(event.target.value)} required />
            </label>
            <label className="form-group">
              <span className="form-label">End Time</span>
              <input type="text" className="form-input" value={blockEnd} onChange={(event) => setBlockEnd(event.target.value)} required />
            </label>
            <label className="form-group">
              <span className="form-label">Reason</span>
              <input type="text" className="form-input" value={blockReason} onChange={(event) => setBlockReason(event.target.value)} required />
            </label>
            <button type="submit" className="btn btn-primary">
              <Plus size={16} />
              Block Slot
            </button>
          </form>
        </section>
      )}

      <section className="glass-panel reservations-panel">
        <div className="panel-heading">
          <Calendar size={20} />
          <div>
            <h2>Reservation History</h2>
            <p>Active, cancelled, and completed court bookings.</p>
          </div>
        </div>

        {bookings.length === 0 ? (
          <div className="empty-state">No reservations found. Open Venues to book your first court.</div>
        ) : (
          <div className="booking-table-wrapper">
            <table className="booking-table">
              <thead>
                <tr>
                  <th>Facility</th>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Players</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Refund</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => {
                  const isUpcoming = new Date(`${booking.date}T${booking.startTime}:00`) > new Date();

                  return (
                    <tr key={booking._id}>
                      <td>
                        <strong>{booking.court ? booking.court.name : 'Unknown Court'}</strong>
                        <span>{booking.court ? booking.court.sport : ''}</span>
                      </td>
                      <td>{booking.date}</td>
                      <td>{booking.startTime} - {booking.endTime}</td>
                      <td>{booking.numberOfPlayers}</td>
                      <td>{formatINR(booking.totalPrice)}</td>
                      <td><span className={`status-badge ${booking.status}`}>{booking.status}</span></td>
                      <td>{booking.status === 'cancelled' ? booking.refundStatus : 'N/A'}</td>
                      <td>
                        {booking.status === 'confirmed' && isUpcoming ? (
                          <button onClick={() => handleCancelBooking(booking._id)} className="btn btn-danger">
                            Cancel
                          </button>
                        ) : (
                          <span className="muted-text">{booking.status === 'cancelled' ? 'Cancelled' : 'Completed'}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon, label, value, hint }) {
  return (
    <div className="glass-panel stat-widget">
      <div className="stat-header">
        <span>{label}</span>
        {icon}
      </div>
      <div className="stat-value">{value}</div>
      <div className="stat-hint">{hint}</div>
    </div>
  );
}

function ChartPanel({ title, icon, children }) {
  return (
    <div className="glass-panel chart-container">
      <h3 className="chart-title">
        {icon}
        <span>{title}</span>
      </h3>
      <div className="chart-bar-group">{children}</div>
    </div>
  );
}

function ChartRow({ label, value, width }) {
  return (
    <div className="chart-bar-row">
      <span className="chart-label">{label}</span>
      <div className="chart-progress-bg">
        <div className="chart-progress-fill" style={{ width: `${Math.max(width, 5)}%` }}></div>
      </div>
      <span className="chart-val">{value}</span>
    </div>
  );
}
