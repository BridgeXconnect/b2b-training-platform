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
  | 'roleplay'
  | 'video'
  | 'audio'
  | 'interactive'
  | 'simulation'
  | 'ar-vr'
  | 'multimedia';

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
  type: 'text' | 'exercise' | 'question' | 'example' | 'dialogue' | 'vocabulary' | 'grammar-rule' | 'video' | 'audio' | 'interactive' | 'simulation' | 'ar-vr' | 'multimedia';
  title?: string;
  content: string;
  instructions?: string;
  examples?: string[];
  exercises?: Exercise[];
  vocabularyItems?: VocabularyItem[];
  mediaContent?: MediaContent;
  interactiveElements?: InteractiveElement[];
  accessibility?: AccessibilityFeatures;
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
  businessDomain?: string; // Added to support business context
  estimatedDuration: number; // minutes
  difficulty: DifficultyLevel;
  topics: string[];
  skills: string[]; // reading, writing, speaking, listening
  businessRelevance: number; // 0-1 score
  sopIntegration: boolean;
  generationSource: 'ai-original' | 'sop-based' | 'adaptive' | 'curated';
  qualityScore: number; // 0-1 score
  engagementPrediction: number; // 0-1 score
  tokensUsed?: number; // Added to track AI usage
  model?: string; // Added to track AI model used
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
  // Add missing properties that code expects
  topic?: string; // For backward compatibility
  type?: string; // For assessment type
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
  uniqueUsers: number;
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
    type: 'text' | 'exercise' | 'question' | 'example' | 'dialogue' | 'vocabulary' | 'grammar-rule' | 'video' | 'audio' | 'interactive' | 'simulation' | 'ar-vr' | 'multimedia';
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

// Multi-modal content type definitions
export interface MediaContent {
  id: string;
  type: 'video' | 'audio' | 'image' | 'document' | '3d-model' | 'ar-scene' | 'vr-scene';
  url: string;
  thumbnailUrl?: string;
  duration?: number; // in seconds
  fileSize: number; // in bytes
  format: string; // mp4, mp3, jpg, etc.
  quality: 'low' | 'medium' | 'high' | '4k';
  metadata: MediaMetadata;
  transcription?: string;
  captions?: Caption[];
  chapters?: Chapter[];
  interactions?: MediaInteraction[];
}

export interface MediaMetadata {
  title: string;
  description?: string;
  author?: string;
  creationDate: Date;
  tags: string[];
  cefrLevel: string;
  businessContext?: string;
  skillsTargeted: string[];
  language: string;
  difficulty: DifficultyLevel;
  contentWarnings?: string[];
}

export interface Caption {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  language: string;
  type: 'subtitle' | 'description' | 'dialogue' | 'narration';
}

export interface Chapter {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  description?: string;
  keywords: string[];
  objectives: string[];
}

export interface MediaInteraction {
  id: string;
  timestamp: number;
  type: 'quiz' | 'note' | 'bookmark' | 'exercise' | 'discussion';
  content: any;
  required: boolean;
}

export interface InteractiveElement {
  id: string;
  type: 'drag-drop' | 'click-hotspot' | 'slider' | 'timeline' | 'simulation' | 'virtual-lab' | 'game' | 'ar-overlay' | 'vr-scene';
  title: string;
  description: string;
  configuration: InteractiveConfig;
  objectives: string[];
  feedback: FeedbackConfig;
  scoring?: ScoringConfig;
  accessibility: AccessibilityFeatures;
}

export interface InteractiveConfig {
  elements: InteractiveComponent[];
  rules: InteractionRule[];
  layout: LayoutConfig;
  assets: AssetReference[];
  settings: InteractiveSettings;
}

export interface InteractiveComponent {
  id: string;
  type: string;
  position: { x: number; y: number; z?: number };
  properties: Record<string, any>;
  behaviors: Behavior[];
}

export interface InteractionRule {
  id: string;
  trigger: string;
  conditions: Condition[];
  actions: Action[];
  feedback?: string;
}

export interface Condition {
  type: string;
  parameter: string;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'in_range';
  value: any;
}

export interface Action {
  type: 'show' | 'hide' | 'move' | 'animate' | 'play_audio' | 'show_feedback' | 'increment_score';
  target: string;
  parameters: Record<string, any>;
}

export interface Behavior {
  type: 'draggable' | 'clickable' | 'hoverable' | 'animated' | 'physics';
  properties: Record<string, any>;
}

export interface LayoutConfig {
  type: 'grid' | 'free' | 'timeline' | '3d-space';
  dimensions: { width: number; height: number; depth?: number };
  responsive: boolean;
  constraints?: LayoutConstraint[];
}

export interface LayoutConstraint {
  type: 'alignment' | 'spacing' | 'boundary';
  parameters: Record<string, any>;
}

export interface AssetReference {
  id: string;
  type: 'image' | 'audio' | 'video' | '3d-model' | 'texture';
  url: string;
  fallbackUrl?: string;
  preload: boolean;
}

export interface InteractiveSettings {
  autoProgress: boolean;
  timeLimit?: number;
  attempts: number;
  hintSystem: boolean;
  progressSaving: boolean;
  multiUser: boolean;
}

export interface FeedbackConfig {
  immediate: boolean;
  types: FeedbackType[];
  customMessages: Record<string, string>;
  animations: boolean;
  audio: boolean;
}

export interface FeedbackType {
  trigger: 'correct' | 'incorrect' | 'hint' | 'completion' | 'progress';
  message: string;
  style: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

export interface ScoringConfig {
  maxScore: number;
  passingScore: number;
  bonusPoints?: BonusPoint[];
  penalties?: Penalty[];
  algorithm: 'simple' | 'weighted' | 'adaptive';
}

export interface BonusPoint {
  condition: string;
  points: number;
  description: string;
}

export interface Penalty {
  condition: string;
  points: number;
  description: string;
}

export interface AccessibilityFeatures {
  screenReader: boolean;
  keyboardNavigation: boolean;
  highContrast: boolean;
  audioDescriptions: boolean;
  closedCaptions: boolean;
  signLanguage: boolean;
  reducedMotion: boolean;
  fontSize: 'adjustable' | 'fixed';
  colorBlindSupport: boolean;
  alternativeText: string[];
  voiceOver: VoiceOverConfig;
}

export interface VoiceOverConfig {
  enabled: boolean;
  language: string;
  speed: 'slow' | 'normal' | 'fast';
  voice: 'male' | 'female' | 'neutral';
  descriptions: string[];
}

// AR/VR specific types
export interface ARVRContent {
  id: string;
  type: 'ar' | 'vr' | 'mixed-reality';
  title: string;
  description: string;
  scenes: ARVRScene[];
  interactions: ARVRInteraction[];
  requirements: TechnicalRequirements;
  learning_objectives: string[];
}

export interface ARVRScene {
  id: string;
  name: string;
  type: '3d-environment' | 'overlay' | 'immersive' | 'semi-immersive';
  assets: ThreeDAsset[];
  lighting: LightingConfig;
  physics: PhysicsConfig;
  navigation: NavigationConfig;
}

export interface ThreeDAsset {
  id: string;
  type: 'model' | 'texture' | 'animation' | 'audio' | 'particle';
  url: string;
  format: string;
  position: { x: number; y: number; z: number };
  rotation: { x: number; y: number; z: number };
  scale: { x: number; y: number; z: number };
  properties: Record<string, any>;
}

export interface LightingConfig {
  ambient: { color: string; intensity: number };
  directional: Array<{ direction: number[]; color: string; intensity: number }>;
  point: Array<{ position: number[]; color: string; intensity: number; range: number }>;
}

export interface PhysicsConfig {
  enabled: boolean;
  gravity: { x: number; y: number; z: number };
  collisionDetection: boolean;
  rigidBodies: RigidBodyConfig[];
}

export interface RigidBodyConfig {
  assetId: string;
  type: 'static' | 'dynamic' | 'kinematic';
  mass: number;
  friction: number;
  restitution: number;
}

export interface NavigationConfig {
  type: 'teleport' | 'smooth' | 'room-scale' | 'seated';
  boundaries?: Boundary[];
  safetyZone: boolean;
}

export interface Boundary {
  points: Array<{ x: number; z: number }>;
  height: number;
}

export interface ARVRInteraction {
  id: string;
  type: 'gaze' | 'tap' | 'gesture' | 'voice' | 'controller' | 'hand-tracking';
  trigger: string;
  target: string;
  action: string;
  feedback: ARVRFeedback;
}

export interface ARVRFeedback {
  visual: boolean;
  haptic: boolean;
  audio: boolean;
  description: string;
}

export interface TechnicalRequirements {
  platform: string[];
  minRam: number;
  minStorage: number;
  sensors: string[];
  permissions: string[];
  networkRequired: boolean;
}

// Simulation types
export interface Simulation {
  id: string;
  title: string;
  type: 'business-scenario' | 'language-immersion' | 'role-play' | 'problem-solving' | 'skill-practice';
  scenario: SimulationScenario;
  participants: Participant[];
  progression: ProgressionConfig;
  assessment: SimulationAssessment;
}

export interface SimulationScenario {
  context: string;
  setting: string;
  objectives: string[];
  constraints: string[];
  variables: SimulationVariable[];
  timeline: TimelineEvent[];
}

export interface SimulationVariable {
  id: string;
  name: string;
  type: 'user-controlled' | 'system-controlled' | 'random';
  initialValue: any;
  range?: { min: any; max: any };
  impact: string;
}

export interface TimelineEvent {
  time: number;
  event: string;
  description: string;
  triggers: EventTrigger[];
}

export interface EventTrigger {
  condition: string;
  action: string;
  probability?: number;
}

export interface Participant {
  id: string;
  role: string;
  characteristics: string[];
  behaviors: ParticipantBehavior[];
  responses: ResponsePattern[];
}

export interface ParticipantBehavior {
  situation: string;
  response_type: 'supportive' | 'challenging' | 'neutral' | 'adaptive';
  triggers: string[];
  outcomes: string[];
}

export interface ResponsePattern {
  input: string;
  response: string;
  tone: 'formal' | 'casual' | 'professional' | 'friendly';
  follow_up?: string[];
}

export interface ProgressionConfig {
  stages: SimulationStage[];
  branching: boolean;
  adaptivity: boolean;
  completion_criteria: string[];
}

export interface SimulationStage {
  id: string;
  name: string;
  description: string;
  duration: number;
  objectives: string[];
  success_criteria: string[];
  failure_conditions: string[];
}

export interface SimulationAssessment {
  criteria: AssessmentCriterion[];
  scoring: ScoringMethod;
  feedback: SimulationFeedback;
  certification?: CertificationConfig;
}

export interface AssessmentCriterion {
  id: string;
  name: string;
  weight: number;
  measurement: 'automatic' | 'peer' | 'self' | 'ai-evaluated';
  rubric: RubricLevel[];
}

export interface RubricLevel {
  level: number;
  description: string;
  indicators: string[];
  score: number;
}

export interface ScoringMethod {
  type: 'weighted_average' | 'holistic' | 'adaptive' | 'peer_comparative';
  parameters: Record<string, any>;
}

export interface SimulationFeedback {
  immediate: boolean;
  detailed: boolean;
  peer_feedback: boolean;
  ai_coaching: boolean;
  improvement_suggestions: boolean;
}

export interface CertificationConfig {
  available: boolean;
  requirements: string[];
  validity_period: number;
  renewal_process: string;
}