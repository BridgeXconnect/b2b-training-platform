'use client';

import { RoleGuard } from '../../lib/contexts/AuthContext';
import TrainerPortal from '../../components/trainer/TrainerPortal';

export default function TrainerPage() {
  return (
    <RoleGuard allowedRoles={['TRAINER', 'ADMIN']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <TrainerPortal />
        </div>
      </div>
    </RoleGuard>
  );
}
