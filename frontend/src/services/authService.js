import api from './api';

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
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
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
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Get current user
   * @returns {Promise}
   */
  async getCurrentUser() {
    const response = await api.get('/user');
    return response.data;
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },

  /**
   * Get stored user
   * @returns {object|null}
   */
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  /**
   * Get stored token
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem('token');
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
