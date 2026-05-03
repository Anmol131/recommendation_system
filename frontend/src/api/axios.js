import axios from 'axios';

const instance = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add authorization token
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const requestUrl = error.config?.url || '';
      const isAuthRequest =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register') ||
        requestUrl.includes('/auth/verify-otp') ||
        requestUrl.includes('/auth/resend-otp') ||
        requestUrl.includes('/admin/login');

      if (!isAuthRequest) {
        localStorage.removeItem('token');
        const isAdminArea = window.location.pathname.startsWith('/admin');
        window.location.href = isAdminArea ? '/admin/login' : '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
