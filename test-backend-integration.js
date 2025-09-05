#!/usr/bin/env node

/**
 * Backend Integration Test Script
 * Tests the complete backend integration and data persistence
 */

const axios = require('axios');

const BACKEND_URL = 'http://localhost:8000';
const FRONTEND_URL = 'http://localhost:3002';

// Test colors
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
}

function error(message) {
  log(`❌ ${message}`, colors.red);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.blue);
}

function warn(message) {
  log(`⚠️  ${message}`, colors.yellow);
}

async function testBackendHealth() {
  try {
    const response = await axios.get(`${BACKEND_URL}/health`);
    if (response.status === 200 && response.data.status === 'healthy') {
      success(`Backend health check passed: ${response.data.status}`);
      info(`Database status: ${response.data.database}`);
      return true;
    } else {
      error(`Backend health check failed: ${response.data.status}`);
      return false;
    }
  } catch (err) {
    error(`Backend connection failed: ${err.message}`);
    error('Make sure the backend server is running on port 8000');
    return false;
  }
}

async function testUserRegistration() {
  try {
    const testUser = {
      email: `test_${Date.now()}@example.com`,
      password: 'testpassword123',
      name: 'Test User',
      role: 'student'
    };

    const response = await axios.post(`${BACKEND_URL}/api/auth/register`, testUser);
    
    if (response.status === 200 || response.status === 201) {
      success('User registration successful');
      info(`User ID: ${response.data.id}`);
      info(`Email: ${response.data.email}`);
      return { success: true, user: response.data, credentials: testUser };
    } else {
      error(`User registration failed with status: ${response.status}`);
      return { success: false };
    }
  } catch (err) {
    if (err.response?.status === 400 && err.response?.data?.detail?.includes('already registered')) {
      warn('User already exists, proceeding with existing user');
      return { success: true, existing: true };
    }
    error(`User registration failed: ${err.response?.data?.detail || err.message}`);
    return { success: false, error: err.response?.data };
  }
}

async function testUserLogin(credentials) {
  try {
    const loginData = {
      email: credentials.email,
      password: credentials.password
    };

    const response = await axios.post(`${BACKEND_URL}/api/auth/login`, loginData);
    
    if (response.status === 200) {
      success('User login successful');
      info(`Access token received: ${response.data.access_token.substring(0, 20)}...`);
      info(`Token type: ${response.data.token_type}`);
      info(`Expires in: ${response.data.expires_in} seconds`);
      return { success: true, tokens: response.data };
    } else {
      error(`User login failed with status: ${response.status}`);
      return { success: false };
    }
  } catch (err) {
    error(`User login failed: ${err.response?.data?.detail || err.message}`);
    return { success: false, error: err.response?.data };
  }
}

async function testProtectedEndpoint(accessToken) {
  try {
    const response = await axios.get(`${BACKEND_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    if (response.status === 200) {
      success('Protected endpoint access successful');
      info(`User: ${response.data.name} (${response.data.email})`);
      info(`Role: ${response.data.role}`);
      return { success: true, user: response.data };
    } else {
      error(`Protected endpoint failed with status: ${response.status}`);
      return { success: false };
    }
  } catch (err) {
    error(`Protected endpoint failed: ${err.response?.data?.detail || err.message}`);
    return { success: false, error: err.response?.data };
  }
}

async function testTokenRefresh(refreshToken) {
  try {
    const response = await axios.post(`${BACKEND_URL}/api/auth/refresh`, {
      refresh_token: refreshToken
    });
    
    if (response.status === 200) {
      success('Token refresh successful');
      info(`New access token: ${response.data.access_token.substring(0, 20)}...`);
      return { success: true, tokens: response.data };
    } else {
      error(`Token refresh failed with status: ${response.status}`);
      return { success: false };
    }
  } catch (err) {
    error(`Token refresh failed: ${err.response?.data?.detail || err.message}`);
    return { success: false, error: err.response?.data };
  }
}

async function testFrontendBackendIntegration() {
  try {
    // Test if frontend can reach backend through API client
    const frontendResponse = await axios.get(`${FRONTEND_URL}/api/health`);
    
    if (frontendResponse.status === 200) {
      success('Frontend health check passed');
      return true;
    } else {
      warn('Frontend health check failed, but backend integration can still work');
      return false;
    }
  } catch (err) {
    warn('Frontend server not running, testing backend only');
    return false;
  }
}

async function testDatabaseOperations() {
  try {
    info('Testing database operations...');
    
    // Test creating multiple users to verify database persistence
    const users = [];
    for (let i = 0; i < 3; i++) {
      const testUser = {
        email: `testuser_${Date.now()}_${i}@example.com`,
        password: 'testpassword123',
        name: `Test User ${i + 1}`,
        role: 'student'
      };
      
      try {
        const response = await axios.post(`${BACKEND_URL}/api/auth/register`, testUser);
        users.push(response.data);
      } catch (err) {
        if (!err.response?.data?.detail?.includes('already registered')) {
          throw err;
        }
      }
    }
    
    success(`Database operations successful. Created/verified ${users.length} users.`);
    return { success: true, users };
  } catch (err) {
    error(`Database operations failed: ${err.response?.data?.detail || err.message}`);
    return { success: false, error: err.response?.data };
  }
}

async function runIntegrationTests() {
  log(`${colors.bold}🚀 Starting Backend Integration Tests${colors.reset}\n`);
  
  const results = {
    backendHealth: false,
    userRegistration: false,
    userLogin: false,
    protectedEndpoint: false,
    tokenRefresh: false,
    frontendIntegration: false,
    databaseOperations: false
  };
  
  let testCredentials = null;
  let authTokens = null;

  // Test 1: Backend Health
  log(`${colors.bold}Test 1: Backend Health Check${colors.reset}`);
  results.backendHealth = await testBackendHealth();
  
  if (!results.backendHealth) {
    error('Backend is not healthy. Stopping tests.');
    return results;
  }
  
  console.log();

  // Test 2: User Registration
  log(`${colors.bold}Test 2: User Registration${colors.reset}`);
  const registrationResult = await testUserRegistration();
  results.userRegistration = registrationResult.success;
  
  if (registrationResult.success && !registrationResult.existing) {
    testCredentials = registrationResult.credentials;
  } else if (registrationResult.existing) {
    // Use fallback credentials for existing user
    testCredentials = {
      email: 'test@example.com',
      password: 'testpassword123'
    };
  }
  
  console.log();

  // Test 3: User Login
  if (testCredentials) {
    log(`${colors.bold}Test 3: User Login${colors.reset}`);
    const loginResult = await testUserLogin(testCredentials);
    results.userLogin = loginResult.success;
    
    if (loginResult.success) {
      authTokens = loginResult.tokens;
    }
    
    console.log();
  }

  // Test 4: Protected Endpoint
  if (authTokens) {
    log(`${colors.bold}Test 4: Protected Endpoint Access${colors.reset}`);
    results.protectedEndpoint = (await testProtectedEndpoint(authTokens.access_token)).success;
    console.log();
  }

  // Test 5: Token Refresh
  if (authTokens) {
    log(`${colors.bold}Test 5: Token Refresh${colors.reset}`);
    results.tokenRefresh = (await testTokenRefresh(authTokens.refresh_token)).success;
    console.log();
  }

  // Test 6: Frontend Integration
  log(`${colors.bold}Test 6: Frontend-Backend Integration${colors.reset}`);
  results.frontendIntegration = await testFrontendBackendIntegration();
  console.log();

  // Test 7: Database Operations
  log(`${colors.bold}Test 7: Database Operations${colors.reset}`);
  results.databaseOperations = (await testDatabaseOperations()).success;
  console.log();

  // Summary
  log(`${colors.bold}📊 Test Results Summary${colors.reset}`);
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    if (passed) {
      success(`${test}: PASSED`);
    } else {
      error(`${test}: FAILED`);
    }
  });
  
  console.log();
  
  if (passedTests === totalTests) {
    success(`🎉 All tests passed! (${passedTests}/${totalTests})`);
    success('Backend integration is working correctly!');
  } else if (passedTests >= totalTests * 0.7) {
    warn(`⚠️  Most tests passed (${passedTests}/${totalTests})`);
    warn('Backend integration is mostly working with some issues.');
  } else {
    error(`💥 Many tests failed (${passedTests}/${totalTests})`);
    error('Backend integration needs attention.');
  }
  
  console.log();
  info('Next steps:');
  info('1. If backend tests pass: Start frontend with `npm run dev`');
  info('2. If backend tests fail: Check backend logs and database connection');
  info('3. Test frontend integration by visiting http://localhost:3002');
  
  return results;
}

// Run tests
if (require.main === module) {
  runIntegrationTests().catch(err => {
    error(`Test runner failed: ${err.message}`);
    process.exit(1);
  });
}

module.exports = { runIntegrationTests };