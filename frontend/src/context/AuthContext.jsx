import React, { createContext, useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

export const AuthContext = createContext();

/**
 * AuthProvider handles user authentication state and API calls.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      fetchCurrentUser();
    } else {
      localStorage.removeItem('token');
      setUser(null);
      setLoading(false);
    }
  }, [token]);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
      } else {
        logout();
      }
    } catch (err) {
      console.error('Error fetching current user:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Makes authenticated API call to the provided endpoint.
   */
  const authFetch = async (endpoint, method, body) => {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json();
      return data;
    } catch (err) {
      return { success: false, message: 'Server connection failed.' };
    }
  };

  const login = async (email, password) => {
    const data = await authFetch('/api/auth/login', 'POST', { email, password });
    if (data.success) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    }
    return data;
  };

  const register = async (email, password) => {
    const data = await authFetch('/api/auth/register', 'POST', { email, password });
    if (data.success) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
    }
    return data;
  };

  const waitUntilLoaded = () => {
    return new Promise(resolve => {
      const checkLoaded = () => {
        if (!token || user) {
          resolve();
        } else {
          setTimeout(checkLoaded, 50);
        }
      };
      checkLoaded();
    });
  };

  const logout = () => {
    setToken('');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};