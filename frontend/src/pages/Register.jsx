import React, { useState, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Activity, AlertCircle } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register, user, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const res = await register(email, password);
    if (res.success) {
      navigate('/', { replace: true });
    } else {
      setError(res.message || 'Registration failed.');
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
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-copy">Join the SportSync hub and start reserving courts instantly.</p>
        </div>

        {error && (
          <div className="glass-panel alert-card">
            <AlertCircle size={18} color="var(--danger)" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="page-loader">
            <div className="loader-ring"></div>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="alex@demo.com"
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
                  placeholder="Min. 6 characters"
                  required
                />
              </div>

              <button type="submit" disabled={submitting} className="btn btn-primary">
                {submitting ? 'Creating Profile...' : 'Complete Sign Up'}
              </button>
            </form>

            <p className="auth-footnote">
              Already have an account? <Link to="/login" className="link-highlight">Login</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
