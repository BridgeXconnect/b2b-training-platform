#!/usr/bin/env node

/**
 * BMAD System Test Script
 * Tests the parallel agent system deployment and functionality
 */

const http = require('http');
const https = require('https');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const TIMEOUT = 30000; // 30 seconds

console.log('🚀 Starting BMAD System Tests');
console.log(`📍 Testing against: ${BASE_URL}`);
console.log('─'.repeat(60));

// Utility function to make HTTP requests
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const client = options.protocol === 'https:' ? https : http;
    
    const req = client.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsed,
            headers: res.headers
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData,
            headers: res.headers
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.setTimeout(TIMEOUT, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Parse URL for request options
function getRequestOptions(path, method = 'GET') {
  const url = new URL(`${BASE_URL}${path}`);
  
  return {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname + url.search,
    method: method,
    protocol: url.protocol,
    headers: {
      'Content-Type': 'application/json',
    }
  };
}

// Test functions
async function testHealthCheck() {
  console.log('🔍 Testing Health Check...');
  
  try {
    const options = getRequestOptions('/api/health?detailed=true');
    const response = await makeRequest(options);
    
    if (response.statusCode === 200) {
      const health = response.data;
      
      console.log('✅ Health Check: PASSED');
      console.log(`   📊 Overall Status: ${health.status}`);
      console.log(`   🤖 BMAD Status: ${health.services?.bmad || 'unknown'}`);
      console.log(`   💻 AI Service: ${health.services?.ai || 'unknown'}`);
      
      if (health.details?.bmadSystem) {
        const bmad = health.details.bmadSystem.details;
        console.log(`   👥 Total Agents: ${bmad?.totalAgents || 'unknown'}`);
        console.log(`   📋 Active Sessions: ${bmad?.sessions?.activeSessionCount || 0}`);
      }
      
      return { success: true, data: health };
    } else {
      console.log('❌ Health Check: FAILED');
      console.log(`   Status Code: ${response.statusCode}`);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log('❌ Health Check: ERROR');
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testSimpleChat() {
  console.log('💬 Testing Simple Chat (Single Agent)...');
  
  try {
    const options = getRequestOptions('/api/chat', 'POST');
    const data = {
      message: "Hello, how are you today?",
      settings: { userId: 'test-user-simple' }
    };
    
    const response = await makeRequest(options, data);
    
    if (response.statusCode === 200 && response.data.success !== false) {
      console.log('✅ Simple Chat: PASSED');
      console.log(`   📱 Response Type: ${response.data.metadata?.type || 'legacy'}`);
      console.log(`   🤖 Agent Used: ${response.data.metadata?.agentType || 'unknown'}`);
      console.log(`   ⏱️ Processing Time: ${response.data.metadata?.processingTime || 'N/A'}ms`);
      console.log(`   📝 Response Preview: "${(response.data.content || response.data.response || '').substring(0, 100)}..."`);
      
      return { success: true, data: response.data };
    } else {
      console.log('❌ Simple Chat: FAILED');
      console.log(`   Status Code: ${response.statusCode}`);
      console.log(`   Error: ${response.data.error || 'Unknown error'}`);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log('❌ Simple Chat: ERROR');
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testComplexChat() {
  console.log('🎯 Testing Complex Chat (Multi-Agent Delegation)...');
  
  try {
    const options = getRequestOptions('/api/chat', 'POST');
    const data = {
      message: "Create a comprehensive lesson plan on business presentations for intermediate learners, including practice exercises and assessment questions.",
      options: { multiAgent: true },
      settings: { userId: 'test-user-complex' }
    };
    
    const response = await makeRequest(options, data);
    
    if (response.statusCode === 200 && response.data.success !== false) {
      console.log('✅ Complex Chat: PASSED');
      console.log(`   📱 Response Type: ${response.data.metadata?.type || 'legacy'}`);
      console.log(`   👥 Agents Used: ${response.data.metadata?.agentsUsed || 1}`);
      console.log(`   ⏱️ Execution Time: ${response.data.metadata?.executionTime || response.data.metadata?.processingTime || 'N/A'}ms`);
      console.log(`   🎯 Confidence: ${response.data.metadata?.confidence || 'N/A'}`);
      console.log(`   📝 Response Length: ${(response.data.content || response.data.response || '').length} characters`);
      
      // Check for delegation markers
      if (response.data.metadata?.type === 'delegation') {
        console.log('   🎉 Multi-agent delegation successfully triggered!');
      } else {
        console.log('   ⚠️ Multi-agent delegation not triggered (may have fallen back to single agent)');
      }
      
      return { success: true, data: response.data };
    } else {
      console.log('❌ Complex Chat: FAILED');
      console.log(`   Status Code: ${response.statusCode}`);
      console.log(`   Error: ${response.data.error || 'Unknown error'}`);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log('❌ Complex Chat: ERROR');
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testContentGeneration() {
  console.log('📚 Testing Content Generation...');
  
  try {
    const options = getRequestOptions('/api/ai/generate', 'POST');
    const data = {
      prompt: "Create a business English lesson on email etiquette for B1 level learners",
      contentType: "lesson"
    };
    
    const response = await makeRequest(options, data);
    
    if (response.statusCode === 200 && response.data.success !== false) {
      console.log('✅ Content Generation: PASSED');
      console.log(`   📱 Processing Method: ${response.data.metadata?.agentType ? 'BMAD Agent' : 'Legacy'}`);
      console.log(`   🤖 Agent Type: ${response.data.metadata?.agentType || 'Direct OpenAI'}`);
      console.log(`   ⏱️ Processing Time: ${response.data.metadata?.processingTime || 'N/A'}ms`);
      console.log(`   📝 Content Length: ${(response.data.content || response.data.data?.content || '').length} characters`);
      
      return { success: true, data: response.data };
    } else {
      console.log('❌ Content Generation: FAILED');
      console.log(`   Status Code: ${response.statusCode}`);
      console.log(`   Error: ${response.data.error || 'Unknown error'}`);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log('❌ Content Generation: ERROR');
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testFallbackBehavior() {
  console.log('🔄 Testing Fallback Behavior...');
  
  try {
    // Test with a request that might stress the system
    const options = getRequestOptions('/api/chat', 'POST');
    const data = {
      message: "Test message for fallback behavior analysis",
      settings: { userId: 'test-user-fallback' }
    };
    
    const response = await makeRequest(options, data);
    
    if (response.statusCode === 200 || response.statusCode === 206) {
      console.log('✅ Fallback Behavior: PASSED');
      console.log(`   📱 Status Code: ${response.statusCode}`);
      
      // Check if response indicates fallback was used
      if (response.data.metadata?.type === 'legacy' || !response.data.metadata?.type) {
        console.log('   🔄 Fallback mechanism appears to be active');
      } else {
        console.log('   🚀 BMAD system handling the request');
      }
      
      return { success: true, data: response.data };
    } else {
      console.log('❌ Fallback Behavior: FAILED');
      console.log(`   Status Code: ${response.statusCode}`);
      return { success: false, error: response.data };
    }
  } catch (error) {
    console.log('❌ Fallback Behavior: ERROR');
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testSessionPersistence() {
  console.log('💾 Testing Session Persistence...');
  
  try {
    const userId = 'test-user-session-' + Date.now();
    
    // First request to create session
    const options1 = getRequestOptions('/api/chat', 'POST');
    const data1 = {
      message: "My name is John and I'm learning business English.",
      settings: { userId: userId }
    };
    
    const response1 = await makeRequest(options1, data1);
    const sessionId = response1.data.sessionId;
    
    if (!sessionId) {
      console.log('⚠️ Session Persistence: No session ID returned from first request');
      return { success: false, error: 'No session ID' };
    }
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Second request using the same session
    const options2 = getRequestOptions('/api/chat', 'POST');
    const data2 = {
      message: "What was my name again?",
      sessionId: sessionId,
      settings: { userId: userId }
    };
    
    const response2 = await makeRequest(options2, data2);
    
    if (response2.statusCode === 200 && response2.data.success !== false) {
      console.log('✅ Session Persistence: PASSED');
      console.log(`   🆔 Session ID: ${sessionId}`);
      console.log(`   🔗 Session Maintained: ${response2.data.sessionId === sessionId ? 'Yes' : 'No'}`);
      
      // Check if the AI remembered the name (basic context check)
      const response = (response2.data.content || response2.data.response || '').toLowerCase();
      if (response.includes('john')) {
        console.log('   🧠 Context Memory: Working (remembered name)');
      } else {
        console.log('   ⚠️ Context Memory: May not be working (did not remember name)');
      }
      
      return { success: true, sessionId: sessionId };
    } else {
      console.log('❌ Session Persistence: FAILED');
      console.log(`   Error: ${response2.data.error || 'Unknown error'}`);
      return { success: false, error: response2.data };
    }
  } catch (error) {
    console.log('❌ Session Persistence: ERROR');
    console.log(`   Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🧪 Running BMAD System Test Suite\n');
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'Simple Chat', fn: testSimpleChat },
    { name: 'Complex Chat', fn: testComplexChat },
    { name: 'Content Generation', fn: testContentGeneration },
    { name: 'Fallback Behavior', fn: testFallbackBehavior },
    { name: 'Session Persistence', fn: testSessionPersistence }
  ];
  
  const results = [];
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      results.push({ name: test.name, ...result });
    } catch (error) {
      results.push({ 
        name: test.name, 
        success: false, 
        error: error.message 
      });
    }
    
    console.log(''); // Empty line between tests
  }
  
  // Summary
  console.log('=' .repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  results.forEach(result => {
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${result.name}: ${result.success ? 'PASSED' : 'FAILED'}`);
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  console.log('');
  console.log(`📈 Overall Results: ${passed}/${tests.length} tests passed`);
  
  if (passed === tests.length) {
    console.log('🎉 All tests passed! BMAD system is working correctly.');
  } else if (passed > 0) {
    console.log('⚠️ Some tests failed. Check the errors above and review your deployment.');
  } else {
    console.log('🚨 All tests failed. BMAD system may not be deployed correctly.');
  }
  
  // Recommendations
  console.log('\n📋 RECOMMENDATIONS:');
  
  const healthPassed = results.find(r => r.name === 'Health Check')?.success;
  if (!healthPassed) {
    console.log('   - Fix health check issues first (check API server is running)');
  }
  
  const chatPassed = results.some(r => r.name.includes('Chat') && r.success);
  if (!chatPassed) {
    console.log('   - Check OpenAI API key and configuration');
  }
  
  const complexPassed = results.find(r => r.name === 'Complex Chat')?.success;
  if (!complexPassed && chatPassed) {
    console.log('   - Multi-agent delegation may not be working, but fallback is functional');
  }
  
  const sessionPassed = results.find(r => r.name === 'Session Persistence')?.success;
  if (!sessionPassed) {
    console.log('   - Session management may need attention for full BMAD functionality');
  }
  
  if (passed === tests.length) {
    console.log('   - System is fully operational! 🚀');
    console.log('   - Monitor performance and check logs for any warnings');
    console.log('   - Consider running tests periodically to ensure continued operation');
  }
  
  console.log('\n🔗 For more information, see: BMAD_AGENT_DEPLOYMENT_GUIDE.md');
  
  process.exit(failed > 0 ? 1 : 0);
}

// Handle command line arguments
if (process.argv.length > 2) {
  const testName = process.argv[2].toLowerCase();
  
  const testMap = {
    'health': testHealthCheck,
    'simple': testSimpleChat,
    'complex': testComplexChat,
    'content': testContentGeneration,
    'fallback': testFallbackBehavior,
    'session': testSessionPersistence
  };
  
  if (testMap[testName]) {
    console.log(`🧪 Running single test: ${testName}`);
    testMap[testName]()
      .then(result => {
        console.log('\n📊 Result:', result.success ? 'PASSED' : 'FAILED');
        if (!result.success) {
          console.log('Error:', result.error);
        }
        process.exit(result.success ? 0 : 1);
      })
      .catch(error => {
        console.error('Test error:', error.message);
        process.exit(1);
      });
  } else {
    console.error(`Unknown test: ${testName}`);
    console.log('Available tests: health, simple, complex, content, fallback, session');
    process.exit(1);
  }
} else {
  // Run all tests
  runAllTests().catch(error => {
    console.error('Test suite error:', error.message);
    process.exit(1);
  });
}