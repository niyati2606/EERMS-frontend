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
    const url = e.config?.url || '';
    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/setup-password') ||
      url.includes('/auth/reset-password') ||
      url.includes('/auth/request-password-reset');

    const hadToken = Boolean(localStorage.getItem('eerms2_token'));
    const isPublicPage = ['/login', '/set-password', '/reset-password', '/forgot-password'].some(
      (path) => window.location.pathname.startsWith(path)
    );

    if (e.response?.status === 401 && !isAuthRoute) {
      ['token', 'user', 'exp'].forEach((k) => localStorage.removeItem('eerms2_' + k));
      if (hadToken && !isPublicPage) {
        localStorage.setItem('eerms2_notice', 'Your session ended. Please sign in again.');
      }
      if (!isPublicPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(e);
  }
);

export const errMsg = (e) => e.response?.data?.message || e.message || 'Something went wrong';
export const errList = (e) => e.response?.data?.errors || null;
export default api;
