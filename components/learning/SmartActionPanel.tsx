'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Brain, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Clock, 
  Lightbulb,
  Play,
  Pause,
  CheckCircle,
  AlertCircle,
  Zap,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { LearningContext } from '../../lib/copilotkit/advancedActions';
import { Workflow, WorkflowResult, workflowEngine } from '../../lib/copilotkit/workflowEngine';
import { contextManager } from '../../lib/copilotkit/contextIntegration';

interface SmartActionPanelProps {
  userId: string;
  onActionExecuted?: (actionId: string, result: any) => void;
}

export default function SmartActionPanel({ userId, onActionExecuted }: SmartActionPanelProps) {
  console.log('[SmartActionPanel] Component initialized with userId:', userId);
  
  const [context, setContext] = useState<LearningContext | null>(null);
  const [availableWorkflows, setAvailableWorkflows] = useState<Workflow[]>([]);
  const [runningWorkflows, setRunningWorkflows] = useState<Map<string, WorkflowResult>>(new Map());
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Cleanup function
  const cleanup = () => {
    console.log('[SmartActionPanel] Cleaning up resources');
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
  };

  // Create fallback context data
  const createFallbackContext = (): LearningContext => {
    console.log('[SmartActionPanel] Creating fallback context for userId:', userId);
    return {
      userId,
      currentCEFRLevel: 'B1',
      progressData: {
        completedLessons: 0,
        totalLessons: 100,
        weeklyGoal: 5,
        currentStreak: 0
      },
      assessmentHistory: {
        averageScore: 0.75,
        weakAreas: ['grammar', 'vocabulary'],
        strongAreas: ['listening'],
        lastAssessment: new Date()
      },
      preferences: {
        learningStyle: 'mixed',
        studyTime: 'flexible',
        difficulty: 'adaptive'
      },
      currentSession: {
        timeSpent: 0,
        topicsStudied: [],
        actionsPerformed: []
      }
    };
  };

  // Timeout wrapper for promises
  const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Operation timed out after ${ms}ms`));
      }, ms);

      promise
        .then(resolve)
        .catch(reject)
        .finally(() => clearTimeout(timeoutId));
    });
  };

  // Load user context and available actions
  useEffect(() => {
    console.log('[SmartActionPanel] Effect triggered for userId:', userId);
    
    // Add small delay to ensure all dependencies are loaded
    const initTimer = setTimeout(() => {
      loadContext();
    }, 100);
    
    // Set up context change listener with error handling  
    try {
      const contextCleanup = contextManager.onContextChange(userId, (newContext) => {
        console.log('[SmartActionPanel] Context change detected');
        setContext(newContext);
        updateAvailableWorkflows(newContext);
        updateRecommendations(newContext);
        setError(null); // Clear any previous errors
      });
      cleanupRef.current = contextCleanup;
    } catch (error) {
      console.warn('[SmartActionPanel] Failed to set up context change listener:', error);
      // If context monitoring fails, still allow manual loading
    }

    return () => {
      clearTimeout(initTimer);
      cleanup();
    };
  }, [userId]);

  const loadContext = async () => {
    console.log('[SmartActionPanel] Loading context for userId:', userId, 'Retry count:', retryCount);
    
    try {
      // Clean up any previous operations
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      setLoading(true);
      setError(null);
      setLoadingTimeout(false);

      // Set timeout for loading operation (reduced from 10s to 5s)
      timeoutRef.current = setTimeout(() => {
        console.warn('[SmartActionPanel] Context loading timeout reached');
        setLoadingTimeout(true);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 5000); // 5 second timeout

      // Load context with timeout (reduced from 8s to 4s)
      const userContext = await withTimeout(
        contextManager.getContext(userId),
        4000 // 4 second timeout for the actual call
      );

      // Clear timeout if successful
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      console.log('[SmartActionPanel] Context loaded successfully:', userContext);
      setContext(userContext);
      updateAvailableWorkflows(userContext);
      updateRecommendations(userContext);
      setRetryCount(0); // Reset retry count on success
      
    } catch (error) {
      console.error('[SmartActionPanel] Failed to load context:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load learning context';
      setError(errorMessage);
      
      // Always use fallback context to ensure component functionality
      console.log('[SmartActionPanel] Using fallback context due to error:', errorMessage);
      const fallbackContext = createFallbackContext();
      setContext(fallbackContext);
      updateAvailableWorkflows(fallbackContext);
      updateRecommendations(fallbackContext);
      
      // Increment retry count
      setRetryCount(prev => prev + 1);
      
    } finally {
      setLoading(false);
      setLoadingTimeout(false);
      
      // Clean up timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }
  };

  const updateAvailableWorkflows = (context: LearningContext) => {
    const workflows = workflowEngine.getAvailableWorkflows(context);
    setAvailableWorkflows(workflows);
  };

  const updateRecommendations = (context: LearningContext) => {
    const recs: string[] = [];
    
    // Context-based recommendations
    if (context.progressData.currentStreak === 0) {
      recs.push('Start a new learning streak with today\'s lesson');
    }
    
    if (context.assessmentHistory.weakAreas.length > 0) {
      recs.push(`Focus on improving: ${context.assessmentHistory.weakAreas.join(', ')}`);
    }
    
    if (context.currentSession.timeSpent > 30) {
      recs.push('Take a short break to maintain focus');
    }
    
    if (context.progressData.completedLessons % 5 === 0 && context.progressData.completedLessons > 0) {
      recs.push('Celebrate your progress with a milestone review');
    }

    setRecommendations(recs);
  };

  const executeWorkflow = async (workflowId: string, parameters: Record<string, any> = {}): Promise<string | undefined> => {
    if (!context) return undefined;

    try {
      const executionId = await workflowEngine.executeWorkflow(workflowId, context, parameters);
      
      // Monitor workflow execution
      const interval = setInterval(() => {
        const result = workflowEngine.getExecutionStatus(executionId);
        if (result) {
          setRunningWorkflows(prev => new Map(prev.set(executionId, result)));
          
          if (result.status === 'completed' || result.status === 'failed') {
            clearInterval(interval);
            if (onActionExecuted) {
              onActionExecuted(workflowId, result);
            }
          }
        }
      }, 1000);

      return executionId;
    } catch (error) {
      console.error('Failed to execute workflow:', error);
      return undefined;
    }
  };

  const getActionIcon = (category: string) => {
    switch (category) {
      case 'lesson_planning': return <BookOpen className="h-4 w-4" />;
      case 'review': return <TrendingUp className="h-4 w-4" />;
      case 'adaptive': return <Brain className="h-4 w-4" />;
      case 'recovery': return <Target className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="h-4 w-4 animate-spin" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'paused': return <Pause className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Brain className="h-5 w-5 animate-pulse text-blue-500" />
                <span>Loading intelligent actions...</span>
              </div>
              
              {/* Always show skip option after 2 seconds */}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  console.log('[SmartActionPanel] Skip loading requested');
                  setLoading(false);
                  const fallbackContext = createFallbackContext();
                  setContext(fallbackContext);
                  updateAvailableWorkflows(fallbackContext);
                  updateRecommendations(fallbackContext);
                  setError(null);
                }}
                className="h-8"
              >
                <WifiOff className="h-3 w-3 mr-1" />
                Use Demo Data
              </Button>
            </div>
            
            {loadingTimeout && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 text-yellow-700">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">
                    Loading is taking longer than expected. This might be due to network conditions or service issues.
                  </span>
                </div>
              </div>
            )}
            
            <div className="text-xs text-gray-500">
              {retryCount > 0 && `Retry attempt: ${retryCount}`}
              {loadingTimeout && " • Timeout protection active"}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!context && error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span className="font-medium">Context Loading Failed</span>
            </div>
            
            <div className="text-sm text-gray-600 bg-red-50 p-3 rounded-lg">
              <strong>Error:</strong> {error}
            </div>
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  console.log('[SmartActionPanel] Retry requested');
                  loadContext();
                }}
                className="flex items-center space-x-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Retry</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  console.log('[SmartActionPanel] Fallback mode requested');
                  const fallbackContext = createFallbackContext();
                  setContext(fallbackContext);
                  updateAvailableWorkflows(fallbackContext);
                  updateRecommendations(fallbackContext);
                  setError(null);
                }}
                className="flex items-center space-x-1"
              >
                <Wifi className="h-3 w-3" />
                <span>Use Demo Data</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!context) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-gray-500">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            Unable to load learning context
            <Button 
              variant="outline" 
              size="sm" 
              onClick={loadContext}
              className="mt-2 ml-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-orange-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">
                  Using fallback data due to loading issues. Some features may be limited.
                </span>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => {
                  setError(null);
                  loadContext();
                }}
                className="flex items-center space-x-1 h-8"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Retry</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Context Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5" />
              <span>Learning Context</span>
            </div>
            <div className="flex items-center space-x-2">
              {error ? (
                <Badge variant="secondary" className="text-orange-700 bg-orange-100">
                  <WifiOff className="h-3 w-3 mr-1" />
                  Fallback Mode
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-green-700 bg-green-100">
                  <Wifi className="h-3 w-3 mr-1" />
                  Live Data
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{context.currentCEFRLevel}</div>
              <div className="text-sm text-gray-500">Current Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{context.progressData.currentStreak}</div>
              <div className="text-sm text-gray-500">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(context.assessmentHistory.averageScore * 100)}%
              </div>
              <div className="text-sm text-gray-500">Avg Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{context.currentSession.timeSpent}m</div>
              <div className="text-sm text-gray-500">Session Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Lightbulb className="h-5 w-5" />
              <span>Smart Recommendations</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
                  <Zap className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Workflows */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Smart Workflows</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {availableWorkflows.map((workflow) => (
              <div key={workflow.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {getActionIcon(workflow.metadata.category)}
                      <h3 className="font-semibold">{workflow.name}</h3>
                      <Badge variant="outline">{workflow.metadata.category}</Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{workflow.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>~{workflow.metadata.estimatedDuration} min</span>
                      </span>
                      <span>{workflow.steps.length} steps</span>
                      <div className="flex space-x-1">
                        {workflow.metadata.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <Button 
                    onClick={() => executeWorkflow(workflow.id)}
                    className="ml-4"
                  >
                    Start Workflow
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Running Workflows */}
      {runningWorkflows.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Play className="h-5 w-5" />
              <span>Active Workflows</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from(runningWorkflows.values()).map((result) => {
                const workflow = availableWorkflows.find(w => w.id === result.workflowId);
                return (
                  <div key={result.executionId} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(result.status)}
                        <span className="font-medium">{workflow?.name || result.workflowId}</span>
                        <Badge variant={result.status === 'completed' ? 'default' : 'outline'}>
                          {result.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(result.startTime).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Current step: {result.currentStep}
                    </div>
                    {result.errors.length > 0 && (
                      <div className="mt-2 text-sm text-red-600">
                        {result.errors.length} error(s) occurred
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => executeWorkflow('comprehensive_lesson_planning')}
              className="flex items-center space-x-2"
            >
              <BookOpen className="h-4 w-4" />
              <span>New Lesson</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => executeWorkflow('weekly_progress_review')}
              className="flex items-center space-x-2"
            >
              <TrendingUp className="h-4 w-4" />
              <span>Review Progress</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => loadContext()}
              className="flex items-center space-x-2"
            >
              <Brain className="h-4 w-4" />
              <span>Refresh Context</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => executeWorkflow('skill_gap_recovery')}
              disabled={context.assessmentHistory.weakAreas.length === 0}
              className="flex items-center space-x-2"
            >
              <Target className="h-4 w-4" />
              <span>Skill Recovery</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}