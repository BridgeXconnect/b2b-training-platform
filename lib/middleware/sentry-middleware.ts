/**
 * Sentry Middleware for Automatic API Route Instrumentation
 * Provides comprehensive monitoring for all API endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export interface ApiMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  statusCode?: number;
  endpoint?: string;
  method?: string;
  userId?: string;
  success?: boolean;
}

/**
 * Sentry API Route Wrapper
 * Automatically instruments API routes with performance and error monitoring
 */
export function withSentryApiRoute<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>,
  options?: {
    operation?: string;
    tags?: Record<string, string>;
    context?: Record<string, any>;
  }
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const startTime = Date.now();
    const url = new URL(request.url);
    const endpoint = url.pathname;
    const method = request.method;
    
    // Extract operation name
    const operation = options?.operation || `${method} ${endpoint}`;
    
    return await Sentry.withScope(async (scope) => {
      // Set initial context
      scope.setTag('api.endpoint', endpoint);
      scope.setTag('api.method', method);
      scope.setTag('api.url', url.toString());
      
      // Add custom tags if provided
      if (options?.tags) {
        Object.entries(options.tags).forEach(([key, value]) => {
          scope.setTag(key, value);
        });
      }
      
      // Add custom context if provided
      if (options?.context) {
        scope.setContext('api', options.context);
      }
      
      // Set request context
      scope.setContext('request', {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(
          Array.from(request.headers.entries())
            .filter(([key]) => !['authorization', 'cookie', 'x-api-key'].includes(key.toLowerCase()))
        ),
      });
      
      // Add breadcrumb for API request start
      Sentry.addBreadcrumb({
        category: 'api.request',
        message: `API request started: ${method} ${endpoint}`,
        level: 'info',
        timestamp: startTime / 1000,
        data: {
          endpoint,
          method,
          userAgent: request.headers.get('user-agent'),
        },
      });

      return await Sentry.startSpan({
        name: operation,
        op: 'http.server',
        attributes: {
          'http.method': method,
          'http.url': request.url,
          'http.route': endpoint,
          'api.version': 'v1',
        },
      }, async (span) => {
        let response: NextResponse;
        let error: Error | null = null;
        
        try {
          // Execute the API handler
          response = await handler(request, ...args);
          
          // Set success metrics
          const duration = Date.now() - startTime;
          const statusCode = response.status;
          
          // Update span with success metrics
          span.setAttributes({
            'http.status_code': statusCode,
            'http.response.duration': duration,
            'api.success': statusCode < 400,
          });
          
          // Set Sentry context
          scope.setTag('response.status', statusCode.toString());
          scope.setTag('response.success', statusCode < 400 ? 'true' : 'false');
          scope.setContext('response', {
            statusCode,
            duration,
            success: statusCode < 400,
          });
          
          // Add success breadcrumb
          Sentry.addBreadcrumb({
            category: 'api.response',
            message: `API request completed: ${statusCode}`,
            level: statusCode < 400 ? 'info' : 'warning',
            data: {
              statusCode,
              duration,
              endpoint,
              method,
            },
          });
          
          // Set custom measurements
          Sentry.setMeasurement('api.response_time', duration, 'millisecond');
          if (statusCode >= 400) {
            Sentry.setMeasurement('api.error_rate', 1, 'none');
          }
          
          return response;
          
        } catch (err) {
          error = err instanceof Error ? err : new Error(String(err));
          const duration = Date.now() - startTime;
          
          // Update span with error metrics
          span.setAttributes({
            'http.status_code': 500,
            'http.response.duration': duration,
            'api.success': false,
            'error.type': error.constructor.name,
            'error.message': error.message,
          });
          
          // Set error context
          scope.setTag('response.status', '500');
          scope.setTag('response.success', 'false');
          scope.setTag('error.type', error.constructor.name);
          scope.setContext('error', {
            name: error.name,
            message: error.message,
            stack: error.stack,
            endpoint,
            method,
            duration,
          });
          
          // Add error breadcrumb
          Sentry.addBreadcrumb({
            category: 'api.error',
            message: `API request failed: ${error.message}`,
            level: 'error',
            data: {
              error: error.message,
              endpoint,
              method,
              duration,
            },
          });
          
          // Set error measurements
          Sentry.setMeasurement('api.response_time', duration, 'millisecond');
          Sentry.setMeasurement('api.error_rate', 1, 'none');
          
          // Capture the exception
          Sentry.captureException(error);
          
          // Return error response
          return NextResponse.json(
            {
              error: 'Internal Server Error',
              message: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred',
              timestamp: new Date().toISOString(),
              endpoint,
              method,
            },
            { status: 500 }
          );
        }
      });
    });
  };
}

/**
 * Middleware for tracking user context in API routes
 */
export function withUserContext(
  handler: (request: NextRequest) => Promise<NextResponse>,
  getUserId?: (request: NextRequest) => string | Promise<string>
) {
  return withSentryApiRoute(async (request: NextRequest) => {
    // Extract user ID if provided
    let userId: string | undefined;
    
    if (getUserId) {
      try {
        userId = await getUserId(request);
        Sentry.setUser({ id: userId });
        Sentry.setTag('user.id', userId);
      } catch (err) {
        console.warn('Failed to extract user ID:', err);
      }
    }
    
    return await handler(request);
  });
}

/**
 * Middleware for tracking feature usage
 */
export function withFeatureTracking(
  handler: (request: NextRequest) => Promise<NextResponse>,
  feature: string,
  getMetadata?: (request: NextRequest) => Record<string, any> | Promise<Record<string, any>>
) {
  return withSentryApiRoute(async (request: NextRequest) => {
    const startTime = Date.now();
    let metadata: Record<string, any> = {};
    
    if (getMetadata) {
      try {
        metadata = await getMetadata(request);
      } catch (err) {
        console.warn('Failed to extract feature metadata:', err);
      }
    }
    
    // Set feature context
    Sentry.setTag('feature', feature);
    Sentry.setContext('feature_usage', {
      feature,
      metadata,
      timestamp: new Date().toISOString(),
    });
    
    try {
      const response = await handler(request);
      const duration = Date.now() - startTime;
      
      // Track successful feature usage
      Sentry.addBreadcrumb({
        category: 'feature.usage',
        message: `Feature used successfully: ${feature}`,
        level: 'info',
        data: {
          feature,
          duration,
          metadata,
          success: true,
        },
      });
      
      return response;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Track failed feature usage
      Sentry.addBreadcrumb({
        category: 'feature.usage',
        message: `Feature usage failed: ${feature}`,
        level: 'error',
        data: {
          feature,
          duration,
          metadata,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      
      throw error; // Re-throw to be handled by the main wrapper
    }
  }, {
    tags: { feature },
  });
}

/**
 * Middleware for AI service monitoring
 */
export function withAIServiceMonitoring(
  handler: (request: NextRequest) => Promise<NextResponse>,
  service: 'openai' | 'anthropic' | 'custom' = 'openai'
) {
  return withSentryApiRoute(async (request: NextRequest) => {
    const startTime = Date.now();
    
    // Set AI service context
    Sentry.setTag('ai.service', service);
    Sentry.setContext('ai_service', {
      service,
      request_time: new Date().toISOString(),
    });
    
    try {
      const response = await handler(request);
      const duration = Date.now() - startTime;
      
      // Track AI service metrics
      Sentry.setMeasurement(`ai.${service}.response_time`, duration, 'millisecond');
      Sentry.setMeasurement(`ai.${service}.success_rate`, 1, 'ratio');
      
      return response;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      // Track AI service failures
      Sentry.setMeasurement(`ai.${service}.response_time`, duration, 'millisecond');
      Sentry.setMeasurement(`ai.${service}.error_rate`, 1, 'ratio');
      
      // Add AI-specific error context
      if (error instanceof Error) {
        Sentry.setTag('ai.error.type', error.constructor.name);
        Sentry.setContext('ai_error', {
          service,
          error_message: error.message,
          duration,
        });
      }
      
      throw error;
    }
  }, {
    operation: `AI ${service} request`,
    tags: { 'ai.service': service },
  });
}

/**
 * Helper function to extract common API metrics
 */
export function getApiMetrics(request: NextRequest, response?: NextResponse): ApiMetrics {
  const url = new URL(request.url);
  
  return {
    startTime: Date.now(),
    endpoint: url.pathname,
    method: request.method,
    statusCode: response?.status,
    // userId can be extracted from request headers or cookies
  };
}

/**
 * Utility function to create custom API instrumentation
 */
export function createApiInstrumentation(name: string, options?: {
  trackUser?: boolean;
  trackFeature?: string;
  aiService?: 'openai' | 'anthropic' | 'custom';
}) {
  return (handler: (request: NextRequest) => Promise<NextResponse>) => {
    let wrappedHandler = handler;
    
    // Apply AI service monitoring if specified
    if (options?.aiService) {
      wrappedHandler = withAIServiceMonitoring(wrappedHandler, options.aiService);
    }
    
    // Apply feature tracking if specified
    if (options?.trackFeature) {
      wrappedHandler = withFeatureTracking(wrappedHandler, options.trackFeature);
    }
    
    // Apply user context tracking if specified
    if (options?.trackUser) {
      wrappedHandler = withUserContext(wrappedHandler);
    }
    
    return wrappedHandler;
  };
}