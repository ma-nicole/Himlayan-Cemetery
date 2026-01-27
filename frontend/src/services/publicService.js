import api from './api';

export const publicService = {
  /**
   * Get public grave profile by QR code
   * @param {string} code 
   * @returns {Promise}
   */
  async getGraveProfile(code) {
    const response = await api.get(`/public/grave/${code}`);
    return response.data;
  },
};

export default publicService;
