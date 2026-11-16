import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

const K = { token: 'eerms2_token', user: 'eerms2_user', exp: 'eerms2_exp', notice: 'eerms2_notice' };
const ROLES = ['employee', 'finance', 'hr', 'admin'];

const clearSession = () => [K.token, K.user, K.exp].forEach((k) => localStorage.removeItem(k));
const jwtExp = (t) => { try { return JSON.parse(atob(t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'))).exp * 1000; } catch { return 0; } };

function readSession() {
  try {
    const u = JSON.parse(localStorage.getItem(K.user));
    const token = localStorage.getItem(K.token);
    const exp = Number(localStorage.getItem(K.exp));
    if (!u || !token || !ROLES.includes(u.role)) return null;
    if (!exp || Date.now() > exp) { localStorage.setItem(K.notice, 'Your session expired. Please sign in again.'); clearSession(); return null; }
    return u;
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readSession);

  const logout = useCallback((notice) => {
    clearSession();
    if (notice) localStorage.setItem(K.notice, notice);
    setUser(null);
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem(K.token, data.token);
    localStorage.setItem(K.user, JSON.stringify(data.user));
    localStorage.setItem(K.exp, String(jwtExp(data.token)));
    localStorage.removeItem(K.notice);
    setUser(data.user);
    return data.redirect;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const { data } = await api.post('/auth/change-password', { currentPassword, newPassword });
    localStorage.setItem(K.user, JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const syncUser = (updates) => {
    const updatedUser = { ...user, ...updates };
    localStorage.setItem(K.user, JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  useEffect(() => {
    if (!user) return undefined;
    // Keep the UI in sync with token expiry while the app remains open.
    const timer = setInterval(() => {
      const exp = Number(localStorage.getItem(K.exp));
      if (exp && Date.now() > exp) logout('Your session expired. Please sign in again.');
    }, 30000);
    // sync sign-out / sign-in across tabs
    const onStorage = (e) => {
      if (e.key === K.token && !e.newValue) setUser(null);
      if (e.key === K.user && e.newValue) { try { const u = JSON.parse(e.newValue); if (ROLES.includes(u.role)) setUser(u); } catch { /* ignore */ } }
    };
    window.addEventListener('storage', onStorage);
    return () => { clearInterval(timer); window.removeEventListener('storage', onStorage); };
  }, [user, logout]);

  const takeNotice = () => { const n = localStorage.getItem(K.notice); localStorage.removeItem(K.notice); return n || ''; };
  return <Ctx.Provider value={{ user, login, logout, changePassword, syncUser, takeNotice }}>{children}</Ctx.Provider>;
}
