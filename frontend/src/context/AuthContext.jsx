import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api/endpoints';

const AuthContext = createContext();
const AVATAR_STORAGE_KEY = 'vibeify_avatar';

const getStoredAvatar = () => localStorage.getItem(AVATAR_STORAGE_KEY) || 'avatar-1';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
    return storedAvatar ? { avatar: storedAvatar, bio: '' } : null;
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

  const setUserBio = useCallback((bio) => {
    const safeBio = typeof bio === 'string' ? bio : '';
    setUser((current) => (current ? { ...current, bio: safeBio } : { bio: safeBio }));
  }, []);

  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          const response = await api.getMe();
          const apiUser = response.data || null;
          const resolvedAvatar = apiUser?.avatar || getStoredAvatar();
          const resolvedBio = typeof apiUser?.bio === 'string' ? apiUser.bio : '';
          setUser(apiUser ? { ...apiUser, avatar: resolvedAvatar, bio: resolvedBio } : null);
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

  const login = useCallback(async (emailOrPayload, password) => {
    try {
      const payload =
        typeof emailOrPayload === 'object' && emailOrPayload !== null
          ? emailOrPayload
          : await api.login(emailOrPayload, password);

      const newToken = payload.token;
      const resolvedAvatar = payload.user?.avatar || getStoredAvatar();
      const resolvedBio = typeof payload.user?.bio === 'string' ? payload.user.bio : '';
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser({ ...payload.user, avatar: resolvedAvatar, bio: resolvedBio });
      setUserAvatar(resolvedAvatar);
      return payload;
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
      const resolvedBio = typeof response.data.user?.bio === 'string' ? response.data.user.bio : '';
      localStorage.setItem('token', newToken);
      setToken(newToken);
      setUser({ ...response.data.user, avatar: resolvedAvatar, bio: resolvedBio });
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
    setUser((current) => (current ? { ...current, avatar: '', bio: '' } : null));
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
    setUserBio,
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
