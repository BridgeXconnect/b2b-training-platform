'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Calendar,
  BookOpen,
  MessageSquare,
  Award,
  Download,
  Share2,
  Clock,
  BarChart3,
  CheckCircle2,
  Brain,
  PieChart,
  FileText
} from 'lucide-react';
import {
  ProgressMetrics,
  LearningGoal,
  Achievement,
  AssessmentMetrics,
  ProgressExporter,
  AssessmentProgressTracker
} from '@/lib/utils/progress';
import { 
  adaptiveDifficultyEngine,
  type CEFRProgression,
  type DifficultyLevel,
  type DifficultyAdjustment
} from '@/lib/services/adaptive-difficulty';

interface ProgressDashboardProps {
  userId?: string;
  initialData?: {
    metrics?: ProgressMetrics;
    goals?: LearningGoal[];
    achievements?: Achievement[];
  };
}

export default function ProgressDashboard({ 
  userId = 'current_user', 
  initialData 
}: ProgressDashboardProps = {}) {
  const [activeTab, setActiveTab] = useState('overview');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('week');
  
  // Adaptive Difficulty State
  const [cefrProgression, setCefrProgression] = useState<CEFRProgression | null>(null);
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel | null>(null);
  const [recentAdjustments, setRecentAdjustments] = useState<DifficultyAdjustment[]>([]);
  const [difficultyLoading, setDifficultyLoading] = useState(false);

  // Mock data - in real app, this would come from context/API
  const [learningGoals] = useState<LearningGoal[]>([
    {
      id: '1',
      name: 'Business Presentations',
      target: 20,
      current: 14,
      unit: 'presentations',
      category: 'speaking',
      createdDate: '2025-01-15'
    },
    {
      id: '2',
      name: 'Email Writing',
      target: 50,
      current: 32,
      unit: 'emails',
      category: 'writing',
      createdDate: '2025-01-15'
    },
    {
      id: '3',
      name: 'Client Meetings',
      target: 15,
      current: 8,
      unit: 'meetings',
      category: 'speaking',
      createdDate: '2025-01-16'
    },
    {
      id: '4',
      name: 'Industry Articles',
      target: 30,
      current: 22,
      unit: 'articles',
      category: 'reading',
      createdDate: '2025-01-16'
    }
  ]);

  const [achievements] = useState<Achievement[]>([
    {
      id: '1',
      title: 'First Presentation',
      description: 'Completed your first business presentation',
      icon: '🎯',
      earned: true,
      earnedDate: '2025-01-15',
      category: 'milestone'
    },
    {
      id: '2',
      title: 'Week Warrior',
      description: 'Maintained a 7-day learning streak',
      icon: '🔥',
      earned: true,
      earnedDate: '2025-01-18',
      category: 'streak'
    },
    {
      id: '3',
      title: 'Email Expert',
      description: 'Write 25 professional emails',
      icon: '📧',
      earned: false,
      category: 'skill'
    },
    {
      id: '4',
      title: 'Meeting Master',
      description: 'Lead 10 client meetings successfully',
      icon: '👥',
      earned: false,
      category: 'skill'
    }
  ]);

  const [progressMetrics] = useState<ProgressMetrics>(initialData?.metrics || {
    totalStudyTime: 24.5, // hours
    completedLessons: 18,
    currentStreak: 5,
    longestStreak: 12,
    cefrProgress: {
      current: 'B2',
      nextLevel: 'C1',
      progressToNext: 65
    },
    weeklyGoal: {
      target: 5, // hours
      completed: 3.2
    },
    monthlyStats: {
      lessonsCompleted: 8,
      hoursStudied: 12.5,
      goalsMet: 3
    },
    assessments: {
      totalAssessments: 7,
      averageScore: 82,
      bestScore: 94,
      recentScore: 87,
      assessmentStreak: 3,
      skillPerformance: {
        'business-communication': {
          averageScore: 85,
          assessmentCount: 5,
          lastScore: 89,
          improvement: 15
        },
        'presentation-skills': {
          averageScore: 78,
          assessmentCount: 4,
          lastScore: 85,
          improvement: 22
        },
        'email-writing': {
          averageScore: 88,
          assessmentCount: 6,
          lastScore: 91,
          improvement: 8
        },
        'meeting-participation': {
          averageScore: 79,
          assessmentCount: 3,
          lastScore: 82,
          improvement: 12
        }
      },
      cefrProgression: {
        startLevel: 'B1',
        currentLevel: 'B2',
        demonstratedLevel: 'B2',
        readinessForNext: 75,
        levelHistory: [
          { level: 'B1', achievedDate: '2024-11-15', assessmentId: 'assessment-1' },
          { level: 'B2', achievedDate: '2025-01-08', assessmentId: 'assessment-5' }
        ]
      },
      monthlyAssessmentStats: {
        assessmentsTaken: 3,
        averageScore: 84,
        skillsImproved: 2,
        timeSpent: 45
      }
    }
  });

  // Load adaptive difficulty data on component mount
  useEffect(() => {
    const loadDifficultyData = async () => {
      if (!userId) return;
      
      setDifficultyLoading(true);
      try {
        // Load CEFR progression
        const progression = await adaptiveDifficultyEngine.assessCEFRProgression(userId);
        setCefrProgression(progression);

        // Mock recent adjustments data - in real app, this would come from API
        const mockAdjustments: DifficultyAdjustment[] = [
          {
            currentDifficulty: { overall: 60, cognitive: 58, linguistic: 62, contextual: 59, timeConstraint: 55, cefrAlignment: 'B2', description: 'B2 level difficulty' },
            recommendedDifficulty: { overall: 65, cognitive: 63, linguistic: 67, contextual: 64, timeConstraint: 60, cefrAlignment: 'B2', description: 'Adapted B2 level (+5)' },
            adjustmentReason: {
              primaryFactors: ['Performance improvement'],
              performanceIndicators: ['85% recent accuracy'],
              learningVelocity: 'optimal',
              frustrationLevel: 'low',
              boredLevel: 'low',
              confidenceLevel: 'high',
              explanation: 'User performance suggests readiness for increased challenge'
            },
            confidence: 0.85,
            gradualAdjustment: true,
            timeframe: 'next-section',
            specificAdjustments: []
          }
        ];
        setRecentAdjustments(mockAdjustments);
        setCurrentDifficulty(mockAdjustments[0].recommendedDifficulty);
      } catch (error) {
        console.error('Failed to load difficulty data:', error);
      } finally {
        setDifficultyLoading(false);
      }
    };

    loadDifficultyData();
  }, [userId]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'speaking': return <MessageSquare className="h-4 w-4" />;
      case 'writing': return <BookOpen className="h-4 w-4" />;
      case 'listening': return <Clock className="h-4 w-4" />;
      case 'reading': return <BookOpen className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'speaking': return 'bg-blue-500';
      case 'writing': return 'bg-green-500';
      case 'listening': return 'bg-purple-500';
      case 'reading': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const handleExportProgress = () => {
    // Export comprehensive progress report
    const reportJson = ProgressExporter.exportToJSON(
      progressMetrics,
      learningGoals,
      achievements,
      [] // Empty study sessions for demo
    );
    
    const blob = new Blob([reportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `progress-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportReport = () => {
    // Export markdown report
    const reportMarkdown = ProgressExporter.generateProgressReport(
      progressMetrics,
      learningGoals,
      achievements
    );
    
    const blob = new Blob([reportMarkdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `learning-report-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareProgress = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Learning Progress',
          text: `I've completed ${progressMetrics.completedLessons} lessons and have a ${progressMetrics.currentStreak}-day streak!`,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(
        `Check out my learning progress: ${progressMetrics.completedLessons} lessons completed with a ${progressMetrics.currentStreak}-day streak!`
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Learning Progress</h2>
          <p className="text-muted-foreground">
            Track your B2B English learning journey and achievements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleShareProgress}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <FileText className="h-4 w-4 mr-2" />
            Report
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportProgress}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Study Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressMetrics.totalStudyTime}h</div>
            <p className="text-xs text-muted-foreground">
              Total learning time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lessons</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressMetrics.completedLessons}</div>
            <p className="text-xs text-muted-foreground">
              Lessons completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assessments</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressMetrics.assessments.totalAssessments}</div>
            <p className="text-xs text-muted-foreground">
              {progressMetrics.assessments.averageScore}% average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Best Score</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressMetrics.assessments.bestScore}%</div>
            <p className="text-xs text-muted-foreground">
              Personal best
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressMetrics.currentStreak}</div>
            <p className="text-xs text-muted-foreground">
              Days in a row
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CEFR Level</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{progressMetrics.cefrProgress.current}</div>
            <p className="text-xs text-muted-foreground">
              {progressMetrics.cefrProgress.progressToNext}% to {progressMetrics.cefrProgress.nextLevel}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="assessments">Assessment Analytics</TabsTrigger>
          <TabsTrigger value="difficulty">Difficulty Progression</TabsTrigger>
          <TabsTrigger value="goals">Learning Goals</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Weekly Goal Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Weekly Goal
              </CardTitle>
              <CardDescription>
                Your weekly study time goal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{progressMetrics.weeklyGoal.completed}h completed</span>
                  <span>{progressMetrics.weeklyGoal.target}h goal</span>
                </div>
                <Progress 
                  value={(progressMetrics.weeklyGoal.completed / progressMetrics.weeklyGoal.target) * 100} 
                  className="h-3"
                />
                <p className="text-xs text-muted-foreground">
                  {progressMetrics.weeklyGoal.target - progressMetrics.weeklyGoal.completed}h remaining this week
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CEFR Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                CEFR Level Progress
              </CardTitle>
              <CardDescription>
                Progress toward next proficiency level
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary">{progressMetrics.cefrProgress.current}</Badge>
                  <Badge variant="outline">{progressMetrics.cefrProgress.nextLevel}</Badge>
                </div>
                <Progress 
                  value={progressMetrics.cefrProgress.progressToNext} 
                  className="h-3"
                />
                <p className="text-xs text-muted-foreground">
                  {progressMetrics.cefrProgress.progressToNext}% progress to {progressMetrics.cefrProgress.nextLevel} level
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assessments" className="space-y-4">
          {/* Assessment Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Assessment Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Average Score</span>
                    <span className="font-medium">{progressMetrics.assessments.averageScore}%</span>
                  </div>
                  <Progress value={progressMetrics.assessments.averageScore} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Recent Score</span>
                    <span className="font-medium">{progressMetrics.assessments.recentScore}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {progressMetrics.assessments.recentScore >= progressMetrics.assessments.averageScore ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
                    )}
                    <span className="text-xs text-muted-foreground">
                      {progressMetrics.assessments.recentScore >= progressMetrics.assessments.averageScore ? 'Above' : 'Below'} average
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Improvement Streak</span>
                    <span className="font-medium">{progressMetrics.assessments.assessmentStreak}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Consecutive assessments with improvement
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-purple-600" />
                  CEFR Progression
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Started</div>
                    <Badge variant="outline">{progressMetrics.assessments.cefrProgression.startLevel}</Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Current</div>
                    <Badge variant="default">{progressMetrics.assessments.cefrProgression.currentLevel}</Badge>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Demonstrated</div>
                    <Badge variant="secondary">{progressMetrics.assessments.cefrProgression.demonstratedLevel}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Readiness for Next Level</span>
                    <span className="font-medium">{progressMetrics.assessments.cefrProgression.readinessForNext}%</span>
                  </div>
                  <Progress value={progressMetrics.assessments.cefrProgression.readinessForNext} className="h-2" />
                </div>

                <div className="text-xs text-muted-foreground">
                  Level progression history: {progressMetrics.assessments.cefrProgression.levelHistory.length} milestones
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-green-600" />
                  Monthly Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold text-blue-600">
                      {progressMetrics.assessments.monthlyAssessmentStats.assessmentsTaken}
                    </div>
                    <div className="text-xs text-muted-foreground">Assessments</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold text-green-600">
                      {progressMetrics.assessments.monthlyAssessmentStats.averageScore}%
                    </div>
                    <div className="text-xs text-muted-foreground">Avg Score</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold text-purple-600">
                      {progressMetrics.assessments.monthlyAssessmentStats.skillsImproved}
                    </div>
                    <div className="text-xs text-muted-foreground">Skills ↑</div>
                  </div>
                  <div className="text-center p-3 border rounded-lg">
                    <div className="text-lg font-bold text-orange-600">
                      {progressMetrics.assessments.monthlyAssessmentStats.timeSpent}m
                    </div>
                    <div className="text-xs text-muted-foreground">Time Spent</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Skill Performance Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-orange-600" />
                Skill Performance Analysis
              </CardTitle>
              <CardDescription>
                Detailed breakdown of your performance across different skill areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(progressMetrics.assessments.skillPerformance).map(([skill, performance]) => (
                  <div key={skill} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium capitalize">{skill.replace('-', ' ')}</h4>
                        <Badge variant="outline" className="text-xs">
                          {performance.assessmentCount} assessments
                        </Badge>
                        {performance.improvement > 0 && (
                          <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                            +{performance.improvement}% improvement
                          </Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{performance.averageScore}%</div>
                        <div className="text-xs text-muted-foreground">Average</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Performance</span>
                          <span>Last: {performance.lastScore}%</span>
                        </div>
                        <Progress value={performance.averageScore} className="h-2" />
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        performance.averageScore >= 85 ? 'bg-green-500' :
                        performance.averageScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {performance.averageScore >= 85 
                        ? `Excellent performance in ${skill.replace('-', ' ')}! Keep up the great work.`
                        : performance.averageScore >= 70 
                          ? `Good progress in ${skill.replace('-', ' ')}. Consider focusing on this area for improvement.`
                          : `This skill area needs attention. Consider additional practice in ${skill.replace('-', ' ')}.`
                      }
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Assessment Insights */}
          {(() => {
            const insights = AssessmentProgressTracker.getAssessmentInsights(progressMetrics.assessments);
            return (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {insights.strengths.length > 0 ? insights.strengths.map((strength, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{strength}</span>
                        </div>
                      )) : (
                        <p className="text-sm text-muted-foreground">Take more assessments to identify your strengths.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-600" />
                      Areas for Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {insights.areasForImprovement.length > 0 ? insights.areasForImprovement.map((area, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <Target className="h-4 w-4 text-orange-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{area}</span>
                        </div>
                      )) : (
                        <p className="text-sm text-muted-foreground">Great job! No major areas for improvement identified.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })()}
        </TabsContent>

        <TabsContent value="difficulty" className="space-y-4">
          {difficultyLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Brain className="h-5 w-5 animate-pulse" />
                  Loading adaptive difficulty data...
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* CEFR Progression Card */}
              {cefrProgression && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      CEFR Level Progression
                    </CardTitle>
                    <CardDescription>
                      Your progress toward the next proficiency level
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-lg py-2 px-4">
                            {cefrProgression.currentLevel}
                          </Badge>
                          <div className="text-sm text-muted-foreground">
                            {cefrProgression.subLevel}% within level
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">Next Level: {cefrProgression.nextLevel}</div>
                          <div className="text-xs text-muted-foreground">
                            Est. {cefrProgression.estimatedTimeToNext} days
                          </div>
                        </div>
                      </div>
                      
                      <Progress 
                        value={cefrProgression.progressToNext} 
                        className="h-4"
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium text-sm mb-2">Strength Areas</h4>
                          <div className="space-y-1">
                            {cefrProgression.strengthAreas.map((area, index) => (
                              <div key={index} className="flex items-center justify-between text-xs">
                                <span className="capitalize">{area.skill}</span>
                                <Badge variant="secondary" className="h-5">{area.proficiency}%</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-sm mb-2">Development Areas</h4>
                          <div className="space-y-1">
                            {cefrProgression.developmentAreas.map((area, index) => (
                              <div key={index} className="flex items-center justify-between text-xs">
                                <span className="capitalize">{area.skill}</span>
                                <Badge variant="outline" className="h-5">{area.proficiency}%</Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="font-medium text-sm text-blue-900 mb-1">Readiness Assessment</h4>
                        <div className="text-sm text-blue-800">
                          Overall readiness for {cefrProgression.nextLevel}: <strong>{cefrProgression.readinessForNext.overallReadiness}%</strong>
                        </div>
                        <div className="text-xs text-blue-700 mt-1">
                          Focus areas: {cefrProgression.readinessForNext.recommendedFocus.join(', ')}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Current Difficulty Level Card */}
              {currentDifficulty && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="h-5 w-5 text-purple-600" />
                      Current Adaptive Difficulty
                    </CardTitle>
                    <CardDescription>
                      Real-time difficulty calibrated to your performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{currentDifficulty.overall}</div>
                        <div className="text-xs text-muted-foreground">Overall</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{currentDifficulty.cognitive}</div>
                        <div className="text-xs text-muted-foreground">Cognitive</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{currentDifficulty.linguistic}</div>
                        <div className="text-xs text-muted-foreground">Linguistic</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{currentDifficulty.contextual}</div>
                        <div className="text-xs text-muted-foreground">Contextual</div>
                      </div>
                    </div>
                    
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <div className="text-sm font-medium mb-1">Current Configuration</div>
                      <div className="text-xs text-muted-foreground">{currentDifficulty.description}</div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Adjustments Card */}
              {recentAdjustments.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      Recent Difficulty Adjustments
                    </CardTitle>
                    <CardDescription>
                      How the system has adapted to your learning progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentAdjustments.map((adjustment, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Badge variant={
                                adjustment.recommendedDifficulty.overall > adjustment.currentDifficulty.overall 
                                  ? "default" 
                                  : "secondary"
                              }>
                                {adjustment.recommendedDifficulty.overall > adjustment.currentDifficulty.overall 
                                  ? "Increased" 
                                  : "Maintained"}
                              </Badge>
                              <span className="text-sm font-medium">
                                {adjustment.currentDifficulty.overall} → {adjustment.recommendedDifficulty.overall}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Confidence: {Math.round(adjustment.confidence * 100)}%
                            </div>
                          </div>
                          
                          <div className="text-xs text-muted-foreground mb-2">
                            <strong>Reasoning:</strong> {adjustment.adjustmentReason.explanation}
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {adjustment.adjustmentReason.primaryFactors.map((factor, factorIndex) => (
                              <Badge key={factorIndex} variant="outline" className="text-xs">
                                {factor}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Performance Insights Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-indigo-600" />
                    Adaptive Learning Insights
                  </CardTitle>
                  <CardDescription>
                    How adaptive difficulty enhances your learning experience
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold text-blue-600">
                        {cefrProgression ? Math.round((cefrProgression.progressToNext / 100) * 30) : 0}%
                      </div>
                      <div className="text-xs text-blue-800">Optimal Challenge Zone</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Time spent in ideal difficulty range
                      </div>
                    </div>
                    
                    <div className="bg-green-50 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold text-green-600">
                        {recentAdjustments.length}
                      </div>
                      <div className="text-xs text-green-800">Smart Adjustments</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Real-time difficulty adaptations
                      </div>
                    </div>
                    
                    <div className="bg-purple-50 p-3 rounded-lg text-center">
                      <div className="text-lg font-bold text-purple-600">
                        {currentDifficulty ? Math.round(currentDifficulty.overall * 0.8) : 0}%
                      </div>
                      <div className="text-xs text-purple-800">Learning Efficiency</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Estimated improvement in learning speed
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium mb-2">How Adaptive Difficulty Works</div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <p>• Monitors your performance in real-time across multiple dimensions</p>
                      <p>• Adjusts content complexity to maintain optimal challenge level</p>
                      <p>• Tracks CEFR progression and readiness for advancement</p>
                      <p>• Personalizes learning experience based on your unique patterns</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid gap-4">
            {learningGoals.map((goal) => (
              <Card key={goal.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(goal.category)}
                      {goal.name}
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {goal.category}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>{goal.current} {goal.unit}</span>
                      <span>{goal.target} {goal.unit} goal</span>
                    </div>
                    <Progress 
                      value={(goal.current / goal.target) * 100} 
                      className="h-3"
                    />
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{Math.round((goal.current / goal.target) * 100)}% complete</span>
                      <span>{goal.target - goal.current} {goal.unit} remaining</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className={achievement.earned ? 'border-green-200 bg-green-50' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{achievement.icon}</span>
                      {achievement.title}
                    </div>
                    {achievement.earned ? (
                      <Badge variant="default" className="bg-green-500">
                        <Trophy className="h-3 w-3 mr-1" />
                        Earned
                      </Badge>
                    ) : (
                      <Badge variant="outline">
                        Locked
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {achievement.description}
                  </CardDescription>
                </CardHeader>
                {achievement.earned && achievement.earnedDate && (
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Earned on {new Date(achievement.earnedDate).toLocaleDateString()}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Detailed insights into your learning progress
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{progressMetrics.completedLessons}</div>
                    <div className="text-sm text-muted-foreground">Total Lessons</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{progressMetrics.currentStreak}</div>
                    <div className="text-sm text-muted-foreground">Day Streak</div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Learning Categories</h4>
                  <div className="space-y-2">
                    {['speaking', 'writing', 'reading', 'listening'].map((category) => {
                      const categoryGoals = learningGoals.filter(g => g.category === category);
                      const avgProgress = categoryGoals.length > 0 
                        ? categoryGoals.reduce((acc, goal) => acc + (goal.current / goal.target), 0) / categoryGoals.length * 100
                        : 0;
                      
                      return (
                        <div key={category} className="flex items-center gap-3">
                          <div className="flex items-center gap-2 w-24">
                            {getCategoryIcon(category)}
                            <span className="text-sm capitalize">{category}</span>
                          </div>
                          <div className="flex-1">
                            <Progress value={avgProgress} className="h-2" />
                          </div>
                          <div className="text-xs text-muted-foreground w-12">
                            {Math.round(avgProgress)}%
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}