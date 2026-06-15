import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Activity, AlertCircle } from 'lucide-react';

/**
 * Login page component for user authentication.
 */
export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
const { login, waitUntilLoaded } = useContext(AuthContext);
   const navigate = useNavigate();

   const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const normalizedEmail = email.trim().toLowerCase();
    const res = await login(normalizedEmail, password);
    
    if (res.success) {
      await waitUntilLoaded();
      navigate('/home', { replace: true });
    } else {
      setError(res.message || 'Invalid credentials. Please check your email and password.');
    }
    setSubmitting(false);
  };

  return (
    <div className="auth-page">
      <div className="glass-panel auth-card">
        <div className="auth-top">
          <div className="brand-icon">
            <Activity size={38} className="gradient-text" />
          </div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-copy">Login to reserve your favorite sports courts.</p>
        </div>

        {error && (
          <div className="glass-panel alert-card">
            <AlertCircle size={18} color="var(--danger)" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@demo.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footnote">
          Don't have an account? <Link to="/register" className="link-highlight">Create Account</Link>
        </p>

        <div className="quick-creds">
          <div className="quick-creds-title">💡 Quick Demo Credentials</div>
          <div className="quick-creds-line">
            <span>Email:</span>
            <strong>student@demo.com / 123456</strong>
          </div>
          <div className="quick-creds-line">
            <span>Admin:</span>
            <strong>admin@demo.com / 123456</strong>
          </div>
        </div>
      </div>
    </div>
  );
}