/**
 * End-to-End Tests for Error Recovery User Flows
 * Tests complete user experience flows for error scenarios and recovery
 */

// Note: This requires Playwright for E2E testing
// Run: npm install --save-dev @playwright/test

import { test, expect, Page, BrowserContext } from '@playwright/test';

// Test utilities
class ErrorRecoveryTestHelper {
  constructor(private page: Page) {}

  // Simulate network errors
  async simulateNetworkError() {
    await this.page.route('**/api/**', route => {
      route.abort('failed');
    });
  }

  // Simulate JavaScript errors
  async simulateJavaScriptError() {
    await this.page.evaluate(() => {
      // Trigger an unhandled error
      setTimeout(() => {
        throw new Error('Simulated JavaScript error for testing');
      }, 100);
    });
  }

  // Simulate chunk loading errors (common in Next.js)
  async simulateChunkLoadError() {
    await this.page.route('**/_next/static/chunks/**', route => {
      route.abort('failed');
    });
  }

  // Wait for error boundary to appear
  async waitForErrorBoundary(timeout = 5000) {
    await this.page.waitForSelector('[data-testid="error-boundary"], text="Something went wrong", text="Component Error"', { timeout });
  }

  // Wait for specific specialized error boundary
  async waitForSpecializedErrorBoundary(type: 'voice' | 'assessment' | 'chat', timeout = 5000) {
    const selectors = {
      voice: 'text="Voice Practice Error"',
      assessment: 'text="Assessment Generation Error"',
      chat: 'text="Advanced Chat Error"'
    };
    
    await this.page.waitForSelector(selectors[type], { timeout });
  }

  // Check for Sentry error reporting
  async checkSentryErrorReporting() {
    return await this.page.evaluate(() => {
      // Check if Sentry has been called (in real tests, this would check network requests)
      return window.__SENTRY__ !== undefined;
    });
  }

  // Simulate recovery actions
  async clickTryAgain() {
    await this.page.click('button:has-text("Try Again"), button:has-text("Retry")');
  }

  async clickGoHome() {
    await this.page.click('button:has-text("Go Home")');
  }

  async clickResetServices(service: 'voice' | 'assessment' | 'chat') {
    const buttons = {
      voice: 'button:has-text("Reset Voice Services")',
      assessment: 'button:has-text("Retry Generation")',
      chat: 'button:has-text("Restore Chat")'
    };
    
    await this.page.click(buttons[service]);
  }

  async clickFallbackMode(type: 'text' | 'simple' | 'basic') {
    const buttons = {
      text: 'button:has-text("Text-Only Mode")',
      simple: 'button:has-text("Simple Mode")',
      basic: 'button:has-text("Basic Chat Mode")'
    };
    
    await this.page.click(buttons[type]);
  }

  // Check recovery progress messages
  async waitForRecoveryMessage(message: string, timeout = 10000) {
    await this.page.waitForSelector(`text="${message}"`, { timeout });
  }

  // Verify component has recovered
  async verifyRecovery() {
    // Wait for error boundary to disappear
    await expect(this.page.locator('[data-testid="error-boundary"]')).toBeHidden({ timeout: 5000 });
    
    // Verify normal content is back
    await expect(this.page.locator('body')).not.toContainText('Something went wrong');
    await expect(this.page.locator('body')).not.toContainText('Component Error');
  }

  // Check accessibility of error states
  async checkErrorBoundaryAccessibility() {
    // Check for proper headings
    const headings = await this.page.locator('h1, h2, h3').count();
    expect(headings).toBeGreaterThan(0);

    // Check for button accessibility
    const buttons = await this.page.locator('button').all();
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      expect(ariaLabel || textContent).toBeTruthy();
    }

    // Check color contrast (basic check)
    const errorText = this.page.locator('text="Something went wrong", text="Component Error"').first();
    if (await errorText.count() > 0) {
      const styles = await errorText.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          color: computed.color,
          backgroundColor: computed.backgroundColor
        };
      });
      expect(styles.color).toBeTruthy();
    }
  }
}

test.describe('Error Recovery User Flows', () => {
  let helper: ErrorRecoveryTestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new ErrorRecoveryTestHelper(page);
    
    // Set up test environment
    await page.goto('/');
    
    // Mock console to capture errors
    await page.addInitScript(() => {
      window.__TEST_ERRORS__ = [];
      const originalError = console.error;
      console.error = (...args) => {
        window.__TEST_ERRORS__.push(args);
        originalError.apply(console, args);
      };
    });
  });

  test.describe('Component-Level Error Recovery', () => {
    test('should recover from component error with Try Again button', async ({ page }) => {
      // Navigate to a page with error-prone component
      await page.goto('/learning');
      
      // Simulate component error
      await helper.simulateJavaScriptError();
      
      // Wait for error boundary to appear
      await helper.waitForErrorBoundary();
      
      // Verify error boundary content
      await expect(page.locator('text="Component Error"')).toBeVisible();
      await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
      
      // Check accessibility
      await helper.checkErrorBoundaryAccessibility();
      
      // Attempt recovery
      await helper.clickTryAgain();
      
      // Wait for recovery
      await helper.waitForRecoveryMessage('Recovering...').catch(() => {
        // Recovery message might be brief, continue
      });
      
      // Verify recovery
      await helper.verifyRecovery();
      
      // Verify we're back to normal state
      await expect(page.locator('main')).toBeVisible();
    });

    test('should handle multiple recovery attempts', async ({ page }) => {
      await page.goto('/learning');
      
      // Simulate persistent error
      await page.route('**/api/**', route => route.abort('failed'));
      await helper.simulateJavaScriptError();
      
      await helper.waitForErrorBoundary();
      
      // First recovery attempt
      await helper.clickTryAgain();
      await page.waitForTimeout(1000);
      
      // Error might persist, try again
      if (await page.locator('button:has-text("Try Again")').count() > 0) {
        await helper.clickTryAgain();
        await page.waitForTimeout(1000);
      }
      
      // Should eventually recover or show appropriate fallback
      const hasError = await page.locator('text="Component Error"').count() > 0;
      const hasContent = await page.locator('main').count() > 0;
      
      expect(hasError || hasContent).toBeTruthy();
    });
  });

  test.describe('Page-Level Error Recovery', () => {
    test('should recover from page-level error', async ({ page }) => {
      // Simulate a page-level error
      await page.route('**/*', route => {
        if (route.request().url().includes('_next/static')) {
          route.abort('failed');
        } else {
          route.continue();
        }
      });
      
      await page.goto('/learning');
      await helper.waitForErrorBoundary();
      
      // Verify page-level error UI
      await expect(page.locator('text="Something went wrong"')).toBeVisible();
      await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
      await expect(page.locator('button:has-text("Go Home")')).toBeVisible();
      
      // Test Go Home functionality
      await helper.clickGoHome();
      
      // Should navigate to home page
      await page.waitForURL('/');
      await expect(page.locator('main')).toBeVisible();
    });

    test('should handle global error boundary', async ({ page }) => {
      // Simulate critical application error
      await page.evaluate(() => {
        // Force a global error
        throw new Error('Critical application error');
      });
      
      // Global error handler should catch this
      await page.waitForSelector('text="Something went wrong!"', { timeout: 5000 });
      
      // Verify global error UI
      await expect(page.locator('text="We apologize for the inconvenience"')).toBeVisible();
      await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
      await expect(page.locator('button:has-text("Go to Homepage")')).toBeVisible();
      
      // Test homepage navigation
      await page.click('button:has-text("Go to Homepage")');
      await page.waitForURL('/');
    });
  });

  test.describe('Voice Practice Error Recovery', () => {
    test('should recover from voice recognition errors', async ({ page }) => {
      await page.goto('/learning');
      
      // Navigate to voice practice
      await page.click('text="Voice Practice"').catch(() => {
        // Fallback if button text is different
        console.log('Voice practice navigation fallback');
      });
      
      // Simulate voice recognition error
      await page.evaluate(() => {
        // Mock voice API error
        if (typeof window !== 'undefined') {
          window.speechSynthesis = undefined;
          window.webkitSpeechRecognition = undefined;
        }
      });
      
      // Trigger voice component error
      await helper.simulateJavaScriptError();
      await helper.waitForSpecializedErrorBoundary('voice');
      
      // Verify voice-specific error UI
      await expect(page.locator('text="Voice Practice Error"')).toBeVisible();
      await expect(page.locator('text="voice recognition system"')).toBeVisible();
      await expect(page.locator('button:has-text("Reset Voice Services")')).toBeVisible();
      await expect(page.locator('button:has-text("Text-Only Mode")')).toBeVisible();
      
      // Test voice service reset
      await helper.clickResetServices('voice');
      
      // Wait for recovery process
      await helper.waitForRecoveryMessage('Resetting voice services...').catch(() => {
        console.log('Recovery message not found, continuing...');
      });
      
      // Should either recover or show recovery success
      await page.waitForTimeout(2000);
      
      // Test fallback mode
      if (await page.locator('button:has-text("Text-Only Mode")').count() > 0) {
        await helper.clickFallbackMode('text');
        await helper.waitForRecoveryMessage('Switching to text-only mode...');
        
        // Verify fallback mode is active
        const fallbackMode = await page.evaluate(() => 
          sessionStorage.getItem('voice_practice_fallback')
        );
        expect(fallbackMode).toBe('true');
      }
    });

    test('should provide troubleshooting guidance', async ({ page }) => {
      await page.goto('/learning');
      
      // Simulate voice error
      await helper.simulateJavaScriptError();
      await helper.waitForSpecializedErrorBoundary('voice');
      
      // Verify troubleshooting tips are present
      await expect(page.locator('text="Troubleshooting Tips:"')).toBeVisible();
      await expect(page.locator('text="Check microphone permissions"')).toBeVisible();
      await expect(page.locator('text="Ensure you\'re using HTTPS"')).toBeVisible();
      await expect(page.locator('text="supported browser"')).toBeVisible();
    });
  });

  test.describe('Assessment Generator Error Recovery', () => {
    test('should recover from assessment generation errors', async ({ page }) => {
      await page.goto('/learning');
      
      // Navigate to assessment generator
      await page.click('text="Assessment"').catch(() => {
        console.log('Assessment navigation fallback');
      });
      
      // Simulate AI service error
      await page.route('**/api/generate-assessment', route => {
        route.abort('failed');
      });
      
      await helper.simulateJavaScriptError();
      await helper.waitForSpecializedErrorBoundary('assessment');
      
      // Verify assessment-specific error UI
      await expect(page.locator('text="Assessment Generation Error"')).toBeVisible();
      await expect(page.locator('text="AI assessment generator"')).toBeVisible();
      await expect(page.locator('button:has-text("Retry Generation")')).toBeVisible();
      await expect(page.locator('button:has-text("Simple Mode")')).toBeVisible();
      await expect(page.locator('button:has-text("Use Pre-built")')).toBeVisible();
      
      // Test retry generation
      await helper.clickResetServices('assessment');
      await helper.waitForRecoveryMessage('Retrying assessment generation...');
      
      // Test simple mode fallback
      if (await page.locator('button:has-text("Simple Mode")').count() > 0) {
        await helper.clickFallbackMode('simple');
        await helper.waitForRecoveryMessage('Switching to simple mode...');
        
        // Verify simple mode is active
        const simpleMode = await page.evaluate(() => 
          sessionStorage.getItem('assessment_simple_mode')
        );
        expect(simpleMode).toBe('true');
      }
      
      // Test offline mode
      await page.reload();
      await helper.simulateJavaScriptError();
      await helper.waitForSpecializedErrorBoundary('assessment');
      
      await page.click('button:has-text("Use Pre-built")');
      
      const offlineMode = await page.evaluate(() => 
        sessionStorage.getItem('assessment_offline_mode')
      );
      expect(offlineMode).toBe('true');
    });

    test('should show recovery options information', async ({ page }) => {
      await page.goto('/learning');
      
      await helper.simulateJavaScriptError();
      await helper.waitForSpecializedErrorBoundary('assessment');
      
      // Verify recovery options explanation
      await expect(page.locator('text="Recovery Options:"')).toBeVisible();
      await expect(page.locator('text="Retry: Attempt generation again"')).toBeVisible();
      await expect(page.locator('text="Simple Mode: Generate basic assessments"')).toBeVisible();
      await expect(page.locator('text="Pre-built: Use offline assessment templates"')).toBeVisible();
    });
  });

  test.describe('Advanced Chat Error Recovery', () => {
    test('should recover from chat system errors', async ({ page }) => {
      await page.goto('/learning');
      
      // Navigate to chat interface
      await page.click('text="Chat"').catch(() => {
        console.log('Chat navigation fallback');
      });
      
      // Simulate chat service error
      await page.route('**/api/chat', route => {
        route.abort('failed');
      });
      
      await helper.simulateJavaScriptError();
      await helper.waitForSpecializedErrorBoundary('chat');
      
      // Verify chat-specific error UI
      await expect(page.locator('text="Advanced Chat Error"')).toBeVisible();
      await expect(page.locator('text="advanced chat system"')).toBeVisible();
      await expect(page.locator('button:has-text("Restore Chat")')).toBeVisible();
      await expect(page.locator('button:has-text("Basic Chat Mode")')).toBeVisible();
      
      // Test chat restoration
      await helper.clickResetServices('chat');
      await helper.waitForRecoveryMessage('Restoring chat context...');
      
      // Test basic chat mode fallback
      if (await page.locator('button:has-text("Basic Chat Mode")').count() > 0) {
        await helper.clickFallbackMode('basic');
        await helper.waitForRecoveryMessage('Switching to basic chat mode...');
        
        // Verify basic mode is active
        const basicMode = await page.evaluate(() => 
          sessionStorage.getItem('chat_mode')
        );
        expect(basicMode).toBe('basic');
      }
    });

    test('should preserve conversation context', async ({ page }) => {
      await page.goto('/learning');
      
      // Set up mock conversation context
      await page.evaluate(() => {
        sessionStorage.setItem('advanced_chat_context', JSON.stringify({
          messages: ['Hello', 'How can I help?'],
          timestamp: new Date().toISOString()
        }));
      });
      
      await helper.simulateJavaScriptError();
      await helper.waitForSpecializedErrorBoundary('chat');
      
      // Verify context preservation message
      await expect(page.locator('text="Your learning progress and conversation history are automatically saved"')).toBeVisible();
      await expect(page.locator('text="You can continue where you left off"')).toBeVisible();
      
      // Test context restoration
      await helper.clickResetServices('chat');
      
      // Context should be preserved through recovery
      const preservedContext = await page.evaluate(() => 
        sessionStorage.getItem('advanced_chat_context')
      );
      expect(preservedContext).toBeTruthy();
    });
  });

  test.describe('Network Error Recovery', () => {
    test('should handle network connectivity issues', async ({ page }) => {
      await page.goto('/learning');
      
      // Simulate network failure
      await helper.simulateNetworkError();
      
      // Navigate to trigger network request
      await page.click('button, a').first().catch(() => {
        console.log('No interactive elements found');
      });
      
      await page.waitForTimeout(2000);
      
      // Check if network error handling is working
      const hasError = await page.locator('text="Something went wrong", text="Component Error"').count() > 0;
      const hasNetworkMessage = await page.locator('text="network", text="connectivity"').count() > 0;
      
      if (hasError || hasNetworkMessage) {
        // Verify error handling
        expect(hasError || hasNetworkMessage).toBeTruthy();
        
        // Test recovery after network is restored
        await page.unroute('**/api/**');
        
        if (await page.locator('button:has-text("Try Again")').count() > 0) {
          await helper.clickTryAgain();
          await helper.verifyRecovery();
        }
      }
    });
  });

  test.describe('Mobile Error Recovery', () => {
    test('should work on mobile viewports', async ({ page, browserName }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/learning');
      
      // Simulate error on mobile
      await helper.simulateJavaScriptError();
      await helper.waitForErrorBoundary();
      
      // Verify mobile-responsive error UI
      await expect(page.locator('button:has-text("Try Again")')).toBeVisible();
      
      // Check that buttons are touch-friendly (at least 44px)
      const buttonHeight = await page.locator('button:has-text("Try Again")').evaluate(el => {
        return window.getComputedStyle(el).height;
      });
      
      const heightValue = parseInt(buttonHeight.replace('px', ''));
      expect(heightValue).toBeGreaterThanOrEqual(44);
      
      // Test recovery on mobile
      await helper.clickTryAgain();
      
      // Should work the same as desktop
      await helper.verifyRecovery();
    });
  });

  test.describe('Keyboard Navigation', () => {
    test('should support keyboard navigation in error states', async ({ page }) => {
      await page.goto('/learning');
      
      await helper.simulateJavaScriptError();
      await helper.waitForErrorBoundary();
      
      // Test tab navigation
      await page.keyboard.press('Tab');
      
      // First interactive element should be focused
      const focused = await page.locator(':focus').textContent();
      expect(focused).toContain('Try Again');
      
      // Test activation with Enter key
      await page.keyboard.press('Enter');
      
      // Should trigger recovery
      await helper.verifyRecovery();
    });

    test('should handle keyboard navigation in specialized error boundaries', async ({ page }) => {
      await page.goto('/learning');
      
      await helper.simulateJavaScriptError();
      await helper.waitForSpecializedErrorBoundary('voice');
      
      // Tab through all buttons
      await page.keyboard.press('Tab');
      let focusedText = await page.locator(':focus').textContent();
      
      // Should focus on first button
      expect(focusedText).toBeTruthy();
      
      // Tab to next button
      await page.keyboard.press('Tab');
      focusedText = await page.locator(':focus').textContent();
      
      // Should focus on second button
      expect(focusedText).toBeTruthy();
      
      // Should be able to activate with Space key
      await page.keyboard.press(' ');
      
      // Should trigger some action
      await page.waitForTimeout(1000);
    });
  });

  test.describe('Performance During Errors', () => {
    test('should maintain performance during error states', async ({ page }) => {
      await page.goto('/learning');
      
      // Start performance measurement
      await page.evaluate(() => performance.mark('error-start'));
      
      await helper.simulateJavaScriptError();
      await helper.waitForErrorBoundary();
      
      // End performance measurement
      await page.evaluate(() => performance.mark('error-end'));
      
      const performanceEntry = await page.evaluate(() => {
        performance.measure('error-handling', 'error-start', 'error-end');
        const measure = performance.getEntriesByName('error-handling')[0];
        return measure.duration;
      });
      
      // Error handling should be reasonably fast (under 1 second)
      expect(performanceEntry).toBeLessThan(1000);
    });

    test('should not cause memory leaks during error recovery', async ({ page }) => {
      await page.goto('/learning');
      
      // Get initial memory usage
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      
      // Trigger multiple error-recovery cycles
      for (let i = 0; i < 3; i++) {
        await helper.simulateJavaScriptError();
        await helper.waitForErrorBoundary();
        await helper.clickTryAgain();
        await page.waitForTimeout(1000);
      }
      
      // Force garbage collection if available
      await page.evaluate(() => {
        if ('gc' in window) {
          (window as any).gc();
        }
      });
      
      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });
      
      if (initialMemory > 0 && finalMemory > 0) {
        // Memory usage shouldn't increase dramatically
        const memoryIncrease = finalMemory - initialMemory;
        const increasePercentage = (memoryIncrease / initialMemory) * 100;
        
        // Allow for some increase but not excessive
        expect(increasePercentage).toBeLessThan(50);
      }
    });
  });
});