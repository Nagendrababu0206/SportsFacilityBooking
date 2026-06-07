import React, { useContext } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Activity, LogOut, User, Home, LayoutDashboard, MapPin } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/" className="logo">
          <Activity className="logo-icon" size={28} />
          <span>Sport<span className="gradient-text">Sync</span></span>
        </Link>

        {user ? (
          <ul className="nav-links">
            <li>
              <NavLink to="/" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"} end>
                <Home size={18} />
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/venues" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                <MapPin size={18} />
                Venues
              </NavLink>
            </li>
            <li>
              <NavLink to="/dashboard" className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}>
                <LayoutDashboard size={18} />
                Dashboard
              </NavLink>
            </li>
            <li className="nav-item-user">
              <div className="glass-panel user-pill">
                <User size={14} className="gradient-text" />
                <span>{user.name}</span>
                <span className="user-role">({user.role})</span>
              </div>
            </li>
            <li>
              <button onClick={handleLogout} className="btn btn-secondary nav-logout">
                <LogOut size={14} />
                Logout
              </button>
            </li>
          </ul>
        ) : (
          <div className="nav-links">
            <Link to="/login" className="nav-link">Login</Link>
            <Link to="/register" className="btn btn-primary nav-signup">Sign Up</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
