import api from './api';

const extractError = (error, fallbackMessage) => {
  if (error?.response?.data) {
    return error.response.data;
  }

  if (error?.message) {
    return { message: error.message };
  }

  return { message: fallbackMessage };
};

// Send initial invitation to primary contact
export const sendInvitation = async (burialRecordId) => {
  try {
    const response = await api.post(`/burial-records/${burialRecordId}/invitation/send`, {});
    // Backend returns { success: true, message, data }
    return response.data;
  } catch (error) {
    throw extractError(error, 'Failed to send invitation');
  }
};

// Resend invitation with new credentials
export const resendInvitation = async (burialRecordId) => {
  try {
    const response = await api.post(`/burial-records/${burialRecordId}/invitation/resend`, {});
    return response.data;
  } catch (error) {
    throw extractError(error, 'Failed to resend invitation');
  }
};

// Get invitation status for a burial record
export const getInvitationStatus = async (burialRecordId) => {
  try {
    const response = await api.get(`/burial-records/${burialRecordId}/invitation/status`);
    // Backend returns { success: true, data: { status, user } }
    return response.data.data || response.data;
  } catch (error) {
    throw extractError(error, 'Failed to load invitation status');
  }
};
