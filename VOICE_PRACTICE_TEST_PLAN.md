# Voice Practice Interface - OPENAI_API_KEY Fix Test Plan

## Overview
This document provides comprehensive testing and validation for the OPENAI_API_KEY client-side exposure fix in the Voice Practice Interface system.

## Testing Architecture

### System Components Under Test
- **VoicePracticeInterface**: Main React component (`/components/voice/VoicePracticeInterface.tsx`)
- **PronunciationAnalyzer**: AI analysis engine (`/lib/voice/pronunciationAnalysis.ts`)
- **Voice Analysis API**: Server-side route (`/app/api/voice/analyze/route.ts`)
- **Sentry Integration**: Error monitoring and performance tracking
- **Audio Recording**: Browser-based audio capture and processing

## 1. End-to-End Testing

### 1.1 Complete User Journey Testing
```typescript
// Test Case: E2E-001 - Complete Voice Practice Flow
describe('Voice Practice E2E Flow', () => {
  const testUser = {
    userId: 'test-user-001',
    cefrLevel: 'B1',
    businessContext: 'sales-presentation'
  };

  test('should complete full voice practice session without OPENAI_API_KEY exposure', async () => {
    // Step 1: Component initialization
    const { getByRole, getByText } = render(
      <VoicePracticeInterface {...testUser} />
    );
    
    // Step 2: Verify no client-side API key exposure
    expect(window.OPENAI_API_KEY).toBeUndefined();
    expect(process.env.OPENAI_API_KEY).toBeUndefined();
    
    // Step 3: Load exercise
    await waitFor(() => {
      expect(getByText(/Practice Text:/)).toBeInTheDocument();
    });
    
    // Step 4: Start recording
    const recordButton = getByRole('button', { name: /Start Recording/ });
    fireEvent.click(recordButton);
    
    // Step 5: Simulate audio recording
    await mockAudioRecording(2000); // 2 second recording
    
    // Step 6: Stop recording and analyze
    const stopButton = getByRole('button', { name: /Stop Recording/ });
    fireEvent.click(stopButton);
    
    // Step 7: Verify API call uses server-side route
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/voice/analyze',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData)
      })
    );
    
    // Step 8: Verify analysis results
    await waitFor(() => {
      expect(getByText(/Pronunciation Analysis/)).toBeInTheDocument();
    });
    
    // Step 9: Verify no API key in network requests
    const networkCalls = getAllNetworkCalls();
    networkCalls.forEach(call => {
      expect(call.headers).not.toContain('Authorization');
      expect(call.body).not.toContain('sk-');
    });
  });
});
```

### 1.2 Audio Processing Pipeline Test
```typescript
// Test Case: E2E-002 - Audio Recording to Analysis Pipeline
test('should process audio recording through complete pipeline', async () => {
  const mockAudioBlob = new Blob(['mock-audio-data'], { type: 'audio/webm' });
  
  // Mock speech manager
  jest.spyOn(speechManager.getAudioRecorder(), 'startRecording')
    .mockResolvedValue(undefined);
  jest.spyOn(speechManager.getAudioRecorder(), 'stopRecording')
    .mockResolvedValue(mockAudioBlob);
  
  const component = render(<VoicePracticeInterface userId="test-user" />);
  
  // Start recording
  fireEvent.click(component.getByText('Start Recording'));
  
  // Simulate recording time
  act(() => {
    jest.advanceTimersByTime(3000);
  });
  
  // Stop recording
  fireEvent.click(component.getByText('Stop Recording'));
  
  // Verify API call with correct data
  await waitFor(() => {
    expect(fetch).toHaveBeenCalledWith('/api/voice/analyze', {
      method: 'POST',
      body: expect.objectContaining({
        get: expect.any(Function) // FormData object
      })
    });
  });
  
  // Verify analysis results display
  await waitFor(() => {
    expect(component.getByText(/Overall Score/)).toBeInTheDocument();
  });
});
```

### 1.3 Cross-Browser Compatibility Test
```typescript
// Test Case: E2E-003 - Browser Compatibility
const browserConfigs = [
  { name: 'Chrome', userAgent: 'Chrome/120.0.0.0' },
  { name: 'Firefox', userAgent: 'Firefox/121.0' },
  { name: 'Safari', userAgent: 'Safari/17.0' },
  { name: 'Edge', userAgent: 'Edge/120.0.0.0' }
];

browserConfigs.forEach(browser => {
  test(`should work correctly in ${browser.name}`, async () => {
    Object.defineProperty(navigator, 'userAgent', {
      value: browser.userAgent,
      configurable: true
    });
    
    const component = render(<VoicePracticeInterface userId="test-user" />);
    
    // Verify feature detection
    const featureFlags = await speechManager.getSpeechEngine().getFeatureFlags();
    expect(featureFlags.browserCompatible).toBe(true);
    
    // Verify no client-side API key exposure across browsers
    expect(window.OPENAI_API_KEY).toBeUndefined();
  });
});
```

## 2. Error Scenario Testing

### 2.1 Missing OPENAI_API_KEY on Server
```typescript
// Test Case: ERR-001 - Server Missing API Key
test('should handle missing OPENAI_API_KEY gracefully', async () => {
  // Mock server response for missing API key
  global.fetch = jest.fn().mockResolvedValue({
    ok: false,
    status: 500,
    json: () => Promise.resolve({
      success: false,
      error: 'OpenAI API key not configured',
      details: 'OPENAI_API_KEY environment variable is required'
    })
  });
  
  const component = render(<VoicePracticeInterface userId="test-user" />);
  
  // Trigger analysis
  fireEvent.click(component.getByText('Start Recording'));
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
  fireEvent.click(component.getByText('Stop Recording'));
  
  // Verify error handling
  await waitFor(() => {
    expect(component.getByText(/Failed to analyze recording/)).toBeInTheDocument();
  });
  
  // Verify Sentry error capture
  expect(mockSentryCapture).toHaveBeenCalledWith(
    expect.objectContaining({
      message: expect.stringContaining('OpenAI API key not configured')
    })
  );
});
```

### 2.2 Network Failure Scenarios
```typescript
// Test Case: ERR-002 - Network Failures
describe('Network Error Handling', () => {
  test('should handle API timeout', async () => {
    global.fetch = jest.fn().mockImplementation(() => 
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      )
    );
    
    const component = render(<VoicePracticeInterface userId="test-user" />);
    
    // Trigger analysis
    await triggerVoiceAnalysis(component);
    
    // Verify timeout handling
    await waitFor(() => {
      expect(component.getByText(/network error/i)).toBeInTheDocument();
    }, { timeout: 6000 });
  });
  
  test('should handle 500 server errors', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal server error' })
    });
    
    const component = render(<VoicePracticeInterface userId="test-user" />);
    await triggerVoiceAnalysis(component);
    
    await waitFor(() => {
      expect(component.getByText(/Failed to analyze recording/)).toBeInTheDocument();
    });
  });
  
  test('should handle rate limiting (429)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ 
        error: 'Rate limit exceeded',
        retryAfter: 60 
      })
    });
    
    const component = render(<VoicePracticeInterface userId="test-user" />);
    await triggerVoiceAnalysis(component);
    
    await waitFor(() => {
      expect(component.getByText(/rate limit exceeded/i)).toBeInTheDocument();
    });
  });
});
```

### 2.3 Audio Processing Errors
```typescript
// Test Case: ERR-003 - Audio Processing Errors
test('should handle audio recording failures', async () => {
  jest.spyOn(speechManager.getAudioRecorder(), 'startRecording')
    .mockRejectedValue(new Error('Microphone access denied'));
  
  const component = render(<VoicePracticeInterface userId="test-user" />);
  
  fireEvent.click(component.getByText('Start Recording'));
  
  await waitFor(() => {
    expect(component.getByText(/Failed to start recording/)).toBeInTheDocument();
  });
  
  // Verify error is logged
  expect(mockLogger.error).toHaveBeenCalledWith(
    'Failed to start recording',
    'VOICE',
    expect.objectContaining({
      error: expect.any(Error)
    })
  );
});
```

## 3. User Experience Validation

### 3.1 Loading States and Feedback
```typescript
// Test Case: UX-001 - Loading States
test('should show appropriate loading states', async () => {
  const component = render(<VoicePracticeInterface userId="test-user" />);
  
  // Start recording
  fireEvent.click(component.getByText('Start Recording'));
  
  // Verify recording state
  expect(component.getByText(/Recording\.\.\./)).toBeInTheDocument();
  expect(component.getByText(/Stop Recording/)).toBeInTheDocument();
  
  // Stop recording
  fireEvent.click(component.getByText('Stop Recording'));
  
  // Verify analyzing state
  expect(component.getByText(/Analyzing pronunciation\.\.\./)).toBeInTheDocument();
  
  // Wait for completion
  await waitFor(() => {
    expect(component.queryByText(/Analyzing pronunciation\.\.\./)).not.toBeInTheDocument();
  });
});
```

### 3.2 Error Message Clarity
```typescript
// Test Case: UX-002 - Error Message Quality
test('should display user-friendly error messages', async () => {
  const errorScenarios = [
    {
      serverError: 'OpenAI API key not configured',
      expectedUserMessage: 'Service temporarily unavailable. Please try again later.'
    },
    {
      serverError: 'Rate limit exceeded',
      expectedUserMessage: 'Too many requests. Please wait a moment and try again.'
    },
    {
      serverError: 'Invalid audio format',
      expectedUserMessage: 'Audio recording format not supported. Please try again.'
    }
  ];
  
  for (const scenario of errorScenarios) {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: scenario.serverError })
    });
    
    const component = render(<VoicePracticeInterface userId="test-user" />);
    await triggerVoiceAnalysis(component);
    
    await waitFor(() => {
      // Should show user-friendly message, not technical error
      expect(component.getByText(scenario.expectedUserMessage)).toBeInTheDocument();
      expect(component.queryByText(scenario.serverError)).not.toBeInTheDocument();
    });
  }
});
```

### 3.3 Accessibility Testing
```typescript
// Test Case: UX-003 - Accessibility Compliance
test('should be accessible to screen readers', async () => {
  const component = render(<VoicePracticeInterface userId="test-user" />);
  
  // Check ARIA labels
  expect(component.getByRole('button', { name: /Start Recording/ })).toHaveAttribute('aria-label');
  
  // Check keyboard navigation
  const recordButton = component.getByRole('button', { name: /Start Recording/ });
  recordButton.focus();
  expect(document.activeElement).toBe(recordButton);
  
  // Check screen reader announcements
  fireEvent.click(recordButton);
  expect(component.getByText(/Recording\.\.\./)).toHaveAttribute('aria-live', 'polite');
});
```

## 4. Sentry Verification

### 4.1 Error Tracking Validation
```typescript
// Test Case: SENTRY-001 - Error Capture
test('should capture errors in Sentry with proper context', async () => {
  const sentryCapture = jest.spyOn(Sentry, 'captureException');
  
  // Trigger an error
  global.fetch = jest.fn().mockRejectedValue(new Error('Network failure'));
  
  const component = render(<VoicePracticeInterface userId="test-user-123" />);
  await triggerVoiceAnalysis(component);
  
  // Verify Sentry capture
  expect(sentryCapture).toHaveBeenCalledWith(
    expect.any(Error),
    expect.objectContaining({
      tags: {
        component: 'VoicePracticeInterface',
        feature: 'voice-analysis',
        userId: 'test-user-123'
      },
      contexts: {
        voice: {
          cefrLevel: expect.any(String),
          exerciseType: expect.any(String)
        }
      }
    })
  );
});
```

### 4.2 Performance Monitoring
```typescript
// Test Case: SENTRY-002 - Performance Tracking
test('should track performance metrics in Sentry', async () => {
  const sentryTransaction = jest.spyOn(Sentry, 'startTransaction');
  
  const component = render(<VoicePracticeInterface userId="test-user" />);
  await triggerVoiceAnalysis(component);
  
  // Verify performance transaction
  expect(sentryTransaction).toHaveBeenCalledWith({
    name: 'voice-analysis',
    op: 'voice.pronunciation-analysis'
  });
});
```

### 4.3 Distributed Tracing
```typescript
// Test Case: SENTRY-003 - Distributed Tracing
test('should maintain trace context across client-server boundary', async () => {
  const traceId = 'test-trace-id-123';
  
  // Mock Sentry trace context
  jest.spyOn(Sentry, 'getCurrentHub').mockReturnValue({
    getScope: () => ({
      getTransaction: () => ({
        traceId,
        spanId: 'test-span-id'
      })
    })
  } as any);
  
  const component = render(<VoicePracticeInterface userId="test-user" />);
  await triggerVoiceAnalysis(component);
  
  // Verify trace headers are included
  expect(global.fetch).toHaveBeenCalledWith(
    '/api/voice/analyze',
    expect.objectContaining({
      headers: expect.objectContaining({
        'sentry-trace': expect.stringContaining(traceId)
      })
    })
  );
});
```

## 5. Performance Testing

### 5.1 API Response Time Testing
```typescript
// Test Case: PERF-001 - API Response Times
test('should complete analysis within acceptable timeframes', async () => {
  const startTime = performance.now();
  
  const component = render(<VoicePracticeInterface userId="test-user" />);
  await triggerVoiceAnalysis(component);
  
  await waitFor(() => {
    expect(component.getByText(/Pronunciation Analysis/)).toBeInTheDocument();
  });
  
  const endTime = performance.now();
  const duration = endTime - startTime;
  
  // Should complete within 10 seconds
  expect(duration).toBeLessThan(10000);
});
```

### 5.2 Concurrent Request Testing
```typescript
// Test Case: PERF-002 - Concurrent Analysis Requests
test('should handle multiple concurrent analysis requests', async () => {
  const components = Array.from({ length: 5 }, (_, i) => 
    render(<VoicePracticeInterface userId={`test-user-${i}`} />)
  );
  
  // Trigger analysis on all components simultaneously
  const analysisPromises = components.map(component => 
    triggerVoiceAnalysis(component)
  );
  
  // Wait for all to complete
  await Promise.all(analysisPromises);
  
  // Verify all completed successfully
  components.forEach(component => {
    expect(component.getByText(/Pronunciation Analysis/)).toBeInTheDocument();
  });
  
  // Verify rate limiting works
  expect(global.fetch).toHaveBeenCalledTimes(5);
});
```

### 5.3 Memory Leak Testing
```typescript
// Test Case: PERF-003 - Memory Management
test('should not leak memory with repeated audio processing', async () => {
  const component = render(<VoicePracticeInterface userId="test-user" />);
  
  // Track initial memory usage
  const initialMemory = performance.memory?.usedJSHeapSize || 0;
  
  // Process multiple audio recordings
  for (let i = 0; i < 10; i++) {
    await triggerVoiceAnalysis(component);
    
    // Reset for next iteration
    fireEvent.click(component.getByText('Reset'));
  }
  
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  // Check memory usage hasn't grown excessively
  const finalMemory = performance.memory?.usedJSHeapSize || 0;
  const memoryGrowth = finalMemory - initialMemory;
  
  // Should not grow by more than 50MB
  expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024);
});
```

## 6. Security Validation

### 6.1 API Key Exposure Prevention
```typescript
// Test Case: SEC-001 - Client-Side API Key Prevention
test('should never expose OPENAI_API_KEY on client side', async () => {
  const component = render(<VoicePracticeInterface userId="test-user" />);
  
  // Check window object
  expect(window.OPENAI_API_KEY).toBeUndefined();
  expect((window as any)._OPENAI_API_KEY).toBeUndefined();
  
  // Check process.env (client-side)
  expect(process.env.OPENAI_API_KEY).toBeUndefined();
  
  // Check component props and state
  const componentInstance = component.container.firstChild;
  const serializedComponent = JSON.stringify(componentInstance);
  expect(serializedComponent).not.toMatch(/sk-[a-zA-Z0-9]{40,}/);
  
  // Check network requests
  await triggerVoiceAnalysis(component);
  
  const networkCalls = getAllNetworkCalls();
  networkCalls.forEach(call => {
    expect(call.body?.toString()).not.toMatch(/sk-[a-zA-Z0-9]{40,}/);
    expect(JSON.stringify(call.headers)).not.toMatch(/sk-[a-zA-Z0-9]{40,}/);
  });
});
```

### 6.2 Input Sanitization
```typescript
// Test Case: SEC-002 - Input Sanitization
test('should sanitize user inputs', async () => {
  const maliciousInputs = [
    '<script>alert("xss")</script>',
    '${process.env.OPENAI_API_KEY}',
    '../../etc/passwd',
    'SELECT * FROM users;'
  ];
  
  for (const maliciousInput of maliciousInputs) {
    const component = render(
      <VoicePracticeInterface 
        userId={maliciousInput}
        businessContext={maliciousInput}
      />
    );
    
    await triggerVoiceAnalysis(component);
    
    // Verify input is sanitized in API calls
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/voice/analyze',
      expect.objectContaining({
        body: expect.not.stringContaining(maliciousInput)
      })
    );
  }
});
```

## Test Environment Setup

### Prerequisites
```bash
# Install test dependencies
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest \
  jest-environment-jsdom \
  @types/jest

# Set up test environment variables
export NODE_ENV=test
export NEXT_PUBLIC_SENTRY_DSN=test-dsn
```

### Mock Setup
```typescript
// Setup file: setupTests.ts
import '@testing-library/jest-dom';

// Mock speech manager
jest.mock('@/lib/voice/speechRecognition', () => ({
  speechManager: {
    getSpeechEngine: () => ({
      configure: jest.fn(),
      getFeatureFlags: () => ({
        browserCompatible: true,
        speechRecognitionSupported: true,
        audioRecordingSupported: true,
        httpsRequired: false
      })
    }),
    getAudioRecorder: () => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      startRecording: jest.fn().mockResolvedValue(undefined),
      stopRecording: jest.fn().mockResolvedValue(new Blob(['mock-audio'])),
      getIsRecording: jest.fn().mockReturnValue(false)
    }),
    cleanup: jest.fn()
  }
}));

// Mock Sentry
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn(),
  startTransaction: jest.fn(),
  getCurrentHub: jest.fn(),
  configureScope: jest.fn()
}));

// Mock fetch
global.fetch = jest.fn();

// Helper functions
global.triggerVoiceAnalysis = async (component) => {
  fireEvent.click(component.getByText('Start Recording'));
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
  fireEvent.click(component.getByText('Stop Recording'));
};

global.getAllNetworkCalls = () => {
  return (global.fetch as jest.Mock).mock.calls.map(call => ({
    url: call[0],
    options: call[1],
    headers: call[1]?.headers || {},
    body: call[1]?.body
  }));
};
```

## Success Criteria

### Must Pass:
1. ✅ No OPENAI_API_KEY exposure on client-side
2. ✅ All E2E voice practice flows work correctly
3. ✅ Error handling provides user-friendly messages
4. ✅ Sentry captures errors with proper context
5. ✅ Performance meets acceptable thresholds (<10s analysis)
6. ✅ Security validation prevents API key leakage

### Should Pass:
1. 🎯 Cross-browser compatibility (Chrome, Firefox, Safari, Edge)
2. 🎯 Accessibility compliance (WCAG 2.1 AA)
3. 🎯 Memory usage remains stable across multiple sessions
4. 🎯 Rate limiting works correctly under load
5. 🎯 Distributed tracing maintains context

### Could Pass:
1. 💡 Advanced performance optimizations
2. 💡 Enhanced error recovery mechanisms
3. 💡 Extended browser support (older versions)

## Execution Timeline

- **Phase 1** (Days 1-2): Core E2E and error scenario testing
- **Phase 2** (Days 3-4): Performance and security validation
- **Phase 3** (Day 5): Sentry integration and monitoring validation
- **Phase 4** (Day 6): Cross-browser and accessibility testing
- **Phase 5** (Day 7): Final validation and documentation

This comprehensive test plan ensures the OPENAI_API_KEY fix is thoroughly validated across all aspects of the voice practice system.