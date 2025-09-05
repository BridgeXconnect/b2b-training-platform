/**
 * Enhanced Sentry Monitoring System for AI Course Platform
 * Provides comprehensive monitoring, metrics collection, and alerting
 */

import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

export interface MonitoringMetrics {
  sessionQuality: number;
  userEngagement: number;
  aiResponseTime: number;
  errorRate: number;
  performanceScore: number;
}

export interface BusinessMetrics {
  dailyActiveUsers: number;
  learningCompletionRate: number;
  featureAdoption: Record<string, number>;
  userSatisfaction: number;
  revenueImpact?: number;
}

export interface PerformanceMetrics {
  apiResponseTime: Record<string, number>;
  databaseQueryTime: number;
  cacheHitRate: number;
  memoryUsage: number;
  cpuUsage: number;
}

export class SentryMonitoringService {
  private static instance: SentryMonitoringService;
  private metricsBuffer: Array<{ timestamp: Date; metrics: any }> = [];
  private readonly BUFFER_SIZE = 100;

  public static getInstance(): SentryMonitoringService {
    if (!SentryMonitoringService.instance) {
      SentryMonitoringService.instance = new SentryMonitoringService();
    }
    return SentryMonitoringService.instance;
  }

  /**
   * Track AI Chat Performance Metrics
   */
  public trackAIChatPerformance(data: {
    userId: string;
    sessionId: string;
    messageType: string;
    responseTime: number;
    tokenUsage: {
      input: number;
      output: number;
      total: number;
    };
    success: boolean;
    model: string;
    cefrLevel?: string;
    businessContext?: string;
  }): void {
    // Set custom measurements for Sentry
    Sentry.setMeasurement('ai_response_time', data.responseTime, 'millisecond');
    Sentry.setMeasurement('ai_tokens_input', data.tokenUsage.input, 'none');
    Sentry.setMeasurement('ai_tokens_output', data.tokenUsage.output, 'none');
    Sentry.setMeasurement('ai_tokens_total', data.tokenUsage.total, 'none');

    // Set tags for filtering and analysis
    Sentry.setTag('messageType', data.messageType);
    Sentry.setTag('aiModel', data.model);
    Sentry.setTag('cefrLevel', data.cefrLevel || 'unknown');
    Sentry.setTag('businessContext', data.businessContext || 'general');
    Sentry.setTag('chatSuccess', data.success ? 'true' : 'false');

    // Set user context
    Sentry.setUser({
      id: data.userId,
      session: data.sessionId,
    });

    // Add breadcrumb for tracking
    Sentry.addBreadcrumb({
      category: 'ai-chat',
      message: `AI chat ${data.success ? 'success' : 'failure'}: ${data.messageType}`,
      level: data.success ? 'info' : 'warning',
      data: {
        responseTime: data.responseTime,
        tokenUsage: data.tokenUsage.total,
        model: data.model,
      },
    });

    // Log for our internal monitoring
    logger.info('AI chat performance tracked', 'MONITORING', {
      userId: data.userId,
      sessionId: data.sessionId,
      responseTime: data.responseTime,
      tokenUsage: data.tokenUsage.total,
      success: data.success,
    });
  }

  /**
   * Track User Learning Analytics
   */
  public trackLearningAnalytics(data: {
    userId: string;
    sessionId: string;
    action: 'node_started' | 'node_completed' | 'assessment_taken' | 'content_generated';
    nodeId?: string;
    assessmentId?: string;
    contentType?: string;
    completionTime?: number;
    score?: number;
    cefrLevel: string;
    learningGoals: string[];
  }): void {
    // Set measurements
    if (data.completionTime) {
      Sentry.setMeasurement('learning_completion_time', data.completionTime, 'millisecond');
    }
    if (data.score !== undefined) {
      Sentry.setMeasurement('learning_score', data.score, 'none');
    }

    // Set tags
    Sentry.setTag('learningAction', data.action);
    Sentry.setTag('cefrLevel', data.cefrLevel);
    Sentry.setTag('learningGoalsCount', data.learningGoals.length.toString());

    // Set context
    Sentry.setContext('learning', {
      nodeId: data.nodeId,
      assessmentId: data.assessmentId,
      contentType: data.contentType,
      learningGoals: data.learningGoals,
    });

    // Add breadcrumb
    Sentry.addBreadcrumb({
      category: 'learning-analytics',
      message: `Learning action: ${data.action}`,
      level: 'info',
      data: {
        nodeId: data.nodeId,
        score: data.score,
        completionTime: data.completionTime,
      },
    });

    logger.info('Learning analytics tracked', 'MONITORING', data);
  }

  /**
   * Track Performance Metrics
   */
  public trackPerformanceMetrics(metrics: PerformanceMetrics): void {
    // Set performance measurements
    Object.entries(metrics.apiResponseTime).forEach(([endpoint, time]) => {
      Sentry.setMeasurement(`api_response_time_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`, time, 'millisecond');
    });

    Sentry.setMeasurement('db_query_time', metrics.databaseQueryTime, 'millisecond');
    Sentry.setMeasurement('cache_hit_rate', metrics.cacheHitRate, 'ratio');
    Sentry.setMeasurement('memory_usage', metrics.memoryUsage, 'byte');
    Sentry.setMeasurement('cpu_usage', metrics.cpuUsage, 'ratio');

    // Set context
    Sentry.setContext('performance', {
      apiResponseTimes: metrics.apiResponseTime,
      databaseQueryTime: metrics.databaseQueryTime,
      cacheHitRate: metrics.cacheHitRate,
      resourceUsage: {
        memory: metrics.memoryUsage,
        cpu: metrics.cpuUsage,
      },
    });

    logger.info('Performance metrics tracked', 'MONITORING', metrics);
  }

  /**
   * Track Business Metrics
   */
  public trackBusinessMetrics(metrics: BusinessMetrics): void {
    // Set business measurements
    Sentry.setMeasurement('daily_active_users', metrics.dailyActiveUsers, 'none');
    Sentry.setMeasurement('learning_completion_rate', metrics.learningCompletionRate, 'ratio');
    Sentry.setMeasurement('user_satisfaction', metrics.userSatisfaction, 'ratio');

    if (metrics.revenueImpact) {
      Sentry.setMeasurement('revenue_impact', metrics.revenueImpact, 'none');
    }

    // Set feature adoption measurements
    Object.entries(metrics.featureAdoption).forEach(([feature, adoption]) => {
      Sentry.setMeasurement(`feature_adoption_${feature}`, adoption, 'ratio');
    });

    // Set context
    Sentry.setContext('business_metrics', {
      dailyActiveUsers: metrics.dailyActiveUsers,
      learningCompletionRate: metrics.learningCompletionRate,
      featureAdoption: metrics.featureAdoption,
      userSatisfaction: metrics.userSatisfaction,
    });

    logger.info('Business metrics tracked', 'MONITORING', metrics);
  }

  /**
   * Track Feature Usage
   */
  public trackFeatureUsage(data: {
    userId: string;
    feature: string;
    action: string;
    metadata?: Record<string, any>;
    success: boolean;
    duration?: number;
  }): void {
    // Set measurements
    if (data.duration) {
      Sentry.setMeasurement(`feature_duration_${data.feature}`, data.duration, 'millisecond');
    }

    // Set tags
    Sentry.setTag('feature', data.feature);
    Sentry.setTag('featureAction', data.action);
    Sentry.setTag('featureSuccess', data.success ? 'true' : 'false');

    // Set context
    Sentry.setContext('feature_usage', {
      feature: data.feature,
      action: data.action,
      metadata: data.metadata,
      success: data.success,
      duration: data.duration,
    });

    // Add breadcrumb
    Sentry.addBreadcrumb({
      category: 'feature-usage',
      message: `Feature used: ${data.feature} - ${data.action}`,
      level: data.success ? 'info' : 'warning',
      data: {
        feature: data.feature,
        action: data.action,
        duration: data.duration,
      },
    });

    logger.info('Feature usage tracked', 'MONITORING', data);
  }

  /**
   * Track Error Impact on Users
   */
  public trackErrorImpact(error: Error, context: {
    userId: string;
    sessionId: string;
    feature: string;
    action: string;
    userImpact: 'low' | 'medium' | 'high';
    recoverable: boolean;
  }): void {
    // Set tags
    Sentry.setTag('errorImpact', context.userImpact);
    Sentry.setTag('errorRecoverable', context.recoverable ? 'true' : 'false');
    Sentry.setTag('errorFeature', context.feature);
    Sentry.setTag('errorAction', context.action);

    // Set context
    Sentry.setContext('error_impact', {
      feature: context.feature,
      action: context.action,
      userImpact: context.userImpact,
      recoverable: context.recoverable,
      userId: context.userId,
      sessionId: context.sessionId,
    });

    // Capture exception with enhanced context
    Sentry.captureException(error);

    logger.sentryError(error, 'ERROR_IMPACT', {
      userId: context.userId,
      sessionId: context.sessionId,
      feature: context.feature,
      userImpact: context.userImpact,
      recoverable: context.recoverable,
    });
  }

  /**
   * Create Custom Performance Transaction
   */
  public createPerformanceTransaction(name: string, op: string, data?: Record<string, any>) {
    return {
      transaction: Sentry.startSpan({ name, op }, () => {
        if (data) {
          Object.entries(data).forEach(([key, value]) => {
            if (typeof value === 'number') {
              Sentry.setMeasurement(key, value, 'none');
            } else {
              Sentry.setTag(key, String(value));
            }
          });
        }
      }),
    };
  }

  /**
   * Track A/B Testing Results
   */
  public trackABTestResult(data: {
    userId: string;
    testName: string;
    variant: string;
    outcome: 'conversion' | 'no_conversion';
    metric?: number;
  }): void {
    // Set measurements
    if (data.metric !== undefined) {
      Sentry.setMeasurement(`ab_test_metric_${data.testName}`, data.metric, 'none');
    }

    // Set tags
    Sentry.setTag('ab_test_name', data.testName);
    Sentry.setTag('ab_test_variant', data.variant);
    Sentry.setTag('ab_test_outcome', data.outcome);

    // Set context
    Sentry.setContext('ab_testing', {
      testName: data.testName,
      variant: data.variant,
      outcome: data.outcome,
      metric: data.metric,
    });

    logger.info('A/B test result tracked', 'MONITORING', data);
  }

  /**
   * Flush metrics buffer (for performance optimization)
   */
  public flushMetricsBuffer(): void {
    if (this.metricsBuffer.length > 0) {
      logger.info('Flushing metrics buffer', 'MONITORING', {
        bufferSize: this.metricsBuffer.length,
      });

      // Process buffered metrics
      this.metricsBuffer.forEach(({ metrics, timestamp }) => {
        // Process each buffered metric
        Sentry.addBreadcrumb({
          category: 'metrics-flush',
          message: 'Buffered metrics processed',
          timestamp: timestamp.getTime() / 1000,
          data: metrics,
        });
      });

      // Clear buffer
      this.metricsBuffer = [];
    }
  }

  /**
   * Get monitoring health status
   */
  public getMonitoringHealth(): {
    sentryConnected: boolean;
    metricsBufferSize: number;
    lastFlush: Date | null;
  } {
    return {
      sentryConnected: true, // We can enhance this with actual connectivity check
      metricsBufferSize: this.metricsBuffer.length,
      lastFlush: new Date(), // Track this properly in production
    };
  }
}

// Export singleton instance
export const sentryMonitoring = SentryMonitoringService.getInstance();

// Export convenience functions
export const trackAIChat = (data: Parameters<typeof sentryMonitoring.trackAIChatPerformance>[0]) =>
  sentryMonitoring.trackAIChatPerformance(data);

export const trackLearning = (data: Parameters<typeof sentryMonitoring.trackLearningAnalytics>[0]) =>
  sentryMonitoring.trackLearningAnalytics(data);

export const trackPerformance = (metrics: PerformanceMetrics) =>
  sentryMonitoring.trackPerformanceMetrics(metrics);

export const trackBusiness = (metrics: BusinessMetrics) =>
  sentryMonitoring.trackBusinessMetrics(metrics);

export const trackFeature = (data: Parameters<typeof sentryMonitoring.trackFeatureUsage>[0]) =>
  sentryMonitoring.trackFeatureUsage(data);

export const trackErrorImpact = (error: Error, context: Parameters<typeof sentryMonitoring.trackErrorImpact>[1]) =>
  sentryMonitoring.trackErrorImpact(error, context);

export const trackABTest = (data: Parameters<typeof sentryMonitoring.trackABTestResult>[0]) =>
  sentryMonitoring.trackABTestResult(data);