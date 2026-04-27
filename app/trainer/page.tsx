'use client';

import { RoleGuard } from '../../lib/contexts/AuthContext';

export default function TrainerPortal() {
  return (
    <RoleGuard allowedRoles={['TRAINER', 'ADMIN']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900">Trainer Portal</h1>
          <p className="text-gray-500 mt-1">Manage and deliver your training sessions.</p>
        </div>
      </div>
    </RoleGuard>
  );
}
