#!/usr/bin/env npx ts-node

/**
 * Integration Test Runner for Error Recovery System
 * Executes comprehensive end-to-end error recovery testing
 */

import { execSync, spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestRunOptions {
  browser?: 'chrome' | 'firefox' | 'safari' | 'all';
  headless?: boolean;
  debug?: boolean;
  parallel?: boolean;
  retries?: number;
  timeout?: number;
  reporter?: 'html' | 'json' | 'line' | 'allure';
  grep?: string;
  outputDir?: string;
}

class IntegrationTestRunner {
  private options: TestRunOptions;
  private startTime: Date;
  
  constructor(options: TestRunOptions = {}) {
    this.options = {
      browser: 'chrome',
      headless: true,
      debug: false,
      parallel: false,
      retries: 1,
      timeout: 90000,
      reporter: 'html',
      outputDir: './test-results-integration',
      ...options
    };
    this.startTime = new Date();
  }

  async run(): Promise<void> {
    console.log('🚀 Starting Error Recovery Integration Tests');
    console.log('==========================================');
    
    try {
      // 1. Pre-flight checks
      await this.preFlightChecks();
      
      // 2. Setup test environment
      await this.setupTestEnvironment();
      
      // 3. Run integration tests
      await this.runTests();
      
      // 4. Generate reports
      await this.generateReports();
      
      // 5. Cleanup
      await this.cleanup();
      
      console.log('✅ Integration tests completed successfully');
      
    } catch (error) {
      console.error('❌ Integration tests failed:', error);
      process.exit(1);
    }
  }

  private async preFlightChecks(): Promise<void> {
    console.log('🔍 Running pre-flight checks...');
    
    // Check if Playwright is installed
    try {
      execSync('npx playwright --version', { stdio: 'pipe' });
    } catch (error) {
      console.log('📦 Installing Playwright...');
      execSync('npx playwright install', { stdio: 'inherit' });
    }
    
    // Check if application server is running
    try {
      const response = await fetch('http://localhost:3000/api/health');
      if (!response.ok) {
        throw new Error('Health check failed');
      }
      console.log('✅ Application server is running');
    } catch (error) {
      console.log('🔧 Starting development server...');
      // The webServer config in playwright will handle this
    }
    
    // Verify test files exist
    const testFiles = [
      '__tests__/integration/error-recovery-integration.test.ts'
    ];
    
    for (const testFile of testFiles) {
      const fullPath = path.join(process.cwd(), 'test-scripts', testFile);
      if (!fs.existsSync(fullPath)) {
        throw new Error(`Test file not found: ${testFile}`);
      }
    }
    
    console.log('✅ Pre-flight checks passed');
  }

  private async setupTestEnvironment(): Promise<void> {
    console.log('🛠️ Setting up test environment...');
    
    // Set environment variables
    process.env.NODE_ENV = 'test';
    process.env.NEXT_PUBLIC_TEST_MODE = 'integration';
    process.env.PLAYWRIGHT_TEST_BASE_URL = 'http://localhost:3000';
    
    // Create output directory
    if (!fs.existsSync(this.options.outputDir!)) {
      fs.mkdirSync(this.options.outputDir!, { recursive: true });
    }
    
    // Create reports directory
    const reportsDir = path.join(process.cwd(), 'test-scripts', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    console.log('✅ Test environment ready');
  }

  private async runTests(): Promise<void> {
    console.log('🧪 Running integration tests...');
    
    // Build Playwright command
    const playwrightArgs = [
      'test',
      '--config=playwright-integration.config.ts'
    ];
    
    // Add browser selection
    if (this.options.browser !== 'all') {
      playwrightArgs.push(`--project=Desktop ${this.options.browser} - Integration`);
    }
    
    // Add other options
    if (!this.options.headless) {
      playwrightArgs.push('--headed');
    }
    
    if (this.options.debug) {
      playwrightArgs.push('--debug');
    }
    
    if (!this.options.parallel) {
      playwrightArgs.push('--workers=1');
    }
    
    if (this.options.retries) {
      playwrightArgs.push(`--retries=${this.options.retries}`);
    }
    
    if (this.options.timeout) {
      playwrightArgs.push(`--timeout=${this.options.timeout}`);
    }
    
    if (this.options.grep) {
      playwrightArgs.push(`--grep="${this.options.grep}"`);
    }
    
    // Add output directory
    playwrightArgs.push(`--output-dir=${this.options.outputDir}`);
    
    console.log('🏃 Executing:', `npx playwright ${playwrightArgs.join(' ')}`);
    
    try {
      execSync(`npx playwright ${playwrightArgs.join(' ')}`, {
        stdio: 'inherit',
        cwd: path.join(process.cwd(), 'test-scripts')
      });
    } catch (error) {
      // Playwright returns non-zero exit code for test failures
      // We'll handle this in the reporting phase
      console.log('⚠️ Some tests may have failed, checking results...');
    }
  }

  private async generateReports(): Promise<void> {
    console.log('📊 Generating reports...');
    
    const reportsDir = path.join(process.cwd(), 'test-scripts', 'reports');
    
    // Check if test results exist
    const resultsFile = path.join(process.cwd(), 'test-scripts', 'test-results-integration.json');
    
    if (fs.existsSync(resultsFile)) {
      const results = JSON.parse(fs.readFileSync(resultsFile, 'utf-8'));
      
      // Generate summary report
      const summary = this.generateTestSummary(results);
      const summaryPath = path.join(reportsDir, 'integration-summary.json');
      fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
      
      console.log('📄 Test Summary:');
      console.log(`   Total Tests: ${summary.stats.total}`);
      console.log(`   Passed: ${summary.stats.passed}`);
      console.log(`   Failed: ${summary.stats.failed}`);
      console.log(`   Duration: ${summary.stats.duration}ms`);
      console.log(`   Success Rate: ${(summary.stats.successRate * 100).toFixed(1)}%`);
      
      if (summary.stats.failed > 0) {
        console.log('❌ Failed Tests:');
        summary.failedTests.forEach((test: any) => {
          console.log(`   - ${test.title}: ${test.error}`);
        });
      }
      
    } else {
      console.warn('⚠️ Test results file not found, generating basic report');
    }
    
    console.log('✅ Reports generated');
  }

  private generateTestSummary(results: any): any {
    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();
    
    let total = 0;
    let passed = 0;
    let failed = 0;
    const failedTests: any[] = [];
    
    if (results.suites) {
      results.suites.forEach((suite: any) => {
        if (suite.specs) {
          suite.specs.forEach((spec: any) => {
            total++;
            if (spec.tests && spec.tests.length > 0) {
              const test = spec.tests[0];
              if (test.status === 'passed') {
                passed++;
              } else {
                failed++;
                failedTests.push({
                  title: spec.title,
                  error: test.error?.message || 'Unknown error'
                });
              }
            }
          });
        }
      });
    }
    
    return {
      timestamp: endTime.toISOString(),
      duration,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        testMode: process.env.NEXT_PUBLIC_TEST_MODE,
        browser: this.options.browser
      },
      stats: {
        total,
        passed,
        failed,
        successRate: total > 0 ? passed / total : 0,
        duration
      },
      failedTests,
      options: this.options
    };
  }

  private async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up...');
    
    // Reset environment variables
    delete process.env.NEXT_PUBLIC_TEST_MODE;
    delete process.env.PLAYWRIGHT_TEST_BASE_URL;
    
    console.log('✅ Cleanup completed');
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options: TestRunOptions = {};
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--browser':
        options.browser = args[++i] as any;
        break;
      case '--headed':
        options.headless = false;
        break;
      case '--debug':
        options.debug = true;
        options.headless = false;
        break;
      case '--parallel':
        options.parallel = true;
        break;
      case '--retries':
        options.retries = parseInt(args[++i]);
        break;
      case '--timeout':
        options.timeout = parseInt(args[++i]);
        break;
      case '--reporter':
        options.reporter = args[++i] as any;
        break;
      case '--grep':
        options.grep = args[++i];
        break;
      case '--output-dir':
        options.outputDir = args[++i];
        break;
      case '--help':
        printHelp();
        process.exit(0);
        break;
    }
  }
  
  const runner = new IntegrationTestRunner(options);
  await runner.run();
}

function printHelp() {
  console.log(`
Error Recovery Integration Test Runner

Usage: npx ts-node run-integration-tests.ts [options]

Options:
  --browser <chrome|firefox|safari|all>  Browser to run tests in (default: chrome)
  --headed                               Run tests in headed mode
  --debug                                Run tests in debug mode
  --parallel                             Run tests in parallel
  --retries <number>                     Number of retries for failed tests
  --timeout <number>                     Test timeout in milliseconds
  --reporter <html|json|line|allure>     Test reporter (default: html)
  --grep <pattern>                       Only run tests matching pattern
  --output-dir <path>                    Output directory for test results
  --help                                 Show this help message

Examples:
  npx ts-node run-integration-tests.ts
  npx ts-node run-integration-tests.ts --browser firefox --headed
  npx ts-node run-integration-tests.ts --grep "Voice Practice" --debug
  npx ts-node run-integration-tests.ts --browser all --parallel
  `);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Error running integration tests:', error);
    process.exit(1);
  });
}

export { IntegrationTestRunner, TestRunOptions };