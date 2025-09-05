/**
 * Automated Benchmark Suite for AI Course Platform
 * 
 * Provides comprehensive automated benchmarking scripts for performance testing
 * across different environments and scenarios.
 */

import { performanceBaseline, PerformanceBaseline, APIPerformanceMetrics } from './performance-baseline';
import { logger } from '@/lib/logger';
import * as Sentry from '@sentry/nextjs';

export interface BenchmarkConfig {
  /** Test environment */
  environment: 'development' | 'staging' | 'production';
  /** Number of iterations per test */
  iterations: number;
  /** Concurrent users to simulate */
  concurrentUsers: number;
  /** Test duration in seconds */
  duration: number;
  /** API endpoints to test */
  endpoints: Array<{
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    payload?: any;
    headers?: Record<string, string>;
  }>;
  /** AI features to benchmark */
  aiFeatures: Array<{
    name: string;
    testFunction: () => Promise<number>;
  }>;
  /** Pages to test for client-side metrics */
  pages: string[];
}

export interface BenchmarkResult {
  testId: string;
  timestamp: Date;
  config: BenchmarkConfig;
  baseline: PerformanceBaseline;
  apiResults: APIBenchmarkResults;
  aiResults: AIBenchmarkResults;
  clientResults: ClientBenchmarkResults;
  overallScore: number;
  passed: boolean;
  recommendations: string[];
}

export interface APIBenchmarkResults {
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number;
  errorRate: number;
  endpointResults: Array<{
    endpoint: string;
    metrics: APIPerformanceMetrics[];
    statistics: {
      min: number;
      max: number;
      mean: number;
      median: number;
      p95: number;
      p99: number;
    };
  }>;
}

export interface AIBenchmarkResults {
  voiceAnalysis: BenchmarkStatistics;
  contentGeneration: BenchmarkStatistics;
  chatResponse: BenchmarkStatistics;
  assessmentGeneration: BenchmarkStatistics;
  tokenEfficiency: {
    averageTokensPerRequest: number;
    costPerRequest: number;
    tokenUtilizationRate: number;
  };
}

export interface ClientBenchmarkResults {
  pageLoadTimes: Array<{
    page: string;
    loadTime: number;
    coreWebVitals: {
      lcp: number;
      fid: number;
      cls: number;
    };
  }>;
  bundleAnalysis: {
    totalSize: number;
    compressionRatio: number;
    unusedCode: number;
  };
  memoryUsage: {
    initial: number;
    peak: number;
    average: number;
    leaks: boolean;
  };
}

export interface BenchmarkStatistics {
  min: number;
  max: number;
  mean: number;
  median: number;
  p95: number;
  p99: number;
  standardDeviation: number;
}

export class BenchmarkSuite {
  private static instance: BenchmarkSuite;
  private isRunning = false;
  private currentTestId: string | null = null;
  private results: BenchmarkResult[] = [];

  public static getInstance(): BenchmarkSuite {
    if (!BenchmarkSuite.instance) {
      BenchmarkSuite.instance = new BenchmarkSuite();
    }
    return BenchmarkSuite.instance;
  }

  /**
   * Run complete benchmark suite
   */
  public async runBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult> {
    if (this.isRunning) {
      throw new Error('Benchmark suite is already running');
    }

    this.isRunning = true;
    this.currentTestId = this.generateTestId();

    logger.info('Starting benchmark suite', 'BENCHMARK', { 
      testId: this.currentTestId, 
      config: { ...config, iterations: config.iterations } 
    });

    try {
      // Start Sentry performance transaction
      return await Sentry.startSpan(
        { name: 'benchmark-suite', op: 'benchmark' },
        async () => {
          const result = await this.executeBenchmark(config);
          this.results.push(result);
          return result;
        }
      );
    } finally {
      this.isRunning = false;
      this.currentTestId = null;
    }
  }

  /**
   * Execute benchmark tests
   */
  private async executeBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult> {
    const startTime = Date.now();

    // Generate performance baseline
    const baseline = await performanceBaseline.generateBaseline('benchmark');

    // Run API benchmarks
    const apiResults = await this.benchmarkAPI(config);

    // Run AI feature benchmarks
    const aiResults = await this.benchmarkAIFeatures(config);

    // Run client-side benchmarks
    const clientResults = await this.benchmarkClientSide(config);

    // Calculate overall score
    const overallScore = this.calculateOverallScore(baseline, apiResults, aiResults, clientResults);

    // Generate recommendations
    const recommendations = this.generateRecommendations(baseline, apiResults, aiResults, clientResults);

    // Determine if benchmark passed
    const passed = this.evaluateBenchmarkPass(overallScore, baseline, apiResults);

    const result: BenchmarkResult = {
      testId: this.currentTestId!,
      timestamp: new Date(),
      config,
      baseline,
      apiResults,
      aiResults,
      clientResults,
      overallScore,
      passed,
      recommendations
    };

    const duration = Date.now() - startTime;
    logger.info('Benchmark suite completed', 'BENCHMARK', {
      testId: this.currentTestId,
      duration,
      overallScore,
      passed
    });

    // Send results to Sentry
    this.sendResultsToSentry(result);

    return result;
  }

  /**
   * Benchmark API endpoints
   */
  private async benchmarkAPI(config: BenchmarkConfig): Promise<APIBenchmarkResults> {
    const endpointResults: APIBenchmarkResults['endpointResults'] = [];
    const allMetrics: APIPerformanceMetrics[] = [];

    for (const endpoint of config.endpoints) {
      const metrics: APIPerformanceMetrics[] = [];

      logger.info(`Benchmarking API endpoint: ${endpoint.method} ${endpoint.url}`, 'BENCHMARK');

      // Run iterations for each endpoint
      for (let i = 0; i < config.iterations; i++) {
        const startTime = performance.now();
        
        try {
          const response = await this.makeAPIRequest(endpoint);
          const endTime = performance.now();

          const metric = performanceBaseline.measureAPIPerformance(
            endpoint.url,
            endpoint.method,
            startTime,
            endTime,
            response.status,
            endpoint.payload ? JSON.stringify(endpoint.payload).length : undefined,
            response.data ? JSON.stringify(response.data).length : undefined
          );

          metrics.push(metric);
          allMetrics.push(metric);
        } catch (error) {
          const endTime = performance.now();
          const metric = performanceBaseline.measureAPIPerformance(
            endpoint.url,
            endpoint.method,
            startTime,
            endTime,
            500 // Error status
          );
          metrics.push(metric);
          allMetrics.push(metric);
          
          logger.error(`API benchmark error for ${endpoint.url}`, 'BENCHMARK', { error });
        }

        // Add delay between requests to avoid overwhelming the server
        await this.delay(100);
      }

      // Calculate statistics for this endpoint
      const responseTimes = metrics.map(m => m.responseTime);
      const statistics = this.calculateStatistics(responseTimes);

      endpointResults.push({
        endpoint: `${endpoint.method} ${endpoint.url}`,
        metrics,
        statistics
      });
    }

    // Calculate overall API metrics
    const allResponseTimes = allMetrics.map(m => m.responseTime);
    const totalErrors = allMetrics.filter(m => m.errorRate > 0).length;
    const totalDuration = allMetrics.reduce((sum, m) => sum + m.responseTime, 0);

    return {
      averageResponseTime: this.calculateMean(allResponseTimes),
      p95ResponseTime: this.calculatePercentile(allResponseTimes, 95),
      p99ResponseTime: this.calculatePercentile(allResponseTimes, 99),
      throughput: (allMetrics.length * 1000) / totalDuration, // requests per second
      errorRate: totalErrors / allMetrics.length,
      endpointResults
    };
  }

  /**
   * Benchmark AI features
   */
  private async benchmarkAIFeatures(config: BenchmarkConfig): Promise<AIBenchmarkResults> {
    const results: Partial<AIBenchmarkResults> = {
      tokenEfficiency: {
        averageTokensPerRequest: 0,
        costPerRequest: 0,
        tokenUtilizationRate: 0
      }
    };

    // Benchmark each AI feature
    for (const feature of config.aiFeatures) {
      const times: number[] = [];
      let totalTokens = 0;
      let totalCost = 0;

      logger.info(`Benchmarking AI feature: ${feature.name}`, 'BENCHMARK');

      for (let i = 0; i < config.iterations; i++) {
        try {
          const duration = await feature.testFunction();
          times.push(duration);

          // Simulate token usage (in real implementation, this would come from the AI service)
          const estimatedTokens = Math.floor(duration / 10) + Math.random() * 100;
          totalTokens += estimatedTokens;
          totalCost += estimatedTokens * 0.0001; // Example cost calculation

        } catch (error) {
          logger.error(`AI feature benchmark error: ${feature.name}`, 'BENCHMARK', { error });
          times.push(10000); // High penalty for failures
        }

        await this.delay(200); // Delay between AI requests
      }

      const statistics = this.calculateStatistics(times);
      
      // Map feature name to result property
      switch (feature.name.toLowerCase()) {
        case 'voice_analysis':
        case 'voiceanalysis':
          results.voiceAnalysis = statistics;
          break;
        case 'content_generation':
        case 'contentgeneration':
          results.contentGeneration = statistics;
          break;
        case 'chat_response':
        case 'chatresponse':
          results.chatResponse = statistics;
          break;
        case 'assessment_generation':
        case 'assessmentgeneration':
          results.assessmentGeneration = statistics;
          break;
      }

      // Update token efficiency
      results.tokenEfficiency!.averageTokensPerRequest += totalTokens / config.iterations;
      results.tokenEfficiency!.costPerRequest += totalCost / config.iterations;
    }

    // Calculate token utilization rate (example calculation)
    results.tokenEfficiency!.tokenUtilizationRate = 
      results.tokenEfficiency!.averageTokensPerRequest > 0 ? 0.85 : 0;

    return results as AIBenchmarkResults;
  }

  /**
   * Benchmark client-side performance
   */
  private async benchmarkClientSide(config: BenchmarkConfig): Promise<ClientBenchmarkResults> {
    const pageLoadTimes: ClientBenchmarkResults['pageLoadTimes'] = [];
    let totalBundleSize = 0;
    const memoryReadings: number[] = [];

    for (const page of config.pages) {
      logger.info(`Benchmarking client-side performance for page: ${page}`, 'BENCHMARK');

      try {
        // Simulate page load testing (in real implementation, this would use Playwright or similar)
        const loadStartTime = performance.now();
        
        // Simulate page navigation and loading
        await this.simulatePageLoad(page);
        
        const loadEndTime = performance.now();
        const loadTime = loadEndTime - loadStartTime;

        // Measure Core Web Vitals
        const coreWebVitals = await performanceBaseline.measureCoreWebVitals();
        
        pageLoadTimes.push({
          page,
          loadTime,
          coreWebVitals: {
            lcp: coreWebVitals.lcp,
            fid: coreWebVitals.fid,
            cls: coreWebVitals.cls
          }
        });

        // Measure memory usage
        const clientMetrics = await performanceBaseline.measureClientSideMetrics();
        memoryReadings.push(clientMetrics.memoryUsage.used);
        totalBundleSize += clientMetrics.bundleSize.total;

      } catch (error) {
        logger.error(`Client-side benchmark error for page: ${page}`, 'BENCHMARK', { error });
      }
    }

    return {
      pageLoadTimes,
      bundleAnalysis: {
        totalSize: totalBundleSize,
        compressionRatio: 0.7, // Example ratio
        unusedCode: totalBundleSize * 0.15 // Estimate 15% unused
      },
      memoryUsage: {
        initial: memoryReadings[0] || 0,
        peak: Math.max(...memoryReadings),
        average: this.calculateMean(memoryReadings),
        leaks: this.detectMemoryLeaks(memoryReadings)
      }
    };
  }

  /**
   * Make API request for benchmarking
   */
  private async makeAPIRequest(endpoint: BenchmarkConfig['endpoints'][0]): Promise<any> {
    const { url, method, payload, headers = {} } = endpoint;

    // In a real implementation, this would use fetch or axios
    // For now, simulate API call
    await this.delay(Math.random() * 200 + 50); // Simulate network delay

    return {
      status: Math.random() > 0.05 ? 200 : 500, // 5% error rate
      data: { success: true, timestamp: Date.now() }
    };
  }

  /**
   * Simulate page load for client-side benchmarking
   */
  private async simulatePageLoad(page: string): Promise<void> {
    // Simulate different load times based on page complexity
    const baseLoadTime = page.includes('dashboard') ? 800 : 
                        page.includes('learning') ? 600 : 
                        page.includes('assessment') ? 1000 : 400;
    
    const variation = Math.random() * 200 - 100; // ±100ms variation
    await this.delay(baseLoadTime + variation);
  }

  /**
   * Calculate statistics for a dataset
   */
  private calculateStatistics(data: number[]): BenchmarkStatistics {
    if (data.length === 0) {
      return {
        min: 0, max: 0, mean: 0, median: 0, p95: 0, p99: 0, standardDeviation: 0
      };
    }

    const sorted = [...data].sort((a, b) => a - b);
    const mean = this.calculateMean(data);
    
    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean,
      median: this.calculateMedian(sorted),
      p95: this.calculatePercentile(sorted, 95),
      p99: this.calculatePercentile(sorted, 99),
      standardDeviation: this.calculateStandardDeviation(data, mean)
    };
  }

  /**
   * Calculate mean of a dataset
   */
  private calculateMean(data: number[]): number {
    return data.length > 0 ? data.reduce((sum, val) => sum + val, 0) / data.length : 0;
  }

  /**
   * Calculate median of a sorted dataset
   */
  private calculateMedian(sortedData: number[]): number {
    const mid = Math.floor(sortedData.length / 2);
    return sortedData.length % 2 === 0
      ? (sortedData[mid - 1] + sortedData[mid]) / 2
      : sortedData[mid];
  }

  /**
   * Calculate percentile of a sorted dataset
   */
  private calculatePercentile(sortedData: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedData.length) - 1;
    return sortedData[Math.max(0, Math.min(index, sortedData.length - 1))];
  }

  /**
   * Calculate standard deviation
   */
  private calculateStandardDeviation(data: number[], mean: number): number {
    if (data.length <= 1) return 0;
    
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (data.length - 1);
    return Math.sqrt(variance);
  }

  /**
   * Calculate overall benchmark score
   */
  private calculateOverallScore(
    baseline: PerformanceBaseline,
    apiResults: APIBenchmarkResults,
    aiResults: AIBenchmarkResults,
    clientResults: ClientBenchmarkResults
  ): number {
    // Weight different aspects of performance
    const sentryScore = baseline.sentryPerformanceScore * 0.3;
    const apiScore = this.calculateAPIScore(apiResults) * 0.25;
    const aiScore = this.calculateAIScore(aiResults) * 0.25;
    const clientScore = this.calculateClientScore(clientResults) * 0.2;

    return Math.round(sentryScore + apiScore + aiScore + clientScore);
  }

  /**
   * Calculate API performance score
   */
  private calculateAPIScore(results: APIBenchmarkResults): number {
    const thresholds = performanceBaseline.getThresholds().api;
    
    const responseTimeScore = results.averageResponseTime <= thresholds.responseTime.good ? 100 :
                             results.averageResponseTime <= thresholds.responseTime.acceptable ? 75 :
                             results.averageResponseTime <= thresholds.responseTime.poor ? 50 : 0;
    
    const errorRateScore = results.errorRate <= thresholds.errorRate.good ? 100 :
                          results.errorRate <= thresholds.errorRate.acceptable ? 75 :
                          results.errorRate <= thresholds.errorRate.poor ? 50 : 0;
    
    const throughputScore = results.throughput >= 100 ? 100 :
                           results.throughput >= 50 ? 75 :
                           results.throughput >= 10 ? 50 : 0;

    return Math.round((responseTimeScore * 0.4 + errorRateScore * 0.4 + throughputScore * 0.2));
  }

  /**
   * Calculate AI features performance score
   */
  private calculateAIScore(results: AIBenchmarkResults): number {
    const thresholds = performanceBaseline.getThresholds().ai;
    let totalScore = 0;
    let featureCount = 0;

    // Score each AI feature
    if (results.voiceAnalysis) {
      totalScore += this.scoreAIFeature(results.voiceAnalysis.mean, thresholds.voiceAnalysis);
      featureCount++;
    }
    if (results.contentGeneration) {
      totalScore += this.scoreAIFeature(results.contentGeneration.mean, thresholds.contentGeneration);
      featureCount++;
    }
    if (results.chatResponse) {
      totalScore += this.scoreAIFeature(results.chatResponse.mean, thresholds.chatResponse);
      featureCount++;
    }
    if (results.assessmentGeneration) {
      totalScore += this.scoreAIFeature(results.assessmentGeneration.mean, thresholds.contentGeneration); // Use content generation thresholds
      featureCount++;
    }

    // Factor in token efficiency
    const efficiencyScore = results.tokenEfficiency.tokenUtilizationRate * 100;

    return featureCount > 0 
      ? Math.round(((totalScore / featureCount) * 0.8) + (efficiencyScore * 0.2))
      : 0;
  }

  /**
   * Score individual AI feature
   */
  private scoreAIFeature(time: number, thresholds: { good: number; acceptable: number; poor: number }): number {
    if (time <= thresholds.good) return 100;
    if (time <= thresholds.acceptable) return 75;
    if (time <= thresholds.poor) return 50;
    return 0;
  }

  /**
   * Calculate client-side performance score
   */
  private calculateClientScore(results: ClientBenchmarkResults): number {
    if (results.pageLoadTimes.length === 0) return 0;

    const avgLoadTime = this.calculateMean(results.pageLoadTimes.map(p => p.loadTime));
    const avgLCP = this.calculateMean(results.pageLoadTimes.map(p => p.coreWebVitals.lcp));
    const avgCLS = this.calculateMean(results.pageLoadTimes.map(p => p.coreWebVitals.cls));

    const loadTimeScore = avgLoadTime <= 3000 ? 100 : avgLoadTime <= 5000 ? 75 : 50;
    const lcpScore = avgLCP <= 2500 ? 100 : avgLCP <= 4000 ? 75 : 50;
    const clsScore = avgCLS <= 0.1 ? 100 : avgCLS <= 0.25 ? 75 : 50;
    const memoryScore = !results.memoryUsage.leaks ? 100 : 50;

    return Math.round((loadTimeScore * 0.3 + lcpScore * 0.3 + clsScore * 0.2 + memoryScore * 0.2));
  }

  /**
   * Generate performance recommendations
   */
  private generateRecommendations(
    baseline: PerformanceBaseline,
    apiResults: APIBenchmarkResults,
    aiResults: AIBenchmarkResults,
    clientResults: ClientBenchmarkResults
  ): string[] {
    const recommendations: string[] = [];
    const thresholds = performanceBaseline.getThresholds();

    // API recommendations
    if (apiResults.averageResponseTime > thresholds.api.responseTime.acceptable) {
      recommendations.push('Optimize API response times - consider caching, database query optimization, or CDN implementation');
    }
    if (apiResults.errorRate > thresholds.api.errorRate.acceptable) {
      recommendations.push('Investigate and fix API errors to improve reliability');
    }

    // Core Web Vitals recommendations
    if (baseline.coreWebVitals.lcp > thresholds.coreWebVitals.lcp.needsImprovement) {
      recommendations.push('Improve Largest Contentful Paint - optimize image loading, reduce server response time');
    }
    if (baseline.coreWebVitals.cls > thresholds.coreWebVitals.cls.needsImprovement) {
      recommendations.push('Reduce Cumulative Layout Shift - ensure proper image dimensions and avoid dynamic content injection');
    }

    // Bundle size recommendations
    if (baseline.clientSideMetrics.bundleSize.initial > thresholds.resources.bundleSize.acceptable) {
      recommendations.push('Optimize bundle size - implement code splitting, tree shaking, and remove unused dependencies');
    }

    // Memory usage recommendations
    if (baseline.clientSideMetrics.memoryUsage.percentage > thresholds.resources.memoryUsage.acceptable) {
      recommendations.push('Optimize memory usage - investigate memory leaks and optimize component lifecycle');
    }

    // AI feature recommendations
    if (aiResults.voiceAnalysis && aiResults.voiceAnalysis.mean > thresholds.ai.voiceAnalysis.acceptable) {
      recommendations.push('Optimize voice analysis performance - consider preprocessing optimization or model efficiency improvements');
    }
    if (aiResults.contentGeneration && aiResults.contentGeneration.mean > thresholds.ai.contentGeneration.acceptable) {
      recommendations.push('Improve content generation speed - optimize prompts or consider caching strategies');
    }

    // Token efficiency recommendations
    if (aiResults.tokenEfficiency.tokenUtilizationRate < 0.7) {
      recommendations.push('Improve AI token efficiency - optimize prompts and reduce unnecessary token usage');
    }

    return recommendations;
  }

  /**
   * Evaluate if benchmark passed overall thresholds
   */
  private evaluateBenchmarkPass(
    overallScore: number,
    baseline: PerformanceBaseline,
    apiResults: APIBenchmarkResults
  ): boolean {
    // Benchmark passes if:
    // 1. Overall score >= 75
    // 2. No critical failures (API error rate < 10%, Core Web Vitals not in "poor" range)
    
    const thresholds = performanceBaseline.getThresholds();
    
    const hasScorePass = overallScore >= 75;
    const hasNoAPIFailure = apiResults.errorRate < 0.1;
    const hasAcceptableLCP = baseline.coreWebVitals.lcp <= thresholds.coreWebVitals.lcp.poor;
    const hasAcceptableCLS = baseline.coreWebVitals.cls <= thresholds.coreWebVitals.cls.poor;

    return hasScorePass && hasNoAPIFailure && hasAcceptableLCP && hasAcceptableCLS;
  }

  /**
   * Detect memory leaks from memory readings
   */
  private detectMemoryLeaks(memoryReadings: number[]): boolean {
    if (memoryReadings.length < 3) return false;

    // Simple detection: memory increases consistently
    let increasingCount = 0;
    for (let i = 1; i < memoryReadings.length; i++) {
      if (memoryReadings[i] > memoryReadings[i - 1]) {
        increasingCount++;
      }
    }

    // If memory increases in more than 70% of readings, consider it a leak
    return (increasingCount / (memoryReadings.length - 1)) > 0.7;
  }

  /**
   * Send benchmark results to Sentry
   */
  private sendResultsToSentry(result: BenchmarkResult): void {
    // Set measurements
    Sentry.setMeasurement('benchmark_overall_score', result.overallScore, 'none');
    Sentry.setMeasurement('benchmark_api_response_time', result.apiResults.averageResponseTime, 'millisecond');
    Sentry.setMeasurement('benchmark_api_error_rate', result.apiResults.errorRate, 'ratio');
    Sentry.setMeasurement('benchmark_sentry_score', result.baseline.sentryPerformanceScore, 'none');

    // Set tags
    Sentry.setTag('benchmark_environment', result.config.environment);
    Sentry.setTag('benchmark_passed', result.passed.toString());
    Sentry.setTag('benchmark_test_id', result.testId);

    // Set context
    Sentry.setContext('benchmark_results', {
      testId: result.testId,
      overallScore: result.overallScore,
      passed: result.passed,
      recommendations: result.recommendations.length,
      apiEndpoints: result.config.endpoints.length,
      iterations: result.config.iterations
    });

    // Add breadcrumb
    Sentry.addBreadcrumb({
      category: 'benchmark',
      message: `Benchmark completed: ${result.passed ? 'PASSED' : 'FAILED'}`,
      level: result.passed ? 'info' : 'warning',
      data: {
        score: result.overallScore,
        testId: result.testId
      }
    });

    logger.info('Benchmark results sent to Sentry', 'BENCHMARK', {
      testId: result.testId,
      score: result.overallScore
    });
  }

  /**
   * Generate unique test ID
   */
  private generateTestId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `benchmark_${timestamp}_${random}`;
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get default benchmark configuration
   */
  public getDefaultConfig(): BenchmarkConfig {
    return {
      environment: process.env.NODE_ENV as 'development' | 'staging' | 'production' || 'development',
      iterations: 10,
      concurrentUsers: 5,
      duration: 60,
      endpoints: [
        { url: '/api/chat', method: 'POST', payload: { message: 'Hello' } },
        { url: '/api/recommendations/feedback', method: 'POST', payload: { feedback: 'positive' } },
        { url: '/health', method: 'GET' }
      ],
      aiFeatures: [
        {
          name: 'chat_response',
          testFunction: async () => {
            const start = performance.now();
            await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
            return performance.now() - start;
          }
        }
      ],
      pages: ['/', '/learning', '/dashboard']
    };
  }

  /**
   * Get benchmark history
   */
  public getBenchmarkHistory(): BenchmarkResult[] {
    return [...this.results];
  }

  /**
   * Get current test status
   */
  public getStatus(): { isRunning: boolean; currentTestId: string | null } {
    return {
      isRunning: this.isRunning,
      currentTestId: this.currentTestId
    };
  }
}

// Export singleton instance
export const benchmarkSuite = BenchmarkSuite.getInstance();

// Export convenience functions
export const runBenchmark = (config?: Partial<BenchmarkConfig>) => {
  const defaultConfig = benchmarkSuite.getDefaultConfig();
  const finalConfig = { ...defaultConfig, ...config };
  return benchmarkSuite.runBenchmark(finalConfig);
};

export const getBenchmarkHistory = () => benchmarkSuite.getBenchmarkHistory();
export const getBenchmarkStatus = () => benchmarkSuite.getStatus();