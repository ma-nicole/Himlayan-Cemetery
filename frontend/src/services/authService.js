import api from './api';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const TOKEN_EXPIRES_AT_KEY = 'token_expires_at';

const DEFAULT_TOKEN_EXPIRY_MINUTES = 480;

const getFallbackTokenExpiry = () => {
  const expiresAt = new Date(Date.now() + DEFAULT_TOKEN_EXPIRY_MINUTES * 60 * 1000);
  return expiresAt.toISOString();
};

const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_EXPIRES_AT_KEY);
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
      const { token, user, token_expires_at: tokenExpiresAt } = response.data.data;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      localStorage.setItem(TOKEN_EXPIRES_AT_KEY, tokenExpiresAt || getFallbackTokenExpiry());
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
   * Set auth session from social callback
   * @param {string} token
   * @param {object} user
   * @param {string|null} tokenExpiresAt
   */
  setSession(token, user, tokenExpiresAt = null) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_EXPIRES_AT_KEY, tokenExpiresAt || getFallbackTokenExpiry());
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
