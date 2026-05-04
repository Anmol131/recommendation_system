import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useToast } from '../../context/ToastContext';

function AdminProtectedRoute({ children }) {
  const { adminUser, adminLoading, adminLogout } = useAdminAuth();
  const toastApi = useToast();

  useEffect(() => {
    if (adminLoading) return;

    if (!adminUser) {
      toastApi.show({ message: 'Admin access required', type: 'error' });
    } else if (adminUser.role !== 'admin') {
      toastApi.show({ message: 'Access denied', type: 'error' });
    }
  }, [adminLoading, adminUser, toastApi]);

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!adminUser) {
    return <Navigate to="/admin/login" replace />;
  }

  // Verify admin role
  if (adminUser.role !== 'admin') {
    // Clear invalid admin token and redirect
    adminLogout();
    return <Navigate to="/admin/login" replace />;
  }

  return children;
}

export default AdminProtectedRoute;
