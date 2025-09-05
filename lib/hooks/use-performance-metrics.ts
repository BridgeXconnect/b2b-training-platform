import { useState, useEffect, useCallback, useRef } from 'react';
import { performanceMonitor } from '@/lib/performance/performance-monitor';

export interface PerformanceMetrics {
  // Core Web Vitals
  lcp?: number;
  fid?: number;
  cls?: number;
  fcp?: number;
  ttfb?: number;
  
  // Additional Performance Metrics
  navigationTiming?: PerformanceNavigationTiming;
  paintTiming?: PerformancePaintTiming[];
  memoryInfo?: {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
  };
  
  // React-specific metrics
  componentMetrics?: {
    renderCount: number;
    averageRenderTime: number;
    slowComponents: Array<{
      name: string;
      renderTime: number;
      renderCount: number;
    }>;
  };
  
  // Bundle metrics
  bundleMetrics?: {
    totalSize: number;
    chunkSizes: Record<string, number>;
    unusedCode: number;
  };
  
  // Network metrics
  networkMetrics?: {
    effectiveType: string;
    downlink: number;
    rtt: number;
  };
  
  // Timestamp
  timestamp: number;
}

export interface UsePerformanceMetricsOptions {
  autoRefresh?: boolean;
  interval?: number;
  collectComponentMetrics?: boolean;
  collectBundleMetrics?: boolean;
}

export interface UsePerformanceMetricsReturn {
  metrics: PerformanceMetrics | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  startCollection: () => void;
  stopCollection: () => void;
  isCollecting: boolean;
}

// Performance observer for React components
class ReactPerformanceObserver {
  private renderTimes: Map<string, number[]> = new Map();
  private renderCounts: Map<string, number> = new Map();
  private observer: PerformanceObserver | null = null;

  start() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    this.observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'measure' && entry.name.startsWith('⚛️')) {
          // React DevTools creates measures for component renders
          const componentName = entry.name.replace('⚛️ ', '');
          const duration = entry.duration;

          if (!this.renderTimes.has(componentName)) {
            this.renderTimes.set(componentName, []);
            this.renderCounts.set(componentName, 0);
          }

          this.renderTimes.get(componentName)!.push(duration);
          this.renderCounts.set(componentName, this.renderCounts.get(componentName)! + 1);

          // Keep only last 100 measurements per component
          const times = this.renderTimes.get(componentName)!;
          if (times.length > 100) {
            times.splice(0, times.length - 100);
          }
        }
      }
    });

    try {
      this.observer.observe({ entryTypes: ['measure'] });
    } catch (error) {
      console.warn('Failed to observe performance measures:', error);
    }
  }

  stop() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  getMetrics() {
    const slowComponents: Array<{
      name: string;
      renderTime: number;
      renderCount: number;
    }> = [];

    let totalRenders = 0;
    let totalRenderTime = 0;

    for (const [componentName, times] of this.renderTimes.entries()) {
      const renderCount = this.renderCounts.get(componentName) || 0;
      const averageTime = times.reduce((sum, time) => sum + time, 0) / times.length;

      totalRenders += renderCount;
      totalRenderTime += times.reduce((sum, time) => sum + time, 0);

      // Consider components with average render time > 5ms as slow
      if (averageTime > 5) {
        slowComponents.push({
          name: componentName,
          renderTime: averageTime,
          renderCount,
        });
      }
    }

    // Sort by render time descending
    slowComponents.sort((a, b) => b.renderTime - a.renderTime);

    return {
      renderCount: totalRenders,
      averageRenderTime: totalRenders > 0 ? totalRenderTime / totalRenders : 0,
      slowComponents: slowComponents.slice(0, 10), // Top 10 slowest components
    };
  }

  clear() {
    this.renderTimes.clear();
    this.renderCounts.clear();
  }
}

// Bundle size analyzer
class BundleAnalyzer {
  static async analyzeBundleSize(): Promise<PerformanceMetrics['bundleMetrics']> {
    if (typeof window === 'undefined') {
      return undefined;
    }

    try {
      // Get all script tags to estimate bundle sizes
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const chunkSizes: Record<string, number> = {};
      let totalSize = 0;

      for (const script of scripts) {
        const src = script.getAttribute('src');
        if (src && src.includes('/_next/static/')) {
          try {
            // This is a rough estimation - in production you'd use webpack-bundle-analyzer
            const response = await fetch(src, { method: 'HEAD' });
            const size = parseInt(response.headers.get('content-length') || '0', 10);
            
            const chunkName = src.split('/').pop() || 'unknown';
            chunkSizes[chunkName] = size;
            totalSize += size;
          } catch (error) {
            console.warn('Failed to get bundle size for:', src);
          }
        }
      }

      return {
        totalSize,
        chunkSizes,
        unusedCode: 0, // Would need coverage API to calculate this
      };
    } catch (error) {
      console.warn('Failed to analyze bundle size:', error);
      return undefined;
    }
  }
}

export function usePerformanceMetrics(options: UsePerformanceMetricsOptions = {}): UsePerformanceMetricsReturn {
  const {
    autoRefresh = false,
    interval = 30000,
    collectComponentMetrics = false,
    collectBundleMetrics = false,
  } = options;

  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isCollecting, setIsCollecting] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const reactObserverRef = useRef<ReactPerformanceObserver | null>(null);

  // Collect performance metrics
  const collectMetrics = useCallback(async (): Promise<PerformanceMetrics> => {
    const timestamp = Date.now();
    const newMetrics: PerformanceMetrics = { timestamp };

    // Get navigation timing
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigation) {
        newMetrics.navigationTiming = navigation;
        newMetrics.ttfb = navigation.responseStart - navigation.requestStart;
      }

      // Get paint timing
      const paintEntries = performance.getEntriesByType('paint') as PerformancePaintTiming[];
      if (paintEntries.length > 0) {
        newMetrics.paintTiming = paintEntries;
        
        const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint');
        if (fcp) {
          newMetrics.fcp = fcp.startTime;
        }
      }

      // Get memory info (Chrome only)
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        newMetrics.memoryInfo = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
        };
      }

      // Get network information
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        newMetrics.networkMetrics = {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
        };
      }
    }

    // Collect React component metrics
    if (collectComponentMetrics && reactObserverRef.current) {
      newMetrics.componentMetrics = reactObserverRef.current.getMetrics();
    }

    // Collect bundle metrics
    if (collectBundleMetrics) {
      newMetrics.bundleMetrics = await BundleAnalyzer.analyzeBundleSize();
    }

    return newMetrics;
  }, [collectComponentMetrics, collectBundleMetrics]);

  // Refresh metrics
  const refresh = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const newMetrics = await collectMetrics();
      setMetrics(newMetrics);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to collect metrics');
      setError(error);
      console.error('Failed to collect performance metrics:', error);
    } finally {
      setIsLoading(false);
    }
  }, [collectMetrics, isLoading]);

  // Start collection
  const startCollection = useCallback(() => {
    if (isCollecting) return;

    setIsCollecting(true);

    // Start React performance observer
    if (collectComponentMetrics) {
      reactObserverRef.current = new ReactPerformanceObserver();
      reactObserverRef.current.start();
    }

    // Start auto-refresh if enabled
    if (autoRefresh) {
      intervalRef.current = setInterval(refresh, interval);
    }

    // Collect initial metrics
    refresh();
  }, [isCollecting, collectComponentMetrics, autoRefresh, interval, refresh]);

  // Stop collection
  const stopCollection = useCallback(() => {
    if (!isCollecting) return;

    setIsCollecting(false);

    // Stop React performance observer
    if (reactObserverRef.current) {
      reactObserverRef.current.stop();
      reactObserverRef.current = null;
    }

    // Clear auto-refresh interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isCollecting]);

  // Effect for auto-start
  useEffect(() => {
    if (autoRefresh) {
      startCollection();
    }

    return () => {
      stopCollection();
    };
  }, [autoRefresh, startCollection, stopCollection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCollection();
    };
  }, [stopCollection]);

  return {
    metrics,
    isLoading,
    error,
    refresh,
    startCollection,
    stopCollection,
    isCollecting,
  };
}