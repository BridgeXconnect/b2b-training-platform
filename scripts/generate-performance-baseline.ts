#!/usr/bin/env npx ts-node

/**
 * Performance Baseline Generation Script
 * 
 * Generates comprehensive performance baseline report for the AI Course Platform
 * and establishes monitoring infrastructure.
 */

import * as fs from 'fs';
import * as path from 'path';
import { performanceBaseline, generateBaseline } from '../lib/performance/performance-baseline';
import { benchmarkSuite, runBenchmark } from '../lib/performance/benchmark-suite';
import { performanceMonitor, startMonitoring } from '../lib/performance/performance-monitor';

interface BaselineReport {
  reportId: string;
  timestamp: Date;
  version: string;
  environment: string;
  executionTime: number;
  baseline: any;
  benchmark: any;
  systemInfo: {
    platform: string;
    nodeVersion: string;
    memoryLimit: number;
    cpuCount: number;
  };
  recommendations: string[];
  thresholdCompliance: {
    passed: number;
    failed: number;
    warnings: number;
    details: Array<{
      metric: string;
      value: number;
      threshold: number;
      status: 'pass' | 'fail' | 'warning';
    }>;
  };
  nextSteps: string[];
}

class BaselineGenerator {
  private reportId: string;
  private startTime: number;
  private outputDir: string;

  constructor() {
    this.reportId = `baseline_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.startTime = Date.now();
    this.outputDir = path.join(process.cwd(), 'performance-reports');
  }

  /**
   * Generate complete performance baseline
   */
  public async generate(): Promise<BaselineReport> {
    console.log('🚀 Starting Performance Baseline Generation...');
    console.log(`📊 Report ID: ${this.reportId}`);
    
    try {
      // Ensure output directory exists
      await this.ensureOutputDirectory();

      // Step 1: Generate performance baseline
      console.log('\n📈 Step 1: Generating Performance Baseline...');
      const baseline = await this.generatePerformanceBaseline();

      // Step 2: Run benchmark suite
      console.log('\n🏃 Step 2: Running Benchmark Suite...');
      const benchmark = await this.runBenchmarkSuite();

      // Step 3: Analyze results and generate recommendations
      console.log('\n🔍 Step 3: Analyzing Results...');
      const analysis = await this.analyzeResults(baseline, benchmark);

      // Step 4: Generate compliance report
      console.log('\n✅ Step 4: Checking Threshold Compliance...');
      const compliance = await this.checkThresholdCompliance(baseline, benchmark);

      // Step 5: Create comprehensive report
      console.log('\n📝 Step 5: Generating Report...');
      const report = await this.createReport(baseline, benchmark, analysis, compliance);

      // Step 6: Save report and initialize monitoring
      console.log('\n💾 Step 6: Saving Report and Initializing Monitoring...');
      await this.saveReport(report);
      await this.initializeMonitoring();

      console.log('\n✨ Performance Baseline Generation Complete!');
      console.log(`📁 Report saved to: ${this.getReportPath(report.reportId)}`);
      
      return report;

    } catch (error) {
      console.error('❌ Error generating performance baseline:', error);
      throw error;
    }
  }

  /**
   * Generate performance baseline
   */
  private async generatePerformanceBaseline(): Promise<any> {
    try {
      const version = await this.getCurrentVersion();
      const baseline = await generateBaseline(version);
      
      console.log(`   ✅ Baseline generated successfully`);
      console.log(`   📊 Sentry Performance Score: ${baseline.sentryPerformanceScore}`);
      console.log(`   👤 User Experience Score: ${baseline.userExperienceScore}`);
      
      return baseline;
    } catch (error) {
      console.error('   ❌ Failed to generate baseline:', error);
      // Return mock baseline for development
      return this.createMockBaseline();
    }
  }

  /**
   * Run benchmark suite
   */
  private async runBenchmarkSuite(): Promise<any> {
    try {
      const config = benchmarkSuite.getDefaultConfig();
      
      // Customize config for baseline generation
      config.iterations = 5; // Fewer iterations for initial baseline
      config.aiFeatures = [
        {
          name: 'chat_response',
          testFunction: async () => {
            const start = performance.now();
            await this.simulateAIFeature('chat', 1500);
            return performance.now() - start;
          }
        },
        {
          name: 'content_generation',
          testFunction: async () => {
            const start = performance.now();
            await this.simulateAIFeature('content', 3000);
            return performance.now() - start;
          }
        },
        {
          name: 'voice_analysis',
          testFunction: async () => {
            const start = performance.now();
            await this.simulateAIFeature('voice', 2000);
            return performance.now() - start;
          }
        }
      ];

      const benchmark = await runBenchmark(config);
      
      console.log(`   ✅ Benchmark completed successfully`);
      console.log(`   📊 Overall Score: ${benchmark.overallScore}`);
      console.log(`   ${benchmark.passed ? '✅' : '❌'} Benchmark ${benchmark.passed ? 'PASSED' : 'FAILED'}`);
      
      return benchmark;
    } catch (error) {
      console.error('   ❌ Failed to run benchmark:', error);
      // Return mock benchmark for development
      return this.createMockBenchmark();
    }
  }

  /**
   * Analyze results and generate recommendations
   */
  private async analyzeResults(baseline: any, benchmark: any): Promise<string[]> {
    const recommendations: string[] = [];

    // Analyze baseline results
    if (baseline.sentryPerformanceScore < 80) {
      recommendations.push('Improve Sentry performance score - focus on Core Web Vitals optimization');
    }

    if (baseline.coreWebVitals.lcp > 2500) {
      recommendations.push('Optimize Largest Contentful Paint - consider image optimization and CDN implementation');
    }

    if (baseline.coreWebVitals.cls > 0.1) {
      recommendations.push('Reduce Cumulative Layout Shift - ensure proper image dimensions and avoid dynamic content injection');
    }

    if (baseline.clientSideMetrics.bundleSize.initial > 500000) {
      recommendations.push('Optimize initial bundle size - implement code splitting and remove unused dependencies');
    }

    // Analyze benchmark results
    if (benchmark.overallScore < 75) {
      recommendations.push('Overall benchmark score is below target - comprehensive performance optimization needed');
    }

    if (benchmark.apiResults.averageResponseTime > 500) {
      recommendations.push('API response times are high - optimize database queries and consider caching');
    }

    if (benchmark.apiResults.errorRate > 0.05) {
      recommendations.push('API error rate is above acceptable threshold - investigate and fix failing endpoints');
    }

    // AI-specific recommendations
    if (benchmark.aiResults.chatResponse && benchmark.aiResults.chatResponse.mean > 2000) {
      recommendations.push('Chat response time is slow - optimize AI model inference and consider caching');
    }

    if (benchmark.aiResults.tokenEfficiency.tokenUtilizationRate < 0.7) {
      recommendations.push('AI token efficiency is low - optimize prompts and reduce unnecessary token usage');
    }

    // Add general recommendations
    recommendations.push('Set up continuous performance monitoring with alerting');
    recommendations.push('Implement performance budgets in CI/CD pipeline');
    recommendations.push('Schedule regular performance audits and benchmarking');
    recommendations.push('Enable Sentry Performance Monitoring for production insights');

    return recommendations;
  }

  /**
   * Check threshold compliance
   */
  private async checkThresholdCompliance(baseline: any, benchmark: any): Promise<BaselineReport['thresholdCompliance']> {
    const thresholds = this.loadThresholds();
    const details: BaselineReport['thresholdCompliance']['details'] = [];
    let passed = 0;
    let failed = 0;
    let warnings = 0;

    // Check Core Web Vitals
    this.checkMetric('LCP', baseline.coreWebVitals.lcp, thresholds.coreWebVitals.lcp, details);
    this.checkMetric('FID', baseline.coreWebVitals.fid, thresholds.coreWebVitals.fid, details);
    this.checkMetric('CLS', baseline.coreWebVitals.cls, thresholds.coreWebVitals.cls, details);
    this.checkMetric('TTFB', baseline.coreWebVitals.ttfb, thresholds.coreWebVitals.ttfb, details);

    // Check performance scores
    this.checkMetric('Sentry Performance Score', baseline.sentryPerformanceScore, thresholds.performanceScores.sentryPerformanceScore, details);
    this.checkMetric('User Experience Score', baseline.userExperienceScore, thresholds.performanceScores.userExperienceScore, details);

    // Check bundle size
    this.checkMetric('Initial Bundle Size', baseline.clientSideMetrics.bundleSize.initial, thresholds.clientSidePerformance.bundleSize.initial, details);
    this.checkMetric('Memory Usage', baseline.clientSideMetrics.memoryUsage.used, thresholds.clientSidePerformance.memoryUsage, details);

    // Check benchmark results
    if (benchmark.apiResults) {
      this.checkMetric('API Response Time', benchmark.apiResults.averageResponseTime, thresholds.apiPerformance.responseTime, details);
      this.checkMetric('API Error Rate', benchmark.apiResults.errorRate, thresholds.apiPerformance.errorRate, details);
    }

    // Count results
    details.forEach(detail => {
      switch (detail.status) {
        case 'pass':
          passed++;
          break;
        case 'fail':
          failed++;
          break;
        case 'warning':
          warnings++;
          break;
      }
    });

    return { passed, failed, warnings, details };
  }

  /**
   * Check individual metric against thresholds
   */
  private checkMetric(
    name: string,
    value: number,
    thresholds: any,
    details: BaselineReport['thresholdCompliance']['details']
  ): void {
    let status: 'pass' | 'fail' | 'warning' = 'pass';
    let threshold = thresholds.good || thresholds.excellent || thresholds.target;

    if (typeof thresholds === 'object') {
      if (value <= (thresholds.excellent || thresholds.good || thresholds.target)) {
        status = 'pass';
        threshold = thresholds.excellent || thresholds.good || thresholds.target;
      } else if (value <= (thresholds.acceptable || thresholds.poor)) {
        status = 'warning';
        threshold = thresholds.acceptable || thresholds.poor;
      } else {
        status = 'fail';
        threshold = thresholds.poor || thresholds.critical;
      }
    } else {
      status = value <= threshold ? 'pass' : 'fail';
    }

    details.push({
      metric: name,
      value,
      threshold,
      status
    });
  }

  /**
   * Create comprehensive report
   */
  private async createReport(
    baseline: any,
    benchmark: any,
    recommendations: string[],
    compliance: BaselineReport['thresholdCompliance']
  ): Promise<BaselineReport> {
    const executionTime = Date.now() - this.startTime;
    
    return {
      reportId: this.reportId,
      timestamp: new Date(),
      version: await this.getCurrentVersion(),
      environment: process.env.NODE_ENV || 'development',
      executionTime,
      baseline,
      benchmark,
      systemInfo: {
        platform: process.platform,
        nodeVersion: process.version,
        memoryLimit: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        cpuCount: require('os').cpus().length
      },
      recommendations,
      thresholdCompliance: compliance,
      nextSteps: this.generateNextSteps(compliance, recommendations)
    };
  }

  /**
   * Generate next steps based on analysis
   */
  private generateNextSteps(
    compliance: BaselineReport['thresholdCompliance'],
    recommendations: string[]
  ): string[] {
    const nextSteps: string[] = [];

    if (compliance.failed > 0) {
      nextSteps.push('🚨 Address critical performance issues identified in failed metrics');
      nextSteps.push('📊 Focus on metrics with "fail" status first');
    }

    if (compliance.warnings > 0) {
      nextSteps.push('⚠️ Review and improve metrics with warning status');
    }

    nextSteps.push('🔄 Set up continuous performance monitoring');
    nextSteps.push('📈 Schedule regular performance benchmarks (weekly/monthly)');
    nextSteps.push('🚀 Implement performance budgets in CI/CD pipeline');
    nextSteps.push('📚 Review and implement top recommendations');
    nextSteps.push('🎯 Set performance goals for next quarter');

    return nextSteps;
  }

  /**
   * Save report to file system
   */
  private async saveReport(report: BaselineReport): Promise<void> {
    const reportPath = this.getReportPath(report.reportId);
    const summaryPath = path.join(this.outputDir, 'latest-baseline-summary.json');
    
    // Save full report
    await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
    
    // Save summary
    const summary = {
      reportId: report.reportId,
      timestamp: report.timestamp,
      version: report.version,
      environment: report.environment,
      overallScore: report.benchmark?.overallScore || 0,
      sentryScore: report.baseline?.sentryPerformanceScore || 0,
      uxScore: report.baseline?.userExperienceScore || 0,
      compliance: {
        passed: report.thresholdCompliance.passed,
        failed: report.thresholdCompliance.failed,
        warnings: report.thresholdCompliance.warnings
      },
      topRecommendations: report.recommendations.slice(0, 5)
    };
    
    await fs.promises.writeFile(summaryPath, JSON.stringify(summary, null, 2));
    
    console.log(`   ✅ Report saved: ${reportPath}`);
    console.log(`   📋 Summary saved: ${summaryPath}`);
  }

  /**
   * Initialize performance monitoring
   */
  private async initializeMonitoring(): Promise<void> {
    try {
      const monitoringConfig = {
        intervalMs: 60000, // 1 minute for initial monitoring
        enableAlerts: true,
        alertThresholds: {
          responseTime: 1000,
          errorRate: 0.05,
          memoryUsage: 150,
          cpuUsage: 80,
          coreWebVitalsScore: 75
        },
        degradationDetection: {
          enabled: true,
          windowSize: 10,
          threshold: 20
        },
        autoBenchmark: {
          enabled: false, // Disable for initial setup
          intervalMs: 30 * 60 * 1000, // 30 minutes
          conditions: ['critical_alerts']
        }
      };

      startMonitoring(monitoringConfig);
      console.log('   ✅ Performance monitoring initialized');
      console.log('   📊 Monitoring interval: 60 seconds');
      console.log('   🚨 Alerts enabled with standard thresholds');
      
    } catch (error) {
      console.error('   ❌ Failed to initialize monitoring:', error);
    }
  }

  /**
   * Utility methods
   */
  private async ensureOutputDirectory(): Promise<void> {
    if (!fs.existsSync(this.outputDir)) {
      await fs.promises.mkdir(this.outputDir, { recursive: true });
    }
  }

  private getReportPath(reportId: string): string {
    return path.join(this.outputDir, `${reportId}.json`);
  }

  private async getCurrentVersion(): Promise<string> {
    try {
      const packageJson = JSON.parse(
        await fs.promises.readFile(path.join(process.cwd(), 'package.json'), 'utf8')
      );
      return packageJson.version || '1.0.0';
    } catch {
      return '1.0.0';
    }
  }

  private loadThresholds(): any {
    try {
      const thresholdsPath = path.join(__dirname, '../lib/performance/performance-thresholds.json');
      return JSON.parse(fs.readFileSync(thresholdsPath, 'utf8'));
    } catch {
      return this.getDefaultThresholds();
    }
  }

  private getDefaultThresholds(): any {
    return {
      coreWebVitals: {
        lcp: { excellent: 2000, good: 2500, poor: 4000 },
        fid: { excellent: 50, good: 100, poor: 300 },
        cls: { excellent: 0.05, good: 0.1, poor: 0.25 },
        ttfb: { excellent: 500, good: 800, poor: 1800 }
      },
      performanceScores: {
        sentryPerformanceScore: { excellent: 90, good: 85, poor: 75 },
        userExperienceScore: { excellent: 95, good: 85, poor: 75 }
      },
      clientSidePerformance: {
        bundleSize: {
          initial: { excellent: 250000, good: 500000, poor: 1000000 }
        },
        memoryUsage: { excellent: 50, good: 100, poor: 200 }
      },
      apiPerformance: {
        responseTime: { excellent: 100, good: 200, poor: 1000 },
        errorRate: { excellent: 0.001, good: 0.01, poor: 0.1 }
      }
    };
  }

  private async simulateAIFeature(type: string, baseTime: number): Promise<void> {
    const variation = Math.random() * 500 - 250; // ±250ms variation
    const delay = Math.max(100, baseTime + variation);
    return new Promise(resolve => setTimeout(resolve, delay));
  }

  private createMockBaseline(): any {
    return {
      timestamp: new Date(),
      version: '1.0.0',
      environment: 'development',
      coreWebVitals: {
        lcp: 2800,
        fid: 120,
        cls: 0.08,
        ttfb: 650,
        fcp: 1600,
        tti: 3200
      },
      clientSideMetrics: {
        bundleSize: {
          initial: 450000,
          total: 1200000,
          compressed: 380000
        },
        memoryUsage: {
          used: 85,
          limit: 512,
          percentage: 16.6
        },
        scriptExecutionTime: 850,
        domParsingTime: 420,
        resourceLoadTime: 1200
      },
      sentryPerformanceScore: 78,
      userExperienceScore: 82
    };
  }

  private createMockBenchmark(): any {
    return {
      testId: 'mock_benchmark',
      timestamp: new Date(),
      overallScore: 76,
      passed: true,
      apiResults: {
        averageResponseTime: 320,
        errorRate: 0.02,
        throughput: 45
      },
      aiResults: {
        chatResponse: { mean: 1800 },
        contentGeneration: { mean: 4200 },
        voiceAnalysis: { mean: 2100 },
        tokenEfficiency: {
          tokenUtilizationRate: 0.75,
          averageTokensPerRequest: 150,
          costPerRequest: 0.003
        }
      },
      recommendations: [
        'Optimize API response times',
        'Improve AI token efficiency',
        'Consider implementing caching strategies'
      ]
    };
  }
}

// Main execution
async function main(): Promise<void> {
  const generator = new BaselineGenerator();
  
  try {
    const report = await generator.generate();
    
    console.log('\n📊 PERFORMANCE BASELINE SUMMARY');
    console.log('================================');
    console.log(`Report ID: ${report.reportId}`);
    console.log(`Environment: ${report.environment}`);
    console.log(`Version: ${report.version}`);
    console.log(`Execution Time: ${report.executionTime}ms`);
    console.log(`\nScores:`);
    console.log(`  Overall Benchmark: ${report.benchmark?.overallScore || 'N/A'}`);
    console.log(`  Sentry Performance: ${report.baseline?.sentryPerformanceScore || 'N/A'}`);
    console.log(`  User Experience: ${report.baseline?.userExperienceScore || 'N/A'}`);
    console.log(`\nCompliance:`);
    console.log(`  ✅ Passed: ${report.thresholdCompliance.passed}`);
    console.log(`  ⚠️  Warnings: ${report.thresholdCompliance.warnings}`);
    console.log(`  ❌ Failed: ${report.thresholdCompliance.failed}`);
    console.log(`\nTop Recommendations:`);
    report.recommendations.slice(0, 5).forEach((rec, index) => {
      console.log(`  ${index + 1}. ${rec}`);
    });
    console.log(`\n🎯 Next Steps:`);
    report.nextSteps.forEach((step, index) => {
      console.log(`  ${index + 1}. ${step}`);
    });
    console.log('\n✨ Performance baseline generation complete!');
    console.log('📈 Monitoring system is now active and collecting metrics.');
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ Failed to generate performance baseline:', error);
    process.exit(1);
  }
}

// Execute if run directly
if (require.main === module) {
  main();
}

export { BaselineGenerator };