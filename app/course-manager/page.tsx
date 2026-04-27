'use client';

import { RoleGuard } from '../../lib/contexts/AuthContext';

export default function CourseManagerPortal() {
  return (
    <RoleGuard allowedRoles={['COURSE_MANAGER', 'ADMIN']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">Course Manager Portal</h1>
          <p className="text-gray-500 mt-1">Review and approve AI-generated courses.</p>
        </div>
      </div>
    </RoleGuard>
  );
}
