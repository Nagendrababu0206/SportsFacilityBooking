import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { BarChart2, Calendar, Clock, DollarSign, Plus, RefreshCw, ShieldAlert, Sparkles } from 'lucide-react';
import { MotionDiv, MotionSection, fadeUp, stagger } from '../utils/animations';

export default function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [bookings, setBookings] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [interests, setInterests] = useState([]);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blockCourtId, setBlockCourtId] = useState('');
  const [blockDate, setBlockDate] = useState(new Date().toISOString().substring(0, 10));
  const [blockStart, setBlockStart] = useState('09:00');
  const [blockEnd, setBlockEnd] = useState('12:00');
  const [adminSuccess, setAdminSuccess] = useState('');

  const getStoredUser = () => {
    try { const u = JSON.parse(atob(token.split('.')[1])); return u; } catch { return null; }
  };
  const decoded = getStoredUser();

  useEffect(() => {
    if (!token) { navigate('/login'); return; }
    fetchData();
    fetch(`${API_BASE_URL}/api/courts`).then(r => r.json()).then(d => {
      if (d.success) { setCourts(d.data); if (d.data.length) setBlockCourtId(d.data[0]._id); }
    }).catch(() => {});
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bRes, aRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/bookings`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE_URL}/api/analytics/usage`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const bData = await bRes.json(), aData = await aRes.json();
      if (bData.success && aData.success) {
        setBookings(bData.data);
        setAnalytics(aData.data);
        const sportBreakdown = aData.data.sportBreakdown || [];
        const top = sportBreakdown.filter(s => s.hours > 0).sort((a, b) => b.hours - a.hours).slice(0, 3);
        setInterests(top.map(s => ({ sport: s.sport, hours: s.hours, desc: `${s.hours.toFixed(1)} hrs playing ${s.sport}` })));
      } else setError('Failed to load data.');
    } catch { setError('Connection failed.'); }
    finally { setLoading(false); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this booking? Refund depends on cancellation policy.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/bookings/${id}/cancel`, {
        method: 'PUT', headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) { alert(data.message); fetchData(); }
      else alert(data.message);
    } catch { alert('Cancel failed.'); }
  };

  const handleBlock = async (e) => {
    e.preventDefault();
    setError(''); setAdminSuccess('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/courts/${blockCourtId}/block`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ date: blockDate, startTime: blockStart, endTime: blockEnd, reason: 'Campus Event' })
      });
      const data = await res.json();
      if (data.success) { setAdminSuccess('Slot blocked.'); fetchData(); }
      else setError(data.message);
    } catch { setError('Failed to block.'); }
  };

  if (loading) return <div className="page-loader"><div className="loader-ring" /></div>;

  return (
    <MotionSection
      className="container dashboard-page"
      initial="initial" animate="animate"
      variants={stagger}
    >
      <MotionDiv variants={fadeUp} className="dashboard-header">
        <div><span className="eyebrow">Account workspace</span><h1>Dashboard</h1><p>Manage reservations, refunds, and usage.</p></div>
        <button onClick={fetchData} className="btn btn-secondary"><RefreshCw size={14} /> Refresh</button>
      </MotionDiv>

      {error && <MotionDiv variants={fadeUp} className="alert-card"><span>{error}</span></MotionDiv>}

      {analytics && (
        <>
          <MotionDiv variants={fadeUp} className="stats-container">
            <StatCard icon={<Calendar size={16} />} label="Total Bookings" value={analytics.summary.totalBookings} hint={`${analytics.summary.activeBookings} active, ${analytics.summary.cancelledBookings} cancelled`} />
            <StatCard icon={<Clock size={16} />} label="Hours Played" value={`${analytics.summary.totalHours.toFixed(1)}h`} hint="Across confirmed slots" />
            <StatCard icon={<DollarSign size={16} />} label="Total Spend" value={`$${analytics.summary.totalSpend.toFixed(0)}`} hint="Hourly charges" />
            <StatCard icon={<RefreshCw size={16} />} label="Refunds" value={`$${analytics.summary.totalRefundsReceived.toFixed(0)}`} hint="From cancellations" />
          </MotionDiv>

          <MotionDiv variants={fadeUp} className="grid-2 dashboard-charts">
            <ChartPanel title="Hours per Sport" icon={<BarChart2 size={18} />}>
              {(analytics.sportBreakdown || []).map(s => {
                const max = Math.max(...analytics.sportBreakdown.map(x => x.hours), 1);
                return <ChartRow key={s.sport} label={s.sport} value={`${s.hours.toFixed(1)}h`} width={(s.hours / max) * 100} />;
              })}
            </ChartPanel>
            <ChartPanel title="Monthly Spending" icon={<DollarSign size={18} />}>
              {(analytics.monthlyTrends || []).length === 0 ? <div className="empty-state">Book a court to see trends.</div> :
                analytics.monthlyTrends.map(t => {
                  const max = Math.max(...analytics.monthlyTrends.map(x => x.spend), 1);
                  return <ChartRow key={t.month} label={t.month} value={`$${t.spend.toFixed(0)}`} width={(t.spend / max) * 100} />;
                })
              }
            </ChartPanel>
          </MotionDiv>

          {interests.length > 0 && (
            <MotionDiv variants={fadeUp}>
              <section className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <div className="panel-heading"><Sparkles size={20} /><div><h2>My Interests</h2><p>Based on your bookings.</p></div></div>
                <div className="interest-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                  {interests.map(i => (
                    <div key={i.sport} className="glass-panel" style={{ padding: '1rem' }}>
                      <h3>{i.sport}</h3><p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{i.desc}</p>
                      <span className="muted-text">{i.hours.toFixed(1)} hrs</span>
                    </div>
                  ))}
                </div>
              </section>
            </MotionDiv>
          )}
        </>
      )}

      {decoded?.role === 'admin' && (
        <MotionDiv variants={fadeUp}>
          <section className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
            <div className="panel-heading"><ShieldAlert size={20} /><div><h2>Admin Slot Control</h2><p>Block courts for events.</p></div></div>
            {adminSuccess && <div className="success-card">{adminSuccess}</div>}
            <form onSubmit={handleBlock} className="admin-form">
              <label className="form-group"><span className="form-label">Court</span>
                <select className="form-input" value={blockCourtId} onChange={e => setBlockCourtId(e.target.value)}>
                  {courts.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </label>
              <label className="form-group"><span className="form-label">Date</span><input type="date" className="form-input" value={blockDate} onChange={e => setBlockDate(e.target.value)} /></label>
              <label className="form-group"><span className="form-label">Start</span><input type="text" className="form-input" value={blockStart} onChange={e => setBlockStart(e.target.value)} /></label>
              <label className="form-group"><span className="form-label">End</span><input type="text" className="form-input" value={blockEnd} onChange={e => setBlockEnd(e.target.value)} /></label>
              <button type="submit" className="btn btn-primary"><Plus size={16} /> Block Slot</button>
            </form>
          </section>
        </MotionDiv>
      )}

      <MotionDiv variants={fadeUp}>
        <section className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="panel-heading"><Calendar size={20} /><div><h2>Reservation History</h2><p>All your court bookings.</p></div></div>
          {bookings.length === 0 ? <div className="empty-state">No reservations. Book a court first.</div> : (
            <div className="booking-table-wrapper">
              <table className="booking-table">
                <thead><tr><th>Facility</th><th>Date</th><th>Time</th><th>Players</th><th>Total</th><th>Status</th><th>Refund</th><th>Action</th></tr></thead>
                <tbody>
                  {bookings.map(b => {
                    const upcoming = new Date(`${b.date}T${b.startTime}:00`) > new Date();
                    return (
                      <tr key={b._id}>
                        <td><strong>{b.court?.name || 'Court'}</strong><span>{b.court?.sport || ''}</span></td>
                        <td>{b.date}</td><td>{b.startTime} - {b.endTime}</td>
                        <td>{b.numberOfPlayers}</td><td>${b.totalPrice?.toFixed(0)}</td>
                        <td><span className={`status-badge ${b.status}`}>{b.status}</span></td>
                        <td>{b.status === 'cancelled' ? b.refundStatus : 'N/A'}</td>
                        <td>{b.status === 'confirmed' && upcoming ? <button onClick={() => handleCancel(b._id)} className="btn btn-danger">Cancel</button> : <span className="muted-text">{b.status === 'cancelled' ? 'Cancelled' : 'Completed'}</span>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </MotionDiv>
    </MotionSection>
  );
}

function StatCard({ icon, label, value, hint }) {
  return (
    <div className="glass-panel stat-widget"><div className="stat-header"><span>{label}</span>{icon}</div>
      <div className="stat-value">{value}</div><div className="stat-hint">{hint}</div>
    </div>
  );
}

function ChartPanel({ title, icon, children }) {
  return (
    <div className="glass-panel chart-container">
      <h3 className="chart-title">{icon}<span>{title}</span></h3>
      <div className="chart-bar-group">{children}</div>
    </div>
  );
}

function ChartRow({ label, value, width }) {
  return (
    <div className="chart-bar-row">
      <span className="chart-label">{label}</span>
      <div className="chart-progress-bg"><div className="chart-progress-fill" style={{ width: `${Math.max(width, 5)}%` }} /></div>
      <span className="chart-val">{value}</span>
    </div>
  );
}