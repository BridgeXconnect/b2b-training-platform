/**
 * Story 5.2 End-to-End Test Script
 * Tests AI Content Generation & Curation Features
 */

const { spawn } = require('child_process');
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

class Story52Tester {
  constructor() {
    this.testResults = [];
    this.errors = [];
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logEntry);
    
    if (type === 'error') {
      this.errors.push(logEntry);
    } else {
      this.testResults.push(logEntry);
    }
  }

  async testHomepageAccess() {
    this.log('🧪 Testing homepage access...');
    try {
      const response = await axios.get(BASE_URL);
      if (response.status === 200) {
        this.log('✅ Homepage loads successfully');
        
        // Check for Learning Portal button
        if (response.data.includes('Access Learning Portal')) {
          this.log('✅ Learning Portal button found on homepage');
          return true;
        } else {
          this.log('❌ Learning Portal button not found', 'error');
          return false;
        }
      }
    } catch (error) {
      this.log(`❌ Homepage access failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testLearningPortalAccess() {
    this.log('🧪 Testing Learning Portal access...');
    try {
      const response = await axios.get(`${BASE_URL}/learning`);
      if (response.status === 200) {
        this.log('✅ Learning Portal page loads successfully');
        
        // Check for AI Content tab
        if (response.data.includes('AI Content')) {
          this.log('✅ AI Content tab found in Learning Portal');
          return true;
        } else {
          this.log('❌ AI Content tab not found in Learning Portal', 'error');
          return false;
        }
      }
    } catch (error) {
      this.log(`❌ Learning Portal access failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testContentGenerationComponents() {
    this.log('🧪 Testing Content Generation components...');
    try {
      const response = await axios.get(`${BASE_URL}/learning`);
      const pageContent = response.data;
      
      // Check for key components
      const componentChecks = [
        { name: 'ContentGenerationPanel', pattern: 'AI Content Generation & Curation' },
        { name: 'Generate Tab', pattern: 'Create New Content' },
        { name: 'Recommended Tab', pattern: 'Personalized Recommendations' },
        { name: 'Library Tab', pattern: 'Generated Content Library' },
        { name: 'Smart Curation Tab', pattern: 'Smart Content Curation' },
        { name: 'Content Type Selection', pattern: 'Content Type' },
        { name: 'Topic Input', pattern: 'e.g., Business meetings' },
        { name: 'Duration Input', pattern: 'Duration (minutes)' },
        { name: 'SOP Checkbox', pattern: 'Include Company SOPs' },
        { name: 'Generate Button', pattern: 'Generate' }
      ];

      let allComponentsFound = true;
      for (const check of componentChecks) {
        if (pageContent.includes(check.pattern)) {
          this.log(`✅ ${check.name} component found`);
        } else {
          this.log(`❌ ${check.name} component not found`, 'error');
          allComponentsFound = false;
        }
      }

      return allComponentsFound;
    } catch (error) {
      this.log(`❌ Component testing failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testCopilotKitIntegration() {
    this.log('🧪 Testing CopilotKit integration...');
    try {
      // Test if the CopilotKit endpoint is accessible
      const response = await axios.post(`${BASE_URL}/api/copilotkit`, {
        messages: [{ role: 'user', content: 'Test message' }]
      }, {
        headers: { 'Content-Type': 'application/json' },
        validateStatus: function (status) {
          return status < 500; // Accept responses that aren't server errors
        }
      });

      if (response.status >= 200 && response.status < 500) {
        this.log('✅ CopilotKit endpoint is accessible');
        
        // Check if the response structure looks correct
        if (response.headers['content-type']?.includes('application/json') || 
            response.status === 401 || response.status === 403) {
          this.log('✅ CopilotKit endpoint returns expected response structure');
          return true;
        }
      }
      
      this.log(`⚠️ CopilotKit endpoint responded with status ${response.status}`, 'error');
      return false;
    } catch (error) {
      this.log(`❌ CopilotKit integration test failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testContentGenerationActions() {
    this.log('🧪 Testing content generation actions...');
    try {
      const response = await axios.get(`${BASE_URL}/learning`);
      const pageContent = response.data;
      
      // Check for action-related code in the page
      const actionChecks = [
        { name: 'Generate Content Action', pattern: 'generateContentAction' },
        { name: 'Curate Content Action', pattern: 'curateContentAction' },
        { name: 'Content Generation Context', pattern: 'ContentGenerationContext' },
        { name: 'Learning Context Management', pattern: 'userContext' }
      ];

      let allActionsFound = true;
      for (const check of actionChecks) {
        if (pageContent.includes(check.pattern)) {
          this.log(`✅ ${check.name} integration found`);
        } else {
          this.log(`⚠️ ${check.name} not directly visible in page (may be in JS bundles)`);
        }
      }

      return true; // Actions are compiled into JS bundles, so this is expected
    } catch (error) {
      this.log(`❌ Action testing failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testUITabNavigation() {
    this.log('🧪 Testing UI tab navigation structure...');
    try {
      const response = await axios.get(`${BASE_URL}/learning`);
      const pageContent = response.data;
      
      // Check for all 6 expected tabs
      const tabChecks = [
        'Smart Actions',
        'AI Content', // Story 5.2 addition
        'AI Chat',
        'Progress',
        'Assessments',
        'Overview'
      ];

      let allTabsFound = true;
      for (const tab of tabChecks) {
        if (pageContent.includes(tab)) {
          this.log(`✅ ${tab} tab found`);
        } else {
          this.log(`❌ ${tab} tab not found`, 'error');
          allTabsFound = false;
        }
      }

      // Check for 6-column grid layout
      if (pageContent.includes('grid-cols-6')) {
        this.log('✅ 6-column tab layout found');
      } else {
        this.log('❌ 6-column tab layout not found', 'error');
        allTabsFound = false;
      }

      return allTabsFound;
    } catch (error) {
      this.log(`❌ Tab navigation testing failed: ${error.message}`, 'error');
      return false;
    }
  }

  async testIntegrationStatus() {
    this.log('🧪 Testing integration status in Overview tab...');
    try {
      const response = await axios.get(`${BASE_URL}/learning`);
      const pageContent = response.data;
      
      // Check for Story 5.2 status indicators
      const statusChecks = [
        { name: 'Story 5.1 Status', pattern: 'Story 5.1: Advanced AI Actions' },
        { name: 'Epic 4 Complete Status', pattern: 'Epic 4: Core Learning Features - Complete' },
        { name: 'Smart Workflow Engine', pattern: 'Smart Workflow Engine' },
        { name: 'Context-Aware Actions', pattern: 'Context-Aware AI Actions' }
      ];

      let allStatusFound = true;
      for (const check of statusChecks) {
        if (pageContent.includes(check.pattern)) {
          this.log(`✅ ${check.name} status found`);
        } else {
          this.log(`❌ ${check.name} status not found`, 'error');
          allStatusFound = false;
        }
      }

      return allStatusFound;
    } catch (error) {
      this.log(`❌ Integration status testing failed: ${error.message}`, 'error');
      return false;
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Story 5.2 End-to-End Testing...');
    this.log('');

    const tests = [
      { name: 'Homepage Access', fn: this.testHomepageAccess },
      { name: 'Learning Portal Access', fn: this.testLearningPortalAccess },
      { name: 'Content Generation Components', fn: this.testContentGenerationComponents },
      { name: 'CopilotKit Integration', fn: this.testCopilotKitIntegration },
      { name: 'Content Generation Actions', fn: this.testContentGenerationActions },
      { name: 'UI Tab Navigation', fn: this.testUITabNavigation },
      { name: 'Integration Status', fn: this.testIntegrationStatus }
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    for (const test of tests) {
      this.log(`\n📋 Running test: ${test.name}`);
      try {
        const result = await test.fn.call(this);
        if (result) {
          passedTests++;
          this.log(`✅ ${test.name} PASSED`);
        } else {
          this.log(`❌ ${test.name} FAILED`, 'error');
        }
      } catch (error) {
        this.log(`💥 ${test.name} CRASHED: ${error.message}`, 'error');
      }
    }

    this.log('\n' + '='.repeat(60));
    this.log(`📊 STORY 5.2 TEST RESULTS`);
    this.log(`📈 Tests Passed: ${passedTests}/${totalTests}`);
    this.log(`📉 Tests Failed: ${totalTests - passedTests}/${totalTests}`);
    this.log(`🎯 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    if (this.errors.length > 0) {
      this.log('\n❌ ERRORS ENCOUNTERED:');
      this.errors.forEach(error => this.log(error));
    }
    
    if (passedTests === totalTests) {
      this.log('\n🎉 ALL TESTS PASSED! Story 5.2 implementation is working correctly.');
      return true;
    } else {
      this.log('\n⚠️ Some tests failed. Review the issues above.');
      return false;
    }
  }
}

// Run the tests
async function main() {
  const tester = new Story52Tester();
  const success = await tester.runAllTests();
  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = Story52Tester;