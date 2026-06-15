import { useState, useContext, useEffect, useRef } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import { Activity, AlertCircle, Globe, FolderGit2 } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);
  
  const { login, oauthLogin, user, loading } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const oauthProcessed = useRef(false);

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true });
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (oauthProcessed.current) return;
    
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    const userData = urlParams.get('user');
    const errorParam = urlParams.get('error');
    
    if (token && userData) {
      oauthProcessed.current = true;
      try {
        const parsedUser = JSON.parse(decodeURIComponent(userData));
        oauthLogin(token, parsedUser);
        navigate('/', { replace: true });
      } catch {
        setTimeout(() => setError('OAuth login failed. Please try again.'), 0);
      }
    } else if (errorParam) {
      setTimeout(() => setError(errorParam), 0);
    }
  }, [location.search, navigate, oauthLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    const normalizedEmail = email.trim().toLowerCase();
    const res = await login(normalizedEmail, password);
    
    if (res.success) {
      navigate('/', { replace: true });
    } else {
      setError(res.message || 'Invalid credentials.');
    }
    setSubmitting(false);
  };

  const handleGoogleLogin = () => {
    setOauthLoading('google');
    window.location.href = '${API_BASE_URL}/api/auth/google';
  };

  const handleGithubLogin = () => {
    setOauthLoading('github');
    window.location.href = '${API_BASE_URL}/api/auth/github';
  };

  return (
    <div className="auth-page">
      <div className="glass-panel auth-card">
        <div className="auth-top">
          <div className="brand-icon">
            <Activity size={38} className="gradient-text" />
          </div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-copy">Login to reserve your favorite sports courts. Sign in with Google or GitHub for quick access.</p>
        </div>

        {error && (
          <div className="glass-panel alert-card">
            <AlertCircle size={18} color="var(--danger)" />
            <span>{error}</span>
          </div>
        )}

        <div className="oauth-buttons">
          <button 
            type="button" 
            onClick={handleGoogleLogin} 
            disabled={oauthLoading === 'google'}
            className="btn btn-oauth btn-google"
          >
            <Globe size={20} />
            {oauthLoading === 'google' ? 'Connecting...' : 'Sign in with Google'}
          </button>
          
          <button 
            type="button" 
            onClick={handleGithubLogin} 
            disabled={oauthLoading === 'github'}
            className="btn btn-oauth btn-github"
          >
            <FolderGit2 size={20} />
            {oauthLoading === 'github' ? 'Connecting...' : 'Sign in with GitHub'}
          </button>
        </div>

        <div className="divider">
          <span>or continue with email</span>
        </div>

        {loading ? (
          <div className="page-loader">
            <div className="loader-ring"></div>
          </div>
        ) : (
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
            {submitting ? ' Login Success / Now Loading Session' : 'Sign In'}
          </button>
          </form>
        )}

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
