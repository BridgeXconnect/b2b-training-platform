#!/usr/bin/env npx ts-node

/**
 * Integration Test System Validator
 * Validates that the comprehensive error recovery integration testing system is properly set up
 */

import * as fs from 'fs';
import * as path from 'path';

interface ValidationResult {
  component: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  message: string;
  details?: string[];
}

class IntegrationSystemValidator {
  private results: ValidationResult[] = [];
  private basePath: string;

  constructor() {
    this.basePath = process.cwd();
  }

  async validate(): Promise<void> {
    console.log('🔍 Validating Error Recovery Integration Test System');
    console.log('==================================================');

    // 1. File Structure Validation
    await this.validateFileStructure();

    // 2. Configuration Validation
    await this.validateConfigurations();

    // 3. Test Content Validation
    await this.validateTestContent();

    // 4. Dependencies Validation
    await this.validateDependencies();

    // 5. API Integration Validation
    await this.validateAPIIntegration();

    // 6. Error Recovery System Validation
    await this.validateErrorRecoverySystem();

    // Generate Report
    this.generateReport();
  }

  private async validateFileStructure(): Promise<void> {
    console.log('📁 Validating file structure...');

    const requiredFiles = [
      'test-scripts/__tests__/integration/error-recovery-integration.test.ts',
      'test-scripts/playwright-integration.config.ts',
      'test-scripts/integration-global-setup.ts',
      'test-scripts/integration-global-teardown.ts',
      'test-scripts/run-integration-tests.ts',
      'test-scripts/INTEGRATION_TESTING_GUIDE.md'
    ];

    for (const file of requiredFiles) {
      const fullPath = path.join(this.basePath, file);
      if (fs.existsSync(fullPath)) {
        this.results.push({
          component: 'File Structure',
          status: 'PASS',
          message: `✅ ${file} exists`
        });
      } else {
        this.results.push({
          component: 'File Structure',
          status: 'FAIL',
          message: `❌ ${file} missing`
        });
      }
    }

    // Check for required directories
    const requiredDirs = [
      'test-scripts/__tests__/integration',
      'test-scripts/reports'
    ];

    for (const dir of requiredDirs) {
      const fullPath = path.join(this.basePath, dir);
      if (fs.existsSync(fullPath)) {
        this.results.push({
          component: 'Directory Structure',
          status: 'PASS',
          message: `✅ ${dir} directory exists`
        });
      } else {
        // Create missing directories
        try {
          fs.mkdirSync(fullPath, { recursive: true });
          this.results.push({
            component: 'Directory Structure',
            status: 'WARN',
            message: `⚠️ ${dir} created (was missing)`
          });
        } catch (error) {
          this.results.push({
            component: 'Directory Structure',
            status: 'FAIL',
            message: `❌ Failed to create ${dir}`
          });
        }
      }
    }
  }

  private async validateConfigurations(): Promise<void> {
    console.log('⚙️ Validating configurations...');

    // Check Playwright config
    const playwrightConfigPath = path.join(this.basePath, 'test-scripts/playwright-integration.config.ts');
    if (fs.existsSync(playwrightConfigPath)) {
      const configContent = fs.readFileSync(playwrightConfigPath, 'utf-8');
      
      const configChecks = [
        { pattern: /testDir.*integration/, name: 'Test directory configuration' },
        { pattern: /webServer/, name: 'Development server configuration' },
        { pattern: /Desktop Chrome - Integration/, name: 'Chrome browser project' },
        { pattern: /Desktop Firefox - Integration/, name: 'Firefox browser project' },
        { pattern: /Mobile Chrome - Integration/, name: 'Mobile browser project' },
        { pattern: /timeout.*90000/, name: 'Timeout configuration' }
      ];

      for (const check of configChecks) {
        if (check.pattern.test(configContent)) {
          this.results.push({
            component: 'Playwright Config',
            status: 'PASS',
            message: `✅ ${check.name} configured`
          });
        } else {
          this.results.push({
            component: 'Playwright Config',
            status: 'WARN',
            message: `⚠️ ${check.name} might be missing`
          });
        }
      }
    }

    // Check package.json scripts
    const packageJsonPath = path.join(this.basePath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      const scriptChecks = [
        'test:integration',
        'test:integration-chrome',
        'test:integration-firefox',
        'test:integration-all',
        'test:integration-debug',
        'test:integration-mobile',
        'test:integration-performance'
      ];

      for (const script of scriptChecks) {
        if (packageJson.scripts && packageJson.scripts[script]) {
          this.results.push({
            component: 'Package Scripts',
            status: 'PASS',
            message: `✅ ${script} script configured`
          });
        } else {
          this.results.push({
            component: 'Package Scripts',
            status: 'FAIL',
            message: `❌ ${script} script missing`
          });
        }
      }
    }
  }

  private async validateTestContent(): Promise<void> {
    console.log('🧪 Validating test content...');

    const testFilePath = path.join(this.basePath, 'test-scripts/__tests__/integration/error-recovery-integration.test.ts');
    if (fs.existsSync(testFilePath)) {
      const testContent = fs.readFileSync(testFilePath, 'utf-8');

      const testChecks = [
        { pattern: /IntegrationTestHelper/, name: 'IntegrationTestHelper class' },
        { pattern: /mockSentryIntegration/, name: 'Sentry integration mocking' },
        { pattern: /injectNetworkError/, name: 'Network error injection' },
        { pattern: /injectJavaScriptError/, name: 'JavaScript error injection' },
        { pattern: /injectServiceError/, name: 'Service error injection' },
        { pattern: /validateCrossSystemCoordination/, name: 'Cross-system coordination validation' },
        { pattern: /validateDataIntegrity/, name: 'Data integrity validation' },
        { pattern: /simulateCompleteUserJourney/, name: 'Complete user journey simulation' },
        { pattern: /Voice Practice Complete Recovery Flow/, name: 'Voice practice test scenario' },
        { pattern: /Assessment Generator API Failure Recovery/, name: 'Assessment generator test scenario' },
        { pattern: /Advanced Chat Context Preservation/, name: 'Advanced chat test scenario' },
        { pattern: /Network Failure Cross-System Recovery/, name: 'Network failure test scenario' },
        { pattern: /Mobile Integration Error Recovery/, name: 'Mobile integration test' },
        { pattern: /Performance Under Error Conditions/, name: 'Performance test' },
        { pattern: /Accessibility During Error Recovery/, name: 'Accessibility test' }
      ];

      for (const check of testChecks) {
        if (check.pattern.test(testContent)) {
          this.results.push({
            component: 'Test Content',
            status: 'PASS',
            message: `✅ ${check.name} implemented`
          });
        } else {
          this.results.push({
            component: 'Test Content',
            status: 'FAIL',
            message: `❌ ${check.name} missing`
          });
        }
      }
    } else {
      this.results.push({
        component: 'Test Content',
        status: 'FAIL',
        message: '❌ Main integration test file missing'
      });
    }
  }

  private async validateDependencies(): Promise<void> {
    console.log('📦 Validating dependencies...');

    const packageJsonPath = path.join(this.basePath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

      const requiredDeps = [
        { name: '@playwright/test', type: 'devDependencies', purpose: 'E2E testing framework' },
        { name: '@sentry/nextjs', type: 'dependencies', purpose: 'Error monitoring' },
        { name: 'next', type: 'dependencies', purpose: 'Next.js framework' },
        { name: 'react', type: 'dependencies', purpose: 'React framework' },
        { name: 'typescript', type: 'devDependencies', purpose: 'TypeScript support' }
      ];

      for (const dep of requiredDeps) {
        const deps = dep.type === 'dependencies' ? packageJson.dependencies : packageJson.devDependencies;
        if (deps && deps[dep.name]) {
          this.results.push({
            component: 'Dependencies',
            status: 'PASS',
            message: `✅ ${dep.name} installed (${dep.purpose})`
          });
        } else {
          this.results.push({
            component: 'Dependencies',
            status: 'FAIL',
            message: `❌ ${dep.name} missing (needed for ${dep.purpose})`
          });
        }
      }
    }
  }

  private async validateAPIIntegration(): Promise<void> {
    console.log('🔌 Validating API integration...');

    const apiFiles = [
      'app/api/internal/error-recovery/route.ts',
      'app/api/error/report/route.ts',
      'app/api/session/cleanup/route.ts',
      'lib/error-recovery.ts'
    ];

    for (const apiFile of apiFiles) {
      const fullPath = path.join(this.basePath, apiFile);
      if (fs.existsSync(fullPath)) {
        this.results.push({
          component: 'API Integration',
          status: 'PASS',
          message: `✅ ${apiFile} exists`
        });

        // Check content for key functionality
        const content = fs.readFileSync(fullPath, 'utf-8');
        if (apiFile.includes('error-recovery')) {
          if (content.includes('executeRecoveryActions')) {
            this.results.push({
              component: 'API Integration',
              status: 'PASS',
              message: `✅ Error recovery actions implemented in ${apiFile}`
            });
          }
        }
      } else {
        this.results.push({
          component: 'API Integration',
          status: 'FAIL',
          message: `❌ ${apiFile} missing`
        });
      }
    }
  }

  private async validateErrorRecoverySystem(): Promise<void> {
    console.log('🛡️ Validating error recovery system...');

    const errorBoundaryPath = path.join(this.basePath, 'components/error-boundary.tsx');
    if (fs.existsSync(errorBoundaryPath)) {
      const boundaryContent = fs.readFileSync(errorBoundaryPath, 'utf-8');

      const boundaryChecks = [
        { pattern: /ErrorBoundary.*extends.*React\.Component/, name: 'Error boundary class component' },
        { pattern: /Sentry\.captureException/, name: 'Sentry error reporting' },
        { pattern: /recoverFromError/, name: 'Error recovery integration' },
        { pattern: /VoicePracticeErrorFallback/, name: 'Voice practice specialized error boundary' },
        { pattern: /AssessmentGeneratorErrorFallback/, name: 'Assessment generator specialized error boundary' },
        { pattern: /AdvancedChatErrorFallback/, name: 'Advanced chat specialized error boundary' },
        { pattern: /withErrorBoundary/, name: 'HOC wrapper for error boundaries' },
        { pattern: /useErrorHandler/, name: 'Error handler hook' }
      ];

      for (const check of boundaryChecks) {
        if (check.pattern.test(boundaryContent)) {
          this.results.push({
            component: 'Error Recovery System',
            status: 'PASS',
            message: `✅ ${check.name} implemented`
          });
        } else {
          this.results.push({
            component: 'Error Recovery System',
            status: 'WARN',
            message: `⚠️ ${check.name} might be missing`
          });
        }
      }
    } else {
      this.results.push({
        component: 'Error Recovery System',
        status: 'FAIL',
        message: '❌ Error boundary component missing'
      });
    }
  }

  private generateReport(): void {
    console.log('\n📊 Validation Report');
    console.log('===================');

    const passCount = this.results.filter(r => r.status === 'PASS').length;
    const warnCount = this.results.filter(r => r.status === 'WARN').length;
    const failCount = this.results.filter(r => r.status === 'FAIL').length;
    const totalCount = this.results.length;

    console.log(`\n📈 Summary:`);
    console.log(`   ✅ Passed: ${passCount}/${totalCount} (${((passCount/totalCount)*100).toFixed(1)}%)`);
    console.log(`   ⚠️ Warnings: ${warnCount}/${totalCount} (${((warnCount/totalCount)*100).toFixed(1)}%)`);
    console.log(`   ❌ Failed: ${failCount}/${totalCount} (${((failCount/totalCount)*100).toFixed(1)}%)`);

    // Group results by component
    const byComponent = this.results.reduce((acc, result) => {
      if (!acc[result.component]) {
        acc[result.component] = [];
      }
      acc[result.component].push(result);
      return acc;
    }, {} as Record<string, ValidationResult[]>);

    console.log('\n📋 Detailed Results:');
    for (const [component, results] of Object.entries(byComponent)) {
      console.log(`\n${component}:`);
      for (const result of results) {
        console.log(`   ${result.message}`);
        if (result.details) {
          result.details.forEach(detail => console.log(`      - ${detail}`));
        }
      }
    }

    // Overall assessment
    const successRate = passCount / totalCount;
    console.log('\n🎯 Overall Assessment:');
    
    if (successRate >= 0.9 && failCount === 0) {
      console.log('   🟢 EXCELLENT - Integration test system is fully ready');
    } else if (successRate >= 0.8 && failCount <= 2) {
      console.log('   🟡 GOOD - Integration test system is mostly ready with minor issues');
    } else if (successRate >= 0.6) {
      console.log('   🟠 NEEDS WORK - Integration test system has significant issues to address');
    } else {
      console.log('   🔴 CRITICAL - Integration test system is not ready for use');
    }

    // Save report
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalCount,
        passed: passCount,
        warnings: warnCount,
        failed: failCount,
        successRate: successRate
      },
      results: this.results,
      assessment: successRate >= 0.9 && failCount === 0 ? 'EXCELLENT' : 
                 successRate >= 0.8 && failCount <= 2 ? 'GOOD' :
                 successRate >= 0.6 ? 'NEEDS_WORK' : 'CRITICAL'
    };

    const reportsDir = path.join(this.basePath, 'test-scripts', 'reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const reportPath = path.join(reportsDir, 'integration-system-validation.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
    
    console.log(`\n💾 Detailed report saved to: ${reportPath}`);

    // Recommendations
    if (failCount > 0 || warnCount > 0) {
      console.log('\n💡 Recommendations:');
      
      if (failCount > 0) {
        console.log('   🔧 Address all FAIL items before running integration tests');
      }
      
      if (warnCount > 0) {
        console.log('   ⚠️ Review WARN items to ensure optimal test performance');
      }
      
      console.log('   📚 Refer to INTEGRATION_TESTING_GUIDE.md for detailed setup instructions');
      console.log('   🏃 Run integration tests with: npm run test:integration');
    }

    console.log('\n🚀 Integration Test System Validation Complete!');
  }
}

// CLI execution
async function main() {
  try {
    const validator = new IntegrationSystemValidator();
    await validator.validate();
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

// Check if this module is being run directly
const isMainModule = process.argv[1]?.endsWith('validate-integration-system.ts');
if (isMainModule) {
  main();
}

export { IntegrationSystemValidator };