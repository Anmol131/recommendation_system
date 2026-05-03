import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import { useAdminAuth } from '../../context/AdminAuthContext';
import AdminSidebar from './AdminSidebar';

function AdminLayout({ children }) {
  const navigate = useNavigate();
  const { adminUser, adminLogout } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleAdminLogout = () => {
    adminLogout();
    navigate('/admin/login');
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile menu button */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 md:hidden px-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
        >
          {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        mobileMenuOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col md:ml-64 pt-16 md:pt-0">
        {/* Top bar */}
        <header className="hidden md:flex items-center justify-between h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Admin Dashboard</h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {adminUser?.name || 'Admin'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {adminUser?.email || 'admin@example.com'}
              </p>
            </div>

            <button
              type="button"
              onClick={handleAdminLogout}
              className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 rounded-lg transition-colors"
              title="Logout"
            >
              <FiLogOut size={20} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
