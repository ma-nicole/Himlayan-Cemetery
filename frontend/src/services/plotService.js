import api from './api';

export const plotService = {
  /**
   * Get all plots
   * @param {object} params - Query parameters
   * @returns {Promise}
   */
  async getAll(params = {}) {
    const response = await api.get('/plots', { params });
    return response.data;
  },

  /**
   * Get single plot
   * @param {number} id 
   * @returns {Promise}
   */
  async getById(id) {
    const response = await api.get(`/plots/${id}`);
    return response.data;
  },

  /**
   * Get available plots
   * @returns {Promise}
   */
  async getAvailable() {
    const response = await api.get('/plots/available');
    return response.data;
  },

  /**
   * Create plot
   * @param {object} data 
   * @returns {Promise}
   */
  async create(data) {
    const response = await api.post('/plots', data);
    return response.data;
  },

  /**
   * Update plot
   * @param {number} id 
   * @param {object} data 
   * @returns {Promise}
   */
  async update(id, data) {
    const response = await api.put(`/plots/${id}`, data);
    return response.data;
  },

  /**
   * Delete plot
   * @param {number} id 
   * @returns {Promise}
   */
  async delete(id) {
    const response = await api.delete(`/plots/${id}`);
    return response.data;
  },

  /**
   * Get statistics
   * @returns {Promise}
   */
  async getStatistics() {
    const response = await api.get('/plots/statistics');
    return response.data;
  },
};

export default plotService;
