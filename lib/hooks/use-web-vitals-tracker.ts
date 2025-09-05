import { useState, useEffect, useCallback, useRef } from 'react';
import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals';

export interface WebVitalsMetrics {
  // Core Web Vitals
  cls?: number;
  fcp?: number;
  fid?: number;
  lcp?: number;
  ttfb?: number;
  
  // Additional metrics
  timestamp: number;
  url: string;
  
  // Navigation type
  navigationType: 'navigate' | 'reload' | 'back_forward' | 'prerender';
  
  // Attribution data for debugging
  attribution?: {
    cls?: any;
    fcp?: any;
    fid?: any;
    lcp?: any;
    ttfb?: any;
  };
}

export interface WebVitalsHistory {
  metrics: WebVitalsMetrics[];
  averages: {
    cls: number;
    fcp: number;
    fid: number;
    lcp: number;
    ttfb: number;
  };
  trends: {
    cls: 'improving' | 'stable' | 'degrading';
    fcp: 'improving' | 'stable' | 'degrading';
    fid: 'improving' | 'stable' | 'degrading';
    lcp: 'improving' | 'stable' | 'degrading';
    ttfb: 'improving' | 'stable' | 'degrading';
  };
}

export interface UseWebVitalsTrackerOptions {
  trackHistory?: boolean;
  maxHistorySize?: number;
  reportToSentry?: boolean;
  reportToAnalytics?: boolean;
  onMetricReceived?: (metric: any) => void;
}

export interface UseWebVitalsTrackerReturn {
  webVitals: WebVitalsMetrics | null;
  history: WebVitalsHistory | null;
  isTracking: boolean;
  startTracking: () => Promise<void>;
  stopTracking: () => void;
  clearMetrics: () => void;
  exportMetrics: () => string;
}

// Performance thresholds for scoring
const THRESHOLDS = {
  cls: { good: 0.1, poor: 0.25 },
  fcp: { good: 1800, poor: 3000 },
  fid: { good: 100, poor: 300 },
  lcp: { good: 2500, poor: 4000 },
  ttfb: { good: 800, poor: 1800 },
};

class WebVitalsCollector {
  private metrics: WebVitalsMetrics | null = null;
  private history: WebVitalsMetrics[] = [];
  private callbacks: Array<(metrics: WebVitalsMetrics) => void> = [];
  private unsubscribes: Array<() => void> = [];
  private isActive = false;
  private maxHistorySize: number;
  private trackHistory: boolean;

  constructor(options: { maxHistorySize: number; trackHistory: boolean }) {
    this.maxHistorySize = options.maxHistorySize;
    this.trackHistory = options.trackHistory;
  }

  start() {
    if (this.isActive) return;
    
    this.isActive = true;
    
    // Initialize current metrics
    this.metrics = {
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      navigationType: this.getNavigationType(),
      attribution: {},
    };

    // Set up web vitals listeners
    this.setupWebVitalsListeners();
  }

  stop() {
    if (!this.isActive) return;
    
    this.isActive = false;
    
    // Clean up all listeners
    this.unsubscribes.forEach(unsubscribe => unsubscribe());
    this.unsubscribes = [];
  }

  private setupWebVitalsListeners() {
    // CLS (Cumulative Layout Shift)
    const clsHandler = getCLS((metric) => {
      this.updateMetric('cls', metric.value, metric);
    });
    this.unsubscribes.push(() => clsHandler);

    // FCP (First Contentful Paint)
    const fcpHandler = getFCP((metric) => {
      this.updateMetric('fcp', metric.value, metric);
    });
    this.unsubscribes.push(() => fcpHandler);

    // FID (First Input Delay)
    const fidHandler = getFID((metric) => {
      this.updateMetric('fid', metric.value, metric);
    });
    this.unsubscribes.push(() => fidHandler);

    // LCP (Largest Contentful Paint)
    const lcpHandler = getLCP((metric) => {
      this.updateMetric('lcp', metric.value, metric);
    });
    this.unsubscribes.push(() => lcpHandler);

    // TTFB (Time to First Byte)
    const ttfbHandler = getTTFB((metric) => {
      this.updateMetric('ttfb', metric.value, metric);
    });
    this.unsubscribes.push(() => ttfbHandler);
  }

  private updateMetric(metricName: keyof WebVitalsMetrics, value: number, attribution: any) {
    if (!this.metrics) return;

    // Update the metric
    (this.metrics as any)[metricName] = value;
    
    // Store attribution data for debugging
    if (!this.metrics.attribution) {
      this.metrics.attribution = {};
    }
    this.metrics.attribution[metricName] = attribution;

    // Update timestamp
    this.metrics.timestamp = Date.now();

    // Add to history if tracking is enabled
    if (this.trackHistory) {
      this.addToHistory({ ...this.metrics });
    }

    // Notify callbacks
    this.callbacks.forEach(callback => {
      try {
        callback({ ...this.metrics! });
      } catch (error) {
        console.error('Error in web vitals callback:', error);
      }
    });
  }

  private addToHistory(metrics: WebVitalsMetrics) {
    this.history.push(metrics);
    
    // Maintain history size limit
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  private getNavigationType(): WebVitalsMetrics['navigationType'] {
    if (typeof window === 'undefined' || !('performance' in window)) {
      return 'navigate';
    }

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (!navigation) return 'navigate';

    switch (navigation.type) {
      case 'reload':
        return 'reload';
      case 'back_forward':
        return 'back_forward';
      case 'prerender':
        return 'prerender';
      default:
        return 'navigate';
    }
  }

  getCurrentMetrics(): WebVitalsMetrics | null {
    return this.metrics ? { ...this.metrics } : null;
  }

  getHistory(): WebVitalsMetrics[] {
    return [...this.history];
  }

  getAnalytics(): WebVitalsHistory | null {
    if (this.history.length === 0) return null;

    // Calculate averages
    const totals = this.history.reduce(
      (acc, metrics) => {
        if (metrics.cls !== undefined) acc.cls += metrics.cls;
        if (metrics.fcp !== undefined) acc.fcp += metrics.fcp;
        if (metrics.fid !== undefined) acc.fid += metrics.fid;
        if (metrics.lcp !== undefined) acc.lcp += metrics.lcp;
        if (metrics.ttfb !== undefined) acc.ttfb += metrics.ttfb;
        return acc;
      },
      { cls: 0, fcp: 0, fid: 0, lcp: 0, ttfb: 0 }
    );

    const counts = this.history.reduce(
      (acc, metrics) => {
        if (metrics.cls !== undefined) acc.cls++;
        if (metrics.fcp !== undefined) acc.fcp++;
        if (metrics.fid !== undefined) acc.fid++;
        if (metrics.lcp !== undefined) acc.lcp++;
        if (metrics.ttfb !== undefined) acc.ttfb++;
        return acc;
      },
      { cls: 0, fcp: 0, fid: 0, lcp: 0, ttfb: 0 }
    );

    const averages = {
      cls: counts.cls > 0 ? totals.cls / counts.cls : 0,
      fcp: counts.fcp > 0 ? totals.fcp / counts.fcp : 0,
      fid: counts.fid > 0 ? totals.fid / counts.fid : 0,
      lcp: counts.lcp > 0 ? totals.lcp / counts.lcp : 0,
      ttfb: counts.ttfb > 0 ? totals.ttfb / counts.ttfb : 0,
    };

    // Calculate trends (simplified - compare recent vs older metrics)
    const trends = this.calculateTrends();

    return {
      metrics: this.getHistory(),
      averages,
      trends,
    };
  }

  private calculateTrends(): WebVitalsHistory['trends'] {
    if (this.history.length < 10) {
      return {
        cls: 'stable',
        fcp: 'stable',
        fid: 'stable',
        lcp: 'stable',
        ttfb: 'stable',
      };
    }

    const recent = this.history.slice(-5);
    const older = this.history.slice(-10, -5);

    const calculateTrend = (
      recentValues: number[],
      olderValues: number[],
      metricName: keyof typeof THRESHOLDS
    ) => {
      if (recentValues.length === 0 || olderValues.length === 0) return 'stable';

      const recentAvg = recentValues.reduce((sum, val) => sum + val, 0) / recentValues.length;
      const olderAvg = olderValues.reduce((sum, val) => sum + val, 0) / olderValues.length;

      const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;

      // For CLS, lower is better; for others, lower is also better
      if (Math.abs(changePercent) < 5) return 'stable';
      return changePercent < 0 ? 'improving' : 'degrading';
    };

    return {
      cls: calculateTrend(
        recent.map(m => m.cls).filter(v => v !== undefined) as number[],
        older.map(m => m.cls).filter(v => v !== undefined) as number[],
        'cls'
      ),
      fcp: calculateTrend(
        recent.map(m => m.fcp).filter(v => v !== undefined) as number[],
        older.map(m => m.fcp).filter(v => v !== undefined) as number[],
        'fcp'
      ),
      fid: calculateTrend(
        recent.map(m => m.fid).filter(v => v !== undefined) as number[],
        older.map(m => m.fid).filter(v => v !== undefined) as number[],
        'fid'
      ),
      lcp: calculateTrend(
        recent.map(m => m.lcp).filter(v => v !== undefined) as number[],
        older.map(m => m.lcp).filter(v => v !== undefined) as number[],
        'lcp'
      ),
      ttfb: calculateTrend(
        recent.map(m => m.ttfb).filter(v => v !== undefined) as number[],
        older.map(m => m.ttfb).filter(v => v !== undefined) as number[],
        'ttfb'
      ),
    };
  }

  onMetricsUpdate(callback: (metrics: WebVitalsMetrics) => void) {
    this.callbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index > -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }

  clear() {
    this.metrics = null;
    this.history = [];
  }

  exportData(): string {
    return JSON.stringify({
      current: this.metrics,
      history: this.history,
      analytics: this.getAnalytics(),
      timestamp: Date.now(),
    }, null, 2);
  }
}

export function useWebVitalsTracker(options: UseWebVitalsTrackerOptions = {}): UseWebVitalsTrackerReturn {
  const {
    trackHistory = true,
    maxHistorySize = 100,
    reportToSentry = false,
    reportToAnalytics = false,
    onMetricReceived,
  } = options;

  const [webVitals, setWebVitals] = useState<WebVitalsMetrics | null>(null);
  const [history, setHistory] = useState<WebVitalsHistory | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const collectorRef = useRef<WebVitalsCollector | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize collector
  useEffect(() => {
    collectorRef.current = new WebVitalsCollector({
      maxHistorySize,
      trackHistory,
    });

    return () => {
      if (collectorRef.current) {
        collectorRef.current.stop();
      }
    };
  }, [maxHistorySize, trackHistory]);

  // Start tracking
  const startTracking = useCallback(async () => {
    if (!collectorRef.current || isTracking) return;

    setIsTracking(true);
    collectorRef.current.start();

    // Subscribe to metrics updates
    unsubscribeRef.current = collectorRef.current.onMetricsUpdate((metrics) => {
      setWebVitals(metrics);
      
      // Update history
      if (trackHistory) {
        const analytics = collectorRef.current?.getAnalytics();
        if (analytics) {
          setHistory(analytics);
        }
      }

      // Report to external services
      if (reportToSentry && typeof window !== 'undefined') {
        // Report to Sentry (requires Sentry setup)
        try {
          const Sentry = (window as any).Sentry;
          if (Sentry) {
            Sentry.setTag('web-vitals', true);
            Sentry.setContext('web-vitals', metrics);
          }
        } catch (error) {
          console.warn('Failed to report to Sentry:', error);
        }
      }

      if (reportToAnalytics && typeof window !== 'undefined') {
        // Report to Google Analytics (requires GA setup)
        try {
          const gtag = (window as any).gtag;
          if (gtag) {
            Object.entries(metrics).forEach(([key, value]) => {
              if (typeof value === 'number' && key !== 'timestamp') {
                gtag('event', key, {
                  event_category: 'Web Vitals',
                  value: Math.round(value),
                  custom_parameter_1: metrics.navigationType,
                });
              }
            });
          }
        } catch (error) {
          console.warn('Failed to report to Analytics:', error);
        }
      }

      // Call custom callback
      if (onMetricReceived) {
        try {
          onMetricReceived(metrics);
        } catch (error) {
          console.error('Error in custom metric callback:', error);
        }
      }
    });
  }, [isTracking, trackHistory, reportToSentry, reportToAnalytics, onMetricReceived]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    if (!collectorRef.current || !isTracking) return;

    setIsTracking(false);
    collectorRef.current.stop();

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
  }, [isTracking]);

  // Clear metrics
  const clearMetrics = useCallback(() => {
    if (collectorRef.current) {
      collectorRef.current.clear();
    }
    setWebVitals(null);
    setHistory(null);
  }, []);

  // Export metrics
  const exportMetrics = useCallback((): string => {
    if (!collectorRef.current) return '{}';
    return collectorRef.current.exportData();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    webVitals,
    history,
    isTracking,
    startTracking,
    stopTracking,
    clearMetrics,
    exportMetrics,
  };
}