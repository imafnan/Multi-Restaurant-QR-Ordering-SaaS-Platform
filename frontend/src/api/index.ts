import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to inject Authorization header
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle session expiration or disabled accounts
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      // 401: Unauthorized / expired
      // 403: Forbidden (e.g., Disabled User or Restaurant)
      if (status === 401 || status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login page if we are not already there
        if (!window.location.pathname.startsWith('/login') && window.location.pathname !== '/') {
          window.location.href = `/login?reason=${encodeURIComponent(
            error.response.data?.message || 'Session expired or account deactivated'
          )}`;
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
