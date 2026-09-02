import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('vitalsync_user');
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('vitalsync_token') || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Validate session on mount by checking with the backend
  useEffect(() => {
    const validateSession = async () => {
      const savedToken = localStorage.getItem('vitalsync_token');
      if (!savedToken) return;

      try {
        const res = await authApi.getCurrentUser();
        const userData = res.data;
        setUser(userData);
        setToken(savedToken);
        localStorage.setItem('vitalsync_user', JSON.stringify(userData));
      } catch (err) {
        console.warn('Session validation failed, clearing auth state:', err?.response?.status);
        setUser(null);
        setToken(null);
        localStorage.removeItem('vitalsync_token');
        localStorage.removeItem('vitalsync_user');
      }
    };

    validateSession();
  }, []);

  // Login via real backend API
  const login = async (username, password) => {
    setLoading(true);
    setError(null);

    try {
      const res = await authApi.login({ username, password });
      const { token: jwtToken, user: userData } = res.data;

      setUser(userData);
      setToken(jwtToken);

      localStorage.setItem('vitalsync_token', jwtToken);
      localStorage.setItem('vitalsync_user', JSON.stringify(userData));

      setLoading(false);
      return { success: true, role: userData.role, user: userData };
    } catch (err) {
      setLoading(false);

      const isTimeout =
        err?.code === 'ECONNABORTED' ||
        err?.message?.toLowerCase().includes('timeout');
      const isNetworkError =
        err?.message === 'Network Error' ||
        err?.code === 'ERR_NETWORK';

      // Resilient Master Admin Session Fallback:
      // If the backend is offline or timing out (e.g. Render sleeping on Vercel),
      // and the user provided valid administrator credentials, log in directly without error!
      const normalizedUser = (username || '').trim().toLowerCase();
      const isAdminUser = ['ankush_876', 'admin', 'ankush', 'ankush@vitalsync.com'].includes(normalizedUser);
      const isAdminPass = ['Ankush143@', 'ankush143@', 'password123'].includes(password);

      if ((isTimeout || isNetworkError || !err?.response) && isAdminUser && isAdminPass) {
        const fallbackAdmin = {
          id: 1,
          username: 'ankush_876',
          email: 'ankush@vitalsync.com',
          fullName: 'Dr. Ankush singh (Administrator)',
          role: 'ADMIN',
          status: 'ACTIVE',
          phone: '+919876543210'
        };
        const fallbackToken = 'vitalsync_admin_session_' + Date.now();
        setUser(fallbackAdmin);
        setToken(fallbackToken);
        localStorage.setItem('vitalsync_token', fallbackToken);
        localStorage.setItem('vitalsync_user', JSON.stringify(fallbackAdmin));
        return { success: true, role: 'ADMIN', user: fallbackAdmin, isOfflineMode: true };
      }

      const errorMessage =
        (err?.response?.status === 401
          ? 'Incorrect username or password. Please verify your credentials (check uppercase/lowercase).'
          : null) ||
        (err?.response?.status === 403
          ? 'Account is deactivated or access is denied.'
          : null) ||
        (isTimeout
          ? 'Backend connection timed out. The cloud backend may be waking up or offline. Please wait 30 seconds and retry.'
          : null) ||
        (isNetworkError
          ? 'Cannot reach backend server. If testing locally, ensure backend is running on port 8080.'
          : null) ||
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Login failed. Please verify your credentials and server connection.';

      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register Patient via real backend API
  const registerPatient = async (patientData) => {
    setLoading(true);
    setError(null);

    try {
      const res = await authApi.register(patientData);
      const { token: jwtToken, user: userData } = res.data;

      setUser(userData);
      setToken(jwtToken);

      localStorage.setItem('vitalsync_token', jwtToken);
      localStorage.setItem('vitalsync_user', JSON.stringify(userData));

      setLoading(false);
      return { success: true, role: userData.role, user: userData };
    } catch (err) {
      setLoading(false);

      const errorMessage =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Registration failed. Please check your information and try again.';

      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setError(null);
    localStorage.removeItem('vitalsync_token');
    localStorage.removeItem('vitalsync_user');
  }, []);

  const hasRole = (allowedRoles) => {
    if (!user) return false;
    if (!allowedRoles || allowedRoles.length === 0) return true;
    return allowedRoles.includes(user.role) || user.role === 'ADMIN';
  };

  const updateUserProfile = (updatedData) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedData };
      localStorage.setItem('vitalsync_user', JSON.stringify(next));
      return next;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        error,
        login,
        registerPatient,
        logout,
        hasRole,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
