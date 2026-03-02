import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

// Custom hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const initAuth = () => {
      const storedUser = authService.getUser();
      if (storedUser && authService.isAuthenticated()) {
        setUser(storedUser);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    try {
      const response = await authService.login(email, password);
      if (response.success) {
        setUser(response.data.user);
        
        // Fetch fresh user data immediately after login to ensure all fields
        // (including avatar) are properly stored in localStorage
        setTimeout(async () => {
          try {
            const freshResponse = await authService.getCurrentUser();
            if (freshResponse.success && freshResponse.data) {
              setUser(freshResponse.data);
            }
          } catch (error) {
            console.error('Failed to fetch fresh user data after login:', error);
          }
        }, 100);
        
        return { success: true };
      }
      return { success: false, message: response.message };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      return { success: false, message };
    }
  }, []);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
    }
  }, []);

  // Check if user has specific role
  const hasRole = useCallback((roles) => {
    if (!user) return false;
    if (typeof roles === 'string') {
      return user.role === roles;
    }
    return roles.includes(user.role);
  }, [user]);

  // Set user from social login (token already stored)
  const setUserFromSocial = useCallback((userData) => {
    setUser(userData);
  }, []);

  // Refresh user data from server
  const refreshUser = useCallback(async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
        return response.data;
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  const value = {
    user,
    loading,
    login,
    logout,
    hasRole,
    setUserFromSocial,
    refreshUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isStaff: user?.role === 'staff',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
