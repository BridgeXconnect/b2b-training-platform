'use client';

import { useState, useEffect } from 'react';
import { RoleGuard } from '../../lib/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import ClientRequestForm from '../../components/sales/ClientRequestForm';
import RequestsList from '../../components/sales/RequestsList';
import { apiClient, DashboardStats } from '../../lib/api-client';
import { Plus, FileText, Users, Target } from 'lucide-react';

type Tab = 'overview' | 'new-request' | 'requests';

export default function SalesPortal() {
  const [tab, setTab] = useState<Tab>('overview');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    apiClient.getStats()
      .then((data) => { setStats(data); setStatsError(null); })
      .catch(() => setStatsError('Failed to load statistics'))
      .finally(() => setStatsLoading(false));
  }, []);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'new-request', label: 'New Client Request' },
    { id: 'requests', label: 'Manage Requests' },
  ];

  return (
    <RoleGuard allowedRoles={['SALES', 'ADMIN', 'COURSE_MANAGER']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Sales Portal</h1>
            <p className="text-gray-500 mt-1">Manage client requests and AI course generation</p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 mb-6 bg-white rounded-lg p-1 border w-fit">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  tab === t.id ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Overview */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {statsError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-md text-sm">{statsError}</div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                  label="Active Requests"
                  value={statsLoading ? '…' : (stats?.activeRequests ?? '—')}
                  sub="pending or in progress"
                  icon={<FileText className="h-4 w-4 text-muted-foreground" />}
                />
                <StatCard
                  label="Total Requests"
                  value={statsLoading ? '…' : (stats?.totalRequests ?? '—')}
                  sub="all time"
                  icon={<Target className="h-4 w-4 text-muted-foreground" />}
                />
                <StatCard
                  label="Courses Generated"
                  value={statsLoading ? '…' : (stats?.completedCourses ?? '—')}
                  sub="by Claude"
                  icon={<Target className="h-4 w-4 text-muted-foreground" />}
                />
                <StatCard
                  label="Total Participants"
                  value={statsLoading ? '…' : (stats?.totalParticipants ?? '—')}
                  sub="across all programs"
                  icon={<Users className="h-4 w-4 text-muted-foreground" />}
                />
              </div>

              <Card>
                <CardHeader><CardTitle>Quick Actions</CardTitle></CardHeader>
                <CardContent className="flex gap-3">
                  <Button onClick={() => setTab('new-request')} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" /> New Client Request
                  </Button>
                  <Button variant="outline" onClick={() => setTab('requests')}>
                    View All Requests
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {tab === 'new-request' && (
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>New Client Request</CardTitle>
                  <p className="text-gray-500 text-sm">
                    Capture client requirements. Upload SOPs and generate the AI course from the request detail view.
                  </p>
                </CardHeader>
                <CardContent>
                  <ClientRequestForm onSuccess={() => setTab('requests')} />
                </CardContent>
              </Card>
            </div>
          )}

          {tab === 'requests' && <RequestsList />}
        </div>
      </div>
    </RoleGuard>
  );
}

function StatCard({ label, value, sub, icon }: { label: string; value: number | string; sub: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}
