import React, { useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Venues from './pages/Venues';
import BookingPage from './pages/BookingPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';

function RootRoute() {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="page-loader"><div className="loader-ring" /></div>;
  return user ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div className="page-loader"><div className="loader-ring" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('App crashed:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', color: 'red', background: 'black', minHeight: '100vh' }}>
          <h2 style={{ color: 'red' }}>ERROR BOUNDARY CAUGHT:</h2>
          <pre style={{ color: 'white', whiteSpace: 'pre-wrap' }}>{this.state.error?.message}</pre>
          <pre style={{ color: 'yellow', whiteSpace: 'pre-wrap' }}>{this.state.error?.stack}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<RootRoute />} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/venues" element={<ProtectedRoute><Venues /></ProtectedRoute>} />
            <Route path="/booking/:courtId" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="site-footer">
          <div className="container footer-inner">
            <span>SportSync · Campus sports facility booking</span>
            <span>Built as a college project · Node.js + React</span>
          </div>
        </footer>
      </Router>
    </AuthProvider>
  );
}
