'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { GeneratedCourse, CourseStatus, CourseModule, apiClient } from '../../lib/api-client';
import CohortInfoCard from './CohortInfoCard';
import {
  Award, Clock, BookOpen, ChevronDown, ChevronUp, Target, ArrowLeft,
} from 'lucide-react';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const COURSE_STATUS_BADGE: Record<CourseStatus, React.ReactNode> = {
  GENERATED: <Badge variant="outline" className="border-blue-400 text-blue-700">Generated</Badge>,
  UNDER_REVIEW: <Badge variant="default" className="bg-yellow-500">Under Review</Badge>,
  APPROVED: <Badge variant="default" className="bg-green-600">Approved</Badge>,
  REQUIRES_REVISION: <Badge variant="destructive">Requires Revision</Badge>,
};

// ─── Module Accordion ─────────────────────────────────────────────────────────

function ModuleAccordion({ modules }: { modules: CourseModule[] }) {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="space-y-2">
      {modules.map((mod, i) => (
        <div key={i} className="border rounded-lg overflow-hidden bg-white">
          <button
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
            onClick={() => setExpanded(expanded === i ? null : i)}
          >
            <div>
              <p className="font-medium text-gray-900">
                Module {i + 1}: {mod.title}
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {mod.lessons.length} lesson{mod.lessons.length !== 1 ? 's' : ''}
              </p>
            </div>
            {expanded === i
              ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
              : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
          </button>

          {expanded === i && (
            <div className="border-t p-4 bg-gray-50 space-y-4">
              {mod.description && (
                <p className="text-sm text-gray-600">{mod.description}</p>
              )}

              {mod.learningObjectives.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    Learning Objectives
                  </p>
                  <ul className="space-y-1">
                    {mod.learningObjectives.map((obj, j) => (
                      <li key={j} className="text-sm flex items-start gap-2 text-gray-700">
                        <Target className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />
                        {obj}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Lessons</p>
                {mod.lessons.map((lesson, j) => (
                  <div key={j} className="bg-white border rounded p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium">{lesson.title}</p>
                      <span className="text-xs text-gray-400 shrink-0 ml-2">
                        {lesson.duration} min · CEFR {lesson.cefrFocus}
                      </span>
                    </div>
                    {lesson.skillsFocus.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {lesson.skillsFocus.map((s, k) => (
                          <span key={k} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                    {lesson.activities.length > 0 && (
                      <div className="space-y-1">
                        {lesson.activities.map((act, k) => (
                          <p key={k} className="text-xs text-gray-600 flex items-start gap-1">
                            <span className="shrink-0 px-1 bg-gray-100 rounded">{act.type}</span>
                            <span>{act.title} — {act.description}</span>
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {mod.assessment && (
                <div className="bg-blue-50 border border-blue-100 rounded p-3 text-sm">
                  <p className="font-medium text-blue-900">Assessment: {mod.assessment.title}</p>
                  {mod.assessment.description && (
                    <p className="text-blue-700 text-xs mt-0.5">{mod.assessment.description}</p>
                  )}
                  <p className="text-blue-600 text-xs mt-1">Pass mark: {mod.assessment.passingScore}%</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3" />
      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-gray-100 rounded-lg" />)}
        </div>
        <div className="h-64 bg-gray-100 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TrainerCourseDetail({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [course, setCourse] = useState<GeneratedCourse | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiClient.getCourse(courseId);
      setCourse(data);
    } catch {
      router.push('/trainer');
    } finally {
      setLoading(false);
    }
  }, [courseId, router]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <Skeleton />;
  if (!course) return null;

  return (
    <div className="space-y-5">
      {/* Back + status */}
      <div className="flex items-center justify-between">
        <Link href="/trainer">
          <Button variant="outline" size="sm" className="flex items-center gap-1.5">
            <ArrowLeft className="h-4 w-4" /> Back to Courses
          </Button>
        </Link>
        {COURSE_STATUS_BADGE[course.status]}
      </div>

      {/* Course header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
        {course.description && (
          <p className="text-gray-600 text-sm mt-1">{course.description}</p>
        )}
        <div className="flex flex-wrap gap-4 text-sm text-gray-600 mt-3">
          <span className="flex items-center gap-1">
            <Award className="h-4 w-4 text-blue-500" /> CEFR {course.cefrLevel}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-blue-500" /> {course.totalHours}h total
          </span>
          <span className="flex items-center gap-1">
            <BookOpen className="h-4 w-4 text-blue-500" /> {course.modules.length} modules
          </span>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
        {/* Left: module accordion */}
        <div>
          <h2 className="text-base font-semibold text-gray-900 mb-3">Course Modules</h2>
          {course.modules.length > 0
            ? <ModuleAccordion modules={course.modules} />
            : (
              <Card>
                <CardContent className="text-center py-8 text-gray-500 text-sm">
                  No modules available.
                </CardContent>
              </Card>
            )
          }
        </div>

        {/* Right: cohort info */}
        {course.request && (
          <div className="lg:sticky lg:top-6">
            <CohortInfoCard request={course.request} />
          </div>
        )}
      </div>
    </div>
  );
}
