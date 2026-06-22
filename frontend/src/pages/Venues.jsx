import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CalendarPlus, MapPin, Navigation, ShieldCheck, Star } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { MotionDiv, MotionSection, fadeUp, stagger } from '../utils/animations';

function haversine(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371, dLat = (lat2 - lat1) * Math.PI / 180, dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Venues() {
  const [courts, setCourts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/courts`).then(r => r.json()).then(d => {
      if (d.success) setCourts(d.data);
      else setError('Unable to load venues.');
    }).catch(() => setError('Could not connect.')).finally(() => setLoading(false));
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        p => setUserLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
        () => setUserLocation({ lat: 37.4264, lng: -122.1699 })
      );
    }
  }, []);

  const sorted = useMemo(() => {
    return [...courts].map(c => {
      if (userLocation && c.location?.lat && c.location?.lng) {
        const d = haversine(userLocation.lat, userLocation.lng, c.location.lat, c.location.lng);
        if (d !== null) return { ...c, distance: d };
      }
      return c;
    }).sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
  }, [courts, userLocation]);

  if (loading) return <div className="page-loader"><div className="loader-ring" /></div>;

  return (
    <div className="venues-page">
      <MotionSection variants={fadeUp} initial="initial" animate="animate" className="page-header">
        <div className="container page-header-content">
          <span className="eyebrow"><Navigation size={14} /> Venue discovery</span>
          <h1>Find the right court and book a clean time slot.</h1>
          <p>Browse every active campus sports venue, check capacity, and open the booking calendar.</p>
        </div>
      </MotionSection>

      <MotionSection
        className="container venues-section"
        initial="initial" animate="animate"
        variants={stagger}
      >
        {error && <div className="alert-card"><AlertCircle size={18} /><span>{error}</span></div>}
        <MotionDiv variants={fadeUp} className="section-toolbar">
          <div><span className="eyebrow">Nearby grounds & arenas</span><h2>{sorted.length} courts ready to reserve</h2></div>
          <span className="location-pill"><MapPin size={16} />{userLocation ? 'Showing nearest first' : 'Enable location for sorting'}</span>
        </MotionDiv>
        <div className="venue-grid">
          {sorted.map((court, i) => (
            <MotionDiv key={court._id} variants={fadeUp} className="venue-card glass-panel">
              <div className="venue-image-wrap">
                <img src={court.imageUrl || 'https://placehold.co/800x520?text=Venue'} alt={court.name} className="venue-image"
                  onError={e => { e.target.onerror = null; e.target.src = 'https://placehold.co/800x520?text=Venue'; }} />
              </div>
              <div className="venue-body">
                <div className="venue-title-row">
                  <div>
                    <h3>{court.name}</h3>
                    <div className="venue-meta-line">
                      <span><Star size={14} /> 4.9</span>
                      <span><ShieldCheck size={14} /> {court.capacity} players</span>
                    </div>
                  </div>
                  <div className="court-price">${court.pricePerHour}<span>/hr</span></div>
                </div>
                <p className="court-description">{court.description}</p>
                <div className="venue-footer">
                  <div>
                    <span className="distance-label"><MapPin size={14} />{court.distance !== undefined ? `${court.distance.toFixed(1)} km away` : 'Distance N/A'}</span>
                    {court.location?.address && <div className="venue-meta-line" style={{ marginTop: '0.75rem' }}><span>{court.location.address}</span></div>}
                  </div>
                  <button onClick={() => navigate(`/booking/${court._id}`)} className="btn btn-primary"><CalendarPlus size={16} /> Book Slot</button>
                </div>
              </div>
            </MotionDiv>
          ))}
        </div>
      </MotionSection>
    </div>
  );
}