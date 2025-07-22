/**
 * Workflow Registry and Orchestrator
 * Task 3: Create Automated Learning Path Workflows - Registry & Orchestration
 */

import {
  WorkflowDefinition,
  WorkflowCategory,
  IWorkflowEngine,
  WorkflowContext,
  WorkflowExecution
} from './types';
import { WorkflowEngine } from './WorkflowEngine';
import { LearningPathWorkflow } from './LearningPathWorkflow';
import { AssessmentWorkflow } from './AssessmentWorkflow';
import { SchedulingWorkflow } from './SchedulingWorkflow';
import { logger } from '../logger';

/**
 * Central registry for all workflow definitions and orchestration
 */
export class WorkflowRegistry {
  private static instance: WorkflowRegistry;
  private engine: IWorkflowEngine;
  private learningPathWorkflow: LearningPathWorkflow;
  private assessmentWorkflow: AssessmentWorkflow;
  private schedulingWorkflow: SchedulingWorkflow;
  private initialized: boolean = false;

  constructor(engine?: IWorkflowEngine) {
    this.engine = engine || WorkflowEngine.getInstance();
    this.learningPathWorkflow = LearningPathWorkflow.getInstance();
    this.assessmentWorkflow = AssessmentWorkflow.getInstance();
    this.schedulingWorkflow = SchedulingWorkflow.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): WorkflowRegistry {
    if (!WorkflowRegistry.instance) {
      WorkflowRegistry.instance = new WorkflowRegistry();
    }
    return WorkflowRegistry.instance;
  }

  /**
   * Initialize registry with all workflow definitions
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      logger.info('Initializing workflow registry...');

      // Register all learning path workflows
      const learningPathWorkflows = this.learningPathWorkflow.getAllWorkflows();
      for (const workflow of learningPathWorkflows) {
        await this.engine.registerWorkflow(workflow);
        logger.info(`Registered learning path workflow: ${workflow.id}`);
      }

      // Register all assessment workflows
      const assessmentWorkflows = this.assessmentWorkflow.getAllWorkflows();
      for (const workflow of assessmentWorkflows) {
        await this.engine.registerWorkflow(workflow);
        logger.info(`Registered assessment workflow: ${workflow.id}`);
      }

      // Register all scheduling workflows
      const schedulingWorkflows = this.schedulingWorkflow.getAllWorkflows();
      for (const workflow of schedulingWorkflows) {
        await this.engine.registerWorkflow(workflow);
        logger.info(`Registered scheduling workflow: ${workflow.id}`);
      }

      this.initialized = true;
      logger.info('Workflow registry initialization completed');

    } catch (error) {
      logger.error('Failed to initialize workflow registry:', error);
      throw error;
    }
  }

  /**
   * Get all registered workflows
   */
  public async getAllWorkflows(): Promise<WorkflowDefinition[]> {
    return await this.engine.listWorkflows();
  }

  /**
   * Get workflows by category
   */
  public async getWorkflowsByCategory(category: WorkflowCategory): Promise<WorkflowDefinition[]> {
    return await this.engine.listWorkflows(category);
  }

  /**
   * Get workflow by ID
   */
  public async getWorkflow(workflowId: string): Promise<WorkflowDefinition | null> {
    return await this.engine.getWorkflow(workflowId);
  }

  /**
   * Execute workflow with context
   */
  public async executeWorkflow(
    workflowId: string,
    context: WorkflowContext,
    parameters?: Record<string, any>
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    logger.info(`Executing workflow: ${workflowId} for user: ${context.userId}`);
    
    // Enrich context with execution metadata
    const enrichedContext = {
      ...context,
      workflowExecutionId: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: new Date(),
      lastUpdated: new Date()
    };

    return await this.engine.executeWorkflow(workflowId, enrichedContext, parameters);
  }

  /**
   * Get recommended workflows for context
   */
  public async getRecommendedWorkflows(
    context: WorkflowContext,
    limit: number = 5
  ): Promise<WorkflowDefinition[]> {
    const allWorkflows = await this.getAllWorkflows();
    const recommendations: Array<{ workflow: WorkflowDefinition; score: number }> = [];

    for (const workflow of allWorkflows) {
      const score = await this.calculateWorkflowRecommendationScore(workflow, context);
      if (score > 0) {
        recommendations.push({ workflow, score });
      }
    }

    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(rec => rec.workflow);
  }

  /**
   * Calculate workflow recommendation score
   */
  private async calculateWorkflowRecommendationScore(
    workflow: WorkflowDefinition,
    context: WorkflowContext
  ): Promise<number> {
    let score = 0;

    // Check if workflow has applicable triggers
    for (const trigger of workflow.triggers) {
      if (trigger.type === 'automatic' && trigger.condition) {
        try {
          const shouldTrigger = await trigger.condition(context);
          if (shouldTrigger) {
            score += this.getTriggerPriorityWeight(trigger.priority);
          }
        } catch (error) {
          logger.warn(`Error evaluating trigger condition for ${workflow.id}:`, error);
        }
      } else if (trigger.type === 'manual') {
        score += 0.5; // Base score for manual workflows
      }
    }

    // Consider workflow category relevance
    score += this.getCategoryRelevanceScore(workflow.category, context);

    // Consider user's current level compatibility
    if (this.isLevelCompatible(workflow, context)) {
      score += 1;
    }

    return Math.max(0, Math.min(10, score)); // Normalize to 0-10 scale
  }

  /**
   * Get trigger priority weight
   */
  private getTriggerPriorityWeight(priority: string): number {
    switch (priority) {
      case 'critical': return 3;
      case 'high': return 2;
      case 'medium': return 1;
      case 'low': return 0.5;
      default: return 1;
    }
  }

  /**
   * Get category relevance score based on context
   */
  private getCategoryRelevanceScore(category: WorkflowCategory, context: WorkflowContext): number {
    // This would be implemented based on user context analysis
    // For now, return base scores
    switch (category) {
      case WorkflowCategory.LEARNING_PATH: return 2;
      case WorkflowCategory.ASSESSMENT: return 1.5;
      case WorkflowCategory.SCHEDULING: return 1;
      case WorkflowCategory.ADAPTIVE_DIFFICULTY: return 1.5;
      default: return 0.5;
    }
  }

  /**
   * Check if workflow is compatible with user's level
   */
  private isLevelCompatible(workflow: WorkflowDefinition, context: WorkflowContext): boolean {
    if (!workflow.metadata.requiredLevel || workflow.metadata.requiredLevel.length === 0) {
      return true; // No level requirement
    }

    // This would check user's actual level against workflow requirements
    // For now, assume compatible
    return true;
  }

  /**
   * Get workflow execution status
   */
  public async getExecutionStatus(executionId: string): Promise<WorkflowExecution | null> {
    return await this.engine.getExecutionStatus(executionId);
  }

  /**
   * Get workflow execution history
   */
  public async getExecutionHistory(
    workflowId: string,
    limit?: number
  ): Promise<WorkflowExecution[]> {
    return await this.engine.getExecutionHistory(workflowId, limit);
  }

  /**
   * Pause workflow execution
   */
  public async pauseWorkflow(executionId: string): Promise<void> {
    return await this.engine.pauseWorkflow(executionId);
  }

  /**
   * Resume workflow execution
   */
  public async resumeWorkflow(executionId: string): Promise<void> {
    return await this.engine.resumeWorkflow(executionId);
  }

  /**
   * Cancel workflow execution
   */
  public async cancelWorkflow(executionId: string): Promise<void> {
    return await this.engine.cancelWorkflow(executionId);
  }

  /**
   * Get workflow metrics
   */
  public async getWorkflowMetrics(workflowId: string) {
    return await this.engine.getWorkflowMetrics(workflowId);
  }

  /**
   * Get workflow execution logs
   */
  public async getExecutionLogs(executionId: string, level?: string) {
    return await this.engine.getExecutionLogs(executionId, level);
  }

  /**
   * Create learning path workflow context
   */
  public createLearningPathContext(
    baseContext: Partial<WorkflowContext>,
    learningGoals: string[],
    currentLevel: string,
    targetLevel: string,
    preferences: any
  ): WorkflowContext {
    return {
      userId: baseContext.userId || '',
      sessionId: baseContext.sessionId || '',
      workflowExecutionId: '',
      currentStep: '',
      stepResults: {},
      globalState: {},
      startTime: new Date(),
      lastUpdated: new Date(),
      learningGoals,
      currentLevel,
      targetLevel,
      preferences,
      progressData: {
        completedLessons: [],
        skillScores: {},
        averageAccuracy: 0,
        studyStreak: 0,
        totalStudyTime: 0,
        recentPerformance: [],
        weakAreas: [],
        strongAreas: []
      },
      skillGaps: [],
      recommendationContext: {} as any,
      ...baseContext
    } as any;
  }

  /**
   * Create assessment workflow context
   */
  public createAssessmentContext(
    baseContext: Partial<WorkflowContext>,
    assessmentType: 'diagnostic' | 'formative' | 'summative' | 'adaptive',
    targetSkills: string[],
    timeLimit?: number
  ): WorkflowContext {
    return {
      userId: baseContext.userId || '',
      sessionId: baseContext.sessionId || '',
      workflowExecutionId: '',
      currentStep: '',
      stepResults: {},
      globalState: {},
      startTime: new Date(),
      lastUpdated: new Date(),
      assessmentType,
      targetSkills,
      difficultyRange: {
        min: 'beginner',
        max: 'advanced'
      },
      timeLimit: timeLimit || 30,
      questionCount: assessmentType === 'diagnostic' ? 10 : 25,
      adaptiveSettings: {
        enabled: true,
        minQuestions: 5,
        maxQuestions: 50,
        confidenceThreshold: 0.85,
        difficultyAdjustment: 'immediate',
        terminationCriteria: 'combined'
      },
      ...baseContext
    } as any;
  }

  /**
   * Create scheduling workflow context
   */
  public createSchedulingContext(
    baseContext: Partial<WorkflowContext>,
    schedulingType: 'lesson' | 'assessment' | 'review' | 'practice',
    timeHorizon: number,
    constraints: any,
    preferences: any
  ): WorkflowContext {
    return {
      userId: baseContext.userId || '',
      sessionId: baseContext.sessionId || '',
      workflowExecutionId: '',
      currentStep: '',
      stepResults: {},
      globalState: {},
      startTime: new Date(),
      lastUpdated: new Date(),
      schedulingType,
      timeHorizon,
      constraints,
      preferences,
      existingSchedule: [],
      ...baseContext
    } as any;
  }

  /**
   * Get workflow statistics
   */
  public async getWorkflowStatistics(): Promise<{
    totalWorkflows: number;
    workflowsByCategory: Record<WorkflowCategory, number>;
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
  }> {
    const workflows = await this.getAllWorkflows();
    const stats = {
      totalWorkflows: workflows.length,
      workflowsByCategory: {} as Record<WorkflowCategory, number>,
      totalExecutions: 0,
      successRate: 0,
      averageExecutionTime: 0
    };

    // Count workflows by category
    for (const category of Object.values(WorkflowCategory)) {
      stats.workflowsByCategory[category] = workflows.filter(w => w.category === category).length;
    }

    // Calculate execution statistics
    let totalExecutions = 0;
    let successfulExecutions = 0;
    let totalExecutionTime = 0;

    for (const workflow of workflows) {
      try {
        const metrics = await this.engine.getWorkflowMetrics(workflow.id);
        totalExecutions += metrics.totalExecutions;
        successfulExecutions += Math.round((metrics.successRate / 100) * metrics.totalExecutions);
        totalExecutionTime += metrics.averageExecutionTime * metrics.totalExecutions;
      } catch (error) {
        // Workflow might not have metrics yet
      }
    }

    stats.totalExecutions = totalExecutions;
    stats.successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
    stats.averageExecutionTime = totalExecutions > 0 ? totalExecutionTime / totalExecutions : 0;

    return stats;
  }

  /**
   * Health check for workflow system
   */
  public async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    details: {
      registryInitialized: boolean;
      workflowCount: number;
      engineStatus: string;
      lastError?: string;
    };
  }> {
    try {
      const workflows = await this.getAllWorkflows();
      const workflowCount = workflows.length;

      return {
        status: this.initialized && workflowCount > 0 ? 'healthy' : 'degraded',
        details: {
          registryInitialized: this.initialized,
          workflowCount,
          engineStatus: 'operational'
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          registryInitialized: this.initialized,
          workflowCount: 0,
          engineStatus: 'error',
          lastError: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    logger.info('Cleaning up workflow registry...');
    this.initialized = false;
  }
}

// Export singleton instance
export const workflowRegistry = WorkflowRegistry.getInstance();