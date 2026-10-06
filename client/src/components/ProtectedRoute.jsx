import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Verifying authentication...</p>
      </div>
    );
  }

  if (!token || !user) {
    // If not logged in, redirect to appropriate login page
    if (allowedRoles && allowedRoles.includes('staff')) {
      return <Navigate to="/staff/login" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If logged in with wrong role, redirect to their corresponding dashboard
    if (user.role === 'staff') {
      return <Navigate to="/staff/dashboard" replace />;
    }
    return <Navigate to="/user/dashboard" replace />;
  }

  return children;
}

export default ProtectedRoute;
