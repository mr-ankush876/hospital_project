import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Forbidden from '../../pages/Forbidden';
import Loader from '../common/Loader';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated: contextAuth, user: contextUser, loading, initializing } = useAuth();

  const savedUserStr = typeof window !== 'undefined' ? localStorage.getItem('vitalsync_user') : null;
  const savedToken = typeof window !== 'undefined' ? localStorage.getItem('vitalsync_token') : null;
  let savedUser = null;
  try {
    savedUser = savedUserStr ? JSON.parse(savedUserStr) : null;
  } catch (e) {}

  const effectiveUser = contextUser || savedUser;
  const effectiveAuth = contextAuth || (!!savedToken && !!effectiveUser);

  if (loading || initializing) {
    return <Loader fullScreen message="Authenticating secure session..." />;
  }

  if (!effectiveAuth || !effectiveUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = effectiveUser?.role ? String(effectiveUser.role).replace(/^ROLE_/, '').toUpperCase() : '';
    const upperAllowed = allowedRoles.map((r) => String(r).toUpperCase());
    const hasPermission = upperAllowed.includes(userRole) || userRole === 'ADMIN';

    if (!hasPermission) {
      if (userRole === 'PATIENT') return <Navigate to="/patient/appointments" replace />;
      if (userRole === 'DOCTOR') return <Navigate to="/doctor/dashboard" replace />;
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
