import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem('nexusgear_user');
    return raw ? JSON.parse(raw) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('nexusgear_token'));
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('nexusgear_token')));

  useEffect(() => {
    const handler = () => {
      setUser(null);
      setToken(null);
    };
    window.addEventListener('nexusgear:unauthorized', handler);
    return () => window.removeEventListener('nexusgear:unauthorized', handler);
  }, []);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    api
      .get('/auth/me')
      .then((res) => {
        if (!active) return;
        if (res.data.data.user) {
          setUser(res.data.data.user);
          localStorage.setItem('nexusgear_user', JSON.stringify(res.data.data.user));
        }
      })
      .catch(() => {
        if (active) {
          setUser(null);
          setToken(null);
          localStorage.removeItem('nexusgear_token');
          localStorage.removeItem('nexusgear_user');
        }
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [token]);

  function persist(payload) {
    localStorage.setItem('nexusgear_token', payload.token);
    localStorage.setItem('nexusgear_user', JSON.stringify(payload.user));
    setToken(payload.token);
    setUser(payload.user);
  }

  async function login(email, password) {
    const res = await api.post('/auth/login', { email, password });
    persist(res.data.data);
    return res.data.data.user;
  }

  function logout() {
    localStorage.removeItem('nexusgear_token');
    localStorage.removeItem('nexusgear_user');
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ user, token, loading, login, logout, isAdmin: user?.role === 'admin' }),
    [user, token, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
