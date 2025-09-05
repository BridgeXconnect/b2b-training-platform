/**
 * Custom Playwright Reporter for Integration Testing
 * Specialized reporting for error recovery and cross-system validation
 */

import { Reporter, TestCase, TestResult, Suite } from '@playwright/test/reporter';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface IntegrationMetrics {
  errorRecoveryTests: number;
  crossSystemTests: number;
  performanceTests: number;
  averageRecoveryTime: number;
  totalApiCalls: number;
  sentryEvents: number;
  systemHealthChecks: number;
}

interface TestMetadata {
  testType: 'error-recovery' | 'cross-system' | 'performance' | 'integration' | 'unit';
  components: string[];
  apiEndpoints: string[];
  errorScenarios: string[];
  recoveryMethods: string[];
  metrics: Record<string, number>;
}

class IntegrationReporter implements Reporter {
  private startTime: number = 0;
  private testResults: Map<string, TestResult> = new Map();
  private integrationMetrics: IntegrationMetrics = {
    errorRecoveryTests: 0,
    crossSystemTests: 0,
    performanceTests: 0,
    averageRecoveryTime: 0,
    totalApiCalls: 0,
    sentryEvents: 0,
    systemHealthChecks: 0
  };
  private testMetadata: Map<string, TestMetadata> = new Map();
  private suiteResults: Map<string, any> = new Map();

  constructor() {
    this.ensureReportDirectory();
  }

  // Ensure report directory exists
  private ensureReportDirectory() {
    const reportDir = join(process.cwd(), 'test-scripts/__tests__/reports');
    if (!existsSync(reportDir)) {
      mkdirSync(reportDir, { recursive: true });
    }
  }

  // Called when test run begins
  onBegin(config: any, suite: Suite) {
    this.startTime = Date.now();
    console.log('🧪 Starting Integration Test Suite with Custom Reporter');
    console.log(`📊 Running ${suite.allTests().length} tests across ${config.projects.length} projects`);
    
    // Initialize project-specific metrics
    for (const project of config.projects) {
      this.suiteResults.set(project.name, {
        tests: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        duration: 0,
        errors: []
      });
    }
  }

  // Called when test ends
  onTestEnd(test: TestCase, result: TestResult) {
    const testId = `${test.parent.title}::${test.title}`;
    this.testResults.set(testId, result);

    // Extract test metadata from test title and file path
    const metadata = this.extractTestMetadata(test, result);
    this.testMetadata.set(testId, metadata);

    // Update integration metrics
    this.updateIntegrationMetrics(metadata, result);

    // Update suite results
    const projectName = test.parent.project()?.name || 'unknown';
    const suiteResult = this.suiteResults.get(projectName);
    if (suiteResult) {
      suiteResult.tests++;
      suiteResult.duration += result.duration;
      
      if (result.status === 'passed') {
        suiteResult.passed++;
      } else if (result.status === 'failed') {
        suiteResult.failed++;
        suiteResult.errors.push({
          test: test.title,
          error: result.error?.message || 'Unknown error'
        });
      } else if (result.status === 'skipped') {
        suiteResult.skipped++;
      }
    }

    // Log test completion with integration context
    this.logTestCompletion(test, result, metadata);
  }

  // Extract test metadata from test information
  private extractTestMetadata(test: TestCase, result: TestResult): TestMetadata {
    const testTitle = test.title.toLowerCase();
    const filePath = test.location.file.toLowerCase();
    
    // Determine test type
    let testType: TestMetadata['testType'] = 'integration';
    if (filePath.includes('error-recovery') || testTitle.includes('error') || testTitle.includes('recovery')) {
      testType = 'error-recovery';
    } else if (filePath.includes('cross-system') || testTitle.includes('cross-system') || testTitle.includes('integration')) {
      testType = 'cross-system';
    } else if (filePath.includes('performance') || testTitle.includes('performance')) {
      testType = 'performance';
    } else if (filePath.includes('unit') || filePath.includes('components')) {
      testType = 'unit';
    }

    // Extract components being tested
    const components = this.extractComponents(testTitle, filePath);
    
    // Extract API endpoints
    const apiEndpoints = this.extractApiEndpoints(testTitle);
    
    // Extract error scenarios
    const errorScenarios = this.extractErrorScenarios(testTitle);
    
    // Extract recovery methods
    const recoveryMethods = this.extractRecoveryMethods(testTitle);
    
    // Extract metrics from test output
    const metrics = this.extractMetricsFromOutput(result);

    return {
      testType,
      components,
      apiEndpoints,
      errorScenarios,
      recoveryMethods,
      metrics
    };
  }

  // Extract component names from test information
  private extractComponents(title: string, filePath: string): string[] {
    const components = [];
    
    // Common component patterns
    const componentPatterns = [
      'error-boundary', 'voice', 'chat', 'assessment', 'frontend', 'backend', 
      'api', 'database', 'sentry', 'openai', 'monitoring'
    ];
    
    for (const pattern of componentPatterns) {
      if (title.includes(pattern) || filePath.includes(pattern)) {
        components.push(pattern);
      }
    }
    
    return components;
  }

  // Extract API endpoints from test title
  private extractApiEndpoints(title: string): string[] {
    const endpoints = [];
    const apiPatterns = ['/api/voice', '/api/chat', '/api/health', '/api/progress', '/api/assessment'];
    
    for (const pattern of apiPatterns) {
      if (title.includes(pattern)) {
        endpoints.push(pattern);
      }
    }
    
    return endpoints;
  }

  // Extract error scenarios from test title
  private extractErrorScenarios(title: string): string[] {
    const scenarios = [];
    const errorPatterns = [
      'network failure', 'timeout', 'rate limit', 'api error', 'database error',
      'javascript error', 'chunk loading', 'service unavailable', 'auth error'
    ];
    
    for (const pattern of errorPatterns) {
      if (title.includes(pattern)) {
        scenarios.push(pattern);
      }
    }
    
    return scenarios;
  }

  // Extract recovery methods from test title
  private extractRecoveryMethods(title: string): string[] {
    const methods = [];
    const recoveryPatterns = [
      'try again', 'retry', 'fallback', 'reload', 'reset', 'restore', 'recover'
    ];
    
    for (const pattern of recoveryPatterns) {
      if (title.includes(pattern)) {
        methods.push(pattern);
      }
    }
    
    return methods;
  }

  // Extract metrics from test output/attachments
  private extractMetricsFromOutput(result: TestResult): Record<string, number> {
    const metrics: Record<string, number> = {
      duration: result.duration,
      retries: result.retry
    };

    // Extract metrics from stdout if available
    if (result.stdout) {
      const stdout = result.stdout.join(' ');
      
      // Extract timing metrics
      const timingMatches = stdout.match(/(\d+)ms/g);
      if (timingMatches) {
        const times = timingMatches.map(m => parseInt(m.replace('ms', '')));
        metrics.averageResponseTime = times.reduce((a, b) => a + b, 0) / times.length;
      }
      
      // Extract API call counts
      const apiCallMatch = stdout.match(/(\d+)\s+api\s+calls?/i);
      if (apiCallMatch) {
        metrics.apiCalls = parseInt(apiCallMatch[1]);
      }
      
      // Extract error counts
      const errorMatch = stdout.match(/(\d+)\s+errors?/i);
      if (errorMatch) {
        metrics.errors = parseInt(errorMatch[1]);
      }
    }

    return metrics;
  }

  // Update integration-specific metrics
  private updateIntegrationMetrics(metadata: TestMetadata, result: TestResult) {
    // Count test types
    switch (metadata.testType) {
      case 'error-recovery':
        this.integrationMetrics.errorRecoveryTests++;
        break;
      case 'cross-system':
        this.integrationMetrics.crossSystemTests++;
        break;
      case 'performance':
        this.integrationMetrics.performanceTests++;
        break;
    }

    // Aggregate metrics
    if (metadata.metrics.apiCalls) {
      this.integrationMetrics.totalApiCalls += metadata.metrics.apiCalls;
    }
    
    if (metadata.metrics.averageResponseTime) {
      this.integrationMetrics.averageRecoveryTime = 
        (this.integrationMetrics.averageRecoveryTime + metadata.metrics.averageResponseTime) / 2;
    }

    // Count components tested
    if (metadata.components.includes('sentry')) {
      this.integrationMetrics.sentryEvents++;
    }
  }

  // Log test completion with context
  private logTestCompletion(test: TestCase, result: TestResult, metadata: TestMetadata) {
    const status = result.status === 'passed' ? '✅' : 
                  result.status === 'failed' ? '❌' : 
                  result.status === 'skipped' ? '⏭️' : '⚠️';
    
    const duration = Math.round(result.duration);
    const testType = metadata.testType.toUpperCase();
    const components = metadata.components.join(', ') || 'general';
    
    console.log(`${status} [${testType}] ${test.title} (${duration}ms) - Components: ${components}`);
    
    if (result.status === 'failed' && result.error) {
      console.log(`   Error: ${result.error.message}`);
    }
    
    if (metadata.errorScenarios.length > 0) {
      console.log(`   Scenarios: ${metadata.errorScenarios.join(', ')}`);
    }
    
    if (metadata.recoveryMethods.length > 0) {
      console.log(`   Recovery: ${metadata.recoveryMethods.join(', ')}`);
    }
  }

  // Called when test run ends
  onEnd(result: any) {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;
    
    console.log('📊 Generating Integration Test Report...');
    
    // Generate comprehensive report
    const report = this.generateIntegrationReport(totalDuration, result);
    
    // Save detailed JSON report
    this.saveJsonReport(report);
    
    // Save HTML report
    this.saveHtmlReport(report);
    
    // Print summary
    this.printTestSummary(report);
    
    console.log('✅ Integration Test Reporter completed');
  }

  // Generate comprehensive integration report
  private generateIntegrationReport(totalDuration: number, testRunResult: any): any {
    const totalTests = this.testResults.size;
    const passedTests = Array.from(this.testResults.values()).filter(r => r.status === 'passed').length;
    const failedTests = Array.from(this.testResults.values()).filter(r => r.status === 'failed').length;
    const skippedTests = Array.from(this.testResults.values()).filter(r => r.status === 'skipped').length;

    // Analyze test results by type
    const testsByType = this.analyzeTestsByType();
    const componentCoverage = this.analyzeComponentCoverage();
    const errorScenarioCoverage = this.analyzeErrorScenarioCoverage();
    const recoveryMethodCoverage = this.analyzeRecoveryMethodCoverage();

    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalDuration,
        totalTests,
        passedTests,
        failedTests,
        skippedTests,
        successRate: Math.round((passedTests / totalTests) * 100),
        averageTestDuration: Math.round(totalDuration / totalTests)
      },
      integrationMetrics: this.integrationMetrics,
      testAnalysis: {
        byType: testsByType,
        componentCoverage,
        errorScenarioCoverage,
        recoveryMethodCoverage
      },
      projectResults: Object.fromEntries(this.suiteResults),
      failedTests: this.getFailedTestDetails(),
      recommendations: this.generateRecommendations(),
      artifacts: {
        reportGenerated: true,
        timestamp: new Date().toISOString()
      }
    };
  }

  // Analyze tests by type
  private analyzeTestsByType(): any {
    const typeAnalysis = {
      'error-recovery': { count: 0, passed: 0, failed: 0, averageDuration: 0 },
      'cross-system': { count: 0, passed: 0, failed: 0, averageDuration: 0 },
      'performance': { count: 0, passed: 0, failed: 0, averageDuration: 0 },
      'integration': { count: 0, passed: 0, failed: 0, averageDuration: 0 },
      'unit': { count: 0, passed: 0, failed: 0, averageDuration: 0 }
    };

    for (const [testId, metadata] of this.testMetadata) {
      const result = this.testResults.get(testId)!;
      const type = metadata.testType;
      
      typeAnalysis[type].count++;
      typeAnalysis[type].averageDuration += result.duration;
      
      if (result.status === 'passed') {
        typeAnalysis[type].passed++;
      } else if (result.status === 'failed') {
        typeAnalysis[type].failed++;
      }
    }

    // Calculate averages
    for (const type of Object.keys(typeAnalysis)) {
      const analysis = typeAnalysis[type];
      if (analysis.count > 0) {
        analysis.averageDuration = Math.round(analysis.averageDuration / analysis.count);
        analysis['successRate'] = Math.round((analysis.passed / analysis.count) * 100);
      }
    }

    return typeAnalysis;
  }

  // Analyze component coverage
  private analyzeComponentCoverage(): any {
    const componentCoverage = {};
    
    for (const [testId, metadata] of this.testMetadata) {
      const result = this.testResults.get(testId)!;
      
      for (const component of metadata.components) {
        if (!componentCoverage[component]) {
          componentCoverage[component] = { tests: 0, passed: 0, failed: 0 };
        }
        
        componentCoverage[component].tests++;
        if (result.status === 'passed') {
          componentCoverage[component].passed++;
        } else if (result.status === 'failed') {
          componentCoverage[component].failed++;
        }
      }
    }

    return componentCoverage;
  }

  // Analyze error scenario coverage
  private analyzeErrorScenarioCoverage(): any {
    const scenarioCoverage = {};
    
    for (const [testId, metadata] of this.testMetadata) {
      const result = this.testResults.get(testId)!;
      
      for (const scenario of metadata.errorScenarios) {
        if (!scenarioCoverage[scenario]) {
          scenarioCoverage[scenario] = { tests: 0, passed: 0, failed: 0 };
        }
        
        scenarioCoverage[scenario].tests++;
        if (result.status === 'passed') {
          scenarioCoverage[scenario].passed++;
        } else if (result.status === 'failed') {
          scenarioCoverage[scenario].failed++;
        }
      }
    }

    return scenarioCoverage;
  }

  // Analyze recovery method coverage
  private analyzeRecoveryMethodCoverage(): any {
    const methodCoverage = {};
    
    for (const [testId, metadata] of this.testMetadata) {
      const result = this.testResults.get(testId)!;
      
      for (const method of metadata.recoveryMethods) {
        if (!methodCoverage[method]) {
          methodCoverage[method] = { tests: 0, passed: 0, failed: 0 };
        }
        
        methodCoverage[method].tests++;
        if (result.status === 'passed') {
          methodCoverage[method].passed++;
        } else if (result.status === 'failed') {
          methodCoverage[method].failed++;
        }
      }
    }

    return methodCoverage;
  }

  // Get failed test details
  private getFailedTestDetails(): any[] {
    const failedTests = [];
    
    for (const [testId, result] of this.testResults) {
      if (result.status === 'failed') {
        const metadata = this.testMetadata.get(testId)!;
        failedTests.push({
          testId,
          error: result.error?.message || 'Unknown error',
          duration: result.duration,
          retries: result.retry,
          type: metadata.testType,
          components: metadata.components,
          errorScenarios: metadata.errorScenarios,
          recoveryMethods: metadata.recoveryMethods
        });
      }
    }
    
    return failedTests;
  }

  // Generate recommendations
  private generateRecommendations(): string[] {
    const recommendations = [];
    const totalTests = this.testResults.size;
    const failedTests = Array.from(this.testResults.values()).filter(r => r.status === 'failed').length;
    const successRate = ((totalTests - failedTests) / totalTests) * 100;

    // Success rate recommendations
    if (successRate < 90) {
      recommendations.push(`Success rate is ${Math.round(successRate)}% - investigate failing tests to improve reliability`);
    }

    // Error recovery specific recommendations
    if (this.integrationMetrics.errorRecoveryTests > 0) {
      recommendations.push('Error recovery tests are active - monitor production error rates');
    }

    // Cross-system integration recommendations
    if (this.integrationMetrics.crossSystemTests > 0) {
      recommendations.push('Cross-system integration validated - ensure monitoring covers all integration points');
    }

    // Performance recommendations
    if (this.integrationMetrics.averageRecoveryTime > 5000) {
      recommendations.push('Average recovery time exceeds 5 seconds - optimize error recovery performance');
    }

    // General recommendations
    recommendations.push('Review failed tests for patterns that might indicate systemic issues');
    recommendations.push('Update error scenarios based on production error data');
    recommendations.push('Validate that all critical user journeys are covered by integration tests');

    return recommendations;
  }

  // Save JSON report
  private saveJsonReport(report: any) {
    const filename = `integration-test-report-${Date.now()}.json`;
    const filepath = join(process.cwd(), 'test-scripts/__tests__/reports', filename);
    
    writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`📄 JSON report saved: ${filepath}`);
  }

  // Save HTML report
  private saveHtmlReport(report: any) {
    const html = this.generateHtmlReport(report);
    const filename = `integration-test-report-${Date.now()}.html`;
    const filepath = join(process.cwd(), 'test-scripts/__tests__/reports', filename);
    
    writeFileSync(filepath, html);
    console.log(`📄 HTML report saved: ${filepath}`);
  }

  // Generate HTML report
  private generateHtmlReport(report: any): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Integration Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; text-align: center; }
        .metric-card.success { border-color: #10b981; background: #ecfdf5; }
        .metric-card.warning { border-color: #f59e0b; background: #fffbeb; }
        .metric-card.error { border-color: #ef4444; background: #fef2f2; }
        .test-type-analysis { margin: 30px 0; }
        .test-type { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin: 10px 0; padding: 20px; }
        .component-coverage { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; margin: 20px 0; }
        .component { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 15px; }
        .failed-tests { background: #fef2f2; border: 1px solid #ef4444; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .recommendations { background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .timestamp { color: #6b7280; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
        th { background: #f8fafc; font-weight: 600; }
        .status-passed { color: #10b981; font-weight: bold; }
        .status-failed { color: #ef4444; font-weight: bold; }
        .status-skipped { color: #f59e0b; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Integration Test Report</h1>
            <p class="timestamp">Generated: ${report.timestamp}</p>
            <p>Duration: ${Math.round(report.summary.totalDuration / 1000)}s | Tests: ${report.summary.totalTests} | Success Rate: ${report.summary.successRate}%</p>
        </div>
        
        <div class="content">
            <div class="metrics-grid">
                <div class="metric-card ${report.summary.successRate >= 90 ? 'success' : report.summary.successRate >= 70 ? 'warning' : 'error'}">
                    <h3>${report.summary.successRate}%</h3>
                    <p>Success Rate</p>
                </div>
                <div class="metric-card">
                    <h3>${report.summary.totalTests}</h3>
                    <p>Total Tests</p>
                </div>
                <div class="metric-card success">
                    <h3>${report.summary.passedTests}</h3>
                    <p>Passed</p>
                </div>
                <div class="metric-card ${report.summary.failedTests > 0 ? 'error' : ''}">
                    <h3>${report.summary.failedTests}</h3>
                    <p>Failed</p>
                </div>
                <div class="metric-card">
                    <h3>${report.integrationMetrics.errorRecoveryTests}</h3>
                    <p>Error Recovery Tests</p>
                </div>
                <div class="metric-card">
                    <h3>${report.integrationMetrics.crossSystemTests}</h3>
                    <p>Cross-System Tests</p>
                </div>
            </div>
            
            <div class="test-type-analysis">
                <h2>📊 Test Type Analysis</h2>
                ${Object.entries(report.testAnalysis.byType).map(([type, data]: [string, any]) => `
                    <div class="test-type">
                        <h3>${type.charAt(0).toUpperCase() + type.slice(1)} Tests</h3>
                        <p><strong>Count:</strong> ${data.count} | <strong>Success Rate:</strong> ${data.successRate || 0}% | <strong>Avg Duration:</strong> ${data.averageDuration}ms</p>
                        <p><strong>Passed:</strong> ${data.passed} | <strong>Failed:</strong> ${data.failed}</p>
                    </div>
                `).join('')}
            </div>
            
            <div class="component-coverage">
                <h2>🧩 Component Coverage</h2>
                ${Object.entries(report.testAnalysis.componentCoverage).map(([component, data]: [string, any]) => `
                    <div class="component">
                        <h4>${component}</h4>
                        <p>Tests: ${data.tests}</p>
                        <p class="status-passed">Passed: ${data.passed}</p>
                        <p class="status-failed">Failed: ${data.failed}</p>
                    </div>
                `).join('')}
            </div>
            
            ${report.failedTests.length > 0 ? `
            <div class="failed-tests">
                <h2>❌ Failed Tests</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Test</th>
                            <th>Type</th>
                            <th>Components</th>
                            <th>Error</th>
                            <th>Duration</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${report.failedTests.map((test: any) => `
                            <tr>
                                <td>${test.testId.split('::')[1] || test.testId}</td>
                                <td>${test.type}</td>
                                <td>${test.components.join(', ')}</td>
                                <td title="${test.error}">${test.error.substring(0, 50)}${test.error.length > 50 ? '...' : ''}</td>
                                <td>${test.duration}ms</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ` : ''}
            
            <div class="recommendations">
                <h2>💡 Recommendations</h2>
                <ul>
                    ${report.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
                </ul>
            </div>
        </div>
    </div>
</body>
</html>
    `;
  }

  // Print test summary to console
  private printTestSummary(report: any) {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 INTEGRATION TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passedTests} (${report.summary.successRate}%)`);
    console.log(`Failed: ${report.summary.failedTests}`);
    console.log(`Skipped: ${report.summary.skippedTests}`);
    console.log(`Duration: ${Math.round(report.summary.totalDuration / 1000)}s`);
    console.log('');
    console.log('🔍 Integration Metrics:');
    console.log(`  Error Recovery Tests: ${report.integrationMetrics.errorRecoveryTests}`);
    console.log(`  Cross-System Tests: ${report.integrationMetrics.crossSystemTests}`);
    console.log(`  Performance Tests: ${report.integrationMetrics.performanceTests}`);
    console.log(`  Average Recovery Time: ${Math.round(report.integrationMetrics.averageRecoveryTime)}ms`);
    console.log('='.repeat(80));
  }
}

export default IntegrationReporter;