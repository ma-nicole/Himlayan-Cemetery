import api from './api';

export const dashboardService = {
  /**
   * Get dashboard statistics
   * @returns {Promise}
   */
  async getStats() {
    const response = await api.get('/dashboard');
    return response.data;
  },
};

export default dashboardService;
