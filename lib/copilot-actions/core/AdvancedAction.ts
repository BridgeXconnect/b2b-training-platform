/**
 * AdvancedAction abstract class implementation
 */

import { BaseAction } from './BaseAction';
import {
  AdvancedAction as IAdvancedAction,
  ActionContext,
  ActionResult,
  ActionError,
  ActionMetrics,
  ActionCategory,
  ActionHandler,
  ActionValidator
} from '../types';

export abstract class AdvancedAction extends BaseAction implements IAdvancedAction {
  public readonly priority: number;
  public readonly rateLimit?: {
    maxCallsPerMinute: number;
    maxCallsPerHour: number;
  };
  public readonly chainWith?: string[];
  public readonly composeWith?: string[];
  public readonly retryPolicy?: {
    maxRetries: number;
    backoffMultiplier: number;
    retryableErrors: string[];
  };
  
  public metrics: ActionMetrics;
  
  private rateLimitState: {
    minuteCalls: { timestamp: number }[];
    hourCalls: { timestamp: number }[];
  } = {
    minuteCalls: [],
    hourCalls: []
  };
  
  constructor(config: {
    id: string;
    name: string;
    description: string;
    category: ActionCategory;
    parameters: any[];
    handler: ActionHandler;
    validator?: ActionValidator;
    priority: number;
    rateLimit?: {
      maxCallsPerMinute: number;
      maxCallsPerHour: number;
    };
    chainWith?: string[];
    composeWith?: string[];
    retryPolicy?: {
      maxRetries: number;
      backoffMultiplier: number;
      retryableErrors: string[];
    };
  }) {
    super(config);
    
    this.priority = config.priority;
    this.rateLimit = config.rateLimit;
    this.chainWith = config.chainWith;
    this.composeWith = config.composeWith;
    this.retryPolicy = config.retryPolicy;
    
    // Initialize metrics
    this.metrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      errorRate: 0
    };
  }
  
  /**
   * Check if action is available in the given context
   */
  abstract isAvailable(context: ActionContext): Promise<boolean>;
  
  /**
   * Get recommendation score for this action in the given context
   */
  abstract getRecommendationScore(context: ActionContext): Promise<number>;
  
  /**
   * Execute with advanced features
   */
  override async execute(params: any, context: ActionContext): Promise<ActionResult> {
    // Check rate limits
    if (!(await this.checkRateLimit())) {
      return {
        success: false,
        error: this.createError(
          'RATE_LIMIT_EXCEEDED',
          'Action rate limit exceeded',
          { rateLimit: this.rateLimit },
          true
        )
      };
    }
    
    // Check availability
    if (!(await this.isAvailable(context))) {
      return {
        success: false,
        error: this.createError(
          'ACTION_UNAVAILABLE',
          'Action is not available in the current context',
          { context },
          true
        )
      };
    }
    
    // Execute with retry logic
    let lastError: ActionError | undefined;
    let attempt = 0;
    const maxAttempts = (this.retryPolicy?.maxRetries ?? 0) + 1;
    
    while (attempt < maxAttempts) {
      const result = await super.execute(params, context);
      
      // Update metrics
      this.updateMetrics(result);
      
      // If successful or non-retryable error, return
      if (result.success || !this.shouldRetry(result.error)) {
        return result;
      }
      
      lastError = result.error;
      attempt++;
      
      // Apply backoff if not the last attempt
      if (attempt < maxAttempts) {
        const backoffTime = this.calculateBackoff(attempt);
        await this.sleep(backoffTime);
      }
    }
    
    // All retries exhausted
    return {
      success: false,
      error: lastError || this.createError(
        'MAX_RETRIES_EXCEEDED',
        'Maximum retry attempts exceeded',
        { attempts: maxAttempts },
        false
      )
    };
  }
  
  /**
   * Check if rate limit allows execution
   */
  protected async checkRateLimit(): Promise<boolean> {
    if (!this.rateLimit) {
      return true;
    }
    
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;
    const oneHourAgo = now - 60 * 60 * 1000;
    
    // Clean up old entries
    this.rateLimitState.minuteCalls = this.rateLimitState.minuteCalls.filter(
      call => call.timestamp > oneMinuteAgo
    );
    this.rateLimitState.hourCalls = this.rateLimitState.hourCalls.filter(
      call => call.timestamp > oneHourAgo
    );
    
    // Check limits
    if (this.rateLimitState.minuteCalls.length >= this.rateLimit.maxCallsPerMinute) {
      return false;
    }
    if (this.rateLimitState.hourCalls.length >= this.rateLimit.maxCallsPerHour) {
      return false;
    }
    
    // Add current call
    const currentCall = { timestamp: now };
    this.rateLimitState.minuteCalls.push(currentCall);
    this.rateLimitState.hourCalls.push(currentCall);
    
    return true;
  }
  
  /**
   * Check if error is retryable
   */
  protected shouldRetry(error?: ActionError): boolean {
    if (!error || !this.retryPolicy) {
      return false;
    }
    
    return error.recoverable && 
           this.retryPolicy.retryableErrors.includes(error.code);
  }
  
  /**
   * Calculate backoff time for retry
   */
  protected calculateBackoff(attempt: number): number {
    const baseDelay = 1000; // 1 second
    const multiplier = this.retryPolicy?.backoffMultiplier ?? 2;
    return baseDelay * Math.pow(multiplier, attempt - 1);
  }
  
  /**
   * Update action metrics
   */
  protected updateMetrics(result: ActionResult): void {
    this.metrics.totalExecutions++;
    
    if (result.success) {
      this.metrics.successfulExecutions++;
    } else {
      this.metrics.failedExecutions++;
    }
    
    // Update average execution time
    const executionTime = result.metadata?.executionTime ?? 0;
    this.metrics.averageExecutionTime = 
      (this.metrics.averageExecutionTime * (this.metrics.totalExecutions - 1) + executionTime) / 
      this.metrics.totalExecutions;
    
    // Update error rate
    this.metrics.errorRate = this.metrics.failedExecutions / this.metrics.totalExecutions;
    
    // Update last execution time
    this.metrics.lastExecutionTime = new Date();
  }
  
  /**
   * Sleep utility for backoff
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Get current metrics
   */
  public getMetrics(): ActionMetrics {
    return { ...this.metrics };
  }
  
  /**
   * Reset metrics
   */
  public resetMetrics(): void {
    this.metrics = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0,
      errorRate: 0
    };
  }
}