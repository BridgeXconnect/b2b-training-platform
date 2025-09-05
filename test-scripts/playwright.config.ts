/**
 * Playwright Configuration for Integration Testing
 * Optimized for error recovery and cross-system validation
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './test-scripts/__tests__',
  
  // Test patterns
  testMatch: [
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.spec.ts',
    '**/*.spec.tsx'
  ],

  // Test timeout
  timeout: 60000, // 1 minute per test
  expect: {
    timeout: 10000 // 10 seconds for assertions
  },

  // Global setup and teardown
  globalSetup: require.resolve('./test-scripts/setup/global-setup.ts'),
  globalTeardown: require.resolve('./test-scripts/setup/global-teardown.ts'),

  // Run tests in parallel
  fullyParallel: true,
  
  // Forbid test.only in CI
  forbidOnly: !!process.env.CI,
  
  // Retry configuration
  retries: process.env.CI ? 2 : 1,
  
  // Workers configuration
  workers: process.env.CI ? 2 : 4,
  
  // Failure handling
  maxFailures: process.env.CI ? 10 : undefined,

  // Reporter configuration
  reporter: [
    ['html', { 
      outputFolder: 'test-scripts/__tests__/reports/playwright',
      open: !process.env.CI ? 'on-failure' : 'never'
    }],
    ['json', { 
      outputFile: 'test-scripts/__tests__/reports/playwright-results.json' 
    }],
    ['junit', { 
      outputFile: 'test-scripts/__tests__/reports/junit-results.xml' 
    }],
    // Custom reporter for integration metrics
    [require.resolve('./test-scripts/reporters/integration-reporter.ts')]
  ],

  // Global test configuration
  use: {
    // Base URL for tests
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // Browser configuration
    headless: process.env.CI ? true : false,
    viewport: { width: 1280, height: 720 },
    
    // Screenshots
    screenshot: {
      mode: 'only-on-failure',
      fullPage: true
    },
    
    // Video recording
    video: {
      mode: 'retain-on-failure',
      size: { width: 1280, height: 720 }
    },
    
    // Tracing for debugging
    trace: {
      mode: 'retain-on-failure',
      screenshots: true,
      snapshots: true,
      sources: true
    },
    
    // Network configuration
    ignoreHTTPSErrors: true,
    
    // Action timeout
    actionTimeout: 10000,
    
    // Navigation timeout
    navigationTimeout: 30000,
    
    // Additional context options
    extraHTTPHeaders: {
      'Accept-Language': 'en-US'
    },
    
    // Permissions
    permissions: ['microphone', 'camera'],
    
    // Geolocation
    geolocation: { latitude: 37.7749, longitude: -122.4194 },
    
    // Color scheme
    colorScheme: 'light'
  },

  // Test projects for different scenarios
  projects: [
    // Desktop browsers
    {
      name: 'chromium-desktop',
      use: { 
        ...devices['Desktop Chrome'],
        channel: 'chrome'
      },
      testMatch: '**/{integration,e2e}/**/*.test.ts'
    },
    
    {
      name: 'firefox-desktop',
      use: { ...devices['Desktop Firefox'] },
      testMatch: '**/{integration,e2e}/**/*.test.ts'
    },
    
    {
      name: 'webkit-desktop',
      use: { ...devices['Desktop Safari'] },
      testMatch: '**/{integration,e2e}/**/*.test.ts'
    },

    // Mobile browsers
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      testMatch: '**/mobile/**/*.test.ts'
    },
    
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
      testMatch: '**/mobile/**/*.test.ts'
    },

    // Specific test suites
    {
      name: 'error-recovery',
      use: { ...devices['Desktop Chrome'] },
      testMatch: '**/error-recovery/**/*.test.ts',
      timeout: 90000 // Extended timeout for error recovery tests
    },
    
    {
      name: 'cross-system',
      use: { 
        ...devices['Desktop Chrome'],
        trace: 'on' // Always trace cross-system tests
      },
      testMatch: '**/cross-system/**/*.test.ts',
      timeout: 120000 // Extended timeout for complex integration tests
    },

    // Performance testing
    {
      name: 'performance',
      use: { 
        ...devices['Desktop Chrome'],
        // Throttle network for performance testing
        contextOptions: {
          // @ts-ignore
          launchOptions: {
            args: ['--enable-features=NetworkServiceLogging']
          }
        }
      },
      testMatch: '**/performance/**/*.test.ts'
    },

    // Accessibility testing
    {
      name: 'accessibility',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable accessibility tree
        contextOptions: {
          // @ts-ignore
          reducedMotion: 'reduce',
          forcedColors: 'none'
        }
      },
      testMatch: '**/accessibility/**/*.test.ts'
    }
  ],

  // Web server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start
    env: {
      NODE_ENV: 'test',
      // Ensure test-specific environment variables
      NEXT_PUBLIC_TEST_MODE: 'true'
    }
  },

  // Output directory
  outputDir: 'test-scripts/__tests__/artifacts',

  // Metadata
  metadata: {
    'test-suite': 'Integration Error Recovery Tests',
    'version': '1.0.0',
    'environment': process.env.NODE_ENV || 'test'
  }
});