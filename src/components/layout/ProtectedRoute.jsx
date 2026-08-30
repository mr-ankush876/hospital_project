import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Forbidden from '../../pages/Forbidden';
import Loader from '../common/Loader';

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, loading, hasRole } = useAuth();

  if (loading) {
    return <Loader fullScreen message="Authenticating secure session..." />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !hasRole(allowedRoles)) {
    return <Forbidden />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
