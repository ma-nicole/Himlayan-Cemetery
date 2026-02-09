import api from './api';

export const burialService = {
  /**
   * Get all burial records
   * @param {object} params - Query parameters
   * @returns {Promise}
   */
  async getAll(params = {}) {
    const response = await api.get('/burial-records', { params });
    return response.data;
  },

  /**
   * Get single burial record
   * @param {number} id 
   * @returns {Promise}
   */
  async getById(id) {
    const response = await api.get(`/burial-records/${id}`);
    return response.data;
  },

  /**
   * Create burial record
   * @param {object|FormData} data 
   * @returns {Promise}
   */
  async create(data) {
    const config = data instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    
    const response = await api.post('/burial-records', data, config);
    return response.data;
  },

  /**
   * Update burial record
   * @param {number} id 
   * @param {object|FormData} data 
   * @returns {Promise}
   */
  async update(id, data) {
    const config = data instanceof FormData 
      ? { headers: { 'Content-Type': 'multipart/form-data' } }
      : {};
    
    // Use POST with _method=PUT for FormData (Laravel requirement)
    if (data instanceof FormData) {
      data.append('_method', 'PUT');
      const response = await api.post(`/burial-records/${id}`, data, config);
      return response.data;
    }
    
    const response = await api.put(`/burial-records/${id}`, data);
    return response.data;
  },

  /**
   * Delete burial record
   * @param {number} id 
   * @returns {Promise}
   */
  async delete(id) {
    const response = await api.delete(`/burial-records/${id}`);
    return response.data;
  },

  /**
   * Search burial records
   * @param {string} query 
   * @returns {Promise}
   */
  async search(query) {
    const response = await api.get('/burial-records/search', { params: { query } });
    return response.data;
  },

  /**
   * Get statistics
   * @returns {Promise}
   */
  async getStatistics() {
    const response = await api.get('/burial-records/statistics');
    return response.data;
  },
};

export default burialService;
