/**
 * Core TypeScript interfaces for CopilotKit Action Framework
 * Following Winston's BaseAction/AdvancedAction architecture
 */

import { z } from 'zod';

/**
 * Base parameter definition for actions
 */
export interface ActionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'string[]' | 'number[]';
  description: string;
  required: boolean;
  validation?: z.ZodType<any>;
  default?: any;
}

/**
 * Action context provided to all handlers
 */
export interface ActionContext {
  userId?: string;
  sessionId: string;
  timestamp: Date;
  metadata: Record<string, any>;
  learningContext?: LearningContext;
}

/**
 * Learning context for personalized actions
 */
export interface LearningContext {
  userId: string;
  currentCEFRLevel: string;
  progressData: {
    completedLessons: number;
    totalLessons: number;
    weeklyGoal: number;
    currentStreak: number;
  };
  assessmentHistory: {
    averageScore: number;
    weakAreas: string[];
    strongAreas: string[];
    lastAssessment: Date;
  };
  preferences: {
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
    studyTime: 'morning' | 'afternoon' | 'evening' | 'flexible';
    difficulty: 'adaptive' | 'challenging' | 'comfortable';
  };
  currentSession: {
    timeSpent: number;
    topicsStudied: string[];
    actionsPerformed: string[];
  };
}

/**
 * Action execution result
 */
export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: ActionError;
  metadata?: {
    executionTime: number;
    tokensUsed?: number;
    confidence?: number;
  };
}

/**
 * Action error structure
 */
export interface ActionError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
  recoverable: boolean;
}

/**
 * Base action interface
 */
export interface BaseAction {
  id: string;
  name: string;
  description: string;
  category: ActionCategory;
  parameters: ActionParameter[];
  
  // Core methods
  validate(params: any): Promise<boolean>;
  execute(params: any, context: ActionContext): Promise<ActionResult>;
  
  // Optional hooks
  beforeExecute?(params: any, context: ActionContext): Promise<void>;
  afterExecute?(result: ActionResult, context: ActionContext): Promise<void>;
  onError?(error: ActionError, context: ActionContext): Promise<void>;
}

/**
 * Advanced action interface with additional capabilities
 */
export interface AdvancedAction extends BaseAction {
  // Advanced features
  priority: number;
  rateLimit?: {
    maxCallsPerMinute: number;
    maxCallsPerHour: number;
  };
  
  // Context awareness
  isAvailable(context: ActionContext): Promise<boolean>;
  getRecommendationScore(context: ActionContext): Promise<number>;
  
  // Monitoring and analytics
  metrics: ActionMetrics;
  
  // Chain and compose actions
  chainWith?: string[]; // IDs of actions that can be chained
  composeWith?: string[]; // IDs of actions that can be composed
  
  // Advanced error handling
  retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
    retryableErrors: string[];
  };
}

/**
 * Action category enumeration
 */
export enum ActionCategory {
  LESSON_CREATION = 'lesson_creation',
  ASSESSMENT = 'assessment',
  PROGRESS_ANALYSIS = 'progress_analysis',
  CONTENT_GENERATION = 'content_generation',
  STUDY_PLANNING = 'study_planning',
  FEEDBACK = 'feedback',
  GAMIFICATION = 'gamification',
  SOCIAL_LEARNING = 'social_learning',
  ADMINISTRATIVE = 'administrative'
}

/**
 * Action metrics for monitoring
 */
export interface ActionMetrics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  lastExecutionTime?: Date;
  errorRate: number;
  userSatisfactionScore?: number;
}

/**
 * Action registry interface
 */
export interface IActionRegistry {
  register(action: BaseAction | AdvancedAction): void;
  unregister(actionId: string): void;
  get(actionId: string): BaseAction | AdvancedAction | undefined;
  getAll(): (BaseAction | AdvancedAction)[];
  getByCategory(category: ActionCategory): (BaseAction | AdvancedAction)[];
  getAvailable(context: ActionContext): Promise<(BaseAction | AdvancedAction)[]>;
  getRecommended(context: ActionContext, limit?: number): Promise<AdvancedAction[]>;
}

/**
 * Action handler type
 */
export type ActionHandler<TParams = any, TResult = any> = (
  params: TParams,
  context: ActionContext
) => Promise<ActionResult<TResult>>;

/**
 * Action validator type
 */
export type ActionValidator<TParams = any> = (
  params: TParams
) => Promise<boolean>;

/**
 * Action monitoring event
 */
export interface ActionMonitoringEvent {
  actionId: string;
  actionName: string;
  eventType: 'start' | 'success' | 'failure' | 'validation_error' | 'rate_limit_hit' | 'performance_warning' | 'retry_attempt';
  timestamp: Date;
  context: ActionContext;
  duration?: number;
  error?: ActionError;
  params?: any;
  result?: any;
}

/**
 * Action monitor interface
 */
export interface IActionMonitor {
  track(event: ActionMonitoringEvent): void;
  getMetrics(actionId: string): ActionMetrics;
  getGlobalMetrics(): {
    totalActions: number;
    totalExecutions: number;
    averageSuccessRate: number;
    topActions: { actionId: string; executions: number }[];
  };
}