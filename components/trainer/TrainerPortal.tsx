'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { GeneratedCourse, CourseStatus, apiClient } from '../../lib/api-client';
import {
  BookOpen, Clock, Award, UserCheck, RefreshCw, ChevronRight, GraduationCap,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const COURSE_STATUS_BADGE: Record<CourseStatus, React.ReactNode> = {
  GENERATED: <Badge variant="outline" className="border-blue-400 text-blue-700">Generated</Badge>,
  UNDER_REVIEW: <Badge variant="default" className="bg-yellow-500">Under Review</Badge>,
  APPROVED: <Badge variant="default" className="bg-green-600">Approved</Badge>,
  REQUIRES_REVISION: <Badge variant="destructive">Requires Revision</Badge>,
};

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CourseCardSkeleton() {
  return (
    <div className="animate-pulse border rounded-lg p-5 bg-white space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-3 bg-gray-100 rounded w-1/2" />
      <div className="flex gap-3 mt-3">
        <div className="h-3 bg-gray-100 rounded w-16" />
        <div className="h-3 bg-gray-100 rounded w-12" />
        <div className="h-3 bg-gray-100 rounded w-20" />
      </div>
    </div>
  );
}

// ─── Course Card ──────────────────────────────────────────────────────────────

function CourseCard({ course }: { course: GeneratedCourse }) {
  return (
    <Link href={`/trainer/courses/${course.id}`} className="block group">
      <Card className="hover:shadow-md transition-shadow cursor-pointer group-hover:border-blue-200">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{course.title}</p>
              {course.request?.companyName && (
                <p className="text-sm text-gray-500 mt-0.5">{course.request.companyName}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {COURSE_STATUS_BADGE[course.status]}
              <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-blue-400 transition-colors" />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
            <span className="flex items-center gap-1">
              <Award className="h-4 w-4 text-blue-400" /> CEFR {course.cefrLevel}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-blue-400" /> {course.totalHours}h total
            </span>
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4 text-blue-400" /> {course.modules.length} modules
            </span>
            {course.trainer && (
              <span className="flex items-center gap-1 text-green-600">
                <UserCheck className="h-4 w-4" /> {course.trainer.name}
              </span>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// ─── Main Portal ──────────────────────────────────────────────────────────────

export default function TrainerPortal() {
  const [courses, setCourses] = useState<GeneratedCourse[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiClient.getCourses();
      setCourses(data);
    } catch {
      // interceptor handles toast
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trainer Portal</h1>
          <p className="text-gray-500 text-sm mt-0.5">Manage and deliver your assigned courses</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} className="flex items-center gap-1.5">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      {/* Course list */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <CourseCardSkeleton key={i} />)}
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <GraduationCap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700">No courses assigned yet</p>
            <p className="text-gray-500 text-sm mt-1">
              A course manager will assign courses to you when they&apos;re ready.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
