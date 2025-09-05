'use client';

/**
 * Global Error Handler for App Router
 * Catches React rendering errors that occur in the root layout
 * Integrated with Sentry for comprehensive error tracking
 */

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Capture error with Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: error.digest || 'Global Error Boundary',
          errorBoundary: 'global-error',
        },
      },
      tags: {
        section: 'global',
        errorBoundary: 'global-error',
        digest: error.digest,
      },
      level: 'fatal',
      fingerprint: ['global-error', error.name, error.message],
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 Global Error Boundary');
      console.error('Error:', error);
      console.error('Digest:', error.digest);
      console.error('Stack:', error.stack);
      console.groupEnd();
    }
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.268 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              
              <h1 className="mt-4 text-xl font-semibold text-gray-900">
                Something went wrong!
              </h1>
              
              <p className="mt-2 text-sm text-gray-600">
                We apologize for the inconvenience. This error has been automatically reported to our team.
              </p>
              
              {process.env.NODE_ENV === 'development' && (
                <div className="mt-4 p-3 bg-red-50 rounded-md">
                  <p className="text-xs text-red-800 font-medium">Development Info:</p>
                  <p className="text-xs text-red-700 mt-1">{error.message}</p>
                  {error.digest && (
                    <p className="text-xs text-red-600 mt-1">Digest: {error.digest}</p>
                  )}
                </div>
              )}
              
              <div className="mt-6 flex flex-col gap-3">
                <Button
                  onClick={reset}
                  className="w-full"
                  variant="default"
                >
                  Try Again
                </Button>
                
                <Button
                  onClick={() => window.location.href = '/'}
                  className="w-full"
                  variant="outline"
                >
                  Go to Homepage
                </Button>
              </div>
              
              <div className="mt-4 text-xs text-gray-500">
                Error ID: {error.digest || 'Unknown'}
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}