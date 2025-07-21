'use client';

import { useState, useEffect } from 'react';
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
  Zap
} from 'lucide-react';
import { LearningContext } from '../../lib/copilotkit/advancedActions';
import { Workflow, WorkflowResult, workflowEngine } from '../../lib/copilotkit/workflowEngine';
import { contextManager } from '../../lib/copilotkit/contextIntegration';

interface SmartActionPanelProps {
  userId: string;
  onActionExecuted?: (actionId: string, result: any) => void;
}

export default function SmartActionPanel({ userId, onActionExecuted }: SmartActionPanelProps) {
  const [context, setContext] = useState<LearningContext | null>(null);
  const [availableWorkflows, setAvailableWorkflows] = useState<Workflow[]>([]);
  const [runningWorkflows, setRunningWorkflows] = useState<Map<string, WorkflowResult>>(new Map());
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Load user context and available actions
  useEffect(() => {
    loadContext();
    const cleanup = contextManager.onContextChange(userId, (newContext) => {
      setContext(newContext);
      updateAvailableWorkflows(newContext);
      updateRecommendations(newContext);
    });

    return cleanup;
  }, [userId]);

  const loadContext = async () => {
    try {
      setLoading(true);
      const userContext = await contextManager.getContext(userId);
      setContext(userContext);
      updateAvailableWorkflows(userContext);
      updateRecommendations(userContext);
    } catch (error) {
      console.error('Failed to load context:', error);
    } finally {
      setLoading(false);
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
          <div className="flex items-center space-x-2">
            <Brain className="h-5 w-5 animate-pulse" />
            <span>Loading intelligent actions...</span>
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
            Unable to load learning context
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Context Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>Learning Context</span>
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