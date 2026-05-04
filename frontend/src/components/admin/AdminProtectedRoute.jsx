import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';

function AdminProtectedRoute({ children }) {
  const { adminUser, adminLoading, adminLogout } = useAdminAuth();

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
    return <Navigate to="/admin/login" replace state={{ adminAccessRequired: true }} />;
  }

  // Verify admin role
  if (adminUser.role !== 'admin') {
    // Clear invalid admin token and redirect
    adminLogout();
    return <Navigate to="/admin/login" replace state={{ adminAccessRequired: true }} />;
  }

  return children;
}

export default AdminProtectedRoute;
