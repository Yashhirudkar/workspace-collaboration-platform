import axios from 'axios';
import { toast } from '@/hooks/useToast';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor: attach JWT from localStorage
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || 'An unexpected error occurred';

    if (status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        // Only redirect if not already on auth pages
        if (!window.location.pathname.startsWith('/auth')) {
          window.location.href = '/auth/login';
        }
      }
    } else if (status === 403) {
      toast({ title: 'Access Denied', description: 'You do not have permission for this action.', variant: 'destructive' });
    } else if (status === 429) {
      toast({ title: 'Too Many Requests', description: message, variant: 'destructive' });
    } else if (status >= 500) {
      toast({ title: 'Server Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    }

    return Promise.reject(error);
  }
);

export default api;
