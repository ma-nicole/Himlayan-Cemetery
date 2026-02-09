import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

// Send initial invitation to primary contact
export const sendInvitation = async (burialRecordId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/burial-records/${burialRecordId}/invitation/send`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // Backend returns { success: true, message, data }
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Resend invitation with new credentials
export const resendInvitation = async (burialRecordId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      `${API_URL}/burial-records/${burialRecordId}/invitation/resend`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get invitation status for a burial record
export const getInvitationStatus = async (burialRecordId) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `${API_URL}/burial-records/${burialRecordId}/invitation/status`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    // Backend returns { success: true, data: { status, user } }
    return response.data.data || response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
