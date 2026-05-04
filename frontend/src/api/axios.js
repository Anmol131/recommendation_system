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
    const requestUrl = config.url || '';
    const isAdminRoute = requestUrl.startsWith('/admin') && !requestUrl.includes('/admin/login');

    if (isAdminRoute) {
      // For admin routes, use adminToken
      const adminToken = localStorage.getItem('adminToken');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    } else {
      // For regular routes, use normal token
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
        requestUrl.includes('/admin/login') ||
        requestUrl.includes('/admin/me');

      if (!isAuthRequest) {
        const isAdminRoute = requestUrl.startsWith('/admin');
        if (isAdminRoute) {
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          window.dispatchEvent(new CustomEvent('vibeify:auth-expired', {
            detail: { message: 'Admin session expired. Please log in again.', type: 'error' },
          }));
          window.location.href = '/admin/login';
        } else {
          localStorage.removeItem('token');
          window.dispatchEvent(new CustomEvent('vibeify:auth-expired', {
            detail: { message: 'Your session expired. Please log in again.', type: 'error' },
          }));
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
