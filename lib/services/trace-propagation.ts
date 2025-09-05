/**
 * Distributed Tracing Header Propagation Service
 * Ensures seamless trace correlation between frontend and backend systems
 */

import * as Sentry from '@sentry/nextjs';

export interface TraceHeaders {
  'sentry-trace': string | null;
  'baggage': string | null;
}

export interface EnhancedRequestOptions extends RequestInit {
  headers?: Record<string, string>;
}

/**
 * Enhanced fetch wrapper with automatic distributed tracing header propagation
 */
export class TracingFetch {
  /**
   * Generate distributed tracing headers for requests
   */
  static getTraceHeaders(): TraceHeaders {
    // Use Sentry v8 API - get trace headers from current span context
    const activeSpan = Sentry.getActiveSpan();
    const sentryTrace = activeSpan ? 
      `${activeSpan.spanContext().traceId}-${activeSpan.spanContext().spanId}-1` : null;
    // getBaggage is not available in v8, use a fallback approach
    const baggage = null; // Baggage will be handled automatically by Sentry
    
    return {
      'sentry-trace': sentryTrace,
      'baggage': baggage,
    };
  }

  /**
   * Enhanced fetch with automatic trace header propagation
   */
  static async fetch(
    url: string | URL | Request,
    options: EnhancedRequestOptions = {}
  ): Promise<Response> {
    const traceHeaders = this.getTraceHeaders();
    
    // Combine trace headers with existing headers
    const enhancedHeaders = {
      'Content-Type': 'application/json',
      ...options.headers,
      // Only add trace headers if they exist
      ...(traceHeaders['sentry-trace'] && { 'sentry-trace': traceHeaders['sentry-trace'] }),
      ...(traceHeaders['baggage'] && { 'baggage': traceHeaders['baggage'] }),
    };

    const enhancedOptions: RequestInit = {
      ...options,
      headers: enhancedHeaders,
    };

    // Add breadcrumb for trace correlation
    Sentry.addBreadcrumb({
      message: `API Request with trace correlation`,
      category: 'http.request',
      level: 'debug',
      data: {
        url: url.toString(),
        method: options.method || 'GET',
        hasTraceHeaders: Boolean(traceHeaders['sentry-trace']),
        traceId: traceHeaders['sentry-trace']?.split('-')[0] || 'unknown',
      },
    });

    return fetch(url, enhancedOptions);
  }

  /**
   * Enhanced fetch specifically for backend API calls with additional context
   */
  static async fetchAPI(
    endpoint: string,
    options: EnhancedRequestOptions = {},
    context?: {
      userId?: string;
      sessionId?: string;
      feature?: string;
    }
  ): Promise<Response> {
    return Sentry.startSpan({
      name: `API ${options.method || 'GET'} ${endpoint}`,
      op: 'http.client',
      attributes: {
        'http.method': options.method || 'GET',
        'http.url': endpoint,
        'user.id': context?.userId || 'anonymous',
        'session.id': context?.sessionId || 'unknown',
        'feature': context?.feature || 'unknown',
      },
    }, async () => {
      const response = await this.fetch(endpoint, options);
      
      // Extract backend trace correlation from response headers
      const backendTraceId = response.headers.get('x-backend-trace-id');
      if (backendTraceId) {
        Sentry.setTag('backend_trace_id', backendTraceId);
        Sentry.addBreadcrumb({
          message: 'Backend trace correlation established',
          category: 'distributed_tracing',
          level: 'debug',
          data: {
            frontend_trace: this.getTraceHeaders()['sentry-trace']?.split('-')[0],
            backend_trace: backendTraceId,
            endpoint,
          },
        });
      }

      return response;
    });
  }
}

/**
 * OpenAI API tracing wrapper for external service correlation
 */
export class OpenAITracing {
  /**
   * Wrap OpenAI API calls with distributed tracing
   */
  static async withTracing<T>(
    operation: string,
    model: string,
    userId: string,
    fn: () => Promise<T>
  ): Promise<T> {
    return Sentry.startSpan({
      name: `ai.${operation}`,
      op: `ai.${operation}`,
      attributes: {
        'ai.provider': 'openai',
        'ai.model': model,
        'ai.operation': operation,
        'user.id': userId,
      },
    }, async (span) => {
      try {
        const result = await fn();
        
        // Add success breadcrumb
        Sentry.addBreadcrumb({
          message: `OpenAI ${operation} completed successfully`,
          category: 'ai.completion',
          level: 'info',
          data: {
            model,
            operation,
            userId,
            traceId: Sentry.getActiveSpan()?.spanContext().traceId || 'unknown',
          },
        });
        
        return result;
      } catch (error) {
        // Enhance error with trace context
        Sentry.setTag('ai_operation_failed', operation);
        Sentry.setContext('ai_request', {
          operation,
          model,
          userId,
          traceId: span.spanContext().traceId || 'unknown',
        });
        
        throw error;
      }
    });
  }
}

/**
 * Cross-system error recovery coordination
 */
export class ErrorRecoveryCoordination {
  /**
   * Coordinate error recovery across frontend and backend
   */
  static async coordinateRecovery(
    error: Error,
    context: {
      userId: string;
      sessionId: string;
      endpoint: string;
      recoveryActions?: string[];
    }
  ): Promise<void> {
    return Sentry.withScope(async (scope) => {
      scope.setTag('error_recovery', 'cross_system');
      scope.setContext('recovery_context', context);
      
      // Add recovery coordination breadcrumb
      Sentry.addBreadcrumb({
        message: 'Initiating cross-system error recovery',
        category: 'error.recovery',
        level: 'warning',
        data: {
          error: error.message,
          ...context,
        },
      });

      // Trigger backend cleanup coordination
      try {
        await TracingFetch.fetchAPI('/api/internal/error-recovery', {
          method: 'POST',
          body: JSON.stringify({
            userId: context.userId,
            sessionId: context.sessionId,
            errorType: error.constructor.name,
            errorMessage: error.message,
            recoveryActions: context.recoveryActions || [],
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (recoveryError) {
        // Recovery coordination failed, but don't throw
        Sentry.addBreadcrumb({
          message: 'Error recovery coordination failed',
          category: 'error.recovery',
          level: 'error',
          data: {
            originalError: error.message,
            recoveryError: recoveryError instanceof Error ? recoveryError.message : String(recoveryError),
          },
        });
      }
    });
  }
}

/**
 * Trace verification and monitoring utilities
 */
export class TraceVerification {
  /**
   * Verify trace correlation is working correctly
   */
  static async verifyTraceCorrelation(
    endpoint: string,
    expectedFeatures: string[]
  ): Promise<{
    success: boolean;
    traceId: string | null;
    backendTraceId: string | null;
    correlation: boolean;
    features: string[];
  }> {
    const traceHeaders = TracingFetch.getTraceHeaders();
    const traceId = traceHeaders['sentry-trace']?.split('-')[0] || null;
    
    try {
      const response = await TracingFetch.fetchAPI(endpoint, {
        method: 'GET',
        headers: {
          'x-trace-verification': 'true',
        },
      });
      
      const backendTraceId = response.headers.get('x-backend-trace-id');
      const correlation = traceId === backendTraceId;
      
      return {
        success: response.ok,
        traceId,
        backendTraceId,
        correlation,
        features: expectedFeatures,
      };
    } catch (error) {
      return {
        success: false,
        traceId,
        backendTraceId: null,
        correlation: false,
        features: [],
      };
    }
  }

  /**
   * Monitor trace health across the system
   */
  static async monitorTraceHealth(): Promise<{
    frontendTracing: boolean;
    backendTracing: boolean;
    correlation: boolean;
    performance: {
      averageOverhead: number;
      correlationRate: number;
    };
  }> {
    const startTime = performance.now();
    
    const verification = await this.verifyTraceCorrelation('/api/health/trace', ['tracing']);
    
    const endTime = performance.now();
    const overhead = endTime - startTime;
    
    return {
      frontendTracing: Boolean(TracingFetch.getTraceHeaders()['sentry-trace']),
      backendTracing: verification.success,
      correlation: verification.correlation,
      performance: {
        averageOverhead: overhead,
        correlationRate: verification.correlation ? 1.0 : 0.0,
      },
    };
  }
}

/**
 * Convenience function for backward compatibility
 */
export function createTracedFetch() {
  return TracingFetch.fetch;
}

/**
 * All classes are already exported above when declared
 */

export default TracingFetch;