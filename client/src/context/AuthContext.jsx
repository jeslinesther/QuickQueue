import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('quickqueue_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('quickqueue_token');
      const storedUser = localStorage.getItem('quickqueue_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        try {
          const res = await getMe();
          if (res.success && res.user) {
            setUser(res.user);
            localStorage.setItem('quickqueue_user', JSON.stringify(res.user));
          }
        } catch (err) {
          // If token expired or invalid, log out cleanly
          if (err.response && err.response.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Save session helper
  const handleAuthSuccess = (newToken, authUser) => {
    setToken(newToken);
    setUser(authUser);
    localStorage.setItem('quickqueue_token', newToken);
    localStorage.setItem('quickqueue_user', JSON.stringify(authUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('quickqueue_token');
    localStorage.removeItem('quickqueue_user');
  };

  const isUser = user && user.role === 'user';
  const isStaff = user && user.role === 'staff';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        handleAuthSuccess,
        logout,
        isUser,
        isStaff,
        isAuthenticated: !!token && !!user,
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
