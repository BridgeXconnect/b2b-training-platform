'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ClientRequest, GeneratedCourse, SOPAnalysis, apiClient } from '../../lib/api-client';
import {
  Eye, FileText, Users, Clock, Building, Upload, Brain, Sparkles,
  ChevronDown, ChevronUp, CheckCircle, BookOpen, Target, Award,
} from 'lucide-react';

const STATUS_BADGE: Record<ClientRequest['status'], React.ReactNode> = {
  PENDING: <Badge variant="outline">Pending</Badge>,
  IN_PROGRESS: <Badge variant="default">In Progress</Badge>,
  COMPLETED: <Badge variant="secondary">Completed</Badge>,
  REQUIRES_REVIEW: <Badge variant="destructive">Requires Review</Badge>,
};

const GENERATION_STEPS = [
  'Reading client requirements…',
  'Analysing SOP content…',
  'Designing course modules…',
  'Aligning to CEFR standards…',
  'Writing lesson plans…',
  'Finalising assessments…',
];

export default function RequestsList() {
  const [requests, setRequests] = useState<ClientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ClientRequest | null>(null);

  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [sopAnalysis, setSOPAnalysis] = useState<SOPAnalysis | null>(null);
  const [generatedCourse, setGeneratedCourse] = useState<GeneratedCourse | null>(null);
  const [expandedModule, setExpandedModule] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const stepInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { loadRequests(); }, []);

  useEffect(() => {
    if (selected) {
      setSOPAnalysis(null);
      setGeneratedCourse(null);
      setExpandedModule(null);
    }
  }, [selected?.id]);

  useEffect(() => {
    return () => { if (stepInterval.current) clearInterval(stepInterval.current); };
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setRequests(await apiClient.getClientRequests());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selected || !e.target.files?.length) return;
    setUploading(true);
    try {
      const uploads = Array.from(e.target.files).map((f) =>
        apiClient.uploadSOPDocument(f, selected.id)
      );
      await Promise.all(uploads);
      const refreshed = await apiClient.getClientRequest(selected.id);
      setSelected(refreshed);
      setRequests((prev) => prev.map((r) => (r.id === refreshed.id ? refreshed : r)));
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!selected) return;
    setAnalyzing(true);
    try {
      const analysis = await apiClient.analyzeSOPs(selected.id);
      setSOPAnalysis(analysis);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleGenerate = async () => {
    if (!selected) return;
    setGenerating(true);
    setGenerationStep(0);
    if (stepInterval.current) clearInterval(stepInterval.current);
    stepInterval.current = setInterval(() => {
      setGenerationStep((s) => (s < GENERATION_STEPS.length - 1 ? s + 1 : s));
    }, 2500);
    try {
      const course = await apiClient.generateCourse(selected.id);
      setGeneratedCourse(course);
      const refreshed = await apiClient.getClientRequest(selected.id);
      setSelected(refreshed);
      setRequests((prev) => prev.map((r) => (r.id === refreshed.id ? refreshed : r)));
    } catch (err) {
      console.error(err);
    } finally {
      if (stepInterval.current) clearInterval(stepInterval.current);
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (selected) {
    const hasDocs = selected.sopDocuments.length > 0;
    const hasText = selected.sopDocuments.some((d) => d.extractedText);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={() => setSelected(null)}>← Back</Button>
          {STATUS_BADGE[selected.status]}
        </div>

        {/* Request summary */}
        <Card>
          <CardHeader>
            <CardTitle>{selected.companyName}</CardTitle>
            <p className="text-gray-600">{selected.companyIndustry} · {selected.companySize} employees</p>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Primary Contact</h4>
              <p>{selected.contactName} — {selected.contactPosition}</p>
              <p className="text-gray-500">{selected.contactEmail}</p>
              {selected.contactPhone && <p className="text-gray-500">{selected.contactPhone}</p>}
            </div>
            <div>
              <h4 className="font-semibold mb-2">Training Cohort</h4>
              <p>{selected.participantCount} participants · {selected.currentLevel} → {selected.targetLevel}</p>
              <p className="text-gray-500">{selected.departments.join(', ')}</p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Goals</h4>
              <ul className="list-disc list-inside text-gray-600 space-y-1">
                {selected.goals.map((g, i) => <li key={i}>{g}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Course Preferences</h4>
              <p>{selected.totalHours}h · {selected.lessonsPerModule} lessons/module · {selected.deliveryMethod.toLowerCase().replace('_', '-')}</p>
              <p className="text-gray-500">{selected.frequency.toLowerCase().replace('_', '-')} · {selected.lessonDuration} min lessons</p>
            </div>
          </CardContent>
        </Card>

        {/* SOP Documents */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">SOP Documents</CardTitle>
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {uploading ? 'Uploading…' : 'Upload SOP'}
                </Button>
                {hasText && (
                  <Button size="sm" onClick={handleAnalyze} disabled={analyzing}>
                    <Brain className="h-4 w-4 mr-1" />
                    {analyzing ? 'Analysing…' : 'Analyse with AI'}
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {hasDocs ? (
              <div className="space-y-2">
                {selected.sopDocuments.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium">{doc.filename}</p>
                        <p className="text-xs text-gray-500">
                          {(doc.fileSize / 1024).toFixed(0)} KB
                          {doc.extractedText ? ' · text extracted' : ' · processing…'}
                        </p>
                      </div>
                    </div>
                    {doc.analysis && <Badge variant="secondary">Analysed</Badge>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No SOP documents yet. Upload PDFs, DOCX, or TXT files to enable AI analysis.
              </p>
            )}

            {/* SOP Analysis results */}
            {sopAnalysis && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-900">AI Analysis Complete</span>
                  <Badge className="ml-auto bg-green-600">Recommended: CEFR {sopAnalysis.recommendedCEFRLevel}</Badge>
                </div>
                <p className="text-sm text-green-800">{sopAnalysis.rationale}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium text-green-700 mb-1">Communication Needs</p>
                    <ul className="text-green-800 space-y-0.5">
                      {sopAnalysis.communicationNeeds.map((n, i) => <li key={i}>· {n}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-green-700 mb-1">Industry Terminology</p>
                    <div className="flex flex-wrap gap-1">
                      {sopAnalysis.industryTerminology.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">{t}</span>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-green-700 mb-1">Skills Gaps</p>
                    <ul className="text-green-800 space-y-0.5">
                      {sopAnalysis.skillsGaps.map((g, i) => <li key={i}>· {g}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-green-700 mb-1">Training Focus</p>
                    <ul className="text-green-800 space-y-0.5">
                      {sopAnalysis.trainingFocus.map((f, i) => <li key={i}>· {f}</li>)}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Course Generation */}
        {!generatedCourse && (
          <Card>
            <CardContent className="p-6">
              {generating ? (
                <div className="text-center space-y-4 py-4">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
                  <div>
                    <p className="font-semibold text-gray-900">Claude is building your course</p>
                    <p className="text-sm text-blue-600 mt-1 transition-all">{GENERATION_STEPS[generationStep]}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">Generate AI Course</p>
                    <p className="text-sm text-gray-500">
                      Claude will build a full CEFR {selected.currentLevel}→{selected.targetLevel} curriculum
                      {sopAnalysis ? ' using your SOP analysis' : ''}.
                    </p>
                  </div>
                  <Button onClick={handleGenerate} className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    Generate Course
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Generated Course */}
        {generatedCourse && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <CardTitle>{generatedCourse.title}</CardTitle>
              </div>
              <p className="text-gray-600 text-sm mt-1">{generatedCourse.description}</p>
              <div className="flex gap-4 text-sm mt-2">
                <span className="flex items-center gap-1"><Award className="h-4 w-4 text-blue-500" /> CEFR {generatedCourse.cefrLevel}</span>
                <span className="flex items-center gap-1"><Clock className="h-4 w-4 text-blue-500" /> {generatedCourse.totalHours}h</span>
                <span className="flex items-center gap-1"><BookOpen className="h-4 w-4 text-blue-500" /> {generatedCourse.modules.length} modules</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {generatedCourse.modules.map((mod, i) => (
                <div key={i} className="border rounded-lg overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                    onClick={() => setExpandedModule(expandedModule === i ? null : i)}
                  >
                    <div>
                      <p className="font-medium">{mod.title}</p>
                      <p className="text-sm text-gray-500">{mod.lessons.length} lessons · {mod.assessment.type}</p>
                    </div>
                    {expandedModule === i ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {expandedModule === i && (
                    <div className="border-t p-4 bg-gray-50 space-y-4">
                      <p className="text-sm text-gray-600">{mod.description}</p>

                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Learning Objectives</p>
                        <ul className="space-y-1">
                          {mod.learningObjectives.map((o, j) => (
                            <li key={j} className="text-sm flex items-start gap-2">
                              <Target className="h-3 w-3 text-blue-500 mt-0.5 shrink-0" />{o}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="space-y-3">
                        <p className="text-xs font-semibold text-gray-500 uppercase">Lessons</p>
                        {mod.lessons.map((lesson, j) => (
                          <div key={j} className="bg-white border rounded p-3">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-sm font-medium">{lesson.title}</p>
                              <span className="text-xs text-gray-400">{lesson.duration} min</span>
                            </div>
                            <div className="flex gap-1 mb-2">
                              {lesson.skillsFocus.map((s, k) => (
                                <span key={k} className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{s}</span>
                              ))}
                            </div>
                            <div className="space-y-1">
                              {lesson.activities.map((act, k) => (
                                <div key={k} className="text-xs text-gray-600 flex items-start gap-1">
                                  <span className="shrink-0 px-1 bg-gray-100 rounded">{act.type}</span>
                                  <span>{act.title} — {act.description}</span>
                                </div>
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
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Client Requests</h2>
        <Button variant="outline" onClick={loadRequests}>Refresh</Button>
      </div>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700">No client requests yet</p>
            <p className="text-gray-500 text-sm mt-1">Create your first request using the New Client Request tab.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {requests.map((req) => (
            <Card key={req.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(req)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="font-semibold">{req.companyName}</p>
                      <p className="text-sm text-gray-500">{req.companyIndustry}</p>
                    </div>
                  </div>
                  {STATUS_BADGE[req.status]}
                </div>
                <div className="flex gap-6 text-sm text-gray-600">
                  <span className="flex items-center gap-1"><Users className="h-4 w-4" />{req.participantCount} participants</span>
                  <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{req.totalHours}h</span>
                  <span>{req.currentLevel} → {req.targetLevel}</span>
                  <span>{req.sopDocuments.length} SOP{req.sopDocuments.length !== 1 ? 's' : ''}</span>
                  {req.courses.length > 0 && (
                    <span className="flex items-center gap-1 text-green-600">
                      <Sparkles className="h-4 w-4" />{req.courses.length} course{req.courses.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex justify-between items-center">
                  <span className="text-sm text-gray-400">Contact: {req.contactName}</span>
                  <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setSelected(req); }}>
                    <Eye className="h-4 w-4 mr-1" /> View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
