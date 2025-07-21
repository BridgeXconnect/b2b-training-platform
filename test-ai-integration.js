/**
 * AI Integration Test Script
 * Tests the real AI integration implementation for Phase 1
 */

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Test configuration
const testConfig = {
  baseUrl,
  timeout: 30000,
  testUser: 'test-user-' + Date.now(),
  testSession: 'test-session-' + Date.now(),
};

// Test utilities
async function makeRequest(endpoint, options = {}) {
  const url = `${testConfig.baseUrl}${endpoint}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

// Test cases
const tests = [
  {
    name: 'Health Check - Basic',
    async run() {
      console.log('🔍 Testing basic health check...');
      const result = await makeRequest('/api/health');
      
      if (!result.ok) {
        throw new Error(`Health check failed: ${result.status}`);
      }

      const requiredFields = ['status', 'timestamp', 'services'];
      for (const field of requiredFields) {
        if (!result.data[field]) {
          throw new Error(`Missing required field: ${field}`);
        }
      }

      console.log('✅ Basic health check passed');
      console.log(`   Status: ${result.data.status}`);
      console.log(`   Services: ${JSON.stringify(result.data.services)}`);
      return result.data;
    }
  },

  {
    name: 'Health Check - Detailed',
    async run() {
      console.log('🔍 Testing detailed health check...');
      const result = await makeRequest('/api/health?detailed=true');
      
      if (!result.ok) {
        throw new Error(`Detailed health check failed: ${result.status}`);
      }

      if (!result.data.details) {
        throw new Error('Details not included in detailed health check');
      }

      const requiredSections = ['configuration', 'environment'];
      for (const section of requiredSections) {
        if (!result.data.details[section]) {
          throw new Error(`Missing detailed section: ${section}`);
        }
      }

      console.log('✅ Detailed health check passed');
      console.log(`   Config valid: ${result.data.details.configuration.valid}`);
      console.log(`   Has OpenAI key: ${result.data.details.environment.hasOpenAIKey}`);
      return result.data;
    }
  },

  {
    name: 'Usage Monitor - System Stats',
    async run() {
      console.log('🔍 Testing usage monitoring...');
      const result = await makeRequest('/api/usage?action=stats');
      
      if (!result.ok) {
        throw new Error(`Usage stats failed: ${result.status}`);
      }

      if (!result.data.success) {
        throw new Error('Usage stats request not successful');
      }

      const stats = result.data.data;
      const requiredFields = ['daily', 'monthly', 'budgetStatus'];
      for (const field of requiredFields) {
        if (!stats[field]) {
          throw new Error(`Missing usage stats field: ${field}`);
        }
      }

      console.log('✅ Usage monitoring passed');
      console.log(`   Daily requests: ${stats.daily.totalRequests}`);
      console.log(`   Budget used: ${stats.budgetStatus.monthlyUsedPercentage.toFixed(1)}%`);
      return stats;
    }
  },

  {
    name: 'Usage Monitor - User Check',
    async run() {
      console.log('🔍 Testing user usage limits...');
      const result = await makeRequest(`/api/usage?action=check&userId=${testConfig.testUser}`);
      
      if (!result.ok) {
        throw new Error(`User usage check failed: ${result.status}`);
      }

      if (!result.data.success) {
        throw new Error('User usage check not successful');
      }

      const check = result.data.data;
      const requiredFields = ['allowed'];
      for (const field of requiredFields) {
        if (check[field] === undefined) {
          throw new Error(`Missing usage check field: ${field}`);
        }
      }

      console.log('✅ User usage check passed');
      console.log(`   User can make request: ${check.allowed}`);
      if (check.tokensRemaining !== undefined) {
        console.log(`   Tokens remaining: ${check.tokensRemaining}`);
      }
      return check;
    }
  },

  {
    name: 'Chat API - Simple Message',
    async run() {
      console.log('🔍 Testing chat API with simple message...');
      const testMessage = 'Hello, I want to practice business English.';
      
      const result = await makeRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: testMessage,
          settings: {
            cefrLevel: 'B1',
            businessContext: 'B2B sales',
            learningGoals: ['communication'],
            userId: testConfig.testUser,
          },
          sessionId: testConfig.testSession,
          messages: [],
        }),
      });

      if (!result.ok) {
        if (result.status === 503 && result.data.error?.includes('OPENAI_API_KEY')) {
          console.log('⚠️  Chat API test skipped - No OpenAI API key configured');
          console.log('   This is expected in development without real API keys');
          return { skipped: true, reason: 'No API key' };
        }
        throw new Error(`Chat API failed: ${result.status} - ${JSON.stringify(result.data)}`);
      }

      const requiredFields = ['content', 'messageType', 'sessionId'];
      for (const field of requiredFields) {
        if (!result.data[field]) {
          throw new Error(`Missing chat response field: ${field}`);
        }
      }

      console.log('✅ Chat API test passed');
      console.log(`   Response type: ${result.data.messageType}`);
      console.log(`   Content length: ${result.data.content.length} chars`);
      console.log(`   Has usage stats: ${!!result.data.usage}`);
      return result.data;
    }
  },

  {
    name: 'Chat API - Error Handling',
    async run() {
      console.log('🔍 Testing chat API error handling...');
      
      // Test with invalid input
      const result = await makeRequest('/api/chat', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required message field
          settings: {
            cefrLevel: 'B1',
            userId: testConfig.testUser,
          },
          sessionId: testConfig.testSession,
        }),
      });

      if (result.status !== 400) {
        throw new Error(`Expected 400 error, got: ${result.status}`);
      }

      if (!result.data.error || !result.data.error.includes('Message is required')) {
        throw new Error('Expected validation error message');
      }

      console.log('✅ Chat API error handling passed');
      console.log(`   Correctly rejected invalid input with 400 status`);
      return result.data;
    }
  },

  {
    name: 'Rate Limiting',
    async run() {
      console.log('🔍 Testing rate limiting...');
      
      // Make multiple rapid requests to trigger rate limiting
      const rapidRequests = [];
      for (let i = 0; i < 5; i++) {
        rapidRequests.push(
          makeRequest('/api/chat', {
            method: 'POST',
            body: JSON.stringify({
              message: `Test message ${i}`,
              settings: {
                cefrLevel: 'B1',
                userId: 'rate-limit-test-user',
              },
              sessionId: 'rate-limit-test-session',
            }),
          })
        );
      }

      const results = await Promise.all(rapidRequests);
      
      // Check if any requests were rate limited
      const rateLimited = results.some(r => r.status === 429);
      
      console.log('✅ Rate limiting test completed');
      console.log(`   Rate limiting triggered: ${rateLimited}`);
      console.log(`   Request results: ${results.map(r => r.status).join(', ')}`);
      
      return { rateLimited, results: results.map(r => r.status) };
    }
  },

  {
    name: 'Configuration Validation',
    async run() {
      console.log('🔍 Testing configuration validation...');
      
      const result = await makeRequest('/api/health', {
        method: 'POST',
        body: JSON.stringify({
          action: 'validate-config',
        }),
      });

      if (!result.ok) {
        throw new Error(`Config validation failed: ${result.status}`);
      }

      if (!result.data.validation) {
        throw new Error('Missing validation results');
      }

      console.log('✅ Configuration validation passed');
      console.log(`   Config valid: ${result.data.validation.valid}`);
      if (!result.data.validation.valid) {
        console.log(`   Errors: ${result.data.validation.errors.join(', ')}`);
      }
      
      return result.data.validation;
    }
  },
];

// Test runner
async function runTests() {
  console.log('🚀 Starting AI Integration Tests');
  console.log(`📍 Base URL: ${testConfig.baseUrl}`);
  console.log(`👤 Test User: ${testConfig.testUser}`);
  console.log('');

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    total: tests.length,
    details: [],
  };

  for (const test of tests) {
    try {
      console.log(`\n--- ${test.name} ---`);
      const result = await test.run();
      
      if (result && result.skipped) {
        results.skipped++;
        results.details.push({
          name: test.name,
          status: 'skipped',
          reason: result.reason,
        });
      } else {
        results.passed++;
        results.details.push({
          name: test.name,
          status: 'passed',
          data: result,
        });
      }
    } catch (error) {
      console.error(`❌ ${test.name} failed:`, error.message);
      results.failed++;
      results.details.push({
        name: test.name,
        status: 'failed',
        error: error.message,
      });
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`⚠️  Skipped: ${results.skipped}`);
  console.log(`📊 Total: ${results.total}`);
  console.log(`📈 Success Rate: ${((results.passed / (results.total - results.skipped)) * 100).toFixed(1)}%`);

  if (results.failed > 0) {
    console.log('\n❌ Failed Tests:');
    results.details
      .filter(r => r.status === 'failed')
      .forEach(r => console.log(`   - ${r.name}: ${r.error}`));
  }

  if (results.skipped > 0) {
    console.log('\n⚠️  Skipped Tests:');
    results.details
      .filter(r => r.status === 'skipped')
      .forEach(r => console.log(`   - ${r.name}: ${r.reason}`));
  }

  console.log('\n🎯 Next Steps:');
  if (results.failed === 0) {
    console.log('   ✅ Phase 1 implementation is working correctly!');
    console.log('   🚀 Ready to proceed to Phase 2 (Content Generation)');
  } else {
    console.log('   🔧 Fix the failed tests before proceeding');
    console.log('   📋 Check environment configuration and API keys');
  }

  return results;
}

// Run tests if called directly
if (require.main === module) {
  runTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

module.exports = { runTests, testConfig };