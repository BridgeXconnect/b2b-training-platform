/**
 * Performance Baseline Measurement System
 * 
 * Provides comprehensive performance measurement utilities for establishing
 * and monitoring performance baselines across the AI Course Platform.
 */

import * as Sentry from '@sentry/nextjs';
import { logger } from '@/lib/logger';

export interface CoreWebVitals {
  /** Largest Contentful Paint - measures loading performance */
  lcp: number;
  /** First Input Delay - measures interactivity */
  fid: number;
  /** Cumulative Layout Shift - measures visual stability */
  cls: number;
  /** Time to First Byte - measures server response time */
  ttfb: number;
  /** First Contentful Paint - measures when first content appears */
  fcp: number;
  /** Time to Interactive - measures when page becomes interactive */
  tti: number;
}

export interface APIPerformanceMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  requestSize?: number;
  responseSize?: number;
  errorRate: number;
  throughput: number; // requests per second
  timestamp: Date;
}

export interface ClientSideMetrics {
  /** JavaScript bundle size in bytes */
  bundleSize: {
    initial: number;
    total: number;
    compressed: number;
  };
  /** Memory usage in MB */
  memoryUsage: {
    used: number;
    limit: number;
    percentage: number;
  };
  /** Script execution time */
  scriptExecutionTime: number;
  /** DOM parsing time */
  domParsingTime: number;
  /** Resource loading time */
  resourceLoadTime: number;
}

export interface AIFeatureMetrics {
  /** Voice analysis processing time */
  voiceAnalysisTime: number;
  /** Content generation time */
  contentGenerationTime: number;
  /** Chat response time */
  chatResponseTime: number;
  /** Assessment generation time */
  assessmentGenerationTime: number;
  /** Token usage metrics */
  tokenUsage: {
    input: number;
    output: number;
    total: number;
    cost?: number;
  };
}

export interface ResourceUtilization {
  /** Memory usage in MB */
  memoryUsage: number;
  /** CPU utilization percentage */
  cpuUsage: number;
  /** Network bandwidth in MB/s */
  networkBandwidth: number;
  /** Storage usage in MB */
  storageUsage: number;
  /** Cache hit rate */
  cacheHitRate: number;
}

export interface PerformanceBaseline {
  timestamp: Date;
  version: string;
  environment: 'development' | 'staging' | 'production';
  coreWebVitals: CoreWebVitals;
  apiMetrics: APIPerformanceMetrics[];
  clientSideMetrics: ClientSideMetrics;
  aiFeatureMetrics: AIFeatureMetrics;
  resourceUtilization: ResourceUtilization;
  sentryPerformanceScore: number;
  userExperienceScore: number;
}

export interface PerformanceThresholds {
  coreWebVitals: {
    lcp: { good: number; needsImprovement: number; poor: number };
    fid: { good: number; needsImprovement: number; poor: number };
    cls: { good: number; needsImprovement: number; poor: number };
    ttfb: { good: number; needsImprovement: number; poor: number };
    fcp: { good: number; needsImprovement: number; poor: number };
    tti: { good: number; needsImprovement: number; poor: number };
  };
  api: {
    responseTime: { good: number; acceptable: number; poor: number };
    errorRate: { good: number; acceptable: number; poor: number };
  };
  ai: {
    voiceAnalysis: { good: number; acceptable: number; poor: number };
    contentGeneration: { good: number; acceptable: number; poor: number };
    chatResponse: { good: number; acceptable: number; poor: number };
  };
  resources: {
    memoryUsage: { good: number; acceptable: number; poor: number };
    cpuUsage: { good: number; acceptable: number; poor: number };
    bundleSize: { good: number; acceptable: number; poor: number };
  };
}

export class PerformanceBaselineService {
  private static instance: PerformanceBaselineService;
  private performanceObserver: PerformanceObserver | null = null;
  private metrics: Map<string, number[]> = new Map();
  private thresholds: PerformanceThresholds;

  constructor() {
    this.thresholds = this.getDefaultThresholds();
    this.initializePerformanceObserver();
  }

  public static getInstance(): PerformanceBaselineService {
    if (!PerformanceBaselineService.instance) {
      PerformanceBaselineService.instance = new PerformanceBaselineService();
    }
    return PerformanceBaselineService.instance;
  }

  /**
   * Initialize Performance Observer for Web Vitals tracking
   */
  private initializePerformanceObserver(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    try {
      // Observe navigation and paint entries
      this.performanceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.processPerformanceEntry(entry);
        });
      });

      this.performanceObserver.observe({ 
        entryTypes: ['navigation', 'paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] 
      });

      logger.info('Performance observer initialized', 'PERFORMANCE');
    } catch (error) {
      logger.error('Failed to initialize performance observer', 'PERFORMANCE', { error });
    }
  }

  /**
   * Process individual performance entries
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    const metric = entry.name || entry.entryType;
    const value = entry.startTime + (entry.duration || 0);

    if (!this.metrics.has(metric)) {
      this.metrics.set(metric, []);
    }

    this.metrics.get(metric)!.push(value);

    // Send to Sentry for tracking
    Sentry.setMeasurement(`perf_${metric.replace(/[^a-zA-Z0-9]/g, '_')}`, value, 'millisecond');
  }

  /**
   * Measure Core Web Vitals
   */
  public async measureCoreWebVitals(): Promise<CoreWebVitals> {
    if (typeof window === 'undefined') {
      return this.getDefaultCoreWebVitals();
    }

    return new Promise((resolve) => {
      const vitals: Partial<CoreWebVitals> = {};
      let metricsCollected = 0;
      const totalMetrics = 6;

      const checkComplete = () => {
        metricsCollected++;
        if (metricsCollected >= totalMetrics) {
          resolve({
            lcp: vitals.lcp || 0,
            fid: vitals.fid || 0,
            cls: vitals.cls || 0,
            ttfb: vitals.ttfb || 0,
            fcp: vitals.fcp || 0,
            tti: vitals.tti || 0,
          });
        }
      };

      // Measure LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEventTiming[];
        const lastEntry = entries[entries.length - 1];
        vitals.lcp = lastEntry.startTime;
        checkComplete();
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // Measure FID
      new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEventTiming[];
        entries.forEach((entry) => {
          vitals.fid = entry.processingStart - entry.startTime;
        });
        checkComplete();
      }).observe({ entryTypes: ['first-input'] });

      // Measure CLS
      let clsValue = 0;
      new PerformanceObserver((list) => {
        const entries = list.getEntries() as LayoutShift[];
        entries.forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        vitals.cls = clsValue;
        checkComplete();
      }).observe({ entryTypes: ['layout-shift'] });

      // Measure Navigation Timing metrics
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        vitals.ttfb = navigation.responseStart - navigation.requestStart;
        vitals.fcp = performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0;
        vitals.tti = this.calculateTTI(navigation);
        checkComplete();
        checkComplete();
        checkComplete();
      } else {
        // Fallback for missing navigation timing
        vitals.ttfb = 0;
        vitals.fcp = 0;
        vitals.tti = 0;
        checkComplete();
        checkComplete();
        checkComplete();
      }
    });
  }

  /**
   * Calculate Time to Interactive
   */
  private calculateTTI(navigation: PerformanceNavigationTiming): number {
    // Simplified TTI calculation based on navigation timing
    const domContentLoaded = navigation.domContentLoadedEventEnd - navigation.navigationStart;
    const loadComplete = navigation.loadEventEnd - navigation.navigationStart;
    
    // TTI is typically between DOM content loaded and full load
    return domContentLoaded + (loadComplete - domContentLoaded) * 0.7;
  }

  /**
   * Measure API Performance
   */
  public measureAPIPerformance(
    endpoint: string,
    method: string,
    startTime: number,
    endTime: number,
    statusCode: number,
    requestSize?: number,
    responseSize?: number
  ): APIPerformanceMetrics {
    const responseTime = endTime - startTime;
    const isError = statusCode >= 400;
    
    const metric: APIPerformanceMetrics = {
      endpoint,
      method,
      responseTime,
      statusCode,
      requestSize,
      responseSize,
      errorRate: isError ? 1 : 0,
      throughput: 1000 / responseTime, // requests per second
      timestamp: new Date()
    };

    // Track in Sentry
    Sentry.setMeasurement(`api_response_time_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`, responseTime, 'millisecond');
    Sentry.setTag('api_endpoint', endpoint);
    Sentry.setTag('api_method', method);
    Sentry.setTag('api_status', statusCode.toString());

    if (isError) {
      Sentry.addBreadcrumb({
        category: 'api-performance',
        message: `API error: ${method} ${endpoint}`,
        level: 'warning',
        data: { statusCode, responseTime }
      });
    }

    logger.info('API performance measured', 'PERFORMANCE', metric);

    return metric;
  }

  /**
   * Measure Client-Side Metrics
   */
  public async measureClientSideMetrics(): Promise<ClientSideMetrics> {
    const metrics: ClientSideMetrics = {
      bundleSize: await this.measureBundleSize(),
      memoryUsage: this.measureMemoryUsage(),
      scriptExecutionTime: this.measureScriptExecutionTime(),
      domParsingTime: this.measureDOMParsingTime(),
      resourceLoadTime: this.measureResourceLoadTime()
    };

    // Track in Sentry
    Sentry.setMeasurement('bundle_size_initial', metrics.bundleSize.initial, 'byte');
    Sentry.setMeasurement('bundle_size_total', metrics.bundleSize.total, 'byte');
    Sentry.setMeasurement('memory_usage_mb', metrics.memoryUsage.used, 'none');
    Sentry.setMeasurement('script_execution_time', metrics.scriptExecutionTime, 'millisecond');

    return metrics;
  }

  /**
   * Measure Bundle Size
   */
  private async measureBundleSize(): Promise<ClientSideMetrics['bundleSize']> {
    if (typeof window === 'undefined') {
      return { initial: 0, total: 0, compressed: 0 };
    }

    // Estimate bundle size from loaded resources
    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    const jsResources = resources.filter(r => r.name.includes('.js'));
    
    const initial = jsResources
      .filter(r => r.name.includes('main') || r.name.includes('framework'))
      .reduce((sum, r) => sum + (r.transferSize || 0), 0);
    
    const total = jsResources.reduce((sum, r) => sum + (r.transferSize || 0), 0);
    const compressed = jsResources.reduce((sum, r) => sum + (r.encodedBodySize || 0), 0);

    return { initial, total, compressed };
  }

  /**
   * Measure Memory Usage
   */
  private measureMemoryUsage(): ClientSideMetrics['memoryUsage'] {
    if (typeof window === 'undefined' || !('performance' in window) || !('memory' in performance)) {
      return { used: 0, limit: 0, percentage: 0 };
    }

    const memory = (performance as any).memory;
    const used = Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
    const limit = Math.round(memory.jsHeapSizeLimit / 1024 / 1024); // MB
    const percentage = (used / limit) * 100;

    return { used, limit, percentage };
  }

  /**
   * Measure Script Execution Time
   */
  private measureScriptExecutionTime(): number {
    if (typeof window === 'undefined') return 0;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return 0;

    return navigation.domComplete - navigation.domLoading;
  }

  /**
   * Measure DOM Parsing Time
   */
  private measureDOMParsingTime(): number {
    if (typeof window === 'undefined') return 0;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return 0;

    return navigation.domContentLoadedEventEnd - navigation.domLoading;
  }

  /**
   * Measure Resource Load Time
   */
  private measureResourceLoadTime(): number {
    if (typeof window === 'undefined') return 0;

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    if (resources.length === 0) return 0;

    const totalLoadTime = resources.reduce((sum, resource) => sum + resource.duration, 0);
    return totalLoadTime / resources.length; // Average load time
  }

  /**
   * Measure AI Feature Performance
   */
  public measureAIFeaturePerformance(
    feature: keyof AIFeatureMetrics,
    startTime: number,
    endTime: number,
    tokenUsage?: AIFeatureMetrics['tokenUsage']
  ): number {
    const duration = endTime - startTime;
    
    // Track in Sentry
    Sentry.setMeasurement(`ai_${feature}_time`, duration, 'millisecond');
    
    if (tokenUsage) {
      Sentry.setMeasurement(`ai_${feature}_tokens_input`, tokenUsage.input, 'none');
      Sentry.setMeasurement(`ai_${feature}_tokens_output`, tokenUsage.output, 'none');
      Sentry.setMeasurement(`ai_${feature}_tokens_total`, tokenUsage.total, 'none');
      
      if (tokenUsage.cost) {
        Sentry.setMeasurement(`ai_${feature}_cost`, tokenUsage.cost, 'none');
      }
    }

    logger.info(`AI feature performance measured: ${feature}`, 'PERFORMANCE', {
      feature,
      duration,
      tokenUsage
    });

    return duration;
  }

  /**
   * Generate Complete Performance Baseline
   */
  public async generateBaseline(version: string): Promise<PerformanceBaseline> {
    const baseline: PerformanceBaseline = {
      timestamp: new Date(),
      version,
      environment: process.env.NODE_ENV as 'development' | 'staging' | 'production' || 'development',
      coreWebVitals: await this.measureCoreWebVitals(),
      apiMetrics: [], // Will be populated by API measurements
      clientSideMetrics: await this.measureClientSideMetrics(),
      aiFeatureMetrics: {
        voiceAnalysisTime: 0,
        contentGenerationTime: 0,
        chatResponseTime: 0,
        assessmentGenerationTime: 0,
        tokenUsage: { input: 0, output: 0, total: 0 }
      },
      resourceUtilization: this.measureResourceUtilization(),
      sentryPerformanceScore: 0, // Will be calculated
      userExperienceScore: 0 // Will be calculated
    };

    baseline.sentryPerformanceScore = this.calculateSentryPerformanceScore(baseline);
    baseline.userExperienceScore = this.calculateUserExperienceScore(baseline);

    // Store baseline in Sentry
    Sentry.setContext('performance_baseline', baseline);
    
    logger.info('Performance baseline generated', 'PERFORMANCE', {
      version,
      sentryScore: baseline.sentryPerformanceScore,
      uxScore: baseline.userExperienceScore
    });

    return baseline;
  }

  /**
   * Measure Resource Utilization
   */
  private measureResourceUtilization(): ResourceUtilization {
    const memory = this.measureMemoryUsage();
    
    return {
      memoryUsage: memory.used,
      cpuUsage: 0, // Will be measured server-side
      networkBandwidth: this.estimateNetworkBandwidth(),
      storageUsage: this.measureStorageUsage(),
      cacheHitRate: 0.8 // Default estimate, will be measured
    };
  }

  /**
   * Estimate Network Bandwidth
   */
  private estimateNetworkBandwidth(): number {
    if (typeof navigator === 'undefined' || !('connection' in navigator)) {
      return 0;
    }

    const connection = (navigator as any).connection;
    return connection?.downlink || 0;
  }

  /**
   * Measure Storage Usage
   */
  private measureStorageUsage(): number {
    if (typeof navigator === 'undefined' || !('storage' in navigator)) {
      return 0;
    }

    // Estimate based on localStorage and sessionStorage
    let totalSize = 0;
    try {
      for (let key in localStorage) {
        if (localStorage.hasOwnProperty(key)) {
          totalSize += localStorage[key].length;
        }
      }
      for (let key in sessionStorage) {
        if (sessionStorage.hasOwnProperty(key)) {
          totalSize += sessionStorage[key].length;
        }
      }
    } catch (error) {
      logger.warn('Unable to measure storage usage', 'PERFORMANCE', { error });
    }
    
    return Math.round(totalSize / 1024); // KB
  }

  /**
   * Calculate Sentry Performance Score
   */
  private calculateSentryPerformanceScore(baseline: PerformanceBaseline): number {
    const { coreWebVitals, clientSideMetrics } = baseline;
    const thresholds = this.thresholds.coreWebVitals;

    // Score each Core Web Vital (0-100)
    const lcpScore = this.scoreMetric(coreWebVitals.lcp, thresholds.lcp.good, thresholds.lcp.poor);
    const fidScore = this.scoreMetric(coreWebVitals.fid, thresholds.fid.good, thresholds.fid.poor);
    const clsScore = this.scoreMetric(coreWebVitals.cls, thresholds.cls.good, thresholds.cls.poor, true);
    const ttfbScore = this.scoreMetric(coreWebVitals.ttfb, thresholds.ttfb.good, thresholds.ttfb.poor);
    
    // Memory usage score
    const memoryScore = this.scoreMetric(
      clientSideMetrics.memoryUsage.percentage,
      this.thresholds.resources.memoryUsage.good,
      this.thresholds.resources.memoryUsage.poor
    );

    // Bundle size score
    const bundleScore = this.scoreMetric(
      clientSideMetrics.bundleSize.initial,
      this.thresholds.resources.bundleSize.good,
      this.thresholds.resources.bundleSize.poor
    );

    // Weighted average
    return Math.round(
      lcpScore * 0.25 +
      fidScore * 0.25 +
      clsScore * 0.25 +
      ttfbScore * 0.15 +
      memoryScore * 0.05 +
      bundleScore * 0.05
    );
  }

  /**
   * Calculate User Experience Score
   */
  private calculateUserExperienceScore(baseline: PerformanceBaseline): number {
    const { coreWebVitals, clientSideMetrics } = baseline;

    // Focus on user-facing metrics
    const loadingScore = this.scoreMetric(coreWebVitals.lcp, 2500, 4000);
    const interactivityScore = this.scoreMetric(coreWebVitals.fid, 100, 300);
    const stabilityScore = this.scoreMetric(coreWebVitals.cls, 0.1, 0.25, true);
    const memoryScore = this.scoreMetric(clientSideMetrics.memoryUsage.percentage, 50, 90);

    return Math.round(
      loadingScore * 0.3 +
      interactivityScore * 0.3 +
      stabilityScore * 0.3 +
      memoryScore * 0.1
    );
  }

  /**
   * Score individual metrics (0-100)
   */
  private scoreMetric(value: number, good: number, poor: number, inverse = false): number {
    if (inverse) {
      // For metrics where lower is better (like CLS)
      if (value <= good) return 100;
      if (value >= poor) return 0;
      return Math.round(100 - ((value - good) / (poor - good)) * 100);
    } else {
      // For metrics where higher is better
      if (value <= good) return 100;
      if (value >= poor) return 0;
      return Math.round(((poor - value) / (poor - good)) * 100);
    }
  }

  /**
   * Get Default Performance Thresholds
   */
  private getDefaultThresholds(): PerformanceThresholds {
    return {
      coreWebVitals: {
        lcp: { good: 2500, needsImprovement: 4000, poor: 4000 },
        fid: { good: 100, needsImprovement: 300, poor: 300 },
        cls: { good: 0.1, needsImprovement: 0.25, poor: 0.25 },
        ttfb: { good: 800, needsImprovement: 1800, poor: 1800 },
        fcp: { good: 1800, needsImprovement: 3000, poor: 3000 },
        tti: { good: 3800, needsImprovement: 7300, poor: 7300 }
      },
      api: {
        responseTime: { good: 200, acceptable: 500, poor: 1000 },
        errorRate: { good: 0.01, acceptable: 0.05, poor: 0.1 }
      },
      ai: {
        voiceAnalysis: { good: 2000, acceptable: 5000, poor: 10000 },
        contentGeneration: { good: 3000, acceptable: 8000, poor: 15000 },
        chatResponse: { good: 1500, acceptable: 4000, poor: 8000 }
      },
      resources: {
        memoryUsage: { good: 50, acceptable: 75, poor: 90 },
        cpuUsage: { good: 30, acceptable: 60, poor: 80 },
        bundleSize: { good: 500000, acceptable: 1000000, poor: 2000000 }
      }
    };
  }

  /**
   * Get Default Core Web Vitals (for server-side)
   */
  private getDefaultCoreWebVitals(): CoreWebVitals {
    return {
      lcp: 0,
      fid: 0,
      cls: 0,
      ttfb: 0,
      fcp: 0,
      tti: 0
    };
  }

  /**
   * Get Performance Thresholds
   */
  public getThresholds(): PerformanceThresholds {
    return this.thresholds;
  }

  /**
   * Update Performance Thresholds
   */
  public updateThresholds(newThresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('Performance thresholds updated', 'PERFORMANCE', newThresholds);
  }

  /**
   * Clear metrics cache
   */
  public clearMetrics(): void {
    this.metrics.clear();
    logger.info('Performance metrics cleared', 'PERFORMANCE');
  }

  /**
   * Get collected metrics
   */
  public getMetrics(): Map<string, number[]> {
    return new Map(this.metrics);
  }
}

// Export singleton instance
export const performanceBaseline = PerformanceBaselineService.getInstance();

// Export convenience functions
export const measureCoreWebVitals = () => performanceBaseline.measureCoreWebVitals();
export const measureAPIPerformance = (
  endpoint: string,
  method: string,
  startTime: number,
  endTime: number,
  statusCode: number,
  requestSize?: number,
  responseSize?: number
) => performanceBaseline.measureAPIPerformance(endpoint, method, startTime, endTime, statusCode, requestSize, responseSize);

export const measureClientSideMetrics = () => performanceBaseline.measureClientSideMetrics();
export const measureAIFeaturePerformance = (
  feature: keyof AIFeatureMetrics,
  startTime: number,
  endTime: number,
  tokenUsage?: AIFeatureMetrics['tokenUsage']
) => performanceBaseline.measureAIFeaturePerformance(feature, startTime, endTime, tokenUsage);

export const generateBaseline = (version: string) => performanceBaseline.generateBaseline(version);