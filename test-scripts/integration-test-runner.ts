/**
 * Integration Test Runner for Error Recovery Systems
 * Comprehensive test orchestration with parallel execution and detailed reporting
 */

import { execSync, spawn, ChildProcess } from 'child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { performance } from 'perf_hooks';

// Test configuration types
interface TestConfig {
  suites: TestSuite[];
  parallel: boolean;
  maxWorkers: number;
  timeout: number;
  retries: number;
  reportFormat: 'html' | 'json' | 'both';
  coverage: boolean;
}

interface TestSuite {
  name: string;
  pattern: string;
  dependencies: string[];
  environment: Record<string, string>;
  tags: string[];
  priority: number;
}

interface TestResult {
  suite: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  errors: string[];
  coverage?: number;
  details: any;
}

class IntegrationTestRunner {
  private projectRoot: string;
  private testResults: TestResult[] = [];
  private runningProcesses: Map<string, ChildProcess> = new Map();
  private config: TestConfig;

  constructor() {
    this.projectRoot = resolve(__dirname, '..');
    this.config = this.loadConfig();
    this.ensureDirectories();
  }

  // Load test configuration
  private loadConfig(): TestConfig {
    const defaultConfig: TestConfig = {
      suites: [
        {
          name: 'Unit Tests - Error Boundaries',
          pattern: '__tests__/components/error-boundary.test.tsx',
          dependencies: ['jest', '@testing-library/react'],
          environment: { NODE_ENV: 'test' },
          tags: ['unit', 'error-boundary'],
          priority: 1
        },
        {
          name: 'Visual Regression Tests',
          pattern: '__tests__/visual/error-boundary-visual.test.tsx',
          dependencies: ['jest', 'puppeteer'],
          environment: { NODE_ENV: 'test' },
          tags: ['visual', 'regression'],
          priority: 2
        },
        {
          name: 'E2E Error Recovery Tests',
          pattern: '__tests__/e2e/error-recovery-flows.test.ts',
          dependencies: ['@playwright/test'],
          environment: { NODE_ENV: 'test' },
          tags: ['e2e', 'error-recovery'],
          priority: 3
        },
        {
          name: 'Integration Tests - Cross-System',
          pattern: '__tests__/integration/error-recovery-integration.test.ts',
          dependencies: ['@playwright/test'],
          environment: { NODE_ENV: 'test' },
          tags: ['integration', 'cross-system'],
          priority: 4
        }
      ],
      parallel: true,
      maxWorkers: 4,
      timeout: 300000, // 5 minutes
      retries: 2,
      reportFormat: 'both',
      coverage: true
    };

    // Try to load custom config
    const configPath = join(this.projectRoot, 'test-scripts/integration.config.json');
    if (existsSync(configPath)) {
      try {
        const customConfig = JSON.parse(readFileSync(configPath, 'utf-8'));
        return { ...defaultConfig, ...customConfig };
      } catch (error) {
        console.warn('Failed to load custom config, using defaults');
      }
    }

    return defaultConfig;
  }

  // Ensure required directories exist
  private ensureDirectories() {
    const dirs = [
      'test-scripts/__tests__/reports',
      'test-scripts/__tests__/coverage',
      'test-scripts/__tests__/screenshots',
      'test-scripts/__tests__/artifacts'
    ];

    dirs.forEach(dir => {
      const fullPath = join(this.projectRoot, dir);
      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
      }
    });
  }

  // Validate test environment
  async validateEnvironment(): Promise<boolean> {
    this.log('Validating test environment...', 'info');

    const validations = [
      this.validateNodeVersion(),
      this.validateDependencies(),
      this.validateConfiguration(),
      this.validateServerAvailability()
    ];

    const results = await Promise.all(validations);
    const allValid = results.every(result => result);

    if (allValid) {
      this.log('✅ Environment validation passed', 'success');
    } else {
      this.log('❌ Environment validation failed', 'error');
    }

    return allValid;
  }

  private async validateNodeVersion(): Promise<boolean> {
    try {
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);
      
      if (majorVersion >= 18) {
        this.log(`✅ Node.js version: ${nodeVersion}`, 'success');
        return true;
      } else {
        this.log(`❌ Node.js version ${nodeVersion} is too old. Requires >= 18.x`, 'error');
        return false;
      }
    } catch (error) {
      this.log(`❌ Failed to check Node.js version: ${error}`, 'error');
      return false;
    }
  }

  private async validateDependencies(): Promise<boolean> {
    const requiredPackages = [
      '@playwright/test',
      'jest',
      '@testing-library/react',
      '@testing-library/jest-dom'
    ];

    let allInstalled = true;

    for (const pkg of requiredPackages) {
      try {
        require.resolve(pkg);
        this.log(`✅ ${pkg} is installed`, 'success');
      } catch (error) {
        this.log(`❌ ${pkg} is not installed`, 'error');
        allInstalled = false;
      }
    }

    return allInstalled;
  }

  private async validateConfiguration(): Promise<boolean> {
    const configFiles = [
      'jest.config.js',
      'playwright.config.ts'
    ];

    let allValid = true;

    for (const configFile of configFiles) {
      const configPath = join(this.projectRoot, configFile);
      if (existsSync(configPath)) {
        this.log(`✅ ${configFile} found`, 'success');
      } else {
        this.log(`⚠️  ${configFile} not found, will create default`, 'warning');
        await this.createDefaultConfig(configFile);
      }
    }

    return allValid;
  }

  private async validateServerAvailability(): Promise<boolean> {
    // Check if development server is available for E2E tests
    try {
      const response = await fetch('http://localhost:3000/api/health').catch(() => null);
      if (response?.ok) {
        this.log('✅ Development server is available', 'success');
        return true;
      } else {
        this.log('⚠️  Development server not available, will start for E2E tests', 'warning');
        return false;
      }
    } catch (error) {
      this.log('⚠️  Cannot check server availability', 'warning');
      return false;
    }
  }

  // Create default configuration files
  private async createDefaultConfig(configFile: string) {
    const configs = {
      'jest.config.js': `
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

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
  ],
  coverageDirectory: 'test-scripts/__tests__/coverage',
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testTimeout: 30000,
}

module.exports = createJestConfig(customJestConfig)
      `,
      'playwright.config.ts': `
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test-scripts/__tests__',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
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
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
      `
    };

    const configPath = join(this.projectRoot, configFile);
    writeFileSync(configPath, configs[configFile as keyof typeof configs]);
    this.log(`✅ Created default ${configFile}`, 'success');
  }

  // Run all test suites
  async runAllTests(): Promise<void> {
    this.log('🚀 Starting comprehensive integration test suite', 'info');
    
    const startTime = performance.now();
    
    try {
      // Sort suites by priority
      const sortedSuites = this.config.suites.sort((a, b) => a.priority - b.priority);
      
      if (this.config.parallel) {
        await this.runTestsParallel(sortedSuites);
      } else {
        await this.runTestsSequential(sortedSuites);
      }
      
      const endTime = performance.now();
      const totalDuration = endTime - startTime;
      
      await this.generateFinalReport(totalDuration);
      
    } catch (error) {
      this.log(`❌ Test execution failed: ${error}`, 'error');
      throw error;
    }
  }

  // Run tests in parallel
  private async runTestsParallel(suites: TestSuite[]): Promise<void> {
    this.log(`Running ${suites.length} test suites in parallel (max ${this.config.maxWorkers} workers)`, 'info');
    
    const chunks = this.chunkArray(suites, this.config.maxWorkers);
    
    for (const chunk of chunks) {
      const promises = chunk.map(suite => this.runTestSuite(suite));
      await Promise.allSettled(promises);
    }
  }

  // Run tests sequentially
  private async runTestsSequential(suites: TestSuite[]): Promise<void> {
    this.log(`Running ${suites.length} test suites sequentially`, 'info');
    
    for (const suite of suites) {
      await this.runTestSuite(suite);
    }
  }

  // Run individual test suite
  private async runTestSuite(suite: TestSuite): Promise<TestResult> {
    this.log(`🧪 Running: ${suite.name}`, 'info');
    
    const startTime = performance.now();
    const result: TestResult = {
      suite: suite.name,
      status: 'failed',
      duration: 0,
      errors: [],
      details: {}
    };

    try {
      // Set environment variables
      const env = { ...process.env, ...suite.environment };
      
      // Determine test command
      const command = this.getTestCommand(suite);
      
      // Execute test
      const output = await this.executeCommand(command, env);
      
      result.status = 'passed';
      result.details = this.parseTestOutput(output, suite);
      
      this.log(`✅ ${suite.name} passed`, 'success');
      
    } catch (error) {
      result.status = 'failed';
      result.errors.push(error instanceof Error ? error.message : String(error));
      
      this.log(`❌ ${suite.name} failed: ${error}`, 'error');
    }
    
    const endTime = performance.now();
    result.duration = endTime - startTime;
    
    this.testResults.push(result);
    return result;
  }

  // Get appropriate test command for suite
  private getTestCommand(suite: TestSuite): string {
    const testPath = join('test-scripts', suite.pattern);
    
    if (suite.pattern.includes('.test.tsx') || suite.pattern.includes('components/')) {
      return `npx jest ${testPath} --verbose --coverage`;
    } else if (suite.pattern.includes('e2e/') || suite.pattern.includes('integration/')) {
      return `npx playwright test ${testPath}`;
    } else {
      return `npx jest ${testPath}`;
    }
  }

  // Execute command with proper error handling
  private async executeCommand(command: string, env: NodeJS.ProcessEnv): Promise<string> {
    return new Promise((resolve, reject) => {
      const child = spawn('bash', ['-c', command], {
        env,
        cwd: this.projectRoot,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Command failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });

      // Store process for potential cleanup
      this.runningProcesses.set(command, child);

      // Set timeout
      setTimeout(() => {
        if (!child.killed) {
          child.kill('SIGTERM');
          reject(new Error(`Command timeout after ${this.config.timeout}ms`));
        }
      }, this.config.timeout);
    });
  }

  // Parse test output for insights
  private parseTestOutput(output: string, suite: TestSuite): any {
    const details: any = {
      output: output.substring(0, 1000), // Truncate for storage
      testCount: 0,
      passedCount: 0,
      failedCount: 0
    };

    // Jest output parsing
    if (output.includes('Tests:')) {
      const testMatch = output.match(/Tests:\s+(\d+)\s+passed/);
      if (testMatch) {
        details.passedCount = parseInt(testMatch[1]);
      }
      
      const failMatch = output.match(/(\d+)\s+failed/);
      if (failMatch) {
        details.failedCount = parseInt(failMatch[1]);
      }
      
      details.testCount = details.passedCount + details.failedCount;
    }

    // Playwright output parsing
    if (output.includes('passing') || output.includes('failing')) {
      const passMatch = output.match(/(\d+)\s+passing/);
      if (passMatch) {
        details.passedCount = parseInt(passMatch[1]);
      }
    }

    // Coverage parsing
    const coverageMatch = output.match(/All files\s+\|\s+([\d.]+)/);
    if (coverageMatch) {
      details.coverage = parseFloat(coverageMatch[1]);
    }

    return details;
  }

  // Generate comprehensive final report
  private async generateFinalReport(totalDuration: number): Promise<void> {
    this.log('📊 Generating comprehensive test report...', 'info');
    
    const report = {
      metadata: {
        timestamp: new Date().toISOString(),
        duration: totalDuration,
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch
        },
        configuration: this.config
      },
      summary: this.generateSummary(),
      results: this.testResults,
      recommendations: this.generateRecommendations(),
      artifacts: await this.collectArtifacts()
    };

    // Save JSON report
    const jsonReportPath = join(this.projectRoot, 'test-scripts/__tests__/reports', `integration-test-report-${Date.now()}.json`);
    writeFileSync(jsonReportPath, JSON.stringify(report, null, 2));

    // Generate HTML report if requested
    if (this.config.reportFormat === 'html' || this.config.reportFormat === 'both') {
      await this.generateHtmlReport(report);
    }

    // Print summary to console
    this.printSummary(report.summary);
    
    this.log(`📄 Report saved: ${jsonReportPath}`, 'success');
  }

  // Generate test summary
  private generateSummary() {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.status === 'passed').length;
    const failed = this.testResults.filter(r => r.status === 'failed').length;
    const skipped = this.testResults.filter(r => r.status === 'skipped').length;
    
    const averageDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0) / total;
    const totalTestCount = this.testResults.reduce((sum, r) => sum + (r.details.testCount || 0), 0);
    const totalPassedTests = this.testResults.reduce((sum, r) => sum + (r.details.passedCount || 0), 0);
    
    return {
      totalSuites: total,
      passedSuites: passed,
      failedSuites: failed,
      skippedSuites: skipped,
      successRate: Math.round((passed / total) * 100),
      averageDuration: Math.round(averageDuration),
      totalTests: totalTestCount,
      totalPassedTests: totalPassedTests,
      testSuccessRate: totalTestCount > 0 ? Math.round((totalPassedTests / totalTestCount) * 100) : 0
    };
  }

  // Generate recommendations based on results
  private generateRecommendations(): string[] {
    const recommendations = [];
    const failedSuites = this.testResults.filter(r => r.status === 'failed');
    
    if (failedSuites.length > 0) {
      recommendations.push('🔧 Fix failing test suites before deployment');
      
      if (failedSuites.some(s => s.suite.includes('Unit Tests'))) {
        recommendations.push('🧪 Review unit test failures - may indicate component issues');
      }
      
      if (failedSuites.some(s => s.suite.includes('E2E'))) {
        recommendations.push('🌐 Check E2E test failures - may indicate integration issues');
      }
      
      if (failedSuites.some(s => s.suite.includes('Visual'))) {
        recommendations.push('🎨 Review visual regression failures - UI may have changed');
      }
    }
    
    // Performance recommendations
    const slowSuites = this.testResults.filter(r => r.duration > 60000); // 1 minute
    if (slowSuites.length > 0) {
      recommendations.push('⚡ Optimize slow test suites to improve CI/CD performance');
    }
    
    // Coverage recommendations
    const lowCoverageSuites = this.testResults.filter(r => r.details.coverage && r.details.coverage < 80);
    if (lowCoverageSuites.length > 0) {
      recommendations.push('📊 Improve test coverage in low-coverage areas');
    }
    
    // General recommendations
    recommendations.push('🔄 Run tests regularly to catch regressions early');
    recommendations.push('📱 Test on multiple devices and browsers for comprehensive coverage');
    recommendations.push('🔍 Monitor error rates in production to validate test scenarios');
    
    return recommendations;
  }

  // Collect test artifacts
  private async collectArtifacts(): Promise<any> {
    const artifacts = {
      screenshots: [],
      videos: [],
      reports: [],
      logs: []
    };

    // Collect Playwright artifacts
    const playwrightReportsDir = join(this.projectRoot, 'playwright-report');
    if (existsSync(playwrightReportsDir)) {
      artifacts.reports.push('playwright-report/index.html');
    }

    // Collect Jest coverage
    const coverageDir = join(this.projectRoot, 'test-scripts/__tests__/coverage');
    if (existsSync(join(coverageDir, 'lcov-report', 'index.html'))) {
      artifacts.reports.push('test-scripts/__tests__/coverage/lcov-report/index.html');
    }

    return artifacts;
  }

  // Generate HTML report
  private async generateHtmlReport(report: any): Promise<void> {
    const htmlTemplate = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Integration Test Report</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: #4f46e5; color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .content { padding: 30px; }
        .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; text-align: center; }
        .summary-card.success { border-color: #10b981; background: #ecfdf5; }
        .summary-card.warning { border-color: #f59e0b; background: #fffbeb; }
        .summary-card.error { border-color: #ef4444; background: #fef2f2; }
        .test-results { margin: 30px 0; }
        .test-result { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; margin: 10px 0; padding: 20px; }
        .test-result.passed { border-left: 4px solid #10b981; }
        .test-result.failed { border-left: 4px solid #ef4444; }
        .recommendations { background: #fef3c7; border: 1px solid #fbbf24; border-radius: 6px; padding: 20px; margin: 20px 0; }
        .timestamp { color: #6b7280; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Integration Test Report</h1>
            <p class="timestamp">Generated: ${report.metadata.timestamp}</p>
            <p>Duration: ${Math.round(report.metadata.duration / 1000)}s</p>
        </div>
        
        <div class="content">
            <div class="summary-grid">
                <div class="summary-card ${report.summary.successRate >= 90 ? 'success' : report.summary.successRate >= 70 ? 'warning' : 'error'}">
                    <h3>${report.summary.successRate}%</h3>
                    <p>Success Rate</p>
                </div>
                <div class="summary-card">
                    <h3>${report.summary.totalSuites}</h3>
                    <p>Total Suites</p>
                </div>
                <div class="summary-card success">
                    <h3>${report.summary.passedSuites}</h3>
                    <p>Passed Suites</p>
                </div>
                <div class="summary-card ${report.summary.failedSuites > 0 ? 'error' : ''}">
                    <h3>${report.summary.failedSuites}</h3>
                    <p>Failed Suites</p>
                </div>
            </div>
            
            <div class="test-results">
                <h2>📋 Test Results</h2>
                ${report.results.map((result: TestResult) => `
                    <div class="test-result ${result.status}">
                        <h3>${result.suite}</h3>
                        <p><strong>Status:</strong> ${result.status.toUpperCase()}</p>
                        <p><strong>Duration:</strong> ${Math.round(result.duration / 1000)}s</p>
                        ${result.details.testCount ? `<p><strong>Tests:</strong> ${result.details.passedCount}/${result.details.testCount} passed</p>` : ''}
                        ${result.details.coverage ? `<p><strong>Coverage:</strong> ${result.details.coverage}%</p>` : ''}
                        ${result.errors.length > 0 ? `<p><strong>Errors:</strong> ${result.errors.join(', ')}</p>` : ''}
                    </div>
                `).join('')}
            </div>
            
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

    const htmlReportPath = join(this.projectRoot, 'test-scripts/__tests__/reports', `integration-test-report-${Date.now()}.html`);
    writeFileSync(htmlReportPath, htmlTemplate);
    
    this.log(`📄 HTML report saved: ${htmlReportPath}`, 'success');
  }

  // Print summary to console
  private printSummary(summary: any): void {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 INTEGRATION TEST SUMMARY');
    console.log('='.repeat(80));
    console.log(`Total Suites: ${summary.totalSuites}`);
    console.log(`Passed: ${summary.passedSuites} (${summary.successRate}%)`);
    console.log(`Failed: ${summary.failedSuites}`);
    console.log(`Skipped: ${summary.skippedSuites}`);
    console.log(`Average Duration: ${summary.averageDuration}ms`);
    
    if (summary.totalTests > 0) {
      console.log(`Total Tests: ${summary.totalPassedTests}/${summary.totalTests} (${summary.testSuccessRate}%)`);
    }
    
    console.log('='.repeat(80));
    
    if (summary.failedSuites > 0) {
      console.log('\n❌ Some tests failed. Please review the detailed report.');
    } else {
      console.log('\n✅ All tests passed successfully!');
    }
  }

  // Utility methods
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }

  private log(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
    const colors = {
      info: '\x1b[34m',
      success: '\x1b[32m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      reset: '\x1b[0m'
    };
    
    const timestamp = new Date().toISOString();
    console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
  }

  // Cleanup resources
  cleanup(): void {
    this.log('🧹 Cleaning up test processes...', 'info');
    
    for (const [command, process] of this.runningProcesses) {
      if (!process.killed) {
        process.kill('SIGTERM');
        this.log(`Terminated: ${command}`, 'info');
      }
    }
    
    this.runningProcesses.clear();
  }

  // Main execution method
  async run(): Promise<void> {
    try {
      this.log('🚀 Starting Integration Test Runner', 'info');
      
      // Validate environment
      const isValid = await this.validateEnvironment();
      if (!isValid) {
        throw new Error('Environment validation failed');
      }
      
      // Run all tests
      await this.runAllTests();
      
      // Check if all tests passed
      const allPassed = this.testResults.every(result => result.status === 'passed');
      
      if (allPassed) {
        this.log('🎉 All integration tests passed!', 'success');
        process.exit(0);
      } else {
        this.log('❌ Some integration tests failed', 'error');
        process.exit(1);
      }
      
    } catch (error) {
      this.log(`💥 Integration test runner failed: ${error}`, 'error');
      process.exit(1);
    } finally {
      this.cleanup();
    }
  }
}

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, cleaning up...');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, cleaning up...');
  process.exit(1);
});

// Run if this file is executed directly
if (require.main === module) {
  const runner = new IntegrationTestRunner();
  runner.run();
}

export default IntegrationTestRunner;