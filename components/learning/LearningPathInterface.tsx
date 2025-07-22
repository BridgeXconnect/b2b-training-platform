'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Target, 
  Clock, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Play, 
  Pause,
  RotateCcw,
  Lightbulb,
  BarChart3,
  Route,
  Zap
} from 'lucide-react';

import { 
  LearningPath, 
  LearningPathNode, 
  PathOptimizationResult,
  PathRecommendation,
  LearningAnalytics 
} from '@/lib/learning/types';
import { pathIntelligenceEngine } from '@/lib/learning/pathIntelligence';

interface LearningPathInterfaceProps {
  userId: string;
  currentPath?: LearningPath;
  onPathUpdate?: (path: LearningPath) => void;
  onNodeStart?: (nodeId: string) => void;
  onNodeComplete?: (nodeId: string) => void;
}

export function LearningPathInterface({ 
  userId, 
  currentPath, 
  onPathUpdate, 
  onNodeStart, 
  onNodeComplete 
}: LearningPathInterfaceProps) {
  const [path, setPath] = useState<LearningPath | null>(currentPath || null);
  const [recommendations, setRecommendations] = useState<PathRecommendation[]>([]);
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    if (path) {
      loadAnalytics();
      loadRecommendations();
    }
  }, [path, userId]);

  const loadAnalytics = async () => {
    if (!path) return;
    try {
      const analyticsData = await pathIntelligenceEngine.analyzeProgress(userId, path.id);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const loadRecommendations = async () => {
    if (!path || !analytics) return;
    try {
      // This would integrate with the path intelligence engine
      setRecommendations([
        {
          type: 'content',
          priority: 'high',
          title: 'Add Speaking Practice',
          description: 'Include more dialogue exercises to improve speaking fluency',
          reasoning: 'Analysis shows speaking is your primary weak area',
          impact: { learningEfficiency: 0.2, engagement: 0.15, timeToGoal: -0.1 },
          actionRequired: true
        },
        {
          type: 'pacing',
          priority: 'medium',
          title: 'Adjust Session Length',
          description: 'Optimize to 45-minute sessions for better retention',
          reasoning: 'Your performance peaks at 30-45 minute intervals',
          impact: { learningEfficiency: 0.1, engagement: 0.05, timeToGoal: 0 },
          actionRequired: false
        }
      ]);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const handleNodeStart = (nodeId: string) => {
    setCurrentNodeId(nodeId);
    if (onNodeStart) {
      onNodeStart(nodeId);
    }
  };

  const handleNodeComplete = (nodeId: string) => {
    if (path) {
      const updatedPath = {
        ...path,
        progress: {
          ...path.progress,
          completedNodes: [...path.progress.completedNodes, nodeId],
          currentNodeId: getNextNodeId(nodeId)
        }
      };
      setPath(updatedPath);
      if (onPathUpdate) {
        onPathUpdate(updatedPath);
      }
    }
    if (onNodeComplete) {
      onNodeComplete(nodeId);
    }
  };

  const getNextNodeId = (currentId: string): string | null => {
    if (!path) return null;
    const currentIndex = path.nodes.findIndex(node => node.id === currentId);
    return currentIndex < path.nodes.length - 1 ? path.nodes[currentIndex + 1].id : null;
  };

  const optimizePath = async () => {
    setIsOptimizing(true);
    try {
      // This would call the path optimization engine
      // For now, we'll simulate the optimization
      setTimeout(() => {
        setIsOptimizing(false);
        // Show success message
      }, 2000);
    } catch (error) {
      console.error('Path optimization failed:', error);
      setIsOptimizing(false);
    }
  };

  const calculateProgress = (): number => {
    if (!path) return 0;
    return (path.progress.completedNodes.length / path.nodes.length) * 100;
  };

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getPriorityColor = (priority: string): "default" | "destructive" | "secondary" | "outline" => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  if (!path) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            No Learning Path Available
          </CardTitle>
          <CardDescription>
            Generate an optimized learning path based on your goals and progress.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => {/* Navigate to path creation */}}>
            <Target className="h-4 w-4 mr-2" />
            Create Learning Path
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Path Overview Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Route className="h-5 w-5" />
                {path.title}
              </CardTitle>
              <CardDescription>{path.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={optimizePath}
                disabled={isOptimizing}
              >
                {isOptimizing ? (
                  <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-2" />
                )}
                {isOptimizing ? 'Optimizing...' : 'Optimize Path'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{path.progress.completedNodes.length}</div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{path.nodes.length}</div>
              <div className="text-sm text-muted-foreground">Total Nodes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {formatDuration(path.metadata.totalDuration)}
              </div>
              <div className="text-sm text-muted-foreground">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {analytics?.predictionModel.successProbability ? 
                  Math.round(analytics.predictionModel.successProbability * 100) : '--'}%
              </div>
              <div className="text-sm text-muted-foreground">Success Rate</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{Math.round(calculateProgress())}%</span>
            </div>
            <Progress value={calculateProgress()} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Main Interface Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="path">
            <Route className="h-4 w-4 mr-2" />
            Learning Path
          </TabsTrigger>
          <TabsTrigger value="recommendations">
            <Lightbulb className="h-4 w-4 mr-2" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current Learning Goals */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Learning Goals
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {path.goals.map((goal) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{goal.name}</span>
                        <span>{goal.current}/{goal.target} {goal.unit}</span>
                      </div>
                      <Progress value={(goal.current / goal.target) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Next Up */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Next Up
                </CardTitle>
              </CardHeader>
              <CardContent>
                {path.progress.currentNodeId ? (
                  <div className="space-y-3">
                    {(() => {
                      const currentNode = path.nodes.find(n => n.id === path.progress.currentNodeId);
                      return currentNode ? (
                        <div>
                          <h4 className="font-medium">{currentNode.title}</h4>
                          <p className="text-sm text-muted-foreground mb-3">
                            {currentNode.description}
                          </p>
                          <div className="flex items-center gap-2 mb-3">
                            <Badge variant="outline">{currentNode.contentType}</Badge>
                            <Badge variant="outline">{currentNode.difficulty}</Badge>
                            <span className="text-sm text-muted-foreground">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {formatDuration(currentNode.estimatedDuration)}
                            </span>
                          </div>
                          <Button 
                            onClick={() => handleNodeStart(currentNode.id)}
                            className="w-full"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            Start Learning
                          </Button>
                        </div>
                      ) : null;
                    })()}
                  </div>
                ) : (
                  <p className="text-muted-foreground">All nodes completed! 🎉</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="path" className="space-y-4">
          <div className="space-y-3">
            {path.nodes.map((node, index) => {
              const isCompleted = path.progress.completedNodes.includes(node.id);
              const isCurrent = path.progress.currentNodeId === node.id;
              const isLocked = !isCompleted && !isCurrent && 
                            !path.progress.completedNodes.includes(path.nodes[index - 1]?.id || '');

              return (
                <Card key={node.id} className={`transition-all ${
                  isCurrent ? 'ring-2 ring-blue-500 bg-blue-50' : 
                  isCompleted ? 'bg-green-50' : 
                  isLocked ? 'opacity-60' : ''
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          isCompleted ? 'bg-green-500 text-white' :
                          isCurrent ? 'bg-blue-500 text-white' :
                          'bg-gray-200 text-gray-500'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <span className="text-sm font-medium">{index + 1}</span>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium">{node.title}</h4>
                          <p className="text-sm text-muted-foreground">{node.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{node.contentType}</Badge>
                        <Badge variant={getPriorityColor(node.metadata.priority)}>
                          {node.metadata.priority}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {formatDuration(node.estimatedDuration)}
                        </span>
                        {isCurrent && (
                          <Button 
                            size="sm" 
                            onClick={() => handleNodeStart(node.id)}
                          >
                            <Play className="h-3 w-3 mr-1" />
                            Start
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="space-y-3">
            {recommendations.map((rec, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      {rec.title}
                    </CardTitle>
                    <Badge variant={getPriorityColor(rec.priority)}>
                      {rec.priority}
                    </Badge>
                  </div>
                  <CardDescription>{rec.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{rec.reasoning}</p>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${
                        rec.impact.learningEfficiency > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {rec.impact.learningEfficiency > 0 ? '+' : ''}{Math.round(rec.impact.learningEfficiency * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Efficiency</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${
                        rec.impact.engagement > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {rec.impact.engagement > 0 ? '+' : ''}{Math.round(rec.impact.engagement * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Engagement</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${
                        rec.impact.timeToGoal < 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {rec.impact.timeToGoal < 0 ? '' : '+'}{Math.round(rec.impact.timeToGoal * 100)}%
                      </div>
                      <div className="text-xs text-muted-foreground">Time to Goal</div>
                    </div>
                  </div>
                  {rec.actionRequired && (
                    <Button className="w-full">
                      Apply Recommendation
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Learning Pattern */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Learning Pattern
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Optimal Session</span>
                    <span className="text-sm font-medium">
                      {analytics.learningPattern.optimalSessionLength}min
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Best Time</span>
                    <span className="text-sm font-medium capitalize">
                      {analytics.learningPattern.bestPerformanceTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Learning Speed</span>
                    <span className="text-sm font-medium capitalize">
                      {analytics.learningPattern.learningSpeed}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Retention Rate</span>
                    <span className="text-sm font-medium">
                      {Math.round(analytics.learningPattern.retentionRate * 100)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Skill Profile */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Skill Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-green-600 mb-2">Strengths</h4>
                    {analytics.skillProfile.strengths.map((skill, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{skill.name}</span>
                        <span>{skill.level}%</span>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-red-600 mb-2">Areas for Improvement</h4>
                    {analytics.skillProfile.weaknesses.map((skill, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{skill.name}</span>
                        <span>{skill.level}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}