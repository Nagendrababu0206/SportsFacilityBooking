import { createContext, useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../config';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => {
    try { return localStorage.getItem('token') || ''; } catch { return ''; }
  });
  const [loading, setLoading] = useState(() => {
    try { return !!localStorage.getItem('token'); } catch { return false; }
  });
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setUser(data.user);
      else logout();
    } catch {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const authFetch = async (endpoint, method, body) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.message || `Server error (${res.status})` };
      }
      return data;
    } catch (err) {
      return { success: false, message: `Server connection failed. Make sure backend is running at ${API_BASE_URL}` };
    }
  };

  const login = async (email, password) => {
    const data = await authFetch('/api/auth/login', 'POST', { email, password });
    if (data.success) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setLoading(false);
    }
    return data;
  };

  const register = async (email, password) => {
    const data = await authFetch('/api/auth/register', 'POST', { email, password });
    if (data.success) {
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      setLoading(false);
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setLoading(false);
  };

  const waitUntilLoaded = () => {
    return new Promise(resolve => {
      if (!loading) return resolve();
      const interval = setInterval(() => {
        if (!loading) {
          clearInterval(interval);
          resolve();
        }
      }, 50);
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, waitUntilLoaded }}>
      {children}
    </AuthContext.Provider>
  );
}
