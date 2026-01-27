import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const ProtectedRoute = ({ children, roles }) => {
  const { isAuthenticated, loading, hasRole, user } = useAuth();

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

  // Check role if specified - redirect to appropriate dashboard if not authorized
  if (roles && !hasRole(roles)) {
    // If visitor tries to access admin pages, redirect to member dashboard
    if (user?.role === 'visitor') {
      return <Navigate to="/member/dashboard" replace />;
    }
    // Otherwise redirect to main dashboard which will handle role-based redirect
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
