import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api/endpoints';

const AuthContext = createContext();
const AVATAR_STORAGE_KEY = 'lumina_avatar';

const getStoredAvatar = () => localStorage.getItem(AVATAR_STORAGE_KEY) || 'avatar-1';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
    return storedAvatar ? { avatar: storedAvatar } : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const setUserAvatar = useCallback((avatarId) => {
    if (!avatarId) {
      return;
    }

    localStorage.setItem(AVATAR_STORAGE_KEY, avatarId);
    setUser((current) => (current ? { ...current, avatar: avatarId } : { avatar: avatarId }));
  }, []);

  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await api.getMe();
          const apiUser = response.data || null;
          const resolvedAvatar = apiUser?.avatar || getStoredAvatar();
          setUser(apiUser ? { ...apiUser, avatar: resolvedAvatar } : null);
          setUserAvatar(resolvedAvatar);
        } catch (error) {
          console.error('Failed to load user:', error);
          localStorage.removeItem('token');
          localStorage.removeItem(AVATAR_STORAGE_KEY);
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, [token, setUserAvatar]);

  const login = useCallback(async (email, password) => {
    try {
      const response = await api.login(email, password);
      const newToken = response.data.token;
      const resolvedAvatar = response.data.user?.avatar || getStoredAvatar();
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser({ ...response.data.user, avatar: resolvedAvatar });
      setUserAvatar(resolvedAvatar);
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [setUserAvatar]);

  const register = useCallback(async (name, email, password) => {
    try {
      const response = await api.register(name, email, password);
      const newToken = response.data.token;
      const resolvedAvatar = response.data.user?.avatar || 'avatar-1';
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser({ ...response.data.user, avatar: resolvedAvatar });
      setUserAvatar(resolvedAvatar);
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }, [setUserAvatar]);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem(AVATAR_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    setUserAvatar,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
