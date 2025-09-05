/**
 * Progress Service
 * Connects frontend progress tracking to backend API
 */

import { logger } from '../logger';

// Types that match the backend models
export interface LearningGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  category: 'speaking' | 'writing' | 'listening' | 'reading';
  target_date?: string;
  created_at: string;
}

export interface StudySession {
  id: string;
  date: string;
  duration: number; // minutes
  category: 'speaking' | 'writing' | 'listening' | 'reading';
  activities: string[];
  progress?: Record<string, any>;
  created_at: string;
}

export interface Assessment {
  id: string;
  assessment_type: string;
  cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  started_at: string;
  completed_at?: string;
  time_spent?: number; // seconds
  percentage?: number; // 0-100
  skill_breakdown?: Record<string, any>;
  created_at: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'milestone' | 'streak' | 'skill';
  requirements?: Record<string, any>;
  earned_date?: string;
  created_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  total_study_time: number; // hours
  completed_lessons: number;
  current_streak: number;
  longest_streak: number;
  current_cefr_level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  weekly_goal_hours: number;
  monthly_stats?: Record<string, any>;
  updated_at: string;
}

export interface ProgressDashboard {
  user_progress: UserProgress;
  learning_goals: LearningGoal[];
  recent_sessions: StudySession[];
  recent_assessments: Assessment[];
  achievements: Achievement[];
}

export interface WeeklyProgress {
  target_hours: number;
  completed_hours: number;
  percentage: number;
  sessions_count: number;
  days_studied: number;
}

// API Configuration
export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ProgressService {
  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('access_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorText = await response.text();
      logger.error('API Error', 'PROGRESS_SERVICE', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    return response.json();
  }

  // Learning Goals
  async createLearningGoal(goalData: {
    name: string;
    target: number;
    unit: string;
    category: string;
    target_date?: string;
  }): Promise<LearningGoal> {
    try {
      const response = await fetch(`${API_BASE}/api/progress/goals`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(goalData)
      });

      const goal = await this.handleResponse<LearningGoal>(response);
      
      logger.userAction('Learning goal created', 'current_user', {
        goalId: goal.id,
        category: goal.category
      });
      
      return goal;
    } catch (error) {
      logger.error('Failed to create learning goal', 'PROGRESS_SERVICE', { error });
      throw error;
    }
  }

  async getLearningGoals(): Promise<LearningGoal[]> {
    try {
      const response = await fetch(`${API_BASE}/api/progress/goals`, {
        headers: this.getAuthHeaders()
      });

      return this.handleResponse<LearningGoal[]>(response);
    } catch (error) {
      logger.error('Failed to get learning goals', 'PROGRESS_SERVICE', { error });
      throw error;
    }
  }

  async updateGoalProgress(goalId: string, currentProgress: number): Promise<LearningGoal> {
    try {
      const response = await fetch(`${API_BASE}/api/progress/goals/${goalId}?current_progress=${currentProgress}`, {
        method: 'PUT',
        headers: this.getAuthHeaders()
      });

      const goal = await this.handleResponse<LearningGoal>(response);
      
      logger.userAction('Goal progress updated', 'current_user', {
        goalId,
        progress: currentProgress
      });
      
      return goal;
    } catch (error) {
      logger.error('Failed to update goal progress', 'PROGRESS_SERVICE', { error });
      throw error;
    }
  }

  // Study Sessions
  async createStudySession(sessionData: {
    date: string;
    duration: number;
    category: string;
    activities: string[];
    progress?: Record<string, any>;
  }): Promise<StudySession> {
    try {
      const response = await fetch(`${API_BASE}/api/progress/sessions`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(sessionData)
      });

      const session = await this.handleResponse<StudySession>(response);
      
      logger.userAction('Study session created', 'current_user', {
        sessionId: session.id,
        duration: session.duration,
        category: session.category
      });
      
      return session;
    } catch (error) {
      logger.error('Failed to create study session', 'PROGRESS_SERVICE', { error });
      throw error;
    }
  }

  async getStudySessions(limit = 10): Promise<StudySession[]> {
    try {
      const response = await fetch(`${API_BASE}/api/progress/sessions?limit=${limit}`, {
        headers: this.getAuthHeaders()
      });

      return this.handleResponse<StudySession[]>(response);
    } catch (error) {
      logger.error('Failed to get study sessions', 'PROGRESS_SERVICE', { error });
      throw error;
    }
  }

  // Assessments
  async createAssessment(assessmentData: {
    assessment_type: string;
    cefr_level: string;
    started_at: string;
    completed_at?: string;
    time_spent?: number;
    percentage?: number;
    skill_breakdown?: Record<string, any>;
  }): Promise<Assessment> {
    try {
      const response = await fetch(`${API_BASE}/api/progress/assessments`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(assessmentData)
      });

      const assessment = await this.handleResponse<Assessment>(response);
      
      logger.userAction('Assessment created', 'current_user', {
        assessmentId: assessment.id,
        type: assessment.assessment_type,
        level: assessment.cefr_level
      });
      
      return assessment;
    } catch (error) {
      logger.error('Failed to create assessment', 'PROGRESS_SERVICE', { error });
      throw error;
    }
  }

  async getAssessments(limit = 10): Promise<Assessment[]> {
    try {
      const response = await fetch(`${API_BASE}/api/progress/assessments?limit=${limit}`, {
        headers: this.getAuthHeaders()
      });

      return this.handleResponse<Assessment[]>(response);
    } catch (error) {
      logger.error('Failed to get assessments', 'PROGRESS_SERVICE', { error });
      throw error;
    }
  }

  // Achievements
  async getAchievements(earnedOnly = false): Promise<Achievement[]> {
    try {
      const response = await fetch(`${API_BASE}/api/progress/achievements?earned_only=${earnedOnly}`, {
        headers: this.getAuthHeaders()
      });

      return this.handleResponse<Achievement[]>(response);
    } catch (error) {
      logger.error('Failed to get achievements', 'PROGRESS_SERVICE', { error });
      throw error;
    }
  }

  // Dashboard
  async getProgressDashboard(): Promise<ProgressDashboard> {
    try {
      const response = await fetch(`${API_BASE}/api/progress/dashboard`, {
        headers: this.getAuthHeaders()
      });

      const dashboard = await this.handleResponse<ProgressDashboard>(response);
      
      logger.info('Progress dashboard loaded', 'PROGRESS_SERVICE', {
        goalsCount: dashboard.learning_goals.length,
        sessionsCount: dashboard.recent_sessions.length,
        achievementsCount: dashboard.achievements.length
      });
      
      return dashboard;
    } catch (error) {
      logger.error('Failed to get progress dashboard', 'PROGRESS_SERVICE', { error });
      throw error;
    }
  }

  // Weekly Progress
  async getWeeklyProgress(): Promise<WeeklyProgress> {
    try {
      const response = await fetch(`${API_BASE}/api/progress/weekly`, {
        headers: this.getAuthHeaders()
      });

      return this.handleResponse<WeeklyProgress>(response);
    } catch (error) {
      logger.error('Failed to get weekly progress', 'PROGRESS_SERVICE', { error });
      throw error;
    }
  }

  // Convenience method to log a study session automatically
  async logSession(
    category: 'speaking' | 'writing' | 'listening' | 'reading',
    durationMinutes: number,
    activities: string[],
    progress?: Record<string, any>
  ): Promise<StudySession> {
    return this.createStudySession({
      date: new Date().toISOString(),
      duration: durationMinutes,
      category,
      activities,
      progress
    });
  }

  // Convenience method to update weekly goal
  async updateWeeklyGoal(hours: number): Promise<void> {
    try {
      // This would require a separate endpoint to update user settings
      // For now, we'll just log the intention
      logger.userAction('Weekly goal updated', 'current_user', { hours });
    } catch (error) {
      logger.error('Failed to update weekly goal', 'PROGRESS_SERVICE', { error });
      throw error;
    }
  }
}

// Export singleton instance
export const progressService = new ProgressService();

// Utility functions for frontend components
export const formatStudyTime = (hours: number): string => {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`;
  }
  return `${Math.round(hours * 10) / 10}h`;
};

export const calculateGoalProgress = (goal: LearningGoal): number => {
  return Math.min((goal.current / goal.target) * 100, 100);
};

export const getNextCEFRLevel = (currentLevel: string): string => {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const currentIndex = levels.indexOf(currentLevel);
  return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : currentLevel;
};

export const isGoalCompleted = (goal: LearningGoal): boolean => {
  return goal.current >= goal.target;
};