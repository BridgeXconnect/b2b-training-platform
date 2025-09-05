/**
 * Jest Setup for Voice Practice Interface Testing
 * Global test configuration and mocks for OPENAI_API_KEY fix validation
 */

import '@testing-library/jest-dom';
import 'jest-canvas-mock';

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
    back: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}));

// Mock speech recognition and audio recording
jest.mock('@/lib/voice/speechRecognition', () => ({
  speechManager: {
    getSpeechEngine: () => ({
      configure: jest.fn(),
      startRecognition: jest.fn().mockResolvedValue('mock transcript'),
      stopRecognition: jest.fn().mockResolvedValue(undefined),
      constructor: {
        getFeatureFlags: () => ({
          browserCompatible: true,
          speechRecognitionSupported: true,
          audioRecordingSupported: true,
          httpsRequired: false
        })
      }
    }),
    getAudioRecorder: () => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      startRecording: jest.fn().mockResolvedValue(undefined),
      stopRecording: jest.fn().mockResolvedValue(new Blob(['mock-audio-data'], { type: 'audio/webm' })),
      getIsRecording: jest.fn().mockReturnValue(false)
    }),
    cleanup: jest.fn()
  }
}));

// Mock voice exercise generator
jest.mock('@/lib/voice/exerciseGenerator', () => ({
  voiceExerciseGenerator: {
    generateExercise: jest.fn().mockResolvedValue({
      id: 'mock-exercise-001',
      title: 'Mock Exercise',
      type: 'pronunciation-drill',
      targetText: 'Hello, this is a mock exercise.',
      instructions: 'Read the text clearly.',
      estimatedDuration: 30,
      cefrLevel: 'B1',
      difficulty: 5
    })
  }
}));

// Mock pronunciation analyzer - CRITICAL: No API key exposure
jest.mock('@/lib/voice/pronunciationAnalysis', () => ({
  pronunciationAnalyzer: {
    analyzePronunciation: jest.fn().mockResolvedValue({
      transcript: 'Hello, this is a mock exercise.',
      analysis: {
        id: 'mock-analysis-001',
        recordingId: 'mock-recording-001',
        transcript: 'Hello, this is a mock exercise.',
        targetText: 'Hello, this is a mock exercise.',
        overallScore: 85,
        cefrLevel: 'B1',
        analysis: {
          accuracy: 90,
          fluency: 80,
          pronunciation: 85,
          completeness: 90
        },
        feedback: ['Good pronunciation overall'],
        improvements: ['Focus on word stress'],
        wordAnalysis: [
          {
            word: 'hello',
            score: 95,
            phonetic: '/həˈloʊ/',
            feedback: 'Excellent pronunciation',
            severity: 'good'
          }
        ],
        timestamp: new Date()
      },
      feedback: [
        {
          type: 'pronunciation',
          severity: 'success',
          message: 'Excellent pronunciation!',
          timestamp: new Date()
        }
      ],
      progress: {
        lastPronunciationScore: 85,
        lastAccuracyScore: 90,
        lastFluencyScore: 80,
        weakAreas: [],
        strongAreas: ['pronunciation'],
        lastUpdated: new Date()
      }
    })
  }
}));

// Mock Sentry - CRITICAL: Ensure no API key exposure in error tracking
jest.mock('@sentry/nextjs', () => ({
  captureException: jest.fn((error, context) => {
    // Validate that no API keys are in error or context
    const errorString = JSON.stringify({ error, context });
    if (errorString.match(/sk-[a-zA-Z0-9]{48}/)) {
      throw new Error('API key found in Sentry capture - SECURITY VIOLATION');
    }
    return 'mock-event-id';
  }),
  captureMessage: jest.fn(),
  configureScope: jest.fn(),
  startTransaction: jest.fn(() => ({
    setName: jest.fn(),
    setStatus: jest.fn(),
    setTag: jest.fn(),
    setData: jest.fn(),
    finish: jest.fn()
  })),
  getCurrentHub: jest.fn(() => ({
    getScope: () => ({
      getTransaction: () => ({
        traceId: 'mock-trace-id',
        spanId: 'mock-span-id'
      })
    })
  })),
  withScope: jest.fn((callback) => callback({
    setTag: jest.fn(),
    setContext: jest.fn(),
    setLevel: jest.fn()
  }))
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  log: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    userAction: jest.fn()
  }
}));

// Mock AI config - CRITICAL: Prevent actual OpenAI client creation
jest.mock('@/lib/ai-config', () => ({
  OpenAIClientManager: {
    getInstance: jest.fn(() => ({
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue({
            choices: [{
              message: {
                content: JSON.stringify({
                  overallScore: 85,
                  accuracy: 90,
                  fluency: 80,
                  pronunciation: 85,
                  completeness: 90,
                  feedback: ['Good pronunciation'],
                  improvements: ['Continue practicing'],
                  wordAnalysis: []
                })
              }
            }]
          })
        }
      }
    }))
  },
  RateLimiter: {
    canMakeRequest: jest.fn().mockReturnValue(true),
    recordRequest: jest.fn()
  }
}));

// Mock usage monitor
jest.mock('@/lib/usage-monitor', () => ({
  UsageMonitor: {
    canUserMakeRequest: jest.fn().mockReturnValue({
      allowed: true,
      tokensRemaining: 1000,
      budgetRemaining: 10.0
    }),
    recordUsage: jest.fn().mockResolvedValue(undefined)
  }
}));

// Global fetch mock - CRITICAL: Validate no API keys in requests
global.fetch = jest.fn((url, options) => {
  // Security check: Ensure no API keys in fetch requests
  const requestString = JSON.stringify({ url, options });
  if (requestString.match(/sk-[a-zA-Z0-9]{48}/)) {
    throw new Error('API key found in fetch request - SECURITY VIOLATION');
  }
  
  // Mock successful API response
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({
      success: true,
      result: {
        transcript: 'Mock transcript',
        analysis: {
          id: 'mock-analysis',
          overallScore: 85,
          analysis: {
            accuracy: 90,
            fluency: 80,
            pronunciation: 85,
            completeness: 90
          }
        },
        feedback: [
          {
            type: 'pronunciation',
            severity: 'success',
            message: 'Good job!'
          }
        ]
      }
    })
  });
});

// Mock Web APIs
Object.defineProperty(global, 'MediaRecorder', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    start: jest.fn(),
    stop: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    ondataavailable: null,
    onstop: null,
    state: 'inactive'
  }))
});

Object.defineProperty(global, 'navigator', {
  value: {
    ...global.navigator,
    mediaDevices: {
      getUserMedia: jest.fn().mockResolvedValue({
        getTracks: () => [{ stop: jest.fn() }]
      })
    },
    getUserMedia: jest.fn().mockResolvedValue({
      getTracks: () => [{ stop: jest.fn() }]
    })
  },
  writable: true
});

// Mock Audio API
Object.defineProperty(global, 'Audio', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({
    play: jest.fn().mockResolvedValue(undefined),
    pause: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    onended: null,
    onerror: null,
    currentTime: 0,
    duration: 0
  }))
});

// Mock URL API
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'mock-blob-url'),
    revokeObjectURL: jest.fn()
  },
  writable: true
});

// Mock Blob
Object.defineProperty(global, 'Blob', {
  writable: true,
  value: jest.fn().mockImplementation((content, options) => ({
    size: content ? content.join('').length : 0,
    type: options?.type || 'application/octet-stream',
    slice: jest.fn(),
    stream: jest.fn(),
    text: jest.fn().mockResolvedValue(content ? content.join('') : ''),
    arrayBuffer: jest.fn().mockResolvedValue(new ArrayBuffer(8))
  }))
});

// Mock performance API
Object.defineProperty(global, 'performance', {
  value: {
    now: jest.fn(() => Date.now()),
    mark: jest.fn(),
    measure: jest.fn(),
    getEntriesByType: jest.fn(() => []),
    memory: {
      usedJSHeapSize: 1000000,
      totalJSHeapSize: 2000000,
      jsHeapSizeLimit: 4000000
    }
  },
  writable: true
});

// Environment variable safety checks
beforeEach(() => {
  // Ensure no API keys are exposed in test environment
  delete process.env.OPENAI_API_KEY;
  delete global.OPENAI_API_KEY;
  delete window?.OPENAI_API_KEY;
  
  // Clear all mocks
  jest.clearAllMocks();
});

// Global test utilities
global.triggerVoiceAnalysis = async (component) => {
  const { fireEvent, waitFor } = require('@testing-library/react');
  const { act } = require('@testing-library/react');
  
  // Start recording
  const startButton = component.getByText(/Start Recording/i);
  fireEvent.click(startButton);
  
  // Simulate recording time
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000));
  });
  
  // Stop recording
  const stopButton = component.getByText(/Stop Recording/i);
  fireEvent.click(stopButton);
  
  // Wait for analysis to complete
  await waitFor(() => {
    expect(component.queryByText(/Analyzing pronunciation/i)).not.toBeInTheDocument();
  });
};

global.getAllNetworkCalls = () => {
  return global.fetch.mock.calls.map(([url, options]) => ({
    url,
    options,
    headers: options?.headers || {},
    body: options?.body
  }));
};

global.mockAudioRecording = async (duration = 2000) => {
  const { act } = require('@testing-library/react');
  
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, duration));
  });
};

// Security validation utilities
global.validateNoApiKeyExposure = (data) => {
  const dataString = typeof data === 'string' ? data : JSON.stringify(data);
  const apiKeyPattern = /sk-[a-zA-Z0-9]{48}/g;
  
  if (apiKeyPattern.test(dataString)) {
    throw new Error('API key exposure detected in test data');
  }
  
  return true;
};

// Console error handling for tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Cleanup after each test
afterEach(() => {
  // Clean up any remaining timers
  jest.clearAllTimers();
  
  // Clean up DOM
  document.body.innerHTML = '';
  
  // Validate no API keys were exposed during test
  try {
    global.validateNoApiKeyExposure(window);
    global.validateNoApiKeyExposure(document.documentElement.outerHTML);
  } catch (error) {
    throw new Error(`Security violation in test cleanup: ${error.message}`);
  }
});

// Global error handler for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  // Check for API key exposure in unhandled rejections
  try {
    global.validateNoApiKeyExposure(reason);
  } catch (error) {
    throw new Error(`Security violation in unhandled rejection: ${error.message}`);
  }
});