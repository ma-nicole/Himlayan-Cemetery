import api from './api';

/**
 * QR Code Service
 * Handles QR code generation for burial records
 */
const qrService = {
  /**
   * Generate QR code for a burial record
   * @param {number} burialId - The ID of the burial record
   * @returns {Promise} API response with QR code data
   */
  generate: async (burialId) => {
    const response = await api.post(`/qr-codes/generate/${burialId}`);
    return response.data;
  },

  /**
   * Get QR code details by code
   * @param {string} code - The QR code UUID
   * @returns {Promise} API response with QR code details
   */
  getByCode: async (code) => {
    const response = await api.get(`/qr-codes/${code}`);
    return response.data;
  },

  /**
   * Regenerate QR code for a burial record
   * @param {number} burialId - The ID of the burial record
   * @returns {Promise} API response with new QR code data
   */
  regenerate: async (burialId) => {
    const response = await api.post(`/qr-codes/regenerate/${burialId}`);
    return response.data;
  },

  /**
   * Deactivate a QR code
   * @param {string} code - The QR code UUID
   * @returns {Promise} API response
   */
  deactivate: async (code) => {
    const response = await api.patch(`/qr-codes/${code}/deactivate`);
    return response.data;
  },
};

export default qrService;
