import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, patientAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('hs_token'));

  // Load user from token on mount
  const loadUser = useCallback(async () => {
    const storedToken = localStorage.getItem('hs_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await authAPI.getMe();
      if (res.data.success) {
        setUser(res.data.data.user);
        setProfile(res.data.data.profile);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('hs_token');
      localStorage.removeItem('hs_user');
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  // Login
  const login = async (email, password, role) => {
    const res = await authAPI.login({ email, password, role });
    if (res.data.success) {
      const { token: newToken, user: userData } = res.data.data;
      localStorage.setItem('hs_token', newToken);
      localStorage.setItem('hs_user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      // Load full profile
      await loadUser();
      return { success: true, user: userData };
    }
    return { success: false, message: res.data.message };
  };

  // Register
  const register = async (formData) => {
    const res = await authAPI.register(formData);
    if (res.data.success) {
      const { token: newToken, user: userData } = res.data.data;
      localStorage.setItem('hs_token', newToken);
      localStorage.setItem('hs_user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      await loadUser();
      return { success: true, user: userData };
    }
    return { success: false, message: res.data.message };
  };

  // Logout
  const logout = () => {
    localStorage.removeItem('hs_token');
    localStorage.removeItem('hs_user');
    setToken(null);
    setUser(null);
    setProfile(null);
  };

  // Refresh profile data
  const refreshProfile = async () => {
    try {
      if (user && user.role === 'patient') {
        const res = await patientAPI.getProfile();
        if (res.data.success) {
          setProfile(res.data.data);
        }
      }
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  };

  const value = {
    user,
    profile,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
    refreshProfile,
    loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
