import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

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
  // Doctors are unverified until an admin approves their medical license;
  // every other role is trivially verified.
  const [isVerified, setIsVerified] = useState(true);
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
        setIsVerified(res.data.data.isVerified !== false);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('hs_token');
      localStorage.removeItem('hs_user');
      setToken(null);
      setUser(null);
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

  // Logout — the local session is dropped synchronously so callers can navigate
  // away immediately; the server ack is fire-and-forget and must never be able
  // to strand the user in a signed-in state.
  const logout = () => {
    const previousToken = localStorage.getItem('hs_token');
    localStorage.removeItem('hs_token');
    localStorage.removeItem('hs_user');
    setToken(null);
    setUser(null);
    setProfile(null);
    setIsVerified(true);
    if (previousToken) authAPI.logout(previousToken).catch(() => {});
  };

  // Refresh user + profile. getMe returns both for every role, so this also
  // picks up doctor and admin profile changes (the old patient-only refresh
  // silently did nothing for them).
  const refreshProfile = async () => {
    await loadUser();
  };

  // Change password — the server invalidates every token issued before the
  // change, so the rotated token it returns has to replace the stored one or
  // the very next request 401s and bounces the user to /login.
  const changePassword = async (currentPassword, newPassword) => {
    const res = await authAPI.changePassword({ currentPassword, newPassword });
    const rotated = res.data?.data?.token;
    if (rotated) {
      localStorage.setItem('hs_token', rotated);
      setToken(rotated);
    }
    return { success: true, message: res.data.message };
  };

  // Upload a new avatar and fold the returned URL into the cached user
  const uploadAvatar = async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await authAPI.uploadAvatar(formData);
    const avatar = res.data?.data?.avatar;
    if (avatar) {
      setUser((prev) => {
        const next = { ...prev, avatar };
        localStorage.setItem('hs_user', JSON.stringify(next));
        return next;
      });
    }
    return { success: true, avatar };
  };

  const value = {
    user,
    profile,
    token,
    loading,
    isVerified,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
    refreshProfile,
    changePassword,
    uploadAvatar,
    loadUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
