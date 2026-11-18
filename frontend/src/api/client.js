import axios from 'axios';

let rawBaseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
// Normalize: strip trailing slashes and ensure /api path prefix exists
rawBaseUrl = rawBaseUrl.replace(/\/+$/, '');
if (!rawBaseUrl.endsWith('/api')) {
  rawBaseUrl += '/api';
}

const API_BASE_URL = rawBaseUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach Authorization header automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Token ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token if invalid or unauthorized
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('isAdmin');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
export { API_BASE_URL };
