import api from './api';

export const qrService = {
  /**
   * Generate QR code for burial record
   * @param {number} burialId 
   * @returns {Promise}
   */
  async generate(burialId) {
    const response = await api.post(`/qr-codes/generate/${burialId}`);
    return response.data;
  },

  /**
   * Get QR code details
   * @param {string} code 
   * @returns {Promise}
   */
  async getByCode(code) {
    const response = await api.get(`/qr-codes/${code}`);
    return response.data;
  },

  /**
   * Regenerate QR code
   * @param {number} burialId 
   * @returns {Promise}
   */
  async regenerate(burialId) {
    const response = await api.post(`/qr-codes/regenerate/${burialId}`);
    return response.data;
  },

  /**
   * Deactivate QR code
   * @param {string} code 
   * @returns {Promise}
   */
  async deactivate(code) {
    const response = await api.patch(`/qr-codes/${code}/deactivate`);
    return response.data;
  },
};

export default qrService;
