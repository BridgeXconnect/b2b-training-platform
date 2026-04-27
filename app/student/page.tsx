'use client';

import { RoleGuard } from '../../lib/contexts/AuthContext';

export default function StudentPortal() {
  return (
    <RoleGuard allowedRoles={['STUDENT', 'ADMIN']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">Student Portal</h1>
          <p className="text-gray-500 mt-1">Access your English training courses.</p>
        </div>
      </div>
    </RoleGuard>
  );
}
