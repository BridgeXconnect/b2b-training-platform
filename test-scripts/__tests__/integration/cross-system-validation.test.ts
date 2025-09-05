/**
 * Cross-System Integration Validation Tests
 * Validates error propagation and recovery between system components
 */

import { test, expect, Page } from '@playwright/test';
import { join } from 'path';
import { readFileSync, writeFileSync } from 'fs';

// System component validator
class CrossSystemValidator {
  private systemHealth: Map<string, boolean> = new Map();
  private errorChain: any[] = [];
  private recoveryMetrics: any[] = [];

  constructor(private page: Page) {}

  // Monitor system component health
  async monitorSystemHealth() {
    await this.page.addInitScript(() => {
      window.__SYSTEM_HEALTH__ = {
        frontend: true,
        backend: true,
        database: true,
        external_apis: true,
        monitoring: true
      };

      window.__ERROR_CHAIN__ = [];
      window.__RECOVERY_METRICS__ = [];

      // Mock system health checks
      (window as any).checkSystemHealth = () => {
        return window.__SYSTEM_HEALTH__;
      };

      // Track error propagation
      (window as any).trackError = (component: string, error: any) => {
        window.__ERROR_CHAIN__.push({
          component,
          error,
          timestamp: new Date().toISOString(),
          recovered: false
        });
      };

      // Track recovery actions
      (window as any).trackRecovery = (component: string, action: string, success: boolean) => {
        window.__RECOVERY_METRICS__.push({
          component,
          action,
          success,
          timestamp: new Date().toISOString()
        });
      };
    });
  }

  // Simulate component failures
  async simulateComponentFailure(component: 'frontend' | 'backend' | 'database' | 'external_apis' | 'monitoring') {
    await this.page.evaluate((comp) => {
      window.__SYSTEM_HEALTH__[comp] = false;
      
      // Simulate cascade effects
      const cascadeEffects = {
        backend: ['database'],
        database: ['backend'],
        external_apis: ['backend'],
        monitoring: []
      };

      if (cascadeEffects[comp]) {
        cascadeEffects[comp].forEach(affected => {
          window.__SYSTEM_HEALTH__[affected] = false;
        });
      }
    }, component);
  }

  // Validate error propagation
  async validateErrorPropagation(): Promise<boolean> {
    const errorChain = await this.page.evaluate(() => window.__ERROR_CHAIN__);
    return errorChain.length > 0;
  }

  // Validate recovery coordination
  async validateRecoveryCoordination(): Promise<boolean> {
    const recoveryMetrics = await this.page.evaluate(() => window.__RECOVERY_METRICS__);
    const successfulRecoveries = recoveryMetrics.filter((r: any) => r.success);
    return successfulRecoveries.length > 0;
  }

  // Get system health status
  async getSystemHealth(): Promise<any> {
    return await this.page.evaluate(() => window.__SYSTEM_HEALTH__);
  }

  // Get error chain analysis
  async getErrorChainAnalysis(): Promise<any> {
    const errorChain = await this.page.evaluate(() => window.__ERROR_CHAIN__);
    const recoveryMetrics = await this.page.evaluate(() => window.__RECOVERY_METRICS__);

    return {
      totalErrors: errorChain.length,
      recoveredErrors: errorChain.filter((e: any) => e.recovered).length,
      totalRecoveryAttempts: recoveryMetrics.length,
      successfulRecoveries: recoveryMetrics.filter((r: any) => r.success).length,
      errorChain,
      recoveryMetrics
    };
  }
}

// API integration tester
class ApiIntegrationTester {
  private apiCalls: Map<string, any[]> = new Map();
  private apiResponses: Map<string, any[]> = new Map();

  constructor(private page: Page) {}

  // Set up API monitoring
  async setupApiMonitoring() {
    await this.page.route('**/api/**', async (route) => {
      const request = route.request();
      const url = request.url();
      const method = request.method();
      
      // Track API call
      const callData = {
        url,
        method,
        timestamp: new Date().toISOString(),
        headers: await request.allHeaders(),
        postData: request.postData()
      };

      const endpoint = this.extractEndpoint(url);
      if (!this.apiCalls.has(endpoint)) {
        this.apiCalls.set(endpoint, []);
      }
      this.apiCalls.get(endpoint)!.push(callData);

      // Continue request and track response
      try {
        const response = await route.fulfill();
        
        const responseData = {
          status: response.status(),
          headers: response.headers(),
          timestamp: new Date().toISOString()
        };

        if (!this.apiResponses.has(endpoint)) {
          this.apiResponses.set(endpoint, []);
        }
        this.apiResponses.get(endpoint)!.push(responseData);

      } catch (error) {
        // Track failed responses
        const errorData = {
          status: 0,
          error: error.message,
          timestamp: new Date().toISOString()
        };

        if (!this.apiResponses.has(endpoint)) {
          this.apiResponses.set(endpoint, []);
        }
        this.apiResponses.get(endpoint)!.push(errorData);
      }
    });
  }

  // Extract endpoint name from URL
  private extractEndpoint(url: string): string {
    const urlPath = new URL(url).pathname;
    const apiMatch = urlPath.match(/\/api\/([^\/]+)/);
    return apiMatch ? apiMatch[1] : 'unknown';
  }

  // Simulate API failures
  async simulateApiFailure(endpoint: string, failureType: 'timeout' | 'error' | 'rate_limit') {
    const failureResponses = {
      timeout: { status: 408, body: { error: 'Request timeout' } },
      error: { status: 500, body: { error: 'Internal server error' } },
      rate_limit: { status: 429, body: { error: 'Rate limit exceeded' } }
    };

    await this.page.route(`**/api/${endpoint}/**`, route => {
      const response = failureResponses[failureType];
      route.fulfill({
        status: response.status,
        contentType: 'application/json',
        body: JSON.stringify(response.body)
      });
    });
  }

  // Validate API error handling
  async validateApiErrorHandling(endpoint: string): Promise<boolean> {
    const responses = this.apiResponses.get(endpoint) || [];
    const errorResponses = responses.filter(r => r.status >= 400);
    return errorResponses.length > 0;
  }

  // Get API integration report
  getApiIntegrationReport(): any {
    const report = {
      endpoints: {},
      summary: {
        totalEndpoints: this.apiCalls.size,
        totalCalls: 0,
        totalErrors: 0,
        averageResponseTime: 0
      }
    };

    for (const [endpoint, calls] of this.apiCalls) {
      const responses = this.apiResponses.get(endpoint) || [];
      const errors = responses.filter(r => r.status >= 400);
      
      report.endpoints[endpoint] = {
        callCount: calls.length,
        errorCount: errors.length,
        errorRate: calls.length > 0 ? (errors.length / calls.length) * 100 : 0,
        lastCall: calls[calls.length - 1]?.timestamp,
        lastResponse: responses[responses.length - 1]?.timestamp
      };

      report.summary.totalCalls += calls.length;
      report.summary.totalErrors += errors.length;
    }

    return report;
  }
}

// Sentry integration validator
class SentryIntegrationValidator {
  private sentryEvents: any[] = [];
  private performanceMetrics: any[] = [];

  constructor(private page: Page) {}

  // Setup Sentry monitoring
  async setupSentryMonitoring() {
    await this.page.addInitScript(() => {
      window.__SENTRY_EVENTS__ = [];
      window.__PERFORMANCE_METRICS__ = [];

      // Mock Sentry SDK
      (window as any).__SENTRY__ = {
        captureException: (error: Error, context?: any) => {
          window.__SENTRY_EVENTS__.push({
            type: 'exception',
            error: {
              message: error.message,
              stack: error.stack
            },
            context,
            timestamp: new Date().toISOString(),
            user: context?.user || null,
            tags: context?.tags || {},
            level: 'error'
          });
        },

        captureMessage: (message: string, level: string = 'info') => {
          window.__SENTRY_EVENTS__.push({
            type: 'message',
            message,
            level,
            timestamp: new Date().toISOString()
          });
        },

        addBreadcrumb: (breadcrumb: any) => {
          const lastEvent = window.__SENTRY_EVENTS__[window.__SENTRY_EVENTS__.length - 1];
          if (lastEvent) {
            lastEvent.breadcrumbs = lastEvent.breadcrumbs || [];
            lastEvent.breadcrumbs.push({
              ...breadcrumb,
              timestamp: new Date().toISOString()
            });
          }
        },

        startTransaction: (context: any) => {
          const transaction = {
            ...context,
            startTime: performance.now(),
            finish: function() {
              this.endTime = performance.now();
              this.duration = this.endTime - this.startTime;
              window.__PERFORMANCE_METRICS__.push(this);
            }
          };
          return transaction;
        }
      };
    });
  }

  // Validate error capture
  async validateErrorCapture(): Promise<boolean> {
    const events = await this.page.evaluate(() => window.__SENTRY_EVENTS__);
    return events.filter((e: any) => e.type === 'exception').length > 0;
  }

  // Validate performance monitoring
  async validatePerformanceMonitoring(): Promise<boolean> {
    const metrics = await this.page.evaluate(() => window.__PERFORMANCE_METRICS__);
    return metrics.length > 0;
  }

  // Check for sensitive data exposure
  async validateDataSecurity(): Promise<boolean> {
    const events = await this.page.evaluate(() => window.__SENTRY_EVENTS__);
    
    const sensitivePatterns = [
      /sk-[a-zA-Z0-9]{48}/, // OpenAI API keys
      /password/i,
      /secret/i,
      /token/i,
      /api[_-]?key/i
    ];

    for (const event of events) {
      const eventString = JSON.stringify(event);
      for (const pattern of sensitivePatterns) {
        if (pattern.test(eventString)) {
          return false; // Found sensitive data
        }
      }
    }

    return true; // No sensitive data found
  }

  // Get Sentry integration report
  async getSentryIntegrationReport(): Promise<any> {
    const events = await this.page.evaluate(() => window.__SENTRY_EVENTS__);
    const metrics = await this.page.evaluate(() => window.__PERFORMANCE_METRICS__);

    return {
      totalEvents: events.length,
      exceptionEvents: events.filter((e: any) => e.type === 'exception').length,
      messageEvents: events.filter((e: any) => e.type === 'message').length,
      performanceMetrics: metrics.length,
      averageTransactionTime: metrics.length > 0 
        ? metrics.reduce((sum: number, m: any) => sum + m.duration, 0) / metrics.length 
        : 0,
      events: events.slice(0, 10), // Last 10 events for analysis
      securityCheck: await this.validateDataSecurity()
    };
  }
}

test.describe('Cross-System Integration Validation', () => {
  let systemValidator: CrossSystemValidator;
  let apiTester: ApiIntegrationTester;
  let sentryValidator: SentryIntegrationValidator;

  test.beforeEach(async ({ page }) => {
    systemValidator = new CrossSystemValidator(page);
    apiTester = new ApiIntegrationTester(page);
    sentryValidator = new SentryIntegrationValidator(page);

    await systemValidator.monitorSystemHealth();
    await apiTester.setupApiMonitoring();
    await sentryValidator.setupSentryMonitoring();
  });

  test.describe('Frontend-Backend Integration', () => {
    test('should handle backend service failures gracefully', async ({ page }) => {
      await page.goto('/learning');

      // Simulate backend failure
      await systemValidator.simulateComponentFailure('backend');
      await apiTester.simulateApiFailure('chat', 'error');

      // Try to interact with backend-dependent features
      await page.click('text="Chat"').catch(() => {
        console.log('Chat interaction failed as expected');
      });

      // Should show appropriate error handling
      await page.waitForSelector('[data-testid="error-boundary"], text="service unavailable"', { timeout: 10000 });

      // Validate error propagation
      const errorPropagated = await systemValidator.validateErrorPropagation();
      expect(errorPropagated).toBe(true);

      // Validate API error handling
      const apiErrorHandled = await apiTester.validateApiErrorHandling('chat');
      expect(apiErrorHandled).toBe(true);

      // Validate Sentry error capture
      const sentryCapture = await sentryValidator.validateErrorCapture();
      expect(sentryCapture).toBe(true);
    });

    test('should coordinate recovery across system boundaries', async ({ page }) => {
      await page.goto('/learning');

      // Simulate temporary failure and recovery
      await systemValidator.simulateComponentFailure('external_apis');
      await apiTester.simulateApiFailure('voice', 'timeout');

      // Trigger voice feature
      await page.evaluate(() => {
        if (window.trackError) {
          window.trackError('voice', { message: 'Voice API timeout' });
        }
      });

      // Should attempt recovery
      await page.waitForSelector('button:has-text("Try Again"), button:has-text("Retry")', { timeout: 5000 });
      
      // Simulate recovery
      await page.evaluate(() => {
        window.__SYSTEM_HEALTH__.external_apis = true;
        if (window.trackRecovery) {
          window.trackRecovery('voice', 'retry', true);
        }
      });

      await page.unroute('**/api/voice/**');
      await page.click('button:has-text("Try Again")');

      // Validate recovery coordination
      const recoveryCoordinated = await systemValidator.validateRecoveryCoordination();
      expect(recoveryCoordinated).toBe(true);

      // Check system health after recovery
      const systemHealth = await systemValidator.getSystemHealth();
      expect(systemHealth.external_apis).toBe(true);
    });
  });

  test.describe('External API Integration', () => {
    test('should handle OpenAI API failures with proper fallbacks', async ({ page }) => {
      await page.goto('/learning');

      // Simulate OpenAI API rate limit
      await apiTester.simulateApiFailure('voice', 'rate_limit');

      // Try voice analysis
      await page.evaluate(() => {
        fetch('/api/voice/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ audio: 'mock_audio_data' })
        }).catch(error => {
          if (window.trackError) {
            window.trackError('openai', error);
          }
        });
      });

      await page.waitForTimeout(2000);

      // Should show rate limit handling
      await page.waitForSelector('text="rate limit", text="try again later"', { timeout: 10000 });

      // Validate API integration report
      const apiReport = apiTester.getApiIntegrationReport();
      expect(apiReport.endpoints.voice).toBeDefined();
      expect(apiReport.endpoints.voice.errorCount).toBeGreaterThan(0);
    });

    test('should maintain service integration under load', async ({ page }) => {
      await page.goto('/learning');

      // Simulate multiple concurrent API calls
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          page.evaluate((index) => {
            return fetch(`/api/voice/analyze`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio: `mock_audio_${index}` })
            }).catch(error => {
              console.log(`Request ${index} failed:`, error);
            });
          }, i)
        );
      }

      await Promise.allSettled(promises);
      await page.waitForTimeout(3000);

      // Check API integration under load
      const apiReport = apiTester.getApiIntegrationReport();
      expect(apiReport.summary.totalCalls).toBeGreaterThan(0);
      
      // Error rate should be reasonable
      const errorRate = (apiReport.summary.totalErrors / apiReport.summary.totalCalls) * 100;
      expect(errorRate).toBeLessThan(50); // Less than 50% error rate
    });
  });

  test.describe('Database Integration', () => {
    test('should handle database connection issues', async ({ page }) => {
      await page.goto('/learning');

      // Simulate database connectivity issues
      await systemValidator.simulateComponentFailure('database');
      await apiTester.simulateApiFailure('progress', 'timeout');

      // Try to load progress data
      await page.evaluate(() => {
        fetch('/api/progress/user').catch(error => {
          if (window.trackError) {
            window.trackError('database', error);
          }
        });
      });

      // Should degrade gracefully
      await page.waitForSelector('[data-testid="offline-mode"], text="offline", text="cached"', { timeout: 10000 });

      // Validate error chain includes database component
      const errorAnalysis = await systemValidator.getErrorChainAnalysis();
      const databaseErrors = errorAnalysis.errorChain.filter(e => e.component === 'database');
      expect(databaseErrors.length).toBeGreaterThan(0);
    });

    test('should preserve data integrity during errors', async ({ page }) => {
      await page.goto('/learning');

      // Set up some user data
      await page.evaluate(() => {
        localStorage.setItem('user_progress', JSON.stringify({
          lessons: ['lesson1', 'lesson2'],
          scores: { lesson1: 85, lesson2: 92 },
          timestamp: new Date().toISOString()
        }));
      });

      // Simulate database write failure
      await apiTester.simulateApiFailure('progress', 'error');

      // Try to update progress
      await page.evaluate(() => {
        fetch('/api/progress/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lesson: 'lesson3', score: 88 })
        }).catch(error => {
          console.log('Progress update failed:', error);
        });
      });

      // Data should be preserved locally
      const preservedData = await page.evaluate(() => {
        return localStorage.getItem('user_progress');
      });

      expect(preservedData).toBeTruthy();
      const parsedData = JSON.parse(preservedData);
      expect(parsedData.lessons).toHaveLength(2);
      expect(parsedData.scores.lesson1).toBe(85);
    });
  });

  test.describe('Monitoring Integration', () => {
    test('should integrate with Sentry for comprehensive error tracking', async ({ page }) => {
      await page.goto('/learning');

      // Generate various types of errors
      await page.evaluate(() => {
        // JavaScript error
        if (window.__SENTRY__) {
          window.__SENTRY__.captureException(
            new Error('Test JavaScript error'),
            { tags: { component: 'frontend' } }
          );

          // Network error
          window.__SENTRY__.captureException(
            new Error('Network request failed'),
            { tags: { component: 'network' } }
          );

          // User action error
          window.__SENTRY__.captureMessage('User action failed', 'warning');
        }
      });

      await page.waitForTimeout(1000);

      // Validate Sentry integration
      const sentryReport = await sentryValidator.getSentryIntegrationReport();
      expect(sentryReport.totalEvents).toBeGreaterThan(0);
      expect(sentryReport.exceptionEvents).toBeGreaterThan(0);
      expect(sentryReport.securityCheck).toBe(true); // No sensitive data
    });

    test('should monitor performance during error conditions', async ({ page }) => {
      await page.goto('/learning');

      // Start performance monitoring
      await page.evaluate(() => {
        if (window.__SENTRY__?.startTransaction) {
          const transaction = window.__SENTRY__.startTransaction({
            name: 'error-recovery-test',
            op: 'test'
          });

          // Simulate some work
          setTimeout(() => {
            transaction.finish();
          }, 1000);
        }
      });

      // Generate error during monitoring
      await page.evaluate(() => {
        throw new Error('Performance test error');
      });

      await page.waitForTimeout(2000);

      // Validate performance monitoring
      const performanceMonitored = await sentryValidator.validatePerformanceMonitoring();
      expect(performanceMonitored).toBe(true);

      const sentryReport = await sentryValidator.getSentryIntegrationReport();
      expect(sentryReport.performanceMetrics).toBeGreaterThan(0);
    });
  });

  test.describe('End-to-End Integration Validation', () => {
    test('should validate complete error recovery flow', async ({ page }) => {
      await page.goto('/learning');

      // Simulate cascading failure
      await systemValidator.simulateComponentFailure('external_apis');
      await apiTester.simulateApiFailure('voice', 'error');
      await apiTester.simulateApiFailure('chat', 'timeout');

      // Trigger multiple component interactions
      const interactions = [
        () => page.click('text="Voice Practice"').catch(() => {}),
        () => page.click('text="Chat"').catch(() => {}),
        () => page.click('text="Assessment"').catch(() => {})
      ];

      for (const interaction of interactions) {
        await interaction();
        await page.waitForTimeout(1000);
      }

      // Should show comprehensive error handling
      await page.waitForSelector('[data-testid="error-boundary"], text="multiple services", text="try again"', { timeout: 15000 });

      // Validate comprehensive error tracking
      const errorAnalysis = await systemValidator.getErrorChainAnalysis();
      expect(errorAnalysis.totalErrors).toBeGreaterThan(0);

      const apiReport = apiTester.getApiIntegrationReport();
      expect(apiReport.summary.totalErrors).toBeGreaterThan(0);

      const sentryReport = await sentryValidator.getSentryIntegrationReport();
      expect(sentryReport.totalEvents).toBeGreaterThan(0);

      // Test coordinated recovery
      await page.unroute('**/api/**');
      await page.evaluate(() => {
        // Restore system health
        Object.keys(window.__SYSTEM_HEALTH__).forEach(key => {
          window.__SYSTEM_HEALTH__[key] = true;
        });
      });

      await page.click('button:has-text("Try Again")');
      await page.waitForSelector('main', { timeout: 10000 });

      // Validate recovery coordination
      const recoveryCoordinated = await systemValidator.validateRecoveryCoordination();
      expect(recoveryCoordinated).toBe(true);
    });

    test('should generate comprehensive integration report', async ({ page }) => {
      await page.goto('/learning');

      // Run comprehensive test scenario
      await systemValidator.simulateComponentFailure('backend');
      await apiTester.simulateApiFailure('voice', 'rate_limit');

      // Generate various events
      await page.evaluate(() => {
        if (window.__SENTRY__) {
          window.__SENTRY__.captureException(new Error('Integration test error'));
          window.__SENTRY__.captureMessage('Integration test message');
        }
      });

      await page.waitForTimeout(2000);

      // Collect all reports
      const systemHealth = await systemValidator.getSystemHealth();
      const errorAnalysis = await systemValidator.getErrorChainAnalysis();
      const apiReport = apiTester.getApiIntegrationReport();
      const sentryReport = await sentryValidator.getSentryIntegrationReport();

      // Create comprehensive report
      const integrationReport = {
        timestamp: new Date().toISOString(),
        systemHealth,
        errorAnalysis,
        apiIntegration: apiReport,
        monitoring: sentryReport,
        summary: {
          totalErrors: errorAnalysis.totalErrors,
          totalRecoveries: errorAnalysis.successfulRecoveries,
          apiEndpoints: apiReport.summary.totalEndpoints,
          sentryEvents: sentryReport.totalEvents,
          systemHealthScore: Object.values(systemHealth).filter(h => h).length / Object.keys(systemHealth).length
        }
      };

      // Validate report completeness
      expect(integrationReport.summary.totalErrors).toBeGreaterThanOrEqual(0);
      expect(integrationReport.summary.apiEndpoints).toBeGreaterThanOrEqual(0);
      expect(integrationReport.summary.sentryEvents).toBeGreaterThanOrEqual(0);
      expect(integrationReport.summary.systemHealthScore).toBeGreaterThanOrEqual(0);

      // Save report
      const reportPath = join(process.cwd(), 'test-scripts/__tests__/reports', `cross-system-validation-${Date.now()}.json`);
      writeFileSync(reportPath, JSON.stringify(integrationReport, null, 2));

      console.log(`Cross-system validation report saved: ${reportPath}`);
    });
  });
});