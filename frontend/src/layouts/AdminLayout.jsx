import React from 'react';
import AdminSidebar from '../components/admin/AdminSidebar';

function AdminLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 pt-16 lg:pt-0">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}

export default AdminLayout;
