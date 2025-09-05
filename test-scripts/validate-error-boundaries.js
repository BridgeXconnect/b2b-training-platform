#!/usr/bin/env node

/**
 * Error Boundary Validation Script
 * Quick validation of error boundary implementations and UI functionality
 */

const fs = require('fs');
const path = require('path');

class ErrorBoundaryValidator {
  constructor() {
    this.projectRoot = process.cwd().replace('/test-scripts', '');
    this.results = {
      components: [],
      issues: [],
      recommendations: []
    };
  }

  // Validate error boundary component files
  validateComponents() {
    console.log('🔍 Validating error boundary components...');
    
    const componentsToCheck = [
      'components/error-boundary.tsx',
      'components/ui/error-boundary.tsx',
      'app/global-error.tsx'
    ];

    componentsToCheck.forEach(componentPath => {
      const fullPath = path.join(this.projectRoot, componentPath);
      
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const analysis = this.analyzeComponent(componentPath, content);
        this.results.components.push(analysis);
        
        console.log(`✅ ${componentPath}: Found and analyzed`);
      } else {
        console.log(`❌ ${componentPath}: Not found`);
        this.results.issues.push(`Missing component: ${componentPath}`);
      }
    });
  }

  // Analyze individual component
  analyzeComponent(filePath, content) {
    const analysis = {
      file: filePath,
      hasErrorBoundary: false,
      hasSentryIntegration: false,
      hasRecoveryLogic: false,
      hasAccessibilityFeatures: false,
      hasTypeScript: filePath.endsWith('.tsx'),
      issues: [],
      features: []
    };

    // Check for error boundary implementation
    if (content.includes('componentDidCatch') || content.includes('getDerivedStateFromError')) {
      analysis.hasErrorBoundary = true;
      analysis.features.push('Error boundary lifecycle methods');
    } else {
      analysis.issues.push('Missing error boundary lifecycle methods');
    }

    // Check for Sentry integration
    if (content.includes('@sentry/') || content.includes('Sentry.')) {
      analysis.hasSentryIntegration = true;
      analysis.features.push('Sentry error reporting');
    } else {
      analysis.issues.push('Missing Sentry integration');
    }

    // Check for recovery logic
    if (content.includes('resetError') || content.includes('Try Again') || content.includes('recoverFromError')) {
      analysis.hasRecoveryLogic = true;
      analysis.features.push('Error recovery functionality');
    } else {
      analysis.issues.push('Missing error recovery logic');
    }

    // Check for accessibility features
    if (content.includes('role=') || content.includes('aria-') || content.includes('tabIndex')) {
      analysis.hasAccessibilityFeatures = true;
      analysis.features.push('Accessibility attributes');
    } else if (content.includes('button') && content.includes('onClick')) {
      analysis.hasAccessibilityFeatures = true;
      analysis.features.push('Interactive buttons (basic accessibility)');
    }

    // Check for specialized error boundaries
    if (content.includes('VoicePracticeErrorBoundary') || content.includes('AssessmentGeneratorErrorBoundary')) {
      analysis.features.push('Specialized error boundaries');
    }

    // Check for development vs production error handling
    if (content.includes('process.env.NODE_ENV') && content.includes('development')) {
      analysis.features.push('Environment-aware error display');
    }

    // Check for comprehensive context handling
    if (content.includes('context') && content.includes('userId')) {
      analysis.features.push('Context-aware error handling');
    }

    return analysis;
  }

  // Validate test files
  validateTests() {
    console.log('\n🧪 Validating test files...');
    
    const testFiles = [
      'test-scripts/__tests__/components/error-boundary.test.tsx',
      'test-scripts/__tests__/visual/error-boundary-visual.test.tsx',
      'test-scripts/__tests__/e2e/error-recovery-flows.test.ts'
    ];

    testFiles.forEach(testPath => {
      const fullPath = path.join(this.projectRoot, testPath);
      
      if (fs.existsSync(fullPath)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const testStats = this.analyzeTestFile(testPath, content);
        console.log(`✅ ${testPath}: ${testStats.testCount} tests, ${testStats.testTypes.join(', ')}`);
      } else {
        console.log(`❌ ${testPath}: Not found`);
        this.results.issues.push(`Missing test file: ${testPath}`);
      }
    });
  }

  // Analyze test file
  analyzeTestFile(filePath, content) {
    const testCount = (content.match(/test\(/g) || []).length + (content.match(/it\(/g) || []).length;
    const describeCount = (content.match(/describe\(/g) || []).length;
    
    const testTypes = [];
    if (content.includes('render(')) testTypes.push('component rendering');
    if (content.includes('fireEvent') || content.includes('userEvent')) testTypes.push('user interaction');
    if (content.includes('waitFor')) testTypes.push('async behavior');
    if (content.includes('toMatchImageSnapshot')) testTypes.push('visual regression');
    if (content.includes('@playwright/test')) testTypes.push('end-to-end');
    if (content.includes('accessibility')) testTypes.push('accessibility');

    return {
      testCount,
      describeCount,
      testTypes
    };
  }

  // Check project configuration
  validateConfiguration() {
    console.log('\n⚙️  Validating project configuration...');
    
    const configFiles = [
      { file: 'package.json', required: true },
      { file: 'jest.config.js', required: false },
      { file: 'playwright.config.ts', required: false },
      { file: 'next.config.js', required: true }
    ];

    configFiles.forEach(config => {
      const fullPath = path.join(this.projectRoot, config.file);
      
      if (fs.existsSync(fullPath)) {
        console.log(`✅ ${config.file}: Found`);
        
        if (config.file === 'package.json') {
          this.validatePackageJson(fullPath);
        }
      } else if (config.required) {
        console.log(`❌ ${config.file}: Missing (required)`);
        this.results.issues.push(`Missing required config: ${config.file}`);
      } else {
        console.log(`⚠️  ${config.file}: Missing (optional)`);
      }
    });
  }

  // Validate package.json dependencies
  validatePackageJson(packageJsonPath) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    const requiredDeps = [
      '@sentry/nextjs',
      'react',
      'next',
      'typescript'
    ];

    const testingDeps = [
      '@testing-library/react',
      '@testing-library/jest-dom',
      'jest',
      '@playwright/test'
    ];

    requiredDeps.forEach(dep => {
      if (allDeps[dep]) {
        console.log(`  ✅ ${dep}: ${allDeps[dep]}`);
      } else {
        console.log(`  ❌ ${dep}: Missing`);
        this.results.issues.push(`Missing required dependency: ${dep}`);
      }
    });

    const missingTestDeps = testingDeps.filter(dep => !allDeps[dep]);
    if (missingTestDeps.length > 0) {
      console.log(`  ⚠️  Testing dependencies missing: ${missingTestDeps.join(', ')}`);
      this.results.recommendations.push('Install testing dependencies for comprehensive error boundary testing');
    }
  }

  // Generate validation report
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 ERROR BOUNDARY VALIDATION REPORT');
    console.log('='.repeat(60));

    // Component analysis summary
    console.log('\n🧩 COMPONENT ANALYSIS:');
    this.results.components.forEach(component => {
      const score = this.calculateComponentScore(component);
      const status = score >= 80 ? '✅' : score >= 60 ? '⚠️' : '❌';
      
      console.log(`${status} ${component.file} (${score}% complete)`);
      
      if (component.features.length > 0) {
        console.log(`     Features: ${component.features.join(', ')}`);
      }
      
      if (component.issues.length > 0) {
        console.log(`     Issues: ${component.issues.join(', ')}`);
      }
    });

    // Issues summary
    if (this.results.issues.length > 0) {
      console.log('\n❌ ISSUES FOUND:');
      this.results.issues.forEach(issue => {
        console.log(`   • ${issue}`);
      });
    }

    // Recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    
    // Auto-generate recommendations based on analysis
    this.generateRecommendations();
    
    if (this.results.recommendations.length > 0) {
      this.results.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    } else {
      console.log('   • All error boundary implementations look good!');
    }

    // Overall status
    const overallScore = this.calculateOverallScore();
    console.log('\n📈 OVERALL SCORE:', `${overallScore}%`);
    
    if (overallScore >= 90) {
      console.log('🎉 Excellent error boundary implementation!');
    } else if (overallScore >= 70) {
      console.log('👍 Good error boundary implementation with room for improvement.');
    } else {
      console.log('⚠️  Error boundary implementation needs attention.');
    }

    console.log('='.repeat(60));
  }

  // Calculate component score
  calculateComponentScore(component) {
    let score = 0;
    let maxScore = 5;

    if (component.hasErrorBoundary) score += 2;
    if (component.hasSentryIntegration) score += 1;
    if (component.hasRecoveryLogic) score += 1;
    if (component.hasAccessibilityFeatures) score += 0.5;
    if (component.hasTypeScript) score += 0.5;

    return Math.round((score / maxScore) * 100);
  }

  // Calculate overall score
  calculateOverallScore() {
    if (this.results.components.length === 0) return 0;

    const componentScores = this.results.components.map(c => this.calculateComponentScore(c));
    const avgComponentScore = componentScores.reduce((a, b) => a + b, 0) / componentScores.length;
    
    // Penalty for critical issues
    const issuePenalty = this.results.issues.length * 10;
    
    return Math.max(0, Math.round(avgComponentScore - issuePenalty));
  }

  // Generate specific recommendations
  generateRecommendations() {
    // Component-specific recommendations
    this.results.components.forEach(component => {
      if (!component.hasErrorBoundary) {
        this.results.recommendations.push(`Implement error boundary lifecycle methods in ${component.file}`);
      }
      
      if (!component.hasSentryIntegration) {
        this.results.recommendations.push(`Add Sentry error reporting to ${component.file}`);
      }
      
      if (!component.hasRecoveryLogic) {
        this.results.recommendations.push(`Add error recovery functionality to ${component.file}`);
      }
      
      if (!component.hasAccessibilityFeatures) {
        this.results.recommendations.push(`Improve accessibility in ${component.file}`);
      }
    });

    // General recommendations
    if (this.results.components.length < 3) {
      this.results.recommendations.push('Consider implementing more specialized error boundaries for different features');
    }

    // Testing recommendations
    const hasTestFiles = fs.existsSync(path.join(this.projectRoot, 'test-scripts/__tests__'));
    if (!hasTestFiles) {
      this.results.recommendations.push('Implement comprehensive error boundary testing');
    }
  }

  // Run complete validation
  async run() {
    console.log('🛡️  Error Boundary Validation Tool');
    console.log('====================================\n');

    this.validateComponents();
    this.validateTests();
    this.validateConfiguration();
    this.generateReport();

    // Exit with appropriate code
    const hasIssues = this.results.issues.length > 0;
    const overallScore = this.calculateOverallScore();
    
    if (hasIssues || overallScore < 70) {
      console.log('\n⚠️  Validation completed with issues. Please address the recommendations above.');
      process.exit(1);
    } else {
      console.log('\n✅ Error boundary validation completed successfully!');
      process.exit(0);
    }
  }
}

// CLI execution
if (require.main === module) {
  const validator = new ErrorBoundaryValidator();
  validator.run().catch(error => {
    console.error('Validation error:', error);
    process.exit(1);
  });
}

module.exports = ErrorBoundaryValidator;