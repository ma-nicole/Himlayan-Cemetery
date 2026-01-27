import api from './api';

export const mapService = {
  /**
   * Get all map markers
   * @returns {Promise}
   */
  async getMarkers() {
    const response = await api.get('/map/markers');
    return response.data;
  },

  /**
   * Get marker details
   * @param {number} plotId 
   * @returns {Promise}
   */
  async getMarkerDetails(plotId) {
    const response = await api.get(`/map/marker/${plotId}`);
    return response.data;
  },

  /**
   * Get map bounds
   * @returns {Promise}
   */
  async getBounds() {
    const response = await api.get('/map/bounds');
    return response.data;
  },
};

export default mapService;
