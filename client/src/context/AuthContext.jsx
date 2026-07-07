import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

/**
 * Axios instance with base URL pointing at the API proxy.
 */
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

/**
 * AuthProvider wraps the app and provides:
 * - user, token, loading state
 * - login(), register(), logout() actions
 * - Automatic session restore on mount via GET /auth/me
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('mockly_token'));
  const [loading, setLoading] = useState(true);

  // Attach token to every request when available
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Restore session on mount (AUTH-03)
  useEffect(() => {
    const restoreSession = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await api.get('/auth/me');
        setUser(data.user);
      } catch {
        // Token expired or invalid — clear it
        localStorage.removeItem('mockly_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Register a new user.
   * @returns {{ user, token }} on success
   * @throws {{ message: string }} on failure
   */
  const register = async ({ name, email, password }) => {
    try {
      const { data } = await api.post('/auth/register', {
        name,
        email,
        password,
      });
      localStorage.setItem('mockly_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      throw err.response?.data || { message: 'Registration failed' };
    }
  };

  /**
   * Log in an existing user.
   * @returns {{ user, token }} on success
   * @throws {{ message: string }} on failure
   */
  const login = async ({ email, password }) => {
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('mockly_token', data.token);
      setToken(data.token);
      setUser(data.user);
      return data;
    } catch (err) {
      throw err.response?.data || { message: 'Login failed' };
    }
  };

  /**
   * Log out — clear token and user state.
   */
  const logout = () => {
    localStorage.removeItem('mockly_token');
    setToken(null);
    setUser(null);
  };

  const value = { user, token, loading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context.
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}

export default AuthContext;
