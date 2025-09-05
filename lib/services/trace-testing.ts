/**
 * Trace Testing and Verification Utilities
 * Comprehensive end-to-end distributed tracing validation
 */

import { TracingFetch, TraceVerification } from './trace-propagation';
import { logger } from '@/lib/logger';

export interface TraceTestResult {
  testName: string;
  success: boolean;
  traceId: string | null;
  backendTraceId: string | null;
  correlationRate: number;
  performanceMs: number;
  errors: string[];
  details: Record<string, any>;
}

export interface TraceHealthReport {
  overallHealth: 'healthy' | 'degraded' | 'critical';
  correlationRate: number;
  averageLatency: number;
  testResults: TraceTestResult[];
  recommendations: string[];
  timestamp: string;
}

/**
 * Comprehensive trace testing suite
 */
export class TraceTestingSuite {
  private testResults: TraceTestResult[] = [];

  /**
   * Run all trace correlation tests
   */
  async runFullTraceSuite(): Promise<TraceHealthReport> {
    console.log('🔍 Starting comprehensive trace correlation testing...');
    
    this.testResults = [];
    
    // Test 1: Basic API trace correlation
    await this.testBasicAPICorrelation();
    
    // Test 2: Chat API trace correlation
    await this.testChatAPICorrelation();
    
    // Test 3: Recommendations API trace correlation
    await this.testRecommendationsAPICorrelation();
    
    // Test 4: Health endpoint correlation
    await this.testHealthEndpointCorrelation();
    
    // Test 5: Error recovery coordination
    await this.testErrorRecoveryCorrelation();
    
    // Test 6: Performance impact test
    await this.testPerformanceImpact();

    // Generate health report
    return this.generateHealthReport();
  }

  /**
   * Test basic API trace correlation
   */
  private async testBasicAPICorrelation(): Promise<void> {
    const testName = 'Basic API Trace Correlation';
    const startTime = performance.now();
    const errors: string[] = [];
    
    try {
      const verification = await TraceVerification.verifyTraceCorrelation(
        '/api/health/trace',
        ['tracing']
      );
      
      const endTime = performance.now();
      
      this.testResults.push({
        testName,
        success: verification.success && verification.correlation,
        traceId: verification.traceId,
        backendTraceId: verification.backendTraceId,
        correlationRate: verification.correlation ? 1.0 : 0.0,
        performanceMs: endTime - startTime,
        errors,
        details: {
          frontendTrace: verification.traceId,
          backendTrace: verification.backendTraceId,
          expectedFeatures: verification.features,
        },
      });
      
      console.log(`✅ ${testName}: ${verification.correlation ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      const endTime = performance.now();
      errors.push(error instanceof Error ? error.message : String(error));
      
      this.testResults.push({
        testName,
        success: false,
        traceId: null,
        backendTraceId: null,
        correlationRate: 0.0,
        performanceMs: endTime - startTime,
        errors,
        details: { error: error instanceof Error ? error.message : String(error) },
      });
      
      console.log(`❌ ${testName}: FAIL - ${errors[0]}`);
    }
  }

  /**
   * Test chat API trace correlation
   */
  private async testChatAPICorrelation(): Promise<void> {
    const testName = 'Chat API Trace Correlation';
    const startTime = performance.now();
    const errors: string[] = [];
    
    try {
      // Simulate a chat API call with trace headers
      const response = await TracingFetch.fetchAPI('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test trace correlation',
          settings: {
            cefrLevel: 'B1',
            businessContext: 'test',
            learningGoals: ['testing'],
          },
          sessionId: 'test-session-trace-correlation',
        }),
      }, {
        userId: 'test-user',
        sessionId: 'test-session-trace-correlation',
        feature: 'trace_testing',
      });
      
      const endTime = performance.now();
      const backendTraceId = response.headers.get('x-backend-trace-id');
      const traceId = TracingFetch.getTraceHeaders()['sentry-trace']?.split('-')[0];
      const correlation = Boolean(traceId && backendTraceId);
      
      this.testResults.push({
        testName,
        success: response.ok && correlation,
        traceId,
        backendTraceId,
        correlationRate: correlation ? 1.0 : 0.0,
        performanceMs: endTime - startTime,
        errors,
        details: {
          statusCode: response.status,
          hasBackendTrace: Boolean(backendTraceId),
          hasFrontendTrace: Boolean(traceId),
        },
      });
      
      console.log(`${response.ok && correlation ? '✅' : '❌'} ${testName}: ${response.ok && correlation ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      const endTime = performance.now();
      errors.push(error instanceof Error ? error.message : String(error));
      
      this.testResults.push({
        testName,
        success: false,
        traceId: null,
        backendTraceId: null,
        correlationRate: 0.0,
        performanceMs: endTime - startTime,
        errors,
        details: { error: error instanceof Error ? error.message : String(error) },
      });
      
      console.log(`❌ ${testName}: FAIL - ${errors[0]}`);
    }
  }

  /**
   * Test recommendations API trace correlation
   */
  private async testRecommendationsAPICorrelation(): Promise<void> {
    const testName = 'Recommendations API Trace Correlation';
    const startTime = performance.now();
    const errors: string[] = [];
    
    try {
      const response = await TracingFetch.fetchAPI('/api/recommendations/feedback', {
        method: 'GET',
        headers: {
          'x-trace-test': 'recommendations',
        },
      }, {
        userId: 'test-user',
        sessionId: 'test-session-recommendations',
        feature: 'recommendations_testing',
      });
      
      const endTime = performance.now();
      const backendTraceId = response.headers.get('x-backend-trace-id');
      const traceId = TracingFetch.getTraceHeaders()['sentry-trace']?.split('-')[0];
      const correlation = Boolean(traceId && backendTraceId);
      
      this.testResults.push({
        testName,
        success: correlation, // Accept any response as long as trace correlation works
        traceId,
        backendTraceId,
        correlationRate: correlation ? 1.0 : 0.0,
        performanceMs: endTime - startTime,
        errors,
        details: {
          statusCode: response.status,
          hasBackendTrace: Boolean(backendTraceId),
          hasFrontendTrace: Boolean(traceId),
        },
      });
      
      console.log(`${correlation ? '✅' : '❌'} ${testName}: ${correlation ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      const endTime = performance.now();
      errors.push(error instanceof Error ? error.message : String(error));
      
      this.testResults.push({
        testName,
        success: false,
        traceId: null,
        backendTraceId: null,
        correlationRate: 0.0,
        performanceMs: endTime - startTime,
        errors,
        details: { error: error instanceof Error ? error.message : String(error) },
      });
      
      console.log(`❌ ${testName}: FAIL - ${errors[0]}`);
    }
  }

  /**
   * Test health endpoint correlation
   */
  private async testHealthEndpointCorrelation(): Promise<void> {
    const testName = 'Health Endpoint Trace Correlation';
    const startTime = performance.now();
    const errors: string[] = [];
    
    try {
      const response = await TracingFetch.fetchAPI('/api/health/trace', {
        method: 'GET',
        headers: {
          'x-trace-verification': 'true',
        },
      });
      
      const endTime = performance.now();
      const data = await response.json();
      const correlation = data.tracing?.correlated || false;
      
      this.testResults.push({
        testName,
        success: response.ok && correlation,
        traceId: data.tracing?.parentTraceId,
        backendTraceId: data.tracing?.currentTraceId,
        correlationRate: correlation ? 1.0 : 0.0,
        performanceMs: endTime - startTime,
        errors,
        details: {
          statusCode: response.status,
          tracingData: data.tracing,
          features: data.features,
        },
      });
      
      console.log(`${response.ok && correlation ? '✅' : '❌'} ${testName}: ${response.ok && correlation ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      const endTime = performance.now();
      errors.push(error instanceof Error ? error.message : String(error));
      
      this.testResults.push({
        testName,
        success: false,
        traceId: null,
        backendTraceId: null,
        correlationRate: 0.0,
        performanceMs: endTime - startTime,
        errors,
        details: { error: error instanceof Error ? error.message : String(error) },
      });
      
      console.log(`❌ ${testName}: FAIL - ${errors[0]}`);
    }
  }

  /**
   * Test error recovery coordination
   */
  private async testErrorRecoveryCorrelation(): Promise<void> {
    const testName = 'Error Recovery Coordination';
    const startTime = performance.now();
    const errors: string[] = [];
    
    try {
      const response = await TracingFetch.fetchAPI('/api/internal/error-recovery', {
        method: 'POST',
        body: JSON.stringify({
          userId: 'test-user',
          sessionId: 'test-session-error-recovery',
          errorType: 'TestError',
          errorMessage: 'Trace correlation test error',
          recoveryActions: ['clear_session_state'],
          timestamp: new Date().toISOString(),
        }),
      }, {
        userId: 'test-user',
        sessionId: 'test-session-error-recovery',
        feature: 'error_recovery_testing',
      });
      
      const endTime = performance.now();
      const backendTraceId = response.headers.get('x-backend-trace-id');
      const traceId = TracingFetch.getTraceHeaders()['sentry-trace']?.split('-')[0];
      const correlation = Boolean(traceId && backendTraceId);
      
      this.testResults.push({
        testName,
        success: response.ok && correlation,
        traceId,
        backendTraceId,
        correlationRate: correlation ? 1.0 : 0.0,
        performanceMs: endTime - startTime,
        errors,
        details: {
          statusCode: response.status,
          hasBackendTrace: Boolean(backendTraceId),
          hasFrontendTrace: Boolean(traceId),
        },
      });
      
      console.log(`${response.ok && correlation ? '✅' : '❌'} ${testName}: ${response.ok && correlation ? 'PASS' : 'FAIL'}`);
    } catch (error) {
      const endTime = performance.now();
      errors.push(error instanceof Error ? error.message : String(error));
      
      this.testResults.push({
        testName,
        success: false,
        traceId: null,
        backendTraceId: null,
        correlationRate: 0.0,
        performanceMs: endTime - startTime,
        errors,
        details: { error: error instanceof Error ? error.message : String(error) },
      });
      
      console.log(`❌ ${testName}: FAIL - ${errors[0]}`);
    }
  }

  /**
   * Test performance impact of tracing
   */
  private async testPerformanceImpact(): Promise<void> {
    const testName = 'Tracing Performance Impact';
    const iterations = 5;
    const errors: string[] = [];
    
    try {
      // Test with tracing
      const tracingTimes: number[] = [];
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        await TracingFetch.fetchAPI('/api/health/trace');
        const endTime = performance.now();
        tracingTimes.push(endTime - startTime);
      }
      
      // Test without tracing (regular fetch)
      const regularTimes: number[] = [];
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        await fetch('/api/health/trace');
        const endTime = performance.now();
        regularTimes.push(endTime - startTime);
      }
      
      const avgTracingTime = tracingTimes.reduce((a, b) => a + b, 0) / tracingTimes.length;
      const avgRegularTime = regularTimes.reduce((a, b) => a + b, 0) / regularTimes.length;
      const overhead = avgTracingTime - avgRegularTime;
      const overheadPercent = (overhead / avgRegularTime) * 100;
      
      // Performance test passes if overhead is less than 15ms or 20%
      const success = overhead < 15 && overheadPercent < 20;
      
      this.testResults.push({
        testName,
        success,
        traceId: 'performance-test',
        backendTraceId: 'performance-test',
        correlationRate: 1.0,
        performanceMs: avgTracingTime,
        errors,
        details: {
          avgTracingTime,
          avgRegularTime,
          overhead,
          overheadPercent,
          iterations,
          tracingTimes,
          regularTimes,
        },
      });
      
      console.log(`${success ? '✅' : '⚠️'} ${testName}: ${success ? 'PASS' : 'WARNING'} (${overhead.toFixed(1)}ms overhead, ${overheadPercent.toFixed(1)}%)`);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      
      this.testResults.push({
        testName,
        success: false,
        traceId: null,
        backendTraceId: null,
        correlationRate: 0.0,
        performanceMs: 0,
        errors,
        details: { error: error instanceof Error ? error.message : String(error) },
      });
      
      console.log(`❌ ${testName}: FAIL - ${errors[0]}`);
    }
  }

  /**
   * Generate comprehensive health report
   */
  private generateHealthReport(): TraceHealthReport {
    const successfulTests = this.testResults.filter(t => t.success).length;
    const totalTests = this.testResults.length;
    const correlationRate = this.testResults.reduce((sum, t) => sum + t.correlationRate, 0) / totalTests;
    const averageLatency = this.testResults.reduce((sum, t) => sum + t.performanceMs, 0) / totalTests;
    
    let overallHealth: 'healthy' | 'degraded' | 'critical';
    const recommendations: string[] = [];
    
    if (successfulTests === totalTests && correlationRate >= 0.9) {
      overallHealth = 'healthy';
    } else if (successfulTests >= totalTests * 0.7 && correlationRate >= 0.7) {
      overallHealth = 'degraded';
      recommendations.push('Some trace correlation issues detected - investigate failing tests');
    } else {
      overallHealth = 'critical';
      recommendations.push('Critical trace correlation issues - distributed tracing may not be working');
    }
    
    // Add specific recommendations based on test results
    if (correlationRate < 0.5) {
      recommendations.push('Low correlation rate - check Sentry configuration and header propagation');
    }
    
    if (averageLatency > 100) {
      recommendations.push('High average latency - consider optimizing trace header processing');
    }
    
    const failedTests = this.testResults.filter(t => !t.success);
    if (failedTests.length > 0) {
      recommendations.push(`Failed tests: ${failedTests.map(t => t.testName).join(', ')}`);
    }
    
    return {
      overallHealth,
      correlationRate,
      averageLatency,
      testResults: this.testResults,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Quick trace health check utility
 */
export async function quickTraceHealthCheck(): Promise<{
  healthy: boolean;
  correlationWorking: boolean;
  performance: number;
}> {
  try {
    const startTime = performance.now();
    const verification = await TraceVerification.verifyTraceCorrelation('/api/health/trace', ['tracing']);
    const endTime = performance.now();
    
    return {
      healthy: verification.success && verification.correlation,
      correlationWorking: verification.correlation,
      performance: endTime - startTime,
    };
  } catch (error) {
    return {
      healthy: false,
      correlationWorking: false,
      performance: -1,
    };
  }
}

/**
 * Export main testing utilities
 */
export { TraceTestingSuite, quickTraceHealthCheck };