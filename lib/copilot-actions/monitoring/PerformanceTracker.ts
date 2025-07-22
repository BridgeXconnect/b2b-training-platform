/**
 * Performance tracking utilities for AI actions
 */

import { ActionContext } from '../types';

/**
 * Performance metrics
 */
export interface PerformanceMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: {
    before: NodeJS.MemoryUsage;
    after?: NodeJS.MemoryUsage;
    delta?: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
  };
  cpuUsage?: {
    before: NodeJS.CpuUsage;
    after?: NodeJS.CpuUsage;
    delta?: {
      user: number;
      system: number;
    };
  };
  tokensUsed?: number;
  apiCalls?: {
    service: string;
    duration: number;
    status: 'success' | 'failure';
  }[];
}

/**
 * Performance tracker class
 */
export class PerformanceTracker {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  
  /**
   * Start tracking performance for an action
   */
  start(actionId: string, context: ActionContext): void {
    const key = this.getKey(actionId, context);
    
    this.metrics.set(key, {
      startTime: Date.now(),
      memoryUsage: {
        before: process.memoryUsage()
      },
      cpuUsage: {
        before: process.cpuUsage()
      },
      apiCalls: []
    });
  }
  
  /**
   * End tracking and calculate metrics
   */
  end(actionId: string, context: ActionContext): PerformanceMetrics | null {
    const key = this.getKey(actionId, context);
    const metrics = this.metrics.get(key);
    
    if (!metrics) {
      console.warn(`No performance tracking found for action ${actionId}`);
      return null;
    }
    
    const endTime = Date.now();
    const afterMemory = process.memoryUsage();
    const afterCpu = process.cpuUsage();
    
    // Calculate deltas
    metrics.endTime = endTime;
    metrics.duration = endTime - metrics.startTime;
    
    if (metrics.memoryUsage) {
      metrics.memoryUsage.after = afterMemory;
      metrics.memoryUsage.delta = {
        rss: afterMemory.rss - metrics.memoryUsage.before.rss,
        heapTotal: afterMemory.heapTotal - metrics.memoryUsage.before.heapTotal,
        heapUsed: afterMemory.heapUsed - metrics.memoryUsage.before.heapUsed,
        external: afterMemory.external - metrics.memoryUsage.before.external
      };
    }
    
    if (metrics.cpuUsage && metrics.cpuUsage.before) {
      metrics.cpuUsage.after = afterCpu;
      metrics.cpuUsage.delta = {
        user: afterCpu.user - metrics.cpuUsage.before.user,
        system: afterCpu.system - metrics.cpuUsage.before.system
      };
    }
    
    // Clean up
    this.metrics.delete(key);
    
    return metrics;
  }
  
  /**
   * Track API call
   */
  trackApiCall(
    actionId: string,
    context: ActionContext,
    service: string,
    duration: number,
    status: 'success' | 'failure'
  ): void {
    const key = this.getKey(actionId, context);
    const metrics = this.metrics.get(key);
    
    if (metrics && metrics.apiCalls) {
      metrics.apiCalls.push({ service, duration, status });
    }
  }
  
  /**
   * Track token usage
   */
  trackTokenUsage(
    actionId: string,
    context: ActionContext,
    tokens: number
  ): void {
    const key = this.getKey(actionId, context);
    const metrics = this.metrics.get(key);
    
    if (metrics) {
      metrics.tokensUsed = (metrics.tokensUsed || 0) + tokens;
    }
  }
  
  /**
   * Get current metrics without ending tracking
   */
  getMetrics(actionId: string, context: ActionContext): PerformanceMetrics | null {
    const key = this.getKey(actionId, context);
    return this.metrics.get(key) || null;
  }
  
  /**
   * Generate performance report
   */
  generateReport(metrics: PerformanceMetrics): string {
    const report: string[] = [
      '=== Performance Report ===',
      `Duration: ${metrics.duration}ms`,
    ];
    
    if (metrics.memoryUsage?.delta) {
      report.push(
        '\nMemory Usage:',
        `  RSS: ${this.formatBytes(metrics.memoryUsage.delta.rss)}`,
        `  Heap Total: ${this.formatBytes(metrics.memoryUsage.delta.heapTotal)}`,
        `  Heap Used: ${this.formatBytes(metrics.memoryUsage.delta.heapUsed)}`,
        `  External: ${this.formatBytes(metrics.memoryUsage.delta.external)}`
      );
    }
    
    if (metrics.cpuUsage?.delta) {
      report.push(
        '\nCPU Usage:',
        `  User: ${(metrics.cpuUsage.delta.user / 1000).toFixed(2)}ms`,
        `  System: ${(metrics.cpuUsage.delta.system / 1000).toFixed(2)}ms`
      );
    }
    
    if (metrics.tokensUsed) {
      report.push(`\nTokens Used: ${metrics.tokensUsed}`);
    }
    
    if (metrics.apiCalls && metrics.apiCalls.length > 0) {
      report.push('\nAPI Calls:');
      metrics.apiCalls.forEach(call => {
        report.push(`  ${call.service}: ${call.duration}ms (${call.status})`);
      });
    }
    
    return report.join('\n');
  }
  
  /**
   * Check if performance is within acceptable bounds
   */
  checkPerformance(
    metrics: PerformanceMetrics,
    thresholds: {
      maxDuration?: number;
      maxMemory?: number;
      maxTokens?: number;
    }
  ): { passed: boolean; violations: string[] } {
    const violations: string[] = [];
    
    if (thresholds.maxDuration && metrics.duration && metrics.duration > thresholds.maxDuration) {
      violations.push(`Duration exceeded: ${metrics.duration}ms > ${thresholds.maxDuration}ms`);
    }
    
    if (thresholds.maxMemory && metrics.memoryUsage?.delta) {
      const totalMemory = metrics.memoryUsage.delta.heapUsed;
      if (totalMemory > thresholds.maxMemory) {
        violations.push(`Memory exceeded: ${this.formatBytes(totalMemory)} > ${this.formatBytes(thresholds.maxMemory)}`);
      }
    }
    
    if (thresholds.maxTokens && metrics.tokensUsed && metrics.tokensUsed > thresholds.maxTokens) {
      violations.push(`Tokens exceeded: ${metrics.tokensUsed} > ${thresholds.maxTokens}`);
    }
    
    return {
      passed: violations.length === 0,
      violations
    };
  }
  
  /**
   * Get performance summary for multiple executions
   */
  static calculateSummary(metricsArray: PerformanceMetrics[]): {
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    avgTokens: number;
    totalTokens: number;
    successRate: number;
  } {
    if (metricsArray.length === 0) {
      return {
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        avgTokens: 0,
        totalTokens: 0,
        successRate: 0
      };
    }
    
    const durations = metricsArray
      .map(m => m.duration)
      .filter((d): d is number => d !== undefined);
    
    const tokens = metricsArray
      .map(m => m.tokensUsed || 0);
    
    const apiCalls = metricsArray
      .flatMap(m => m.apiCalls || []);
    
    const successfulCalls = apiCalls.filter(c => c.status === 'success').length;
    
    return {
      avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations),
      avgTokens: tokens.reduce((a, b) => a + b, 0) / tokens.length,
      totalTokens: tokens.reduce((a, b) => a + b, 0),
      successRate: apiCalls.length > 0 ? successfulCalls / apiCalls.length : 1
    };
  }
  
  /**
   * Get unique key for tracking
   */
  private getKey(actionId: string, context: ActionContext): string {
    return `${actionId}-${context.sessionId}-${Date.now()}`;
  }
  
  /**
   * Format bytes to human readable
   */
  private formatBytes(bytes: number): string {
    const sign = bytes < 0 ? '-' : '';
    bytes = Math.abs(bytes);
    
    if (bytes < 1024) {
      return `${sign}${bytes}B`;
    } else if (bytes < 1024 * 1024) {
      return `${sign}${(bytes / 1024).toFixed(2)}KB`;
    } else if (bytes < 1024 * 1024 * 1024) {
      return `${sign}${(bytes / (1024 * 1024)).toFixed(2)}MB`;
    } else {
      return `${sign}${(bytes / (1024 * 1024 * 1024)).toFixed(2)}GB`;
    }
  }
}

/**
 * Global performance tracker instance
 */
export const performanceTracker = new PerformanceTracker();

/**
 * Performance decorator for methods
 */
export function trackPerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  
  descriptor.value = async function(...args: any[]) {
    const actionId = `${target.constructor.name}.${propertyKey}`;
    const context: ActionContext = {
      sessionId: `perf-${Date.now()}`,
      timestamp: new Date(),
      metadata: {}
    };
    
    performanceTracker.start(actionId, context);
    
    try {
      const result = await originalMethod.apply(this, args);
      const metrics = performanceTracker.end(actionId, context);
      
      if (metrics && metrics.duration && metrics.duration > 1000) {
        console.warn(`Slow method detected: ${actionId} took ${metrics.duration}ms`);
      }
      
      return result;
    } catch (error) {
      performanceTracker.end(actionId, context);
      throw error;
    }
  };
  
  return descriptor;
}