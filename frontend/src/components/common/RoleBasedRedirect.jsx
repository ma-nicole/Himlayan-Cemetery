import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * RoleBasedRedirect - Redirects users to appropriate dashboard based on role
 * - Admin/Staff -> /admin/dashboard
 * - Visitor/Member -> /member/dashboard
 */
const RoleBasedRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  // Redirect based on user role
  if (user?.role === 'admin' || user?.role === 'staff') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  // Default to member dashboard for visitors and other roles
  return <Navigate to="/member/dashboard" replace />;
};

export default RoleBasedRedirect;
