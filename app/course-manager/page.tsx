'use client';

import { RoleGuard } from '../../lib/contexts/AuthContext';
import CourseManagerPortal from '../../components/course-manager/CourseManagerPortal';

export default function CourseManagerPage() {
  return (
    <RoleGuard allowedRoles={['COURSE_MANAGER', 'ADMIN']}>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <CourseManagerPortal />
        </div>
      </div>
    </RoleGuard>
  );
}
