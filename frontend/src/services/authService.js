import api from './api';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const TOKEN_EXPIRES_AT_KEY = 'token_expires_at';
const REFRESH_TOKEN_KEY = 'refresh_token';

const DEFAULT_TOKEN_EXPIRY_MINUTES = 360;

const getFallbackTokenExpiry = () => {
  const expiresAt = new Date(Date.now() + DEFAULT_TOKEN_EXPIRY_MINUTES * 60 * 1000);
  return expiresAt.toISOString();
};

const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

const isStoredTokenExpired = () => {
  const expiresAt = localStorage.getItem(TOKEN_EXPIRES_AT_KEY);
  if (!expiresAt) return false;

  const expiresAtMs = Date.parse(expiresAt);
  if (Number.isNaN(expiresAtMs)) {
    return false;
  }

  return Date.now() >= expiresAtMs;
};

export const authService = {
  /**
   * Login user
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise}
   */
  async login(email, password) {
    const response = await api.post('/login', { email, password });
    if (response.data.success) {
      const { token, user, token_expires_at: tokenExpiresAt, refresh_token: refreshToken } = response.data.data;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_EXPIRES_AT_KEY, tokenExpiresAt || getFallbackTokenExpiry());
      if (refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
    }
    return response.data;
  },

  /**
   * Logout user
   * @returns {Promise}
   */
  async logout() {
    try {
      await api.post('/logout');
    } finally {
      clearStoredAuth();
    }
  },

  /**
   * Get current user
   * @returns {Promise}
   */
  async getCurrentUser() {
    const response = await api.get('/user');
    if (response.data.success && response.data.data) {
      // Update localStorage with fresh user data
      localStorage.setItem('user', JSON.stringify(response.data.data));
    }
    return response.data;
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      return false;
    }

    if (isStoredTokenExpired()) {
      clearStoredAuth();
      return false;
    }

    return true;
  },

  /**
   * Get stored user
   * @returns {object|null}
   */
  getUser() {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  },

  /**
   * Get stored token
   * @returns {string|null}
   */
  getToken() {
    if (!this.isAuthenticated()) {
      return null;
    }
    return localStorage.getItem(TOKEN_KEY);
  },

  /**
   * Get stored refresh token
   * @returns {string|null}
   */
  getRefreshToken() {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  /**
   * Use the refresh token to obtain a new access token
   * @returns {Promise<string|null>} new access token or null if refresh failed
   */
  async refreshAccessToken() {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) return null;

    try {
      const response = await api.post('/refresh-token', { refresh_token: refreshToken });
      if (response.data.success) {
        const { access_token: newToken, token_expires_at: newExpiresAt } = response.data.data;
        localStorage.setItem(TOKEN_KEY, newToken);
        localStorage.setItem(TOKEN_EXPIRES_AT_KEY, newExpiresAt || getFallbackTokenExpiry());
        return newToken;
      }
    } catch {
      // Refresh failed — clear everything so the user gets sent to login
      clearStoredAuth();
    }
    return null;
  },

  /**
   * Set auth session from social callback
   * @param {string} token
   * @param {object} user
   * @param {string|null} tokenExpiresAt
   */
  setSession(token, user, tokenExpiresAt = null) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_EXPIRES_AT_KEY, tokenExpiresAt || getFallbackTokenExpiry());
    // Social auth doesn't provide a refresh token, so clear any stale one
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  /**
   * Register new user
   * @param {object} userData 
   * @returns {Promise}
   */
  async register(userData) {
    const response = await api.post('/register', userData);
    return response.data;
  },
};

export default authService;
