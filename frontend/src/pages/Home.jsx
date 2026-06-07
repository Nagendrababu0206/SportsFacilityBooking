import React, { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Activity, CalendarCheck, MapPin, ShieldCheck, Sparkles } from 'lucide-react';

export default function Home() {
  const { token, user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [venueCount, setVenueCount] = useState(0);

  useEffect(() => {
    if (!token) {
      navigate('/login');
    }
  }, [token, navigate]);

  useEffect(() => {
    const fetchVenueCount = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/courts');
        const data = await res.json();
        if (data.success) {
          setVenueCount(data.data.length);
        }
      } catch (err) {
        setVenueCount(0);
      }
    };

    fetchVenueCount();
  }, []);

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="container home-hero-grid">
          <div className="home-hero-copy">
            <span className="eyebrow">
              <Activity size={14} />
              Sports facility booking
            </span>
            <h1>Plan your game, reserve your court, and manage every booking in one place.</h1>
            <p>
              SportSync gives students and admins a clear booking flow for campus venues, live slot
              management, and simple reservation tracking.
            </p>
            <div className="hero-actions">
              <Link to="/venues" className="btn btn-primary">
                <MapPin size={18} />
                Explore Venues
              </Link>
              <Link to="/dashboard" className="btn btn-secondary">
                <CalendarCheck size={18} />
                View Dashboard
              </Link>
            </div>
          </div>

          <div className="hero-summary glass-panel">
            <div>
              <span className="summary-label">Welcome</span>
              <strong>{user?.name || 'Player'}</strong>
            </div>
            <div className="summary-stat">
              <span>{venueCount || '--'}</span>
              <p>active venues ready for booking</p>
            </div>
            <div className="summary-list">
              <div>
                <ShieldCheck size={18} />
                Capacity-aware reservations
              </div>
              <div>
                <Sparkles size={18} />
                Peak-hour suggestions
              </div>
              <div>
                <CalendarCheck size={18} />
                Dashboard booking history
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container flow-section">
        <div className="section-heading">
          <span className="eyebrow">Recommended flow</span>
          <h2>Use the site in this order</h2>
        </div>

        <div className="flow-grid">
          <Link to="/venues" className="flow-card glass-panel">
            <span className="step-number">01</span>
            <MapPin size={24} />
            <h3>Choose a venue</h3>
            <p>Browse courts, compare distance and capacity, then open the schedule.</p>
          </Link>
          <Link to="/dashboard" className="flow-card glass-panel">
            <span className="step-number">02</span>
            <CalendarCheck size={24} />
            <h3>Track bookings</h3>
            <p>Review active reservations, cancellations, refunds, and usage analytics.</p>
          </Link>
          <div className="flow-card glass-panel">
            <span className="step-number">03</span>
            <ShieldCheck size={24} />
            <h3>Admin control</h3>
            <p>Admins can block venue slots for maintenance, events, and tournaments.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
