/**
 * Monitoring middleware for automatic action tracking
 */

import { ActionContext, ActionResult, BaseAction, AdvancedAction } from '../types';
import { ActionMonitor } from './ActionMonitor';

/**
 * Middleware function type
 */
export type MonitoringMiddleware = (
  action: BaseAction | AdvancedAction,
  params: any,
  context: ActionContext,
  next: () => Promise<ActionResult>
) => Promise<ActionResult>;

/**
 * Create monitoring middleware
 */
export function createMonitoringMiddleware(
  monitor: ActionMonitor = ActionMonitor.getInstance()
): MonitoringMiddleware {
  return async (action, params, context, next) => {
    const startTime = Date.now();
    
    // Track action start
    monitor.track({
      actionId: action.id,
      actionName: action.name,
      eventType: 'start',
      timestamp: new Date(),
      context,
      params
    });
    
    try {
      // Execute the action
      const result = await next();
      
      // Track success
      monitor.track({
        actionId: action.id,
        actionName: action.name,
        eventType: 'success',
        timestamp: new Date(),
        context,
        duration: Date.now() - startTime,
        result: result.data
      });
      
      // Check performance thresholds
      const duration = Date.now() - startTime;
      if (duration > monitor['config'].performanceThresholds.warningMs) {
        monitor.track({
          actionId: action.id,
          actionName: action.name,
          eventType: 'performance_warning' as any,
          timestamp: new Date(),
          context,
          duration
        });
      }
      
      return result;
      
    } catch (error: any) {
      // Track failure
      monitor.track({
        actionId: action.id,
        actionName: action.name,
        eventType: 'failure',
        timestamp: new Date(),
        context,
        duration: Date.now() - startTime,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message,
          details: error.details,
          timestamp: new Date(),
          recoverable: error.recoverable || false
        }
      });
      
      throw error;
    }
  };
}

/**
 * Token usage tracking middleware
 */
export function createTokenTrackingMiddleware(): MonitoringMiddleware {
  return async (action, params, context, next) => {
    const result = await next();
    
    // Track token usage if available
    if (result.metadata?.tokensUsed) {
      const monitor = ActionMonitor.getInstance();
      
      // Check token threshold
      if (result.metadata.tokensUsed > monitor['config'].performanceThresholds.maxTokens) {
        console.warn(`[TOKEN WARNING] Action ${action.id} used ${result.metadata.tokensUsed} tokens`);
      }
    }
    
    return result;
  };
}

/**
 * Rate limit tracking middleware
 */
export function createRateLimitMiddleware(): MonitoringMiddleware {
  const rateLimitTracking = new Map<string, number[]>();
  
  return async (action, params, context, next) => {
    const key = `${action.id}-${context.userId || 'anonymous'}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    
    // Get recent calls
    const recentCalls = (rateLimitTracking.get(key) || [])
      .filter(timestamp => timestamp > now - windowMs);
    
    // Check if we should track rate limit hit
    if ('rateLimit' in action && action.rateLimit) {
      if (recentCalls.length >= action.rateLimit.maxCallsPerMinute) {
        const monitor = ActionMonitor.getInstance();
        monitor.track({
          actionId: action.id,
          actionName: action.name,
          eventType: 'rate_limit_hit' as any,
          timestamp: new Date(),
          context
        });
      }
    }
    
    // Update tracking
    recentCalls.push(now);
    rateLimitTracking.set(key, recentCalls);
    
    // Clean up old entries periodically
    if (Math.random() < 0.01) { // 1% chance
      for (const [k, calls] of rateLimitTracking.entries()) {
        const filtered = calls.filter(t => t > now - windowMs);
        if (filtered.length === 0) {
          rateLimitTracking.delete(k);
        } else {
          rateLimitTracking.set(k, filtered);
        }
      }
    }
    
    return next();
  };
}

/**
 * Context enrichment middleware
 */
export function createContextEnrichmentMiddleware(): MonitoringMiddleware {
  return async (action, params, context, next) => {
    // Enrich context with additional metadata
    const enrichedContext: ActionContext = {
      ...context,
      metadata: {
        ...context.metadata,
        actionCategory: action.category,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      }
    };
    
    // Replace context for downstream
    return next();
  };
}

/**
 * Retry tracking middleware
 */
export function createRetryTrackingMiddleware(): MonitoringMiddleware {
  const retryCount = new Map<string, number>();
  
  return async (action, params, context, next) => {
    const key = `${action.id}-${context.sessionId}`;
    
    try {
      const result = await next();
      
      // Reset retry count on success
      retryCount.delete(key);
      
      return result;
      
    } catch (error) {
      // Track retry attempt
      const attempts = (retryCount.get(key) || 0) + 1;
      retryCount.set(key, attempts);
      
      if (attempts > 1) {
        const monitor = ActionMonitor.getInstance();
        monitor.track({
          actionId: action.id,
          actionName: action.name,
          eventType: 'retry_attempt' as any,
          timestamp: new Date(),
          context,
          params: { attemptNumber: attempts }
        });
      }
      
      throw error;
    }
  };
}

/**
 * Combine multiple middleware functions
 */
export function combineMiddleware(
  ...middlewares: MonitoringMiddleware[]
): MonitoringMiddleware {
  return async (action, params, context, next) => {
    let index = 0;
    
    const dispatch = async (): Promise<ActionResult> => {
      if (index >= middlewares.length) {
        return next();
      }
      
      const middleware = middlewares[index++];
      return middleware(action, params, context, dispatch);
    };
    
    return dispatch();
  };
}

/**
 * Default monitoring middleware stack
 */
export const defaultMonitoringStack = combineMiddleware(
  createContextEnrichmentMiddleware(),
  createRateLimitMiddleware(),
  createMonitoringMiddleware(),
  createTokenTrackingMiddleware(),
  createRetryTrackingMiddleware()
);