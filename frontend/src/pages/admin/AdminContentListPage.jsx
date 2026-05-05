import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import * as api from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { handleApiError } from '../../utils/handleApiError';

function AdminContentListPage() {
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const toastApi = useToast();

  const CONTENT_TYPES = [
    { value: '', label: 'All Types' },
    { value: 'movie', label: 'Movies' },
    { value: 'book', label: 'Books' },
    { value: 'music', label: 'Music' },
    { value: 'game', label: 'Games' },
  ];

  useEffect(() => {
    fetchContent();
  }, [currentPage, typeFilter, searchQuery]);

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.getAdminContent({
        page: currentPage,
        limit: 10,
        type: typeFilter,
        search: searchQuery,
      });

      if (response.success) {
        setContent(response.data.items || []);
        setPagination({
          total: response.data.total || 0,
          page: response.data.page || 1,
          totalPages: response.data.totalPages || 1,
        });
      } else {
        setError('Failed to fetch content');
      }
    } catch (err) {
      const msg = handleApiError(err, 'Error loading content');
      setError(msg);
      toastApi.show({ message: 'Content loaded failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm('Are you sure you want to delete this content?')) {
      return;
    }

    try {
      const response = await api.deleteAdminContent(item.type, item._id);
      if (response.success) {
        toastApi.show({ message: 'Content deleted successfully', type: 'success' });
        fetchContent();
      } else {
        toastApi.show({ message: 'Failed to delete content', type: 'error' });
      }
    } catch {
      toastApi.show({ message: 'Error deleting content', type: 'error' });
    }
  };

  const handleSearch = (value) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleFilterChange = (value) => {
    setTypeFilter(value);
    setCurrentPage(1);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Content Management</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Manage all content items</p>
          </div>
          <Link
            to="/admin/content/add"
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={20} />
            <span>Add Content</span>
          </Link>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search content..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => handleFilterChange(e.target.value)}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {CONTENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading content...</p>
            </div>
          ) : content.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No content found</p>
              <Link
                to="/admin/content/add"
                className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Plus size={20} />
                <span>Create First Content</span>
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Title</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Type</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Genre</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Year</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Rating</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {content.map((item) => (
                      <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white truncate">{item.title}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 capitalize">
                            {item.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{item.genre || '—'}</td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{item.year || '—'}</td>
                        <td className="px-6 py-4">
                          {item.rating ? (
                            <span className="text-yellow-500 font-medium">{item.rating.toFixed(1)}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Link
                              to={`/admin/content/edit/${item._id}`}
                              className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                              title="Edit"
                            >
                              <Edit2 size={18} />
                            </Link>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-2 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {pagination.page}
                  </span>
                  <button
                    onClick={() => setCurrentPage(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="p-2 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* toasts handled by global ToastProvider */}
    </AdminLayout>
  );
}

export default AdminContentListPage;
