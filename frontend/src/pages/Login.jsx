import { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Activity, AlertCircle, UserCheck, ShieldCheck } from 'lucide-react';
import { MotionDiv, fadeUp } from '../utils/animations';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, waitUntilLoaded } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const res = await login(email.trim().toLowerCase(), password);
    if (res.success) {
      if (res.user.role !== role) {
        setError(`This account is registered as ${res.user.role}. Please switch to ${res.user.role} login.`);
        setSubmitting(false);
        return;
      }
      await waitUntilLoaded();
      navigate('/', { replace: true });
    } else {
      setError(res.message || 'Invalid credentials');
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <MotionDiv variants={fadeUp} initial="initial" animate="animate" className="glass-panel auth-card">
        <div className="auth-top">
          <div className="brand-icon"><Activity size={38} className="gradient-text" /></div>
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-copy">Login to reserve your favorite sports courts.</p>
        </div>

        {error && <div className="alert-card"><AlertCircle size={18} color="var(--danger)" /><span>{error}</span></div>}

        <div className="form-group">
          <label className="form-label">I am a</label>
          <div className="role-selector">
            <div className={`role-option ${role === 'user' ? 'role-selected' : ''}`} onClick={() => setRole('user')}>
              <input type="radio" name="role" checked={role === 'user'} onChange={() => setRole('user')} />
              <UserCheck size={18} />
              <span>Student / Player</span>
            </div>
            <div className={`role-option ${role === 'admin' ? 'role-selected' : ''}`} onClick={() => setRole('admin')}>
              <input type="radio" name="role" checked={role === 'admin'} onChange={() => setRole('admin')} />
              <ShieldCheck size={18} />
              <span>Admin</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} placeholder={role === 'admin' ? 'admin@demo.com' : 'student@demo.com'} required />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required />
          </div>
          <button type="submit" disabled={submitting} className="btn btn-primary">
            {submitting ? 'Signing In...' : `Sign In as ${role === 'admin' ? 'Admin' : 'Player'}`}
          </button>
        </form>

        <p className="auth-footnote">Don't have an account? <Link to="/register" className="link-highlight">Create Account</Link></p>

        <div className="quick-creds">
          <div className="quick-creds-title">Quick Login</div>
          <div className="quick-creds-line" onClick={() => { setEmail('student@demo.com'); setPassword('123456'); setRole('user'); }} style={{ cursor: 'pointer' }}>
            <span>🎓 Student:</span><strong>student@demo.com / 123456</strong>
          </div>
          <div className="quick-creds-line" onClick={() => { setEmail('admin@demo.com'); setPassword('123456'); setRole('admin'); }} style={{ cursor: 'pointer' }}>
            <span>🛡️ Admin:</span><strong>admin@demo.com / 123456</strong>
          </div>
        </div>
      </MotionDiv>
    </div>
  );
}
