/**
 * Web Vitals Tracker
 * 
 * Comprehensive Core Web Vitals measurement and reporting system
 * with automatic Sentry integration and real-time monitoring.
 */

import { getCLS, getFCP, getFID, getLCP, getTTFB, Metric } from 'web-vitals';
import * as Sentry from '@sentry/nextjs';

export interface WebVitalsData {
  cls?: number;
  fcp?: number;
  fid?: number;
  lcp?: number;
  ttfb?: number;
  timestamp: number;
  url: string;
  navigationType: 'navigate' | 'reload' | 'back_forward' | 'prerender';
  connectionType?: string;
  deviceMemory?: number;
  attribution?: {
    cls?: any;
    fcp?: any;
    fid?: any;
    lcp?: any;
    ttfb?: any;
  };
}

export interface WebVitalsThresholds {
  cls: { good: number; poor: number };
  fcp: { good: number; poor: number };
  fid: { good: number; poor: number };
  lcp: { good: number; poor: number };
  ttfb: { good: number; poor: number };
}

export interface WebVitalsReport {
  overall: {
    score: number;
    rating: 'good' | 'needs-improvement' | 'poor';
    passedMetrics: number;
    totalMetrics: number;
  };
  metrics: {
    [K in keyof WebVitalsData]?: {
      value: number;
      rating: 'good' | 'needs-improvement' | 'poor';
      score: number;
      threshold: { good: number; poor: number };
    };
  };
  recommendations: string[];
  timestamp: number;
}

// Core Web Vitals thresholds (based on Google's recommendations)
export const WEB_VITALS_THRESHOLDS: WebVitalsThresholds = {
  cls: { good: 0.1, poor: 0.25 },
  fcp: { good: 1800, poor: 3000 },
  fid: { good: 100, poor: 300 },
  lcp: { good: 2500, poor: 4000 },
  ttfb: { good: 800, poor: 1800 },
};

class WebVitalsTracker {
  private data: WebVitalsData;
  private listeners: Array<(data: WebVitalsData) => void> = [];
  private isInitialized = false;
  private reportingEndpoint?: string;
  private enableSentry: boolean;
  private enableAnalytics: boolean;

  constructor(options: {
    reportingEndpoint?: string;
    enableSentry?: boolean;
    enableAnalytics?: boolean;
  } = {}) {
    this.reportingEndpoint = options.reportingEndpoint;
    this.enableSentry = options.enableSentry ?? true;
    this.enableAnalytics = options.enableAnalytics ?? true;
    
    this.data = {
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      navigationType: this.getNavigationType(),
    };

    this.initializeWebVitals();
  }

  private initializeWebVitals() {
    if (this.isInitialized || typeof window === 'undefined') return;

    this.isInitialized = true;

    // Add device and connection information
    this.addDeviceInfo();

    // Initialize Web Vitals collection
    this.setupWebVitalsCollection();
  }

  private addDeviceInfo() {
    // Connection information
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.data.connectionType = connection?.effectiveType || 'unknown';
    }

    // Device memory
    if ('deviceMemory' in navigator) {
      this.data.deviceMemory = (navigator as any).deviceMemory;
    }
  }

  private setupWebVitalsCollection() {
    // Cumulative Layout Shift
    getCLS((metric) => {
      this.updateMetric('cls', metric);
    });

    // First Contentful Paint
    getFCP((metric) => {
      this.updateMetric('fcp', metric);
    });

    // First Input Delay
    getFID((metric) => {
      this.updateMetric('fid', metric);
    });

    // Largest Contentful Paint
    getLCP((metric) => {
      this.updateMetric('lcp', metric);
    });

    // Time to First Byte
    getTTFB((metric) => {
      this.updateMetric('ttfb', metric);
    });
  }

  private updateMetric(name: keyof WebVitalsData, metric: Metric) {
    // Update the metric value
    (this.data as any)[name] = metric.value;
    
    // Store attribution data for debugging
    if (!this.data.attribution) {
      this.data.attribution = {};
    }
    this.data.attribution[name] = metric;

    // Update timestamp
    this.data.timestamp = Date.now();

    // Report to various services
    this.reportMetric(name, metric);

    // Notify listeners
    this.notifyListeners();
  }

  private async reportMetric(name: keyof WebVitalsData, metric: Metric) {
    const value = metric.value;
    const threshold = WEB_VITALS_THRESHOLDS[name as keyof WebVitalsThresholds];
    
    if (!threshold) return;

    const rating = this.getRating(value, threshold);
    const score = this.calculateScore(value, threshold);

    // Report to Sentry
    if (this.enableSentry) {
      this.reportToSentry(name, metric, rating, score);
    }

    // Report to Google Analytics
    if (this.enableAnalytics) {
      this.reportToAnalytics(name, metric, rating);
    }

    // Report to custom endpoint
    if (this.reportingEndpoint) {
      this.reportToEndpoint(name, metric, rating, score);
    }
  }

  private reportToSentry(
    name: keyof WebVitalsData, 
    metric: Metric, 
    rating: string, 
    score: number
  ) {
    try {
      // Set context
      Sentry.setContext('web-vitals', {
        [name]: {
          value: metric.value,
          rating,
          score,
          id: metric.id,
          navigationType: this.data.navigationType,
          connectionType: this.data.connectionType,
        },
      });

      // Add breadcrumb
      Sentry.addBreadcrumb({
        category: 'web-vitals',
        message: `${name.toUpperCase()}: ${metric.value}ms (${rating})`,
        level: rating === 'poor' ? 'warning' : 'info',
        data: {
          metric: name,
          value: metric.value,
          rating,
          score,
        },
      });

      // Send metric as custom measurement
      Sentry.setMeasurement(name, metric.value, 'millisecond');

      // For poor metrics, capture as performance issue
      if (rating === 'poor') {
        Sentry.captureMessage(
          `Poor Web Vital: ${name.toUpperCase()} = ${metric.value}ms`,
          'warning'
        );
      }
    } catch (error) {
      console.warn('Failed to report to Sentry:', error);
    }
  }

  private reportToAnalytics(
    name: keyof WebVitalsData, 
    metric: Metric, 
    rating: string
  ) {
    try {
      // Google Analytics 4
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', name, {
          event_category: 'Web Vitals',
          value: Math.round(metric.value),
          custom_parameter_1: rating,
          custom_parameter_2: this.data.navigationType,
          custom_parameter_3: this.data.connectionType,
        });
      }

      // Google Analytics Universal
      if (typeof window !== 'undefined' && (window as any).ga) {
        (window as any).ga('send', 'event', {
          eventCategory: 'Web Vitals',
          eventAction: name,
          eventValue: Math.round(metric.value),
          eventLabel: rating,
          nonInteraction: true,
        });
      }
    } catch (error) {
      console.warn('Failed to report to Analytics:', error);
    }
  }

  private async reportToEndpoint(
    name: keyof WebVitalsData, 
    metric: Metric, 
    rating: string, 
    score: number
  ) {
    try {
      const payload = {
        metric: name,
        value: metric.value,
        rating,
        score,
        id: metric.id,
        timestamp: this.data.timestamp,
        url: this.data.url,
        navigationType: this.data.navigationType,
        connectionType: this.data.connectionType,
        deviceMemory: this.data.deviceMemory,
        userAgent: navigator.userAgent,
      };

      await fetch(this.reportingEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
    } catch (error) {
      console.warn('Failed to report to endpoint:', error);
    }
  }

  private getNavigationType(): WebVitalsData['navigationType'] {
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

  private getRating(value: number, threshold: { good: number; poor: number }): 'good' | 'needs-improvement' | 'poor' {
    if (value <= threshold.good) return 'good';
    if (value <= threshold.poor) return 'needs-improvement';
    return 'poor';
  }

  private calculateScore(value: number, threshold: { good: number; poor: number }): number {
    if (value <= threshold.good) return 100;
    if (value >= threshold.poor) return 0;
    return Math.round(100 - ((value - threshold.good) / (threshold.poor - threshold.good)) * 100);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => {
      try {
        listener({ ...this.data });
      } catch (error) {
        console.error('Error in Web Vitals listener:', error);
      }
    });
  }

  // Public API
  public getData(): WebVitalsData {
    return { ...this.data };
  }

  public getReport(): WebVitalsReport {
    const metrics: WebVitalsReport['metrics'] = {};
    const recommendations: string[] = [];
    let totalScore = 0;
    let passedMetrics = 0;
    let totalMetrics = 0;

    // Analyze each metric
    Object.entries(WEB_VITALS_THRESHOLDS).forEach(([metricName, threshold]) => {
      const value = this.data[metricName as keyof WebVitalsData] as number;
      
      if (value !== undefined) {
        totalMetrics++;
        const rating = this.getRating(value, threshold);
        const score = this.calculateScore(value, threshold);
        
        totalScore += score;
        if (rating === 'good') passedMetrics++;

        metrics[metricName as keyof WebVitalsData] = {
          value,
          rating,
          score,
          threshold,
        };

        // Add recommendations for poor metrics
        if (rating === 'poor') {
          recommendations.push(...this.getRecommendations(metricName as keyof WebVitalsData));
        }
      }
    });

    const overallScore = totalMetrics > 0 ? Math.round(totalScore / totalMetrics) : 0;
    const overallRating = overallScore >= 90 ? 'good' : overallScore >= 50 ? 'needs-improvement' : 'poor';

    return {
      overall: {
        score: overallScore,
        rating: overallRating,
        passedMetrics,
        totalMetrics,
      },
      metrics,
      recommendations: [...new Set(recommendations)], // Remove duplicates
      timestamp: this.data.timestamp,
    };
  }

  private getRecommendations(metric: keyof WebVitalsData): string[] {
    const recommendations: Record<keyof WebVitalsData, string[]> = {
      cls: [
        'Set explicit dimensions for images and video elements',
        'Avoid inserting content above existing content',
        'Use CSS transform animations instead of animating layout properties',
        'Preload custom fonts with font-display: swap',
      ],
      fcp: [
        'Optimize server response times',
        'Eliminate render-blocking resources',
        'Minify CSS and JavaScript',
        'Use a Content Delivery Network (CDN)',
      ],
      fid: [
        'Break up long JavaScript tasks',
        'Use a web worker for heavy computations',
        'Reduce JavaScript execution time',
        'Minimize unused JavaScript',
      ],
      lcp: [
        'Optimize images (use modern formats like WebP)',
        'Preload critical resources',
        'Improve server response times',
        'Use efficient caching strategies',
      ],
      ttfb: [
        'Optimize server response times',
        'Use a Content Delivery Network (CDN)',
        'Cache resources at the edge',
        'Minimize server work for initial requests',
      ],
      timestamp: [],
      url: [],
      navigationType: [],
      connectionType: [],
      deviceMemory: [],
      attribution: [],
    };

    return recommendations[metric] || [];
  }

  public subscribe(listener: (data: WebVitalsData) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public exportData(): string {
    return JSON.stringify({
      data: this.data,
      report: this.getReport(),
      timestamp: Date.now(),
    }, null, 2);
  }

  public reset() {
    this.data = {
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      navigationType: this.getNavigationType(),
    };
    
    this.addDeviceInfo();
    this.notifyListeners();
  }
}

// Singleton instance
let trackerInstance: WebVitalsTracker | null = null;

export function getWebVitalsTracker(options?: {
  reportingEndpoint?: string;
  enableSentry?: boolean;
  enableAnalytics?: boolean;
}): WebVitalsTracker {
  if (!trackerInstance) {
    trackerInstance = new WebVitalsTracker(options);
  }
  return trackerInstance;
}

// Convenience functions
export function measureWebVitals(): Promise<WebVitalsData> {
  return new Promise((resolve) => {
    const tracker = getWebVitalsTracker();
    
    // Wait for some metrics to be collected
    setTimeout(() => {
      resolve(tracker.getData());
    }, 2000);
  });
}

export function subscribeToWebVitals(
  callback: (data: WebVitalsData) => void,
  options?: {
    reportingEndpoint?: string;
    enableSentry?: boolean;
    enableAnalytics?: boolean;
  }
): () => void {
  const tracker = getWebVitalsTracker(options);
  return tracker.subscribe(callback);
}

export { WebVitalsTracker };