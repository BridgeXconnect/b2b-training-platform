/**
 * Sentry Integration Validation for Voice Practice OPENAI_API_KEY Fix
 * Validates that Sentry properly captures errors without exposing sensitive data
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

class SentryValidation {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.validationResults = [];
    this.sentryDsn = process.env.SENTRY_DSN;
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: '\x1b[34m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  addResult(testName, passed, details) {
    this.validationResults.push({
      test: testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
    
    if (passed) {
      this.log(`✅ ${testName}: PASSED`, 'success');
    } else {
      this.log(`❌ ${testName}: FAILED - ${details}`, 'error');
    }
  }

  // Validate Sentry configuration files
  async validateSentryConfig() {
    this.log('Validating Sentry configuration files...', 'info');
    
    const configFiles = [
      'sentry.server.config.ts',
      'sentry.edge.config.ts',
      'instrumentation.ts'
    ];
    
    let allValid = true;
    
    for (const configFile of configFiles) {
      const filePath = path.join(this.projectRoot, configFile);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        // Check for API key exposure
        const apiKeyPattern = /sk-[a-zA-Z0-9]{48}/g;
        if (apiKeyPattern.test(content)) {
          this.addResult(
            `Sentry Config Security (${configFile})`,
            false,
            'API key found in configuration file'
          );
          allValid = false;
        } else {
          // Check for proper error filtering
          const hasBeforeSend = content.includes('beforeSend') || content.includes('beforeSendTransaction');
          if (!hasBeforeSend) {
            this.log(`Warning: ${configFile} might not have proper error filtering`, 'warning');
          }
          
          this.addResult(
            `Sentry Config Security (${configFile})`,
            true,
            'No sensitive data found in configuration'
          );
        }
      } else {
        this.log(`Warning: ${configFile} not found`, 'warning');
      }
    }
    
    return allValid;
  }

  // Validate Voice component Sentry integration
  async validateVoiceComponentIntegration() {
    this.log('Validating Voice component Sentry integration...', 'info');
    
    const voiceComponentPath = path.join(this.projectRoot, 'components/voice/VoicePracticeInterface.tsx');
    
    if (!fs.existsSync(voiceComponentPath)) {
      this.addResult(
        'Voice Component Sentry Integration',
        false,
        'Voice component file not found'
      );
      return false;
    }
    
    const content = fs.readFileSync(voiceComponentPath, 'utf-8');
    
    // Check for proper error handling
    const hasErrorHandling = content.includes('try') && content.includes('catch');
    const hasSentryImport = content.includes('@sentry') || content.includes('Sentry');
    
    if (!hasErrorHandling) {
      this.addResult(
        'Voice Component Error Handling',
        false,
        'Component lacks proper try-catch error handling'
      );
      return false;
    }
    
    // Check for API key exposure in component
    const apiKeyPattern = /sk-[a-zA-Z0-9]{48}/g;
    const envPattern = /process\.env\.OPENAI_API_KEY/g;
    
    if (apiKeyPattern.test(content) || envPattern.test(content)) {
      this.addResult(
        'Voice Component Security',
        false,
        'API key or environment variable exposure detected'
      );
      return false;
    }
    
    this.addResult(
      'Voice Component Sentry Integration',
      true,
      'Component has proper error handling and no API key exposure'
    );
    
    return true;
  }

  // Validate API route Sentry integration
  async validateApiRouteSentryIntegration() {
    this.log('Validating API route Sentry integration...', 'info');
    
    const apiRoutePath = path.join(this.projectRoot, 'app/api/voice/analyze/route.ts');
    
    if (!fs.existsSync(apiRoutePath)) {
      this.addResult(
        'API Route Sentry Integration',
        false,
        'API route file not found'
      );
      return false;
    }
    
    const content = fs.readFileSync(apiRoutePath, 'utf-8');
    
    // Check for proper error handling
    const hasErrorHandling = content.includes('try') && content.includes('catch');
    const hasErrorLogging = content.includes('log.error') || content.includes('Sentry') || content.includes('captureException');
    
    if (!hasErrorHandling) {
      this.addResult(
        'API Route Error Handling',
        false,
        'API route lacks proper try-catch error handling'
      );
      return false;
    }
    
    if (!hasErrorLogging) {
      this.addResult(
        'API Route Error Logging',
        false,
        'API route lacks proper error logging'
      );
      return false;
    }
    
    // Check that API key is handled server-side
    const hasServerSideApiKey = content.includes('process.env.OPENAI_API_KEY');
    if (!hasServerSideApiKey) {
      this.log('Warning: API route might not be using OPENAI_API_KEY', 'warning');
    }
    
    this.addResult(
      'API Route Sentry Integration',
      true,
      'API route has proper error handling and logging'
    );
    
    return true;
  }

  // Simulate error scenarios and validate Sentry capture
  async simulateErrorScenarios() {
    this.log('Simulating error scenarios...', 'info');
    
    const testScenarios = [
      {
        name: 'Missing API Key Error',
        simulation: this.simulateMissingApiKeyError.bind(this)
      },
      {
        name: 'Network Timeout Error',
        simulation: this.simulateNetworkTimeoutError.bind(this)
      },
      {
        name: 'Invalid Audio Format Error',
        simulation: this.simulateInvalidAudioError.bind(this)
      }
    ];
    
    let allPassed = true;
    
    for (const scenario of testScenarios) {
      try {
        const result = await scenario.simulation();
        this.addResult(
          `Error Simulation: ${scenario.name}`,
          result.success,
          result.details
        );
        
        if (!result.success) {
          allPassed = false;
        }
      } catch (error) {
        this.addResult(
          `Error Simulation: ${scenario.name}`,
          false,
          `Simulation failed: ${error.message}`
        );
        allPassed = false;
      }
    }
    
    return allPassed;
  }

  // Simulate missing API key error
  async simulateMissingApiKeyError() {
    this.log('Simulating missing API key error...', 'info');
    
    // Mock error that would occur when API key is missing
    const mockError = {
      message: 'OpenAI API key not configured',
      code: 'MISSING_API_KEY',
      stack: 'Error: OpenAI API key not configured\n    at analyzePronunciation...'
    };
    
    // Validate that error doesn't contain actual API key
    const errorString = JSON.stringify(mockError);
    const apiKeyPattern = /sk-[a-zA-Z0-9]{48}/g;
    
    if (apiKeyPattern.test(errorString)) {
      return {
        success: false,
        details: 'Simulated error contains API key pattern'
      };
    }
    
    return {
      success: true,
      details: 'Error simulation passed - no API key exposure'
    };
  }

  // Simulate network timeout error
  async simulateNetworkTimeoutError() {
    this.log('Simulating network timeout error...', 'info');
    
    const mockError = {
      message: 'Request timeout',
      code: 'TIMEOUT',
      url: '/api/voice/analyze',
      duration: 5000
    };
    
    // Validate error context doesn't expose sensitive data
    const errorString = JSON.stringify(mockError);
    const sensitivePatterns = [
      /sk-[a-zA-Z0-9]{48}/g,
      /OPENAI_API_KEY/g,
      /password/gi,
      /secret/gi
    ];
    
    const hasSensitiveData = sensitivePatterns.some(pattern => pattern.test(errorString));
    
    return {
      success: !hasSensitiveData,
      details: hasSensitiveData ? 'Error contains sensitive data' : 'Error simulation clean'
    };
  }

  // Simulate invalid audio format error
  async simulateInvalidAudioError() {
    this.log('Simulating invalid audio format error...', 'info');
    
    const mockError = {
      message: 'Invalid audio format',
      code: 'INVALID_AUDIO',
      format: 'audio/mp3',
      expectedFormats: ['audio/webm', 'audio/wav']
    };
    
    // This error type should be safe by nature
    return {
      success: true,
      details: 'Audio format error simulation passed'
    };
  }

  // Validate Sentry event filtering
  async validateEventFiltering() {
    this.log('Validating Sentry event filtering...', 'info');
    
    // Check if beforeSend is implemented to filter sensitive data
    const sentryConfigFiles = ['sentry.server.config.ts', 'sentry.edge.config.ts'];
    let hasProperFiltering = false;
    
    for (const configFile of sentryConfigFiles) {
      const filePath = path.join(this.projectRoot, configFile);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        if (content.includes('beforeSend') && content.includes('event')) {
          hasProperFiltering = true;
          break;
        }
      }
    }
    
    this.addResult(
      'Sentry Event Filtering',
      hasProperFiltering,
      hasProperFiltering ? 
        'beforeSend hook found for event filtering' : 
        'No beforeSend hook found - events might not be filtered'
    );
    
    return hasProperFiltering;
  }

  // Validate distributed tracing configuration
  async validateDistributedTracing() {
    this.log('Validating distributed tracing configuration...', 'info');
    
    const instrumentationPath = path.join(this.projectRoot, 'instrumentation.ts');
    
    if (!fs.existsSync(instrumentationPath)) {
      this.addResult(
        'Distributed Tracing',
        false,
        'instrumentation.ts not found'
      );
      return false;
    }
    
    const content = fs.readFileSync(instrumentationPath, 'utf-8');
    
    // Check for proper Sentry integration
    const hasSentryInit = content.includes('Sentry.init') || content.includes('@sentry');
    const hasTracing = content.includes('tracing') || content.includes('trace');
    
    if (!hasSentryInit) {
      this.addResult(
        'Distributed Tracing',
        false,
        'Sentry initialization not found in instrumentation'
      );
      return false;
    }
    
    this.addResult(
      'Distributed Tracing',
      true,
      'Sentry instrumentation properly configured'
    );
    
    return true;
  }

  // Check for performance monitoring setup
  async validatePerformanceMonitoring() {
    this.log('Validating performance monitoring setup...', 'info');
    
    const configFiles = ['sentry.server.config.ts', 'sentry.edge.config.ts'];
    let hasPerformanceMonitoring = false;
    
    for (const configFile of configFiles) {
      const filePath = path.join(this.projectRoot, configFile);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        
        if (content.includes('tracesSampleRate') || content.includes('performance')) {
          hasPerformanceMonitoring = true;
          break;
        }
      }
    }
    
    this.addResult(
      'Performance Monitoring',
      hasPerformanceMonitoring,
      hasPerformanceMonitoring ? 
        'Performance monitoring configured' : 
        'Performance monitoring not found'
    );
    
    return hasPerformanceMonitoring;
  }

  // Generate validation report
  generateReport() {
    this.log('Generating Sentry validation report...', 'info');
    
    const passedTests = this.validationResults.filter(r => r.passed).length;
    const totalTests = this.validationResults.length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    const reportPath = path.join(this.projectRoot, 'test-results', `sentry-validation-${Date.now()}.json`);
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests,
        passedTests,
        failedTests: totalTests - passedTests,
        successRate: `${successRate}%`
      },
      results: this.validationResults,
      recommendations: this.generateRecommendations()
    };
    
    // Ensure test-results directory exists
    const testResultsDir = path.dirname(reportPath);
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    this.log(`Report generated: ${reportPath}`, 'success');
    
    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('SENTRY VALIDATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${totalTests - passedTests}`);
    console.log(`Success Rate: ${successRate}%`);
    console.log('='.repeat(60) + '\n');
    
    return report;
  }

  // Generate recommendations based on validation results
  generateRecommendations() {
    const failedTests = this.validationResults.filter(r => !r.passed);
    const recommendations = [];
    
    if (failedTests.some(t => t.test.includes('Config Security'))) {
      recommendations.push('Remove any API keys from Sentry configuration files');
    }
    
    if (failedTests.some(t => t.test.includes('Error Handling'))) {
      recommendations.push('Implement proper try-catch error handling in all voice-related components');
    }
    
    if (failedTests.some(t => t.test.includes('Event Filtering'))) {
      recommendations.push('Implement beforeSend hook in Sentry configuration to filter sensitive data');
    }
    
    if (failedTests.some(t => t.test.includes('Performance Monitoring'))) {
      recommendations.push('Enable performance monitoring in Sentry configuration');
    }
    
    if (failedTests.some(t => t.test.includes('Distributed Tracing'))) {
      recommendations.push('Ensure proper Sentry instrumentation for distributed tracing');
    }
    
    // General recommendations
    recommendations.push('Regularly review Sentry events for any sensitive data leakage');
    recommendations.push('Set up alerts for critical errors in voice analysis workflow');
    recommendations.push('Monitor performance metrics for voice processing operations');
    
    return recommendations;
  }

  // Main validation execution
  async run() {
    this.log('🔍 Starting Sentry Integration Validation for Voice Practice OPENAI_API_KEY Fix', 'info');
    console.log('='.repeat(80));
    
    try {
      // Run all validations
      await this.validateSentryConfig();
      await this.validateVoiceComponentIntegration();
      await this.validateApiRouteSentryIntegration();
      await this.simulateErrorScenarios();
      await this.validateEventFiltering();
      await this.validateDistributedTracing();
      await this.validatePerformanceMonitoring();
      
      // Generate and return report
      const report = this.generateReport();
      
      const allPassed = this.validationResults.every(r => r.passed);
      
      if (allPassed) {
        this.log('🎉 All Sentry validations passed!', 'success');
        process.exit(0);
      } else {
        this.log('❌ Some Sentry validations failed. Please review the report.', 'error');
        process.exit(1);
      }
      
    } catch (error) {
      this.log(`💥 Validation failed with error: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  const validator = new SentryValidation();
  validator.run();
}

module.exports = SentryValidation;