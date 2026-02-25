import api from './api';

const userService = {
  /**
   * Get user by email - returns user data only if account is activated
   * @param {string} email - The email to search for
   * @returns {Promise} User data with id, name, email
   */
  getUserByEmail: async (email) => {
    try {
      const response = await api.get(`/users/by-email?email=${encodeURIComponent(email)}`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'User not found');
    } catch (error) {
      // Return null if user not found instead of throwing
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  /**
   * Parse a full name into first name, middle initial, and last name
   * @param {string} fullName - The full name to parse
   * @returns {object} Object with firstName, middleInitial, lastName properties
   */
  parseName: (fullName) => {
    if (!fullName) {
      return { firstName: '', middleInitial: '', lastName: '' };
    }

    const parts = fullName.trim().split(/\s+/);
    
    if (parts.length === 0) {
      return { firstName: '', middleInitial: '', lastName: '' };
    }

    if (parts.length === 1) {
      return { firstName: parts[0], middleInitial: '', lastName: '' };
    }

    if (parts.length === 2) {
      return { firstName: parts[0], middleInitial: '', lastName: parts[1] };
    }

    // For 3+ parts: first, middle initial(s), last
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    const middleInitial = parts[1].charAt(0).toUpperCase();

    return { firstName, middleInitial, lastName };
  },
};

export default userService;
