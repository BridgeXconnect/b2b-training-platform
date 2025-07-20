import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Types for progress tracking
export interface LearningGoal {
  id: string;
  name: string;
  target: number;
  current: number;
  unit: string;
  category: 'speaking' | 'writing' | 'listening' | 'reading';
  createdDate: string;
  targetDate?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
  category: 'milestone' | 'streak' | 'skill';
  requirements?: Record<string, any>;
}

export interface ProgressMetrics {
  totalStudyTime: number; // in hours
  completedLessons: number;
  currentStreak: number;
  longestStreak: number;
  cefrProgress: {
    current: CEFRLevel;
    nextLevel: CEFRLevel;
    progressToNext: number; // percentage
  };
  weeklyGoal: {
    target: number; // hours
    completed: number; // hours
  };
  monthlyStats: {
    lessonsCompleted: number;
    hoursStudied: number;
    goalsMet: number;
  };
}

export interface StudySession {
  id: string;
  date: string;
  duration: number; // minutes
  category: 'speaking' | 'writing' | 'listening' | 'reading';
  activities: string[];
  progress: Record<string, number>;
}

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// Utility functions for progress calculations
export class ProgressCalculator {
  static calculateGoalProgress(goal: LearningGoal): number {
    return Math.min((goal.current / goal.target) * 100, 100);
  }

  static calculateOverallProgress(goals: LearningGoal[]): number {
    if (goals.length === 0) return 0;
    const totalProgress = goals.reduce((sum, goal) => sum + this.calculateGoalProgress(goal), 0);
    return totalProgress / goals.length;
  }

  static calculateCategoryProgress(goals: LearningGoal[], category: string): number {
    const categoryGoals = goals.filter(goal => goal.category === category);
    return this.calculateOverallProgress(categoryGoals);
  }

  static calculateWeeklyProgress(studySessions: StudySession[], targetHours: number): {
    completed: number;
    target: number;
    percentage: number;
  } {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    const weekSessions = studySessions.filter(session => 
      new Date(session.date) >= oneWeekAgo
    );
    
    const completedMinutes = weekSessions.reduce((sum, session) => sum + session.duration, 0);
    const completedHours = completedMinutes / 60;
    const percentage = Math.min((completedHours / targetHours) * 100, 100);
    
    return {
      completed: completedHours,
      target: targetHours,
      percentage
    };
  }

  static calculateStreak(studySessions: StudySession[]): {
    current: number;
    longest: number;
  } {
    if (studySessions.length === 0) return { current: 0, longest: 0 };

    // Sort sessions by date (most recent first)
    const sortedSessions = [...studySessions].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Calculate current streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    
    const today = new Date();
    const sessionDates = new Set(sortedSessions.map(s => s.date.split('T')[0]));
    
    // Check current streak from today backwards
    for (let i = 0; i < 365; i++) { // Max 365 days lookback
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() - i);
      const dateString = checkDate.toISOString().split('T')[0];
      
      if (sessionDates.has(dateString)) {
        currentStreak++;
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        if (i === 0) {
          // If no session today, check yesterday for grace period
          continue;
        }
        break;
      }
    }

    // Calculate longest streak overall
    tempStreak = 0;
    const allDates = Array.from(sessionDates).sort();
    
    for (let i = 0; i < allDates.length; i++) {
      if (i === 0) {
        tempStreak = 1;
      } else {
        const prevDate = new Date(allDates[i - 1]);
        const currDate = new Date(allDates[i]);
        const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 3600 * 24);
        
        if (dayDiff === 1) {
          tempStreak++;
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }
    longestStreak = Math.max(longestStreak, tempStreak);

    return { current: currentStreak, longest: longestStreak };
  }

  static getCEFRLevelProgress(currentLevel: CEFRLevel, sessionCount: number, assessmentScore: number): {
    current: CEFRLevel;
    nextLevel: CEFRLevel;
    progressToNext: number;
  } {
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levels.indexOf(currentLevel);
    const nextIndex = Math.min(currentIndex + 1, levels.length - 1);
    
    // Progress calculation based on sessions and assessment scores
    // This is a simplified algorithm - in practice, you'd use more sophisticated metrics
    const sessionProgress = Math.min((sessionCount % 50) / 50 * 100, 100);
    const scoreProgress = Math.min((assessmentScore / 100) * 100, 100);
    const combinedProgress = (sessionProgress * 0.6) + (scoreProgress * 0.4);
    
    return {
      current: levels[currentIndex],
      nextLevel: levels[nextIndex],
      progressToNext: Math.round(combinedProgress)
    };
  }
}

// Achievement checking system
export class AchievementChecker {
  static checkAchievements(
    metrics: ProgressMetrics,
    goals: LearningGoal[],
    studySessions: StudySession[]
  ): Achievement[] {
    const achievements: Achievement[] = [];

    // Milestone achievements
    if (metrics.completedLessons >= 1) {
      achievements.push({
        id: 'first-lesson',
        title: 'First Steps',
        description: 'Completed your first lesson',
        icon: '🎯',
        earned: true,
        earnedDate: new Date().toISOString(),
        category: 'milestone'
      });
    }

    if (metrics.completedLessons >= 10) {
      achievements.push({
        id: 'lesson-achiever',
        title: 'Lesson Achiever',
        description: 'Completed 10 lessons',
        icon: '📚',
        earned: true,
        earnedDate: new Date().toISOString(),
        category: 'milestone'
      });
    }

    if (metrics.completedLessons >= 50) {
      achievements.push({
        id: 'lesson-master',
        title: 'Lesson Master',
        description: 'Completed 50 lessons',
        icon: '🏆',
        earned: true,
        earnedDate: new Date().toISOString(),
        category: 'milestone'
      });
    }

    // Streak achievements
    if (metrics.currentStreak >= 7) {
      achievements.push({
        id: 'week-warrior',
        title: 'Week Warrior',
        description: 'Maintained a 7-day learning streak',
        icon: '🔥',
        earned: true,
        earnedDate: new Date().toISOString(),
        category: 'streak'
      });
    }

    if (metrics.currentStreak >= 30) {
      achievements.push({
        id: 'month-master',
        title: 'Month Master',
        description: 'Maintained a 30-day learning streak',
        icon: '⚡',
        earned: true,
        earnedDate: new Date().toISOString(),
        category: 'streak'
      });
    }

    // Skill-based achievements
    const writingGoals = goals.filter(g => g.category === 'writing');
    const speakingGoals = goals.filter(g => g.category === 'speaking');
    
    if (writingGoals.some(g => ProgressCalculator.calculateGoalProgress(g) >= 100)) {
      achievements.push({
        id: 'writing-expert',
        title: 'Writing Expert',
        description: 'Completed a writing goal',
        icon: '✍️',
        earned: true,
        earnedDate: new Date().toISOString(),
        category: 'skill'
      });
    }

    if (speakingGoals.some(g => ProgressCalculator.calculateGoalProgress(g) >= 100)) {
      achievements.push({
        id: 'speaking-star',
        title: 'Speaking Star',
        description: 'Completed a speaking goal',
        icon: '🎤',
        earned: true,
        earnedDate: new Date().toISOString(),
        category: 'skill'
      });
    }

    return achievements;
  }
}

// Data export utilities
export class ProgressExporter {
  static exportToJSON(
    metrics: ProgressMetrics,
    goals: LearningGoal[],
    achievements: Achievement[],
    studySessions: StudySession[]
  ): string {
    const exportData = {
      exportDate: new Date().toISOString(),
      metrics,
      goals,
      achievements: achievements.filter(a => a.earned),
      studySessions,
      summary: {
        totalLessons: metrics.completedLessons,
        totalHours: metrics.totalStudyTime,
        currentStreak: metrics.currentStreak,
        completedGoals: goals.filter(g => ProgressCalculator.calculateGoalProgress(g) >= 100).length,
        earnedAchievements: achievements.filter(a => a.earned).length
      }
    };

    return JSON.stringify(exportData, null, 2);
  }

  static exportToCSV(studySessions: StudySession[]): string {
    const headers = ['Date', 'Duration (minutes)', 'Category', 'Activities'];
    const rows = studySessions.map(session => [
      session.date,
      session.duration.toString(),
      session.category,
      session.activities.join('; ')
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  static generateProgressReport(
    metrics: ProgressMetrics,
    goals: LearningGoal[],
    achievements: Achievement[]
  ): string {
    const completedGoals = goals.filter(g => ProgressCalculator.calculateGoalProgress(g) >= 100);
    const earnedAchievements = achievements.filter(a => a.earned);
    
    return `
# Learning Progress Report
Generated on: ${new Date().toLocaleDateString()}

## Summary
- **Total Study Time**: ${metrics.totalStudyTime} hours
- **Lessons Completed**: ${metrics.completedLessons}
- **Current Streak**: ${metrics.currentStreak} days
- **CEFR Level**: ${metrics.cefrProgress.current}

## Goals Progress
- **Total Goals**: ${goals.length}
- **Completed Goals**: ${completedGoals.length}
- **Overall Progress**: ${Math.round(ProgressCalculator.calculateOverallProgress(goals))}%

## Achievements
- **Total Earned**: ${earnedAchievements.length}
${earnedAchievements.map(a => `- ${a.icon} ${a.title}: ${a.description}`).join('\n')}

## Next Steps
- **To Next CEFR Level**: ${100 - metrics.cefrProgress.progressToNext}% remaining
- **Weekly Goal**: ${metrics.weeklyGoal.target - metrics.weeklyGoal.completed} hours remaining
    `.trim();
  }
}

// Progress validation utilities
export class ProgressValidator {
  static validateGoal(goal: Partial<LearningGoal>): string[] {
    const errors: string[] = [];
    
    if (!goal.name || goal.name.trim().length === 0) {
      errors.push('Goal name is required');
    }
    
    if (!goal.target || goal.target <= 0) {
      errors.push('Goal target must be greater than 0');
    }
    
    if (goal.current && goal.current < 0) {
      errors.push('Current progress cannot be negative');
    }
    
    if (!goal.category || !['speaking', 'writing', 'listening', 'reading'].includes(goal.category)) {
      errors.push('Valid category is required');
    }
    
    return errors;
  }

  static validateStudySession(session: Partial<StudySession>): string[] {
    const errors: string[] = [];
    
    if (!session.date) {
      errors.push('Session date is required');
    }
    
    if (!session.duration || session.duration <= 0) {
      errors.push('Session duration must be greater than 0');
    }
    
    if (!session.category || !['speaking', 'writing', 'listening', 'reading'].includes(session.category)) {
      errors.push('Valid category is required');
    }
    
    if (!session.activities || session.activities.length === 0) {
      errors.push('At least one activity is required');
    }
    
    return errors;
  }
}