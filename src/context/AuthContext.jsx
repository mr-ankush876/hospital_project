import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

// Default Admin user for universal bypass login
const createUniversalUser = (username) => {
  const cleanName = (username || 'Admin').trim();
  const capitalized = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  
  // Determine role or default to ADMIN for full access
  let role = 'ADMIN';
  const lower = cleanName.toLowerCase();
  if (lower.includes('doctor') || lower.includes('dr.')) {
    role = 'DOCTOR';
  } else if (lower.includes('reception')) {
    role = 'RECEPTIONIST';
  }

  return {
    id: 1,
    username: cleanName || 'admin',
    email: `${(cleanName || 'admin').toLowerCase()}@vitalsync.com`,
    fullName: cleanName.toLowerCase().startsWith('dr.') ? cleanName : `Dr. ${capitalized}`,
    role: role,
    createdAt: new Date().toISOString(),
  };
};

const createMockToken = (username, role) => {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(
    JSON.stringify({
      sub: username,
      role: role,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 86400 * 365, // 1 year validity
      offline: true,
    })
  );
  const signature = btoa('vitalsync-free-access-token');
  return `${header}.${payload}.${signature}`;
};

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

  // Validate session on load: Always persist session without clearing
  useEffect(() => {
    const savedToken = localStorage.getItem('vitalsync_token');
    const savedUser = localStorage.getItem('vitalsync_user');

    if (savedToken && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        setToken(savedToken);
      } catch {
        // Fallback default
        const defaultUser = createUniversalUser('admin');
        setUser(defaultUser);
        setToken(createMockToken('admin', 'ADMIN'));
      }
    }
    setLoading(false);
  }, []);

  // Instant login with ANY text or blank
  const login = async (username, password) => {
    setLoading(true);

    const targetUsername = username && username.trim() ? username.trim() : 'admin';
    const targetUser = createUniversalUser(targetUsername);
    const mockToken = createMockToken(targetUser.username, targetUser.role);

    setUser(targetUser);
    setToken(mockToken);

    localStorage.setItem('vitalsync_token', mockToken);
    localStorage.setItem('vitalsync_user', JSON.stringify(targetUser));

    setLoading(false);
    return { success: true, role: targetUser.role, user: targetUser };
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
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
        error: null,
        login,
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
