import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CalendarPlus, MapPin, Navigation, ShieldCheck, Star } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

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
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        () => setUserLocation(null)
      );
    }
  }, [token, navigate]);

  const fetchCourts = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/courts');
      const data = await res.json();
      if (data.success) {
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
    return courts
      .map((court) => {
        if (userLocation && court.location?.lat && court.location?.lng) {
          return {
            ...court,
            distance: calculateDistance(userLocation.lat, userLocation.lng, court.location.lat, court.location.lng)
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
            {userLocation ? 'Showing nearest sports grounds first' : 'Enable location to show nearest venues'}
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
