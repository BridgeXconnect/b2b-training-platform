'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Calendar,
  BookOpen,
  MessageSquare,
  Award,
  CheckCircle2
} from 'lucide-react';

interface ProgressDashboardProps {
  userId?: string;
  sessionId?: string;
}

export default function ProgressDashboard({ 
  userId = 'current_user',
  sessionId 
}: ProgressDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  // Simplified demo data (BMAD system removed for MVP)
  const demoProgress = {
    overallProgress: 65,
    completedLessons: 12,
    totalLessons: 20,
    currentLevel: 'B1',
    nextMilestone: 'B2'
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Learning Progress</h1>
          <p className="text-gray-600 mt-1">Track your English learning journey</p>
        </div>
        <Badge variant="outline" className="px-3 py-1">
          Level {demoProgress.currentLevel}
        </Badge>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{demoProgress.overallProgress}%</div>
            <Progress value={demoProgress.overallProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Lessons</CardTitle>
            <BookOpen className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{demoProgress.completedLessons}</div>
            <p className="text-xs text-gray-600 mt-1">
              out of {demoProgress.totalLessons} lessons
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Level</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{demoProgress.currentLevel}</div>
            <p className="text-xs text-gray-600 mt-1">
              Next: {demoProgress.nextMilestone}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-gray-600 mt-1">badges earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Your latest learning achievements</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-4">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Completed Business Vocabulary Module</p>
                <p className="text-xs text-gray-600">2 hours ago</p>
              </div>
              <Badge variant="secondary">+50 XP</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-2 rounded-full">
                <MessageSquare className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Practiced Presentation Skills</p>
                <p className="text-xs text-gray-600">1 day ago</p>
              </div>
              <Badge variant="secondary">+30 XP</Badge>
            </div>

            <div className="flex items-center space-x-4">
              <div className="bg-purple-100 p-2 rounded-full">
                <Award className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Earned Communication Master Badge</p>
                <p className="text-xs text-gray-600">3 days ago</p>
              </div>
              <Badge variant="secondary">Achievement</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center py-4">
        <p className="text-sm text-gray-500">
          💡 Progress dashboard simplified for MVP demo. Full analytics available in production.
        </p>
      </div>
    </div>
  );
}

// Export simplified version for compatibility
export { ProgressDashboard };