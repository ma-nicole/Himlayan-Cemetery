import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, hasRole, user } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Force password change — block every route except /change-password
  if (user?.must_change_password && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  // Check role if specified - redirect to appropriate dashboard if not authorized
  if (roles && !hasRole(roles)) {
    // If member tries to access admin pages, redirect to member dashboard
    if (user?.role === 'member') {
      return <Navigate to="/member/dashboard" replace />;
    }
    // Otherwise redirect to main dashboard which will handle role-based redirect
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
