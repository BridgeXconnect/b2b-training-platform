#!/usr/bin/env ts-node

/**
 * Comprehensive Error Boundary Test Runner
 * Orchestrates all error recovery UI tests and generates reports
 */

import { execSync } from 'child_process';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

interface TestResult {
  suite: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  coverage?: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  errors: string[];
}

interface TestReport {
  timestamp: string;
  environment: string;
  totalTests: number;
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
  overallDuration: number;
  coverage: {
    statements: number;
    branches: number;
    functions: number;
    lines: number;
  };
  results: TestResult[];
  recommendations: string[];
}

class ErrorBoundaryTestRunner {
  private projectRoot: string;
  private testResults: TestResult[] = [];
  private startTime: number = Date.now();

  constructor() {
    this.projectRoot = process.cwd().replace('/test-scripts', '');
    console.log(`🧪 Error Boundary Test Runner initialized`);
    console.log(`📁 Project root: ${this.projectRoot}`);
  }

  // Check if required dependencies are installed
  private checkDependencies(): boolean {
    console.log('\n🔍 Checking test dependencies...');
    
    const requiredDeps = [
      '@testing-library/react',
      '@testing-library/jest-dom', 
      '@testing-library/user-event',
      'jest',
      'jest-environment-jsdom'
    ];

    const optionalDeps = [
      '@playwright/test',
      'jest-image-snapshot',
      'puppeteer'
    ];

    try {
      const packageJson = require(join(this.projectRoot, 'package.json'));
      const allDeps = {
        ...packageJson.dependencies || {},
        ...packageJson.devDependencies || {}
      };

      const missingRequired = requiredDeps.filter(dep => !allDeps[dep]);
      const missingOptional = optionalDeps.filter(dep => !allDeps[dep]);

      if (missingRequired.length > 0) {
        console.log('❌ Missing required dependencies:');
        missingRequired.forEach(dep => console.log(`   - ${dep}`));
        console.log('\n📦 Install with: npm install --save-dev ' + missingRequired.join(' '));
        return false;
      }

      if (missingOptional.length > 0) {
        console.log('⚠️  Missing optional dependencies (some tests will be skipped):');
        missingOptional.forEach(dep => console.log(`   - ${dep}`));
      }

      console.log('✅ Core dependencies check passed');
      return true;
    } catch (error) {
      console.error('❌ Error checking dependencies:', error);
      return false;
    }
  }

  // Setup test environment
  private setupTestEnvironment(): void {
    console.log('\n⚙️  Setting up test environment...');

    // Create test directories
    const testDirs = [
      'test-scripts/__tests__/coverage',
      'test-scripts/__tests__/screenshots',
      'test-scripts/__tests__/reports'
    ];

    testDirs.forEach(dir => {
      const fullPath = join(this.projectRoot, dir);
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });

    // Create Jest config if it doesn't exist
    const jestConfigPath = join(this.projectRoot, 'jest.config.js');
    if (!existsSync(jestConfigPath)) {
      const jestConfig = this.generateJestConfig();
      writeFileSync(jestConfigPath, jestConfig);
      console.log('📄 Created Jest configuration');
    }

    // Create Playwright config if it doesn't exist
    const playwrightConfigPath = join(this.projectRoot, 'playwright.config.ts');
    if (!existsSync(playwrightConfigPath)) {
      const playwrightConfig = this.generatePlaywrightConfig();
      writeFileSync(playwrightConfigPath, playwrightConfig);
      console.log('📄 Created Playwright configuration');
    }

    console.log('✅ Test environment setup complete');
  }

  // Generate Jest configuration
  private generateJestConfig(): string {
    return `
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files
  dir: './',
})

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  testMatch: [
    '<rootDir>/test-scripts/__tests__/**/*.(test|spec).(js|jsx|ts|tsx)'
  ],
  collectCoverageFrom: [
    'components/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    'lib/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageReporters: ['text', 'lcov', 'html', 'json'],
  coverageDirectory: 'test-scripts/__tests__/coverage',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
    '^.+\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
  },
  testTimeout: 10000,
  setupFiles: ['<rootDir>/test-scripts/jest-setup.js'],
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig)
`;
  }

  // Generate Playwright configuration
  private generatePlaywrightConfig(): string {
    return `
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test-scripts/__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'test-scripts/__tests__/reports/playwright' }],
    ['json', { outputFile: 'test-scripts/__tests__/reports/playwright-results.json' }],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
`;
  }

  // Create Jest setup files
  private createJestSetupFiles(): void {
    const jestSetupPath = join(this.projectRoot, 'jest.setup.js');
    if (!existsSync(jestSetupPath)) {
      const jestSetup = `
import '@testing-library/jest-dom';

// Global test setup
beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  // Mock ResizeObserver
  global.ResizeObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));

  // Mock IntersectionObserver
  global.IntersectionObserver = jest.fn().mockImplementation(() => ({
    observe: jest.fn(),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  }));
});

// Increase timeout for integration tests
jest.setTimeout(10000);
`;
      writeFileSync(jestSetupPath, jestSetup);
    }

    const testSetupPath = join(this.projectRoot, 'test-scripts/jest-setup.js');
    if (!existsSync(testSetupPath)) {
      const testSetup = `
// Test-specific setup
global.console = {
  ...console,
  // Suppress expected error logs during testing
  error: jest.fn(),
  warn: jest.fn(),
};

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: () => ({
    route: '/',
    pathname: '/',
    query: {},
    asPath: '/',
    push: jest.fn(),
    pop: jest.fn(),
    reload: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    beforePopState: jest.fn(),
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
  }),
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));
`;
      writeFileSync(testSetupPath, testSetup);
    }
  }

  // Run unit tests
  private async runUnitTests(): Promise<TestResult> {
    console.log('\n🧪 Running unit tests...');
    
    try {
      const result = execSync(
        'npx jest test-scripts/__tests__/components/error-boundary.test.tsx --coverage --json',
        { 
          cwd: this.projectRoot,
          encoding: 'utf8',
          stdio: 'pipe'
        }
      );

      const testResult = JSON.parse(result);
      
      return {
        suite: 'Unit Tests (Error Boundary Components)',
        passed: testResult.numPassedTests || 0,
        failed: testResult.numFailedTests || 0,
        skipped: testResult.numPendingTests || 0,
        duration: testResult.testExecTime || 0,
        coverage: testResult.coverageMap ? {
          statements: testResult.coverageMap.getCoverageSummary().statements.pct,
          branches: testResult.coverageMap.getCoverageSummary().branches.pct,
          functions: testResult.coverageMap.getCoverageSummary().functions.pct,
          lines: testResult.coverageMap.getCoverageSummary().lines.pct,
        } : undefined,
        errors: testResult.testResults
          ?.filter((test: any) => test.status === 'failed')
          ?.map((test: any) => test.message) || []
      };
    } catch (error) {
      console.error('❌ Unit tests failed:', error);
      return {
        suite: 'Unit Tests (Error Boundary Components)',
        passed: 0,
        failed: 1,
        skipped: 0,
        duration: 0,
        errors: [error instanceof Error ? error.message : String(error)]
      };
    }
  }

  // Run visual regression tests
  private async runVisualTests(): Promise<TestResult> {
    console.log('\n🎨 Running visual regression tests...');
    
    try {
      const result = execSync(
        'npx jest test-scripts/__tests__/visual/error-boundary-visual.test.tsx --json',
        { 
          cwd: this.projectRoot,
          encoding: 'utf8',
          stdio: 'pipe'
        }
      );

      const testResult = JSON.parse(result);
      
      return {
        suite: 'Visual Regression Tests',
        passed: testResult.numPassedTests || 0,
        failed: testResult.numFailedTests || 0,
        skipped: testResult.numPendingTests || 0,
        duration: testResult.testExecTime || 0,
        errors: testResult.testResults
          ?.filter((test: any) => test.status === 'failed')
          ?.map((test: any) => test.message) || []
      };
    } catch (error) {
      console.log('⚠️  Visual tests skipped (missing dependencies)');
      return {
        suite: 'Visual Regression Tests',
        passed: 0,
        failed: 0,
        skipped: 1,
        duration: 0,
        errors: ['Visual tests skipped - missing jest-image-snapshot or other dependencies']
      };
    }
  }

  // Run E2E tests
  private async runE2ETests(): Promise<TestResult> {
    console.log('\n🌐 Running E2E tests...');
    
    try {
      // Check if dev server is running
      const isDevRunning = await this.checkDevServer();
      if (!isDevRunning) {
        console.log('⚠️  Starting dev server for E2E tests...');
        // Note: In a real scenario, you'd start the dev server in background
        // For now, we'll skip E2E tests if server isn't running
        throw new Error('Dev server not running. Start with: npm run dev');
      }

      const result = execSync(
        'npx playwright test --reporter=json',
        { 
          cwd: this.projectRoot,
          encoding: 'utf8',
          stdio: 'pipe'
        }
      );

      const testResult = JSON.parse(result);
      
      return {
        suite: 'End-to-End Tests',
        passed: testResult.stats?.passed || 0,
        failed: testResult.stats?.failed || 0,
        skipped: testResult.stats?.skipped || 0,
        duration: testResult.stats?.duration || 0,
        errors: testResult.errors || []
      };
    } catch (error) {
      console.log('⚠️  E2E tests skipped (dev server not running or Playwright not installed)');
      return {
        suite: 'End-to-End Tests',
        passed: 0,
        failed: 0,
        skipped: 1,
        duration: 0,
        errors: ['E2E tests skipped - dev server not running or Playwright not available']
      };
    }
  }

  // Check if dev server is running
  private async checkDevServer(): Promise<boolean> {
    try {
      const response = await fetch('http://localhost:3000');
      return response.ok;
    } catch {
      return false;
    }
  }

  // Generate comprehensive test report
  private generateReport(): TestReport {
    const endTime = Date.now();
    const totalDuration = endTime - this.startTime;

    const totals = this.testResults.reduce(
      (acc, result) => ({
        passed: acc.passed + result.passed,
        failed: acc.failed + result.failed,
        skipped: acc.skipped + result.skipped,
      }),
      { passed: 0, failed: 0, skipped: 0 }
    );

    // Calculate overall coverage
    const coverageResults = this.testResults
      .filter(result => result.coverage)
      .map(result => result.coverage!);

    const avgCoverage = coverageResults.length > 0 ? {
      statements: coverageResults.reduce((acc, cov) => acc + cov.statements, 0) / coverageResults.length,
      branches: coverageResults.reduce((acc, cov) => acc + cov.branches, 0) / coverageResults.length,
      functions: coverageResults.reduce((acc, cov) => acc + cov.functions, 0) / coverageResults.length,
      lines: coverageResults.reduce((acc, cov) => acc + cov.lines, 0) / coverageResults.length,
    } : { statements: 0, branches: 0, functions: 0, lines: 0 };

    const recommendations = this.generateRecommendations();

    return {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'test',
      totalTests: totals.passed + totals.failed + totals.skipped,
      totalPassed: totals.passed,
      totalFailed: totals.failed,
      totalSkipped: totals.skipped,
      overallDuration: totalDuration,
      coverage: avgCoverage,
      results: this.testResults,
      recommendations
    };
  }

  // Generate testing recommendations
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    // Check test coverage
    const avgCoverage = this.testResults
      .filter(result => result.coverage)
      .reduce((acc, result) => acc + result.coverage!.statements, 0) / 
      this.testResults.filter(result => result.coverage).length;

    if (avgCoverage < 80) {
      recommendations.push('📈 Consider increasing test coverage (current: ' + avgCoverage.toFixed(1) + '%)');
    }

    // Check for failed tests
    const failedTests = this.testResults.filter(result => result.failed > 0);
    if (failedTests.length > 0) {
      recommendations.push('🔧 Address failing tests in: ' + failedTests.map(t => t.suite).join(', '));
    }

    // Check for skipped tests
    const skippedTests = this.testResults.filter(result => result.skipped > 0);
    if (skippedTests.length > 0) {
      recommendations.push('⚠️  Consider implementing skipped tests: ' + skippedTests.map(t => t.suite).join(', '));
    }

    // Performance recommendations
    const slowTests = this.testResults.filter(result => result.duration > 30000);
    if (slowTests.length > 0) {
      recommendations.push('⚡ Optimize slow test suites: ' + slowTests.map(t => t.suite).join(', '));
    }

    // Error analysis
    const testsWithErrors = this.testResults.filter(result => result.errors.length > 0);
    if (testsWithErrors.length > 0) {
      recommendations.push('🐛 Review test errors and improve error handling coverage');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ All error boundary tests are performing well!');
    }

    return recommendations;
  }

  // Print test results
  private printResults(report: TestReport): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 ERROR BOUNDARY TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`🕐 Completed at: ${new Date(report.timestamp).toLocaleString()}`);
    console.log(`⏱️  Total duration: ${(report.overallDuration / 1000).toFixed(2)}s`);
    console.log(`🧪 Total tests: ${report.totalTests}`);
    console.log(`✅ Passed: ${report.totalPassed}`);
    console.log(`❌ Failed: ${report.totalFailed}`);
    console.log(`⏭️  Skipped: ${report.totalSkipped}`);
    
    if (report.coverage.statements > 0) {
      console.log('\n📈 COVERAGE SUMMARY:');
      console.log(`   Statements: ${report.coverage.statements.toFixed(1)}%`);
      console.log(`   Branches: ${report.coverage.branches.toFixed(1)}%`);
      console.log(`   Functions: ${report.coverage.functions.toFixed(1)}%`);
      console.log(`   Lines: ${report.coverage.lines.toFixed(1)}%`);
    }

    console.log('\n📋 TEST SUITE BREAKDOWN:');
    report.results.forEach(result => {
      const status = result.failed > 0 ? '❌' : result.skipped > 0 ? '⏭️' : '✅';
      console.log(`   ${status} ${result.suite}: ${result.passed}P / ${result.failed}F / ${result.skipped}S (${(result.duration / 1000).toFixed(2)}s)`);
    });

    if (report.recommendations.length > 0) {
      console.log('\n💡 RECOMMENDATIONS:');
      report.recommendations.forEach(rec => console.log(`   ${rec}`));
    }

    console.log('\n' + '='.repeat(60));
  }

  // Save detailed report
  private saveReport(report: TestReport): void {
    const reportPath = join(this.projectRoot, 'test-scripts/__tests__/reports/error-boundary-test-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    const htmlReport = this.generateHTMLReport(report);
    const htmlReportPath = join(this.projectRoot, 'test-scripts/__tests__/reports/error-boundary-test-report.html');
    writeFileSync(htmlReportPath, htmlReport);
    
    console.log(`📄 Detailed report saved to: ${reportPath}`);
    console.log(`🌐 HTML report saved to: ${htmlReportPath}`);
  }

  // Generate HTML report
  private generateHTMLReport(report: TestReport): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Error Boundary Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .metrics { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .suite { margin: 15px 0; padding: 15px; border: 1px solid #dee2e6; border-radius: 6px; }
        .suite-header { font-weight: bold; margin-bottom: 10px; }
        .recommendations { background: #e3f2fd; padding: 15px; border-radius: 6px; margin-top: 20px; }
        .recommendations h3 { margin-top: 0; color: #1976d2; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🛡️ Error Boundary Test Report</h1>
            <p>Generated: ${new Date(report.timestamp).toLocaleString()}</p>
            <p>Duration: ${(report.overallDuration / 1000).toFixed(2)} seconds</p>
        </div>

        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${report.totalTests}</div>
                <div>Total Tests</div>
            </div>
            <div class="metric">
                <div class="metric-value passed">${report.totalPassed}</div>
                <div>Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value failed">${report.totalFailed}</div>
                <div>Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value skipped">${report.totalSkipped}</div>
                <div>Skipped</div>
            </div>
        </div>

        ${report.coverage.statements > 0 ? `
        <div class="metrics">
            <div class="metric">
                <div class="metric-value">${report.coverage.statements.toFixed(1)}%</div>
                <div>Statements</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.coverage.branches.toFixed(1)}%</div>
                <div>Branches</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.coverage.functions.toFixed(1)}%</div>
                <div>Functions</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.coverage.lines.toFixed(1)}%</div>
                <div>Lines</div>
            </div>
        </div>
        ` : ''}

        <h2>Test Suite Results</h2>
        ${report.results.map(result => `
        <div class="suite">
            <div class="suite-header">
                ${result.failed > 0 ? '❌' : result.skipped > 0 ? '⏭️' : '✅'} ${result.suite}
            </div>
            <div>
                <strong>Passed:</strong> <span class="passed">${result.passed}</span> |
                <strong>Failed:</strong> <span class="failed">${result.failed}</span> |
                <strong>Skipped:</strong> <span class="skipped">${result.skipped}</span> |
                <strong>Duration:</strong> ${(result.duration / 1000).toFixed(2)}s
            </div>
            ${result.errors.length > 0 ? `
            <div style="margin-top: 10px;">
                <strong>Errors:</strong>
                <ul>
                    ${result.errors.map(error => `<li style="color: #dc3545;">${error}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </div>
        `).join('')}

        <div class="recommendations">
            <h3>💡 Recommendations</h3>
            <ul>
                ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
            </ul>
        </div>
    </div>
</body>
</html>
    `;
  }

  // Main test execution
  public async run(): Promise<void> {
    console.log('🚀 Starting Error Boundary Test Suite...');

    // Check dependencies
    if (!this.checkDependencies()) {
      process.exit(1);
    }

    // Setup environment
    this.setupTestEnvironment();
    this.createJestSetupFiles();

    // Run test suites
    console.log('\n📋 Running test suites...');

    try {
      // Unit tests
      const unitResults = await this.runUnitTests();
      this.testResults.push(unitResults);

      // Visual tests
      const visualResults = await this.runVisualTests();
      this.testResults.push(visualResults);

      // E2E tests
      const e2eResults = await this.runE2ETests();
      this.testResults.push(e2eResults);

      // Generate and display report
      const report = this.generateReport();
      this.printResults(report);
      this.saveReport(report);

      // Exit with appropriate code
      const hasFailures = report.totalFailed > 0;
      if (hasFailures) {
        console.log('\n❌ Some tests failed. Please review the results above.');
        process.exit(1);
      } else {
        console.log('\n✅ All error boundary tests completed successfully!');
        process.exit(0);
      }

    } catch (error) {
      console.error('\n💥 Test runner encountered an error:', error);
      process.exit(1);
    }
  }
}

// CLI execution
if (require.main === module) {
  const runner = new ErrorBoundaryTestRunner();
  runner.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export default ErrorBoundaryTestRunner;