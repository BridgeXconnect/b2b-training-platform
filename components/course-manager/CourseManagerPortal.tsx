'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  GeneratedCourse, ClientRequest, TrainerSummary, CourseStatus, apiClient,
} from '../../lib/api-client';
import {
  BookOpen, CheckCircle, XCircle, RotateCcw, Users, Clock, Award,
  ChevronDown, ChevronUp, Building, Target, UserCheck, AlertTriangle,
  RefreshCw, Eye, FileText,
} from 'lucide-react';

// ─── Helpers ────────────────────────────────────────────────────────────────

const COURSE_STATUS_BADGE: Record<CourseStatus, React.ReactNode> = {
  GENERATED: <Badge variant="outline" className="border-blue-400 text-blue-700">Generated</Badge>,
  UNDER_REVIEW: <Badge variant="default" className="bg-yellow-500">Under Review</Badge>,
  APPROVED: <Badge variant="default" className="bg-green-600">Approved</Badge>,
  REQUIRES_REVISION: <Badge variant="destructive">Requires Revision</Badge>,
};

const REQUEST_STATUS_BADGE: Record<ClientRequest['status'], React.ReactNode> = {
  PENDING: <Badge variant="outline">Pending</Badge>,
  IN_PROGRESS: <Badge variant="default">In Progress</Badge>,
  COMPLETED: <Badge variant="default" className="bg-green-600">Completed</Badge>,
  REQUIRES_REVIEW: <Badge variant="destructive">Requires Review</Badge>,
};

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-3xl font-bold mt-1">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}

// ─── Course Detail Panel ─────────────────────────────────────────────────────

interface CourseDetailPanelProps {
  course: GeneratedCourse;
  trainers: TrainerSummary[];
  onBack: () => void;
  onCourseUpdated: (course: GeneratedCourse) => void;
}

function CourseDetailPanel({ course, trainers, onBack, onCourseUpdated }: CourseDetailPanelProps) {
  const [expandedModule, setExpandedModule] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [revisionNote, setRevisionNote] = useState('');
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [selectedTrainerId, setSelectedTrainerId] = useState(course.trainerId ?? '');

  const handleStatusUpdate = async (status: CourseStatus, note?: string) => {
    setActionLoading(status);
    try {
      const updated = await apiClient.updateCourseStatus(course.id, status, note);
      onCourseUpdated(updated);
      toast.success(
        status === 'APPROVED' ? 'Course approved' :
        status === 'UNDER_REVIEW' ? 'Course sent for review' :
        'Revision requested'
      );
      if (status === 'REQUIRES_REVISION') {
        setShowRevisionForm(false);
        setRevisionNote('');
      }
    } catch {
      // interceptor handles toast
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignTrainer = async () => {
    if (!selectedTrainerId) return;
    setActionLoading('assign');
    try {
      const updated = await apiClient.assignTrainer(course.id, selectedTrainerId);
      onCourseUpdated(updated);
      toast.success('Trainer assigned');
    } catch {
      // interceptor handles toast
    } finally {
      setActionLoading(null);
    }
  };

  const canApprove = course.status === 'UNDER_REVIEW';
  const canRequestRevision = course.status === 'UNDER_REVIEW';
  const canSendForReview = course.status === 'GENERATED' || course.status === 'REQUIRES_REVISION';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={onBack}>← Back to Courses</Button>
        <div className="flex items-center gap-2">
          {COURSE_STATUS_BADGE[course.status]}
        </div>
      </div>

      {/* Revision note alert */}
      {course.status === 'REQUIRES_REVISION' && course.revisionNote && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-900 mb-1">Revision Note</p>
            <p className="text-sm text-red-800">{course.revisionNote}</p>
          </div>
        </div>
      )}

      {/* Course overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{course.title}</CardTitle>
          <p className="text-gray-600 text-sm mt-1">{course.description}</p>
          <div className="flex flex-wrap gap-4 text-sm mt-3">
            <span className="flex items-center gap-1 text-gray-600">
              <Award className="h-4 w-4 text-blue-500" /> CEFR {course.cefrLevel}
            </span>
            <span className="flex items-center gap-1 text-gray-600">
              <Clock className="h-4 w-4 text-blue-500" /> {course.totalHours}h total
            </span>
            <span className="flex items-center gap-1 text-gray-600">
              <BookOpen className="h-4 w-4 text-blue-500" /> {course.modules.length} modules
            </span>
            {course.trainer && (
              <span className="flex items-center gap-1 text-green-600">
                <UserCheck className="h-4 w-4" /> {course.trainer.name}
              </span>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* CM Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Review Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            {canSendForReview && (
              <Button
                variant="outline"
                onClick={() => handleStatusUpdate('UNDER_REVIEW')}
                disabled={!!actionLoading}
                className="border-yellow-400 text-yellow-700 hover:bg-yellow-50"
              >
                <Eye className="h-4 w-4 mr-1" />
                {actionLoading === 'UNDER_REVIEW' ? 'Sending…' : 'Send for Review'}
              </Button>
            )}
            {canApprove && (
              <Button
                onClick={() => handleStatusUpdate('APPROVED')}
                disabled={!!actionLoading}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                {actionLoading === 'APPROVED' ? 'Approving…' : 'Approve Course'}
              </Button>
            )}
            {canRequestRevision && !showRevisionForm && (
              <Button
                variant="destructive"
                onClick={() => setShowRevisionForm(true)}
                disabled={!!actionLoading}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Request Revision
              </Button>
            )}
          </div>

          {/* Revision form */}
          {showRevisionForm && (
            <div className="space-y-3 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm font-medium text-red-900">Describe what needs to be revised</p>
              <textarea
                className="w-full border border-red-200 rounded-md p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
                rows={3}
                placeholder="Be specific about what the sales team needs to correct…"
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleStatusUpdate('REQUIRES_REVISION', revisionNote)}
                  disabled={!revisionNote.trim() || actionLoading === 'REQUIRES_REVISION'}
                >
                  {actionLoading === 'REQUIRES_REVISION' ? 'Sending…' : 'Send Revision Request'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setShowRevisionForm(false); setRevisionNote(''); }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Assign trainer */}
          <div className="flex items-center gap-3 pt-2 border-t">
            <select
              className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-300"
              value={selectedTrainerId}
              onChange={(e) => setSelectedTrainerId(e.target.value)}
            >
              <option value="">Select a trainer…</option>
              {trainers.map((t) => (
                <option key={t.id} value={t.id}>{t.name} — {t.email}</option>
              ))}
            </select>
            <Button
              size="sm"
              onClick={handleAssignTrainer}
              disabled={!selectedTrainerId || actionLoading === 'assign'}
            >
              <UserCheck className="h-4 w-4 mr-1" />
              {actionLoading === 'assign' ? 'Assigning…' : 'Assign Trainer'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modules */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold">Course Modules</h3>
        {course.modules.map((mod, i) => (
          <div key={i} className="border rounded-lg overflow-hidden bg-white">
            <button
              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedModule(expandedModule === i ? null : i)}
            >
              <div>
                <p className="font-medium text-gray-900">{mod.title}</p>
                <p className="text-sm text-gray-500">{mod.lessons.length} lessons · {mod.assessment.type}</p>
              </div>
              {expandedModule === i
                ? <ChevronUp className="h-4 w-4 text-gray-400" />
                : <ChevronDown className="h-4 w-4 text-gray-400" />}
            </button>

            {expandedModule === i && (
              <div className="border-t p-4 bg-gray-50 space-y-4">
                <p className="text-sm text-gray-600">{mod.description}</p>

                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Learning Objectives</p>
                  <ul className="space-y-1">
                    {mod.learningObjectives.map((o, j) => (
                      <li key={j} className="text-sm flex items-start gap-2 text-gray-700">
                        <Target className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />{o}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">Lessons</p>
                  {mod.lessons.map((lesson, j) => (
                    <div key={j} className="bg-white border rounded p-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{lesson.title}</p>
                        <span className="text-xs text-gray-400">{lesson.duration} min · CEFR {lesson.cefrFocus}</span>
                      </div>
                      <div className="flex gap-1 mb-2 flex-wrap">
                        {lesson.skillsFocus.map((s, k) => (
                          <span key={k} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{s}</span>
                        ))}
                      </div>
                      <div className="space-y-1">
                        {lesson.activities.map((act, k) => (
                          <p key={k} className="text-xs text-gray-600 flex items-start gap-1">
                            <span className="shrink-0 px-1 bg-gray-100 rounded">{act.type}</span>
                            <span>{act.title} — {act.description}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 rounded p-3 text-sm">
                  <p className="font-medium text-blue-900">Assessment: {mod.assessment.title}</p>
                  <p className="text-blue-700 text-xs mt-0.5">{mod.assessment.description}</p>
                  <p className="text-blue-600 text-xs mt-1">Pass mark: {mod.assessment.passingScore}%</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Overview Tab ────────────────────────────────────────────────────────────

interface OverviewTabProps {
  courses: GeneratedCourse[];
  requests: ClientRequest[];
  onSelectCourse: (course: GeneratedCourse) => void;
}

function OverviewTab({ courses, requests, onSelectCourse }: OverviewTabProps) {
  const pending = courses.filter((c) => c.status === 'GENERATED' || c.status === 'REQUIRES_REVISION');
  const underReview = courses.filter((c) => c.status === 'UNDER_REVIEW');
  const approved = courses.filter((c) => c.status === 'APPROVED');
  const totalParticipants = requests.reduce((sum, r) => sum + r.participantCount, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Courses" value={courses.length} sub="all time" />
        <StatCard label="Pending Review" value={pending.length} sub="need attention" />
        <StatCard label="Under Review" value={underReview.length} sub="in progress" />
        <StatCard label="Approved" value={approved.length} sub={`${totalParticipants} participants`} />
      </div>

      {/* Needs Attention */}
      {pending.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
            Needs Attention ({pending.length})
          </h3>
          <div className="space-y-3">
            {pending.map((course) => (
              <CourseCard key={course.id} course={course} onClick={() => onSelectCourse(course)} />
            ))}
          </div>
        </div>
      )}

      {/* Under Review */}
      {underReview.length > 0 && (
        <div>
          <h3 className="text-base font-semibold mb-3">Under Review ({underReview.length})</h3>
          <div className="space-y-3">
            {underReview.map((course) => (
              <CourseCard key={course.id} course={course} onClick={() => onSelectCourse(course)} />
            ))}
          </div>
        </div>
      )}

      {courses.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700">No courses yet</p>
            <p className="text-gray-500 text-sm mt-1">Courses will appear here once sales reps generate them.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── Requests Tab ────────────────────────────────────────────────────────────

interface RequestsTabProps {
  requests: ClientRequest[];
  onSelectCourse: (course: GeneratedCourse) => void;
}

function RequestsTab({ requests, onSelectCourse }: RequestsTabProps) {
  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">No client requests</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {requests.map((req) => {
        const latestCourse = req.courses.at(-1);
        return (
          <Card key={req.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Building className="h-5 w-5 text-gray-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">{req.companyName}</p>
                    <p className="text-sm text-gray-500">{req.companyIndustry}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {REQUEST_STATUS_BADGE[req.status]}
                  {latestCourse && COURSE_STATUS_BADGE[latestCourse.status]}
                </div>
              </div>

              <div className="flex flex-wrap gap-5 text-sm text-gray-600 mb-3">
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />{req.participantCount} participants
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />{req.totalHours}h
                </span>
                <span>{req.currentLevel} → {req.targetLevel}</span>
                <span>{req.courses.length} course{req.courses.length !== 1 ? 's' : ''}</span>
              </div>

              {req.courses.length > 0 && (
                <div className="space-y-2 mt-2">
                  {req.courses.map((course) => (
                    <button
                      key={course.id}
                      className="w-full flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 rounded text-left text-sm transition-colors"
                      onClick={() => onSelectCourse(course)}
                    >
                      <span className="font-medium truncate mr-2">{course.title}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        {COURSE_STATUS_BADGE[course.status]}
                        <Eye className="h-3.5 w-3.5 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ─── Courses for Review Tab ──────────────────────────────────────────────────

interface CoursesReviewTabProps {
  courses: GeneratedCourse[];
  statusFilter: CourseStatus | 'ALL';
  onFilterChange: (f: CourseStatus | 'ALL') => void;
  onSelectCourse: (course: GeneratedCourse) => void;
}

const FILTER_OPTIONS: { label: string; value: CourseStatus | 'ALL' }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Generated', value: 'GENERATED' },
  { label: 'Under Review', value: 'UNDER_REVIEW' },
  { label: 'Requires Revision', value: 'REQUIRES_REVISION' },
  { label: 'Approved', value: 'APPROVED' },
];

function CoursesReviewTab({ courses, statusFilter, onFilterChange, onSelectCourse }: CoursesReviewTabProps) {
  const filtered = statusFilter === 'ALL' ? courses : courses.filter((c) => c.status === statusFilter);

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onFilterChange(opt.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              statusFilter === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No courses match this filter.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((course) => (
            <CourseCard key={course.id} course={course} onClick={() => onSelectCourse(course)} showRequest />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shared CourseCard ───────────────────────────────────────────────────────

interface CourseCardProps {
  course: GeneratedCourse & { request?: { companyName?: string } };
  onClick: () => void;
  showRequest?: boolean;
}

function CourseCard({ course, onClick, showRequest }: CourseCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-900 truncate">{course.title}</p>
            {showRequest && course.request && (
              <p className="text-sm text-gray-500 truncate">{(course.request as { companyName?: string }).companyName}</p>
            )}
            <p className="text-sm text-gray-500 line-clamp-2 mt-0.5">{course.description}</p>
          </div>
          <div className="shrink-0">{COURSE_STATUS_BADGE[course.status]}</div>
        </div>

        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
          <span className="flex items-center gap-1">
            <Award className="h-4 w-4 text-blue-400" /> CEFR {course.cefrLevel}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-blue-400" /> {course.totalHours}h
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4 text-blue-400" /> {course.modules.length} modules
          </span>
          {course.trainer && (
            <span className="flex items-center gap-1 text-green-600">
              <UserCheck className="h-4 w-4" /> {course.trainer.name}
            </span>
          )}
          {course.status === 'REQUIRES_REVISION' && course.revisionNote && (
            <span className="flex items-center gap-1 text-red-600">
              <AlertTriangle className="h-4 w-4" /> Has revision note
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main Portal ─────────────────────────────────────────────────────────────

type Tab = 'overview' | 'requests' | 'courses';

export default function CourseManagerPortal() {
  const [tab, setTab] = useState<Tab>('overview');
  const [courses, setCourses] = useState<GeneratedCourse[]>([]);
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [trainers, setTrainers] = useState<TrainerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState<GeneratedCourse | null>(null);
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'ALL'>('ALL');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [coursesData, requestsData, trainersData] = await Promise.all([
        apiClient.getCourses(),
        apiClient.getClientRequests(),
        apiClient.getTrainers(),
      ]);
      setCourses(coursesData);
      setRequests(requestsData);
      setTrainers(trainersData);
    } catch {
      // interceptor handles toast
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCourseUpdated = (updated: GeneratedCourse) => {
    setCourses((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setSelectedCourse(updated);
  };

  const handleSelectCourse = (course: GeneratedCourse) => {
    setSelectedCourse(course);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (selectedCourse) {
    return (
      <CourseDetailPanel
        course={selectedCourse}
        trainers={trainers}
        onBack={() => setSelectedCourse(null)}
        onCourseUpdated={handleCourseUpdated}
      />
    );
  }

  const TABS: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    {
      id: 'courses',
      label: 'Courses for Review',
      count: courses.filter((c) => c.status === 'GENERATED' || c.status === 'UNDER_REVIEW' || c.status === 'REQUIRES_REVISION').length,
    },
    { id: 'requests', label: 'All Requests', count: requests.length },
  ];

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Course Manager Portal</h1>
          <p className="text-gray-500 text-sm mt-0.5">Review and approve AI-generated courses</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="flex items-center gap-1.5">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                tab === t.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'overview' && (
        <OverviewTab courses={courses} requests={requests} onSelectCourse={handleSelectCourse} />
      )}
      {tab === 'courses' && (
        <CoursesReviewTab
          courses={courses}
          statusFilter={statusFilter}
          onFilterChange={setStatusFilter}
          onSelectCourse={handleSelectCourse}
        />
      )}
      {tab === 'requests' && (
        <RequestsTab requests={requests} onSelectCourse={handleSelectCourse} />
      )}
    </div>
  );
}
