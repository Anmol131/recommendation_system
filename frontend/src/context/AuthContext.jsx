import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api/endpoints';

const AuthContext = createContext();
const AVATAR_STORAGE_KEY = 'vibeify_avatar';
const TOKEN_STORAGE_KEY = 'token';

const getStoredAvatar = () => localStorage.getItem(AVATAR_STORAGE_KEY) || 'avatar-1';

const unwrapData = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }
  return payload.data ?? payload;
};

const normalizeAuthPayload = (payload) => {
  const unwrapped = unwrapData(payload);
  return {
    token: unwrapped?.token || null,
    user: unwrapped?.user || null,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
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

  // Restore auth session on app load.
  useEffect(() => {
    let cancelled = false;

    const restoreSession = async () => {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!storedToken) {
        if (!cancelled) {
          setToken(null);
          setUser(null);
          setLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setToken(storedToken);
      }

      try {
        const response = await api.getMe();
        const apiUser = unwrapData(response) || null;
        const resolvedAvatar = apiUser?.avatar || getStoredAvatar();
        const resolvedBio = typeof apiUser?.bio === 'string' ? apiUser.bio : '';

        if (!cancelled) {
          localStorage.setItem(AVATAR_STORAGE_KEY, resolvedAvatar);
          setUser(apiUser ? { ...apiUser, avatar: resolvedAvatar, bio: resolvedBio } : null);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to restore user session:', error);
          localStorage.removeItem(TOKEN_STORAGE_KEY);
          localStorage.removeItem(AVATAR_STORAGE_KEY);
          setToken(null);
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (emailOrPayload, password) => {
    try {
      const responseOrPayload =
        typeof emailOrPayload === 'object' && emailOrPayload !== null
          ? emailOrPayload
          : await api.login(emailOrPayload, password);

      const { token: newToken, user: rawUser } = normalizeAuthPayload(responseOrPayload);
      if (!newToken || !rawUser) {
        throw new Error('Invalid login response');
      }

      const resolvedAvatar = rawUser.avatar || getStoredAvatar();
      const resolvedBio = typeof rawUser.bio === 'string' ? rawUser.bio : '';
      localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
      setToken(newToken);
      setUser({ ...rawUser, avatar: resolvedAvatar, bio: resolvedBio });
      setUserAvatar(resolvedAvatar);
      return responseOrPayload;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [setUserAvatar]);

  const register = useCallback(async (name, email, password) => {
    try {
      const response = await api.register(name, email, password);
      const { token: newToken, user: rawUser } = normalizeAuthPayload(response);
      if (!newToken || !rawUser) {
        throw new Error('Invalid register response');
      }

      const resolvedAvatar = rawUser.avatar || 'avatar-1';
      const resolvedBio = typeof rawUser.bio === 'string' ? rawUser.bio : '';
      localStorage.setItem(TOKEN_STORAGE_KEY, newToken);
      setToken(newToken);
      setUser({ ...rawUser, avatar: resolvedAvatar, bio: resolvedBio });
      setUserAvatar(resolvedAvatar);
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }, [setUserAvatar]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
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
    setUserBio,
    isAuthenticated: !!user && !!token,
    isLoading: loading,
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
