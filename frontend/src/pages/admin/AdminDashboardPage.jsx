import React, { useEffect, useState } from 'react';
import { Film, BookOpen, Music, Gamepad2, FileText, Users, Search } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import * as api from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { handleApiError } from '../../utils/handleApiError';

function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const toastApi = useToast();

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.getAdminDashboard();
      if (response.success) {
        setStats(response.data);
        toastApi.show({ message: 'Dashboard stats refreshed', type: 'success' });
      } else {
        setError('Failed to fetch dashboard stats');
      }
    } catch (err) {
      const msg = handleApiError(err, 'Error loading dashboard');
      setError(msg);
      toastApi.show({ message: 'Dashboard stats load failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon, label, value, color }) => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4" style={{ borderColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{value ?? '—'}</p>
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: `${color}20` }}>
          {React.createElement(icon, { size: 32, style: { color } })}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's an overview of your platform.</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={Film}
              label="Total Movies"
              value={stats.totalMovies}
              color="#EF4444"
            />
            <StatCard
              icon={BookOpen}
              label="Total Books"
              value={stats.totalBooks}
              color="#F59E0B"
            />
            <StatCard
              icon={Music}
              label="Total Music"
              value={stats.totalMusic}
              color="#8B5CF6"
            />
            <StatCard
              icon={Gamepad2}
              label="Total Games"
              value={stats.totalGames}
              color="#10B981"
            />
          </div>
        )}

        {/* Second Row */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              icon={FileText}
              label="Total Content Items"
              value={stats.totalContent}
              color="#3B82F6"
            />
            <StatCard
              icon={Users}
              label="Total Users"
              value={stats.totalUsers}
              color="#EC4899"
            />
            <StatCard
              icon={Search}
              label="Total Search Logs"
              value={stats.totalSearchLogs}
              color="#06B6D4"
            />
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <a
              href="/admin/content"
              className="p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg border border-blue-200 dark:border-blue-800 transition-colors"
            >
              <p className="font-semibold text-blue-900 dark:text-blue-200">Manage Content</p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">Edit, add, or delete content items</p>
            </a>
            <a
              href="/admin/content/add"
              className="p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg border border-green-200 dark:border-green-800 transition-colors"
            >
              <p className="font-semibold text-green-900 dark:text-green-200">Add New Content</p>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">Create a new content item</p>
            </a>
            <a
              href="/admin/search-logs"
              className="p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg border border-purple-200 dark:border-purple-800 transition-colors"
            >
              <p className="font-semibold text-purple-900 dark:text-purple-200">Search Logs</p>
              <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">View user search history</p>
            </a>
            <button
              onClick={fetchStats}
              className="p-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors"
            >
              <p className="font-semibold text-gray-900 dark:text-white">Refresh Stats</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">Reload dashboard data</p>
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminDashboardPage;
