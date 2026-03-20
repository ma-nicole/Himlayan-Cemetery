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
  async (error) => {
    // Don't redirect on 401 for login/register/refresh endpoints - let the component handle the error
    const isAuthEndpoint = error.config?.url?.includes('/login') || 
                           error.config?.url?.includes('/register') ||
                           error.config?.url?.includes('/refresh-token');
    
    if (error.response?.status === 401 && !isAuthEndpoint) {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

      if (refreshToken && !isRefreshing) {
        isRefreshing = true;

        try {
          const refreshResponse = await axios.post(
            `${normalizedApiBaseUrl}/refresh-token`,
            { refresh_token: refreshToken },
            { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' } }
          );

          if (refreshResponse.data?.success) {
            const { access_token: newToken, token_expires_at: newExpiresAt } = refreshResponse.data.data;
            localStorage.setItem(TOKEN_KEY, newToken);
            if (newExpiresAt) localStorage.setItem(TOKEN_EXPIRES_AT_KEY, newExpiresAt);

            // Retry all queued requests with the new token
            processPendingRequests(newToken);

            // Retry the original failed request
            error.config.headers.Authorization = `Bearer ${newToken}`;
            return api(error.config);
          }
        } catch {
          // Refresh failed — clear auth and redirect to login
          processPendingRequests(null);
          clearStoredAuth();
          window.location.href = '/login';
          return Promise.reject(error);
        } finally {
          isRefreshing = false;
        }
      } else if (refreshToken && isRefreshing) {
        // Another refresh is in progress — queue this request
        return new Promise((resolve, reject) => {
          pendingRequests.push((newToken) => {
            if (newToken) {
              error.config.headers.Authorization = `Bearer ${newToken}`;
              resolve(api(error.config));
            } else {
              reject(error);
            }
          });
        });
      }

      // No refresh token available — clear auth and redirect
      clearStoredAuth();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
