/**
 * Global Test Setup for Integration Testing
 * Initializes test environment, services, and monitoring
 */

import { chromium, FullConfig } from '@playwright/test';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import IntegrationHealthMonitor from '../integration-health-monitor';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');
  
  const startTime = Date.now();
  const setupResults = {
    timestamp: new Date().toISOString(),
    browser: null as any,
    healthMonitor: null as any,
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      baseUrl: config.projects[0]?.use?.baseURL || 'http://localhost:3000'
    },
    services: {
      frontend: false,
      backend: false,
      monitoring: false
    },
    errors: [] as string[]
  };

  try {
    // Ensure directories exist
    ensureDirectories();

    // Initialize health monitor
    console.log('🔍 Initializing health monitor...');
    const healthMonitor = new IntegrationHealthMonitor();
    await healthMonitor.startMonitoring();
    setupResults.healthMonitor = 'initialized';
    setupResults.services.monitoring = true;

    // Wait for initial health check
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Launch browser for setup tasks
    console.log('🌐 Launching browser for setup...');
    const browser = await chromium.launch({
      headless: true,
      args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });

    const context = await browser.newContext({
      ignoreHTTPSErrors: true,
      permissions: ['microphone', 'camera']
    });

    const page = await context.newPage();

    // Validate frontend availability
    try {
      console.log('🔍 Validating frontend service...');
      await page.goto(setupResults.environment.baseUrl, { timeout: 30000 });
      await page.waitForSelector('body', { timeout: 10000 });
      setupResults.services.frontend = true;
      console.log('✅ Frontend service is available');
    } catch (error) {
      const errorMsg = `Frontend validation failed: ${error}`;
      setupResults.errors.push(errorMsg);
      console.error('❌', errorMsg);
    }

    // Validate API endpoints
    try {
      console.log('🔍 Validating backend API...');
      const response = await page.request.get('/api/health').catch(() => null);
      if (response?.ok()) {
        setupResults.services.backend = true;
        console.log('✅ Backend API is available');
      } else {
        setupResults.errors.push('Backend API health check failed');
        console.log('⚠️  Backend API health check failed, but continuing...');
      }
    } catch (error) {
      const errorMsg = `Backend validation failed: ${error}`;
      setupResults.errors.push(errorMsg);
      console.error('❌', errorMsg);
    }

    // Set up test data and state
    console.log('📝 Setting up test data...');
    await setupTestData(page);

    // Initialize error tracking
    console.log('🔧 Initializing error tracking...');
    await initializeErrorTracking(page);

    // Warm up critical paths
    console.log('🔥 Warming up critical application paths...');
    await warmupCriticalPaths(page);

    await browser.close();
    setupResults.browser = 'setup_completed';

    // Generate setup report
    const setupDuration = Date.now() - startTime;
    setupResults['setupDuration'] = setupDuration;

    saveSetupReport(setupResults);

    console.log(`✅ Global setup completed in ${setupDuration}ms`);
    
    if (setupResults.errors.length > 0) {
      console.log(`⚠️  Setup completed with ${setupResults.errors.length} warnings`);
    }

  } catch (error) {
    const errorMsg = `Global setup failed: ${error}`;
    setupResults.errors.push(errorMsg);
    console.error('❌', errorMsg);
    
    saveSetupReport(setupResults);
    throw error;
  }
}

// Ensure required directories exist
function ensureDirectories() {
  const dirs = [
    'test-scripts/__tests__/reports',
    'test-scripts/__tests__/artifacts',
    'test-scripts/__tests__/screenshots',
    'test-scripts/__tests__/videos',
    'test-scripts/__tests__/traces',
    'test-scripts/__tests__/coverage',
    'test-scripts/__tests__/logs'
  ];

  dirs.forEach(dir => {
    const fullPath = join(process.cwd(), dir);
    if (!existsSync(fullPath)) {
      mkdirSync(fullPath, { recursive: true });
    }
  });
}

// Set up test data and initial state
async function setupTestData(page: any) {
  // Set up mock data in localStorage
  await page.evaluate(() => {
    // User progress data
    localStorage.setItem('test_user_progress', JSON.stringify({
      currentModule: 'integration_test',
      completedLessons: ['setup', 'initialization'],
      score: 100,
      timestamp: new Date().toISOString()
    }));

    // Voice practice settings
    localStorage.setItem('voice_practice_settings', JSON.stringify({
      enabled: true,
      language: 'en-US',
      difficulty: 'intermediate',
      fallbackMode: false
    }));

    // Chat settings
    localStorage.setItem('chat_settings', JSON.stringify({
      enabled: true,
      context: 'integration_test',
      history: []
    }));

    // Assessment settings
    localStorage.setItem('assessment_settings', JSON.stringify({
      enabled: true,
      type: 'adaptive',
      difficulty: 'medium'
    }));

    // Error boundary test flags
    sessionStorage.setItem('error_boundary_test_mode', 'true');
    sessionStorage.setItem('integration_test_active', 'true');
  });

  console.log('✅ Test data initialized');
}

// Initialize error tracking for tests
async function initializeErrorTracking(page: any) {
  await page.addInitScript(() => {
    // Global error tracking
    window.__TEST_ERRORS__ = [];
    window.__TEST_PERFORMANCE__ = [];
    window.__TEST_INTEGRATION__ = {
      startTime: Date.now(),
      errors: [],
      recoveries: [],
      apiCalls: [],
      sentryEvents: []
    };

    // Console error capture
    const originalError = console.error;
    console.error = (...args) => {
      window.__TEST_ERRORS__.push({
        type: 'console_error',
        message: args.join(' '),
        timestamp: new Date().toISOString(),
        stack: new Error().stack
      });
      originalError.apply(console, args);
    };

    // Unhandled error capture
    window.addEventListener('error', (event) => {
      window.__TEST_ERRORS__.push({
        type: 'javascript_error',
        message: event.error?.message || event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        timestamp: new Date().toISOString(),
        stack: event.error?.stack
      });
    });

    // Unhandled promise rejection capture
    window.addEventListener('unhandledrejection', (event) => {
      window.__TEST_ERRORS__.push({
        type: 'promise_rejection',
        message: event.reason?.message || String(event.reason),
        timestamp: new Date().toISOString(),
        stack: event.reason?.stack
      });
    });

    // Performance tracking
    if ('performance' in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          window.__TEST_PERFORMANCE__.push({
            name: entry.name,
            type: entry.entryType,
            startTime: entry.startTime,
            duration: entry.duration,
            timestamp: new Date().toISOString()
          });
        }
      });
      
      observer.observe({ entryTypes: ['navigation', 'resource', 'measure', 'mark'] });
    }

    // Mock Sentry for error tracking
    window.__SENTRY__ = {
      captureException: (error, context) => {
        window.__TEST_INTEGRATION__.sentryEvents.push({
          type: 'exception',
          error: {
            message: error.message,
            stack: error.stack
          },
          context,
          timestamp: new Date().toISOString()
        });
      },
      captureMessage: (message, level) => {
        window.__TEST_INTEGRATION__.sentryEvents.push({
          type: 'message',
          message,
          level,
          timestamp: new Date().toISOString()
        });
      }
    };

    console.log('✅ Error tracking initialized');
  });
}

// Warm up critical application paths
async function warmupCriticalPaths(page: any) {
  const criticalPaths = [
    '/learning',
    '/api/health'
  ];

  for (const path of criticalPaths) {
    try {
      await page.goto(page.url().replace(/\/[^\/]*$/, path), { 
        timeout: 10000,
        waitUntil: 'domcontentloaded'
      });
      await page.waitForTimeout(1000); // Allow for initialization
      console.log(`✅ Warmed up: ${path}`);
    } catch (error) {
      console.log(`⚠️  Failed to warm up ${path}: ${error}`);
    }
  }
}

// Save setup report
function saveSetupReport(results: any) {
  const reportPath = join(process.cwd(), 'test-scripts/__tests__/reports', 'setup-report.json');
  writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📄 Setup report saved: ${reportPath}`);
}

export default globalSetup;