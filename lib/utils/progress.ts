import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AssessmentAttempt, AssessmentResults, CEFRLevel } from './assessment';

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

export interface AssessmentMetrics {
  totalAssessments: number;
  averageScore: number;
  bestScore: number;
  recentScore: number;
  assessmentStreak: number; // consecutive assessments with improvement
  skillPerformance: Record<string, {
    averageScore: number;
    assessmentCount: number;
    lastScore: number;
    improvement: number; // percentage change from first to last
  }>;
  cefrProgression: {
    startLevel: CEFRLevel;
    currentLevel: CEFRLevel;
    demonstratedLevel: CEFRLevel;
    readinessForNext: number;
    levelHistory: Array<{
      level: CEFRLevel;
      achievedDate: string;
      assessmentId: string;
    }>;
  };
  monthlyAssessmentStats: {
    assessmentsTaken: number;
    averageScore: number;
    skillsImproved: number;
    timeSpent: number; // in minutes
  };
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
  assessments: AssessmentMetrics;
}

export interface StudySession {
  id: string;
  date: string;
  duration: number; // minutes
  category: 'speaking' | 'writing' | 'listening' | 'reading';
  activities: string[];
  progress: Record<string, number>;
}


// Assessment progress tracking utilities
export class AssessmentProgressTracker {
  static calculateAssessmentMetrics(assessmentResults: AssessmentResults[]): AssessmentMetrics {
    if (assessmentResults.length === 0) {
      return {
        totalAssessments: 0,
        averageScore: 0,
        bestScore: 0,
        recentScore: 0,
        assessmentStreak: 0,
        skillPerformance: {},
        cefrProgression: {
          startLevel: 'A1',
          currentLevel: 'A1',
          demonstratedLevel: 'A1',
          readinessForNext: 0,
          levelHistory: []
        },
        monthlyAssessmentStats: {
          assessmentsTaken: 0,
          averageScore: 0,
          skillsImproved: 0,
          timeSpent: 0
        }
      };
    }

    // Sort results by completion date
    const sortedResults = [...assessmentResults].sort((a, b) => 
      new Date(a.attempt.completedAt || a.attempt.startedAt).getTime() - new Date(b.attempt.completedAt || b.attempt.startedAt).getTime()
    );

    const recentResults = sortedResults.slice(-1)[0];
    const scores = sortedResults.map(r => r.attempt.percentage);
    
    // Calculate skill performance
    const skillPerformance: Record<string, any> = {};
    
    assessmentResults.forEach(result => {
      Object.entries(result.skillBreakdown).forEach(([skill, data]) => {
        if (!skillPerformance[skill]) {
          skillPerformance[skill] = {
            scores: [],
            assessmentCount: 0
          };
        }
        skillPerformance[skill].scores.push(data.percentage);
        skillPerformance[skill].assessmentCount++;
      });
    });

    // Process skill performance metrics
    Object.keys(skillPerformance).forEach(skill => {
      const scores = skillPerformance[skill].scores;
      const averageScore = scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length;
      const lastScore = scores[scores.length - 1];
      const firstScore = scores[0];
      const improvement = scores.length > 1 ? ((lastScore - firstScore) / firstScore) * 100 : 0;

      skillPerformance[skill] = {
        averageScore: Math.round(averageScore),
        assessmentCount: scores.length,
        lastScore,
        improvement: Math.round(improvement)
      };
    });

    // Calculate assessment streak (consecutive improvements)
    let assessmentStreak = 0;
    for (let i = scores.length - 1; i > 0; i--) {
      if (scores[i] >= scores[i - 1]) {
        assessmentStreak++;
      } else {
        break;
      }
    }

    // Calculate CEFR progression
    const levelHistory = sortedResults
      .map(result => ({
        level: result.cefrLevelAnalysis.demonstratedLevel,
        achievedDate: result.attempt.completedAt || result.attempt.startedAt,
        assessmentId: result.attempt.assessmentId
      }))
      .filter((item, index, self) => 
        index === self.findIndex(t => t.level === item.level)
      );

    // Calculate monthly stats
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const monthlyResults = assessmentResults.filter(result => 
      new Date(result.attempt.completedAt || result.attempt.startedAt) >= oneMonthAgo
    );

    const monthlyScores = monthlyResults.map(r => r.attempt.percentage);
    const monthlyTimeSpent = monthlyResults.reduce((sum, r) => sum + r.attempt.timeSpent, 0);

    // Count skills that improved this month
    let skillsImproved = 0;
    if (monthlyResults.length > 1) {
      const oldSkills = monthlyResults[0].skillBreakdown;
      const newSkills = monthlyResults[monthlyResults.length - 1].skillBreakdown;
      
      Object.keys(newSkills).forEach(skill => {
        if (oldSkills[skill] && newSkills[skill].percentage > oldSkills[skill].percentage) {
          skillsImproved++;
        }
      });
    }

    return {
      totalAssessments: assessmentResults.length,
      averageScore: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
      bestScore: Math.max(...scores),
      recentScore: recentResults.attempt.percentage,
      assessmentStreak,
      skillPerformance,
      cefrProgression: {
        startLevel: sortedResults[0].cefrLevelAnalysis.currentLevel,
        currentLevel: recentResults.cefrLevelAnalysis.currentLevel,
        demonstratedLevel: recentResults.cefrLevelAnalysis.demonstratedLevel,
        readinessForNext: recentResults.cefrLevelAnalysis.readinessForNext,
        levelHistory
      },
      monthlyAssessmentStats: {
        assessmentsTaken: monthlyResults.length,
        averageScore: monthlyScores.length > 0 ? Math.round(monthlyScores.reduce((sum, score) => sum + score, 0) / monthlyScores.length) : 0,
        skillsImproved,
        timeSpent: Math.round(monthlyTimeSpent / 60) // Convert to minutes
      }
    };
  }

  static updateProgressWithAssessment(
    currentMetrics: ProgressMetrics,
    assessmentResult: AssessmentResults,
    allAssessmentResults: AssessmentResults[]
  ): ProgressMetrics {
    const updatedAssessmentMetrics = this.calculateAssessmentMetrics(allAssessmentResults);
    
    // Update CEFR progress based on assessment
    const cefrProgress = {
      ...currentMetrics.cefrProgress,
      current: assessmentResult.cefrLevelAnalysis.currentLevel,
      progressToNext: assessmentResult.cefrLevelAnalysis.readinessForNext
    };

    // Determine next level
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levels.indexOf(cefrProgress.current);
    const nextIndex = Math.min(currentIndex + 1, levels.length - 1);
    cefrProgress.nextLevel = levels[nextIndex];

    return {
      ...currentMetrics,
      cefrProgress,
      assessments: updatedAssessmentMetrics
    };
  }

  static getAssessmentInsights(assessmentMetrics: AssessmentMetrics): {
    strengths: string[];
    areasForImprovement: string[];
    recommendations: string[];
    nextAssessmentSuggestion: string;
  } {
    const insights = {
      strengths: [] as string[],
      areasForImprovement: [] as string[],
      recommendations: [] as string[],
      nextAssessmentSuggestion: ''
    };

    // Analyze skill performance
    const skills = Object.entries(assessmentMetrics.skillPerformance);
    const strongSkills = skills.filter(([_, data]) => data.averageScore >= 80);
    const weakSkills = skills.filter(([_, data]) => data.averageScore < 60);
    const improvingSkills = skills.filter(([_, data]) => data.improvement > 10);

    // Strengths
    if (assessmentMetrics.assessmentStreak >= 3) {
      insights.strengths.push(`Consistent improvement over ${assessmentMetrics.assessmentStreak} assessments`);
    }
    
    if (assessmentMetrics.averageScore >= 80) {
      insights.strengths.push('Strong overall performance across assessments');
    }

    strongSkills.forEach(([skill, data]) => {
      insights.strengths.push(`Excellent ${skill.replace('-', ' ')} skills (${data.averageScore}% average)`);
    });

    improvingSkills.forEach(([skill, data]) => {
      insights.strengths.push(`Improving ${skill.replace('-', ' ')} skills (+${data.improvement}% improvement)`);
    });

    // Areas for improvement
    weakSkills.forEach(([skill, data]) => {
      insights.areasForImprovement.push(`${skill.replace('-', ' ')} needs attention (${data.averageScore}% average)`);
    });

    if (assessmentMetrics.assessmentStreak === 0 && assessmentMetrics.totalAssessments > 1) {
      insights.areasForImprovement.push('Recent assessment performance declined');
    }

    // Recommendations
    if (weakSkills.length > 0) {
      insights.recommendations.push(`Focus on practicing ${weakSkills.map(([skill]) => skill.replace('-', ' ')).join(', ')}`);
    }

    if (assessmentMetrics.cefrProgression.readinessForNext >= 80) {
      insights.recommendations.push(`You're ready to attempt ${assessmentMetrics.cefrProgression.currentLevel === 'C2' ? 'advanced' : 'next level'} assessments`);
    }

    if (assessmentMetrics.monthlyAssessmentStats.assessmentsTaken < 2) {
      insights.recommendations.push('Take assessments more regularly to track progress effectively');
    }

    // Next assessment suggestion
    if (assessmentMetrics.cefrProgression.readinessForNext >= 80) {
      const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const currentIndex = levels.indexOf(assessmentMetrics.cefrProgression.currentLevel);
      const nextLevel = levels[Math.min(currentIndex + 1, levels.length - 1)];
      insights.nextAssessmentSuggestion = `Try a ${nextLevel} level assessment to advance your skill level`;
    } else if (weakSkills.length > 0) {
      const weakestSkill = weakSkills[0][0];
      insights.nextAssessmentSuggestion = `Take a focused ${weakestSkill.replace('-', ' ')} assessment to improve this skill`;
    } else {
      insights.nextAssessmentSuggestion = `Continue with ${assessmentMetrics.cefrProgression.currentLevel} level assessments to maintain your skills`;
    }

    return insights;
  }
}

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
    const assessmentMetrics = metrics.assessments;

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

    // Assessment-based achievements
    if (assessmentMetrics.totalAssessments >= 1) {
      achievements.push({
        id: 'first-assessment',
        title: 'Assessment Beginner',
        description: 'Completed your first assessment',
        icon: '📝',
        earned: true,
        earnedDate: new Date().toISOString(),
        category: 'milestone'
      });
    }

    if (assessmentMetrics.totalAssessments >= 5) {
      achievements.push({
        id: 'assessment-regular',
        title: 'Assessment Regular',
        description: 'Completed 5 assessments',
        icon: '📊',
        earned: true,
        earnedDate: new Date().toISOString(),
        category: 'milestone'
      });
    }

    if (assessmentMetrics.totalAssessments >= 20) {
      achievements.push({
        id: 'assessment-master',
        title: 'Assessment Master',
        description: 'Completed 20 assessments',
        icon: '🏅',
        earned: true,
        earnedDate: new Date().toISOString(),
        category: 'milestone'
      });
    }

    if (assessmentMetrics.averageScore >= 90) {
      achievements.push({
        id: 'excellence-achiever',
        title: 'Excellence Achiever',
        description: 'Maintained 90%+ average assessment score',
        icon: '⭐',
        earned: true,
        earnedDate: new Date().toISOString(),
        category: 'skill'
      });
    }

    if (assessmentMetrics.bestScore === 100) {
      achievements.push({
        id: 'perfect-score',
        title: 'Perfect Score',
        description: 'Achieved 100% on an assessment',
        icon: '💯',
        earned: true,
        earnedDate: new Date().toISOString(),
        category: 'skill'
      });
    }

    if (assessmentMetrics.assessmentStreak >= 3) {
      achievements.push({
        id: 'improvement-streak',
        title: 'Consistent Improver',
        description: 'Improved score on 3 consecutive assessments',
        icon: '📈',
        earned: true,
        earnedDate: new Date().toISOString(),
        category: 'streak'
      });
    }

    if (assessmentMetrics.assessmentStreak >= 5) {
      achievements.push({
        id: 'unstoppable-improvement',
        title: 'Unstoppable',
        description: 'Improved score on 5 consecutive assessments',
        icon: '🚀',
        earned: true,
        earnedDate: new Date().toISOString(),
        category: 'streak'
      });
    }

    // CEFR level achievements
    const cefrAchievements = {
      'A2': { title: 'Elementary Achiever', icon: '🌱' },
      'B1': { title: 'Intermediate Milestone', icon: '🌿' },
      'B2': { title: 'Upper Intermediate Star', icon: '🌳' },
      'C1': { title: 'Advanced Learner', icon: '🏆' },
      'C2': { title: 'Mastery Achieved', icon: '👑' }
    };

    const currentLevel = assessmentMetrics.cefrProgression.currentLevel;
    if (currentLevel in cefrAchievements && currentLevel !== 'A1') {
      achievements.push({
        id: `cefr-${currentLevel.toLowerCase()}`,
        title: cefrAchievements[currentLevel as keyof typeof cefrAchievements].title,
        description: `Reached ${currentLevel} level in English proficiency`,
        icon: cefrAchievements[currentLevel as keyof typeof cefrAchievements].icon,
        earned: true,
        earnedDate: new Date().toISOString(),
        category: 'milestone'
      });
    }

    // Skill-specific achievements
    Object.entries(assessmentMetrics.skillPerformance).forEach(([skill, performance]) => {
      if (performance.averageScore >= 85) {
        achievements.push({
          id: `${skill}-expert`,
          title: `${skill.replace('-', ' ')} Expert`,
          description: `Achieved 85%+ average in ${skill.replace('-', ' ')}`,
          icon: '🎯',
          earned: true,
          earnedDate: new Date().toISOString(),
          category: 'skill'
        });
      }

      if (performance.improvement >= 25) {
        achievements.push({
          id: `${skill}-improver`,
          title: `${skill.replace('-', ' ')} Improver`,
          description: `Improved ${skill.replace('-', ' ')} score by ${performance.improvement}%`,
          icon: '📊',
          earned: true,
          earnedDate: new Date().toISOString(),
          category: 'skill'
        });
      }
    });

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
        earnedAchievements: achievements.filter(a => a.earned).length,
        assessmentSummary: {
          totalAssessments: metrics.assessments.totalAssessments,
          averageScore: metrics.assessments.averageScore,
          bestScore: metrics.assessments.bestScore,
          currentCEFRLevel: metrics.assessments.cefrProgression.currentLevel,
          demonstratedCEFRLevel: metrics.assessments.cefrProgression.demonstratedLevel
        }
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
    const assessmentMetrics = metrics.assessments;
    
    return `
# Learning Progress Report
Generated on: ${new Date().toLocaleDateString()}

## Summary
- **Total Study Time**: ${metrics.totalStudyTime} hours
- **Lessons Completed**: ${metrics.completedLessons}
- **Current Streak**: ${metrics.currentStreak} days
- **CEFR Level**: ${metrics.cefrProgress.current}

## Assessment Performance
- **Total Assessments**: ${assessmentMetrics.totalAssessments}
- **Average Score**: ${assessmentMetrics.averageScore}%
- **Best Score**: ${assessmentMetrics.bestScore}%
- **Current CEFR Level**: ${assessmentMetrics.cefrProgression.currentLevel}
- **Demonstrated Level**: ${assessmentMetrics.cefrProgression.demonstratedLevel}
- **Assessment Streak**: ${assessmentMetrics.assessmentStreak} consecutive improvements

## Skill Performance
${Object.entries(assessmentMetrics.skillPerformance).map(([skill, data]) => 
  `- **${skill.replace('-', ' ')}**: ${data.averageScore}% average (${data.assessmentCount} assessments, ${data.improvement > 0 ? '+' : ''}${data.improvement}% improvement)`
).join('\n')}

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
- **Assessment Recommendation**: Take regular assessments to track skill development
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