'use client';

import { RoleGuard } from '../../lib/contexts/AuthContext';

export default function AdminPortal() {
  return (
    <RoleGuard allowedRoles={['ADMIN']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">Admin Portal</h1>
          <p className="text-gray-500 mt-1">Manage users, roles, and platform settings.</p>
        </div>
      </div>
    </RoleGuard>
  );
}
