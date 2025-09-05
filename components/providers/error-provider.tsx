/**
 * Global Error Provider
 * Wraps the entire application with comprehensive error handling
 */

'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/error-boundary';
import * as Sentry from '@sentry/nextjs';

interface GlobalErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

/**
 * Global application error fallback
 */
const GlobalErrorFallback: React.FC<GlobalErrorFallbackProps> = ({ error, resetError }) => {
  React.useEffect(() => {
    // Track global application errors
    Sentry.withScope((scope) => {
      scope.setTag('errorLevel', 'application');
      scope.setTag('errorType', 'global_boundary');
      scope.setContext('global_error', {
        component: 'GlobalErrorProvider',
        recovery_available: true,
      });
      
      // This is already captured by the ErrorBoundary, but we add extra context
      scope.addBreadcrumb({
        message: 'Global error boundary activated',
        category: 'error.global',
        level: 'error',
      });
    });
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg 
              className="w-8 h-8 text-red-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Oops! Something went wrong
          </h1>
          
          <p className="text-gray-600 mb-6">
            The AI Course Platform encountered an unexpected error. 
            Our team has been automatically notified and is working to fix this issue.
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className="mb-6 p-4 bg-red-50 border border-red-200 rounded text-left">
            <summary className="font-medium text-red-800 cursor-pointer mb-2">
              Development Error Details
            </summary>
            <div className="text-sm text-red-700">
              <strong>Error:</strong> {error.message}
              <pre className="mt-2 text-xs overflow-auto max-h-32 bg-red-100 p-2 rounded">
                {error.stack}
              </pre>
            </div>
          </details>
        )}

        <div className="space-y-3">
          <button
            onClick={resetError}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            Try Again
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Return to Home
          </button>
          
          <button
            onClick={() => {
              Sentry.showReportDialog({
                title: 'Report this issue',
                subtitle: 'Help us improve by sharing what happened',
                labelComments: 'What were you trying to do when this error occurred?',
              });
            }}
            className="w-full text-indigo-600 py-2 px-4 rounded-lg hover:bg-indigo-50 transition-colors font-medium"
          >
            Report Issue
          </button>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Error ID: {Sentry.lastEventId() || 'No ID available'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            If the problem persists, please contact support with this ID.
          </p>
        </div>
      </div>
    </div>
  );
};

interface ErrorProviderProps {
  children: React.ReactNode;
}

/**
 * Global Error Provider Component
 */
export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  return (
    <ErrorBoundary
      level="page"
      fallback={({ error, resetError }) => (
        <GlobalErrorFallback error={error} resetError={resetError} />
      )}
      showDialog={false} // We handle dialog manually in the fallback
      context={{
        provider: 'global',
        component: 'ErrorProvider',
        critical: true,
      }}
    >
      {children}
    </ErrorBoundary>
  );
};