import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CalendarPlus, MapPin, Navigation, ShieldCheck, Star } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config';

export default function Venues() {
  const { token } = useContext(AuthContext);
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }

    fetchCourts();

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          console.log('📍 User location obtained:', loc);
          setUserLocation(loc);
        },
        (error) => {
          console.warn('📍 Location permission denied or unavailable:', error.message);
          // Set a default location (campus center) as fallback
          setUserLocation({
            lat: 37.4264,
            lng: -122.1699
          });
        }
      );
    }
  }, [token, navigate]);

  const fetchCourts = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/courts`);
      const data = await res.json();
      if (data.success) {
        console.log('🏟️  Courts fetched:', data.data.map(c => ({ name: c.name, hasLocation: !!c.location, location: c.location })));
        setCourts(data.data);
      } else {
        setError('Unable to load venues right now.');
      }
    } catch (err) {
      setError('Could not connect to the venue service.');
    } finally {
      setLoading(false);
    }
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    const earthRadius = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  };

  const formatINR = (value) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  const sortedCourts = useMemo(() => {
    const mapped = courts
      .map((court) => {
        if (userLocation && court.location?.lat && court.location?.lng) {
          const dist = calculateDistance(userLocation.lat, userLocation.lng, court.location.lat, court.location.lng);
          console.log(`📍 ${court.name}: ${dist.toFixed(1)} km`);
          return {
            ...court,
            distance: dist
          };
        }
        return court;
      })
      .sort((a, b) => {
        if (a.distance !== undefined && b.distance !== undefined) {
          return a.distance - b.distance;
        }
        return a.name.localeCompare(b.name);
      });
    
    console.log('📊 Courts sorted by distance:', mapped.map(c => ({ name: c.name, distance: c.distance })));
    return mapped;
  }, [courts, userLocation]);

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-ring"></div>
      </div>
    );
  }

  return (
    <div className="venues-page">
      <section className="page-header">
        <div className="container page-header-content">
          <span className="eyebrow">
            <Navigation size={14} />
            Venue discovery
          </span>
          <h1>Find the right court and book a clean time slot.</h1>
          <p>
            Browse every active campus sports venue, check capacity, and open the booking calendar
            from one organized catalog.
          </p>
        </div>
      </section>

      <section className="container venues-section">
        {error && (
          <div className="alert-card">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div className="section-toolbar">
          <div>
            <span className="eyebrow">Nearby grounds & arenas</span>
            <h2>{sortedCourts.length} courts ready to reserve</h2>
          </div>
          <span className="location-pill">
            <MapPin size={16} />
            {userLocation ? 'Showing nearest sports grounds first' : 'Enable location for personalized venue sorting'}
          </span>
        </div>

        {userLocation && (
          <div className="glass-panel alert-card" style={{ marginBottom: '1.5rem' }}>
            <span>We used your current location to show the closest sports venues and arenas first.</span>
          </div>
        )}

        <div className="venue-grid">
          {sortedCourts.map((court) => (
            <article key={court._id} className="venue-card glass-panel">
              <div className="venue-image-wrap">
                  <img
                    src={court.imageUrl || 'https://via.placeholder.com/800x520?text=Venue+Image'}
                    alt={court.name}
                    className="venue-image"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = 'https://via.placeholder.com/800x520?text=Venue+Image';
                    }}
                  />
              </div>

              <div className="venue-body">
                <div className="venue-title-row">
                  <div>
                    <h3>{court.name}</h3>
                    <div className="venue-meta-line">
                      <span>
                        <Star size={14} />
                        4.9 rating
                      </span>
                      <span>
                        <ShieldCheck size={14} />
                        {court.capacity} players
                      </span>
                    </div>
                  </div>
                  <div className="court-price">
                    {formatINR(court.pricePerHour)}
                    <span>/hr</span>
                  </div>
                </div>

                <p className="court-description">{court.description}</p>

                <div className="venue-footer">
                  <div>
                    <span className="distance-label">
                      <MapPin size={14} />
                      {court.distance !== undefined ? `${court.distance.toFixed(1)} km away` : 'Distance unavailable'}
                    </span>
                    {court.location?.address && (
                      <div className="venue-meta-line" style={{ marginTop: '0.75rem' }}>
                        <span>{court.location.address}</span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => navigate(`/booking/${court._id}`)} className="btn btn-primary">
                    <CalendarPlus size={16} />
                    Book Slot
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
