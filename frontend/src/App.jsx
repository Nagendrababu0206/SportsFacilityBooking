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

  if (loading) {
    return (
      <div className="page-loader">
        <div className="loader-ring"></div>
      </div>
    );
  }

  return user ? <Home /> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <div className="app-shell">
        <Router>
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<RootRoute />} />
              <Route path="/home" element={<Home />} />
              <Route path="/venues" element={<Venues />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/booking/:courtId" element={<BookingPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </Router>
      </div>
    </AuthProvider>
  );
}
