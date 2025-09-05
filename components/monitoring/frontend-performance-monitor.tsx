'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Zap, 
  Gauge, 
  Timer, 
  Eye, 
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Monitor,
  Smartphone,
  Wifi,
  HardDrive
} from 'lucide-react';
import { usePerformanceMetrics } from '@/lib/hooks/use-performance-metrics';
import { useWebVitalsTracker } from '@/lib/hooks/use-web-vitals-tracker';

interface PerformanceThresholds {
  lcp: { good: number; poor: number };
  fid: { good: number; poor: number };
  cls: { good: number; poor: number };
  ttfb: { good: number; poor: number };
  fcp: { good: number; poor: number };
  tti: { good: number; poor: number };
}

const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  lcp: { good: 2500, poor: 4000 },
  fid: { good: 100, poor: 300 },
  cls: { good: 0.1, poor: 0.25 },
  ttfb: { good: 800, poor: 1800 },
  fcp: { good: 1800, poor: 3000 },
  tti: { good: 3800, poor: 7300 },
};

interface ComponentProps {
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
  showAdvanced?: boolean;
}

export function FrontendPerformanceMonitor({ 
  className = '', 
  autoRefresh = true,
  refreshInterval = 30000,
  showAdvanced = false 
}: ComponentProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isRecording, setIsRecording] = useState(false);
  const [performanceData, setPerformanceData] = useState<any>(null);
  
  const { 
    metrics, 
    isLoading: metricsLoading, 
    error: metricsError,
    refresh: refreshMetrics 
  } = usePerformanceMetrics({ 
    autoRefresh, 
    interval: refreshInterval 
  });

  const {
    webVitals,
    isTracking,
    startTracking,
    stopTracking,
    clearMetrics
  } = useWebVitalsTracker();

  // Calculate performance scores
  const performanceScores = useMemo(() => {
    if (!webVitals) return null;

    const calculateScore = (value: number, thresholds: { good: number; poor: number }) => {
      if (value <= thresholds.good) return 100;
      if (value >= thresholds.poor) return 0;
      return Math.round(100 - ((value - thresholds.good) / (thresholds.poor - thresholds.good)) * 100);
    };

    return {
      lcp: webVitals.lcp ? calculateScore(webVitals.lcp, PERFORMANCE_THRESHOLDS.lcp) : null,
      fid: webVitals.fid ? calculateScore(webVitals.fid, PERFORMANCE_THRESHOLDS.fid) : null,
      cls: webVitals.cls ? calculateScore(webVitals.cls * 1000, { good: 100, poor: 250 }) : null,
      fcp: webVitals.fcp ? calculateScore(webVitals.fcp, PERFORMANCE_THRESHOLDS.fcp) : null,
      ttfb: webVitals.ttfb ? calculateScore(webVitals.ttfb, PERFORMANCE_THRESHOLDS.ttfb) : null,
    };
  }, [webVitals]);

  // Calculate overall performance score
  const overallScore = useMemo(() => {
    if (!performanceScores) return null;
    
    const scores = Object.values(performanceScores).filter(score => score !== null) as number[];
    if (scores.length === 0) return null;
    
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
  }, [performanceScores]);

  // Get performance status
  const getPerformanceStatus = useCallback((score: number | null) => {
    if (!score) return { status: 'unknown', color: 'gray', text: 'N/A' };
    if (score >= 90) return { status: 'excellent', color: 'green', text: 'Excellent' };
    if (score >= 70) return { status: 'good', color: 'blue', text: 'Good' };
    if (score >= 50) return { status: 'needs-improvement', color: 'yellow', text: 'Needs Improvement' };
    return { status: 'poor', color: 'red', text: 'Poor' };
  }, []);

  // Format metric values
  const formatMetric = useCallback((value: number | null, unit: string) => {
    if (value === null) return 'N/A';
    
    switch (unit) {
      case 'ms':
        return `${Math.round(value)}ms`;
      case 's':
        return `${(value / 1000).toFixed(1)}s`;
      case 'score':
        return Math.round(value).toString();
      case 'cls':
        return value.toFixed(3);
      default:
        return value.toString();
    }
  }, []);

  // Start performance recording
  const startRecording = useCallback(async () => {
    setIsRecording(true);
    await startTracking();
    
    // Collect additional performance data
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');
      
      setPerformanceData({
        navigation,
        paint,
        memory: (performance as any).memory,
        timing: performance.timing,
      });
    }
  }, [startTracking]);

  // Stop performance recording
  const stopRecording = useCallback(async () => {
    setIsRecording(false);
    await stopTracking();
  }, [stopTracking]);

  // Effect for auto-refresh
  useEffect(() => {
    if (autoRefresh && !isRecording) {
      const interval = setInterval(() => {
        refreshMetrics();
      }, refreshInterval);
      
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, isRecording, refreshMetrics]);

  // Render metric card
  const renderMetricCard = (
    title: string, 
    value: number | null, 
    unit: string, 
    threshold: { good: number; poor: number },
    icon: React.ReactNode,
    description: string
  ) => {
    const score = value ? (value <= threshold.good ? 100 : value >= threshold.poor ? 0 : 
      Math.round(100 - ((value - threshold.good) / (threshold.poor - threshold.good)) * 100)) : null;
    const status = getPerformanceStatus(score);
    
    return (
      <Card className="h-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <Badge variant={status.color === 'red' ? 'destructive' : 
                         status.color === 'yellow' ? 'secondary' : 'default'}>
            {status.text}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {formatMetric(value, unit)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
          {score !== null && (
            <div className="mt-2">
              <Progress value={score} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>Poor</span>
                <span>Good</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (metricsError) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Error loading performance metrics: {metricsError.message}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Frontend Performance Monitor</h2>
          <p className="text-muted-foreground">
            Real-time performance metrics and Core Web Vitals tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isRecording ? "destructive" : "default"}
            onClick={isRecording ? stopRecording : startRecording}
            className="flex items-center gap-2"
          >
            {isRecording ? (
              <>
                <Activity className="h-4 w-4 animate-pulse" />
                Stop Recording
              </>
            ) : (
              <>
                <Activity className="h-4 w-4" />
                Start Recording
              </>
            )}
          </Button>
          <Button variant="outline" onClick={refreshMetrics} disabled={metricsLoading}>
            <BarChart3 className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Score */}
      {overallScore !== null && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Overall Performance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-4xl font-bold">
                {overallScore}
                <span className="text-lg text-muted-foreground ml-1">/100</span>
              </div>
              <Badge 
                variant={overallScore >= 90 ? 'default' : 
                        overallScore >= 70 ? 'secondary' : 'destructive'}
                className="text-sm px-3 py-1"
              >
                {getPerformanceStatus(overallScore).text}
              </Badge>
            </div>
            <Progress value={overallScore} className="mt-4 h-3" />
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {renderMetricCard(
              'Largest Contentful Paint',
              webVitals?.lcp || null,
              'ms',
              PERFORMANCE_THRESHOLDS.lcp,
              <Eye className="h-4 w-4" />,
              'Time to render largest content element'
            )}
            {renderMetricCard(
              'First Input Delay',
              webVitals?.fid || null,
              'ms',
              PERFORMANCE_THRESHOLDS.fid,
              <Timer className="h-4 w-4" />,
              'Time from first interaction to browser response'
            )}
            {renderMetricCard(
              'Cumulative Layout Shift',
              webVitals?.cls || null,
              'cls',
              { good: 0.1, poor: 0.25 },
              <Monitor className="h-4 w-4" />,
              'Visual stability of page layout'
            )}
          </div>

          {/* Additional Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {renderMetricCard(
              'First Contentful Paint',
              webVitals?.fcp || null,
              'ms',
              PERFORMANCE_THRESHOLDS.fcp,
              <Zap className="h-4 w-4" />,
              'First paint of any content'
            )}
            {renderMetricCard(
              'Time to First Byte',
              webVitals?.ttfb || null,
              'ms',
              PERFORMANCE_THRESHOLDS.ttfb,
              <Wifi className="h-4 w-4" />,
              'Server response time'
            )}
            {renderMetricCard(
              'Time to Interactive',
              performanceData?.navigation?.loadEventEnd || null,
              'ms',
              PERFORMANCE_THRESHOLDS.tti,
              <CheckCircle className="h-4 w-4" />,
              'Time until page is fully interactive'
            )}
            {renderMetricCard(
              'Total Blocking Time',
              null, // This would need to be calculated
              'ms',
              { good: 200, poor: 600 },
              <Clock className="h-4 w-4" />,
              'Total time of blocking tasks'
            )}
          </div>
        </TabsContent>

        {/* Core Web Vitals Tab */}
        <TabsContent value="vitals" className="space-y-4">
          <div className="grid gap-6">
            {/* LCP Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Largest Contentful Paint (LCP)
                </CardTitle>
                <CardDescription>
                  Measures loading performance. Good LCP scores are 2.5s or less.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {formatMetric(webVitals?.lcp || null, 'ms')}
                    </span>
                    <Badge variant={webVitals?.lcp && webVitals.lcp <= 2500 ? 'default' : 
                                   webVitals?.lcp && webVitals.lcp <= 4000 ? 'secondary' : 'destructive'}>
                      {webVitals?.lcp ? (webVitals.lcp <= 2500 ? 'Good' : 
                                        webVitals.lcp <= 4000 ? 'Needs Improvement' : 'Poor') : 'N/A'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Good (&lt; 2.5s)</span>
                      <span className="text-green-600">0 - 2500ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Needs Improvement</span>
                      <span className="text-yellow-600">2500 - 4000ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Poor (&gt; 4s)</span>
                      <span className="text-red-600">&gt; 4000ms</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FID Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  First Input Delay (FID)
                </CardTitle>
                <CardDescription>
                  Measures interactivity. Good FID scores are 100ms or less.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {formatMetric(webVitals?.fid || null, 'ms')}
                    </span>
                    <Badge variant={webVitals?.fid && webVitals.fid <= 100 ? 'default' : 
                                   webVitals?.fid && webVitals.fid <= 300 ? 'secondary' : 'destructive'}>
                      {webVitals?.fid ? (webVitals.fid <= 100 ? 'Good' : 
                                        webVitals.fid <= 300 ? 'Needs Improvement' : 'Poor') : 'N/A'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Good (&lt; 100ms)</span>
                      <span className="text-green-600">0 - 100ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Needs Improvement</span>
                      <span className="text-yellow-600">100 - 300ms</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Poor (&gt; 300ms)</span>
                      <span className="text-red-600">&gt; 300ms</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* CLS Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Cumulative Layout Shift (CLS)
                </CardTitle>
                <CardDescription>
                  Measures visual stability. Good CLS scores are 0.1 or less.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {formatMetric(webVitals?.cls || null, 'cls')}
                    </span>
                    <Badge variant={webVitals?.cls && webVitals.cls <= 0.1 ? 'default' : 
                                   webVitals?.cls && webVitals.cls <= 0.25 ? 'secondary' : 'destructive'}>
                      {webVitals?.cls ? (webVitals.cls <= 0.1 ? 'Good' : 
                                        webVitals.cls <= 0.25 ? 'Needs Improvement' : 'Poor') : 'N/A'}
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Good (&lt; 0.1)</span>
                      <span className="text-green-600">0 - 0.1</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Needs Improvement</span>
                      <span className="text-yellow-600">0.1 - 0.25</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Poor (&gt; 0.25)</span>
                      <span className="text-red-600">&gt; 0.25</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Resources Tab */}
        <TabsContent value="resources" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Memory Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-5 w-5" />
                  Memory Usage
                </CardTitle>
              </CardHeader>
              <CardContent>
                {performanceData?.memory ? (
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Used Heap Size:</span>
                      <span className="font-mono">
                        {Math.round(performanceData.memory.usedJSHeapSize / 1024 / 1024)}MB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Heap Size:</span>
                      <span className="font-mono">
                        {Math.round(performanceData.memory.totalJSHeapSize / 1024 / 1024)}MB
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Heap Size Limit:</span>
                      <span className="font-mono">
                        {Math.round(performanceData.memory.jsHeapSizeLimit / 1024 / 1024)}MB
                      </span>
                    </div>
                    <Progress 
                      value={(performanceData.memory.usedJSHeapSize / performanceData.memory.jsHeapSizeLimit) * 100} 
                      className="mt-2"
                    />
                  </div>
                ) : (
                  <p className="text-muted-foreground">Memory information not available</p>
                )}
              </CardContent>
            </Card>

            {/* Navigation Timing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Navigation Timing
                </CardTitle>
              </CardHeader>
              <CardContent>
                {performanceData?.navigation ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span>DNS Lookup:</span>
                      <span className="font-mono">
                        {Math.round(performanceData.navigation.domainLookupEnd - performanceData.navigation.domainLookupStart)}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>TCP Connection:</span>
                      <span className="font-mono">
                        {Math.round(performanceData.navigation.connectEnd - performanceData.navigation.connectStart)}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Request:</span>
                      <span className="font-mono">
                        {Math.round(performanceData.navigation.responseStart - performanceData.navigation.requestStart)}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Response:</span>
                      <span className="font-mono">
                        {Math.round(performanceData.navigation.responseEnd - performanceData.navigation.responseStart)}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>DOM Processing:</span>
                      <span className="font-mono">
                        {Math.round(performanceData.navigation.domComplete - performanceData.navigation.domLoading)}ms
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Navigation timing not available</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Performance Insights & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Recommendations based on current metrics */}
                {webVitals?.lcp && webVitals.lcp > 2500 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>LCP Optimization:</strong> Consider optimizing images, improving server response time, 
                      or implementing resource preloading to improve Largest Contentful Paint.
                    </AlertDescription>
                  </Alert>
                )}
                
                {webVitals?.fid && webVitals.fid > 100 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>FID Optimization:</strong> Reduce JavaScript execution time, break up long tasks, 
                      and consider code splitting to improve First Input Delay.
                    </AlertDescription>
                  </Alert>
                )}
                
                {webVitals?.cls && webVitals.cls > 0.1 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>CLS Optimization:</strong> Ensure images and ads have defined dimensions, 
                      avoid inserting content above existing content, and use CSS transform animations.
                    </AlertDescription>
                  </Alert>
                )}

                {/* General recommendations */}
                <div className="space-y-2">
                  <h4 className="font-semibold">General Optimization Recommendations:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>Implement proper image optimization with next/image</li>
                    <li>Use React.memo and useMemo for expensive computations</li>
                    <li>Implement code splitting with dynamic imports</li>
                    <li>Optimize bundle size with tree shaking</li>
                    <li>Use service workers for caching strategies</li>
                    <li>Implement proper loading states and skeleton screens</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default FrontendPerformanceMonitor;