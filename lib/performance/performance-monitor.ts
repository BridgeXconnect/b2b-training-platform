/**
 * Real-Time Performance Monitor
 * 
 * Provides continuous performance monitoring with automated alerts
 * and real-time metrics collection for the AI Course Platform.
 */

import { performanceBaseline, PerformanceBaseline } from './performance-baseline';
import { benchmarkSuite, BenchmarkResult } from './benchmark-suite';
import { sentryMonitoring } from '@/lib/monitoring/sentry-monitoring';
import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export interface MonitoringConfig {
  /** Monitoring interval in milliseconds */
  intervalMs: number;
  /** Enable automatic alerting */
  enableAlerts: boolean;
  /** Alert thresholds */
  alertThresholds: {
    responseTime: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
    coreWebVitalsScore: number;
  };
  /** Performance degradation detection */
  degradationDetection: {
    enabled: boolean;
    windowSize: number; // Number of measurements to consider
    threshold: number; // Percentage degradation to trigger alert
  };
  /** Automatic benchmarking */
  autoBenchmark: {
    enabled: boolean;
    intervalMs: number;
    conditions: string[]; // Conditions that trigger benchmarking
  };
}

export interface PerformanceAlert {
  id: string;
  timestamp: Date;
  type: 'warning' | 'critical' | 'info';
  category: 'api' | 'client' | 'ai' | 'resource' | 'vitals';
  message: string;
  metric: string;
  currentValue: number;
  threshold: number;
  impact: 'low' | 'medium' | 'high';
  recommendations: string[];
  acknowledged: boolean;
}

export interface PerformanceTrend {
  metric: string;
  timeWindow: string;
  trend: 'improving' | 'stable' | 'degrading';
  changePercentage: number;
  significance: 'low' | 'medium' | 'high';
  dataPoints: Array<{
    timestamp: Date;
    value: number;
  }>;
}

export interface MonitoringDashboard {
  timestamp: Date;
  status: 'healthy' | 'warning' | 'critical';
  overallScore: number;
  activeAlerts: PerformanceAlert[];
  trends: PerformanceTrend[];
  realtimeMetrics: {
    apiResponseTime: number;
    errorRate: number;
    activeUsers: number;
    memoryUsage: number;
    coreWebVitals: {
      lcp: number;
      fid: number;
      cls: number;
    };
  };
  recommendations: string[];
  lastBenchmark?: BenchmarkResult;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private isMonitoring = false;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private config: MonitoringConfig;
  private alerts: PerformanceAlert[] = [];
  private metricsHistory: Map<string, Array<{ timestamp: Date; value: number }>> = new Map();
  private lastBaseline: PerformanceBaseline | null = null;
  private alertCallbacks: Array<(alert: PerformanceAlert) => void> = [];

  private constructor() {
    this.config = this.getDefaultConfig();
  }

  public static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * Start performance monitoring
   */
  public start(config?: Partial<MonitoringConfig>): void {
    if (this.isMonitoring) {
      logger.warn('Performance monitoring is already running', 'PERFORMANCE_MONITOR');
      return;
    }

    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.isMonitoring = true;
    this.startMonitoringLoop();
    
    // Setup automatic benchmarking if enabled
    if (this.config.autoBenchmark.enabled) {
      this.setupAutoBenchmarking();
    }

    logger.info('Performance monitoring started', 'PERFORMANCE_MONITOR', {
      intervalMs: this.config.intervalMs,
      enableAlerts: this.config.enableAlerts
    });
  }

  /**
   * Stop performance monitoring
   */
  public stop(): void {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }

    logger.info('Performance monitoring stopped', 'PERFORMANCE_MONITOR');
  }

  /**
   * Start monitoring loop
   */
  private startMonitoringLoop(): void {
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.collectMetrics();
        await this.analyzePerformance();
        await this.checkForAlerts();
      } catch (error) {
        logger.error('Error in monitoring loop', 'PERFORMANCE_MONITOR', { error });
      }
    }, this.config.intervalMs);
  }

  /**
   * Collect performance metrics
   */
  private async collectMetrics(): Promise<void> {
    try {
      // Generate current baseline
      const baseline = await performanceBaseline.generateBaseline('monitor');
      this.lastBaseline = baseline;

      // Store metrics in history
      this.storeMetric('core_web_vitals_lcp', baseline.coreWebVitals.lcp);
      this.storeMetric('core_web_vitals_fid', baseline.coreWebVitals.fid);
      this.storeMetric('core_web_vitals_cls', baseline.coreWebVitals.cls);
      this.storeMetric('memory_usage', baseline.clientSideMetrics.memoryUsage.used);
      this.storeMetric('sentry_performance_score', baseline.sentryPerformanceScore);
      this.storeMetric('user_experience_score', baseline.userExperienceScore);

      // Collect API metrics if available
      if (baseline.apiMetrics.length > 0) {
        const avgResponseTime = baseline.apiMetrics.reduce((sum, m) => sum + m.responseTime, 0) / baseline.apiMetrics.length;
        const errorRate = baseline.apiMetrics.filter(m => m.errorRate > 0).length / baseline.apiMetrics.length;
        
        this.storeMetric('api_response_time', avgResponseTime);
        this.storeMetric('api_error_rate', errorRate);
      }

      // Send metrics to Sentry
      sentryMonitoring.trackPerformanceMetrics({
        apiResponseTime: this.getLatestMetricValue('api_response_time') ? { monitor: this.getLatestMetricValue('api_response_time') } : {},
        databaseQueryTime: 0, // Will be implemented with actual DB monitoring
        cacheHitRate: 0.8, // Default estimate
        memoryUsage: baseline.clientSideMetrics.memoryUsage.used,
        cpuUsage: baseline.resourceUtilization.cpuUsage
      });

    } catch (error) {
      logger.error('Failed to collect performance metrics', 'PERFORMANCE_MONITOR', { error });
    }
  }

  /**
   * Analyze performance trends and patterns
   */
  private async analyzePerformance(): Promise<void> {
    if (!this.lastBaseline) return;

    // Check for performance degradation
    if (this.config.degradationDetection.enabled) {
      await this.detectPerformanceDegradation();
    }

    // Analyze trends
    this.analyzeTrends();

    // Update overall health status
    this.updateHealthStatus();
  }

  /**
   * Detect performance degradation
   */
  private async detectPerformanceDegradation(): Promise<void> {
    const { windowSize, threshold } = this.config.degradationDetection;
    const metricsToCheck = [
      'api_response_time',
      'core_web_vitals_lcp',
      'memory_usage',
      'sentry_performance_score'
    ];

    for (const metric of metricsToCheck) {
      const history = this.metricsHistory.get(metric);
      if (!history || history.length < windowSize) continue;

      const recentValues = history.slice(-windowSize);
      const olderValues = history.slice(-windowSize * 2, -windowSize);

      if (olderValues.length === 0) continue;

      const recentAvg = recentValues.reduce((sum, m) => sum + m.value, 0) / recentValues.length;
      const olderAvg = olderValues.reduce((sum, m) => sum + m.value, 0) / olderValues.length;

      let degradationPercent = 0;
      if (metric === 'sentry_performance_score') {
        // For scores, degradation is when recent is lower than older
        degradationPercent = ((olderAvg - recentAvg) / olderAvg) * 100;
      } else {
        // For times/usage, degradation is when recent is higher than older
        degradationPercent = ((recentAvg - olderAvg) / olderAvg) * 100;
      }

      if (degradationPercent >= threshold) {
        await this.createAlert({
          type: degradationPercent >= threshold * 2 ? 'critical' : 'warning',
          category: this.getMetricCategory(metric),
          message: `Performance degradation detected in ${metric}`,
          metric,
          currentValue: recentAvg,
          threshold: olderAvg * (1 + threshold / 100),
          impact: degradationPercent >= threshold * 2 ? 'high' : 'medium',
          recommendations: this.getDegradationRecommendations(metric, degradationPercent)
        });
      }
    }
  }

  /**
   * Analyze performance trends
   */
  private analyzeTrends(): void {
    // This will be implemented to analyze long-term trends
    // For now, we'll focus on short-term monitoring
  }

  /**
   * Update overall health status
   */
  private updateHealthStatus(): void {
    // Will be implemented to calculate overall system health
  }

  /**
   * Check for performance alerts
   */
  private async checkForAlerts(): Promise<void> {
    if (!this.config.enableAlerts || !this.lastBaseline) return;

    const { alertThresholds } = this.config;

    // Check API response time
    const apiResponseTime = this.getLatestMetricValue('api_response_time');
    if (apiResponseTime && apiResponseTime > alertThresholds.responseTime) {
      await this.createAlert({
        type: apiResponseTime > alertThresholds.responseTime * 2 ? 'critical' : 'warning',
        category: 'api',
        message: 'API response time exceeded threshold',
        metric: 'api_response_time',
        currentValue: apiResponseTime,
        threshold: alertThresholds.responseTime,
        impact: apiResponseTime > alertThresholds.responseTime * 2 ? 'high' : 'medium',
        recommendations: ['Investigate API performance', 'Check database queries', 'Review server resources']
      });
    }

    // Check error rate
    const errorRate = this.getLatestMetricValue('api_error_rate');
    if (errorRate && errorRate > alertThresholds.errorRate) {
      await this.createAlert({
        type: 'critical',
        category: 'api',
        message: 'API error rate exceeded threshold',
        metric: 'api_error_rate',
        currentValue: errorRate,
        threshold: alertThresholds.errorRate,
        impact: 'high',
        recommendations: ['Check error logs', 'Investigate failed requests', 'Review recent deployments']
      });
    }

    // Check memory usage
    const memoryUsage = this.getLatestMetricValue('memory_usage');
    if (memoryUsage && memoryUsage > alertThresholds.memoryUsage) {
      await this.createAlert({
        type: memoryUsage > alertThresholds.memoryUsage * 1.5 ? 'critical' : 'warning',
        category: 'resource',
        message: 'Memory usage exceeded threshold',
        metric: 'memory_usage',
        currentValue: memoryUsage,
        threshold: alertThresholds.memoryUsage,
        impact: memoryUsage > alertThresholds.memoryUsage * 1.5 ? 'high' : 'medium',
        recommendations: ['Check for memory leaks', 'Optimize component lifecycle', 'Review large objects']
      });
    }

    // Check Core Web Vitals
    const lcp = this.getLatestMetricValue('core_web_vitals_lcp');
    if (lcp && lcp > 4000) { // Poor LCP threshold
      await this.createAlert({
        type: 'warning',
        category: 'vitals',
        message: 'Largest Contentful Paint is in poor range',
        metric: 'core_web_vitals_lcp',
        currentValue: lcp,
        threshold: 4000,
        impact: 'medium',
        recommendations: ['Optimize image loading', 'Improve server response time', 'Use CDN']
      });
    }

    // Check Sentry Performance Score
    const sentryScore = this.getLatestMetricValue('sentry_performance_score');
    if (sentryScore && sentryScore < alertThresholds.coreWebVitalsScore) {
      await this.createAlert({
        type: sentryScore < alertThresholds.coreWebVitalsScore * 0.7 ? 'critical' : 'warning',
        category: 'vitals',
        message: 'Sentry performance score below threshold',
        metric: 'sentry_performance_score',
        currentValue: sentryScore,
        threshold: alertThresholds.coreWebVitalsScore,
        impact: sentryScore < alertThresholds.coreWebVitalsScore * 0.7 ? 'high' : 'medium',
        recommendations: ['Review Core Web Vitals', 'Optimize bundle size', 'Improve loading performance']
      });
    }
  }

  /**
   * Create performance alert
   */
  private async createAlert(alertData: Omit<PerformanceAlert, 'id' | 'timestamp' | 'acknowledged'>): Promise<void> {
    const alert: PerformanceAlert = {
      ...alertData,
      id: this.generateAlertId(),
      timestamp: new Date(),
      acknowledged: false
    };

    // Check for duplicate alerts (same metric within last 5 minutes)
    const isDuplicate = this.alerts.some(existingAlert => 
      existingAlert.metric === alert.metric &&
      !existingAlert.acknowledged &&
      (Date.now() - existingAlert.timestamp.getTime()) < 5 * 60 * 1000
    );

    if (isDuplicate) {
      return; // Don't create duplicate alerts
    }

    this.alerts.push(alert);

    // Send to Sentry
    Sentry.addBreadcrumb({
      category: 'performance-alert',
      message: alert.message,
      level: alert.type === 'critical' ? 'error' : 'warning',
      data: {
        metric: alert.metric,
        currentValue: alert.currentValue,
        threshold: alert.threshold,
        impact: alert.impact
      }
    });

    if (alert.type === 'critical') {
      Sentry.captureMessage(`Performance Alert: ${alert.message}`, 'warning');
    }

    // Notify callbacks
    for (const callback of this.alertCallbacks) {
      try {
        callback(alert);
      } catch (error) {
        logger.error('Error in alert callback', 'PERFORMANCE_MONITOR', { error });
      }
    }

    logger.warn('Performance alert created', 'PERFORMANCE_MONITOR', {
      type: alert.type,
      metric: alert.metric,
      currentValue: alert.currentValue,
      threshold: alert.threshold
    });
  }

  /**
   * Setup automatic benchmarking
   */
  private setupAutoBenchmarking(): void {
    setInterval(async () => {
      try {
        // Check conditions for triggering benchmark
        const shouldRunBenchmark = await this.shouldRunAutoBenchmark();
        
        if (shouldRunBenchmark) {
          logger.info('Starting automatic benchmark', 'PERFORMANCE_MONITOR');
          const result = await benchmarkSuite.runBenchmark(benchmarkSuite.getDefaultConfig());
          
          if (!result.passed) {
            await this.createAlert({
              type: 'warning',
              category: 'vitals',
              message: 'Automatic benchmark failed',
              metric: 'benchmark_score',
              currentValue: result.overallScore,
              threshold: 75,
              impact: 'medium',
              recommendations: result.recommendations
            });
          }
        }
      } catch (error) {
        logger.error('Error in automatic benchmarking', 'PERFORMANCE_MONITOR', { error });
      }
    }, this.config.autoBenchmark.intervalMs);
  }

  /**
   * Check if automatic benchmark should run
   */
  private async shouldRunAutoBenchmark(): Promise<boolean> {
    // Check if there are performance issues that warrant benchmarking
    const recentAlerts = this.alerts.filter(alert => 
      !alert.acknowledged && 
      (Date.now() - alert.timestamp.getTime()) < 10 * 60 * 1000
    );

    const hasCriticalAlerts = recentAlerts.some(alert => alert.type === 'critical');
    const hasMultipleWarnings = recentAlerts.filter(alert => alert.type === 'warning').length >= 3;

    return hasCriticalAlerts || hasMultipleWarnings;
  }

  /**
   * Store metric in history
   */
  private storeMetric(metric: string, value: number): void {
    if (!this.metricsHistory.has(metric)) {
      this.metricsHistory.set(metric, []);
    }

    const history = this.metricsHistory.get(metric)!;
    history.push({ timestamp: new Date(), value });

    // Keep only last 1000 entries
    if (history.length > 1000) {
      history.splice(0, history.length - 1000);
    }
  }

  /**
   * Get latest metric value
   */
  private getLatestMetricValue(metric: string): number | null {
    const history = this.metricsHistory.get(metric);
    if (!history || history.length === 0) return null;
    
    return history[history.length - 1].value;
  }

  /**
   * Get metric category for alert
   */
  private getMetricCategory(metric: string): PerformanceAlert['category'] {
    if (metric.startsWith('api_')) return 'api';
    if (metric.startsWith('core_web_vitals_')) return 'vitals';
    if (metric.includes('memory') || metric.includes('cpu')) return 'resource';
    if (metric.includes('ai_')) return 'ai';
    return 'client';
  }

  /**
   * Get degradation recommendations
   */
  private getDegradationRecommendations(metric: string, degradationPercent: number): string[] {
    const baseRecommendations = {
      'api_response_time': ['Optimize database queries', 'Check server resources', 'Review recent code changes'],
      'core_web_vitals_lcp': ['Optimize images', 'Improve server response time', 'Use preloading'],
      'memory_usage': ['Check for memory leaks', 'Optimize component cleanup', 'Review large objects'],
      'sentry_performance_score': ['Review all performance metrics', 'Run comprehensive benchmark', 'Check Core Web Vitals']
    };

    const recommendations = baseRecommendations[metric as keyof typeof baseRecommendations] || ['Investigate recent changes'];
    
    if (degradationPercent > 50) {
      recommendations.unshift('Urgent: Consider rolling back recent changes');
    }

    return recommendations;
  }

  /**
   * Generate alert ID
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Get default monitoring configuration
   */
  private getDefaultConfig(): MonitoringConfig {
    return {
      intervalMs: 30000, // 30 seconds
      enableAlerts: true,
      alertThresholds: {
        responseTime: 1000, // 1 second
        errorRate: 0.05, // 5%
        memoryUsage: 100, // 100MB
        cpuUsage: 80, // 80%
        coreWebVitalsScore: 75 // Sentry performance score
      },
      degradationDetection: {
        enabled: true,
        windowSize: 10, // Last 10 measurements
        threshold: 20 // 20% degradation
      },
      autoBenchmark: {
        enabled: true,
        intervalMs: 30 * 60 * 1000, // 30 minutes
        conditions: ['critical_alerts', 'performance_degradation']
      }
    };
  }

  /**
   * Get monitoring dashboard data
   */
  public getDashboard(): MonitoringDashboard {
    const activeAlerts = this.alerts.filter(alert => !alert.acknowledged);
    const status = this.calculateOverallStatus(activeAlerts);
    
    return {
      timestamp: new Date(),
      status,
      overallScore: this.lastBaseline?.sentryPerformanceScore || 0,
      activeAlerts,
      trends: this.calculateTrends(),
      realtimeMetrics: {
        apiResponseTime: this.getLatestMetricValue('api_response_time') || 0,
        errorRate: this.getLatestMetricValue('api_error_rate') || 0,
        activeUsers: 0, // Will be implemented with user tracking
        memoryUsage: this.getLatestMetricValue('memory_usage') || 0,
        coreWebVitals: {
          lcp: this.getLatestMetricValue('core_web_vitals_lcp') || 0,
          fid: this.getLatestMetricValue('core_web_vitals_fid') || 0,
          cls: this.getLatestMetricValue('core_web_vitals_cls') || 0
        }
      },
      recommendations: this.generateCurrentRecommendations(),
      lastBenchmark: benchmarkSuite.getBenchmarkHistory().slice(-1)[0]
    };
  }

  /**
   * Calculate overall system status
   */
  private calculateOverallStatus(activeAlerts: PerformanceAlert[]): MonitoringDashboard['status'] {
    const criticalAlerts = activeAlerts.filter(alert => alert.type === 'critical');
    const warningAlerts = activeAlerts.filter(alert => alert.type === 'warning');

    if (criticalAlerts.length > 0) return 'critical';
    if (warningAlerts.length >= 3) return 'warning';
    return 'healthy';
  }

  /**
   * Calculate performance trends
   */
  private calculateTrends(): PerformanceTrend[] {
    // Simplified trend calculation - in production this would be more sophisticated
    const trends: PerformanceTrend[] = [];
    const metricsToAnalyze = ['api_response_time', 'memory_usage', 'sentry_performance_score'];

    for (const metric of metricsToAnalyze) {
      const history = this.metricsHistory.get(metric);
      if (!history || history.length < 10) continue;

      const recent = history.slice(-10);
      const older = history.slice(-20, -10);

      if (older.length === 0) continue;

      const recentAvg = recent.reduce((sum, m) => sum + m.value, 0) / recent.length;
      const olderAvg = older.reduce((sum, m) => sum + m.value, 0) / older.length;
      const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;

      let trend: PerformanceTrend['trend'] = 'stable';
      if (Math.abs(changePercent) > 10) {
        if (metric === 'sentry_performance_score') {
          trend = changePercent > 0 ? 'improving' : 'degrading';
        } else {
          trend = changePercent > 0 ? 'degrading' : 'improving';
        }
      }

      trends.push({
        metric,
        timeWindow: '10 minutes',
        trend,
        changePercentage: Math.abs(changePercent),
        significance: Math.abs(changePercent) > 20 ? 'high' : Math.abs(changePercent) > 10 ? 'medium' : 'low',
        dataPoints: recent
      });
    }

    return trends;
  }

  /**
   * Generate current recommendations
   */
  private generateCurrentRecommendations(): string[] {
    const recommendations: string[] = [];
    const activeAlerts = this.alerts.filter(alert => !alert.acknowledged);

    // Get recommendations from active alerts
    activeAlerts.forEach(alert => {
      recommendations.push(...alert.recommendations);
    });

    // Add general recommendations based on metrics
    const sentryScore = this.getLatestMetricValue('sentry_performance_score');
    if (sentryScore && sentryScore < 80) {
      recommendations.push('Consider running a comprehensive performance audit');
    }

    // Remove duplicates
    return [...new Set(recommendations)];
  }

  /**
   * Register alert callback
   */
  public onAlert(callback: (alert: PerformanceAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  /**
   * Acknowledge alert
   */
  public acknowledgeAlert(alertId: string): boolean {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
      logger.info('Alert acknowledged', 'PERFORMANCE_MONITOR', { alertId });
      return true;
    }
    return false;
  }

  /**
   * Get active alerts
   */
  public getActiveAlerts(): PerformanceAlert[] {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  /**
   * Get all alerts
   */
  public getAllAlerts(): PerformanceAlert[] {
    return [...this.alerts];
  }

  /**
   * Clear old alerts
   */
  public clearOldAlerts(maxAge: number = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAge;
    const initialCount = this.alerts.length;
    
    this.alerts = this.alerts.filter(alert => 
      alert.timestamp.getTime() > cutoff || !alert.acknowledged
    );

    const clearedCount = initialCount - this.alerts.length;
    
    if (clearedCount > 0) {
      logger.info('Cleared old alerts', 'PERFORMANCE_MONITOR', { clearedCount });
    }

    return clearedCount;
  }

  /**
   * Get monitoring status
   */
  public getStatus(): { isMonitoring: boolean; config: MonitoringConfig; metricsCount: number } {
    return {
      isMonitoring: this.isMonitoring,
      config: this.config,
      metricsCount: Array.from(this.metricsHistory.values()).reduce((sum, history) => sum + history.length, 0)
    };
  }

  /**
   * Update monitoring configuration
   */
  public updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Restart monitoring if it's running and interval changed
    if (this.isMonitoring && newConfig.intervalMs && newConfig.intervalMs !== this.config.intervalMs) {
      this.stop();
      this.start();
    }

    logger.info('Monitoring configuration updated', 'PERFORMANCE_MONITOR', newConfig);
  }
}

// Export singleton instance
export const performanceMonitor = PerformanceMonitor.getInstance();

// Export convenience functions
export const startMonitoring = (config?: Partial<MonitoringConfig>) => performanceMonitor.start(config);
export const stopMonitoring = () => performanceMonitor.stop();
export const getDashboard = () => performanceMonitor.getDashboard();
export const getActiveAlerts = () => performanceMonitor.getActiveAlerts();
export const acknowledgeAlert = (alertId: string) => performanceMonitor.acknowledgeAlert(alertId);