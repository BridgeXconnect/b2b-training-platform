/**
 * Monitoring infrastructure for CopilotKit AI actions
 */

import {
  ActionMonitoringEvent,
  IActionMonitor,
  ActionMetrics,
  ActionContext,
  ActionError
} from '../types';

/**
 * Monitoring event types
 */
export enum MonitoringEventType {
  ACTION_START = 'action_start',
  ACTION_SUCCESS = 'action_success',
  ACTION_FAILURE = 'action_failure',
  VALIDATION_ERROR = 'validation_error',
  RATE_LIMIT_HIT = 'rate_limit_hit',
  RETRY_ATTEMPT = 'retry_attempt',
  PERFORMANCE_WARNING = 'performance_warning'
}

/**
 * Performance thresholds
 */
export interface PerformanceThresholds {
  warningMs: number;
  criticalMs: number;
  maxTokens: number;
}

/**
 * Monitoring configuration
 */
export interface MonitoringConfig {
  enabled: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  performanceThresholds: PerformanceThresholds;
  metricsRetentionDays: number;
  alertingEnabled: boolean;
}

/**
 * Action metrics storage
 */
interface StoredMetrics {
  [actionId: string]: ActionMetrics & {
    hourlyStats: {
      [hour: string]: {
        executions: number;
        successes: number;
        failures: number;
        avgDuration: number;
      };
    };
    dailyStats: {
      [date: string]: {
        executions: number;
        successes: number;
        failures: number;
        avgDuration: number;
        peakHour: string;
      };
    };
  };
}

/**
 * Alert configuration
 */
interface AlertConfig {
  type: 'error_rate' | 'performance' | 'rate_limit' | 'availability';
  threshold: number;
  windowMinutes: number;
  cooldownMinutes: number;
}

/**
 * Action monitor implementation
 */
export class ActionMonitor implements IActionMonitor {
  private config: MonitoringConfig;
  private metrics: StoredMetrics = {};
  private events: ActionMonitoringEvent[] = [];
  private alerts: Map<string, Date> = new Map(); // Alert type -> Last alert time
  private eventListeners: ((event: ActionMonitoringEvent) => void)[] = [];
  
  private static instance: ActionMonitor;
  
  constructor(config?: Partial<MonitoringConfig>) {
    this.config = {
      enabled: true,
      logLevel: 'info',
      performanceThresholds: {
        warningMs: 3000,
        criticalMs: 10000,
        maxTokens: 4000
      },
      metricsRetentionDays: 30,
      alertingEnabled: true,
      ...config
    };
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(config?: Partial<MonitoringConfig>): ActionMonitor {
    if (!ActionMonitor.instance) {
      ActionMonitor.instance = new ActionMonitor(config);
    }
    return ActionMonitor.instance;
  }
  
  /**
   * Track monitoring event
   */
  track(event: ActionMonitoringEvent): void {
    if (!this.config.enabled) return;
    
    // Store event
    this.events.push(event);
    
    // Update metrics
    this.updateMetrics(event);
    
    // Check for alerts
    this.checkAlerts(event);
    
    // Log event
    this.logEvent(event);
    
    // Notify listeners
    this.notifyListeners(event);
    
    // Clean up old events
    this.cleanupOldEvents();
  }
  
  /**
   * Get metrics for specific action
   */
  getMetrics(actionId: string): ActionMetrics {
    const stored = this.metrics[actionId];
    if (!stored) {
      return {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        errorRate: 0
      };
    }
    
    const { hourlyStats, dailyStats, ...metrics } = stored;
    return metrics;
  }
  
  /**
   * Get global metrics
   */
  getGlobalMetrics(): {
    totalActions: number;
    totalExecutions: number;
    averageSuccessRate: number;
    topActions: { actionId: string; executions: number }[];
  } {
    const actionIds = Object.keys(this.metrics);
    let totalExecutions = 0;
    let totalSuccesses = 0;
    const actionExecutions: { actionId: string; executions: number }[] = [];
    
    for (const actionId of actionIds) {
      const metrics = this.metrics[actionId];
      totalExecutions += metrics.totalExecutions;
      totalSuccesses += metrics.successfulExecutions;
      actionExecutions.push({
        actionId,
        executions: metrics.totalExecutions
      });
    }
    
    // Sort by executions and take top 10
    const topActions = actionExecutions
      .sort((a, b) => b.executions - a.executions)
      .slice(0, 10);
    
    return {
      totalActions: actionIds.length,
      totalExecutions,
      averageSuccessRate: totalExecutions > 0 ? totalSuccesses / totalExecutions : 0,
      topActions
    };
  }
  
  /**
   * Get performance insights
   */
  getPerformanceInsights(actionId?: string): {
    slowestActions: { actionId: string; avgDuration: number }[];
    performanceWarnings: { actionId: string; warningCount: number }[];
    tokenUsage: { actionId: string; avgTokens: number }[];
  } {
    const insights = {
      slowestActions: [] as { actionId: string; avgDuration: number }[],
      performanceWarnings: [] as { actionId: string; warningCount: number }[],
      tokenUsage: [] as { actionId: string; avgTokens: number }[]
    };
    
    const targetActions = actionId ? [actionId] : Object.keys(this.metrics);
    
    for (const id of targetActions) {
      const metrics = this.metrics[id];
      if (!metrics) continue;
      
      insights.slowestActions.push({
        actionId: id,
        avgDuration: metrics.averageExecutionTime
      });
      
      // Count performance warnings
      const warnings = this.events.filter(
        e => e.actionId === id && 
        e.duration && 
        e.duration > this.config.performanceThresholds.warningMs
      ).length;
      
      if (warnings > 0) {
        insights.performanceWarnings.push({
          actionId: id,
          warningCount: warnings
        });
      }
    }
    
    // Sort results
    insights.slowestActions.sort((a, b) => b.avgDuration - a.avgDuration);
    insights.performanceWarnings.sort((a, b) => b.warningCount - a.warningCount);
    
    return insights;
  }
  
  /**
   * Get hourly statistics
   */
  getHourlyStats(actionId: string, date: Date = new Date()): {
    hour: string;
    executions: number;
    successRate: number;
    avgDuration: number;
  }[] {
    const metrics = this.metrics[actionId];
    if (!metrics?.hourlyStats) return [];
    
    const dateKey = date.toISOString().split('T')[0];
    const stats: any[] = [];
    
    for (let hour = 0; hour < 24; hour++) {
      const hourKey = `${dateKey}T${hour.toString().padStart(2, '0')}`;
      const hourStats = metrics.hourlyStats[hourKey];
      
      if (hourStats) {
        stats.push({
          hour: `${hour}:00`,
          executions: hourStats.executions,
          successRate: hourStats.executions > 0 ? hourStats.successes / hourStats.executions : 0,
          avgDuration: hourStats.avgDuration
        });
      }
    }
    
    return stats;
  }
  
  /**
   * Update metrics based on event
   */
  private updateMetrics(event: ActionMonitoringEvent): void {
    const { actionId } = event;
    
    if (!this.metrics[actionId]) {
      this.metrics[actionId] = {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageExecutionTime: 0,
        errorRate: 0,
        lastExecutionTime: new Date(),
        hourlyStats: {},
        dailyStats: {}
      };
    }
    
    const metrics = this.metrics[actionId];
    const hourKey = this.getHourKey(event.timestamp);
    const dayKey = this.getDayKey(event.timestamp);
    
    // Initialize hourly stats if needed
    if (!metrics.hourlyStats[hourKey]) {
      metrics.hourlyStats[hourKey] = {
        executions: 0,
        successes: 0,
        failures: 0,
        avgDuration: 0
      };
    }
    
    // Initialize daily stats if needed
    if (!metrics.dailyStats[dayKey]) {
      metrics.dailyStats[dayKey] = {
        executions: 0,
        successes: 0,
        failures: 0,
        avgDuration: 0,
        peakHour: ''
      };
    }
    
    const hourStats = metrics.hourlyStats[hourKey];
    const dayStats = metrics.dailyStats[dayKey];
    
    switch (event.eventType) {
      case 'success':
        metrics.totalExecutions++;
        metrics.successfulExecutions++;
        hourStats.executions++;
        hourStats.successes++;
        dayStats.executions++;
        dayStats.successes++;
        
        if (event.duration) {
          // Update average execution time
          metrics.averageExecutionTime = 
            (metrics.averageExecutionTime * (metrics.totalExecutions - 1) + event.duration) / 
            metrics.totalExecutions;
          
          // Update hourly average
          hourStats.avgDuration = 
            (hourStats.avgDuration * (hourStats.executions - 1) + event.duration) / 
            hourStats.executions;
          
          // Update daily average
          dayStats.avgDuration = 
            (dayStats.avgDuration * (dayStats.executions - 1) + event.duration) / 
            dayStats.executions;
        }
        break;
        
      case 'failure':
        metrics.totalExecutions++;
        metrics.failedExecutions++;
        hourStats.executions++;
        hourStats.failures++;
        dayStats.executions++;
        dayStats.failures++;
        break;
    }
    
    // Update error rate
    metrics.errorRate = metrics.failedExecutions / metrics.totalExecutions;
    metrics.lastExecutionTime = event.timestamp;
    
    // Update peak hour
    this.updatePeakHour(actionId, dayKey);
  }
  
  /**
   * Check for alert conditions
   */
  private checkAlerts(event: ActionMonitoringEvent): void {
    if (!this.config.alertingEnabled) return;
    
    const alerts: AlertConfig[] = [
      {
        type: 'error_rate',
        threshold: 0.1, // 10% error rate
        windowMinutes: 5,
        cooldownMinutes: 15
      },
      {
        type: 'performance',
        threshold: this.config.performanceThresholds.criticalMs,
        windowMinutes: 5,
        cooldownMinutes: 10
      },
      {
        type: 'rate_limit',
        threshold: 3, // 3 rate limit hits
        windowMinutes: 1,
        cooldownMinutes: 5
      }
    ];
    
    for (const alert of alerts) {
      if (this.shouldTriggerAlert(event, alert)) {
        this.triggerAlert(event, alert);
      }
    }
  }
  
  /**
   * Check if alert should be triggered
   */
  private shouldTriggerAlert(event: ActionMonitoringEvent, alert: AlertConfig): boolean {
    // Check cooldown
    const lastAlert = this.alerts.get(`${event.actionId}-${alert.type}`);
    if (lastAlert) {
      const cooldownEnd = new Date(lastAlert.getTime() + alert.cooldownMinutes * 60 * 1000);
      if (new Date() < cooldownEnd) {
        return false;
      }
    }
    
    // Check alert conditions
    const windowStart = new Date(Date.now() - alert.windowMinutes * 60 * 1000);
    const recentEvents = this.events.filter(
      e => e.actionId === event.actionId && e.timestamp > windowStart
    );
    
    switch (alert.type) {
      case 'error_rate':
        const failures = recentEvents.filter(e => e.eventType === 'failure').length;
        const total = recentEvents.filter(e => ['success', 'failure'].includes(e.eventType)).length;
        return total > 0 && failures / total > alert.threshold;
        
      case 'performance':
        return event.duration !== undefined && event.duration > alert.threshold;
        
      case 'rate_limit':
        const rateLimitHits = recentEvents.filter(e => e.error?.code === 'RATE_LIMIT_EXCEEDED').length;
        return rateLimitHits >= alert.threshold;
        
      default:
        return false;
    }
  }
  
  /**
   * Trigger alert
   */
  private triggerAlert(event: ActionMonitoringEvent, alert: AlertConfig): void {
    const alertKey = `${event.actionId}-${alert.type}`;
    this.alerts.set(alertKey, new Date());
    
    console.error(`[ALERT] ${alert.type} for action ${event.actionId}`, {
      event,
      alert,
      timestamp: new Date()
    });
    
    // In production, this would send alerts to monitoring services
  }
  
  /**
   * Log event based on log level
   */
  private logEvent(event: ActionMonitoringEvent): void {
    const logData = {
      ...event,
      timestamp: event.timestamp.toISOString()
    };
    
    switch (event.eventType) {
      case 'failure':
      case 'validation_error':
        if (['error', 'warn', 'info', 'debug'].includes(this.config.logLevel)) {
          console.error('[ACTION MONITOR]', logData);
        }
        break;
        
      case 'rate_limit_hit':
      case 'performance_warning':
        if (['warn', 'info', 'debug'].includes(this.config.logLevel)) {
          console.warn('[ACTION MONITOR]', logData);
        }
        break;
        
      case 'start':
      case 'success':
        if (['info', 'debug'].includes(this.config.logLevel)) {
          console.log('[ACTION MONITOR]', logData);
        }
        break;
        
      default:
        if (this.config.logLevel === 'debug') {
          console.debug('[ACTION MONITOR]', logData);
        }
    }
  }
  
  /**
   * Add event listener
   */
  addEventListener(listener: (event: ActionMonitoringEvent) => void): void {
    this.eventListeners.push(listener);
  }
  
  /**
   * Remove event listener
   */
  removeEventListener(listener: (event: ActionMonitoringEvent) => void): void {
    this.eventListeners = this.eventListeners.filter(l => l !== listener);
  }
  
  /**
   * Notify event listeners
   */
  private notifyListeners(event: ActionMonitoringEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in monitoring event listener:', error);
      }
    });
  }
  
  /**
   * Clean up old events
   */
  private cleanupOldEvents(): void {
    const retentionDate = new Date();
    retentionDate.setDate(retentionDate.getDate() - this.config.metricsRetentionDays);
    
    this.events = this.events.filter(e => e.timestamp > retentionDate);
    
    // Clean up old stats
    for (const actionId in this.metrics) {
      const metrics = this.metrics[actionId];
      
      // Clean hourly stats
      for (const hourKey in metrics.hourlyStats) {
        const hourDate = new Date(hourKey);
        if (hourDate < retentionDate) {
          delete metrics.hourlyStats[hourKey];
        }
      }
      
      // Clean daily stats
      for (const dayKey in metrics.dailyStats) {
        const dayDate = new Date(dayKey);
        if (dayDate < retentionDate) {
          delete metrics.dailyStats[dayKey];
        }
      }
    }
  }
  
  /**
   * Update peak hour for daily stats
   */
  private updatePeakHour(actionId: string, dayKey: string): void {
    const metrics = this.metrics[actionId];
    if (!metrics) return;
    
    let peakHour = '';
    let peakExecutions = 0;
    
    for (const hourKey in metrics.hourlyStats) {
      if (hourKey.startsWith(dayKey)) {
        const hourStats = metrics.hourlyStats[hourKey];
        if (hourStats.executions > peakExecutions) {
          peakExecutions = hourStats.executions;
          peakHour = hourKey.split('T')[1];
        }
      }
    }
    
    if (metrics.dailyStats[dayKey]) {
      metrics.dailyStats[dayKey].peakHour = peakHour;
    }
  }
  
  /**
   * Get hour key for timestamp
   */
  private getHourKey(date: Date): string {
    return date.toISOString().substring(0, 13);
  }
  
  /**
   * Get day key for timestamp
   */
  private getDayKey(date: Date): string {
    return date.toISOString().substring(0, 10);
  }
  
  /**
   * Export metrics for analysis
   */
  exportMetrics(): {
    metrics: StoredMetrics;
    events: ActionMonitoringEvent[];
    exportDate: Date;
  } {
    return {
      metrics: JSON.parse(JSON.stringify(this.metrics)),
      events: [...this.events],
      exportDate: new Date()
    };
  }
  
  /**
   * Reset all metrics
   */
  resetMetrics(): void {
    this.metrics = {};
    this.events = [];
    this.alerts.clear();
  }
}