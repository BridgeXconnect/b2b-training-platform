/**
 * Advanced Workflow Engine Implementation
 * Task 3: Create Automated Learning Path Workflows - Core Engine
 */

import {
  IWorkflowEngine,
  WorkflowDefinition,
  WorkflowExecution,
  WorkflowContext,
  WorkflowStatus,
  StepStatus,
  WorkflowError,
  ExecutionLog,
  StepExecution,
  WorkflowMetrics,
  WorkflowCategory,
  WorkflowCheckpoint,
  ExecutionMetadata
} from './types';
import { ActionRegistry } from '../copilot-actions/core/ActionRegistry';
import { logger } from '../logger';

/**
 * Advanced workflow engine with state persistence and monitoring
 */
export class WorkflowEngine implements IWorkflowEngine {
  private static instance: WorkflowEngine;
  private workflows: Map<string, WorkflowDefinition> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private actionRegistry: ActionRegistry;
  
  // State persistence (in production, this would be a database)
  private persistentStorage: Map<string, any> = new Map();
  private metrics: Map<string, WorkflowMetrics> = new Map();

  constructor(actionRegistry?: ActionRegistry) {
    this.actionRegistry = actionRegistry || ActionRegistry.getInstance();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  /**
   * Register a workflow definition
   */
  async registerWorkflow(definition: WorkflowDefinition): Promise<void> {
    // Validate workflow definition
    const validation = this.validateWorkflow(definition);
    if (!validation.valid) {
      throw new Error(`Invalid workflow definition: ${validation.errors.map(e => e.message).join(', ')}`);
    }

    this.workflows.set(definition.id, definition);
    
    // Initialize metrics
    if (!this.metrics.has(definition.id)) {
      this.metrics.set(definition.id, {
        workflowId: definition.id,
        totalExecutions: 0,
        successRate: 0,
        averageExecutionTime: 0,
        failureRate: 0,
        mostFrequentErrors: [],
        performanceMetrics: {
          p50ExecutionTime: 0,
          p95ExecutionTime: 0,
          p99ExecutionTime: 0
        },
        resourceUsage: {
          avgCpuTime: 0,
          avgMemoryUsage: 0,
          avgApiCalls: 0
        }
      });
    }

    logger.info(`Workflow registered: ${definition.id} (${definition.name})`);
  }

  /**
   * Unregister a workflow
   */
  async unregisterWorkflow(workflowId: string): Promise<void> {
    // Check for active executions
    const activeExecutions = Array.from(this.executions.values())
      .filter(exec => exec.workflowId === workflowId && 
        [WorkflowStatus.RUNNING, WorkflowStatus.PAUSED].includes(exec.status));

    if (activeExecutions.length > 0) {
      throw new Error(`Cannot unregister workflow ${workflowId}: ${activeExecutions.length} active executions`);
    }

    this.workflows.delete(workflowId);
    logger.info(`Workflow unregistered: ${workflowId}`);
  }

  /**
   * Get workflow definition
   */
  async getWorkflow(workflowId: string): Promise<WorkflowDefinition | null> {
    return this.workflows.get(workflowId) || null;
  }

  /**
   * List workflows by category
   */
  async listWorkflows(category?: WorkflowCategory): Promise<WorkflowDefinition[]> {
    const workflows = Array.from(this.workflows.values());
    
    if (category) {
      return workflows.filter(workflow => workflow.category === category);
    }
    
    return workflows;
  }

  /**
   * Execute a workflow
   */
  async executeWorkflow(
    workflowId: string,
    context: WorkflowContext,
    parameters: Record<string, any> = {}
  ): Promise<string> {
    const workflow = await this.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${workflowId}`);
    }

    const executionId = this.generateExecutionId();
    const startTime = new Date();

    // Create execution context
    const execution: WorkflowExecution = {
      id: executionId,
      workflowId,
      workflowVersion: workflow.version,
      status: WorkflowStatus.RUNNING,
      context: {
        ...context,
        workflowExecutionId: executionId,
        stepResults: {},
        globalState: parameters,
        startTime,
        lastUpdated: startTime
      },
      currentStep: null,
      stepExecutions: new Map(),
      results: {},
      errors: [],
      startTime,
      metadata: {
        triggeredBy: {
          type: 'user',
          id: context.userId
        },
        priority: 'medium',
        tags: workflow.metadata.tags,
        environment: process.env.NODE_ENV as any || 'development',
        resourcesUsed: {
          cpuTime: 0,
          memoryPeak: 0,
          apiCalls: 0,
          storageBytes: 0
        }
      }
    };

    this.executions.set(executionId, execution);
    
    // Log execution start
    this.addExecutionLog(execution, 'info', `Workflow execution started: ${workflow.name}`, {
      workflowId,
      parameters
    });

    // Start execution in background
    this.executeWorkflowSteps(execution, workflow).catch(error => {
      this.handleWorkflowError(execution, error);
    });

    return executionId;
  }

  /**
   * Execute workflow steps
   */
  private async executeWorkflowSteps(
    execution: WorkflowExecution,
    workflow: WorkflowDefinition
  ): Promise<void> {
    try {
      // Initialize step executions
      for (const step of workflow.steps) {
        execution.stepExecutions.set(step.id, {
          id: this.generateStepExecutionId(),
          stepId: step.id,
          status: StepStatus.PENDING,
          startTime: new Date(),
          retryCount: 0,
          logs: []
        });
      }

      // Execute steps based on dependencies
      const completedSteps = new Set<string>();
      const runningSteps = new Set<string>();
      
      while (completedSteps.size < workflow.steps.length) {
        const readySteps = workflow.steps.filter(step => {
          // Step is ready if all dependencies are completed and it's not running/completed
          const dependenciesMet = !step.dependencies || 
            step.dependencies.every(dep => completedSteps.has(dep));
          const notProcessed = !completedSteps.has(step.id) && !runningSteps.has(step.id);
          
          return dependenciesMet && notProcessed;
        });

        if (readySteps.length === 0) {
          // Check if we're waiting for running steps
          if (runningSteps.size > 0) {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            continue;
          } else {
            // No more steps can be executed - check for circular dependencies
            const remainingSteps = workflow.steps.filter(step => !completedSteps.has(step.id));
            if (remainingSteps.length > 0) {
              throw new Error(`Circular dependency detected or missing dependencies for steps: ${remainingSteps.map(s => s.id).join(', ')}`);
            }
            break;
          }
        }

        // Execute ready steps (respecting maxConcurrentSteps)
        const maxConcurrent = workflow.configuration.maxConcurrentSteps || 1;
        const stepsToExecute = readySteps.slice(0, Math.max(1, maxConcurrent - runningSteps.size));

        const stepPromises = stepsToExecute.map(async (step) => {
          runningSteps.add(step.id);
          execution.currentStep = step.id;
          
          try {
            const result = await this.executeStep(execution, step, workflow);
            completedSteps.add(step.id);
            execution.results[step.id] = result;
            
            this.addExecutionLog(execution, 'info', `Step completed: ${step.name}`, {
              stepId: step.id,
              result
            });
          } catch (error) {
            this.addExecutionLog(execution, 'error', `Step failed: ${step.name}`, {
              stepId: step.id,
              error: error.message
            });
            
            // Handle step failure based on error handling strategy
            await this.handleStepError(execution, step, error, workflow);
            
            // Mark as completed even if failed (depending on strategy)
            if (workflow.configuration.errorHandling.onStepFailure !== 'stop') {
              completedSteps.add(step.id);
            } else {
              throw error; // Stop workflow execution
            }
          } finally {
            runningSteps.delete(step.id);
          }
        });

        // Wait for concurrent steps if not allowing parallel execution
        if (!workflow.configuration.enableParallelExecution) {
          await Promise.all(stepPromises);
        }
      }

      // Workflow completed successfully
      execution.status = WorkflowStatus.COMPLETED;
      execution.endTime = new Date();
      execution.currentStep = null;
      
      this.addExecutionLog(execution, 'info', 'Workflow completed successfully', {
        duration: execution.endTime.getTime() - execution.startTime.getTime()
      });

      // Update metrics
      await this.updateMetrics(execution.workflowId, execution, true);

    } catch (error) {
      this.handleWorkflowError(execution, error);
    }
  }

  /**
   * Execute individual step
   */
  private async executeStep(
    execution: WorkflowExecution,
    step: any,
    workflow: WorkflowDefinition
  ): Promise<any> {
    const stepExecution = execution.stepExecutions.get(step.id)!;
    stepExecution.status = StepStatus.RUNNING;
    stepExecution.startTime = new Date();

    try {
      // Check step conditions
      if (step.conditions) {
        const conditionsMet = await this.evaluateConditions(step.conditions, execution);
        if (!conditionsMet) {
          stepExecution.status = StepStatus.SKIPPED;
          stepExecution.endTime = new Date();
          
          if (step.onSkip) {
            await step.onSkip(execution.context);
          }
          
          return { skipped: true, reason: 'Conditions not met' };
        }
      }

      let result: any;
      
      // Execute based on step type
      switch (step.type) {
        case 'action':
          result = await this.executeActionStep(step, execution);
          break;
          
        case 'decision':
          result = await this.executeDecisionStep(step, execution);
          break;
          
        case 'parallel':
          result = await this.executeParallelStep(step, execution);
          break;
          
        case 'wait':
          result = await this.executeWaitStep(step, execution);
          break;
          
        case 'condition':
          result = await this.executeConditionStep(step, execution);
          break;
          
        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      stepExecution.status = StepStatus.COMPLETED;
      stepExecution.result = result;
      stepExecution.endTime = new Date();

      // Update context with step result
      execution.context.stepResults[step.id] = result;
      execution.context.lastUpdated = new Date();

      // Call success handler
      if (step.onSuccess) {
        await step.onSuccess(result, execution.context);
      }

      return result;

    } catch (error) {
      stepExecution.status = StepStatus.FAILED;
      stepExecution.error = {
        code: error.code || 'STEP_EXECUTION_ERROR',
        message: error.message,
        details: error,
        stepId: step.id,
        timestamp: new Date(),
        recoverable: error.recoverable || false
      };
      stepExecution.endTime = new Date();

      throw error;
    }
  }

  /**
   * Execute action step
   */
  private async executeActionStep(step: any, execution: WorkflowExecution): Promise<any> {
    if (!step.action) {
      throw new Error(`Action step ${step.id} missing action ID`);
    }

    // Merge step parameters with current context
    const parameters = {
      ...step.parameters,
      ...execution.context.globalState
    };

    // Execute action through action registry
    const result = await this.actionRegistry.execute(
      step.action,
      parameters,
      execution.context
    );

    return result;
  }

  /**
   * Execute decision step
   */
  private async executeDecisionStep(step: any, execution: WorkflowExecution): Promise<any> {
    // Decision logic would be implemented here
    // For now, return a simple decision result
    return {
      decision: 'continue',
      branch: step.parameters?.defaultBranch || 'main'
    };
  }

  /**
   * Execute parallel step
   */
  private async executeParallelStep(step: any, execution: WorkflowExecution): Promise<any> {
    const { parallelActions } = step.parameters || {};
    
    if (!parallelActions || !Array.isArray(parallelActions)) {
      throw new Error(`Parallel step ${step.id} missing parallelActions parameter`);
    }

    // Execute all actions in parallel
    const results = await Promise.all(
      parallelActions.map(async (actionId: string) => {
        return await this.actionRegistry.execute(
          actionId,
          execution.context.globalState,
          execution.context
        );
      })
    );

    return { parallelResults: results };
  }

  /**
   * Execute wait step
   */
  private async executeWaitStep(step: any, execution: WorkflowExecution): Promise<any> {
    const waitTime = step.parameters?.duration || 1000; // Default 1 second
    
    await new Promise(resolve => setTimeout(resolve, waitTime));
    
    return { waited: waitTime };
  }

  /**
   * Execute condition step
   */
  private async executeConditionStep(step: any, execution: WorkflowExecution): Promise<any> {
    const conditionsMet = await this.evaluateConditions(
      step.conditions || [],
      execution
    );
    
    return { conditionsMet };
  }

  /**
   * Evaluate workflow conditions
   */
  private async evaluateConditions(conditions: any[], execution: WorkflowExecution): Promise<boolean> {
    for (const condition of conditions) {
      let result = false;
      
      switch (condition.type) {
        case 'context':
          result = this.evaluateContextCondition(condition.expression, execution.context);
          break;
          
        case 'result':
          result = this.evaluateResultCondition(condition.expression, execution.context.stepResults);
          break;
          
        case 'time':
          result = this.evaluateTimeCondition(condition.expression);
          break;
          
        case 'custom':
          result = await this.evaluateCustomCondition(condition.expression, execution);
          break;
          
        default:
          logger.warn(`Unknown condition type: ${condition.type}`);
          continue;
      }
      
      if (condition.negated) {
        result = !result;
      }
      
      if (!result) {
        return false; // All conditions must be true
      }
    }
    
    return true;
  }

  /**
   * Evaluate context condition
   */
  private evaluateContextCondition(expression: string, context: WorkflowContext): boolean {
    try {
      // Simple expression evaluation (in production, use a safer expression evaluator)
      const func = new Function('context', `return ${expression}`);
      return Boolean(func(context));
    } catch (error) {
      logger.error(`Error evaluating context condition: ${expression}`, error);
      return false;
    }
  }

  /**
   * Evaluate result condition
   */
  private evaluateResultCondition(expression: string, results: Record<string, any>): boolean {
    try {
      const func = new Function('results', `return ${expression}`);
      return Boolean(func(results));
    } catch (error) {
      logger.error(`Error evaluating result condition: ${expression}`, error);
      return false;
    }
  }

  /**
   * Evaluate time condition
   */
  private evaluateTimeCondition(expression: string): boolean {
    try {
      const now = new Date();
      const func = new Function('now', `return ${expression}`);
      return Boolean(func(now));
    } catch (error) {
      logger.error(`Error evaluating time condition: ${expression}`, error);
      return false;
    }
  }

  /**
   * Evaluate custom condition
   */
  private async evaluateCustomCondition(expression: string, execution: WorkflowExecution): Promise<boolean> {
    try {
      // Custom condition evaluation logic
      // This would typically call external services or complex business logic
      return true; // Placeholder
    } catch (error) {
      logger.error(`Error evaluating custom condition: ${expression}`, error);
      return false;
    }
  }

  /**
   * Handle step error
   */
  private async handleStepError(
    execution: WorkflowExecution,
    step: any,
    error: any,
    workflow: WorkflowDefinition
  ): Promise<void> {
    const workflowError: WorkflowError = {
      code: error.code || 'STEP_ERROR',
      message: error.message,
      details: error,
      stepId: step.id,
      timestamp: new Date(),
      recoverable: error.recoverable || false
    };

    execution.errors.push(workflowError);

    // Call step error handler
    if (step.onError) {
      try {
        await step.onError(error, execution.context);
      } catch (handlerError) {
        logger.error(`Error in step error handler for ${step.id}:`, handlerError);
      }
    }

    // Handle retry logic
    const stepExecution = execution.stepExecutions.get(step.id);
    if (stepExecution && step.retryPolicy) {
      const { maxAttempts, backoffType, initialDelayMs, maxDelayMs } = step.retryPolicy;
      
      if (stepExecution.retryCount < maxAttempts) {
        stepExecution.retryCount++;
        
        // Calculate delay
        let delay = initialDelayMs;
        if (backoffType === 'exponential') {
          delay = Math.min(initialDelayMs * Math.pow(2, stepExecution.retryCount - 1), maxDelayMs);
        } else if (backoffType === 'linear') {
          delay = Math.min(initialDelayMs * stepExecution.retryCount, maxDelayMs);
        }
        
        this.addExecutionLog(execution, 'warn', `Retrying step ${step.id} (attempt ${stepExecution.retryCount}/${maxAttempts}) after ${delay}ms`, {
          stepId: step.id,
          error: error.message
        });
        
        // Schedule retry (this is simplified - in production, use a proper scheduler)
        setTimeout(async () => {
          try {
            const result = await this.executeStep(execution, step, workflow);
            execution.results[step.id] = result;
          } catch (retryError) {
            await this.handleStepError(execution, step, retryError, workflow);
          }
        }, delay);
        
        return;
      }
    }

    // Apply error handling strategy
    const { onStepFailure } = workflow.configuration.errorHandling;
    
    switch (onStepFailure) {
      case 'stop':
        throw error;
        
      case 'continue':
        this.addExecutionLog(execution, 'warn', `Continuing workflow despite step failure: ${step.id}`, {
          stepId: step.id
        });
        break;
        
      case 'fallback':
        if (workflow.configuration.errorHandling.fallbackWorkflow) {
          this.addExecutionLog(execution, 'info', `Executing fallback workflow: ${workflow.configuration.errorHandling.fallbackWorkflow}`, {
            originalWorkflow: workflow.id,
            failedStep: step.id
          });
          // Execute fallback workflow (implementation would go here)
        }
        break;
    }
  }

  /**
   * Handle workflow error
   */
  private handleWorkflowError(execution: WorkflowExecution, error: any): void {
    execution.status = WorkflowStatus.FAILED;
    execution.endTime = new Date();

    const workflowError: WorkflowError = {
      code: error.code || 'WORKFLOW_ERROR',
      message: error.message,
      details: error,
      timestamp: new Date(),
      recoverable: false
    };

    execution.errors.push(workflowError);
    
    this.addExecutionLog(execution, 'error', `Workflow failed: ${error.message}`, {
      error: error.message,
      stack: error.stack
    });

    // Update metrics
    this.updateMetrics(execution.workflowId, execution, false).catch(metricsError => {
      logger.error('Failed to update metrics after workflow error:', metricsError);
    });
  }

  /**
   * Add execution log entry
   */
  private addExecutionLog(
    execution: WorkflowExecution,
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: any
  ): void {
    const logEntry: ExecutionLog = {
      level,
      message,
      timestamp: new Date(),
      stepId: execution.currentStep || undefined,
      data
    };

    // Add to current step execution if available
    if (execution.currentStep) {
      const stepExecution = execution.stepExecutions.get(execution.currentStep);
      if (stepExecution) {
        stepExecution.logs.push(logEntry);
      }
    }

    // Also log to system logger
    logger[level](`[${execution.id}] ${message}`, data);
  }

  /**
   * Update workflow metrics
   */
  private async updateMetrics(
    workflowId: string,
    execution: WorkflowExecution,
    success: boolean
  ): Promise<void> {
    const metrics = this.metrics.get(workflowId);
    if (!metrics) return;

    metrics.totalExecutions++;
    
    if (execution.endTime) {
      const executionTime = execution.endTime.getTime() - execution.startTime.getTime();
      metrics.averageExecutionTime = 
        (metrics.averageExecutionTime * (metrics.totalExecutions - 1) + executionTime) / metrics.totalExecutions;
    }

    if (success) {
      const successCount = Math.round(metrics.successRate * (metrics.totalExecutions - 1) / 100) + 1;
      metrics.successRate = (successCount / metrics.totalExecutions) * 100;
    } else {
      const failureCount = Math.round(metrics.failureRate * (metrics.totalExecutions - 1) / 100) + 1;
      metrics.failureRate = (failureCount / metrics.totalExecutions) * 100;
    }
  }

  /**
   * Pause workflow execution
   */
  async pauseWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    if (execution.status !== WorkflowStatus.RUNNING) {
      throw new Error(`Cannot pause workflow in ${execution.status} state`);
    }

    execution.status = WorkflowStatus.PAUSED;
    execution.pauseTime = new Date();
    
    this.addExecutionLog(execution, 'info', 'Workflow paused', {});
  }

  /**
   * Resume workflow execution
   */
  async resumeWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    if (execution.status !== WorkflowStatus.PAUSED) {
      throw new Error(`Cannot resume workflow in ${execution.status} state`);
    }

    execution.status = WorkflowStatus.RUNNING;
    execution.resumeTime = new Date();
    
    this.addExecutionLog(execution, 'info', 'Workflow resumed', {});
  }

  /**
   * Cancel workflow execution
   */
  async cancelWorkflow(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    execution.status = WorkflowStatus.CANCELLED;
    execution.endTime = new Date();
    
    this.addExecutionLog(execution, 'info', 'Workflow cancelled', {});
  }

  /**
   * Get execution status
   */
  async getExecutionStatus(executionId: string): Promise<WorkflowExecution | null> {
    return this.executions.get(executionId) || null;
  }

  /**
   * Get execution history
   */
  async getExecutionHistory(
    workflowId: string,
    limit: number = 10
  ): Promise<WorkflowExecution[]> {
    return Array.from(this.executions.values())
      .filter(execution => execution.workflowId === workflowId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  /**
   * Save checkpoint
   */
  async saveCheckpoint(executionId: string): Promise<void> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const checkpoint: WorkflowCheckpoint = {
      stepId: execution.currentStep || '',
      completedSteps: Array.from(execution.stepExecutions.entries())
        .filter(([_, stepExec]) => stepExec.status === StepStatus.COMPLETED)
        .map(([stepId, _]) => stepId),
      stepResults: execution.context.stepResults,
      globalState: execution.context.globalState,
      timestamp: new Date(),
      version: execution.workflowVersion
    };

    this.persistentStorage.set(`checkpoint_${executionId}`, checkpoint);
    
    this.addExecutionLog(execution, 'info', 'Checkpoint saved', {
      checkpointId: `checkpoint_${executionId}`
    });
  }

  /**
   * Restore from checkpoint
   */
  async restoreFromCheckpoint(
    executionId: string,
    checkpointId: string
  ): Promise<void> {
    const checkpoint = this.persistentStorage.get(checkpointId);
    if (!checkpoint) {
      throw new Error(`Checkpoint not found: ${checkpointId}`);
    }

    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    // Restore execution state
    execution.currentStep = checkpoint.stepId;
    execution.context.stepResults = checkpoint.stepResults;
    execution.context.globalState = checkpoint.globalState;
    execution.status = WorkflowStatus.RUNNING;
    
    this.addExecutionLog(execution, 'info', 'Restored from checkpoint', {
      checkpointId
    });
  }

  /**
   * Get workflow metrics
   */
  async getWorkflowMetrics(workflowId: string): Promise<WorkflowMetrics> {
    const metrics = this.metrics.get(workflowId);
    if (!metrics) {
      throw new Error(`Metrics not found for workflow: ${workflowId}`);
    }
    return metrics;
  }

  /**
   * Get execution logs
   */
  async getExecutionLogs(
    executionId: string,
    level?: string
  ): Promise<ExecutionLog[]> {
    const execution = this.executions.get(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }

    const logs: ExecutionLog[] = [];
    
    // Collect logs from all step executions
    for (const [_, stepExecution] of execution.stepExecutions.entries()) {
      logs.push(...stepExecution.logs);
    }

    // Filter by level if specified
    if (level) {
      return logs.filter(log => log.level === level);
    }

    return logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  /**
   * Validate workflow definition
   */
  private validateWorkflow(definition: WorkflowDefinition): { valid: boolean; errors: any[] } {
    const errors: any[] = [];

    // Basic validation
    if (!definition.id) {
      errors.push({ code: 'MISSING_ID', message: 'Workflow ID is required' });
    }

    if (!definition.name) {
      errors.push({ code: 'MISSING_NAME', message: 'Workflow name is required' });
    }

    if (!definition.steps || definition.steps.length === 0) {
      errors.push({ code: 'NO_STEPS', message: 'Workflow must have at least one step' });
    }

    // Step validation
    for (const step of definition.steps || []) {
      if (!step.id) {
        errors.push({ code: 'STEP_MISSING_ID', message: `Step missing ID` });
      }
      
      if (!step.name) {
        errors.push({ code: 'STEP_MISSING_NAME', message: `Step ${step.id} missing name` });
      }

      if (step.type === 'action' && !step.action) {
        errors.push({ code: 'ACTION_STEP_MISSING_ACTION', message: `Action step ${step.id} missing action ID` });
      }
    }

    // Check for circular dependencies (simplified)
    const stepIds = new Set(definition.steps?.map(step => step.id) || []);
    for (const step of definition.steps || []) {
      if (step.dependencies) {
        for (const dep of step.dependencies) {
          if (!stepIds.has(dep)) {
            errors.push({ 
              code: 'INVALID_DEPENDENCY', 
              message: `Step ${step.id} depends on non-existent step ${dep}` 
            });
          }
        }
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique step execution ID
   */
  private generateStepExecutionId(): string {
    return `step_exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get available workflows for context
   */
  public async getAvailableWorkflows(context: WorkflowContext): Promise<WorkflowDefinition[]> {
    const workflows = Array.from(this.workflows.values());
    const available: WorkflowDefinition[] = [];

    for (const workflow of workflows) {
      for (const trigger of workflow.triggers) {
        if (trigger.type === 'manual') {
          available.push(workflow);
          break;
        }
        
        if (trigger.type === 'automatic' && trigger.condition) {
          try {
            const shouldTrigger = await trigger.condition(context);
            if (shouldTrigger) {
              available.push(workflow);
              break;
            }
          } catch (error) {
            logger.error(`Error evaluating trigger condition for ${workflow.id}:`, error);
          }
        }
      }
    }

    return available;
  }
}

// Export singleton instance
export const workflowEngine = WorkflowEngine.getInstance();