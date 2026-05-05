import React, { useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  Pencil,
  Search,
  Trash2,
  X,
  Save,
  Star,
  BadgeInfo,
} from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import ConfirmDialog from '../../components/admin/ConfirmDialog';
import * as api from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { handleApiError } from '../../utils/handleApiError';
import { useAdminAuth } from '../../context/AdminAuthContext';

const PAGE_SIZE = 20;

const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
};

const roleBadgeClasses = {
  admin: 'bg-sky-500/15 text-sky-300 ring-1 ring-sky-500/30',
  user: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30',
};

function AdminUsersPage() {
  const { adminUser } = useAdminAuth();
  const toastApi = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, page: 1, totalPages: 1 });
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', role: 'user' });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [actionBusyId, setActionBusyId] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, search, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.getAdminUsers({
        page: currentPage,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        role: roleFilter || undefined,
      });

      const payload = response?.data || response;
      const usersData = payload?.users || [];
      const total = payload?.total ?? 0;
      const page = payload?.page ?? currentPage;
      const totalPages = payload?.totalPages ?? 1;

      setUsers(usersData);
      setPagination({ total, page, totalPages });
    } catch (err) {
      const message = handleApiError(err, 'Failed to load users');
      setError(message);
      toastApi.show({ message: 'Users loaded failed', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const refreshListAfterMutation = (updatedUser) => {
    setUsers((prev) => prev.map((user) => (user._id === updatedUser._id ? { ...user, ...updatedUser } : user)));
    if (selectedUser?._id === updatedUser._id) {
      setSelectedUser((prev) => (prev ? { ...prev, ...updatedUser } : prev));
    }
  };

  const openViewUser = async (userId) => {
    try {
      setViewOpen(true);
      setViewLoading(true);
      setSelectedUser(null);
      const response = await api.getAdminUserById(userId);
      const userData = response?.data?.user || response?.user || null;
      setSelectedUser(userData);
    } catch (err) {
      toastApi.show({ message: handleApiError(err, 'Failed to load user details'), type: 'error' });
      setViewOpen(false);
    } finally {
      setViewLoading(false);
    }
  };

  const openEditUser = (user) => {
    setEditForm({
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user',
    });
    setSelectedUser(user);
    setEditOpen(true);
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    if (!selectedUser) return;
    if (String(selectedUser._id) === String(adminUser?._id) && editForm.role !== 'admin') {
      toastApi.show({ message: 'You cannot remove your own admin role', type: 'error' });
      return;
    }

    try {
      setEditSaving(true);
      const response = await api.updateAdminUser(selectedUser._id, editForm);
      const updatedUser = response?.data?.user || response?.user || response?.data || null;
      if (updatedUser) {
        refreshListAfterMutation(updatedUser);
      }
      toastApi.show({ message: 'User updated successfully', type: 'success' });
      setEditOpen(false);
    } catch (err) {
      const message = handleApiError(err, 'Failed to update user');
      toastApi.show({ message: message || 'User update failed', type: 'error' });
    } finally {
      setEditSaving(false);
    }
  };

  const handleRequestDelete = (user) => {
    if (String(user._id) === String(adminUser?._id)) {
      toastApi.show({ message: 'Cannot delete yourself', type: 'error' });
      return;
    }

    setDeleteTarget(user);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setActionBusyId(deleteTarget._id);
      const response = await api.deleteAdminUser(deleteTarget._id);
      if (response?.success) {
        setUsers((prev) => prev.filter((user) => user._id !== deleteTarget._id));
        toastApi.show({ message: 'User deleted successfully', type: 'success' });
      }
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      if (selectedUser?._id === deleteTarget._id) {
        setViewOpen(false);
        setSelectedUser(null);
      }
    } catch (err) {
      const message = handleApiError(err, 'Failed to delete user');
      toastApi.show({ message, type: 'error' });
    } finally {
      setActionBusyId(null);
    }
  };

  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  const handleFilterReset = () => {
    setSearch('');
    setRoleFilter('');
    setCurrentPage(1);
  };

  const totalStart = pagination.total === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const totalEnd = Math.min(currentPage * PAGE_SIZE, pagination.total || 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">View, edit, or remove registered users.</p>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {pagination.total} total accounts
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-4 md:p-5 border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-5 relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Search by name or email"
                className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="lg:col-span-3">
              <select
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(event.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            <div className="lg:col-span-4 flex lg:justify-end">
              <button
                type="button"
                onClick={handleFilterReset}
                className="w-full lg:w-auto px-4 py-2.5 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-600 dark:text-gray-400">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-gray-600 dark:text-gray-400">
              No users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900/40">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Role</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Favorites</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Joined Date</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  {users.map((user) => {
                    const isBusy = actionBusyId === user._id;
                    const isSelf = String(user._id) === String(adminUser?._id);
                    return (
                      <tr key={user._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/40 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-semibold">
                              {String(user.name || '?').slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                              {isSelf && (
                                <p className="text-xs text-cyan-500 dark:text-cyan-300">Current admin</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${roleBadgeClasses[user.role] || roleBadgeClasses.user}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {user.favoritesCount ?? 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30">
                            active
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openViewUser(user._id)}
                              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                              <Eye size={14} />
                              View
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditUser(user)}
                              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                            >
                              <Pencil size={14} />
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={isBusy || isSelf}
                              onClick={() => handleRequestDelete(user)}
                              className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              title={isSelf ? 'You cannot delete yourself' : 'Delete user'}
                            >
                              <Trash2 size={14} />
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between text-sm text-gray-600 dark:text-gray-400">
          <p>
            Showing {totalStart}-{totalEnd} of {pagination.total || 0} users
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              disabled={currentPage <= 1}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              <ChevronLeft size={16} />
              Prev
            </button>
            <span className="px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white">
              Page {pagination.page || currentPage} of {pagination.totalPages || 1}
            </span>
            <button
              type="button"
              onClick={() => setCurrentPage((page) => Math.min(page + 1, pagination.totalPages || 1))}
              disabled={currentPage >= (pagination.totalPages || 1)}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Next
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {viewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-700 bg-gray-900 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-700 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold">User Details</h2>
                <p className="text-sm text-gray-400">Basic account information and recent favorites.</p>
              </div>
              <button
                type="button"
                onClick={() => setViewOpen(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {viewLoading ? (
                <div className="py-16 text-center text-gray-400">Loading user details...</div>
              ) : selectedUser ? (
                <div className="grid gap-6 md:grid-cols-3">
                  <div className="md:col-span-2 space-y-4">
                    <div className="rounded-xl bg-gray-800 p-5 border border-gray-700">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-3">
                            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-lg font-bold text-white">
                              {String(selectedUser.name || '?').slice(0, 1).toUpperCase()}
                            </div>
                            <div>
                              <h3 className="text-2xl font-semibold">{selectedUser.name}</h3>
                              <p className="text-gray-400">{selectedUser.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleBadgeClasses[selectedUser.role] || roleBadgeClasses.user}`}>
                            {selectedUser.role}
                          </span>
                          <span className="rounded-full px-3 py-1 text-xs font-semibold bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/30">
                            active
                          </span>
                        </div>
                      </div>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div className="rounded-lg bg-gray-900/70 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Bio</p>
                          <p className="mt-2 text-sm text-gray-200 whitespace-pre-wrap">{selectedUser.bio || 'No bio provided.'}</p>
                        </div>
                        <div className="rounded-lg bg-gray-900/70 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Favorites Count</p>
                          <p className="mt-2 text-3xl font-bold text-white">{selectedUser.favoritesCount ?? 0}</p>
                        </div>
                        <div className="rounded-lg bg-gray-900/70 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Joined</p>
                          <p className="mt-2 text-sm text-gray-200">{formatDate(selectedUser.createdAt)}</p>
                        </div>
                        <div className="rounded-lg bg-gray-900/70 p-4">
                          <p className="text-xs uppercase tracking-wide text-gray-500">Updated</p>
                          <p className="mt-2 text-sm text-gray-200">{formatDate(selectedUser.updatedAt)}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-xl bg-gray-800 p-5 border border-gray-700">
                      <div className="flex items-center gap-2 text-gray-300">
                        <BadgeInfo size={18} />
                        <h4 className="font-semibold">Recent Favorites</h4>
                      </div>
                      <div className="mt-4 space-y-3">
                        {Array.isArray(selectedUser.recentFavorites) && selectedUser.recentFavorites.length > 0 ? (
                          selectedUser.recentFavorites.map((favorite, index) => (
                            <div key={`${favorite.itemId || favorite.title || 'favorite'}-${index}`} className="rounded-lg border border-gray-700 bg-gray-900/70 p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="font-medium text-white">{favorite.title || 'Untitled'}</p>
                                  <p className="text-xs text-gray-400">{favorite.itemType || 'item'} · {favorite.genre || '—'}</p>
                                </div>
                                <span className="inline-flex items-center gap-1 text-xs text-amber-300">
                                  <Star size={12} />
                                  Favorite
                                </span>
                              </div>
                              <p className="mt-2 text-xs text-gray-500">Saved {formatDate(favorite.savedAt)}</p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-400">No favorites available.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {editOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-xl rounded-2xl border border-gray-700 bg-gray-900 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-700 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold">Edit User</h2>
                <p className="text-sm text-gray-400">Update the user profile and role.</p>
              </div>
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 p-6">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))}
                  className="w-full rounded-lg bg-gray-800 px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="User name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))}
                  className="w-full rounded-lg bg-gray-800 px-4 py-2.5 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-300">Role</label>
                <select
                  value={editForm.role}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, role: event.target.value }))}
                  disabled={String(selectedUser._id) === String(adminUser?._id)}
                  className="w-full rounded-lg bg-gray-800 px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                {String(selectedUser._id) === String(adminUser?._id) && (
                  <p className="mt-2 text-xs text-amber-300">Your own admin role cannot be removed.</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="rounded-lg bg-gray-700 px-4 py-2.5 text-white hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSaving}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  <Save size={16} />
                  {editSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title="Delete User"
        message={deleteTarget ? `Are you sure you want to delete ${deleteTarget.name}? This action cannot be undone.` : ''}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        isDanger
      />
    </AdminLayout>
  );
}

export default AdminUsersPage;
