// Content generation and curation type definitions

export interface ContentGenerationContext {
  userId: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  businessDomain: string;
  companySOPs?: string[];
  learningGoals: string[];
  weakAreas: string[];
  strongAreas: string[];
  preferredTopics: string[];
  sessionHistory: {
    completedTopics: string[];
    strugglingAreas: string[];
    preferredContentTypes: ContentType[];
  };
  progressMetrics: {
    averageScore: number;
    completionRate: number;
    engagementLevel: 'low' | 'medium' | 'high';
    learningSpeed: 'slow' | 'normal' | 'fast';
  };
}

export type ContentType = 
  | 'lesson'
  | 'exercise' 
  | 'quiz'
  | 'vocabulary'
  | 'dialogue'
  | 'reading'
  | 'listening'
  | 'writing'
  | 'speaking'
  | 'grammar'
  | 'business-case'
  | 'roleplay';

export type DifficultyLevel = 'beginner' | 'elementary' | 'intermediate' | 'upper-intermediate' | 'advanced' | 'proficient';

export interface GeneratedContent {
  id: string;
  type: ContentType;
  title: string;
  description: string;
  content: ContentSection[];
  metadata: ContentMetadata;
  aiGenerated: true;
  generationTimestamp: Date;
  version: string;
}

export interface ContentSection {
  id: string;
  type: 'text' | 'exercise' | 'question' | 'example' | 'dialogue' | 'vocabulary' | 'grammar-rule';
  title?: string;
  content: string;
  instructions?: string;
  examples?: string[];
  exercises?: Exercise[];
  vocabularyItems?: VocabularyItem[];
}

export interface Exercise {
  id: string;
  type: 'multiple-choice' | 'fill-blank' | 'matching' | 'ordering' | 'true-false' | 'short-answer' | 'essay';
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  hints?: string[];
  points: number;
  difficulty: DifficultyLevel;
}

export interface VocabularyItem {
  word: string;
  pronunciation?: string;
  definition: string;
  examples: string[];
  businessContext?: string;
  difficulty: DifficultyLevel;
  frequency: 'high' | 'medium' | 'low';
  relatedWords?: string[];
}

export interface ContentMetadata {
  cefrLevel: string;
  estimatedDuration: number; // minutes
  difficulty: DifficultyLevel;
  topics: string[];
  skills: string[]; // reading, writing, speaking, listening
  businessRelevance: number; // 0-1 score
  sopIntegration: boolean;
  generationSource: 'ai-original' | 'sop-based' | 'adaptive' | 'curated';
  qualityScore: number; // 0-1 score
  engagementPrediction: number; // 0-1 score
}

export interface ContentGenerationRequest {
  context: ContentGenerationContext;
  type: ContentType;
  specifications: {
    duration?: number;
    difficulty?: DifficultyLevel;
    topics?: string[];
    includeSOPs?: boolean;
    customInstructions?: string;
    contentFormat?: 'structured' | 'conversational' | 'practical' | 'academic';
  };
  constraints?: {
    maxSections?: number;
    minExercises?: number;
    vocabularyTarget?: number;
    businessFocus?: number; // 0-1, how business-focused should content be
  };
}

export interface ContentGenerationResult {
  success: boolean;
  content?: GeneratedContent;
  error?: string;
  alternatives?: GeneratedContent[];
  generationMetrics: {
    processingTime: number;
    tokensUsed: number;
    qualityScore: number;
    confidenceLevel: number;
  };
}

// Content curation types
export interface ContentRecommendation {
  content: GeneratedContent;
  relevanceScore: number; // 0-1
  reasoning: string;
  adaptationSuggestions?: string[];
  nextRecommendations?: string[];
}

export interface CurationCriteria {
  learningObjectives: string[];
  timeConstraints?: number;
  preferredTypes?: ContentType[];
  avoidTopics?: string[];
  reinforceWeakAreas?: boolean;
  challengeLevel?: 'maintain' | 'increase' | 'decrease';
}

export interface ContentLibrary {
  id: string;
  name: string;
  description: string;
  contents: GeneratedContent[];
  metadata: {
    totalItems: number;
    averageRating: number;
    createdDate: Date;
    lastUpdated: Date;
    tags: string[];
  };
}

// Template system
export interface ContentTemplate {
  id: string;
  name: string;
  type: ContentType;
  structure: TemplateSection[];
  variables: TemplateVariable[];
  constraints: TemplateConstraints;
}

export interface TemplateSection {
  id: string;
  name: string;
  type: string;
  required: boolean;
  placeholder?: string;
  validationRules?: string[];
}

export interface TemplateVariable {
  name: string;
  type: 'string' | 'number' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  description: string;
}

export interface TemplateConstraints {
  minSections?: number;
  maxSections?: number;
  requiredSections?: string[];
  allowedTypes?: ContentType[];
}

// AI generation configuration
export interface AIGenerationConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  presencePenalty: number;
  frequencyPenalty: number;
  systemPrompts: {
    base: string;
    lessonGeneration: string;
    quizGeneration: string;
    vocabularyGeneration: string;
    businessContextIntegration: string;
  };
}

// Content quality assessment
export interface QualityMetrics {
  grammarScore: number; // 0-1
  relevanceScore: number; // 0-1
  engagementScore: number; // 0-1
  difficultyAppropriate: number; // 0-1
  sopIntegration: number; // 0-1
  overallQuality: number; // 0-1
  improvements: string[];
}

// Analytics and tracking
export interface ContentAnalytics {
  contentId: string;
  views: number;
  completions: number;
  averageTime: number;
  userRatings: number[];
  difficultyFeedback: ('too_easy' | 'just_right' | 'too_hard')[];
  engagementMetrics: {
    clickThrough: number;
    timeOnContent: number;
    exerciseCompletion: number;
  };
}

// Additional type definitions for fixing 'any' types
export interface ContentSpecs {
  duration?: number;
  difficulty?: DifficultyLevel;
  topics?: string[];
  includeSOPs?: boolean;
  customInstructions?: string;
  contentFormat?: 'structured' | 'conversational' | 'practical' | 'academic';
  exerciseCount?: number;
  vocabularyCount?: number;
  focusAreas?: string[];
}

export interface AssessmentQuestion {
  id: string;
  type: 'multiple-choice' | 'fill-blank' | 'matching' | 'true-false' | 'short-answer';
  question: string;
  options?: string[];
  correctAnswer: string | string[] | boolean;
  explanation: string;
  difficulty: DifficultyLevel;
  points: number;
  adaptiveState?: AdaptiveState;
}

export interface AdaptiveState {
  difficultyLevel: number;
  confidenceScore: number;
  responseTime: number;
  attemptCount: number;
  hintUsed: boolean;
}

export interface AssessmentResult {
  questionId: string;
  userAnswer: string | string[] | boolean;
  correctAnswer: string | string[] | boolean;
  isCorrect: boolean;
  score: number;
  timeSpent: number;
  hintsUsed: number;
}

export interface SystemDailyStats {
  date: string;
  totalUsers: number;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  averageResponseTime: number;
  errorRate: number;
  topFeatures: string[];
}

export interface AIError {
  type: 'rate_limit' | 'quota_exceeded' | 'invalid_request' | 'model_error' | 'network_error' | 'unknown';
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  retryable: boolean;
  fallbackAvailable: boolean;
  timestamp: Date;
}

export interface AISettings {
  model: string;
  temperature: number;
  maxTokens: number;
  timeout: number;
  retryAttempts: number;
  fallbackModel?: string;
}

// AI Response structures
export interface StructuredAIResponse {
  title?: string;
  description?: string;
  sections?: {
    type: 'text' | 'exercise' | 'question' | 'example' | 'dialogue' | 'vocabulary' | 'grammar-rule';
    title?: string;
    content: string;
    instructions?: string;
    examples?: string[];
    exercises?: any[];
    vocabularyItems?: any[];
  }[];
  questions?: any[];
  vocabulary?: any[];
  dialogue?: {
    participants: string[];
    exchanges: { speaker: string; text: string }[];
  };
  businessContext?: string;
  metadata?: {
    difficulty: string;
    duration: number;
    objectives: string[];
  };
}

export interface CEFRDifficultyMapping {
  vocabulary: 'basic' | 'intermediate' | 'advanced' | 'expert';
  grammar: 'simple' | 'standard' | 'complex' | 'sophisticated';
  concepts: 'concrete' | 'abstract' | 'analytical' | 'theoretical';
  businessComplexity: 'routine' | 'standard' | 'complex' | 'strategic';
}