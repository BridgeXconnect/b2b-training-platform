'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar,
  Search,
  Filter,
  Download,
  Share2,
  Eye,
  RotateCcw,
  Trophy,
  Target,
  Clock,
  BarChart3,
  FileText,
  Archive,
  Star,
  TrendingUp,
  TrendingDown,
  Bookmark,
  ExternalLink
} from 'lucide-react';
import {
  Assessment,
  AssessmentSession,
  AssessmentResults,
  CEFRLevel,
  AssessmentSessionManager
} from '@/lib/utils/assessment';
import { cn } from '@/lib/utils';

interface AssessmentHistoryProps {
  userId?: string;
  onViewAssessment?: (assessment: Assessment) => void;
  onRetakeAssessment?: (assessment: Assessment) => void;
  onViewResults?: (results: AssessmentResults) => void;
}

interface AssessmentHistoryEntry {
  assessment: Assessment;
  session: AssessmentSession;
  results?: AssessmentResults;
}

export default function AssessmentHistory({
  userId = 'current_user',
  onViewAssessment,
  onRetakeAssessment,
  onViewResults
}: AssessmentHistoryProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<CEFRLevel | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'in-progress' | 'abandoned'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score' | 'title'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Mock data - in real app, this would come from API/context
  const [assessmentHistory, setAssessmentHistory] = useState<AssessmentHistoryEntry[]>([
    {
      assessment: {
        id: 'assessment-1',
        title: 'Business Communication Assessment',
        description: 'Test your professional communication skills',
        cefrLevel: 'B2',
        duration: 45,
        totalPoints: 100,
        questions: [],
        createdAt: '2025-01-15T10:00:00Z',
        businessContext: 'B2B Sales',
        learningObjectives: ['Professional Communication', 'Email Writing'],
        passingScore: 70,
        adaptiveDifficulty: true
      },
      session: {
        id: 'session-1',
        assessmentId: 'assessment-1',
        userId: 'current_user',
        startTime: '2025-01-18T14:30:00Z',
        startedAt: '2025-01-18T14:30:00Z',
        completedAt: '2025-01-18T15:15:00Z',
        currentQuestionIndex: 15,
        answers: {},
        timeSpent: 2700,
        isCompleted: true,
        isPaused: false,
        status: 'completed',
        score: 87,
        adaptiveDifficultyHistory: [3, 3, 4, 4],
        adaptiveState: undefined,
        sessionMetrics: {
          questionsAttempted: 15,
          correctAnswers: 13,
          averageTimePerQuestion: 180,
          difficultyProgression: [3, 3, 4, 4]
        }
      },
      results: {
        id: 'results-1',
        attempt: {
          id: 'attempt-1',
          assessmentId: 'assessment-1',
          userId: 'current_user',
          startedAt: '2025-01-18T14:30:00Z',
          completedAt: '2025-01-18T15:15:00Z',
          answers: {},
          timeSpent: 2700,
          percentage: 87,
          passed: true,
          score: 87,
          feedback: [
            {
              questionId: 'q1',
              isCorrect: true,
              userAnswer: 'correct answer',
              correctAnswer: 'correct answer',
              explanation: 'Well done on this business communication question',
              skillAreaFeedback: 'Excellent understanding of professional language',
              improvementSuggestions: ['Continue practicing formal communication']
            }
          ]
        },
        skillBreakdown: {
          'business-communication': { correct: 43, total: 50, percentage: 86, score: 43 },
          'email-writing': { correct: 44, total: 50, percentage: 88, score: 44 }
        },
        cefrLevelAnalysis: {
          currentLevel: 'B2',
          demonstratedLevel: 'B2',
          readinessForNext: 75,
          skillLevels: {
            'business-communication': 'B2',
            'email-writing': 'B2'
          }
        },
        feedback: {
          overall: 'Excellent performance in business communication!',
          strengths: ['Clear communication', 'Professional tone'],
          improvements: ['Technical vocabulary'],
          nextSteps: ['Practice advanced presentations']
        },
        detailedFeedback: [
          {
            questionId: 'q1',
            isCorrect: true,
            userAnswer: 'correct answer',
            correctAnswer: 'correct answer',
            explanation: 'Well done on this business communication question',
            skillAreaFeedback: 'Excellent understanding of professional language',
            improvementSuggestions: ['Continue practicing formal communication']
          }
        ],
        studyRecommendations: [
          'Focus on advanced business vocabulary',
          'Practice more complex email structures',
          'Develop presentation skills further'
        ],
        recommendations: {
          nextAssessment: 'Advanced Business Presentations',
          studyAreas: ['Technical vocabulary', 'Presentation skills'],
          resources: []
        }
      }
    },
    {
      assessment: {
        id: 'assessment-2',
        title: 'Advanced Presentation Skills',
        description: 'Evaluate your ability to deliver professional presentations',
        cefrLevel: 'C1',
        duration: 60,
        totalPoints: 120,
        questions: [],
        createdAt: '2025-01-10T09:00:00Z',
        businessContext: 'Leadership',
        learningObjectives: ['Presentation Skills', 'Leadership Communication'],
        passingScore: 75,
        adaptiveDifficulty: false
      },
      session: {
        id: 'session-2',
        assessmentId: 'assessment-2',
        userId: 'current_user',
        startTime: '2025-01-20T16:00:00Z',
        startedAt: '2025-01-20T16:00:00Z',
        completedAt: '2025-01-20T16:45:00Z',
        currentQuestionIndex: 12,
        answers: {},
        timeSpent: 2700,
        isCompleted: true,
        isPaused: false,
        status: 'completed',
        score: 92,
        adaptiveDifficultyHistory: [4, 4, 5, 5],
        adaptiveState: undefined,
        sessionMetrics: {
          questionsAttempted: 12,
          correctAnswers: 11,
          averageTimePerQuestion: 225,
          difficultyProgression: [4, 4, 5, 5]
        }
      },
      results: {
        id: 'results-2',
        attempt: {
          id: 'attempt-2',
          assessmentId: 'assessment-2',
          userId: 'current_user',
          startedAt: '2025-01-20T16:00:00Z',
          completedAt: '2025-01-20T16:45:00Z',
          answers: {},
          timeSpent: 2700,
          percentage: 92,
          passed: true,
          score: 92,
          feedback: [
            {
              questionId: 'q2',
              isCorrect: true,
              userAnswer: 'excellent response',
              correctAnswer: 'excellent response',
              explanation: 'Outstanding presentation delivery and structure',
              skillAreaFeedback: 'Excellent presentation skills demonstrated',
              improvementSuggestions: ['Continue developing advanced presentation techniques']
            }
          ]
        },
        skillBreakdown: {
          'presentation-skills': { correct: 55, total: 60, percentage: 92, score: 55 },
          'leadership-communication': { correct: 55, total: 60, percentage: 92, score: 55 }
        },
        cefrLevelAnalysis: {
          currentLevel: 'C1',
          demonstratedLevel: 'C1',
          readinessForNext: 85,
          skillLevels: {
            'presentation-skills': 'C1',
            'leadership-communication': 'C1'
          }
        },
        feedback: {
          overall: 'Outstanding presentation skills!',
          strengths: ['Leadership presence', 'Clear structure'],
          improvements: ['Advanced vocabulary'],
          nextSteps: ['Master-level presentations']
        },
        detailedFeedback: [
          {
            questionId: 'q2',
            isCorrect: true,
            userAnswer: 'excellent response',
            correctAnswer: 'excellent response',
            explanation: 'Outstanding presentation delivery and structure',
            skillAreaFeedback: 'Excellent presentation skills demonstrated',
            improvementSuggestions: ['Continue developing advanced presentation techniques']
          }
        ],
        studyRecommendations: [
          'Practice executive-level presentations',
          'Develop strategic communication skills',
          'Focus on leadership presence'
        ],
        recommendations: {
          nextAssessment: 'Executive Communication',
          studyAreas: ['Executive presence', 'Strategic communication'],
          resources: []
        }
      }
    },
    {
      assessment: {
        id: 'assessment-3',
        title: 'Email Communication Basics',
        description: 'Basic email writing and communication skills',
        cefrLevel: 'B1',
        duration: 30,
        totalPoints: 80,
        questions: [],
        createdAt: '2025-01-12T11:00:00Z',
        businessContext: 'Customer Service',
        learningObjectives: ['Email Writing', 'Customer Communication'],
        passingScore: 65,
        adaptiveDifficulty: true
      },
      session: {
        id: 'session-3',
        assessmentId: 'assessment-3',
        userId: 'current_user',
        startTime: '2025-01-16T13:00:00Z',
        startedAt: '2025-01-16T13:00:00Z',
        currentQuestionIndex: 8,
        answers: {},
        timeSpent: 1200,
        isCompleted: false,
        isPaused: true,
        status: 'in-progress',
        adaptiveDifficultyHistory: [2, 3, 3],
        adaptiveState: { 
          currentDifficulty: 3, 
          difficultyHistory: [],
          performanceMetrics: {
            overallAccuracy: 0.67,
            currentStreak: 2,
            longestStreak: 4,
            averageTimePerQuestion: 120,
            difficultyStability: 0.8
          },
          learningProfile: {
            preferredDifficulty: 3,
            learningSpeed: 'medium',
            strengthAreas: ['vocabulary', 'reading'],
            challengeAreas: ['grammar', 'listening'],
            adaptationStyle: 'moderate'
          }
        },
        sessionMetrics: {
          questionsAttempted: 8,
          correctAnswers: 6,
          averageTimePerQuestion: 150,
          difficultyProgression: [2, 3, 3]
        }
      }
    }
  ]);

  const [bookmarkedAssessments, setBookmarkedAssessments] = useState<Set<string>>(new Set(['assessment-1']));

  const cefrLevels: (CEFRLevel | 'all')[] = ['all', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const filteredAndSortedHistory = assessmentHistory
    .filter((entry: AssessmentHistoryEntry) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!entry.assessment.title.toLowerCase().includes(query) &&
            !entry.assessment.description.toLowerCase().includes(query) &&
            !entry.assessment.businessContext.toLowerCase().includes(query)) {
          return false;
        }
      }

      // CEFR level filter
      if (filterLevel !== 'all' && entry.assessment.cefrLevel !== filterLevel) {
        return false;
      }

      // Status filter
      if (filterStatus !== 'all') {
        if (filterStatus === 'completed' && entry.session.status !== 'completed') return false;
        if (filterStatus === 'in-progress' && entry.session.status !== 'in-progress') return false;
        if (filterStatus === 'abandoned' && entry.session.status !== 'abandoned') return false;
      }

      // Tab filter
      if (activeTab === 'completed' && entry.session.status !== 'completed') return false;
      if (activeTab === 'in-progress' && entry.session.status !== 'in-progress') return false;
      if (activeTab === 'bookmarked' && !bookmarkedAssessments.has(entry.assessment.id)) return false;

      return true;
    })
    .sort((a: AssessmentHistoryEntry, b: AssessmentHistoryEntry) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(b.session.startedAt).getTime() - new Date(a.session.startedAt).getTime();
          break;
        case 'score':
          const scoreA = a.session.score || 0;
          const scoreB = b.session.score || 0;
          comparison = scoreB - scoreA;
          break;
        case 'title':
          comparison = a.assessment.title.localeCompare(b.assessment.title);
          break;
      }

      return sortOrder === 'desc' ? comparison : -comparison;
    });

  const toggleBookmark = (assessmentId: string) => {
    setBookmarkedAssessments((prev: Set<string>) => {
      const newSet = new Set(prev);
      if (newSet.has(assessmentId)) {
        newSet.delete(assessmentId);
      } else {
        newSet.add(assessmentId);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'in-progress': return 'text-blue-600';
      case 'abandoned': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <Trophy className="h-4 w-4 text-green-600" />;
      case 'in-progress': return <Clock className="h-4 w-4 text-blue-600" />;
      case 'abandoned': return <Archive className="h-4 w-4 text-red-600" />;
      default: return <Target className="h-4 w-4 text-gray-600" />;
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const exportHistory = () => {
    const exportData = {
      exportDate: new Date().toISOString(),
      userId,
      assessments: filteredAndSortedHistory.map((entry: AssessmentHistoryEntry) => ({
        assessment: entry.assessment,
        session: entry.session,
        results: entry.results
      })),
      summary: {
        totalAssessments: assessmentHistory.length,
        completedAssessments: assessmentHistory.filter((e: AssessmentHistoryEntry) => e.session.status === 'completed').length,
        averageScore: assessmentHistory
          .filter((e: AssessmentHistoryEntry) => e.session.score)
          .reduce((sum: number, e: AssessmentHistoryEntry) => sum + (e.session.score || 0), 0) / 
          assessmentHistory.filter((e: AssessmentHistoryEntry) => e.session.score).length || 0,
        totalTimeSpent: assessmentHistory.reduce((sum: number, e: AssessmentHistoryEntry) => sum + e.session.timeSpent, 0)
      }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assessment-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const shareProgress = async () => {
    const completedCount = assessmentHistory.filter((e: AssessmentHistoryEntry) => e.session.status === 'completed').length;
    const averageScore = Math.round(
      assessmentHistory
        .filter((e: AssessmentHistoryEntry) => e.session.score)
        .reduce((sum: number, e: AssessmentHistoryEntry) => sum + (e.session.score || 0), 0) / 
        assessmentHistory.filter((e: AssessmentHistoryEntry) => e.session.score).length || 0
    );

    const shareText = `I've completed ${completedCount} assessments with an average score of ${averageScore}%! 🎯`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Assessment Progress',
          text: shareText,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(shareText);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assessment History</h2>
          <p className="text-muted-foreground">
            Track your assessment progress and review past results
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={shareProgress}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={exportHistory}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-lg font-bold">{assessmentHistory.length}</div>
                <div className="text-xs text-muted-foreground">Total Assessments</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-lg font-bold">
                  {assessmentHistory.filter((e: AssessmentHistoryEntry) => e.session.status === 'completed').length}
                </div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-lg font-bold">
                  {Math.round(
                    assessmentHistory
                      .filter((e: AssessmentHistoryEntry) => e.session.score)
                      .reduce((sum: number, e: AssessmentHistoryEntry) => sum + (e.session.score || 0), 0) / 
                      assessmentHistory.filter((e: AssessmentHistoryEntry) => e.session.score).length || 0
                  )}%
                </div>
                <div className="text-xs text-muted-foreground">Average Score</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-lg font-bold">
                  {formatDuration(assessmentHistory.reduce((sum: number, e: AssessmentHistoryEntry) => sum + e.session.timeSpent, 0))}
                </div>
                <div className="text-xs text-muted-foreground">Total Time</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search assessments..."
                  value={searchQuery}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <div className="space-y-2">
                <Label>CEFR Level</Label>
                <Select value={filterLevel} onValueChange={(value: CEFRLevel | 'all') => setFilterLevel(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {cefrLevels.map(level => (
                      <SelectItem key={level} value={level}>
                        {level === 'all' ? 'All Levels' : level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={(value: 'all' | 'completed' | 'in-progress' | 'abandoned') => setFilterStatus(value)}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="abandoned">Abandoned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={sortBy} onValueChange={(value: 'date' | 'score' | 'title') => setSortBy(value)}>
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="score">Score</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* History Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({assessmentHistory.length})</TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({assessmentHistory.filter((e: AssessmentHistoryEntry) => e.session.status === 'completed').length})
          </TabsTrigger>
          <TabsTrigger value="in-progress">
            In Progress ({assessmentHistory.filter((e: AssessmentHistoryEntry) => e.session.status === 'in-progress').length})
          </TabsTrigger>
          <TabsTrigger value="bookmarked">
            Bookmarked ({bookmarkedAssessments.size})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredAndSortedHistory.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No assessments found</h3>
                  <p className="text-muted-foreground">
                    {searchQuery || filterLevel !== 'all' || filterStatus !== 'all'
                      ? 'Try adjusting your filters or search query'
                      : 'Start taking assessments to see your history here'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedHistory.map((entry: AssessmentHistoryEntry) => (
                <Card key={entry.session.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-lg">{entry.assessment.title}</CardTitle>
                          <Badge variant="outline">{entry.assessment.cefrLevel}</Badge>
                          <Badge variant="secondary">{entry.assessment.businessContext}</Badge>
                          {getStatusIcon(entry.session.status)}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleBookmark(entry.assessment.id)}
                            className="p-1"
                          >
                            <Bookmark
                              className={cn(
                                "h-4 w-4",
                                bookmarkedAssessments.has(entry.assessment.id)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground"
                              )}
                            />
                          </Button>
                        </div>
                        <CardDescription>{entry.assessment.description}</CardDescription>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {entry.session.status === 'completed' && entry.results && (
                          <div className="text-right">
                            <div className="text-lg font-bold text-green-600">
                              {entry.session.score}%
                            </div>
                            <div className="text-xs text-muted-foreground">Score</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Started</div>
                        <div className="font-medium">
                          {new Date(entry.session.startedAt).toLocaleDateString()}
                        </div>
                      </div>
                      
                      {entry.session.completedAt && (
                        <div>
                          <div className="text-sm text-muted-foreground">Completed</div>
                          <div className="font-medium">
                            {new Date(entry.session.completedAt).toLocaleDateString()}
                          </div>
                        </div>
                      )}
                      
                      <div>
                        <div className="text-sm text-muted-foreground">Time Spent</div>
                        <div className="font-medium">{formatDuration(entry.session.timeSpent)}</div>
                      </div>
                      
                      <div>
                        <div className="text-sm text-muted-foreground">Status</div>
                        <div className={cn("font-medium capitalize", getStatusColor(entry.session.status))}>
                          {entry.session.status.replace('-', ' ')}
                        </div>
                      </div>
                    </div>

                    {entry.session.status === 'completed' && entry.results && (
                      <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Trophy className="h-4 w-4 text-green-600" />
                          <span className="font-medium text-green-900">Assessment Completed</span>
                        </div>
                        <div className="text-sm text-green-800">
                          <div className="flex items-center gap-4">
                            <span>Score: {entry.session.score}%</span>
                            <span>CEFR: {entry.results.cefrLevelAnalysis.demonstratedLevel}</span>
                            <span>
                              {entry.results.attempt.passed ? (
                                <Badge variant="default" className="bg-green-600">Passed</Badge>
                              ) : (
                                <Badge variant="destructive">Failed</Badge>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {entry.session.status === 'in-progress' && (
                      <Alert className="mb-4">
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                          Assessment in progress - Question {entry.session.currentQuestionIndex + 1} of {entry.assessment.questions.length || 'N/A'}
                          {entry.session.isPaused && ' (Paused)'}
                        </AlertDescription>
                      </Alert>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {entry.assessment.duration} min
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {entry.assessment.learningObjectives.join(', ')}
                        </Badge>
                        {entry.assessment.adaptiveDifficulty && (
                          <Badge variant="outline" className="text-xs">Adaptive</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => onViewAssessment?.(entry.assessment)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        
                        {entry.session.status === 'completed' && entry.results && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onViewResults?.(entry.results!)}
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            Results
                          </Button>
                        )}
                        
                        {entry.session.status === 'in-progress' ? (
                          <Button 
                            variant="default" 
                            size="sm"
                            onClick={() => onViewAssessment?.(entry.assessment)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Continue
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => onRetakeAssessment?.(entry.assessment)}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Retake
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}