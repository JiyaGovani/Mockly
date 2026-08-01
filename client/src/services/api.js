import axios from 'axios';

/**
 * Centralized Axios Instance configured with JWT Auth Interceptor.
 */
export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('mockly_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
