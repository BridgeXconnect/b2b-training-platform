# Error Recovery Integration Testing Guide

## Overview

This comprehensive integration testing suite validates end-to-end error recovery flows across all system boundaries in the AI Course Platform. It tests the complete error recovery ecosystem including frontend error boundaries, backend coordination, Sentry monitoring, and data preservation.

## Architecture

### Test Structure
```
test-scripts/
├── __tests__/integration/
│   └── error-recovery-integration.test.ts    # Main integration tests
├── playwright-integration.config.ts          # Playwright configuration
├── integration-global-setup.ts               # Global test setup
├── integration-global-teardown.ts            # Global test cleanup
├── run-integration-tests.ts                  # Test runner
└── reports/                                  # Generated reports
```

### Key Components

#### 1. IntegrationTestHelper Class
Comprehensive helper class providing:
- **API Mocking**: Mock endpoints for error injection and recovery coordination
- **Sentry Integration**: Mock Sentry for error tracking validation
- **Error Injection**: Network, JavaScript, chunk loading, and service errors
- **Recovery Validation**: End-to-end recovery flow verification
- **Performance Monitoring**: Error handling and recovery time tracking
- **Data Integrity Checks**: Validate data preservation during recovery

#### 2. Recovery Scenarios
Five comprehensive test scenarios covering:
- **Voice Practice**: Service errors with audio fallbacks
- **Assessment Generator**: API failures with generation alternatives
- **Advanced Chat**: Context preservation and chat recovery
- **Network Failures**: Cross-system coordination during connectivity issues
- **Chunk Loading**: Next.js chunk failures and routing recovery

## Test Categories

### 1. Complete Integration Tests
**Purpose**: Validate end-to-end user journeys with error injection

**Coverage**:
- ✅ Error injection and detection
- ✅ Sentry integration and reporting
- ✅ Cross-system coordination
- ✅ Data integrity preservation
- ✅ Recovery success validation
- ✅ Performance benchmarking

### 2. Real-time Coordination Tests
**Purpose**: Test simultaneous multi-system errors

**Features**:
- Multiple coordinated error injection
- System-wide recovery coordination
- Resource cleanup verification
- State consistency validation

### 3. Mobile Integration Tests
**Purpose**: Validate mobile-specific error recovery

**Validation**:
- Mobile-responsive error UI
- Touch-friendly recovery controls
- Mobile performance benchmarks
- Accessibility on mobile devices

### 4. Production Monitoring Tests
**Purpose**: Simulate production error monitoring

**Features**:
- Production-like Sentry configuration
- Error context preservation
- Monitoring system integration
- Alert and notification validation

### 5. Performance Tests
**Purpose**: Validate performance under error conditions

**Metrics**:
- Error handling time < 3 seconds
- Total recovery time < 10 seconds
- Memory leak prevention
- Resource cleanup efficiency

### 6. Accessibility Tests
**Purpose**: Ensure error states are accessible

**Validation**:
- Keyboard navigation support
- Screen reader compatibility
- ARIA label presence
- Color contrast compliance

## Running Tests

### Quick Start
```bash
# Install dependencies
npm install

# Run all integration tests
npx ts-node test-scripts/run-integration-tests.ts

# Run with specific browser
npx ts-node test-scripts/run-integration-tests.ts --browser firefox

# Run in debug mode
npx ts-node test-scripts/run-integration-tests.ts --debug --headed
```

### Available Options
```bash
--browser <chrome|firefox|safari|all>  # Browser selection
--headed                               # Visible browser window
--debug                                # Debug mode with pauses
--parallel                             # Parallel test execution
--retries <number>                     # Retry failed tests
--timeout <number>                     # Test timeout (ms)
--reporter <html|json|line|allure>     # Report format
--grep <pattern>                       # Filter tests by pattern
--output-dir <path>                    # Custom output directory
```

### Example Commands
```bash
# Run specific test pattern
npx ts-node test-scripts/run-integration-tests.ts --grep "Voice Practice"

# Run all browsers in parallel
npx ts-node test-scripts/run-integration-tests.ts --browser all --parallel

# Generate detailed reports
npx ts-node test-scripts/run-integration-tests.ts --reporter allure

# Debug specific failure
npx ts-node test-scripts/run-integration-tests.ts --grep "Mobile" --debug
```

## Test Scenarios Detail

### 1. Voice Practice Complete Recovery Flow
**Error Type**: Service failure  
**Features Tested**: Voice recognition, audio processing, speech synthesis  
**Recovery Actions**: Reset voice state, clear audio buffers, reinitialize speech API  
**Fallbacks**: Text-only mode, manual input alternatives  
**Criticality**: High (affects core learning functionality)

**Test Flow**:
1. Navigate to voice practice feature
2. Inject voice service error
3. Validate specialized error boundary
4. Test service reset functionality
5. Verify fallback mode activation
6. Confirm data preservation

### 2. Assessment Generator API Failure Recovery
**Error Type**: API failure  
**Features Tested**: AI assessment generation, content creation  
**Recovery Actions**: Retry generation, clear cache, fallback to simple mode  
**Fallbacks**: Simple mode, pre-built templates, offline assessments  
**Criticality**: Medium (alternative methods available)

**Test Flow**:
1. Access assessment generator
2. Mock API failure response
3. Validate error boundary with recovery options
4. Test retry mechanism
5. Verify simple mode fallback
6. Confirm template availability

### 3. Advanced Chat Context Preservation
**Error Type**: JavaScript error  
**Features Tested**: AI chat, conversation context, real-time interaction  
**Recovery Actions**: Preserve chat state, restore context, reinitialize AI services  
**Fallbacks**: Basic chat mode, conversation backup  
**Criticality**: High (conversation data is valuable)

**Test Flow**:
1. Establish chat conversation
2. Inject JavaScript error
3. Validate context preservation message
4. Test chat restoration
5. Verify basic mode fallback
6. Confirm conversation data integrity

### 4. Network Failure Cross-System Recovery
**Error Type**: Network connectivity  
**Features Tested**: All network-dependent features  
**Recovery Actions**: Retry with fallback, clear session state, cleanup resources  
**Fallbacks**: Offline mode, cached content, local storage  
**Criticality**: Critical (affects entire application)

**Test Flow**:
1. Simulate network disconnection
2. Attempt feature interactions
3. Validate cross-system coordination
4. Test offline mode activation
5. Verify cached content availability
6. Confirm state preservation

### 5. Chunk Loading Error Page Recovery
**Error Type**: Next.js chunk loading failure  
**Features Tested**: Page routing, code splitting, navigation  
**Recovery Actions**: Clear cache, retry chunk load, fallback routing  
**Fallbacks**: Basic page version, server-side rendering  
**Criticality**: High (affects page accessibility)

**Test Flow**:
1. Navigate to route with chunk dependencies
2. Block chunk loading requests
3. Validate page-level error boundary
4. Test cache clearing mechanism
5. Verify fallback routing
6. Confirm basic page functionality

## Success Criteria

### Functional Requirements
- ✅ All user journeys complete successfully with error injection
- ✅ Error recovery coordination works across system boundaries
- ✅ Sentry monitoring captures and tracks all errors
- ✅ Data integrity maintained during all error scenarios
- ✅ Fallback modes provide acceptable user experience

### Performance Requirements
- ✅ Error handling time < 3 seconds
- ✅ Total recovery time < 10 seconds
- ✅ Memory usage remains stable during recovery
- ✅ No resource leaks during error cycles

### Accessibility Requirements
- ✅ Error states navigable via keyboard
- ✅ Screen reader compatible error messages
- ✅ Sufficient color contrast in error UI
- ✅ Touch-friendly recovery controls on mobile

### Quality Requirements
- ✅ Test success rate > 80%
- ✅ Cross-browser compatibility
- ✅ Mobile responsiveness maintained
- ✅ Production monitoring integration validated

## Monitoring and Reporting

### Automated Reports
The test suite generates multiple report formats:

1. **HTML Report**: Visual test results with screenshots
2. **JSON Report**: Machine-readable test data
3. **Allure Report**: Detailed interactive reporting
4. **Integration Summary**: High-level test overview

### Key Metrics Tracked
- **Error Detection Time**: How quickly errors are identified
- **Recovery Success Rate**: Percentage of successful recoveries
- **Performance Impact**: Response times during error conditions
- **User Experience**: Accessibility and usability during errors
- **System Stability**: Resource usage and memory management

### Report Locations
```
test-scripts/
├── playwright-report-integration/     # HTML reports
├── test-results-integration.json      # JSON results
├── allure-results-integration/        # Allure data
└── reports/
    ├── integration-summary.json       # Test summary
    └── integration-test-report.html   # Detailed HTML report
```

## Troubleshooting

### Common Issues

#### Test Timeouts
**Symptom**: Tests fail with timeout errors  
**Solutions**:
- Increase timeout with `--timeout 120000`
- Check application server is running
- Verify network connectivity
- Use `--debug` to inspect hanging operations

#### Sentry Mock Issues
**Symptom**: Sentry integration tests fail  
**Solutions**:
- Verify Sentry configuration in test environment
- Check mock setup in `mockSentryIntegration()`
- Ensure test environment variables are set
- Review browser console for Sentry errors

#### Browser Launch Failures
**Symptom**: Cannot launch browser instances  
**Solutions**:
- Run `npx playwright install` to update browsers
- Check system resources and close other applications
- Use single worker mode: `--workers=1`
- Try different browser: `--browser firefox`

#### Network Error Simulation Issues
**Symptom**: Network mocking doesn't work as expected  
**Solutions**:
- Verify route patterns match actual requests
- Check timing of route setup vs. requests
- Use browser dev tools to inspect network tab
- Add delays to route responses if needed

### Debugging Tips

1. **Use Debug Mode**: `--debug --headed` for step-by-step execution
2. **Filter Tests**: `--grep "specific test"` to isolate issues
3. **Check Logs**: Review browser console and network tabs
4. **Validate Mocks**: Ensure API mocks are properly configured
5. **Performance Monitoring**: Use browser dev tools for performance analysis

## Extending Tests

### Adding New Scenarios
1. Define new `RecoveryScenario` in the scenarios array
2. Specify error type, feature, recovery actions, and fallbacks
3. Update `simulateCompleteUserJourney()` if needed
4. Add feature-specific selectors and validations

### Custom Error Injection
```typescript
// Add to IntegrationTestHelper class
async injectCustomError(errorType: string, config: any) {
  switch (errorType) {
    case 'custom_service':
      await this.suite.page.route('**/api/custom/**', route => {
        route.fulfill({
          status: config.status || 500,
          body: JSON.stringify(config.response || { error: 'Custom error' })
        });
      });
      break;
  }
}
```

### New Validation Methods
```typescript
// Add to IntegrationTestHelper class
async validateCustomRecovery(): Promise<boolean> {
  // Custom validation logic
  const customState = await this.suite.page.evaluate(() => {
    return window.customRecoveryState;
  });
  
  return customState?.isRecovered === true;
}
```

## Best Practices

### Test Design
1. **Test Real User Flows**: Simulate actual user interactions
2. **Comprehensive Error Coverage**: Test all error types and scenarios
3. **Cross-System Validation**: Verify coordination between components
4. **Performance Awareness**: Monitor and assert on performance metrics
5. **Accessibility First**: Ensure error states are accessible

### Error Injection
1. **Realistic Errors**: Simulate errors that actually occur in production
2. **Timing Considerations**: Account for async operations and race conditions
3. **Progressive Failures**: Test cascading error scenarios
4. **Recovery Paths**: Validate all available recovery mechanisms

### Validation
1. **Multi-Level Checks**: Validate UI, data, and system state
2. **Error Reporting**: Ensure errors are properly tracked and reported
3. **User Experience**: Verify error states provide good UX
4. **Data Integrity**: Confirm critical data is preserved

### Maintenance
1. **Regular Updates**: Keep tests current with application changes
2. **Monitoring Integration**: Align tests with production monitoring
3. **Performance Benchmarks**: Update performance expectations as needed
4. **Browser Compatibility**: Test across all supported browsers

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: Error Recovery Integration Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npx playwright install
      - run: npx ts-node test-scripts/run-integration-tests.ts --browser chrome --reporter json
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: integration-test-results
          path: test-scripts/test-results-integration.json
```

### Production Validation
Use integration tests to validate production deployments:
1. Run subset of critical scenarios against production
2. Monitor error recovery performance in real environments
3. Validate monitoring and alerting systems
4. Confirm data integrity in production workflows

## Conclusion

This integration testing suite provides comprehensive validation of error recovery flows across the entire AI Course Platform. By testing real user journeys with injected errors, we ensure that the system gracefully handles failures and provides excellent user experience even during adverse conditions.

The tests validate not just error handling, but also the coordination between frontend, backend, monitoring systems, and data preservation mechanisms. This comprehensive approach gives confidence that the error recovery system will perform well in production environments.