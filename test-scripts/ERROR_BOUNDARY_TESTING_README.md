# Error Boundary Testing Suite

Comprehensive frontend testing system for error recovery UI and user experience flows in the AI Course Platform.

## 📋 Overview

This testing suite validates error boundary components, error recovery mechanisms, and user experience flows to ensure excellent error handling across the application.

## 🏗️ Architecture

### Error Boundary Components
- **Main Error Boundary** (`components/error-boundary.tsx`) - Comprehensive error handling with Sentry integration
- **UI Error Boundary** (`components/ui/error-boundary.tsx`) - Simple fallback error handling
- **Global Error Handler** (`app/global-error.tsx`) - Application-level error recovery

### Specialized Error Boundaries
- **VoicePracticeErrorBoundary** - Voice recognition error recovery
- **AssessmentGeneratorErrorBoundary** - AI assessment generation error handling
- **AdvancedChatErrorBoundary** - Chat system error recovery with context preservation

## 🧪 Test Structure

```
test-scripts/
├── __tests__/
│   ├── components/
│   │   └── error-boundary.test.tsx          # Unit tests
│   ├── visual/
│   │   └── error-boundary-visual.test.tsx   # Visual regression tests
│   ├── e2e/
│   │   └── error-recovery-flows.test.ts     # End-to-end tests
│   ├── coverage/                            # Coverage reports
│   ├── screenshots/                         # Visual test artifacts
│   └── reports/                             # Test reports
├── run-error-boundary-tests.ts              # Test runner
├── validate-error-boundaries.js             # Validation script
└── ERROR_BOUNDARY_TESTING_README.md         # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Core testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom

# Visual regression testing (optional)
npm install --save-dev jest-image-snapshot puppeteer

# E2E testing (optional)
npm install --save-dev @playwright/test
```

### 2. Run Quick Validation

```bash
# Validate error boundary implementation
node test-scripts/validate-error-boundaries.js
```

### 3. Run Complete Test Suite

```bash
# Run all error boundary tests
npx ts-node test-scripts/run-error-boundary-tests.ts
```

### 4. Run Individual Test Types

```bash
# Unit tests only
npx jest test-scripts/__tests__/components/error-boundary.test.tsx

# Visual tests only (requires additional setup)
npx jest test-scripts/__tests__/visual/error-boundary-visual.test.tsx

# E2E tests only (requires dev server running)
npx playwright test test-scripts/__tests__/e2e/error-recovery-flows.test.ts
```

## 📊 Test Coverage

### Unit Tests (Core Functionality)
- ✅ Error boundary lifecycle methods
- ✅ Error catching and fallback UI rendering
- ✅ Recovery button functionality
- ✅ Sentry error reporting integration
- ✅ Context-aware error handling
- ✅ Specialized error boundary behaviors
- ✅ Accessibility compliance
- ✅ Mobile responsiveness
- ✅ Development vs production mode handling

### Visual Regression Tests
- ✅ Component-level error UI appearance
- ✅ Page-level error UI appearance
- ✅ Specialized error boundary layouts
- ✅ Mobile viewport rendering
- ✅ Dark mode compatibility
- ✅ Error message length handling
- ✅ Button state variations
- ✅ Accessibility indicators
- ✅ Integration with app layout

### End-to-End Tests
- ✅ Complete error recovery user flows
- ✅ Voice practice error recovery
- ✅ Assessment generator error handling
- ✅ Advanced chat error recovery
- ✅ Network error handling
- ✅ Mobile error recovery
- ✅ Keyboard navigation
- ✅ Performance during errors

## 🔧 Configuration

### Jest Configuration

The test runner automatically creates `jest.config.js` if it doesn't exist:

```javascript
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
}

module.exports = createJestConfig(customJestConfig)
```

### Playwright Configuration

For E2E tests, `playwright.config.ts` is created automatically:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './test-scripts/__tests__/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
  },
});
```

## 🎯 Testing Strategies

### 1. Error Simulation
- **JavaScript Errors**: Throw errors in components to test boundary catching
- **Network Errors**: Mock failed API calls and network issues
- **Chunk Load Errors**: Simulate failed module loading
- **Service Errors**: Mock voice, AI, and chat service failures

### 2. Recovery Testing
- **Button Interactions**: Test "Try Again", "Go Home", and specialized recovery buttons
- **Context Preservation**: Verify user data and session state preservation
- **Fallback Modes**: Test graceful degradation to simpler modes
- **Service Reset**: Validate service restoration functionality

### 3. User Experience Testing
- **Visual Consistency**: Ensure error states match design system
- **Loading States**: Test recovery progress indicators
- **Accessibility**: Validate WCAG compliance in error states
- **Mobile Experience**: Test error handling on mobile devices

### 4. Integration Testing
- **Sentry Integration**: Verify error reporting and tracking
- **Error Recovery System**: Test comprehensive recovery mechanisms
- **Multi-boundary Scenarios**: Test multiple error boundaries in same view
- **Performance Impact**: Ensure error handling doesn't degrade performance

## 📈 Test Metrics

### Coverage Targets
- **Statements**: 90%+
- **Branches**: 85%+
- **Functions**: 90%+
- **Lines**: 90%+

### Performance Targets
- **Error Handling Time**: <1 second
- **Recovery Time**: <2 seconds
- **Memory Impact**: <10% increase during error states
- **UI Response Time**: <100ms for error boundary rendering

### Accessibility Targets
- **WCAG 2.1 AA**: Full compliance
- **Keyboard Navigation**: All error UI keyboard accessible
- **Screen Reader**: Proper ARIA labels and roles
- **Color Contrast**: Minimum 4.5:1 ratio

## 🛠️ Development Workflow

### 1. Pre-Development
```bash
# Validate current state
node test-scripts/validate-error-boundaries.js
```

### 2. During Development
```bash
# Run tests in watch mode
npx jest --watch test-scripts/__tests__/components/error-boundary.test.tsx
```

### 3. Pre-Commit
```bash
# Run full test suite
npx ts-node test-scripts/run-error-boundary-tests.ts
```

### 4. CI/CD Integration
```bash
# Add to package.json scripts
"test:error-boundaries": "ts-node test-scripts/run-error-boundary-tests.ts",
"validate:error-boundaries": "node test-scripts/validate-error-boundaries.js"
```

## 🐛 Troubleshooting

### Common Issues

**Jest Tests Failing**
```bash
# Clear Jest cache
npx jest --clearCache

# Update snapshots
npx jest --updateSnapshot
```

**Playwright Tests Failing**
```bash
# Install browser dependencies
npx playwright install

# Start dev server
npm run dev
```

**Visual Tests Failing**
```bash
# Update visual snapshots
npx jest --updateSnapshot test-scripts/__tests__/visual/
```

**Coverage Issues**
```bash
# Generate detailed coverage report
npx jest --coverage --coverageReporters=html
open test-scripts/__tests__/coverage/lcov-report/index.html
```

### Debug Mode

Enable debug logging:
```bash
DEBUG=error-boundary:* npx ts-node test-scripts/run-error-boundary-tests.ts
```

## 📊 Reports and Analytics

### Test Reports
- **HTML Report**: `test-scripts/__tests__/reports/error-boundary-test-report.html`
- **JSON Report**: `test-scripts/__tests__/reports/error-boundary-test-report.json`
- **Coverage Report**: `test-scripts/__tests__/coverage/lcov-report/index.html`

### Playwright Reports
- **HTML Report**: `test-scripts/__tests__/reports/playwright/index.html`
- **Test Results**: `test-scripts/__tests__/reports/playwright-results.json`

### Visual Diff Reports
- **Screenshots**: `test-scripts/__tests__/screenshots/`
- **Visual Diffs**: `test-scripts/__tests__/__image_snapshots__/`

## 🎨 Visual Testing

### Screenshot Comparison
Visual tests capture screenshots of error boundaries in various states:

- Default error states
- Loading/recovery states
- Mobile viewports
- Dark mode
- Different error message lengths
- Multiple error boundaries

### Updating Visual Baselines
```bash
# Update all visual baselines
npx jest --updateSnapshot test-scripts/__tests__/visual/

# Update specific test baselines
npx jest --updateSnapshot --testNamePattern="component error boundary"
```

## 🔍 Advanced Testing

### Custom Error Scenarios

Create custom error scenarios:

```typescript
// In your test file
const simulateSpecificError = (errorType: 'network' | 'parsing' | 'auth') => {
  switch (errorType) {
    case 'network':
      return new Error('Network request failed');
    case 'parsing':
      return new Error('JSON parsing failed');
    case 'auth':
      return new Error('Authentication failed');
  }
};
```

### Performance Testing

Monitor error boundary performance:

```typescript
test('error boundary performance', async () => {
  const startTime = performance.now();
  
  render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  
  const endTime = performance.now();
  expect(endTime - startTime).toBeLessThan(100); // 100ms threshold
});
```

### Memory Leak Detection

Test for memory leaks during error recovery:

```typescript
test('no memory leaks during error recovery', async () => {
  const initialMemory = process.memoryUsage().heapUsed;
  
  // Simulate multiple error-recovery cycles
  for (let i = 0; i < 10; i++) {
    const { unmount } = render(<ErrorBoundaryTest />);
    unmount();
  }
  
  global.gc(); // Force garbage collection
  const finalMemory = process.memoryUsage().heapUsed;
  const memoryIncrease = finalMemory - initialMemory;
  
  expect(memoryIncrease).toBeLessThan(1024 * 1024); // 1MB threshold
});
```

## 🚦 Continuous Integration

### GitHub Actions Example

```yaml
name: Error Boundary Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Validate error boundaries
        run: node test-scripts/validate-error-boundaries.js
      
      - name: Run error boundary tests
        run: npx ts-node test-scripts/run-error-boundary-tests.ts
      
      - name: Upload coverage
        uses: codecov/codecov-action@v1
        with:
          file: ./test-scripts/__tests__/coverage/lcov.info
```

## 📚 Best Practices

### 1. Error Boundary Design
- Always provide recovery options
- Show helpful error messages to users
- Preserve user context when possible
- Implement progressive fallbacks

### 2. Test Design
- Test both happy and error paths
- Mock external dependencies
- Use realistic error scenarios
- Test accessibility thoroughly

### 3. Performance
- Monitor error boundary performance impact
- Avoid memory leaks in error states
- Optimize recovery mechanisms
- Cache recovery strategies

### 4. User Experience
- Design error states as part of the user journey
- Provide clear next steps
- Maintain brand consistency
- Support keyboard navigation

## 🔄 Maintenance

### Regular Tasks
- Review error boundary coverage monthly
- Update visual baselines when UI changes
- Monitor error rates in production
- Update test scenarios based on real errors

### Version Updates
- Update testing dependencies regularly
- Migrate to new testing patterns
- Enhance test coverage as features evolve
- Optimize test performance

## 📞 Support

For questions or issues with the error boundary testing suite:

1. Check the troubleshooting section above
2. Review test logs and reports
3. Validate implementation with the validation script
4. Check component implementation for missing features

## 🎯 Future Enhancements

### Planned Features
- Automated error boundary generation
- AI-powered error message optimization
- Advanced performance monitoring
- Real-time error testing in production

### Integration Opportunities
- Sentry error replay integration
- User session recording correlation
- A/B testing for error messages
- Machine learning for error prediction

---

**Last Updated**: January 2025  
**Version**: 1.0.0  
**Maintainer**: AI Course Platform Team