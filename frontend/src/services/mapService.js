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

  /**
   * Create a new plot
   * @param {Object} plotData
   * @returns {Promise}
   */
  async createPlot(plotData) {
    const response = await api.post('/map/plots', plotData);
    return response.data;
  },

  /**
   * Archive a plot (admin only — soft delete)
   * @param {number} plotId
   * @returns {Promise}
   */
  async archivePlot(plotId) {
    const response = await api.delete(`/map/plots/${plotId}`);
    return response.data;
  },

  /**
   * Get all landmarks (any authenticated user)
   * @returns {Promise}
   */
  async getLandmarks() {
    const response = await api.get('/map/landmarks');
    return response.data;
  },

  /**
   * Create a new landmark (admin/staff)
   * @param {Object} landmarkData
   * @returns {Promise}
   */
  async createLandmark(landmarkData) {
    const response = await api.post('/map/landmarks', landmarkData);
    return response.data;
  },

  /**
   * Update a landmark (admin/staff)
   * @param {number} landmarkId
   * @param {Object} landmarkData
   * @returns {Promise}
   */
  async updateLandmark(landmarkId, landmarkData) {
    const response = await api.put(`/map/landmarks/${landmarkId}`, landmarkData);
    return response.data;
  },

  /**
   * Archive a landmark (admin only — soft delete)
   * @param {number} landmarkId
   * @returns {Promise}
   */
  async archiveLandmark(landmarkId) {
    const response = await api.delete(`/map/landmarks/${landmarkId}`);
    return response.data;
  },
};
