'use client';

import { use } from 'react';
import { RoleGuard } from '../../../../lib/contexts/AuthContext';
import TrainerCourseDetail from '../../../../components/trainer/TrainerCourseDetail';

export default function TrainerCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <RoleGuard allowedRoles={['TRAINER', 'ADMIN']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <TrainerCourseDetail courseId={id} />
        </div>
      </div>
    </RoleGuard>
  );
}
