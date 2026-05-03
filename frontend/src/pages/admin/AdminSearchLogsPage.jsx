import React, { useEffect, useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import * as api from '../../api/endpoints';

function AdminSearchLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const TYPES = [
    { value: '', label: 'All Types' },
    { value: 'movie', label: 'Movie' },
    { value: 'book', label: 'Book' },
    { value: 'music', label: 'Music' },
    { value: 'game', label: 'Game' },
    { value: 'unknown', label: 'Unknown' },
  ];

  useEffect(() => {
    fetchLogs();
  }, [currentPage, typeFilter, searchQuery, startDate, endDate]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.getAdminSearchLogs({
        page: currentPage,
        limit: 20,
        type: typeFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });

      if (response.success) {
        setLogs(response.data.logs);
        setPagination(response.data.pagination);
      } else {
        setError('Failed to fetch search logs');
      }
    } catch (err) {
      setError('Error loading search logs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (logs.length === 0) {
      alert('No logs to export');
      return;
    }

    const headers = ['Query', 'Type', 'Intent', 'Results Count', 'User', 'Date'];
    const data = logs.map((log) => [
      log.query,
      log.detectedType,
      log.detectedIntent || '—',
      log.resultsCount,
      log.userId?.name || '—',
      new Date(log.createdAt).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...data.map((row) => row.map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `search-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleReset = () => {
    setTypeFilter('');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const hasFilters = typeFilter || searchQuery || startDate || endDate;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Search Logs</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">User search history and analytics</p>
          </div>
          <button
            onClick={handleExport}
            className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <Download size={20} />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Query */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search queries..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            {/* Start Date */}
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* End Date */}
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {hasFilters && (
            <div className="flex justify-end">
              <button
                onClick={handleReset}
                className="text-sm px-3 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>

        {/* Logs Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading search logs...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">No search logs found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Query</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Type</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Intent</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Results</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">User</th>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {logs.map((log) => (
                      <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4">
                          <p className="font-medium text-gray-900 dark:text-white truncate">{log.query}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 capitalize">
                            {log.detectedType}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">{log.detectedIntent || '—'}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            {log.resultsCount}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {log.userId?.name || 'Guest'}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{log.userId?.email || '—'}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {new Date(log.createdAt).toLocaleDateString()} <br />
                          <span className="text-xs text-gray-500">{new Date(log.createdAt).toLocaleTimeString()}</span>
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
    </AdminLayout>
  );
}

export default AdminSearchLogsPage;
