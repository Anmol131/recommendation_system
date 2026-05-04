import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BarChart3, FileText, Search, Users } from 'lucide-react';

function AdminSidebar({ isOpen, mobileMenuOpen, onMobileClose }) {
  const location = useLocation();

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/admin/users', label: 'Users', icon: Users },
    { path: '/admin/content', label: 'Manage Content', icon: FileText },
    { path: '/admin/search-logs', label: 'Search Logs', icon: Search },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-16 md:top-0 w-64 h-[calc(100vh-64px)] md:h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 p-6 transform transition-transform duration-300 z-30 md:relative md:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Hidden on mobile */}
        <div className="hidden md:block mb-8">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Admin Panel</h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Management System</p>
        </div>

        {/* Navigation Menu */}
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onMobileClose}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  active
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={onMobileClose}
        ></div>
      )}
    </>
  );
}

export default AdminSidebar;
