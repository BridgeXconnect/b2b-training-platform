/**
 * React Error Boundary with Sentry Integration
 * Provides comprehensive error handling for the AI Course Platform
 */

'use client';

import React from 'react';
import * as Sentry from '@sentry/nextjs';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, Home, Target, FileText, MessageCircle } from 'lucide-react';
import { recoverFromError, type ErrorRecoveryContext } from '@/lib/error-recovery';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  showDialog?: boolean;
  level?: 'page' | 'section' | 'component';
  context?: Record<string, any> & {
    userId?: string;
    sessionId?: string;
    feature?: string;
    section?: string;
    recoveryActions?: string[];
  };
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  level: 'page' | 'section' | 'component';
}

/**
 * Default Error Fallback Component
 */
const DefaultErrorFallback: React.FC<ErrorFallbackProps> = ({ 
  error, 
  resetError, 
  level 
}) => {
  const isPageLevel = level === 'page';
  
  return (
    <div className={`
      flex flex-col items-center justify-center space-y-4 p-8 
      ${isPageLevel ? 'min-h-screen bg-gray-50' : 'min-h-[300px] bg-white border border-red-200 rounded-lg'}
    `}>
      <div className="text-center space-y-4">
        <AlertTriangle 
          className={`mx-auto text-red-500 ${isPageLevel ? 'h-16 w-16' : 'h-12 w-12'}`} 
        />
        
        <div className="space-y-2">
          <h2 className={`font-semibold text-gray-900 ${isPageLevel ? 'text-2xl' : 'text-lg'}`}>
            {isPageLevel ? 'Something went wrong' : 'Component Error'}
          </h2>
          
          <p className="text-gray-600 max-w-md">
            {isPageLevel 
              ? 'We encountered an unexpected error. Our team has been notified and is working on a fix.'
              : 'This section encountered an error. You can try refreshing or continue using other parts of the platform.'
            }
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-left">
              <summary className="font-medium text-red-800 cursor-pointer">
                Error Details (Development)
              </summary>
              <pre className="mt-2 text-sm text-red-700 overflow-auto">
                {error.message}
                {'\n\n'}
                {error.stack}
              </pre>
            </details>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={resetError}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          
          {isPageLevel && (
            <Button 
              onClick={() => window.location.href = '/'}
              variant="default"
              className="flex items-center gap-2"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Enhanced Error Boundary Class Component
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private resetTimeoutId: number | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.group('🚨 Error Boundary Caught Error');
    console.error('Error:', error);
    console.error('Error Info:', errorInfo);
    console.error('Props Context:', this.props.context);
    console.groupEnd();

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    });

    // Enhanced Sentry error reporting
    Sentry.withScope((scope) => {
      // Set error boundary context
      scope.setTag('errorBoundary', true);
      scope.setTag('errorBoundaryLevel', this.props.level || 'component');
      
      // Set component context
      scope.setContext('errorBoundary', {
        level: this.props.level || 'component',
        componentStack: errorInfo.componentStack,
        props: this.props.context || {},
      });
      
      // Set error info context
      scope.setContext('react', {
        componentStack: errorInfo.componentStack,
      });
      
      // Set user impact level
      const userImpact = this.props.level === 'page' ? 'high' : 'medium';
      scope.setTag('userImpact', userImpact);
      
      // Capture the exception
      Sentry.captureException(error);
    });

    // Show Sentry dialog if requested
    if (this.props.showDialog) {
      Sentry.showReportDialog({
        title: 'Something went wrong',
        subtitle: 'Our team has been notified, but you can help by providing additional details.',
        subtitle2: 'Your feedback helps us improve the learning experience.',
        labelName: 'Name (optional)',
        labelEmail: 'Email (optional)',
        labelComments: 'What were you doing when this happened?',
        labelClose: 'Close',
        labelSubmit: 'Send Report',
        successMessage: 'Thank you for your report!',
      });
    }
  }

  resetError = async () => {
    // Clear any existing timeout
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }

    // Track recovery attempt
    Sentry.addBreadcrumb({
      message: 'User attempted error recovery',
      category: 'ui.recovery',
      level: 'info',
      data: {
        level: this.props.level || 'component',
        errorMessage: this.state.error?.message,
      },
    });

    // Perform comprehensive error recovery if context is available
    if (this.state.error && this.props.context) {
      try {
        const recoveryContext: ErrorRecoveryContext = {
          userId: this.props.context.userId || 'anonymous',
          sessionId: this.props.context.sessionId,
          feature: this.props.context.feature || 'unknown',
          section: this.props.context.section || 'unknown',
          errorBoundaryLevel: this.props.level || 'component',
          error: this.state.error,
          context: this.props.context,
          recoveryActions: this.props.context.recoveryActions
        };

        console.log('Starting comprehensive error recovery...');
        const recoveryResult = await recoverFromError(recoveryContext);
        
        if (recoveryResult.success) {
          console.log('Error recovery completed successfully');
          Sentry.addBreadcrumb({
            message: 'Comprehensive error recovery succeeded',
            category: 'ui.recovery',
            level: 'info',
            data: {
              feature: recoveryContext.feature,
              actions: recoveryResult.actions,
              message: recoveryResult.message
            }
          });
        } else {
          console.warn('Error recovery partially failed:', recoveryResult.message);
          Sentry.addBreadcrumb({
            message: 'Comprehensive error recovery partially failed',
            category: 'ui.recovery',
            level: 'warning',
            data: {
              feature: recoveryContext.feature,
              message: recoveryResult.message
            }
          });
        }
      } catch (recoveryError) {
        console.error('Error recovery failed:', recoveryError);
        Sentry.captureException(recoveryError, {
          tags: {
            error_recovery: true,
            feature: this.props.context.feature
          }
        });
      }
    }

    // Reset state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Set timeout to re-render
    this.resetTimeoutId = window.setTimeout(() => {
      // Force re-render by updating key or triggering parent refresh
      if (this.props.level === 'page') {
        window.location.reload();
      }
    }, 100);
  };

  override componentWillUnmount() {
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }
  }

  override render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;
      
      return (
        <FallbackComponent
          error={this.state.error}
          resetError={this.resetError}
          level={this.props.level || 'component'}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * HOC for wrapping components with error boundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

/**
 * Hook for manual error reporting
 */
export function useErrorHandler() {
  return React.useCallback((error: Error, context?: Record<string, any>) => {
    console.error('Manual error report:', error, context);
    
    Sentry.withScope((scope) => {
      if (context) {
        scope.setContext('manual_error', context);
      }
      scope.setTag('manual_report', true);
      Sentry.captureException(error);
    });
  }, []);
}

/**
 * Specialized Error Fallback Components for Learning Features
 */

// Voice Practice Error Fallback with Recovery Options
const VoicePracticeErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  const [isRecovering, setIsRecovering] = React.useState(false);
  const [recoveryMessage, setRecoveryMessage] = React.useState('');

  const handleResetVoiceServices = async () => {
    setIsRecovering(true);
    setRecoveryMessage('Resetting voice services...');
    
    try {
      // Use comprehensive recovery system
      const recoveryResult = await recoverFromError({
        userId: 'current_user', // In real app, get from auth context
        feature: 'voice_practice',
        section: 'learning',
        errorBoundaryLevel: 'component',
        error,
        context: {
          action: 'reset_voice_services',
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString()
        },
        recoveryActions: ['reset_voice_state', 'clear_audio_buffers', 'reinitialize_speech_api']
      });

      if (recoveryResult.success) {
        setRecoveryMessage('Voice services reset successfully!');
        setTimeout(() => {
          resetError();
        }, 1000);
      } else {
        setRecoveryMessage('Recovery partially failed. Some manual steps may be needed.');
        setTimeout(() => {
          if (confirm('Voice services need to be restarted. Reload the page?')) {
            window.location.reload();
          }
        }, 2000);
      }
    } catch (resetErr) {
      console.error('Failed to reset voice services:', resetErr);
      setRecoveryMessage('Recovery failed. Manual page reload required.');
      setTimeout(() => {
        if (confirm('Voice services need to be restarted. Reload the page?')) {
          window.location.reload();
        }
      }, 2000);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleFallbackMode = () => {
    // Store fallback preference and reset
    sessionStorage.setItem('voice_practice_fallback', 'true');
    setRecoveryMessage('Switching to text-only mode...');
    setTimeout(() => {
      resetError();
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 min-h-[400px] bg-red-50 border border-red-200 rounded-lg">
      <div className="text-center space-y-4">
        <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">Voice Practice Error</h3>
          <p className="text-gray-600 max-w-md">
            The voice recognition system encountered an error. This can happen due to microphone permissions, 
            browser compatibility, or network issues.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={handleResetVoiceServices}
            disabled={isRecovering}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRecovering ? 'animate-spin' : ''}`} />
            {isRecovering ? 'Recovering...' : 'Reset Voice Services'}
          </Button>
          
          <Button 
            onClick={handleFallbackMode}
            disabled={isRecovering}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Text-Only Mode
          </Button>
        </div>
        
        {(isRecovering || recoveryMessage) && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-center">
            <p className="text-sm text-blue-800 font-medium">{recoveryMessage}</p>
          </div>
        )}
        
        <div className="text-sm text-gray-500 space-y-2">
          <p><strong>Troubleshooting Tips:</strong></p>
          <ul className="text-left list-disc list-inside space-y-1">
            <li>Check microphone permissions in your browser</li>
            <li>Ensure you're using HTTPS or localhost</li>
            <li>Try refreshing the page</li>
            <li>Switch to a supported browser (Chrome, Firefox, Safari)</li>
          </ul>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 p-4 bg-red-100 border border-red-300 rounded text-left">
            <summary className="font-medium text-red-800 cursor-pointer">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-sm text-red-700 overflow-auto whitespace-pre-wrap">
              {error.message}\n\n{error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

// Assessment Generator Error Fallback with Recovery Options
const AssessmentGeneratorErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  const [isRecovering, setIsRecovering] = React.useState(false);
  const [recoveryMessage, setRecoveryMessage] = React.useState('');

  const handleRetryGeneration = async () => {
    setIsRecovering(true);
    setRecoveryMessage('Retrying assessment generation...');
    
    try {
      const recoveryResult = await recoverFromError({
        userId: 'current_user',
        feature: 'assessment_generator',
        section: 'learning',
        errorBoundaryLevel: 'component',
        error,
        context: {
          action: 'retry_generation',
          timestamp: new Date().toISOString()
        },
        recoveryActions: ['retry_generation', 'clear_generation_cache']
      });

      if (recoveryResult.success) {
        setRecoveryMessage('Cache cleared. Ready to retry!');
        setTimeout(() => resetError(), 1500);
      } else {
        setRecoveryMessage('Partial recovery. Try simple mode if issues persist.');
        setTimeout(() => resetError(), 2000);
      }
    } catch (err) {
      setRecoveryMessage('Recovery failed. Please try simple mode.');
    } finally {
      setIsRecovering(false);
    }
  };

  const handleSimpleMode = async () => {
    setIsRecovering(true);
    setRecoveryMessage('Switching to simple mode...');
    
    sessionStorage.setItem('assessment_simple_mode', 'true');
    
    try {
      const recoveryResult = await recoverFromError({
        userId: 'current_user',
        feature: 'assessment_generator',
        section: 'learning',
        errorBoundaryLevel: 'component',
        error,
        context: {
          action: 'simple_mode',
          fallback: true
        },
        recoveryActions: ['fallback_to_simple_mode']
      });
      
      setRecoveryMessage('Simple mode enabled. Assessment will use basic generation.');
      setTimeout(() => resetError(), 1500);
    } catch (err) {
      setRecoveryMessage('Simple mode activated.');
      setTimeout(() => resetError(), 1000);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleOfflineMode = () => {
    setRecoveryMessage('Switching to offline templates...');
    sessionStorage.setItem('assessment_offline_mode', 'true');
    setTimeout(() => resetError(), 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 min-h-[400px] bg-orange-50 border border-orange-200 rounded-lg">
      <div className="text-center space-y-4">
        <AlertTriangle className="mx-auto h-12 w-12 text-orange-500" />
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">Assessment Generation Error</h3>
          <p className="text-gray-600 max-w-md">
            The AI assessment generator encountered an error. This might be due to network issues, 
            AI service unavailability, or configuration problems.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={handleRetryGeneration}
            disabled={isRecovering}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRecovering ? 'animate-spin' : ''}`} />
            {isRecovering ? 'Recovering...' : 'Retry Generation'}
          </Button>
          
          <Button 
            onClick={handleSimpleMode}
            disabled={isRecovering}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            Simple Mode
          </Button>
          
          <Button 
            onClick={handleOfflineMode}
            disabled={isRecovering}
            variant="ghost"
            className="flex items-center gap-2"
          >
            <FileText className="h-4 w-4" />
            Use Pre-built
          </Button>
        </div>
        
        {(isRecovering || recoveryMessage) && (
          <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded text-center">
            <p className="text-sm text-orange-800 font-medium">{recoveryMessage}</p>
          </div>
        )}
        
        <div className="text-sm text-gray-500 space-y-2">
          <p><strong>Recovery Options:</strong></p>
          <ul className="text-left list-disc list-inside space-y-1">
            <li><strong>Retry:</strong> Attempt generation again with cleared cache</li>
            <li><strong>Simple Mode:</strong> Generate basic assessments without AI features</li>
            <li><strong>Pre-built:</strong> Use offline assessment templates</li>
          </ul>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 p-4 bg-orange-100 border border-orange-300 rounded text-left">
            <summary className="font-medium text-orange-800 cursor-pointer">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-sm text-orange-700 overflow-auto whitespace-pre-wrap">
              {error.message}\n\n{error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

// Advanced Chat Error Fallback with Context Preservation
const AdvancedChatErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetError }) => {
  const [isRecovering, setIsRecovering] = React.useState(false);
  const [recoveryMessage, setRecoveryMessage] = React.useState('');

  const handleRestoreChat = async () => {
    setIsRecovering(true);
    setRecoveryMessage('Restoring chat context...');
    
    try {
      const recoveryResult = await recoverFromError({
        userId: 'current_user',
        feature: 'advanced_chat',
        section: 'learning',
        errorBoundaryLevel: 'component',
        error,
        context: {
          action: 'restore_chat',
          hasSavedContext: !!sessionStorage.getItem('advanced_chat_context'),
          timestamp: new Date().toISOString()
        },
        recoveryActions: ['preserve_chat_state', 'restore_conversation_context', 'reinitialize_ai_services']
      });

      if (recoveryResult.success) {
        setRecoveryMessage('Chat context restored successfully!');
        setTimeout(() => resetError(), 1500);
      } else {
        setRecoveryMessage('Partial restoration. Some context may be lost.');
        setTimeout(() => resetError(), 2000);
      }
    } catch (restoreErr) {
      console.error('Failed to restore chat context:', restoreErr);
      setRecoveryMessage('Restoration failed. Starting fresh chat.');
      sessionStorage.removeItem('advanced_chat_error_state');
      setTimeout(() => resetError(), 1500);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleBasicChatMode = async () => {
    setIsRecovering(true);
    setRecoveryMessage('Switching to basic chat mode...');
    
    sessionStorage.setItem('chat_mode', 'basic');
    
    try {
      const recoveryResult = await recoverFromError({
        userId: 'current_user',
        feature: 'advanced_chat',
        section: 'learning',
        errorBoundaryLevel: 'component',
        error,
        context: {
          action: 'basic_mode',
          fallback: true
        },
        recoveryActions: ['preserve_chat_state']
      });
      
      setRecoveryMessage('Basic chat mode enabled. Advanced features disabled.');
      setTimeout(() => resetError(), 1500);
    } catch (err) {
      setRecoveryMessage('Basic chat mode activated.');
      setTimeout(() => resetError(), 1000);
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-8 min-h-[400px] bg-purple-50 border border-purple-200 rounded-lg">
      <div className="text-center space-y-4">
        <AlertTriangle className="mx-auto h-12 w-12 text-purple-500" />
        
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">Advanced Chat Error</h3>
          <p className="text-gray-600 max-w-md">
            The advanced chat system encountered an error. Your conversation context may be preserved 
            and can be restored.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            onClick={handleRestoreChat}
            disabled={isRecovering}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRecovering ? 'animate-spin' : ''}`} />
            {isRecovering ? 'Recovering...' : 'Restore Chat'}
          </Button>
          
          <Button 
            onClick={handleBasicChatMode}
            disabled={isRecovering}
            variant="outline"
            className="flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Basic Chat Mode
          </Button>
        </div>
        
        {(isRecovering || recoveryMessage) && (
          <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded text-center">
            <p className="text-sm text-purple-800 font-medium">{recoveryMessage}</p>
          </div>
        )}
        
        <div className="bg-purple-100 p-3 rounded text-sm text-purple-800">
          <strong>Don't worry:</strong> Your learning progress and conversation history are automatically saved. 
          You can continue where you left off.
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mt-4 p-4 bg-purple-100 border border-purple-300 rounded text-left">
            <summary className="font-medium text-purple-800 cursor-pointer">
              Error Details (Development)
            </summary>
            <pre className="mt-2 text-sm text-purple-700 overflow-auto whitespace-pre-wrap">
              {error.message}\n\n{error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

/**
 * Specialized Error Boundaries for different sections
 */

// Page-level error boundary
export const PageErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary 
    level="page" 
    showDialog={true}
    context={{ section: 'page' }}
  >
    {children}
  </ErrorBoundary>
);

// Learning section error boundary
export const LearningErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary 
    level="section" 
    context={{ section: 'learning', feature: 'ai_interaction' }}
  >
    {children}
  </ErrorBoundary>
);

// Chat interface error boundary
export const ChatErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary 
    level="component" 
    context={{ section: 'chat', feature: 'ai_chat' }}
  >
    {children}
  </ErrorBoundary>
);

// Course content error boundary
export const CourseErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ErrorBoundary 
    level="section" 
    context={{ section: 'course', feature: 'content_display' }}
  >
    {children}
  </ErrorBoundary>
);

// Voice Practice error boundary with recovery
export const VoicePracticeErrorBoundary: React.FC<{ children: React.ReactNode; userId?: string }> = ({ children, userId }) => (
  <ErrorBoundary 
    level="component" 
    context={{ 
      section: 'voice_practice', 
      feature: 'speech_analysis', 
      userId,
      recoveryActions: ['reset_voice_state', 'clear_audio_buffers', 'reinitialize_speech_api']
    }}
    fallback={VoicePracticeErrorFallback}
  >
    {children}
  </ErrorBoundary>
);

// Assessment Generator error boundary with recovery
export const AssessmentGeneratorErrorBoundary: React.FC<{ children: React.ReactNode; userId?: string }> = ({ children, userId }) => (
  <ErrorBoundary 
    level="component" 
    context={{ 
      section: 'assessment_generator', 
      feature: 'ai_assessment_creation', 
      userId,
      recoveryActions: ['retry_generation', 'fallback_to_simple_mode', 'clear_generation_cache']
    }}
    fallback={AssessmentGeneratorErrorFallback}
  >
    {children}
  </ErrorBoundary>
);

// Advanced Chat error boundary with context preservation
export const AdvancedChatErrorBoundary: React.FC<{ children: React.ReactNode; userId?: string; activeActions?: any }> = ({ children, userId, activeActions }) => (
  <ErrorBoundary 
    level="component" 
    context={{ 
      section: 'advanced_chat', 
      feature: 'ai_chat_actions', 
      userId,
      activeActions,
      recoveryActions: ['preserve_chat_state', 'restore_conversation_context', 'reinitialize_ai_services']
    }}
    fallback={AdvancedChatErrorFallback}
  >
    {children}
  </ErrorBoundary>
);