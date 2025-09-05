/**
 * Integration Health Monitor
 * Real-time monitoring and validation of integration points during error scenarios
 */

import { EventEmitter } from 'events';
import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// Health check interfaces
interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  details: any;
  timestamp: string;
}

interface IntegrationPoint {
  name: string;
  type: 'api' | 'database' | 'external' | 'service';
  url: string;
  dependencies: string[];
  healthCheck: () => Promise<HealthCheckResult>;
  fallback?: () => Promise<void>;
}

interface MonitoringMetrics {
  uptime: number;
  errorRate: number;
  averageResponseTime: number;
  throughput: number;
  lastFailure?: string;
  recoveryTime?: number;
}

// Real-time health monitoring system
class IntegrationHealthMonitor extends EventEmitter {
  private integrationPoints: Map<string, IntegrationPoint> = new Map();
  private healthHistory: Map<string, HealthCheckResult[]> = new Map();
  private metrics: Map<string, MonitoringMetrics> = new Map();
  private monitoring: boolean = false;
  private monitoringInterval?: NodeJS.Timeout;
  private checkInterval: number = 30000; // 30 seconds
  private alertThresholds = {
    errorRate: 10, // 10%
    responseTime: 5000, // 5 seconds
    downtime: 300000 // 5 minutes
  };

  constructor() {
    super();
    this.setupIntegrationPoints();
    this.ensureDirectories();
  }

  // Initialize integration points
  private setupIntegrationPoints() {
    // Frontend integration points
    this.addIntegrationPoint({
      name: 'frontend-health',
      type: 'service',
      url: 'http://localhost:3000/api/health',
      dependencies: [],
      healthCheck: this.checkFrontendHealth.bind(this)
    });

    // Backend API integration
    this.addIntegrationPoint({
      name: 'backend-api',
      type: 'api',
      url: 'http://localhost:3000/api',
      dependencies: ['frontend-health'],
      healthCheck: this.checkBackendApi.bind(this)
    });

    // OpenAI API integration
    this.addIntegrationPoint({
      name: 'openai-api',
      type: 'external',
      url: 'https://api.openai.com/v1/models',
      dependencies: ['backend-api'],
      healthCheck: this.checkOpenAIApi.bind(this)
    });

    // Sentry integration
    this.addIntegrationPoint({
      name: 'sentry-monitoring',
      type: 'external',
      url: 'https://sentry.io/api/0/',
      dependencies: [],
      healthCheck: this.checkSentryIntegration.bind(this)
    });

    // Database simulation (since we don't have actual DB in test)
    this.addIntegrationPoint({
      name: 'database-health',
      type: 'database',
      url: 'mock://database',
      dependencies: [],
      healthCheck: this.checkDatabaseHealth.bind(this)
    });

    // Voice analysis service
    this.addIntegrationPoint({
      name: 'voice-analysis',
      type: 'api',
      url: 'http://localhost:3000/api/voice/analyze',
      dependencies: ['backend-api', 'openai-api'],
      healthCheck: this.checkVoiceAnalysisService.bind(this)
    });

    // Chat service
    this.addIntegrationPoint({
      name: 'chat-service',
      type: 'api',
      url: 'http://localhost:3000/api/chat',
      dependencies: ['backend-api', 'openai-api'],
      healthCheck: this.checkChatService.bind(this)
    });
  }

  // Add integration point
  addIntegrationPoint(point: IntegrationPoint) {
    this.integrationPoints.set(point.name, point);
    this.healthHistory.set(point.name, []);
    this.metrics.set(point.name, {
      uptime: 100,
      errorRate: 0,
      averageResponseTime: 0,
      throughput: 0
    });

    this.log(`Added integration point: ${point.name}`, 'info');
  }

  // Start monitoring
  async startMonitoring() {
    if (this.monitoring) {
      this.log('Monitoring already started', 'warning');
      return;
    }

    this.monitoring = true;
    this.log('🔍 Starting integration health monitoring...', 'info');

    // Initial health check
    await this.performHealthChecks();

    // Set up periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      await this.performHealthChecks();
    }, this.checkInterval);

    this.emit('monitoring-started');
  }

  // Stop monitoring
  stopMonitoring() {
    if (!this.monitoring) {
      return;
    }

    this.monitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    this.log('🛑 Stopped integration health monitoring', 'info');
    this.emit('monitoring-stopped');
  }

  // Perform health checks on all integration points
  private async performHealthChecks() {
    const startTime = Date.now();
    const promises: Promise<void>[] = [];

    for (const [name, point] of this.integrationPoints) {
      promises.push(this.checkIntegrationPoint(name, point));
    }

    await Promise.allSettled(promises);

    const duration = Date.now() - startTime;
    this.log(`Health check cycle completed in ${duration}ms`, 'info');

    // Update metrics
    this.updateMetrics();

    // Check for alerts
    this.checkAlerts();

    // Emit health update
    this.emit('health-update', this.getHealthSummary());
  }

  // Check individual integration point
  private async checkIntegrationPoint(name: string, point: IntegrationPoint) {
    try {
      const startTime = Date.now();
      const result = await point.healthCheck();
      const responseTime = Date.now() - startTime;

      result.responseTime = responseTime;
      result.timestamp = new Date().toISOString();

      // Store result
      const history = this.healthHistory.get(name) || [];
      history.push(result);
      
      // Keep only last 100 results
      if (history.length > 100) {
        history.shift();
      }
      
      this.healthHistory.set(name, history);

      // Emit specific health check result
      this.emit('health-check-result', { name, result });

      // Check if this is a status change
      const previousResult = history[history.length - 2];
      if (previousResult && previousResult.status !== result.status) {
        this.emit('status-change', { name, from: previousResult.status, to: result.status, result });
        
        if (result.status === 'unhealthy') {
          this.handleServiceFailure(name, point, result);
        } else if (result.status === 'healthy' && previousResult.status === 'unhealthy') {
          this.handleServiceRecovery(name, result);
        }
      }

    } catch (error) {
      const errorResult: HealthCheckResult = {
        service: name,
        status: 'unhealthy',
        responseTime: 0,
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: new Date().toISOString()
      };

      const history = this.healthHistory.get(name) || [];
      history.push(errorResult);
      this.healthHistory.set(name, history);

      this.emit('health-check-error', { name, error });
    }
  }

  // Handle service failure
  private async handleServiceFailure(name: string, point: IntegrationPoint, result: HealthCheckResult) {
    this.log(`🚨 Service failure detected: ${name}`, 'error');
    
    // Check if fallback is available
    if (point.fallback) {
      try {
        await point.fallback();
        this.log(`Fallback activated for ${name}`, 'warning');
        this.emit('fallback-activated', { name, result });
      } catch (error) {
        this.log(`Fallback failed for ${name}: ${error}`, 'error');
        this.emit('fallback-failed', { name, error });
      }
    }

    // Emit alert
    this.emit('service-failure', { name, result });
  }

  // Handle service recovery
  private handleServiceRecovery(name: string, result: HealthCheckResult) {
    this.log(`✅ Service recovered: ${name}`, 'success');
    
    // Calculate recovery time
    const history = this.healthHistory.get(name) || [];
    const lastFailure = history.slice().reverse().find(h => h.status === 'unhealthy');
    
    if (lastFailure) {
      const recoveryTime = new Date(result.timestamp).getTime() - new Date(lastFailure.timestamp).getTime();
      const metrics = this.metrics.get(name)!;
      metrics.recoveryTime = recoveryTime;
      this.metrics.set(name, metrics);
    }

    this.emit('service-recovery', { name, result });
  }

  // Update metrics
  private updateMetrics() {
    for (const [name, history] of this.healthHistory) {
      const metrics = this.metrics.get(name)!;
      
      if (history.length === 0) continue;

      // Calculate uptime (last 24 hours or available data)
      const recentHistory = history.slice(-48); // Last 48 checks (24 hours if checking every 30min)
      const healthyChecks = recentHistory.filter(h => h.status === 'healthy').length;
      metrics.uptime = (healthyChecks / recentHistory.length) * 100;

      // Calculate error rate
      const errorChecks = recentHistory.filter(h => h.status === 'unhealthy').length;
      metrics.errorRate = (errorChecks / recentHistory.length) * 100;

      // Calculate average response time
      const responseTimes = recentHistory.filter(h => h.responseTime > 0).map(h => h.responseTime);
      metrics.averageResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length 
        : 0;

      // Update last failure
      const lastFailure = recentHistory.slice().reverse().find(h => h.status === 'unhealthy');
      if (lastFailure) {
        metrics.lastFailure = lastFailure.timestamp;
      }

      this.metrics.set(name, metrics);
    }
  }

  // Check for alerts
  private checkAlerts() {
    for (const [name, metrics] of this.metrics) {
      // High error rate alert
      if (metrics.errorRate > this.alertThresholds.errorRate) {
        this.emit('alert', {
          type: 'high-error-rate',
          service: name,
          value: metrics.errorRate,
          threshold: this.alertThresholds.errorRate
        });
      }

      // High response time alert
      if (metrics.averageResponseTime > this.alertThresholds.responseTime) {
        this.emit('alert', {
          type: 'high-response-time',
          service: name,
          value: metrics.averageResponseTime,
          threshold: this.alertThresholds.responseTime
        });
      }

      // Extended downtime alert
      if (metrics.lastFailure) {
        const downtime = Date.now() - new Date(metrics.lastFailure).getTime();
        if (downtime > this.alertThresholds.downtime) {
          this.emit('alert', {
            type: 'extended-downtime',
            service: name,
            value: downtime,
            threshold: this.alertThresholds.downtime
          });
        }
      }
    }
  }

  // Health check implementations
  private async checkFrontendHealth(): Promise<HealthCheckResult> {
    try {
      const response = await fetch('http://localhost:3000/api/health', {
        method: 'GET',
        timeout: 5000
      } as any);

      const status = response.ok ? 'healthy' : 'degraded';
      
      return {
        service: 'frontend-health',
        status,
        responseTime: 0, // Will be set by caller
        details: {
          status: response.status,
          headers: Object.fromEntries(response.headers.entries())
        },
        timestamp: ''
      };
    } catch (error) {
      return {
        service: 'frontend-health',
        status: 'unhealthy',
        responseTime: 0,
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: ''
      };
    }
  }

  private async checkBackendApi(): Promise<HealthCheckResult> {
    try {
      // Test basic API endpoint
      const response = await fetch('http://localhost:3000/api/health', {
        method: 'GET',
        timeout: 5000
      } as any);

      const status = response.ok ? 'healthy' : 'degraded';
      
      return {
        service: 'backend-api',
        status,
        responseTime: 0,
        details: {
          status: response.status,
          available: response.ok
        },
        timestamp: ''
      };
    } catch (error) {
      return {
        service: 'backend-api',
        status: 'unhealthy',
        responseTime: 0,
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: ''
      };
    }
  }

  private async checkOpenAIApi(): Promise<HealthCheckResult> {
    try {
      // Test OpenAI API availability (without actual API call)
      const hasApiKey = process.env.OPENAI_API_KEY !== undefined;
      
      if (!hasApiKey) {
        return {
          service: 'openai-api',
          status: 'degraded',
          responseTime: 0,
          details: { message: 'API key not configured' },
          timestamp: ''
        };
      }

      // Simulate API health check
      return {
        service: 'openai-api',
        status: 'healthy',
        responseTime: 0,
        details: { apiKeyConfigured: true },
        timestamp: ''
      };
    } catch (error) {
      return {
        service: 'openai-api',
        status: 'unhealthy',
        responseTime: 0,
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: ''
      };
    }
  }

  private async checkSentryIntegration(): Promise<HealthCheckResult> {
    try {
      const hasDsn = process.env.SENTRY_DSN !== undefined;
      
      return {
        service: 'sentry-monitoring',
        status: hasDsn ? 'healthy' : 'degraded',
        responseTime: 0,
        details: { 
          dsnConfigured: hasDsn,
          environment: process.env.NODE_ENV 
        },
        timestamp: ''
      };
    } catch (error) {
      return {
        service: 'sentry-monitoring',
        status: 'unhealthy',
        responseTime: 0,
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: ''
      };
    }
  }

  private async checkDatabaseHealth(): Promise<HealthCheckResult> {
    // Simulate database health check
    try {
      // In real implementation, this would check actual database connection
      const isHealthy = Math.random() > 0.1; // 90% healthy simulation
      
      return {
        service: 'database-health',
        status: isHealthy ? 'healthy' : 'degraded',
        responseTime: 0,
        details: { 
          connectionPool: isHealthy ? 'available' : 'limited',
          activeConnections: Math.floor(Math.random() * 10)
        },
        timestamp: ''
      };
    } catch (error) {
      return {
        service: 'database-health',
        status: 'unhealthy',
        responseTime: 0,
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: ''
      };
    }
  }

  private async checkVoiceAnalysisService(): Promise<HealthCheckResult> {
    try {
      // Check if voice analysis endpoint is responsive
      const response = await fetch('http://localhost:3000/api/voice/health', {
        method: 'GET',
        timeout: 3000
      } as any).catch(() => null);

      if (response?.ok) {
        return {
          service: 'voice-analysis',
          status: 'healthy',
          responseTime: 0,
          details: { endpoint: 'available' },
          timestamp: ''
        };
      } else {
        return {
          service: 'voice-analysis',
          status: 'degraded',
          responseTime: 0,
          details: { endpoint: 'unavailable', fallback: 'available' },
          timestamp: ''
        };
      }
    } catch (error) {
      return {
        service: 'voice-analysis',
        status: 'unhealthy',
        responseTime: 0,
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: ''
      };
    }
  }

  private async checkChatService(): Promise<HealthCheckResult> {
    try {
      // Check if chat service is responsive
      const response = await fetch('http://localhost:3000/api/chat/health', {
        method: 'GET',
        timeout: 3000
      } as any).catch(() => null);

      if (response?.ok) {
        return {
          service: 'chat-service',
          status: 'healthy',
          responseTime: 0,
          details: { endpoint: 'available' },
          timestamp: ''
        };
      } else {
        return {
          service: 'chat-service',
          status: 'degraded',
          responseTime: 0,
          details: { endpoint: 'unavailable', fallback: 'basic_mode' },
          timestamp: ''
        };
      }
    } catch (error) {
      return {
        service: 'chat-service',
        status: 'unhealthy',
        responseTime: 0,
        details: { error: error instanceof Error ? error.message : String(error) },
        timestamp: ''
      };
    }
  }

  // Get health summary
  getHealthSummary() {
    const summary = {
      timestamp: new Date().toISOString(),
      overallStatus: 'healthy' as 'healthy' | 'degraded' | 'unhealthy',
      services: {} as Record<string, any>,
      alerts: [] as any[],
      metrics: {
        totalServices: this.integrationPoints.size,
        healthyServices: 0,
        degradedServices: 0,
        unhealthyServices: 0,
        averageUptime: 0,
        averageResponseTime: 0
      }
    };

    let totalUptime = 0;
    let totalResponseTime = 0;
    let serviceCount = 0;

    for (const [name, history] of this.healthHistory) {
      const lastCheck = history[history.length - 1];
      const metrics = this.metrics.get(name)!;

      if (lastCheck) {
        summary.services[name] = {
          status: lastCheck.status,
          responseTime: lastCheck.responseTime,
          uptime: metrics.uptime,
          errorRate: metrics.errorRate,
          lastCheck: lastCheck.timestamp
        };

        // Count service statuses
        if (lastCheck.status === 'healthy') {
          summary.metrics.healthyServices++;
        } else if (lastCheck.status === 'degraded') {
          summary.metrics.degradedServices++;
        } else {
          summary.metrics.unhealthyServices++;
        }

        totalUptime += metrics.uptime;
        totalResponseTime += metrics.averageResponseTime;
        serviceCount++;
      }
    }

    // Calculate overall metrics
    if (serviceCount > 0) {
      summary.metrics.averageUptime = totalUptime / serviceCount;
      summary.metrics.averageResponseTime = totalResponseTime / serviceCount;
    }

    // Determine overall status
    if (summary.metrics.unhealthyServices > 0) {
      summary.overallStatus = 'unhealthy';
    } else if (summary.metrics.degradedServices > 0) {
      summary.overallStatus = 'degraded';
    } else {
      summary.overallStatus = 'healthy';
    }

    return summary;
  }

  // Generate detailed report
  generateHealthReport(): any {
    const summary = this.getHealthSummary();
    const detailedHistory = {};

    for (const [name, history] of this.healthHistory) {
      detailedHistory[name] = history.slice(-24); // Last 24 checks
    }

    return {
      ...summary,
      detailedHistory,
      configuration: {
        checkInterval: this.checkInterval,
        alertThresholds: this.alertThresholds,
        monitoringStarted: this.monitoring ? 'active' : 'inactive'
      },
      integrationPoints: Array.from(this.integrationPoints.keys()).map(name => {
        const point = this.integrationPoints.get(name)!;
        return {
          name,
          type: point.type,
          dependencies: point.dependencies,
          hasFallback: !!point.fallback
        };
      })
    };
  }

  // Save health report to file
  saveHealthReport(): string {
    const report = this.generateHealthReport();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `health-report-${timestamp}.json`;
    const filepath = join(process.cwd(), 'test-scripts/__tests__/reports', filename);

    writeFileSync(filepath, JSON.stringify(report, null, 2));
    this.log(`Health report saved: ${filepath}`, 'success');

    return filepath;
  }

  // Ensure required directories exist
  private ensureDirectories() {
    const dirs = [
      'test-scripts/__tests__/reports',
      'test-scripts/__tests__/logs'
    ];

    dirs.forEach(dir => {
      const fullPath = join(process.cwd(), dir);
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  // Logging utility
  private log(message: string, level: 'info' | 'warning' | 'error' | 'success' = 'info') {
    const colors = {
      info: '\x1b[34m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      success: '\x1b[32m',
      reset: '\x1b[0m'
    };

    const timestamp = new Date().toISOString();
    console.log(`${colors[level]}[${timestamp}] ${message}${colors.reset}`);
  }
}

// Export for use in tests and scripts
export default IntegrationHealthMonitor;

// CLI usage
if (require.main === module) {
  const monitor = new IntegrationHealthMonitor();

  // Set up event listeners
  monitor.on('monitoring-started', () => {
    console.log('🔍 Integration health monitoring started');
  });

  monitor.on('service-failure', ({ name, result }) => {
    console.log(`🚨 SERVICE FAILURE: ${name} - ${result.details?.error || 'Unknown error'}`);
  });

  monitor.on('service-recovery', ({ name }) => {
    console.log(`✅ SERVICE RECOVERED: ${name}`);
  });

  monitor.on('alert', (alert) => {
    console.log(`🚨 ALERT: ${alert.type} for ${alert.service} - Value: ${alert.value}, Threshold: ${alert.threshold}`);
  });

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down health monitor...');
    monitor.stopMonitoring();
    
    // Save final report
    const reportPath = monitor.saveHealthReport();
    console.log(`Final health report saved: ${reportPath}`);
    
    process.exit(0);
  });

  // Start monitoring
  monitor.startMonitoring();

  console.log('Integration Health Monitor is running. Press Ctrl+C to stop and generate report.');
}