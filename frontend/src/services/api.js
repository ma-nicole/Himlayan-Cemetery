import axios from 'axios';

const rawApiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
const trimmedApiUrl = rawApiUrl.replace(/\/$/, '');
const normalizedApiBaseUrl = trimmedApiUrl.endsWith('/api')
  ? trimmedApiUrl
  : `${trimmedApiUrl}/api`;

// Create axios instance
const api = axios.create({
  baseURL: normalizedApiBaseUrl,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
