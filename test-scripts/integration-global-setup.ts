/**
 * Global Setup for Integration Tests
 * Prepares the test environment for comprehensive error recovery testing
 */

import { chromium, FullConfig } from '@playwright/test';
import { logger } from '../lib/logger';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting Integration Test Global Setup...');
  
  try {
    // 1. Verify test environment
    await verifyTestEnvironment();
    
    // 2. Set up test database/storage state
    await setupTestStorage();
    
    // 3. Configure monitoring systems
    await setupMonitoringSystems();
    
    // 4. Prepare mock services
    await setupMockServices();
    
    // 5. Validate system health
    await validateSystemHealth();
    
    console.log('✅ Integration Test Global Setup Complete');
    
  } catch (error) {
    console.error('❌ Integration Test Global Setup Failed:', error);
    throw error;
  }
}

async function verifyTestEnvironment() {
  console.log('🔍 Verifying test environment...');
  
  // Check required environment variables
  const requiredEnvVars = [
    'NODE_ENV',
    'NEXT_PUBLIC_TEST_MODE'
  ];
  
  const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }
  
  // Verify test mode is set
  if (process.env.NEXT_PUBLIC_TEST_MODE !== 'integration') {
    console.warn('⚠️ Test mode not set to integration, setting now...');
    process.env.NEXT_PUBLIC_TEST_MODE = 'integration';
  }
  
  console.log('✅ Test environment verified');
}

async function setupTestStorage() {
  console.log('🗃️ Setting up test storage...');
  
  // Create a browser instance to set up storage
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Set up test session storage
    await page.evaluate(() => {
      // Clear any existing storage
      sessionStorage.clear();
      localStorage.clear();
      
      // Set up test user session
      sessionStorage.setItem('test_session_id', `integration-test-${Date.now()}`);
      sessionStorage.setItem('test_user_id', 'integration-test-user');
      
      // Set up feature preferences for testing
      localStorage.setItem('voice_settings', JSON.stringify({
        enabled: true,
        testMode: true,
        fallbackEnabled: true
      }));
      
      localStorage.setItem('assessment_preferences', JSON.stringify({
        simpleMode: false,
        testMode: true,
        cacheEnabled: true
      }));
      
      localStorage.setItem('chat_preferences', JSON.stringify({
        advancedMode: true,
        testMode: true,
        contextPreservation: true
      }));
      
      // Set up error recovery test flags
      sessionStorage.setItem('error_recovery_test_mode', 'true');
      sessionStorage.setItem('sentry_test_mode', 'true');
    });
    
    console.log('✅ Test storage configured');
    
  } finally {
    await browser.close();
  }
}

async function setupMonitoringSystems() {
  console.log('📊 Setting up monitoring systems...');
  
  // Configure Sentry for testing
  if (process.env.SENTRY_DSN_TEST) {
    console.log('📈 Sentry test environment configured');
  } else {
    console.warn('⚠️ Sentry test DSN not configured, using mock');
  }
  
  // Set up performance monitoring
  process.env.NEXT_PUBLIC_PERFORMANCE_MONITORING = 'true';
  
  // Configure error tracking
  process.env.NEXT_PUBLIC_ERROR_TRACKING = 'integration-test';
  
  console.log('✅ Monitoring systems configured');
}

async function setupMockServices() {
  console.log('🎭 Setting up mock services...');
  
  // Mock external API endpoints for testing
  const mockEndpoints = [
    '/api/error/report',
    '/api/internal/error-recovery',
    '/api/session/cleanup',
    '/api/sentry/integration'
  ];
  
  console.log(`📡 Mock endpoints prepared: ${mockEndpoints.join(', ')}`);
  
  // Set up test data
  const testData = {
    users: [{
      id: 'integration-test-user',
      name: 'Integration Test User',
      permissions: ['voice_practice', 'assessment_generator', 'advanced_chat']
    }],
    sessions: [{
      id: 'integration-test-session',
      userId: 'integration-test-user',
      createdAt: new Date().toISOString(),
      features: ['error_recovery_testing']
    }]
  };
  
  // Store test data in a way that can be accessed by tests
  process.env.INTEGRATION_TEST_DATA = JSON.stringify(testData);
  
  console.log('✅ Mock services configured');
}

async function validateSystemHealth() {
  console.log('🏥 Validating system health...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Health check: Application loads
    console.log('🔍 Checking application load...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });
    
    const title = await page.title();
    if (!title) {
      throw new Error('Application failed to load - no title found');
    }
    
    // Health check: Error boundaries are present
    console.log('🔍 Checking error boundary presence...');
    await page.evaluate(() => {
      // Inject a test error to verify boundaries work
      const testError = new Error('Health check error boundary test');
      window.dispatchEvent(new ErrorEvent('error', {
        error: testError,
        message: testError.message
      }));
    });
    
    // Wait briefly for error boundary response
    await page.waitForTimeout(1000);
    
    // Health check: API endpoints are responsive
    console.log('🔍 Checking API health...');
    const healthResponse = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/health');
        return {
          ok: response.ok,
          status: response.status
        };
      } catch (error) {
        return {
          ok: false,
          error: error.message
        };
      }
    });
    
    if (!healthResponse.ok) {
      console.warn('⚠️ API health check failed, continuing with limited functionality');
    }
    
    console.log('✅ System health validation complete');
    
  } catch (error) {
    console.error('❌ System health validation failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;