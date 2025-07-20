// User Profile and Preferences Type Definitions
// Story 4.4: User Profile & Preferences

import { User } from '../api-client';

// CEFR Levels type for consistency
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// Learning style preferences
export type LearningStyle = 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
export type LearningPace = 'slow' | 'moderate' | 'fast';
export type ChallengeLevel = 'comfortable' | 'challenging' | 'very-challenging';

// AI interaction preferences
export type AIPersonality = 'formal' | 'casual' | 'encouraging' | 'challenging';
export type FeedbackFrequency = 'immediate' | 'daily' | 'weekly';

// UI preferences
export type FontSize = 'small' | 'medium' | 'large';
export type ColorScheme = 'light' | 'dark' | 'auto';
export type ProfileVisibility = 'public' | 'private' | 'friends';
export type DataRetention = '30days' | '90days' | '1year' | 'indefinite';

// CEFR progression tracking
export interface CEFRProgressionEntry {
  level: CEFRLevel;
  achievedAt: Date;
  method: 'assessment' | 'manual' | 'auto';
  score?: number;
  notes?: string;
}

// Study schedule preferences
export interface StudySchedule {
  preferredDays: string[];
  preferredTime: string;
  sessionDuration: number; // minutes
  frequency: 'daily' | 'weekly' | 'bi-weekly';
  timeZone: string;
}

// Personal information
export interface PersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  avatar?: string;
  bio?: string;
  location?: string;
  timezone: string;
  phoneNumber?: string;
  dateOfBirth?: Date;
  gender?: string;
}

// Learning preferences
export interface LearningPreferences {
  goals: string[];
  studySchedule: StudySchedule;
  businessContext: string;
  industry: string;
  jobRole: string;
  topics: string[];
  learningStyle: LearningStyle;
  pace: LearningPace;
  challengeLevel: ChallengeLevel;
  focusAreas: string[];
  weakAreas: string[];
  motivations: string[];
}

// CEFR tracking information
export interface CEFRTracking {
  currentLevel: CEFRLevel;
  targetLevel: CEFRLevel;
  progressionHistory: CEFRProgressionEntry[];
  lastUpdated: Date;
  assessmentHistory: Array<{
    assessmentId: string;
    level: CEFRLevel;
    score: number;
    completedAt: Date;
  }>;
  skillBreakdown: {
    listening: CEFRLevel;
    reading: CEFRLevel;
    writing: CEFRLevel;
    speaking: CEFRLevel;
  };
}

// Notification preferences
export interface NotificationPreferences {
  email: boolean;
  inApp: boolean;
  reminders: boolean;
  achievements: boolean;
  progress: boolean;
  marketing: boolean;
  weeklyReports: boolean;
  communityUpdates: boolean;
}

// Communication preferences
export interface CommunicationPreferences {
  aiPersonality: AIPersonality;
  feedbackFrequency: FeedbackFrequency;
  language: string;
  complexity: 'simple' | 'moderate' | 'advanced';
  conversationStyle: 'structured' | 'conversational' | 'gamified';
  errorCorrection: 'immediate' | 'after-completion' | 'minimal';
}

// Accessibility preferences
export interface AccessibilityPreferences {
  fontSize: FontSize;
  colorScheme: ColorScheme;
  screenReader: boolean;
  highContrast: boolean;
  reducedMotion: boolean;
  keyboardNavigation: boolean;
  audioDescriptions: boolean;
}

// Privacy settings
export interface PrivacySettings {
  profileVisibility: ProfileVisibility;
  shareProgress: boolean;
  shareAchievements: boolean;
  shareLearningGoals: boolean;
  dataRetention: DataRetention;
  analyticsOptOut: boolean;
  thirdPartySharing: boolean;
}

// Profile completion tracking
export interface ProfileCompletion {
  score: number; // 0-100
  completedSections: string[];
  recommendations: string[];
  lastUpdated: Date;
  milestones: Array<{
    name: string;
    achievedAt: Date;
    description: string;
  }>;
}

// Main UserProfile interface
export interface UserProfile {
  id: string;
  userId: string;
  personalInfo: PersonalInfo;
  learningPreferences: LearningPreferences;
  cefrTracking: CEFRTracking;
  preferences: {
    notifications: NotificationPreferences;
    communication: CommunicationPreferences;
    accessibility: AccessibilityPreferences;
  };
  privacy: PrivacySettings;
  profileCompletion: ProfileCompletion;
  createdAt: Date;
  updatedAt: Date;
}

// Extended User type that includes profile
export interface ExtendedUser extends User {
  profile?: UserProfile;
  isProfileComplete: boolean;
  completionScore: number;
}

// Profile form data types (for form handling)
export interface ProfileFormData {
  personalInfo: Partial<PersonalInfo>;
  learningPreferences: Partial<LearningPreferences>;
  cefrTracking: Partial<CEFRTracking>;
  preferences: {
    notifications: Partial<NotificationPreferences>;
    communication: Partial<CommunicationPreferences>;
    accessibility: Partial<AccessibilityPreferences>;
  };
  privacy: Partial<PrivacySettings>;
}

// Profile update requests
export interface ProfileUpdateRequest {
  section: 'personalInfo' | 'learningPreferences' | 'cefrTracking' | 'preferences' | 'privacy';
  data: Partial<UserProfile>;
}

// Profile completion section
export interface ProfileSection {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  weight: number; // for completion calculation
  requiredFields: string[];
  optionalFields: string[];
}

// Re-export User type from api-client for convenience
export type { User } from '../api-client';