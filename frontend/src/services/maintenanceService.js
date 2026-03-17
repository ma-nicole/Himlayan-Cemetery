import api from './api';

export const maintenanceService = {
  async getStatus() {
    const response = await api.get('/system/maintenance-status');
    return response.data;
  },

  async updateStatus(payload) {
    const response = await api.post('/system/maintenance', payload);
    return response.data;
  },
};

export default maintenanceService;