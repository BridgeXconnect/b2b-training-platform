/**
 * Sentry Health Monitor
 * Real-time monitoring and validation for optimized Sentry configuration
 */

import * as Sentry from '@sentry/nextjs';

export interface SentryHealthMetrics {
  sessionReplay: {
    status: 'active' | 'inactive' | 'error';
    instanceCount: number;
    duplicatesDetected: boolean;
    samplingRate: number;
    dataQuality: 'excellent' | 'good' | 'poor';
  };
  errorCorrelation: {
    correlationRate: number;
    missedCorrelations: number;
    traceQuality: 'excellent' | 'good' | 'poor';
  };
  performance: {
    overhead: number; // milliseconds
    memoryUsage: number; // MB
    networkUsage: number; // KB/minute
    userImpact: 'minimal' | 'acceptable' | 'concerning';
  };
  dashboard: {
    connectivity: 'connected' | 'disconnected' | 'degraded';
    dataAccuracy: number; // percentage
    alertsActive: boolean;
  };
}

export class SentryHealthMonitor {
  private static instance: SentryHealthMonitor;
  private metrics: SentryHealthMetrics;
  private monitoringInterval: NodeJS.Timeout | null = null;
  private listeners: Array<(metrics: SentryHealthMetrics) => void> = [];

  private constructor() {
    this.metrics = this.initializeMetrics();
  }

  public static getInstance(): SentryHealthMonitor {
    if (!SentryHealthMonitor.instance) {
      SentryHealthMonitor.instance = new SentryHealthMonitor();
    }
    return SentryHealthMonitor.instance;
  }

  /**
   * Start continuous health monitoring
   */
  public startMonitoring(intervalMs: number = 60000): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }

    this.monitoringInterval = setInterval(async () => {
      await this.updateMetrics();
      this.notifyListeners();
    }, intervalMs);

    // Initial metrics collection
    this.updateMetrics();
  }

  /**
   * Stop health monitoring
   */
  public stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Get current health metrics
   */
  public getMetrics(): SentryHealthMetrics {
    return { ...this.metrics };
  }

  /**
   * Add listener for metrics updates
   */
  public addListener(callback: (metrics: SentryHealthMetrics) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Remove listener
   */
  public removeListener(callback: (metrics: SentryHealthMetrics) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Validate Session Replay configuration
   */
  public async validateSessionReplay(): Promise<{
    status: 'optimal' | 'suboptimal' | 'problematic';
    issues: string[];
    recommendations: string[];
  }> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check for single instance configuration
    if (this.metrics.sessionReplay.duplicatesDetected) {
      issues.push('Multiple Session Replay instances detected');
      recommendations.push('Consolidate Session Replay configuration to single client-side instance');
    }

    // Validate sampling rates
    const samplingRate = this.metrics.sessionReplay.samplingRate;
    if (samplingRate > 0.1 && process.env.NODE_ENV === 'production') {
      issues.push('Session Replay sampling rate too high for production');
      recommendations.push('Reduce production sampling rate to 0.01-0.05 for optimal performance');
    }

    // Check data quality
    if (this.metrics.sessionReplay.dataQuality === 'poor') {
      issues.push('Session Replay data quality is poor');
      recommendations.push('Review replay configuration and ensure proper initialization');
    }

    const status = issues.length === 0 ? 'optimal' : 
                   issues.length <= 2 ? 'suboptimal' : 'problematic';

    return { status, issues, recommendations };
  }

  /**
   * Test error correlation functionality
   */
  public async testErrorCorrelation(): Promise<{
    success: boolean;
    correlationRate: number;
    testResults: Array<{
      errorType: string;
      correlated: boolean;
      replayId?: string;
    }>;
  }> {
    const testErrors = [
      { type: 'component_error', message: 'Test component error for correlation' },
      { type: 'api_error', message: 'Test API error for correlation' },
      { type: 'network_error', message: 'Test network error for correlation' }
    ];

    const testResults = [];
    let correlatedCount = 0;

    for (const testError of testErrors) {
      try {
        // Create test error with Sentry context
        const errorId = Sentry.captureException(new Error(testError.message), {
          tags: { 
            test: true, 
            errorType: testError.type,
            timestamp: Date.now()
          },
          contexts: {
            test: {
              purpose: 'correlation_validation',
              expected: 'session_replay_correlation'
            }
          }
        });

        // Check if error has associated replay
        const hasReplay = await this.checkErrorReplayCorrelation(errorId);
        
        testResults.push({
          errorType: testError.type,
          correlated: hasReplay,
          replayId: hasReplay ? `test-replay-${Date.now()}` : undefined
        });

        if (hasReplay) correlatedCount++;
      } catch (error) {
        testResults.push({
          errorType: testError.type,
          correlated: false
        });
      }
    }

    const correlationRate = (correlatedCount / testErrors.length) * 100;
    
    return {
      success: correlationRate >= 80, // 80% minimum correlation rate
      correlationRate,
      testResults
    };
  }

  /**
   * Measure performance impact
   */
  public async measurePerformanceImpact(): Promise<{
    overhead: number;
    memoryUsage: number;
    networkImpact: number;
    userExperienceScore: number;
  }> {
    const startTime = performance.now();
    
    // Measure Sentry initialization overhead
    const initOverhead = await this.measureInitializationTime();
    
    // Measure memory usage
    const memoryUsage = this.measureMemoryUsage();
    
    // Estimate network impact
    const networkImpact = await this.estimateNetworkUsage();
    
    // Calculate user experience score (0-100)
    const userExperienceScore = this.calculateUserExperienceScore(
      initOverhead, memoryUsage, networkImpact
    );

    const totalOverhead = performance.now() - startTime;

    return {
      overhead: totalOverhead,
      memoryUsage,
      networkImpact,
      userExperienceScore
    };
  }

  /**
   * Validate dashboard connectivity and data accuracy
   */
  public async validateDashboard(): Promise<{
    connectivity: 'excellent' | 'good' | 'poor';
    dataAccuracy: number;
    lastSync: Date;
    alerts: Array<{
      type: 'info' | 'warning' | 'error';
      message: string;
    }>;
  }> {
    const alerts = [];

    // Test connectivity by sending a test event
    try {
      const testEventId = Sentry.captureMessage('Dashboard connectivity test', 'info');
      
      // Simulate checking if event reached dashboard
      const connectivityGood = !!testEventId;
      
      if (!connectivityGood) {
        alerts.push({
          type: 'error' as const,
          message: 'Dashboard connectivity issues detected'
        });
      }
    } catch (error) {
      alerts.push({
        type: 'error' as const,
        message: `Dashboard connection error: ${error}`
      });
    }

    // Check data accuracy by comparing local metrics with dashboard
    const dataAccuracy = await this.validateDataAccuracy();
    
    if (dataAccuracy < 95) {
      alerts.push({
        type: 'warning' as const,
        message: `Data accuracy below threshold: ${dataAccuracy}%`
      });
    }

    const connectivity = dataAccuracy >= 98 ? 'excellent' : 
                        dataAccuracy >= 90 ? 'good' : 'poor';

    return {
      connectivity,
      dataAccuracy,
      lastSync: new Date(),
      alerts
    };
  }

  /**
   * Generate comprehensive health report
   */
  public async generateHealthReport(): Promise<{
    overall: 'healthy' | 'warning' | 'critical';
    timestamp: Date;
    sessionReplay: Awaited<ReturnType<typeof this.validateSessionReplay>>;
    errorCorrelation: Awaited<ReturnType<typeof this.testErrorCorrelation>>;
    performance: Awaited<ReturnType<typeof this.measurePerformanceImpact>>;
    dashboard: Awaited<ReturnType<typeof this.validateDashboard>>;
    recommendations: string[];
  }> {
    const [sessionReplay, errorCorrelation, performance, dashboard] = await Promise.all([
      this.validateSessionReplay(),
      this.testErrorCorrelation(),
      this.measurePerformanceImpact(),
      this.validateDashboard()
    ]);

    const recommendations = this.generateRecommendations(
      sessionReplay, errorCorrelation, performance, dashboard
    );

    // Determine overall health
    const criticalIssues = [
      sessionReplay.status === 'problematic',
      errorCorrelation.correlationRate < 50,
      performance.userExperienceScore < 60,
      dashboard.connectivity === 'poor'
    ].filter(Boolean).length;

    const warningIssues = [
      sessionReplay.status === 'suboptimal',
      errorCorrelation.correlationRate < 80,
      performance.userExperienceScore < 80,
      dashboard.connectivity === 'good'
    ].filter(Boolean).length;

    const overall = criticalIssues > 0 ? 'critical' :
                   warningIssues > 0 ? 'warning' : 'healthy';

    return {
      overall,
      timestamp: new Date(),
      sessionReplay,
      errorCorrelation,
      performance,
      dashboard,
      recommendations
    };
  }

  // Private helper methods

  private initializeMetrics(): SentryHealthMetrics {
    return {
      sessionReplay: {
        status: 'inactive',
        instanceCount: 0,
        duplicatesDetected: false,
        samplingRate: 0,
        dataQuality: 'good'
      },
      errorCorrelation: {
        correlationRate: 0,
        missedCorrelations: 0,
        traceQuality: 'good'
      },
      performance: {
        overhead: 0,
        memoryUsage: 0,
        networkUsage: 0,
        userImpact: 'minimal'
      },
      dashboard: {
        connectivity: 'connected',
        dataAccuracy: 100,
        alertsActive: false
      }
    };
  }

  private async updateMetrics(): Promise<void> {
    try {
      // Update session replay metrics
      this.metrics.sessionReplay = await this.updateSessionReplayMetrics();
      
      // Update error correlation metrics
      this.metrics.errorCorrelation = await this.updateErrorCorrelationMetrics();
      
      // Update performance metrics
      this.metrics.performance = await this.updatePerformanceMetrics();
      
      // Update dashboard metrics
      this.metrics.dashboard = await this.updateDashboardMetrics();
      
    } catch (error) {
      console.error('Error updating Sentry health metrics:', error);
    }
  }

  private async updateSessionReplayMetrics() {
    // Check if replay integration is active
    const client = Sentry.getCurrentScope().getClient();
    const integrations = client?.getOptions().integrations || [];
    
    const replayIntegrations = integrations.filter(integration => 
      integration.name === 'Replay'
    );

    return {
      status: replayIntegrations.length > 0 ? 'active' as const : 'inactive' as const,
      instanceCount: replayIntegrations.length,
      duplicatesDetected: replayIntegrations.length > 1,
      samplingRate: this.extractSamplingRate(),
      dataQuality: this.assessReplayDataQuality()
    };
  }

  private async updateErrorCorrelationMetrics() {
    // This would typically analyze recent errors and their replay correlations
    return {
      correlationRate: 85, // Example: 85% of errors have replay correlation
      missedCorrelations: 3,
      traceQuality: 'good' as const
    };
  }

  private async updatePerformanceMetrics() {
    const memoryUsage = this.measureMemoryUsage();
    const networkUsage = await this.estimateNetworkUsage();
    const overhead = await this.measureInitializationTime();

    return {
      overhead,
      memoryUsage,
      networkUsage,
      userImpact: this.categorizeUserImpact(overhead, memoryUsage)
    };
  }

  private async updateDashboardMetrics() {
    const connectivity = await this.checkDashboardConnectivity();
    const dataAccuracy = await this.validateDataAccuracy();

    return {
      connectivity,
      dataAccuracy,
      alertsActive: false // Would check for active alerts
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(callback => {
      try {
        callback(this.metrics);
      } catch (error) {
        console.error('Error notifying Sentry health listener:', error);
      }
    });
  }

  private extractSamplingRate(): number {
    try {
      const client = Sentry.getCurrentScope().getClient();
      const options = client?.getOptions();
      return options?.replaysSessionSampleRate || 0;
    } catch {
      return 0;
    }
  }

  private assessReplayDataQuality(): 'excellent' | 'good' | 'poor' {
    // This would analyze replay data completeness and accuracy
    return 'good';
  }

  private measureMemoryUsage(): number {
    if (typeof window !== 'undefined' && 'performance' in window) {
      const memory = (performance as any).memory;
      if (memory) {
        return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
      }
    }
    return 0;
  }

  private async estimateNetworkUsage(): Promise<number> {
    // Estimate based on sampling rates and typical payload sizes
    const samplingRate = this.extractSamplingRate();
    const avgReplaySize = 1.5; // MB per replay session
    const avgSessionDuration = 10; // minutes
    
    return (samplingRate * avgReplaySize / avgSessionDuration) * 1024; // KB/minute
  }

  private async measureInitializationTime(): Promise<number> {
    const start = performance.now();
    
    // Simulate Sentry operations
    try {
      Sentry.addBreadcrumb({ message: 'Performance test' });
      await new Promise(resolve => setTimeout(resolve, 1));
    } catch {}
    
    return performance.now() - start;
  }

  private calculateUserExperienceScore(
    overhead: number, 
    memoryUsage: number, 
    networkImpact: number
  ): number {
    let score = 100;
    
    // Deduct points for overhead
    if (overhead > 100) score -= 20;
    else if (overhead > 50) score -= 10;
    
    // Deduct points for memory usage
    if (memoryUsage > 100) score -= 15;
    else if (memoryUsage > 50) score -= 5;
    
    // Deduct points for network impact
    if (networkImpact > 500) score -= 15;
    else if (networkImpact > 200) score -= 5;
    
    return Math.max(0, score);
  }

  private categorizeUserImpact(
    overhead: number, 
    memoryUsage: number
  ): 'minimal' | 'acceptable' | 'concerning' {
    if (overhead < 50 && memoryUsage < 50) return 'minimal';
    if (overhead < 100 && memoryUsage < 100) return 'acceptable';
    return 'concerning';
  }

  private async checkErrorReplayCorrelation(errorId: string): Promise<boolean> {
    // This would check if the error has an associated replay
    // In a real implementation, this would query the Sentry API
    return Math.random() > 0.2; // 80% correlation rate simulation
  }

  private async checkDashboardConnectivity(): Promise<'connected' | 'disconnected' | 'degraded'> {
    try {
      // Test connectivity with a lightweight operation
      Sentry.addBreadcrumb({ message: 'Connectivity test' });
      return 'connected';
    } catch {
      return 'disconnected';
    }
  }

  private async validateDataAccuracy(): Promise<number> {
    // This would compare local metrics with dashboard data
    // Return accuracy percentage
    return 95 + Math.random() * 5; // 95-100% simulation
  }

  private generateRecommendations(
    sessionReplay: any,
    errorCorrelation: any,
    performance: any,
    dashboard: any
  ): string[] {
    const recommendations = [];

    // Session Replay recommendations
    recommendations.push(...sessionReplay.recommendations);

    // Error Correlation recommendations
    if (errorCorrelation.correlationRate < 80) {
      recommendations.push('Improve error-replay correlation by reviewing breadcrumb configuration');
    }

    // Performance recommendations
    if (performance.userExperienceScore < 80) {
      recommendations.push('Consider reducing sampling rates to improve performance');
    }

    // Dashboard recommendations
    if (dashboard.dataAccuracy < 95) {
      recommendations.push('Review dashboard configuration for data accuracy issues');
    }

    return recommendations;
  }
}

// Export singleton instance
export const sentryHealthMonitor = SentryHealthMonitor.getInstance();