import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { Activity, CalendarCheck, MapPin, ShieldCheck, Sparkles } from 'lucide-react';
import { MotionDiv, MotionSection, fadeUp, stagger } from '../utils/animations';

export default function Home() {
  const [venueCount, setVenueCount] = useState(0);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/courts`)
      .then(r => r.json())
      .then(d => { if (d.success) setVenueCount(d.data.length); })
      .catch(() => setVenueCount(0));
  }, []);

  return (
    <div className="home-page">
      <MotionSection
        className="home-hero"
        initial="initial" animate="animate"
        variants={stagger}
      >
        <div className="container home-hero-grid">
          <MotionDiv variants={fadeUp} className="home-hero-copy">
            <span className="eyebrow"><Activity size={14} /> Sports facility booking</span>
            <h1>Plan your game, reserve your court, and manage bookings in one place.</h1>
            <p>SportSync provides a clear booking flow for campus venues with live slot management and reservation tracking.</p>
            <div className="hero-actions">
              <Link to="/venues" className="btn btn-primary"><MapPin size={18} /> Explore Venues</Link>
              <Link to="/dashboard" className="btn btn-secondary"><CalendarCheck size={18} /> View Dashboard</Link>
            </div>
          </MotionDiv>
          <MotionDiv variants={fadeUp} className="hero-summary glass-panel">
            <div><span className="summary-label">Welcome</span><strong>Player</strong></div>
            <div className="summary-stat"><span>{venueCount || '--'}</span><p>active venues ready for booking</p></div>
            <div className="summary-list">
              <div><ShieldCheck size={18} /> Capacity-aware reservations</div>
              <div><Sparkles size={18} /> Peak-hour suggestions</div>
              <div><CalendarCheck size={18} /> Dashboard booking history</div>
            </div>
          </MotionDiv>
        </div>
      </MotionSection>

      <MotionSection
        className="container flow-section"
        initial="initial" whileInView="animate"
        viewport={{ once: true, margin: '-80px' }}
        variants={stagger}
      >
        <MotionDiv variants={fadeUp} className="section-heading">
          <span className="eyebrow">Recommended flow</span>
          <h2>Use the site in this order</h2>
        </MotionDiv>
        <div className="flow-grid">
          <MotionDiv variants={fadeUp}><Link to="/venues" className="flow-card glass-panel">
            <span className="step-number">01</span><MapPin size={24} />
            <h3>Choose a venue</h3><p>Browse courts, compare capacity, then open the schedule.</p>
          </Link></MotionDiv>
          <MotionDiv variants={fadeUp}><Link to="/dashboard" className="flow-card glass-panel">
            <span className="step-number">02</span><CalendarCheck size={24} />
            <h3>Track bookings</h3><p>Review reservations, cancellations, refunds, and usage analytics.</p>
          </Link></MotionDiv>
          <MotionDiv variants={fadeUp}><div className="flow-card glass-panel">
            <span className="step-number">03</span><ShieldCheck size={24} />
            <h3>Admin control</h3><p>Admins can block venue slots for maintenance, events, and tournaments.</p>
          </div></MotionDiv>
        </div>
      </MotionSection>
    </div>
  );
}