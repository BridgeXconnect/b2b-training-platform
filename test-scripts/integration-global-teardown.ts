/**
 * Global Teardown for Integration Tests
 * Cleans up after comprehensive error recovery testing
 */

import { chromium, FullConfig } from '@playwright/test';
import { logger } from '../lib/logger';
import * as fs from 'fs';
import * as path from 'path';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting Integration Test Global Teardown...');
  
  try {
    // 1. Clean up test storage
    await cleanupTestStorage();
    
    // 2. Generate test reports
    await generateTestReports();
    
    // 3. Clean up temporary files
    await cleanupTemporaryFiles();
    
    // 4. Reset environment variables
    await resetEnvironment();
    
    // 5. Final health check
    await finalHealthCheck();
    
    console.log('✅ Integration Test Global Teardown Complete');
    
  } catch (error) {
    console.error('❌ Integration Test Global Teardown Failed:', error);
    // Don't throw to avoid masking test failures
  }
}

async function cleanupTestStorage() {
  console.log('🗃️ Cleaning up test storage...');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    await page.goto('http://localhost:3000');
    
    // Clear test storage
    await page.evaluate(() => {
      // Clear session storage
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (key.includes('test') || key.includes('integration')) {
          sessionStorage.removeItem(key);
        }
      });
      
      // Clear local storage
      const localKeys = Object.keys(localStorage);
      localKeys.forEach(key => {
        if (key.includes('test') || key.includes('integration')) {
          localStorage.removeItem(key);
        }
      });
      
      // Clear any test-specific global variables
      if (typeof window !== 'undefined') {
        delete (window as any).__TEST_ERRORS__;
        delete (window as any).__SENTRY_TEST__;
        delete (window as any).__SENTRY_PRODUCTION__;
      }
    });
    
    console.log('✅ Test storage cleaned up');
    
  } catch (error) {
    console.warn('⚠️ Storage cleanup failed:', error);
  } finally {
    await browser.close();
  }
}

async function generateTestReports() {
  console.log('📊 Generating test reports...');
  
  try {
    // Create reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), 'test-scripts', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    // Generate integration test summary
    const testSummary = {
      timestamp: new Date().toISOString(),
      testType: 'integration',
      environment: {
        nodeEnv: process.env.NODE_ENV,
        testMode: process.env.NEXT_PUBLIC_TEST_MODE,
        baseUrl: 'http://localhost:3000'
      },
      scenarios: [
        'Voice Practice Complete Recovery Flow',
        'Assessment Generator API Failure Recovery',
        'Advanced Chat Context Preservation',
        'Network Failure Cross-System Recovery',
        'Chunk Loading Error Page Recovery',
        'Real-time Error Recovery Coordination',
        'Mobile Integration Error Recovery',
        'Production Error Monitoring Integration',
        'Multi-Feature Error Cascade Recovery',
        'Performance Under Error Conditions',
        'Accessibility During Error Recovery'
      ],
      coverage: {
        errorTypes: ['network', 'javascript', 'api', 'chunk', 'service'],
        features: ['voice_practice', 'assessment_generator', 'advanced_chat', 'page'],
        recoveryActions: ['try_again', 'reset_services', 'fallback_mode', 'go_home'],
        systemIntegration: ['sentry', 'cross_system_coordination', 'data_integrity']
      },
      metrics: {
        expectedMaxErrorHandlingTime: 3000, // 3 seconds
        expectedMaxRecoveryTime: 10000, // 10 seconds
        expectedMinSuccessRate: 0.8 // 80%
      }
    };
    
    // Write test summary
    const summaryPath = path.join(reportsDir, 'integration-test-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(testSummary, null, 2));
    
    // Generate HTML report
    const htmlReport = generateHTMLReport(testSummary);
    const htmlPath = path.join(reportsDir, 'integration-test-report.html');
    fs.writeFileSync(htmlPath, htmlReport);
    
    console.log(`✅ Test reports generated:`);
    console.log(`   📄 Summary: ${summaryPath}`);
    console.log(`   🌐 HTML Report: ${htmlPath}`);
    
  } catch (error) {
    console.warn('⚠️ Report generation failed:', error);
  }
}

function generateHTMLReport(summary: any): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Integration Test Report - Error Recovery</title>
    <style>
        body { font-family: system-ui, sans-serif; margin: 2rem; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { border-bottom: 2px solid #e0e0e0; padding-bottom: 1rem; margin-bottom: 2rem; }
        .section { margin-bottom: 2rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
        .card { padding: 1rem; border: 1px solid #e0e0e0; border-radius: 4px; background: #fafafa; }
        .metric { text-align: center; padding: 1rem; background: #f0f8ff; border-radius: 4px; }
        .scenario { padding: 0.5rem; margin: 0.25rem 0; background: #e8f5e8; border-radius: 4px; font-size: 0.9rem; }
        .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 12px; font-size: 0.8rem; margin: 0.2rem; }
        .badge.error { background: #ffebee; color: #c62828; }
        .badge.feature { background: #e3f2fd; color: #1565c0; }
        .badge.action { background: #f3e5f5; color: #7b1fa2; }
        .badge.system { background: #e8f5e8; color: #2e7d32; }
        h1 { color: #1976d2; }
        h2 { color: #424242; border-bottom: 1px solid #e0e0e0; padding-bottom: 0.5rem; }
        h3 { color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Error Recovery Integration Test Report</h1>
            <p><strong>Generated:</strong> ${summary.timestamp}</p>
            <p><strong>Environment:</strong> ${summary.environment.nodeEnv} | <strong>Test Mode:</strong> ${summary.environment.testMode}</p>
        </div>
        
        <div class="section">
            <h2>📊 Test Metrics</h2>
            <div class="grid">
                <div class="metric">
                    <h3>Max Error Handling Time</h3>
                    <div style="font-size: 2rem; color: #1976d2;">${summary.metrics.expectedMaxErrorHandlingTime}ms</div>
                </div>
                <div class="metric">
                    <h3>Max Recovery Time</h3>
                    <div style="font-size: 2rem; color: #388e3c;">${summary.metrics.expectedMaxRecoveryTime}ms</div>
                </div>
                <div class="metric">
                    <h3>Min Success Rate</h3>
                    <div style="font-size: 2rem; color: #7b1fa2;">${(summary.metrics.expectedMinSuccessRate * 100)}%</div>
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>🎯 Test Scenarios</h2>
            <div class="grid">
                ${summary.scenarios.map((scenario: string) => `<div class="scenario">${scenario}</div>`).join('')}
            </div>
        </div>
        
        <div class="section">
            <h2>🔧 Coverage Areas</h2>
            <div class="grid">
                <div class="card">
                    <h3>Error Types</h3>
                    ${summary.coverage.errorTypes.map((type: string) => `<span class="badge error">${type}</span>`).join('')}
                </div>
                <div class="card">
                    <h3>Features</h3>
                    ${summary.coverage.features.map((feature: string) => `<span class="badge feature">${feature}</span>`).join('')}
                </div>
                <div class="card">
                    <h3>Recovery Actions</h3>
                    ${summary.coverage.recoveryActions.map((action: string) => `<span class="badge action">${action}</span>`).join('')}
                </div>
                <div class="card">
                    <h3>System Integration</h3>
                    ${summary.coverage.systemIntegration.map((system: string) => `<span class="badge system">${system}</span>`).join('')}
                </div>
            </div>
        </div>
        
        <div class="section">
            <h2>📋 Test Execution Notes</h2>
            <ul>
                <li>All tests include comprehensive error injection and recovery validation</li>
                <li>Cross-system coordination is validated for all scenarios</li>
                <li>Sentry integration is mocked and tested for proper error reporting</li>
                <li>Data integrity is preserved throughout error recovery processes</li>
                <li>Performance benchmarks are enforced for error handling and recovery</li>
                <li>Accessibility is maintained during error states</li>
                <li>Mobile responsiveness is validated for error UI components</li>
            </ul>
        </div>
        
        <div class="section">
            <h2>✅ Success Criteria</h2>
            <ul>
                <li>All user journeys must complete successfully with error injection</li>
                <li>Error recovery coordination must work across all system boundaries</li>
                <li>Sentry monitoring must capture and track all injected errors</li>
                <li>Data integrity must be maintained during all error scenarios</li>
                <li>Error handling time must be under ${summary.metrics.expectedMaxErrorHandlingTime}ms</li>
                <li>Total recovery time must be under ${summary.metrics.expectedMaxRecoveryTime}ms</li>
                <li>Overall success rate must exceed ${(summary.metrics.expectedMinSuccessRate * 100)}%</li>
            </ul>
        </div>
    </div>
</body>
</html>
  `;
}

async function cleanupTemporaryFiles() {
  console.log('🗑️ Cleaning up temporary files...');
  
  try {
    const tempDirs = [
      'test-results-integration',
      'playwright-report-integration',
      'allure-results-integration'
    ];
    
    tempDirs.forEach(dir => {
      const fullPath = path.join(process.cwd(), 'test-scripts', dir);
      if (fs.existsSync(fullPath)) {
        // Keep the directories but clean old files
        const files = fs.readdirSync(fullPath);
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 7); // Keep files for 7 days
        
        files.forEach(file => {
          const filePath = path.join(fullPath, file);
          const stats = fs.statSync(filePath);
          if (stats.mtime < cutoffDate) {
            fs.unlinkSync(filePath);
          }
        });
      }
    });
    
    console.log('✅ Temporary files cleaned up');
    
  } catch (error) {
    console.warn('⚠️ Temporary file cleanup failed:', error);
  }
}

async function resetEnvironment() {
  console.log('🔄 Resetting environment...');
  
  // Reset test-specific environment variables
  delete process.env.INTEGRATION_TEST_DATA;
  delete process.env.NEXT_PUBLIC_PERFORMANCE_MONITORING;
  delete process.env.NEXT_PUBLIC_ERROR_TRACKING;
  
  // Reset to default test mode if needed
  if (process.env.NEXT_PUBLIC_TEST_MODE === 'integration') {
    process.env.NEXT_PUBLIC_TEST_MODE = 'test';
  }
  
  console.log('✅ Environment reset');
}

async function finalHealthCheck() {
  console.log('🏥 Final health check...');
  
  try {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    // Quick health check to ensure application is still responsive
    await page.goto('http://localhost:3000', { timeout: 10000 });
    const title = await page.title();
    
    if (title) {
      console.log('✅ Application remains healthy after integration tests');
    } else {
      console.warn('⚠️ Application health check inconclusive');
    }
    
    await browser.close();
    
  } catch (error) {
    console.warn('⚠️ Final health check failed:', error);
  }
}

export default globalTeardown;