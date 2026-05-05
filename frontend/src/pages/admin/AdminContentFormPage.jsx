import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import AdminLayout from '../../layouts/AdminLayout';
import * as api from '../../api/endpoints';
import { useToast } from '../../context/ToastContext';
import { handleApiError } from '../../utils/handleApiError';

function AdminContentFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState({
    title: '',
    type: 'movie',
    genre: '',
    description: '',
    year: new Date().getFullYear(),
    language: 'English',
    imageUrl: '',
    tags: '',
    rating: '',
    externalApiId: '',
  });

  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const toastApi = useToast();

  const CONTENT_TYPES = ['movie', 'book', 'music', 'game'];
  const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Hindi', 'Mandarin', 'Japanese', 'Korean', 'Other'];

  useEffect(() => {
    if (isEdit) {
      fetchContent();
    }
  }, [id]);

  const fetchContent = async () => {
    try {
      setFetchLoading(true);
      const response = await api.getAdminContentById(id);
      if (response.success) {
        const content = response.data.content;
        setFormData({
          title: content.title,
          type: content.type,
          genre: content.genre || '',
          description: content.description || '',
          year: content.year || new Date().getFullYear(),
          language: content.language || 'English',
          imageUrl: content.imageUrl || '',
          tags: content.tags?.join(', ') || '',
          rating: content.rating || '',
          externalApiId: content.externalApiId || '',
        });
      } else {
        setError('Failed to fetch content');
        toastApi.show({ message: 'Content loaded failed', type: 'error' });
      }
    } catch (err) {
      const msg = handleApiError(err, 'Error loading content');
      setError(msg);
      toastApi.show({ message: 'Content loaded failed', type: 'error' });
    } finally {
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!formData.title) {
        setError('Title is required');
        toastApi.show({ message: 'Title is required', type: 'error' });
        setLoading(false);
        return;
      }

      const payload = {
        ...formData,
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        year: parseInt(formData.year),
        rating: formData.rating ? parseFloat(formData.rating) : null,
      };

      let response;
      if (isEdit) {
        response = await api.updateAdminContent(id, payload);
      } else {
        response = await api.createAdminContent(payload);
      }

      if (response.success) {
        toastApi.show({ message: isEdit ? 'Content updated successfully' : 'Content created successfully', type: 'success' });
        setTimeout(() => {
          navigate('/admin/content');
        }, 1200);
      } else {
        setError(response.message || 'Failed to save content');
      }
    } catch (err) {
      const msg = handleApiError(err, 'Error saving content');
      setError(msg);
      toastApi.show({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading content...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-6">
          <button
            onClick={() => navigate('/admin/content')}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Edit Content' : 'Add New Content'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isEdit ? 'Modify content details' : 'Create a new content item'}
            </p>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Alert */}
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-700 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Enter content title"
                className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            {/* Type and Year */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {CONTENT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Year</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  placeholder="2024"
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Genre and Language */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Genre</label>
                <input
                  type="text"
                  name="genre"
                  value={formData.genre}
                  onChange={handleChange}
                  placeholder="e.g., Action, Drama"
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Language</label>
                <select
                  name="language"
                  value={formData.language}
                  onChange={handleChange}
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang} value={lang}>
                      {lang}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Enter content description"
                rows="4"
                className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              ></textarea>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Image URL</label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Tags, Rating, and API ID */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Tags</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="tag1, tag2, tag3"
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Comma-separated</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">Rating</label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleChange}
                  placeholder="7.5"
                  min="0"
                  max="10"
                  step="0.1"
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-2">External API ID</label>
                <input
                  type="text"
                  name="externalApiId"
                  value={formData.externalApiId}
                  onChange={handleChange}
                  placeholder="API ID"
                  className="w-full px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center space-x-4 pt-6">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
              >
                <Save size={20} />
                <span>{loading ? 'Saving...' : 'Save Content'}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/content')}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* toasts handled by global ToastProvider */}
    </AdminLayout>
  );
}

export default AdminContentFormPage;
