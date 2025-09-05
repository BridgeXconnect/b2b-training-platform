/**
 * Comprehensive Error Boundary Testing Suite
 * Tests error recovery UI and user experience flows for ChunkLoadErrorBoundary and related components
 */

// Note: This test requires Jest and React Testing Library to be installed
// Run: npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock Sentry before importing components
const mockSentryCapture = jest.fn();
const mockSentryWithScope = jest.fn();
const mockSentryAddBreadcrumb = jest.fn();
const mockSentryShowReportDialog = jest.fn();

jest.mock('@sentry/nextjs', () => ({
  captureException: mockSentryCapture,
  withScope: mockSentryWithScope,
  addBreadcrumb: mockSentryAddBreadcrumb,
  showReportDialog: mockSentryShowReportDialog,
  getCurrentScope: () => ({
    getUser: () => ({ id: 'test-user', email: 'test@example.com' })
  })
}));

// Mock error recovery module
const mockRecoverFromError = jest.fn();
jest.mock('../../../lib/error-recovery', () => ({
  recoverFromError: mockRecoverFromError
}));

// Mock console methods
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {});
const mockConsoleGroup = jest.spyOn(console, 'group').mockImplementation(() => {});
const mockConsoleGroupEnd = jest.spyOn(console, 'groupEnd').mockImplementation(() => {});

// Import components after mocks
import {
  ErrorBoundary,
  withErrorBoundary,
  useErrorHandler,
  PageErrorBoundary,
  LearningErrorBoundary,
  ChatErrorBoundary,
  CourseErrorBoundary,
  VoicePracticeErrorBoundary,
  AssessmentGeneratorErrorBoundary,
  AdvancedChatErrorBoundary
} from '../../../components/error-boundary';

// Test components that throw errors
const ThrowError = ({ shouldThrow = true, errorMessage = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>No error</div>;
};

const AsyncThrowError = ({ shouldThrow = true, delay = 100 }) => {
  React.useEffect(() => {
    if (shouldThrow) {
      setTimeout(() => {
        throw new Error('Async test error');
      }, delay);
    }
  }, [shouldThrow, delay]);
  return <div>Async component</div>;
};

// Mock window methods
const mockReload = jest.fn();
const mockLocationHref = jest.fn();

Object.defineProperty(window, 'location', {
  value: {
    reload: mockReload,
    href: '/',
    get href() { return this._href || '/'; },
    set href(value) { 
      this._href = value;
      mockLocationHref(value);
    }
  },
  writable: true
});

// Mock sessionStorage
const mockSessionStorage = (() => {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: jest.fn((key: string) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; })
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

describe('Error Boundary Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleError.mockClear();
    mockConsoleLog.mockClear();
    mockConsoleGroup.mockClear();
    mockConsoleGroupEnd.mockClear();
    mockSessionStorage.clear();
  });

  describe('ErrorBoundary Core Functionality', () => {
    test('renders children when no error occurs', () => {
      render(
        <ErrorBoundary>
          <div>Test content</div>
        </ErrorBoundary>
      );

      expect(screen.getByText('Test content')).toBeInTheDocument();
    });

    test('catches errors and displays fallback UI', () => {
      render(
        <ErrorBoundary level="component">
          <ThrowError shouldThrow={true} errorMessage="Component error" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Component Error')).toBeInTheDocument();
      expect(screen.getByText(/This section encountered an error/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    test('displays page-level error UI for page errors', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} errorMessage="Page error" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /go home/i })).toBeInTheDocument();
    });

    test('shows error details in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Debug error message" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();
      
      // Click to expand details
      fireEvent.click(screen.getByText('Error Details (Development)'));
      expect(screen.getByText(/Debug error message/)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });

    test('hides error details in production mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Production error" />
        </ErrorBoundary>
      );

      expect(screen.queryByText('Error Details (Development)')).not.toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Error Recovery Functionality', () => {
    test('resets error state when Try Again button is clicked', async () => {
      const user = userEvent.setup();
      
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(screen.getByText('Component Error')).toBeInTheDocument();
      
      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      await user.click(tryAgainButton);

      // Error UI should disappear (component will re-render)
      await waitFor(() => {
        expect(screen.queryByText('Component Error')).not.toBeInTheDocument();
      });
    });

    test('calls comprehensive error recovery with context', async () => {
      mockRecoverFromError.mockResolvedValue({
        success: true,
        actions: ['reset_state', 'clear_cache'],
        message: 'Recovery successful'
      });

      const user = userEvent.setup();
      const context = {
        userId: 'test-user',
        sessionId: 'test-session',
        feature: 'test-feature',
        recoveryActions: ['reset_state']
      };

      render(
        <ErrorBoundary context={context}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      await user.click(tryAgainButton);

      await waitFor(() => {
        expect(mockRecoverFromError).toHaveBeenCalledWith(
          expect.objectContaining({
            userId: 'test-user',
            feature: 'test-feature',
            errorBoundaryLevel: 'component',
            recoveryActions: ['reset_state']
          })
        );
      });
    });

    test('handles recovery failure gracefully', async () => {
      mockRecoverFromError.mockRejectedValue(new Error('Recovery failed'));

      const user = userEvent.setup();
      const context = { userId: 'test-user', feature: 'test-feature' };

      render(
        <ErrorBoundary context={context}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      await user.click(tryAgainButton);

      // Should still reset the error boundary even if recovery fails
      await waitFor(() => {
        expect(mockConsoleError).toHaveBeenCalledWith('Error recovery failed:', expect.any(Error));
      });
    });

    test('Go Home button navigates to home page', async () => {
      const user = userEvent.setup();

      render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const goHomeButton = screen.getByRole('button', { name: /go home/i });
      await user.click(goHomeButton);

      expect(mockLocationHref).toHaveBeenCalledWith('/');
    });
  });

  describe('Sentry Integration', () => {
    test('captures error with proper context', () => {
      render(
        <ErrorBoundary level="component" context={{ feature: 'test-feature' }}>
          <ThrowError shouldThrow={true} errorMessage="Sentry test error" />
        </ErrorBoundary>
      );

      expect(mockSentryWithScope).toHaveBeenCalled();
      expect(mockSentryCapture).toHaveBeenCalledWith(expect.any(Error));
    });

    test('shows Sentry dialog when showDialog is true', () => {
      render(
        <ErrorBoundary showDialog={true}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      expect(mockSentryShowReportDialog).toHaveBeenCalledWith({
        title: 'Something went wrong',
        subtitle: 'Our team has been notified, but you can help by providing additional details.',
        subtitle2: 'Your feedback helps us improve the learning experience.',
        labelName: 'Name (optional)',
        labelEmail: 'Email (optional)',
        labelComments: 'What were you doing when this happened?',
        labelClose: 'Close',
        labelSubmit: 'Send Report',
        successMessage: 'Thank you for your report!'
      });
    });

    test('adds breadcrumb for recovery attempts', async () => {
      const user = userEvent.setup();

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      await user.click(tryAgainButton);

      expect(mockSentryAddBreadcrumb).toHaveBeenCalledWith({
        message: 'User attempted error recovery',
        category: 'ui.recovery',
        level: 'info',
        data: expect.objectContaining({
          level: 'component',
          errorMessage: 'Test error'
        })
      });
    });
  });

  describe('Specialized Error Boundaries', () => {
    test('VoicePracticeErrorBoundary displays specialized fallback', () => {
      render(
        <VoicePracticeErrorBoundary userId="test-user">
          <ThrowError shouldThrow={true} />
        </VoicePracticeErrorBoundary>
      );

      expect(screen.getByText('Voice Practice Error')).toBeInTheDocument();
      expect(screen.getByText(/voice recognition system encountered an error/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /reset voice services/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /text-only mode/i })).toBeInTheDocument();
    });

    test('AssessmentGeneratorErrorBoundary displays specialized fallback', () => {
      render(
        <AssessmentGeneratorErrorBoundary userId="test-user">
          <ThrowError shouldThrow={true} />
        </AssessmentGeneratorErrorBoundary>
      );

      expect(screen.getByText('Assessment Generation Error')).toBeInTheDocument();
      expect(screen.getByText(/AI assessment generator encountered an error/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry generation/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /simple mode/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /use pre-built/i })).toBeInTheDocument();
    });

    test('AdvancedChatErrorBoundary displays specialized fallback', () => {
      render(
        <AdvancedChatErrorBoundary userId="test-user">
          <ThrowError shouldThrow={true} />
        </AdvancedChatErrorBoundary>
      );

      expect(screen.getByText('Advanced Chat Error')).toBeInTheDocument();
      expect(screen.getByText(/advanced chat system encountered an error/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /restore chat/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /basic chat mode/i })).toBeInTheDocument();
    });
  });

  describe('Voice Practice Error Recovery', () => {
    test('resets voice services and shows recovery progress', async () => {
      mockRecoverFromError.mockResolvedValue({
        success: true,
        actions: ['reset_voice_state', 'clear_audio_buffers'],
        message: 'Voice services reset'
      });

      const user = userEvent.setup();

      render(
        <VoicePracticeErrorBoundary>
          <ThrowError shouldThrow={true} />
        </VoicePracticeErrorBoundary>
      );

      const resetButton = screen.getByRole('button', { name: /reset voice services/i });
      await user.click(resetButton);

      // Should show loading state
      expect(screen.getByText('Recovering...')).toBeInTheDocument();
      expect(screen.getByText('Resetting voice services...')).toBeInTheDocument();

      // Wait for recovery to complete
      await waitFor(() => {
        expect(screen.getByText('Voice services reset successfully!')).toBeInTheDocument();
      });

      expect(mockRecoverFromError).toHaveBeenCalledWith(
        expect.objectContaining({
          feature: 'voice_practice',
          recoveryActions: ['reset_voice_state', 'clear_audio_buffers', 'reinitialize_speech_api']
        })
      );
    });

    test('switches to text-only mode', async () => {
      const user = userEvent.setup();

      render(
        <VoicePracticeErrorBoundary>
          <ThrowError shouldThrow={true} />
        </VoicePracticeErrorBoundary>
      );

      const textOnlyButton = screen.getByRole('button', { name: /text-only mode/i });
      await user.click(textOnlyButton);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('voice_practice_fallback', 'true');
      expect(screen.getByText('Switching to text-only mode...')).toBeInTheDocument();
    });

    test('handles voice service reset failure', async () => {
      mockRecoverFromError.mockRejectedValue(new Error('Voice reset failed'));

      const user = userEvent.setup();

      render(
        <VoicePracticeErrorBoundary>
          <ThrowError shouldThrow={true} />
        </VoicePracticeErrorBoundary>
      );

      const resetButton = screen.getByRole('button', { name: /reset voice services/i });
      await user.click(resetButton);

      await waitFor(() => {
        expect(screen.getByText('Recovery failed. Manual page reload required.')).toBeInTheDocument();
      });
    });
  });

  describe('Assessment Generator Error Recovery', () => {
    test('retries generation with cache clearing', async () => {
      mockRecoverFromError.mockResolvedValue({
        success: true,
        actions: ['retry_generation', 'clear_generation_cache'],
        message: 'Generation retry successful'
      });

      const user = userEvent.setup();

      render(
        <AssessmentGeneratorErrorBoundary>
          <ThrowError shouldThrow={true} />
        </AssessmentGeneratorErrorBoundary>
      );

      const retryButton = screen.getByRole('button', { name: /retry generation/i });
      await user.click(retryButton);

      expect(screen.getByText('Retrying assessment generation...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Cache cleared. Ready to retry!')).toBeInTheDocument();
      });

      expect(mockRecoverFromError).toHaveBeenCalledWith(
        expect.objectContaining({
          feature: 'assessment_generator',
          recoveryActions: ['retry_generation', 'clear_generation_cache']
        })
      );
    });

    test('switches to simple mode', async () => {
      mockRecoverFromError.mockResolvedValue({
        success: true,
        actions: ['fallback_to_simple_mode'],
        message: 'Simple mode activated'
      });

      const user = userEvent.setup();

      render(
        <AssessmentGeneratorErrorBoundary>
          <ThrowError shouldThrow={true} />
        </AssessmentGeneratorErrorBoundary>
      );

      const simpleModeButton = screen.getByRole('button', { name: /simple mode/i });
      await user.click(simpleModeButton);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('assessment_simple_mode', 'true');
      expect(screen.getByText('Switching to simple mode...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Simple mode enabled. Assessment will use basic generation.')).toBeInTheDocument();
      });
    });

    test('switches to offline mode', async () => {
      const user = userEvent.setup();

      render(
        <AssessmentGeneratorErrorBoundary>
          <ThrowError shouldThrow={true} />
        </AssessmentGeneratorErrorBoundary>
      );

      const offlineButton = screen.getByRole('button', { name: /use pre-built/i });
      await user.click(offlineButton);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('assessment_offline_mode', 'true');
      expect(screen.getByText('Switching to offline templates...')).toBeInTheDocument();
    });
  });

  describe('Advanced Chat Error Recovery', () => {
    test('restores chat context successfully', async () => {
      mockRecoverFromError.mockResolvedValue({
        success: true,
        actions: ['preserve_chat_state', 'restore_conversation_context'],
        message: 'Chat restored'
      });

      const user = userEvent.setup();

      render(
        <AdvancedChatErrorBoundary>
          <ThrowError shouldThrow={true} />
        </AdvancedChatErrorBoundary>
      );

      const restoreButton = screen.getByRole('button', { name: /restore chat/i });
      await user.click(restoreButton);

      expect(screen.getByText('Restoring chat context...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Chat context restored successfully!')).toBeInTheDocument();
      });

      expect(mockRecoverFromError).toHaveBeenCalledWith(
        expect.objectContaining({
          feature: 'advanced_chat',
          recoveryActions: ['preserve_chat_state', 'restore_conversation_context', 'reinitialize_ai_services']
        })
      );
    });

    test('switches to basic chat mode', async () => {
      mockRecoverFromError.mockResolvedValue({
        success: true,
        actions: ['preserve_chat_state'],
        message: 'Basic mode activated'
      });

      const user = userEvent.setup();

      render(
        <AdvancedChatErrorBoundary>
          <ThrowError shouldThrow={true} />
        </AdvancedChatErrorBoundary>
      );

      const basicModeButton = screen.getByRole('button', { name: /basic chat mode/i });
      await user.click(basicModeButton);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith('chat_mode', 'basic');
      expect(screen.getByText('Switching to basic chat mode...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Basic chat mode enabled. Advanced features disabled.')).toBeInTheDocument();
      });
    });

    test('handles chat restoration failure', async () => {
      mockRecoverFromError.mockRejectedValue(new Error('Chat restore failed'));

      const user = userEvent.setup();

      render(
        <AdvancedChatErrorBoundary>
          <ThrowError shouldThrow={true} />
        </AdvancedChatErrorBoundary>
      );

      const restoreButton = screen.getByRole('button', { name: /restore chat/i });
      await user.click(restoreButton);

      await waitFor(() => {
        expect(screen.getByText('Restoration failed. Starting fresh chat.')).toBeInTheDocument();
      });

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('advanced_chat_error_state');
    });
  });

  describe('Higher-Order Component (withErrorBoundary)', () => {
    test('wraps component with error boundary', () => {
      const TestComponent = () => <div>Wrapped component</div>;
      const WrappedComponent = withErrorBoundary(TestComponent, { level: 'component' });

      render(<WrappedComponent />);

      expect(screen.getByText('Wrapped component')).toBeInTheDocument();
    });

    test('catches errors in wrapped component', () => {
      const ErrorComponent = () => {
        throw new Error('Wrapped component error');
      };
      const WrappedComponent = withErrorBoundary(ErrorComponent, { level: 'component' });

      render(<WrappedComponent />);

      expect(screen.getByText('Component Error')).toBeInTheDocument();
    });

    test('sets correct display name', () => {
      const TestComponent = () => <div>Test</div>;
      TestComponent.displayName = 'TestComponent';
      const WrappedComponent = withErrorBoundary(TestComponent);

      expect(WrappedComponent.displayName).toBe('withErrorBoundary(TestComponent)');
    });
  });

  describe('useErrorHandler Hook', () => {
    test('manually reports errors with context', () => {
      const TestComponent = () => {
        const reportError = useErrorHandler();
        
        React.useEffect(() => {
          const error = new Error('Manual error report');
          const context = { feature: 'test-feature', userId: 'test-user' };
          reportError(error, context);
        }, [reportError]);

        return <div>Test component</div>;
      };

      render(<TestComponent />);

      expect(mockSentryWithScope).toHaveBeenCalled();
      expect(mockSentryCapture).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('UI Error Boundary (Simple)', () => {
    test('renders simple error boundary fallback', () => {
      const { ErrorBoundary: UIErrorBoundary } = require('../../../components/ui/error-boundary');
      
      render(
        <UIErrorBoundary context="ui-test">
          <ThrowError shouldThrow={true} />
        </UIErrorBoundary>
      );

      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(screen.getByText(/An unexpected error occurred in the ui-test/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });

    test('shows report issue button when error ID is available', () => {
      const { ErrorBoundary: UIErrorBoundary } = require('../../../components/ui/error-boundary');
      
      // Mock Sentry to return an error ID
      mockSentryCapture.mockReturnValue('test-error-id');
      
      render(
        <UIErrorBoundary>
          <ThrowError shouldThrow={true} />
        </UIErrorBoundary>
      );

      expect(screen.getByRole('button', { name: /report issue/i })).toBeInTheDocument();
      expect(screen.getByText('Error ID: test-error-id')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('error boundaries have proper ARIA attributes', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      expect(tryAgainButton).toBeVisible();
      expect(tryAgainButton).toHaveAttribute('type', 'button');
    });

    test('error messages are accessible', () => {
      render(
        <ErrorBoundary level="page">
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      // Main error message should be in a heading
      const errorHeading = screen.getByRole('heading', { name: /something went wrong/i });
      expect(errorHeading).toBeInTheDocument();
    });

    test('error details can be toggled with keyboard', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const user = userEvent.setup();

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const detailsToggle = screen.getByText('Error Details (Development)');
      
      // Should be focusable and clickable
      await user.tab();
      expect(detailsToggle).toHaveFocus();
      
      await user.keyboard(' '); // Space key to activate
      expect(screen.getByText(/Test error/)).toBeInTheDocument();

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('Component Cleanup', () => {
    test('cleans up timeouts on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(window, 'clearTimeout');
      
      const { unmount } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      unmount();
      
      // clearTimeout should be called during cleanup
      expect(clearTimeoutSpy).toHaveBeenCalled();
      
      clearTimeoutSpy.mockRestore();
    });

    test('handles multiple error resets', async () => {
      const user = userEvent.setup();

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );

      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      
      // Click multiple times rapidly
      await user.click(tryAgainButton);
      await user.click(tryAgainButton);
      await user.click(tryAgainButton);

      // Should handle multiple clicks gracefully
      expect(mockSentryAddBreadcrumb).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Boundary State Management', () => {
    test('preserves error info across renders', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Persistent error" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Component Error')).toBeInTheDocument();

      // Rerender with same error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Persistent error" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Component Error')).toBeInTheDocument();
    });

    test('resets state for new errors', async () => {
      const user = userEvent.setup();
      
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="First error" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Component Error')).toBeInTheDocument();

      // Reset the error
      const tryAgainButton = screen.getByRole('button', { name: /try again/i });
      await user.click(tryAgainButton);

      // Render with a new error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} errorMessage="Second error" />
        </ErrorBoundary>
      );

      expect(screen.getByText('Component Error')).toBeInTheDocument();
    });
  });
});

describe('Global Error Handler', () => {
  // Import global error after mocks
  const GlobalError = require('../../../app/global-error').default;

  test('renders global error UI', () => {
    const error = new Error('Global test error');
    error.digest = 'test-digest';
    const mockReset = jest.fn();

    render(<GlobalError error={error} reset={mockReset} />);

    expect(screen.getByText('Something went wrong!')).toBeInTheDocument();
    expect(screen.getByText(/We apologize for the inconvenience/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /go to homepage/i })).toBeInTheDocument();
  });

  test('calls reset function when Try Again is clicked', async () => {
    const user = userEvent.setup();
    const error = new Error('Global test error');
    const mockReset = jest.fn();

    render(<GlobalError error={error} reset={mockReset} />);

    const tryAgainButton = screen.getByRole('button', { name: /try again/i });
    await user.click(tryAgainButton);

    expect(mockReset).toHaveBeenCalled();
  });

  test('navigates to homepage when Go to Homepage is clicked', async () => {
    const user = userEvent.setup();
    const error = new Error('Global test error');
    const mockReset = jest.fn();

    render(<GlobalError error={error} reset={mockReset} />);

    const goHomeButton = screen.getByRole('button', { name: /go to homepage/i });
    await user.click(goHomeButton);

    expect(mockLocationHref).toHaveBeenCalledWith('/');
  });

  test('shows error details in development', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const error = new Error('Dev global error');
    error.digest = 'dev-digest';
    const mockReset = jest.fn();

    render(<GlobalError error={error} reset={mockReset} />);

    expect(screen.getByText('Development Info:')).toBeInTheDocument();
    expect(screen.getByText('Dev global error')).toBeInTheDocument();
    expect(screen.getByText('Digest: dev-digest')).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  test('captures error with Sentry', () => {
    const error = new Error('Sentry global error');
    error.digest = 'sentry-digest';
    const mockReset = jest.fn();

    render(<GlobalError error={error} reset={mockReset} />);

    expect(mockSentryCapture).toHaveBeenCalledWith(error, {
      contexts: {
        react: {
          componentStack: 'sentry-digest',
          errorBoundary: 'global-error',
        },
      },
      tags: {
        section: 'global',
        errorBoundary: 'global-error',
        digest: 'sentry-digest',
      },
      level: 'fatal',
      fingerprint: ['global-error', 'Error', 'Sentry global error'],
    });
  });
});