import axios from 'axios';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const TOKEN_EXPIRES_AT_KEY = 'token_expires_at';
const REFRESH_TOKEN_KEY = 'refresh_token';

const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const rawApiUrl = process.env.REACT_APP_API_URL || 'https://himlayangpilipino.com/api';
const trimmedApiUrl = rawApiUrl.replace(/\/$/, '');
const normalizedApiBaseUrl = trimmedApiUrl.endsWith('/api')
  ? trimmedApiUrl
  : `${trimmedApiUrl}/api`;

// Create axios instance
const api = axios.create({
  baseURL: normalizedApiBaseUrl,
  headers: {
    'Accept': 'application/json',
  },
});

// Request interceptor to add auth token and handle FormData
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // For FormData, don't set Content-Type - let axios set it with proper boundary
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track whether a token refresh is already in progress to avoid multiple parallel refreshes
let isRefreshing = false;
let pendingRequests = [];

const processPendingRequests = (newToken) => {
  pendingRequests.forEach((cb) => cb(newToken));
  pendingRequests = [];
};

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect on 401 for login/register/refresh endpoints - let the component handle the error
    const isAuthEndpoint = error.config?.url?.includes('/login') || 
                           error.config?.url?.includes('/register') ||
                           error.config?.url?.includes('/refresh-token');
    
    if (error.response?.status === 401 && !isAuthEndpoint) {
      // Session expired — clear auth and redirect to login
      clearStoredAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
