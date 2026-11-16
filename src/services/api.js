import axios from 'axios';

const configuredApiUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '');
const apiBaseUrl = configuredApiUrl
  ? (/\/api$/i.test(configuredApiUrl) ? configuredApiUrl : `${configuredApiUrl}/api`)
  : '/api';

const api = axios.create({ baseURL: apiBaseUrl });
api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('eerms2_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});
api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401 && !e.config.url.includes('/auth/login')) {
      ['token', 'user', 'exp'].forEach((k) => localStorage.removeItem('eerms2_' + k));
      localStorage.setItem('eerms2_notice', 'Your session ended. Please sign in again.');
      window.location.href = '/login';
    }
    return Promise.reject(e);
  }
);

export const errMsg = (e) => e.response?.data?.message || e.message || 'Something went wrong';
export const errList = (e) => e.response?.data?.errors || null;
export default api;
