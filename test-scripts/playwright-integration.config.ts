/**
 * Playwright Configuration for Error Recovery Integration Tests
 * Specialized configuration for comprehensive end-to-end error recovery testing
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory for integration tests
  testDir: '__tests__/integration',
  
  // Global test timeout
  timeout: 90000, // 90 seconds for complex integration flows
  
  // Expect timeout for individual assertions
  expect: {
    timeout: 10000 // 10 seconds for element expectations
  },
  
  // Test configuration
  fullyParallel: false, // Sequential for cross-system coordination tests
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 1 : 2, // Limited workers for integration tests
  
  // Reporter configuration
  reporter: [
    ['html', { outputFolder: 'playwright-report-integration' }],
    ['json', { outputFile: 'test-results-integration.json' }],
    ['line'],
    ['allure-playwright', { outputFolder: 'allure-results-integration' }]
  ],
  
  // Global setup and teardown
  globalSetup: require.resolve('./integration-global-setup.ts'),
  globalTeardown: require.resolve('./integration-global-teardown.ts'),
  
  // Use configuration
  use: {
    // Base URL for the application
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
    
    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Tracing and debugging
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Network and timing
    actionTimeout: 15000, // 15 seconds for actions
    navigationTimeout: 30000, // 30 seconds for navigation
    
    // Test isolation
    storageState: {
      cookies: [],
      origins: []
    }
  },
  
  // Test projects for different environments and browsers
  projects: [
    // Desktop Chrome - Primary integration testing
    {
      name: 'Desktop Chrome - Integration',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          args: [
            '--disable-web-security',
            '--disable-features=VizDisplayCompositor',
            '--allow-running-insecure-content',
            '--disable-blink-features=AutomationControlled'
          ]
        }
      },
      testMatch: '**/*integration*.test.ts'
    },
    
    // Desktop Firefox - Cross-browser validation
    {
      name: 'Desktop Firefox - Integration',
      use: {
        ...devices['Desktop Firefox'],
        launchOptions: {
          firefoxUserPrefs: {
            'dom.webnotifications.enabled': false,
            'media.navigator.permission.disabled': true
          }
        }
      },
      testMatch: '**/*integration*.test.ts'
    },
    
    // Mobile Chrome - Mobile integration testing
    {
      name: 'Mobile Chrome - Integration',
      use: {
        ...devices['Pixel 5'],
        hasTouch: true,
        isMobile: true
      },
      testMatch: '**/*integration*.test.ts'
    },
    
    // Desktop Safari - WebKit testing (if on macOS)
    ...(process.platform === 'darwin' ? [{
      name: 'Desktop Safari - Integration',
      use: {
        ...devices['Desktop Safari'],
        launchOptions: {
          logger: {
            isEnabled: () => true,
            log: (name: string, severity: string, message: string) => {
              console.log(`[${severity}] ${name}: ${message}`);
            }
          }
        }
      },
      testMatch: '**/*integration*.test.ts'
    }] : []),
    
    // Performance testing configuration
    {
      name: 'Performance - Integration',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        launchOptions: {
          args: [
            '--enable-precise-memory-info',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding'
          ]
        }
      },
      testMatch: '**/*performance*.test.ts'
    }
  ],
  
  // Development server configuration
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start dev server
    env: {
      NODE_ENV: 'test',
      NEXT_PUBLIC_SENTRY_DSN: process.env.SENTRY_DSN_TEST || '',
      NEXT_PUBLIC_TEST_MODE: 'integration'
    }
  },
  
  // Test metadata
  metadata: {
    testType: 'integration',
    errorRecovery: true,
    crossSystemTesting: true,
    sentryIntegration: true,
    performanceMonitoring: true
  }
});