// Profile Utility Functions
// Story 4.4: User Profile & Preferences

import {
  UserProfile,
  ProfileSection,
  CEFRLevel,
  ProfileFormData,
  LearningPreferences,
  PersonalInfo,
  CEFRTracking,
  NotificationPreferences,
  CommunicationPreferences,
  AccessibilityPreferences,
  PrivacySettings,
  ExtendedUser,
} from '../types/user';

// CEFR level hierarchy for progression calculations
const CEFR_LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const CEFR_SCORES: Record<CEFRLevel, number> = {
  A1: 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
  C2: 6,
};

// Profile section definitions for completion tracking
export const PROFILE_SECTIONS: ProfileSection[] = [
  {
    id: 'personalInfo',
    name: 'Personal Information',
    description: 'Basic personal details and contact information',
    completed: false,
    weight: 20,
    requiredFields: ['firstName', 'lastName', 'email', 'timezone'],
    optionalFields: ['avatar', 'bio', 'location', 'phoneNumber'],
  },
  {
    id: 'learningPreferences',
    name: 'Learning Preferences',
    description: 'Goals, study schedule, and learning style preferences',
    completed: false,
    weight: 30,
    requiredFields: ['goals', 'businessContext', 'industry', 'learningStyle', 'pace'],
    optionalFields: ['topics', 'focusAreas', 'weakAreas', 'motivations'],
  },
  {
    id: 'cefrTracking',
    name: 'CEFR Level Tracking',
    description: 'Current and target CEFR levels',
    completed: false,
    weight: 25,
    requiredFields: ['currentLevel', 'targetLevel'],
    optionalFields: ['skillBreakdown'],
  },
  {
    id: 'communication',
    name: 'Communication Preferences',
    description: 'AI interaction and feedback preferences',
    completed: false,
    weight: 15,
    requiredFields: ['aiPersonality', 'feedbackFrequency', 'language'],
    optionalFields: ['complexity', 'conversationStyle', 'errorCorrection'],
  },
  {
    id: 'notifications',
    name: 'Notification Settings',
    description: 'Email and in-app notification preferences',
    completed: false,
    weight: 10,
    requiredFields: ['email', 'inApp'],
    optionalFields: ['reminders', 'achievements', 'progress', 'marketing'],
  },
];

/**
 * Calculate profile completion score based on filled fields
 */
export function calculateProfileCompletion(profile: Partial<UserProfile>): {
  score: number;
  completedSections: string[];
  recommendations: string[];
} {
  let totalWeight = 0;
  let completedWeight = 0;
  const completedSections: string[] = [];
  const recommendations: string[] = [];

  PROFILE_SECTIONS.forEach((section) => {
    totalWeight += section.weight;
    
    let sectionComplete = false;
    let sectionData: any = null;

    // Get section data
    switch (section.id) {
      case 'personalInfo':
        sectionData = profile.personalInfo;
        break;
      case 'learningPreferences':
        sectionData = profile.learningPreferences;
        break;
      case 'cefrTracking':
        sectionData = profile.cefrTracking;
        break;
      case 'communication':
        sectionData = profile.preferences?.communication;
        break;
      case 'notifications':
        sectionData = profile.preferences?.notifications;
        break;
    }

    // Check if required fields are complete
    if (sectionData) {
      const requiredComplete = section.requiredFields.every((field) => {
        const value = sectionData[field];
        return value !== undefined && value !== null && value !== '';
      });

      if (requiredComplete) {
        sectionComplete = true;
        completedWeight += section.weight;
        completedSections.push(section.id);
      }
    }

    // Add recommendations for incomplete sections
    if (!sectionComplete) {
      recommendations.push(`Complete ${section.name} to improve your learning experience`);
    }
  });

  const score = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

  return {
    score,
    completedSections,
    recommendations: recommendations.slice(0, 3), // Limit to top 3 recommendations
  };
}

/**
 * Calculate CEFR level progression and next steps
 */
export function calculateCEFRProgression(tracking: CEFRTracking): {
  progressToNext: number;
  nextLevel: CEFRLevel | null;
  canAdvance: boolean;
  recommendation: string;
} {
  const currentIndex = CEFR_LEVELS.indexOf(tracking.currentLevel);
  const targetIndex = CEFR_LEVELS.indexOf(tracking.targetLevel);
  
  // Calculate progress towards target
  const progressToNext = targetIndex > currentIndex 
    ? Math.round(((currentIndex + 1) / (targetIndex + 1)) * 100)
    : 100;

  const nextLevel: CEFRLevel | null = currentIndex < CEFR_LEVELS.length - 1 
    ? CEFR_LEVELS[currentIndex + 1] 
    : null;

  // Check if user can advance based on recent assessments
  const recentAssessments = tracking.assessmentHistory
    .filter(a => {
      const daysSince = (Date.now() - new Date(a.completedAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince <= 30; // Last 30 days
    })
    .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

  const canAdvance = recentAssessments.length >= 3 && 
    recentAssessments.slice(0, 3).every(a => a.score >= 80);

  let recommendation = '';
  if (canAdvance && nextLevel) {
    recommendation = `You're ready to advance to ${nextLevel}! Your recent assessment scores show consistent progress.`;
  } else if (nextLevel) {
    recommendation = `Keep practicing! Complete more assessments with 80%+ scores to advance to ${nextLevel}.`;
  } else {
    recommendation = 'Congratulations! You\'ve reached the highest CEFR level. Focus on maintaining your skills.';
  }

  return {
    progressToNext,
    nextLevel,
    canAdvance,
    recommendation,
  };
}

/**
 * Filter content based on user preferences
 */
export function filterContentByPreferences(
  content: any[],
  preferences: LearningPreferences,
  cefrLevel: CEFRLevel
): any[] {
  return content.filter((item) => {
    // Filter by CEFR level
    if (item.level && !isLevelAppropriate(item.level, cefrLevel, preferences.challengeLevel)) {
      return false;
    }

    // Filter by topics
    if (preferences.topics.length > 0 && item.topics) {
      const hasMatchingTopic = item.topics.some((topic: string) =>
        preferences.topics.some(userTopic => 
          topic.toLowerCase().includes(userTopic.toLowerCase())
        )
      );
      if (!hasMatchingTopic) {
        return false;
      }
    }

    // Filter by business context
    if (preferences.businessContext && item.context) {
      if (!item.context.toLowerCase().includes(preferences.businessContext.toLowerCase())) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Check if content level is appropriate for user
 */
function isLevelAppropriate(
  contentLevel: CEFRLevel,
  userLevel: CEFRLevel,
  challengeLevel: string
): boolean {
  const contentIndex = CEFR_LEVELS.indexOf(contentLevel);
  const userIndex = CEFR_LEVELS.indexOf(userLevel);

  switch (challengeLevel) {
    case 'comfortable':
      return contentIndex <= userIndex;
    case 'challenging':
      return contentIndex <= userIndex + 1;
    case 'very-challenging':
      return contentIndex <= userIndex + 2;
    default:
      return contentIndex === userIndex;
  }
}

/**
 * Generate personalized learning recommendations
 */
export function generateLearningRecommendations(
  profile: UserProfile
): string[] {
  const recommendations: string[] = [];
  const { learningPreferences, cefrTracking } = profile;

  // CEFR-based recommendations
  const cefrProgress = calculateCEFRProgression(cefrTracking);
  if (cefrProgress.canAdvance) {
    recommendations.push(cefrProgress.recommendation);
  }

  // Learning style recommendations
  switch (learningPreferences.learningStyle) {
    case 'visual':
      recommendations.push('Try visual learning materials like infographics and videos');
      break;
    case 'auditory':
      recommendations.push('Focus on listening exercises and conversation practice');
      break;
    case 'kinesthetic':
      recommendations.push('Engage with interactive exercises and role-playing activities');
      break;
    case 'mixed':
      recommendations.push('Use a variety of learning materials for optimal results');
      break;
  }

  // Pace-based recommendations
  if (learningPreferences.pace === 'fast') {
    recommendations.push('Consider increasing lesson frequency for faster progress');
  } else if (learningPreferences.pace === 'slow') {
    recommendations.push('Take your time with each lesson and focus on mastery');
  }

  // Focus area recommendations
  if (learningPreferences.weakAreas.length > 0) {
    recommendations.push(
      `Focus on improving: ${learningPreferences.weakAreas.slice(0, 2).join(', ')}`
    );
  }

  return recommendations.slice(0, 5); // Limit to top 5 recommendations
}

/**
 * Export user profile data in various formats
 */
export function exportProfileData(
  profile: UserProfile,
  format: 'json' | 'csv' | 'pdf' = 'json'
): string | Blob {
  const exportData = {
    profile: {
      personalInfo: profile.personalInfo,
      learningPreferences: profile.learningPreferences,
      cefrTracking: profile.cefrTracking,
      profileCompletion: profile.profileCompletion,
    },
    exportedAt: new Date().toISOString(),
    version: '1.0',
  };

  switch (format) {
    case 'json':
      return JSON.stringify(exportData, null, 2);
    
    case 'csv':
      return convertToCSV(exportData);
    
    case 'pdf':
      // In a real implementation, this would generate a PDF
      return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    
    default:
      return JSON.stringify(exportData, null, 2);
  }
}

/**
 * Convert profile data to CSV format
 */
function convertToCSV(data: any): string {
  const headers = ['Field', 'Value'];
  const rows: string[][] = [headers];

  function addRows(obj: any, prefix = ''): void {
    Object.entries(obj).forEach(([key, value]) => {
      const fieldName = prefix ? `${prefix}.${key}` : key;
      
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        addRows(value, fieldName);
      } else {
        rows.push([fieldName, String(value)]);
      }
    });
  }

  addRows(data);
  
  return rows.map(row => 
    row.map(field => `"${field.replace(/"/g, '""')}"`).join(',')
  ).join('\n');
}

/**
 * Validate profile data
 */
export function validateProfileData(data: Partial<ProfileFormData>): {
  isValid: boolean;
  errors: Record<string, string[]>;
} {
  const errors: Record<string, string[]> = {};

  // Validate personal info
  if (data.personalInfo) {
    if (!data.personalInfo.firstName?.trim()) {
      errors.firstName = ['First name is required'];
    }
    if (!data.personalInfo.lastName?.trim()) {
      errors.lastName = ['Last name is required'];
    }
    if (data.personalInfo.email && !isValidEmail(data.personalInfo.email)) {
      errors.email = ['Please enter a valid email address'];
    }
  }

  // Validate learning preferences
  if (data.learningPreferences) {
    if (data.learningPreferences.goals && data.learningPreferences.goals.length === 0) {
      errors.goals = ['At least one learning goal is required'];
    }
  }

  // Validate CEFR tracking
  if (data.cefrTracking) {
    const { currentLevel, targetLevel } = data.cefrTracking;
    if (currentLevel && targetLevel) {
      const currentIndex = CEFR_LEVELS.indexOf(currentLevel);
      const targetIndex = CEFR_LEVELS.indexOf(targetLevel);
      if (targetIndex < currentIndex) {
        errors.targetLevel = ['Target level must be equal to or higher than current level'];
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Simple email validation
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Create default profile for new users
 */
export function createDefaultProfile(userId: string): Partial<UserProfile> {
  return {
    userId,
    personalInfo: {
      firstName: '',
      lastName: '',
      email: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    learningPreferences: {
      goals: [],
      studySchedule: {
        preferredDays: ['Monday', 'Wednesday', 'Friday'],
        preferredTime: '18:00',
        sessionDuration: 60,
        frequency: 'weekly',
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      businessContext: '',
      industry: '',
      jobRole: '',
      topics: [],
      learningStyle: 'mixed',
      pace: 'moderate',
      challengeLevel: 'challenging',
      focusAreas: [],
      weakAreas: [],
      motivations: [],
    },
    cefrTracking: {
      currentLevel: 'A1',
      targetLevel: 'B2',
      progressionHistory: [],
      lastUpdated: new Date(),
      assessmentHistory: [],
      skillBreakdown: {
        listening: 'A1',
        reading: 'A1',
        writing: 'A1',
        speaking: 'A1',
      },
    },
    preferences: {
      notifications: {
        email: true,
        inApp: true,
        reminders: true,
        achievements: true,
        progress: true,
        marketing: false,
        weeklyReports: true,
        communityUpdates: false,
      },
      communication: {
        aiPersonality: 'encouraging',
        feedbackFrequency: 'immediate',
        language: 'en',
        complexity: 'moderate',
        conversationStyle: 'conversational',
        errorCorrection: 'immediate',
      },
      accessibility: {
        fontSize: 'medium',
        colorScheme: 'auto',
        screenReader: false,
        highContrast: false,
        reducedMotion: false,
        keyboardNavigation: false,
        audioDescriptions: false,
      },
    },
    privacy: {
      profileVisibility: 'private',
      shareProgress: false,
      shareAchievements: false,
      shareLearningGoals: false,
      dataRetention: '1year',
      analyticsOptOut: false,
      thirdPartySharing: false,
    },
    profileCompletion: {
      score: 0,
      completedSections: [],
      recommendations: [],
      lastUpdated: new Date(),
      milestones: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

// Export utility constants
export {
  CEFR_LEVELS,
  CEFR_SCORES,
};