import React from 'react';
import { AlertCircle, X } from 'lucide-react';

function ConfirmDialog({ isOpen, title, message, confirmText = 'Delete', cancelText = 'Cancel', onConfirm, onCancel, isDanger = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-sm mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-full ${isDanger ? 'bg-red-100 dark:bg-red-900/30' : 'bg-blue-100 dark:bg-blue-900/30'}`}>
              <AlertCircle size={20} className={isDanger ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'} />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300">{message}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
              isDanger
                ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800'
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
