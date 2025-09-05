'use client';

/**
 * Chunk Load Error Boundary
 * Specialized error boundary for handling JavaScript chunk loading failures
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showReloadButton?: boolean;
  showHomeButton?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isReloading: boolean;
  retryCount: number;
}

export class ChunkLoadErrorBoundary extends Component<Props, State> {
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      isReloading: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Check if this is a chunk loading error
    const isChunkError = error.message.includes('Loading chunk') ||
                        error.message.includes('ChunkLoadError') ||
                        error.name === 'ChunkLoadError';

    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Report to Sentry if available
    if (typeof window !== 'undefined' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: {
          react: {
            componentStack: errorInfo.componentStack
          }
        },
        tags: {
          errorBoundary: 'ChunkLoadErrorBoundary',
          errorType: this.isChunkLoadError(error) ? 'chunk_load' : 'component',
          retryCount: this.state.retryCount
        }
      });
    }

    // Call custom error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Auto-retry for chunk loading errors
    if (this.isChunkLoadError(error) && this.state.retryCount < 2) {
      this.scheduleRetry();
    }
  }

  private isChunkLoadError(error: Error): boolean {
    return error.message.includes('Loading chunk') ||
           error.message.includes('ChunkLoadError') ||
           error.name === 'ChunkLoadError' ||
           error.message.includes('Loading CSS chunk');
  }

  private scheduleRetry = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }

    this.retryTimeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    }, 2000 * (this.state.retryCount + 1)); // Exponential backoff
  };

  private handleReload = () => {
    this.setState({ isReloading: true });
    
    // Clear any cached modules
    if (typeof window !== 'undefined') {
      // Clear service worker cache
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
          registrations.forEach(registration => registration.unregister());
        });
      }
      
      // Clear browser cache and reload
      window.location.reload();
    }
  };

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  override componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  override render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { error } = this.state;
      const isChunkError = error ? this.isChunkLoadError(error) : false;
      const { showReloadButton = true, showHomeButton = true } = this.props;

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
                <span>
                  {isChunkError ? 'Loading Error' : 'Application Error'}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {isChunkError ? (
                    <>
                      There was a problem loading part of the application. 
                      This usually happens due to network issues or when the app is updated.
                    </>
                  ) : (
                    <>
                      An unexpected error occurred. Please try refreshing the page or 
                      contact support if the problem persists.
                    </>
                  )}
                </AlertDescription>
              </Alert>

              {error && (
                <details className="text-sm text-gray-600">
                  <summary className="cursor-pointer font-medium">
                    Technical Details
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                    {error.message}
                  </pre>
                </details>
              )}

              <div className="flex flex-col space-y-2">
                {isChunkError && (
                  <Button 
                    onClick={this.handleRetry}
                    className="w-full"
                    variant="default"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again
                  </Button>
                )}

                {showReloadButton && (
                  <Button 
                    onClick={this.handleReload}
                    disabled={this.state.isReloading}
                    className="w-full"
                    variant="outline"
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${this.state.isReloading ? 'animate-spin' : ''}`} />
                    {this.state.isReloading ? 'Reloading...' : 'Reload Page'}
                  </Button>
                )}

                {showHomeButton && (
                  <Button 
                    onClick={this.handleGoHome}
                    className="w-full"
                    variant="ghost"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Go to Home
                  </Button>
                )}
              </div>

              {this.state.retryCount > 0 && (
                <p className="text-xs text-gray-500 text-center">
                  Retry attempt: {this.state.retryCount}/2
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC to wrap components with chunk load error boundary
 */
export function withChunkErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ChunkLoadErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ChunkLoadErrorBoundary>
  );

  WrappedComponent.displayName = `withChunkErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

export default ChunkLoadErrorBoundary;