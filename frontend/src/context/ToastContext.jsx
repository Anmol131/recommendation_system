/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({ message: '', type: 'info', visible: false });
  const idRef = useRef(0);
  const timeoutRef = useRef(null);

  const clearTimeoutRef = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const show = useCallback(({ message, type = 'info', duration = 3000 }) => {
    clearTimeoutRef();
    const id = ++idRef.current;
    setToast({ message, type, visible: true, id });
    timeoutRef.current = setTimeout(() => {
      setToast((t) => (t.id === id ? { ...t, visible: false } : t));
    }, duration);
    return id;
  }, []);

  const showLoading = useCallback(({ message = 'Loading...' }) => {
    clearTimeoutRef();
    const id = ++idRef.current;
    setToast({ message, type: 'loading', visible: true, id });
    return id;
  }, []);

  const update = useCallback(({ id, message, type = 'success', duration = 3000 }) => {
    // only update if id matches current
    setToast((current) => {
      if (!current || current.id !== id) return current;
      clearTimeoutRef();
      const newToast = { message, type, visible: true, id };
      timeoutRef.current = setTimeout(() => {
        setToast((t) => (t.id === id ? { ...t, visible: false } : t));
      }, duration);
      return newToast;
    });
  }, []);

  const hide = useCallback(() => {
    clearTimeoutRef();
    setToast((t) => ({ ...t, visible: false }));
  }, []);

  useEffect(() => {
    const handleAuthExpired = (event) => {
      const detail = event?.detail || {};
      show({
        message: detail.message || 'Your session expired. Please log in again.',
        type: detail.type || 'error',
      });
    };

    window.addEventListener('vibeify:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('vibeify:auth-expired', handleAuthExpired);
  }, [show]);

  return (
    <ToastContext.Provider value={{ show, showLoading, update, hide }}>
      {children}
      {toast.visible && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast((t) => ({ ...t, visible: false }))}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export default ToastContext;
