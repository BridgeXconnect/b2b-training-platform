'use client';

/**
 * Error Boundary Testing Component
 * Used to validate error boundary functionality in development
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Bug, 
  AlertTriangle, 
  Mic, 
  FileText, 
  MessageCircle,
  RefreshCw,
  TestTube
} from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

interface ErrorTestComponentProps {
  errorType: 'voice' | 'assessment' | 'chat' | 'generic';
  shouldError: boolean;
  userId?: string;
}

/**
 * Component that throws specific errors for testing
 */
const ErrorTestComponent: React.FC<ErrorTestComponentProps> = ({ errorType, shouldError, userId }) => {
  if (!shouldError) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center gap-2 text-green-800">
          <TestTube className="h-4 w-4" />
          <span className="font-medium">{errorType} component working normally</span>
        </div>
        <p className="text-sm text-green-600 mt-1">
          This component is functioning properly. Click "Trigger Error" to test error boundary.
        </p>
      </div>
    );
  }

  // Simulate different types of errors
  switch (errorType) {
    case 'voice':
      throw new Error('Voice Recognition API failed: Microphone permission denied. Speech analysis cannot proceed.');
    
    case 'assessment':
      throw new Error('Assessment Generation failed: AI service unavailable. Unable to create adaptive questions.');
    
    case 'chat':
      throw new Error('Advanced Chat Error: Conversation context corrupted. Unable to maintain chat state.');
    
    case 'generic':
    default:
      throw new Error('Generic component error: Unexpected state encountered during rendering.');
  }
};

export default function ErrorBoundaryTest() {
  const [voiceError, setVoiceError] = useState(false);
  const [assessmentError, setAssessmentError] = useState(false);
  const [chatError, setChatError] = useState(false);
  const [genericError, setGenericError] = useState(false);

  const resetAllErrors = () => {
    setVoiceError(false);
    setAssessmentError(false);
    setChatError(false);
    setGenericError(false);
  };

  const userId = 'test_user_123';

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-red-600" />
            Error Boundary Testing Suite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Development Only:</strong> This component tests error boundary functionality.
              It will trigger real errors to validate recovery mechanisms.
            </AlertDescription>
          </Alert>
          
          <div className="flex gap-2 mb-6">
            <Button onClick={resetAllErrors} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset All
            </Button>
            <Badge variant="secondary">
              User ID: {userId}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Voice Practice Error Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Mic className="h-5 w-5 text-green-600" />
              Voice Practice Error Boundary Test
            </span>
            <Button 
              onClick={() => setVoiceError(!voiceError)}
              variant={voiceError ? "destructive" : "default"}
              size="sm"
            >
              {voiceError ? 'Stop Error' : 'Trigger Error'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorBoundary 
            context="voice_practice_test"
          >
            <ErrorTestComponent 
              errorType="voice" 
              shouldError={voiceError} 
              userId={userId}
            />
          </ErrorBoundary>
        </CardContent>
      </Card>

      {/* Assessment Generator Error Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-orange-600" />
              Assessment Generator Error Boundary Test
            </span>
            <Button 
              onClick={() => setAssessmentError(!assessmentError)}
              variant={assessmentError ? "destructive" : "default"}
              size="sm"
            >
              {assessmentError ? 'Stop Error' : 'Trigger Error'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorBoundary 
            context="assessment_generator_test"
          >
            <ErrorTestComponent 
              errorType="assessment" 
              shouldError={assessmentError} 
              userId={userId}
            />
          </ErrorBoundary>
        </CardContent>
      </Card>

      {/* Advanced Chat Error Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-purple-600" />
              Advanced Chat Error Boundary Test
            </span>
            <Button 
              onClick={() => setChatError(!chatError)}
              variant={chatError ? "destructive" : "default"}
              size="sm"
            >
              {chatError ? 'Stop Error' : 'Trigger Error'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorBoundary 
            context="advanced_chat_test"
          >
            <ErrorTestComponent 
              errorType="chat" 
              shouldError={chatError} 
              userId={userId}
            />
          </ErrorBoundary>
        </CardContent>
      </Card>

      {/* Generic Error Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              Generic Error Boundary Test
            </span>
            <Button 
              onClick={() => setGenericError(!genericError)}
              variant={genericError ? "destructive" : "default"}
              size="sm"
            >
              {genericError ? 'Stop Error' : 'Trigger Error'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ErrorBoundary 
            context="generic_error_test"
          >
            <ErrorTestComponent 
              errorType="generic" 
              shouldError={genericError} 
              userId={userId}
            />
          </ErrorBoundary>
        </CardContent>
      </Card>

      {/* Testing Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">How to Test Error Boundaries:</h4>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Click "Trigger Error" on any component above</li>
                <li>Observe the specialized error fallback UI</li>
                <li>Try the recovery actions (Reset, Simple Mode, etc.)</li>
                <li>Check browser console for error reporting</li>
                <li>Verify Sentry error tracking (if configured)</li>
                <li>Test backend cleanup API calls</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">What to Look For:</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600">
                <li>Feature-specific error messages and recovery options</li>
                <li>Loading states during recovery attempts</li>
                <li>Successful session cleanup and state restoration</li>
                <li>Fallback modes (text-only, simple, basic) working</li>
                <li>Error reporting to backend APIs</li>
                <li>Sentry integration with proper context</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
              <p className="text-yellow-800 text-sm">
                <strong>Note:</strong> This component should only be used in development.
                Remove or conditionally render it in production.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}