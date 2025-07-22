/**
 * Core workflow types and interfaces for automated learning path workflows
 * Task 3: Create Automated Learning Path Workflows
 */

import { RecommendationContext, RecommendationResult } from '../services/recommendation-engine';
import { ActionContext } from '../copilot-actions/types';

// Base workflow types
export interface WorkflowContext extends ActionContext {
  userId: string;
  sessionId: string;
  workflowExecutionId: string;
  currentStep: string;
  stepResults: Record<string, any>;
  globalState: Record<string, any>;
  startTime: Date;
  lastUpdated: Date;
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  type: 'action' | 'decision' | 'parallel' | 'wait' | 'condition';
  action?: string; // Action ID to execute
  parameters?: Record<string, any>;
  dependencies?: string[]; // Step IDs that must complete first
  conditions?: WorkflowCondition[];
  timeout?: number; // milliseconds
  retryPolicy?: RetryPolicy;
  onSuccess?: (result: any, context: WorkflowContext) => Promise<void>;
  onError?: (error: any, context: WorkflowContext) => Promise<void>;
  onSkip?: (context: WorkflowContext) => Promise<void>;
}

export interface WorkflowCondition {
  type: 'context' | 'result' | 'time' | 'custom';
  expression: string; // JavaScript expression or function
  negated?: boolean;
  description?: string;
}

export interface RetryPolicy {
  maxAttempts: number;
  backoffType: 'fixed' | 'exponential' | 'linear';
  initialDelayMs: number;
  maxDelayMs: number;
  retryableErrors?: string[]; // Error codes that can be retried
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  version: string;
  category: WorkflowCategory;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  metadata: WorkflowMetadata;
  configuration: WorkflowConfiguration;
}

export enum WorkflowCategory {
  LEARNING_PATH = 'learning_path',
  ASSESSMENT = 'assessment',
  ADAPTIVE_DIFFICULTY = 'adaptive_difficulty',
  SCHEDULING = 'scheduling',
  CONTENT_GENERATION = 'content_generation',
  PROGRESS_TRACKING = 'progress_tracking',
  SKILL_DEVELOPMENT = 'skill_development',
  PERSONALIZATION = 'personalization'
}

export interface WorkflowTrigger {
  id: string;
  type: 'manual' | 'automatic' | 'scheduled' | 'event' | 'webhook';
  name: string;
  description: string;
  condition?: (context: WorkflowContext) => Promise<boolean>;
  schedule?: CronSchedule; // For scheduled triggers
  event?: EventTrigger; // For event-based triggers
  webhook?: WebhookTrigger; // For webhook triggers
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface CronSchedule {
  expression: string; // Cron expression
  timezone?: string;
  enabled: boolean;
}

export interface EventTrigger {
  eventType: string;
  source: string;
  filters?: Record<string, any>;
}

export interface WebhookTrigger {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  authentication?: 'none' | 'bearer' | 'basic' | 'api-key';
}

export interface WorkflowMetadata {
  created: Date;
  updated: Date;
  version: string;
  author: string;
  tags: string[];
  estimatedDuration: number; // minutes
  requiredLevel: string[]; // CEFR levels
  businessContext?: string;
  learningObjectives: string[];
}

export interface WorkflowConfiguration {
  maxConcurrentSteps: number;
  enableParallelExecution: boolean;
  persistState: boolean;
  enableAuditLog: boolean;
  timeout: number; // milliseconds
  errorHandling: ErrorHandlingStrategy;
  notifications: NotificationSettings;
}

export interface ErrorHandlingStrategy {
  onStepFailure: 'stop' | 'continue' | 'retry' | 'fallback';
  onWorkflowFailure: 'stop' | 'rollback' | 'notify';
  fallbackWorkflow?: string; // Workflow ID to execute on failure
  maxGlobalRetries: number;
}

export interface NotificationSettings {
  onStart: boolean;
  onComplete: boolean;
  onFailure: boolean;
  onStepComplete: boolean;
  recipients: string[];
  channels: ('email' | 'sms' | 'push' | 'webhook')[];
}

// Workflow execution types
export enum WorkflowStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout'
}

export enum StepStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  TIMEOUT = 'timeout'
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowVersion: string;
  status: WorkflowStatus;
  context: WorkflowContext;
  currentStep: string | null;
  stepExecutions: Map<string, StepExecution>;
  results: Record<string, any>;
  errors: WorkflowError[];
  startTime: Date;
  endTime?: Date;
  pauseTime?: Date;
  resumeTime?: Date;
  metadata: ExecutionMetadata;
}

export interface StepExecution {
  id: string;
  stepId: string;
  status: StepStatus;
  result?: any;
  error?: WorkflowError;
  startTime: Date;
  endTime?: Date;
  retryCount: number;
  logs: ExecutionLog[];
}

export interface WorkflowError {
  code: string;
  message: string;
  details: any;
  stepId?: string;
  timestamp: Date;
  recoverable: boolean;
  context?: Record<string, any>;
}

export interface ExecutionLog {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: Date;
  stepId?: string;
  data?: any;
}

export interface ExecutionMetadata {
  triggeredBy: {
    type: 'user' | 'system' | 'schedule' | 'event';
    id?: string;
    name?: string;
  };
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
  environment: 'development' | 'staging' | 'production';
  estimatedCompletionTime?: Date;
  resourcesUsed: {
    cpuTime?: number;
    memoryPeak?: number;
    apiCalls?: number;
    storageBytes?: number;
  };
}

// Workflow state management
export interface WorkflowState {
  workflowId: string;
  executionId: string;
  checkpoint: WorkflowCheckpoint;
  variables: Record<string, any>;
  flags: Record<string, boolean>;
  counters: Record<string, number>;
  timestamps: Record<string, Date>;
  userState: Record<string, any>;
}

export interface WorkflowCheckpoint {
  stepId: string;
  completedSteps: string[];
  stepResults: Record<string, any>;
  globalState: Record<string, any>;
  timestamp: Date;
  version: string;
}

// Learning path specific types
export interface LearningPathWorkflowContext extends WorkflowContext {
  learningGoals: string[];
  currentLevel: string;
  targetLevel: string;
  preferences: UserLearningPreferences;
  progressData: LearningProgressData;
  skillGaps: string[];
  recommendationContext: RecommendationContext;
}

export interface UserLearningPreferences {
  contentTypes: string[];
  difficultyPreference: 'gradual' | 'challenging' | 'adaptive';
  sessionLength: number; // minutes
  timeSlots: TimeSlot[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  motivation: string[];
  avoidTopics: string[];
}

export interface TimeSlot {
  day: string; // Monday, Tuesday, etc.
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  timezone: string;
}

export interface LearningProgressData {
  completedLessons: string[];
  skillScores: Record<string, number>;
  averageAccuracy: number;
  studyStreak: number;
  totalStudyTime: number; // minutes
  recentPerformance: PerformancePoint[];
  weakAreas: string[];
  strongAreas: string[];
}

export interface PerformancePoint {
  timestamp: Date;
  skill: string;
  score: number;
  difficulty: string;
}

// Assessment workflow types
export interface AssessmentWorkflowContext extends WorkflowContext {
  assessmentType: 'diagnostic' | 'formative' | 'summative' | 'adaptive';
  targetSkills: string[];
  difficultyRange: {
    min: string;
    max: string;
  };
  timeLimit?: number; // minutes
  questionCount: number;
  adaptiveSettings: AdaptiveAssessmentSettings;
}

export interface AdaptiveAssessmentSettings {
  enabled: boolean;
  minQuestions: number;
  maxQuestions: number;
  confidenceThreshold: number; // 0-1
  difficultyAdjustment: 'immediate' | 'delayed';
  terminationCriteria: 'confidence' | 'questions' | 'time' | 'combined';
}

// Scheduling workflow types
export interface SchedulingWorkflowContext extends WorkflowContext {
  schedulingType: 'lesson' | 'assessment' | 'review' | 'practice';
  timeHorizon: number; // days
  constraints: SchedulingConstraints;
  preferences: SchedulingPreferences;
  existingSchedule: ScheduledItem[];
}

export interface SchedulingConstraints {
  availableTimeSlots: TimeSlot[];
  minSessionGap: number; // minutes
  maxDailyStudyTime: number; // minutes
  excludeDates: Date[];
  requiredPrerequisites: string[];
}

export interface SchedulingPreferences {
  preferredTimes: TimeSlot[];
  sessionDuration: number; // minutes
  difficulty: 'morning' | 'afternoon' | 'evening' | 'adaptive';
  breakIntervals: number; // minutes
  reminderSettings: ReminderSettings;
}

export interface ScheduledItem {
  id: string;
  type: string;
  title: string;
  startTime: Date;
  endTime: Date;
  priority: 'low' | 'medium' | 'high';
  status: 'scheduled' | 'completed' | 'missed' | 'rescheduled';
}

export interface ReminderSettings {
  enabled: boolean;
  advanceMinutes: number[];
  channels: ('email' | 'push' | 'sms')[];
}

// Workflow engine interfaces
export interface IWorkflowEngine {
  // Workflow management
  registerWorkflow(definition: WorkflowDefinition): Promise<void>;
  unregisterWorkflow(workflowId: string): Promise<void>;
  getWorkflow(workflowId: string): Promise<WorkflowDefinition | null>;
  listWorkflows(category?: WorkflowCategory): Promise<WorkflowDefinition[]>;

  // Execution management
  executeWorkflow(
    workflowId: string,
    context: WorkflowContext,
    parameters?: Record<string, any>
  ): Promise<string>; // Returns execution ID
  
  pauseWorkflow(executionId: string): Promise<void>;
  resumeWorkflow(executionId: string): Promise<void>;
  cancelWorkflow(executionId: string): Promise<void>;
  
  // State management
  getExecutionStatus(executionId: string): Promise<WorkflowExecution | null>;
  getExecutionHistory(
    workflowId: string,
    limit?: number
  ): Promise<WorkflowExecution[]>;
  
  saveCheckpoint(executionId: string): Promise<void>;
  restoreFromCheckpoint(
    executionId: string,
    checkpointId: string
  ): Promise<void>;
  
  // Monitoring and analytics
  getWorkflowMetrics(workflowId: string): Promise<WorkflowMetrics>;
  getExecutionLogs(
    executionId: string,
    level?: string
  ): Promise<ExecutionLog[]>;
}

export interface WorkflowMetrics {
  workflowId: string;
  totalExecutions: number;
  successRate: number;
  averageExecutionTime: number;
  failureRate: number;
  mostFrequentErrors: Array<{
    code: string;
    count: number;
    message: string;
  }>;
  performanceMetrics: {
    p50ExecutionTime: number;
    p95ExecutionTime: number;
    p99ExecutionTime: number;
  };
  resourceUsage: {
    avgCpuTime: number;
    avgMemoryUsage: number;
    avgApiCalls: number;
  };
}

// Workflow builder and validation
export interface IWorkflowBuilder {
  create(name: string, description: string): IWorkflowBuilder;
  setCategory(category: WorkflowCategory): IWorkflowBuilder;
  addStep(step: WorkflowStep): IWorkflowBuilder;
  addTrigger(trigger: WorkflowTrigger): IWorkflowBuilder;
  setConfiguration(config: Partial<WorkflowConfiguration>): IWorkflowBuilder;
  setMetadata(metadata: Partial<WorkflowMetadata>): IWorkflowBuilder;
  validate(): ValidationResult;
  build(): WorkflowDefinition;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  code: string;
  message: string;
  field?: string;
  suggestion?: string;
}

export default {
  WorkflowCategory,
  WorkflowStatus,
  StepStatus
};