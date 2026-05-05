/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as api from '../api/endpoints';
import { useToast } from './ToastContext';

const AdminAuthContext = createContext();
const ADMIN_TOKEN_STORAGE_KEY = 'adminToken';
const ADMIN_USER_STORAGE_KEY = 'adminUser';

const unwrapData = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return payload;
  }
  return payload.data ?? payload;
};

const normalizeAdminAuthPayload = (payload) => {
  const unwrapped = unwrapData(payload);
  return {
    adminToken: unwrapped?.token || null,
    adminUser: unwrapped?.user || null,
  };
};

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [adminToken, setAdminToken] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const toastApi = useToast();

  // Restore admin auth session on app load
  useEffect(() => {
    let cancelled = false;

    const restoreAdminSession = async () => {
      const storedAdminToken = localStorage.getItem(ADMIN_TOKEN_STORAGE_KEY);
      if (!storedAdminToken) {
        if (!cancelled) {
          setAdminToken(null);
          setAdminUser(null);
          setAdminLoading(false);
        }
        return;
      }

      if (!cancelled) {
        setAdminToken(storedAdminToken);
      }

      try {
        const response = await api.getAdminMe();
        const apiAdminUser = unwrapData(response) || null;

        if (!cancelled) {
          setAdminUser(apiAdminUser);
        }
      } catch {
        if (!cancelled) {
          localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
          localStorage.removeItem(ADMIN_USER_STORAGE_KEY);
          setAdminToken(null);
          setAdminUser(null);
          toastApi.show({ message: 'Admin session expired. Please log in again.', type: 'error' });
        }
      } finally {
        if (!cancelled) {
          setAdminLoading(false);
        }
      }
    };

    restoreAdminSession();

    return () => {
      cancelled = true;
    };
  }, [toastApi]);

  const adminLogin = useCallback(async (emailOrPayload, password) => {
    const responseOrPayload =
      typeof emailOrPayload === 'object' && emailOrPayload !== null
        ? emailOrPayload
        : await api.adminLogin(emailOrPayload, password);

    const { adminToken: newAdminToken, adminUser: rawAdminUser } = normalizeAdminAuthPayload(responseOrPayload);
    if (!newAdminToken || !rawAdminUser) {
      throw new Error('Invalid admin login response');
    }

    localStorage.setItem(ADMIN_TOKEN_STORAGE_KEY, newAdminToken);
    localStorage.setItem(ADMIN_USER_STORAGE_KEY, JSON.stringify(rawAdminUser));
    setAdminToken(newAdminToken);
    setAdminUser(rawAdminUser);
    return responseOrPayload;
  }, []);

  const adminLogout = useCallback(() => {
    localStorage.removeItem(ADMIN_TOKEN_STORAGE_KEY);
    localStorage.removeItem(ADMIN_USER_STORAGE_KEY);
    setAdminToken(null);
    setAdminUser(null);
    toastApi.show({ message: 'Admin logged out successfully', type: 'success' });
  }, [toastApi]);

  const value = {
    adminUser,
    adminToken,
    adminLoading,
    adminLogin,
    adminLogout,
    isAdminAuthenticated: !!adminUser && !!adminToken,
    isAdminLoading: adminLoading,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const context = React.useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

export default AdminAuthContext;
