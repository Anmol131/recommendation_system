import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, BarChart3, FileText, Search, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
    { path: '/admin/content', label: 'Manage Content', icon: FileText },
    { path: '/admin/search-logs', label: 'Search Logs', icon: Search },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <>
      {/* Mobile menu toggle */}
      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 p-4 z-40 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="text-gray-600 dark:text-gray-300"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 w-64 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 p-6 transform transition-transform duration-300 z-30 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } lg:relative lg:transform-none`}
      >
        {/* Hidden on mobile */}
        <div className="hidden lg:block mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Management System</p>
        </div>

        {/* Mobile spacing */}
        <div className="lg:hidden mb-20"></div>

        {/* Navigation Menu */}
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsOpen(false)}
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

        {/* Logout Button */}
        <div className="absolute bottom-6 left-6 right-6">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}

export default AdminSidebar;
