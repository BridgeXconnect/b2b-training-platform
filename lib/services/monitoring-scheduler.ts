/**
 * Monitoring Scheduler Service
 * Handles continuous monitoring, health checks, and recovery mechanisms
 */

import { EventEmitter } from 'events';
import { autonomousSentryMonitor } from './autonomous-sentry-monitor';
import { broadcastAgentActivity } from './agent-stream-utils';

export interface SchedulerConfig {
  healthCheckInterval: number; // ms
  restartDelay: number; // ms
  maxRestartAttempts: number;
  enableAutoRestart: boolean;
  enableHealthChecks: boolean;
  gracefulShutdownTimeout: number; // ms
}

export interface HealthStatus {
  isHealthy: boolean;
  lastHealthCheck: Date;
  consecutiveFailures: number;
  uptime: number;
  errors: string[];
}

export class MonitoringScheduler extends EventEmitter {
  private static instance: MonitoringScheduler;
  private isRunning = false;
  private healthCheckTimer: NodeJS.Timeout | null = null;
  private restartAttempts = 0;
  private startTime: Date | null = null;
  private lastHealthCheck: Date | null = null;
  private consecutiveFailures = 0;
  private healthErrors: string[] = [];

  private config: SchedulerConfig = {
    healthCheckInterval: 60 * 1000, // 1 minute
    restartDelay: 5000, // 5 seconds
    maxRestartAttempts: 3,
    enableAutoRestart: true,
    enableHealthChecks: true,
    gracefulShutdownTimeout: 30000, // 30 seconds
  };

  private constructor(config?: Partial<SchedulerConfig>) {
    super();
    if (config) {
      this.config = { ...this.config, ...config };
    }
    this.setMaxListeners(50);
  }

  static getInstance(config?: Partial<SchedulerConfig>): MonitoringScheduler {
    if (!MonitoringScheduler.instance) {
      MonitoringScheduler.instance = new MonitoringScheduler(config);
    }
    return MonitoringScheduler.instance;
  }

  /**
   * Start the monitoring scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Monitoring scheduler is already running');
    }

    this.isRunning = true;
    this.startTime = new Date();
    this.restartAttempts = 0;
    
    this.emit('started');
    await this.broadcastActivity('scheduler_started', {
      config: this.config,
      timestamp: new Date()
    });

    try {
      // Start the autonomous monitor
      await this.startMonitor();

      // Start health checks if enabled
      if (this.config.enableHealthChecks) {
        this.startHealthChecks();
      }

      await this.broadcastActivity('scheduler_ready', {
        healthChecksEnabled: this.config.enableHealthChecks,
        autoRestartEnabled: this.config.enableAutoRestart,
        timestamp: new Date()
      });

    } catch (error) {
      this.emit('error', `Failed to start scheduler: ${error.message}`);
      this.isRunning = false;
      throw error;
    }
  }

  /**
   * Stop the monitoring scheduler
   */
  async stop(graceful = true): Promise<void> {
    if (!this.isRunning) return;

    this.emit('stopping');
    await this.broadcastActivity('scheduler_stopping', {
      graceful,
      timestamp: new Date()
    });

    this.isRunning = false;

    // Stop health checks
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.healthCheckTimer = null;
    }

    // Stop the monitor with graceful shutdown if requested
    if (graceful) {
      try {
        await this.gracefulShutdown();
      } catch (error) {
        this.emit('error', `Graceful shutdown failed: ${error.message}`);
      }
    } else {
      autonomousSentryMonitor.stop();
    }

    this.emit('stopped');
    await this.broadcastActivity('scheduler_stopped', {
      graceful,
      uptime: this.getUptime(),
      timestamp: new Date()
    });
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      uptime: this.getUptime(),
      restartAttempts: this.restartAttempts,
      maxRestartAttempts: this.config.maxRestartAttempts,
      config: this.config,
      health: this.getHealthStatus(),
      monitor: autonomousSentryMonitor.getStats()
    };
  }

  /**
   * Get health status
   */
  getHealthStatus(): HealthStatus {
    return {
      isHealthy: this.consecutiveFailures === 0,
      lastHealthCheck: this.lastHealthCheck || new Date(),
      consecutiveFailures: this.consecutiveFailures,
      uptime: this.getUptime(),
      errors: [...this.healthErrors]
    };
  }

  /**
   * Start the autonomous monitor
   */
  private async startMonitor(): Promise<void> {
    try {
      if (!autonomousSentryMonitor.getStats().isRunning) {
        await autonomousSentryMonitor.start();
        
        await this.broadcastActivity('monitor_started', {
          monitorType: 'autonomous_sentry',
          timestamp: new Date()
        });
      }
    } catch (error) {
      throw new Error(`Failed to start autonomous monitor: ${error.message}`);
    }
  }

  /**
   * Start periodic health checks
   */
  private startHealthChecks(): void {
    this.healthCheckTimer = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.healthCheckInterval);

    this.emit('healthChecksStarted');
  }

  /**
   * Perform a health check
   */
  private async performHealthCheck(): Promise<void> {
    this.lastHealthCheck = new Date();
    
    try {
      // Check if monitor is running
      const monitorStats = autonomousSentryMonitor.getStats();
      
      if (!monitorStats.isRunning) {
        throw new Error('Autonomous monitor is not running');
      }

      // Check if monitor is responsive (not stuck)
      const timeSinceLastScan = monitorStats.lastMonitorTime ? 
        Date.now() - new Date(monitorStats.lastMonitorTime).getTime() : 
        0;
      
      // If it's been more than 2x the monitor interval since last scan, consider it stuck
      const maxTimeSinceLastScan = 2 * 15 * 60 * 1000; // 30 minutes (2x 15min interval)
      if (timeSinceLastScan > maxTimeSinceLastScan) {
        throw new Error(`Monitor appears stuck - no activity for ${Math.round(timeSinceLastScan / 60000)} minutes`);
      }

      // Health check passed
      this.consecutiveFailures = 0;
      this.healthErrors = [];
      
      this.emit('healthCheckPassed');
      await this.broadcastActivity('health_check_passed', {
        monitorStats,
        timeSinceLastScan: Math.round(timeSinceLastScan / 1000),
        timestamp: new Date()
      });

    } catch (error) {
      this.consecutiveFailures++;
      this.healthErrors.push(error.message);
      
      // Keep only last 5 errors
      if (this.healthErrors.length > 5) {
        this.healthErrors = this.healthErrors.slice(-5);
      }

      this.emit('healthCheckFailed', {
        error: error.message,
        consecutiveFailures: this.consecutiveFailures
      });

      await this.broadcastActivity('health_check_failed', {
        error: error.message,
        consecutiveFailures: this.consecutiveFailures,
        timestamp: new Date()
      });

      // Attempt recovery if configured
      if (this.config.enableAutoRestart) {
        await this.attemptRecovery(error.message);
      }
    }
  }

  /**
   * Attempt to recover from health check failures
   */
  private async attemptRecovery(reason: string): Promise<void> {
    if (this.restartAttempts >= this.config.maxRestartAttempts) {
      this.emit('recoveryFailed', {
        reason: 'Max restart attempts exceeded',
        attempts: this.restartAttempts
      });

      await this.broadcastActivity('recovery_failed', {
        reason: 'Max restart attempts exceeded',
        attempts: this.restartAttempts,
        originalError: reason,
        timestamp: new Date()
      });
      
      return;
    }

    this.restartAttempts++;
    
    this.emit('recoveryStarted', {
      reason,
      attempt: this.restartAttempts,
      maxAttempts: this.config.maxRestartAttempts
    });

    await this.broadcastActivity('recovery_started', {
      reason,
      attempt: this.restartAttempts,
      maxAttempts: this.config.maxRestartAttempts,
      timestamp: new Date()
    });

    try {
      // Stop the monitor
      autonomousSentryMonitor.stop();

      // Wait before restarting
      await new Promise(resolve => setTimeout(resolve, this.config.restartDelay));

      // Restart the monitor
      await this.startMonitor();

      // Reset failure count on successful restart
      this.consecutiveFailures = 0;
      this.healthErrors = [];

      this.emit('recoverySucceeded', {
        attempt: this.restartAttempts
      });

      await this.broadcastActivity('recovery_succeeded', {
        attempt: this.restartAttempts,
        timestamp: new Date()
      });

    } catch (error) {
      this.emit('recoveryAttemptFailed', {
        attempt: this.restartAttempts,
        error: error.message
      });

      await this.broadcastActivity('recovery_attempt_failed', {
        attempt: this.restartAttempts,
        error: error.message,
        timestamp: new Date()
      });
    }
  }

  /**
   * Perform graceful shutdown
   */
  private async gracefulShutdown(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Graceful shutdown timeout exceeded'));
      }, this.config.gracefulShutdownTimeout);

      try {
        autonomousSentryMonitor.stop();
        clearTimeout(timeout);
        resolve();
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    });
  }

  /**
   * Get uptime in milliseconds
   */
  private getUptime(): number {
    return this.startTime ? Date.now() - this.startTime.getTime() : 0;
  }

  /**
   * Broadcast activity to dashboard
   */
  private async broadcastActivity(type: string, data: any): Promise<void> {
    try {
      await broadcastAgentActivity(type, {
        ...data,
        source: 'monitoring_scheduler',
        agentType: 'scheduler'
      });
    } catch (error) {
      // Don't fail operations due to broadcast errors
      console.error('Failed to broadcast scheduler activity:', error);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<SchedulerConfig>): void {
    const oldConfig = { ...this.config };
    this.config = { ...this.config, ...newConfig };
    
    this.emit('configUpdated', {
      oldConfig,
      newConfig: this.config
    });

    // Restart health checks if interval changed
    if (newConfig.healthCheckInterval && this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
      this.startHealthChecks();
    }
  }
}

// Export singleton instance
export const monitoringScheduler = MonitoringScheduler.getInstance();