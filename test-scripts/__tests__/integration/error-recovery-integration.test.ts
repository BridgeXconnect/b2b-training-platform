/**
 * Comprehensive Integration Tests for Error Recovery System
 * Tests end-to-end error recovery flows across all system boundaries
 */

import { test, expect, Page, BrowserContext } from '@playwright/test';

interface ErrorRecoveryTestSuite {
  page: Page;
  context: BrowserContext;
}

interface MockAPIResponse {
  status: number;
  body: any;
  delay?: number;
}

interface RecoveryScenario {
  name: string;
  errorType: 'network' | 'javascript' | 'api' | 'chunk' | 'service';
  feature: 'voice_practice' | 'assessment_generator' | 'advanced_chat' | 'page';
  expectedRecoveryActions: string[];
  expectedFallbacks: string[];
  criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
}

class IntegrationTestHelper {
  constructor(private suite: ErrorRecoveryTestSuite) {}

  /**
   * API MOCKING & ERROR INJECTION
   */
  
  async mockAPIEndpoint(endpoint: string, response: MockAPIResponse) {
    await this.suite.page.route(`**/api/${endpoint}**`, async (route) => {
      if (response.delay) {
        await new Promise(resolve => setTimeout(resolve, response.delay));
      }
      
      await route.fulfill({
        status: response.status,
        contentType: 'application/json',
        body: JSON.stringify(response.body)
      });
    });
  }

  async mockSentryIntegration() {
    await this.suite.page.addInitScript(() => {
      // Mock Sentry for testing
      window.__SENTRY_TEST__ = {
        capturedErrors: [],
        breadcrumbs: [],
        contexts: []
      };

      const originalSentry = window.Sentry;
      window.Sentry = {
        ...originalSentry,
        captureException: (error: Error, context?: any) => {
          window.__SENTRY_TEST__.capturedErrors.push({ error, context });
          return originalSentry?.captureException?.(error, context);
        },
        addBreadcrumb: (breadcrumb: any) => {
          window.__SENTRY_TEST__.breadcrumbs.push(breadcrumb);
          return originalSentry?.addBreadcrumb?.(breadcrumb);
        },
        setContext: (key: string, context: any) => {
          window.__SENTRY_TEST__.contexts.push({ key, context });
          return originalSentry?.setContext?.(key, context);
        }
      };
    });
  }

  async injectNetworkError(pattern: string = '**/api/**') {
    await this.suite.page.route(pattern, route => route.abort('failed'));
  }

  async injectJavaScriptError(errorMessage: string = 'Simulated integration test error') {
    await this.suite.page.evaluate((message) => {
      setTimeout(() => {
        throw new Error(message);
      }, 100);
    }, errorMessage);
  }

  async injectChunkLoadingError() {
    await this.suite.page.route('**/_next/static/chunks/**', route => route.abort('failed'));
  }

  async injectServiceError(service: 'voice' | 'assessment' | 'chat') {
    const endpoints = {
      voice: '**/api/voice/**',
      assessment: '**/api/ai/generate**',
      chat: '**/api/chat**'
    };
    
    await this.suite.page.route(endpoints[service], route => route.abort('failed'));
  }

  /**
   * ERROR RECOVERY VALIDATION
   */

  async waitForErrorBoundary(timeout = 10000) {
    await this.suite.page.waitForSelector(
      '[data-testid="error-boundary"], text="Something went wrong", text="Component Error", text="Error"', 
      { timeout }
    );
  }

  async waitForSpecializedErrorBoundary(type: 'voice' | 'assessment' | 'chat', timeout = 10000) {
    const selectors = {
      voice: 'text="Voice Practice Error"',
      assessment: 'text="Assessment Generation Error"',
      chat: 'text="Advanced Chat Error"'
    };
    
    await this.suite.page.waitForSelector(selectors[type], { timeout });
  }

  async validateSentryIntegration(): Promise<boolean> {
    const sentryData = await this.suite.page.evaluate(() => window.__SENTRY_TEST__);
    
    return !!(
      sentryData?.capturedErrors?.length > 0 &&
      sentryData?.breadcrumbs?.length > 0
    );
  }

  async validateErrorReporting(): Promise<boolean> {
    // Check if error was reported to backend
    let errorReported = false;
    
    await this.suite.page.route('**/api/error/report', async (route) => {
      errorReported = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          success: true, 
          errorId: `test-error-${Date.now()}`,
          recommendations: {
            userActions: ['Try again', 'Refresh page'],
            systemActions: ['Clear cache', 'Reset state'],
            preventionMeasures: ['Better error handling']
          }
        })
      });
    });

    // Wait for potential error reporting
    await this.suite.page.waitForTimeout(2000);
    
    return errorReported;
  }

  async validateDataIntegrity(feature: string): Promise<boolean> {
    const dataIntegrityCheck = await this.suite.page.evaluate((featureName) => {
      // Check if critical data is preserved during error recovery
      const criticalKeys = {
        voice_practice: ['voice_settings', 'audio_permissions'],
        assessment_generator: ['assessment_preferences', 'generation_history'],
        advanced_chat: ['chat_preferences', 'conversation_backup'],
        general: ['user_preferences', 'session_data']
      };

      const keysToCheck = criticalKeys[featureName] || criticalKeys.general;
      
      return keysToCheck.every(key => {
        const sessionValue = sessionStorage.getItem(key);
        const localValue = localStorage.getItem(key);
        return sessionValue !== null || localValue !== null || key === 'session_data';
      });
    }, feature);

    return dataIntegrityCheck;
  }

  async executeRecoveryAction(action: 'try_again' | 'reset_services' | 'fallback_mode' | 'go_home') {
    const actionMap = {
      try_again: 'button:has-text("Try Again"), button:has-text("Retry")',
      reset_services: 'button:has-text("Reset"), button:has-text("Reset Voice Services"), button:has-text("Retry Generation"), button:has-text("Restore Chat")',
      fallback_mode: 'button:has-text("Text-Only Mode"), button:has-text("Simple Mode"), button:has-text("Basic Chat Mode")',
      go_home: 'button:has-text("Go Home"), button:has-text("Go to Homepage")'
    };

    await this.suite.page.click(actionMap[action]);
  }

  async validateRecoverySuccess(): Promise<boolean> {
    // Wait for error boundary to disappear
    try {
      await expect(this.suite.page.locator('[data-testid="error-boundary"]')).toBeHidden({ timeout: 10000 });
      await expect(this.suite.page.locator('text="Something went wrong"')).toBeHidden({ timeout: 5000 });
      
      // Verify normal content is visible
      const hasMainContent = await this.suite.page.locator('main, [role="main"], body > div').first().isVisible();
      return hasMainContent;
    } catch {
      return false;
    }
  }

  async monitorPerformanceMetrics(): Promise<{ loadTime: number; errorHandlingTime: number; recoveryTime: number }> {
    return await this.suite.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const measures = performance.getEntriesByType('measure');
      
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        errorHandlingTime: measures.find(m => m.name.includes('error'))?.duration || 0,
        recoveryTime: measures.find(m => m.name.includes('recovery'))?.duration || 0
      };
    });
  }

  /**
   * CROSS-SYSTEM COORDINATION TESTS
   */

  async validateCrossSystemCoordination(): Promise<boolean> {
    // Mock the error recovery coordination endpoint
    let coordinationCalled = false;
    
    await this.suite.page.route('**/api/internal/error-recovery', async (route) => {
      coordinationCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          recoveryResults: {
            clear_session_state: true,
            retry_with_fallback: true,
            reset_ai_context: true,
            cleanup_resources: true
          },
          timestamp: new Date().toISOString()
        })
      });
    });

    // Mock session cleanup endpoint
    let sessionCleanupCalled = false;
    
    await this.suite.page.route('**/api/session/cleanup', async (route) => {
      sessionCleanupCalled = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          summary: 'Session cleaned up successfully',
          results: {
            clear_session_state: true,
            cleanup_resources: true
          }
        })
      });
    });

    // Wait for coordination calls
    await this.suite.page.waitForTimeout(3000);
    
    return coordinationCalled && sessionCleanupCalled;
  }

  async simulateCompleteUserJourney(scenario: RecoveryScenario): Promise<{
    success: boolean;
    metrics: any;
    sentryIntegrated: boolean;
    dataIntact: boolean;
    coordinationWorked: boolean;
  }> {
    console.log(`Simulating complete user journey: ${scenario.name}`);
    
    // 1. Navigate to feature
    await this.suite.page.goto('/learning');
    
    // 2. Set up monitoring
    await this.mockSentryIntegration();
    
    // 3. Inject error based on scenario
    switch (scenario.errorType) {
      case 'network':
        await this.injectNetworkError();
        break;
      case 'javascript':
        await this.injectJavaScriptError(`${scenario.feature} integration test error`);
        break;
      case 'api':
        await this.mockAPIEndpoint(scenario.feature.replace('_', '/'), { status: 500, body: { error: 'API Error' } });
        break;
      case 'chunk':
        await this.injectChunkLoadingError();
        break;
      case 'service':
        const serviceMap = { voice_practice: 'voice', assessment_generator: 'assessment', advanced_chat: 'chat', page: 'chat' };
        await this.injectServiceError(serviceMap[scenario.feature] as any);
        break;
    }
    
    // 4. Trigger error
    if (scenario.feature !== 'page') {
      // Navigate to specific feature section
      const featureSelectors = {
        voice_practice: 'text="Voice Practice", [data-testid="voice-practice"]',
        assessment_generator: 'text="Assessment", [data-testid="assessment-generator"]',
        advanced_chat: 'text="Chat", [data-testid="advanced-chat"]'
      };
      
      try {
        await this.suite.page.click(featureSelectors[scenario.feature]);
      } catch {
        // Feature selector not found, continue with general error
      }
    }
    
    // 5. Wait for error boundary
    await this.waitForErrorBoundary();
    
    // 6. Validate error reporting
    const errorReported = await this.validateErrorReporting();
    
    // 7. Validate cross-system coordination
    const coordinationWorked = await this.validateCrossSystemCoordination();
    
    // 8. Validate Sentry integration
    const sentryIntegrated = await this.validateSentryIntegration();
    
    // 9. Check data integrity
    const dataIntact = await this.validateDataIntegrity(scenario.feature);
    
    // 10. Attempt recovery
    await this.executeRecoveryAction('try_again');
    
    // 11. If first recovery fails, try fallback
    const recovered = await this.validateRecoverySuccess();
    if (!recovered && scenario.expectedFallbacks.length > 0) {
      await this.executeRecoveryAction('fallback_mode');
    }
    
    // 12. Final recovery validation
    const finalRecoverySuccess = await this.validateRecoverySuccess();
    
    // 13. Monitor performance
    const metrics = await this.monitorPerformanceMetrics();
    
    return {
      success: finalRecoverySuccess || recovered,
      metrics,
      sentryIntegrated,
      dataIntact,
      coordinationWorked: coordinationWorked || errorReported
    };
  }
}

test.describe('Error Recovery Integration Tests', () => {
  let helper: IntegrationTestHelper;

  test.beforeEach(async ({ page, context }) => {
    helper = new IntegrationTestHelper({ page, context });
    
    // Set up global error capture
    await page.addInitScript(() => {
      window.__TEST_ERRORS__ = [];
      const originalError = console.error;
      console.error = (...args) => {
        window.__TEST_ERRORS__.push(args);
        originalError.apply(console, args);
      };
      
      // Mock user session
      sessionStorage.setItem('user_preferences', JSON.stringify({
        userId: 'test-user-integration',
        sessionId: `session-${Date.now()}`
      }));
    });
  });

  const recoveryScenarios: RecoveryScenario[] = [
    {
      name: 'Voice Practice Complete Recovery Flow',
      errorType: 'service',
      feature: 'voice_practice',
      expectedRecoveryActions: ['reset_voice_state', 'clear_audio_buffers', 'reinitialize_speech_api'],
      expectedFallbacks: ['text-only mode'],
      criticalityLevel: 'high'
    },
    {
      name: 'Assessment Generator API Failure Recovery',
      errorType: 'api',
      feature: 'assessment_generator',
      expectedRecoveryActions: ['retry_generation', 'clear_generation_cache', 'fallback_to_simple_mode'],
      expectedFallbacks: ['simple mode', 'pre-built templates'],
      criticalityLevel: 'medium'
    },
    {
      name: 'Advanced Chat Context Preservation',
      errorType: 'javascript',
      feature: 'advanced_chat',
      expectedRecoveryActions: ['preserve_chat_state', 'restore_conversation_context', 'reinitialize_ai_services'],
      expectedFallbacks: ['basic chat mode'],
      criticalityLevel: 'high'
    },
    {
      name: 'Network Failure Cross-System Recovery',
      errorType: 'network',
      feature: 'page',
      expectedRecoveryActions: ['retry_with_fallback', 'clear_session_state', 'cleanup_resources'],
      expectedFallbacks: ['offline mode', 'cached content'],
      criticalityLevel: 'critical'
    },
    {
      name: 'Chunk Loading Error Page Recovery',
      errorType: 'chunk',
      feature: 'page',
      expectedRecoveryActions: ['clear_cache', 'retry_chunk_load', 'fallback_routing'],
      expectedFallbacks: ['basic page version'],
      criticalityLevel: 'high'
    }
  ];

  recoveryScenarios.forEach(scenario => {
    test(`Complete Integration Test: ${scenario.name}`, async () => {
      const result = await helper.simulateCompleteUserJourney(scenario);
      
      // Assert recovery success
      expect(result.success).toBe(true);
      
      // Assert Sentry integration
      expect(result.sentryIntegrated).toBe(true);
      
      // Assert data integrity
      expect(result.dataIntact).toBe(true);
      
      // Assert cross-system coordination
      expect(result.coordinationWorked).toBe(true);
      
      // Assert performance benchmarks
      expect(result.metrics.loadTime).toBeLessThan(5000); // 5 seconds max
      expect(result.metrics.errorHandlingTime).toBeLessThan(2000); // 2 seconds max for error handling
      
      console.log(`Integration test completed for ${scenario.name}:`, result);
    });
  });

  test('Real-time Error Recovery Coordination', async ({ page }) => {
    helper = new IntegrationTestHelper({ page, context: page.context() });
    
    // Set up real-time monitoring
    await helper.mockSentryIntegration();
    
    // Mock multiple coordinated errors
    await helper.injectNetworkError('**/api/recommendations/**');
    await helper.injectServiceError('assessment');
    
    await page.goto('/learning');
    
    // Trigger multiple errors simultaneously
    await Promise.all([
      page.click('text="Assessment"').catch(() => console.log('Assessment click failed as expected')),
      page.click('text="Chat"').catch(() => console.log('Chat click failed as expected')),
      helper.injectJavaScriptError('Coordinated error test')
    ]);
    
    // Wait for error boundary
    await helper.waitForErrorBoundary();
    
    // Validate coordination
    const coordination = await helper.validateCrossSystemCoordination();
    expect(coordination).toBe(true);
    
    // Validate recovery
    await helper.executeRecoveryAction('try_again');
    const recovered = await helper.validateRecoverySuccess();
    expect(recovered).toBe(true);
  });

  test('Mobile Integration Error Recovery', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    helper = new IntegrationTestHelper({ page, context: page.context() });
    await helper.mockSentryIntegration();
    
    await page.goto('/learning');
    
    // Mobile-specific error injection
    await helper.injectServiceError('voice');
    await helper.injectJavaScriptError('Mobile integration test error');
    
    await helper.waitForErrorBoundary();
    
    // Validate mobile-responsive error UI
    const tryAgainButton = page.locator('button:has-text("Try Again")');
    await expect(tryAgainButton).toBeVisible();
    
    // Check touch-friendly button sizes
    const buttonHeight = await tryAgainButton.evaluate(el => {
      return window.getComputedStyle(el).height;
    });
    const heightValue = parseInt(buttonHeight.replace('px', ''));
    expect(heightValue).toBeGreaterThanOrEqual(44); // iOS minimum touch target
    
    // Test mobile recovery
    await helper.executeRecoveryAction('try_again');
    const recovered = await helper.validateRecoverySuccess();
    expect(recovered).toBe(true);
  });

  test('Production Error Monitoring Integration', async ({ page }) => {
    helper = new IntegrationTestHelper({ page, context: page.context() });
    
    // Mock production-like Sentry setup
    await page.addInitScript(() => {
      window.__SENTRY_PRODUCTION__ = {
        environment: 'test-production',
        release: 'test-1.0.0',
        userId: 'test-production-user'
      };
    });
    
    await helper.mockSentryIntegration();
    await page.goto('/learning');
    
    // Simulate production error
    await helper.injectJavaScriptError('Production simulation error');
    await helper.waitForErrorBoundary();
    
    // Validate production error tracking
    const sentryData = await page.evaluate(() => window.__SENTRY_TEST__);
    expect(sentryData.capturedErrors.length).toBeGreaterThan(0);
    expect(sentryData.breadcrumbs.length).toBeGreaterThan(0);
    
    // Validate error context
    const errorContext = sentryData.capturedErrors[0].context;
    expect(errorContext).toBeDefined();
    
    console.log('Production error monitoring validation:', {
      errorsCount: sentryData.capturedErrors.length,
      breadcrumbsCount: sentryData.breadcrumbs.length,
      contextPresent: !!errorContext
    });
  });

  test('Multi-Feature Error Cascade Recovery', async ({ page }) => {
    helper = new IntegrationTestHelper({ page, context: page.context() });
    await helper.mockSentryIntegration();
    
    await page.goto('/learning');
    
    // Simulate cascading errors across features
    await helper.injectServiceError('voice');
    await helper.injectServiceError('assessment');
    await helper.injectServiceError('chat');
    await helper.injectNetworkError('**/api/recommendations/**');
    
    // Wait for first error
    await helper.waitForErrorBoundary();
    
    // Validate system-wide recovery coordination
    const coordination = await helper.validateCrossSystemCoordination();
    expect(coordination).toBe(true);
    
    // Test cascading recovery
    await helper.executeRecoveryAction('try_again');
    
    // If first recovery fails, test fallback coordination
    let recovered = await helper.validateRecoverySuccess();
    if (!recovered) {
      await helper.executeRecoveryAction('fallback_mode');
      recovered = await helper.validateRecoverySuccess();
    }
    
    expect(recovered).toBe(true);
    
    // Validate that all features are in a stable state
    const dataIntegrity = await helper.validateDataIntegrity('general');
    expect(dataIntegrity).toBe(true);
  });

  test('Performance Under Error Conditions', async ({ page }) => {
    helper = new IntegrationTestHelper({ page, context: page.context } );
    
    await page.goto('/learning');
    
    // Start performance monitoring
    await page.evaluate(() => {
      performance.mark('integration-test-start');
    });
    
    // Inject performance-impacting error
    await helper.injectNetworkError();
    await helper.injectJavaScriptError('Performance test error');
    
    await helper.waitForErrorBoundary();
    
    // Measure error handling performance
    await page.evaluate(() => {
      performance.mark('error-handled');
      performance.measure('error-handling-time', 'integration-test-start', 'error-handled');
    });
    
    // Execute recovery
    await helper.executeRecoveryAction('try_again');
    await helper.validateRecoverySuccess();
    
    // Measure total recovery time
    const performanceMetrics = await page.evaluate(() => {
      performance.mark('recovery-complete');
      performance.measure('total-recovery-time', 'integration-test-start', 'recovery-complete');
      
      const measures = performance.getEntriesByType('measure');
      return {
        errorHandlingTime: measures.find(m => m.name === 'error-handling-time')?.duration || 0,
        totalRecoveryTime: measures.find(m => m.name === 'total-recovery-time')?.duration || 0
      };
    });
    
    // Assert performance benchmarks
    expect(performanceMetrics.errorHandlingTime).toBeLessThan(3000); // 3 seconds max
    expect(performanceMetrics.totalRecoveryTime).toBeLessThan(10000); // 10 seconds max
    
    console.log('Performance metrics under error conditions:', performanceMetrics);
  });

  test('Accessibility During Error Recovery', async ({ page }) => {
    helper = new IntegrationTestHelper({ page, context: page.context() });
    
    await page.goto('/learning');
    await helper.injectJavaScriptError('Accessibility test error');
    await helper.waitForErrorBoundary();
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus').first();
    await expect(focusedElement).toBeVisible();
    
    // Test screen reader compatibility
    const errorHeading = page.locator('h1, h2, h3').first();
    await expect(errorHeading).toBeVisible();
    
    const headingText = await errorHeading.textContent();
    expect(headingText).toMatch(/error|something went wrong/i);
    
    // Test ARIA labels
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      
      expect(ariaLabel || textContent).toBeTruthy();
    }
    
    // Test color contrast (basic check)
    const errorElement = page.locator('text="Something went wrong", text="Component Error"').first();
    if (await errorElement.count() > 0) {
      const styles = await errorElement.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });
      
      expect(styles.color).toBeTruthy();
    }
    
    // Test recovery via keyboard
    await page.keyboard.press('Enter');
    const recovered = await helper.validateRecoverySuccess();
    expect(recovered).toBe(true);
  });
});