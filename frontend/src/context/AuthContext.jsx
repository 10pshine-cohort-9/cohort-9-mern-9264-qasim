import { createContext, useContext, useEffect, useState } from 'react';

import api from '../api/axios.js';

const AuthContext = createContext(null);

function getStoredUser() {
  const stored = localStorage.getItem('user');
  return stored ? JSON.parse(stored) : null;
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    const stored = localStorage.getItem('token');
    if (stored) {
      api.defaults.headers.common.Authorization = `Bearer ${stored}`;
    }
    return stored;
  });
  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    if (token) {
      api.defaults.headers.common.Authorization = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common.Authorization;
    }
  }, [token]);

  function persistSession(data) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  }

  async function login(email, password) {
    const res = await api.post('/api/auth/login', { email, password });
    persistSession(res.data);
  }

  async function signup(email, password) {
    const res = await api.post('/api/auth/register', { email, password });
    persistSession(res.data);
  }

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common.Authorization;
    setToken(null);
    setUser(null);
  }

  function updateUser(updatedUser) {
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  }

  const value = { user, token, login, signup, logout, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
