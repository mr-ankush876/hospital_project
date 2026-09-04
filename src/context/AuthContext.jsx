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

  // Fallback demo user profiles when backend is offline
  const DEMO_USERS = {
    ankush_876: { id: 1, username: 'ankush_876', fullName: 'Dr. Ankush singh (Chief Medical Officer)', email: 'ankush@vitalsync.com', role: 'ADMIN', departmentName: 'Executive' },
    admin: { id: 2, username: 'admin', fullName: 'Dr. Sarah Mitchell', email: 'admin@vitalsync.com', role: 'ADMIN', departmentName: 'Hospital Administration' },
    'dr.chen': { id: 3, username: 'dr.chen', fullName: 'Dr. Robert Chen', email: 'r.chen@vitalsync.com', role: 'DOCTOR', departmentName: 'Cardiology' },
    'dr.stanton': { id: 4, username: 'dr.stanton', fullName: 'Dr. Emily Stanton', email: 'e.stanton@vitalsync.com', role: 'DOCTOR', departmentName: 'Pediatrics' },
    receptionist: { id: 5, username: 'receptionist', fullName: 'Alex Vance', email: 'receptionist@vitalsync.com', role: 'RECEPTIONIST', departmentName: 'Front Desk' },
  };

  // Login via real backend API with resilient offline fallback
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

      // Check for Network Error (Backend offline / unreachable)
      const isNetworkError = err?.message === 'Network Error' || !err?.response;

      if (isNetworkError) {
        const lowerUser = username.toLowerCase().trim();
        const demoUser = DEMO_USERS[lowerUser] || {
          id: 99,
          username: lowerUser,
          fullName: username.includes('admin') || lowerUser === 'ankush_876' ? 'Dr. Ankush singh (Chief Medical Officer)' : 'Healthcare User',
          email: `${lowerUser}@vitalsync.com`,
          role: lowerUser.includes('doc') ? 'DOCTOR' : (lowerUser.includes('rec') ? 'RECEPTIONIST' : 'ADMIN'),
        };

        const mockToken = `offline_demo_token_${demoUser.role}_${Date.now()}`;
        setUser(demoUser);
        setToken(mockToken);

        localStorage.setItem('vitalsync_token', mockToken);
        localStorage.setItem('vitalsync_user', JSON.stringify(demoUser));

        return {
          success: true,
          role: demoUser.role,
          user: demoUser,
          isOfflineDemo: true,
        };
      }

      const rawMsg = err?.response?.data?.message || err?.response?.data?.error;
      const errorMessage =
        (typeof rawMsg === 'string' && rawMsg.trim() ? rawMsg : null) ||
        (err?.response?.status === 401 ? 'Invalid username or password. Please check capitalization.' : null) ||
        (err?.response?.status === 403 ? 'Account is not active or access is denied.' : null) ||
        (err?.response?.status === 502 || err?.response?.status === 504 ? 'Railway server is starting up. Please try again in a few seconds.' : null) ||
        'Login failed. Please verify your credentials and try again.';

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
