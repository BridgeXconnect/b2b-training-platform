'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Sparkles, 
  Image, 
  Play, 
  Users, 
  MessageSquare,
  Brain,
  Target,
  TrendingUp,
  Award,
  CheckCircle
} from 'lucide-react';

export function AdvancedChatDemo() {
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [completedActions, setCompletedActions] = useState<Set<string>>(new Set());

  const demoActions = [
    {
      id: 'visual_analysis',
      title: 'Visual Analysis & Explanation',
      description: 'Analyze business charts, graphs, and visual data with AI-guided language practice',
      icon: Image,
      color: 'indigo',
      features: [
        'Chart interpretation and description',
        'Business vocabulary extraction',
        'Professional presentation language',
        'Cultural communication tips'
      ],
      example: {
        visual: 'Q3 Sales Performance Chart',
        vocabulary: ['quarterly', 'outperform', 'trend', 'projection'],
        phrases: ['The chart illustrates...', 'There was a 25% increase...', 'Q3 outperformed expectations...']
      }
    },
    {
      id: 'scenario_simulation',
      title: 'Business Scenario Simulations',
      description: 'Role-play realistic business situations with structured learning objectives',
      icon: Play,
      color: 'emerald',
      features: [
        'Interactive role-play scenarios',
        'Multi-stage conversation flows',
        'Real-time performance feedback',
        'Adaptive difficulty adjustment'
      ],
      example: {
        scenario: 'Client Presentation Meeting',
        roles: ['Project Manager', 'Client Representative'],
        stages: ['Opening', 'Presentation', 'Q&A', 'Next Steps'],
        objectives: ['Clear communication', 'Handle objections', 'Secure approval']
      }
    },
    {
      id: 'personalized_coaching',
      title: 'AI-Powered Personal Coaching',
      description: 'Receive targeted coaching for specific language skills with personalized exercises',
      icon: Users,
      color: 'amber',
      features: [
        'Pronunciation coaching',
        'Grammar pattern practice',
        'Vocabulary building exercises',
        'Personalized learning techniques'
      ],
      example: {
        focus: 'Business Email Communication',
        techniques: ['Modal verbs for politeness', 'Conditional structures', 'Professional tone'],
        exercises: ['Email drafting', 'Tone adjustment', 'Formality levels']
      }
    },
    {
      id: 'multi_turn_conversation',
      title: 'Smart Multi-Turn Conversations',
      description: 'Engage in contextual conversations with memory and adaptive responses',
      icon: MessageSquare,
      color: 'rose',
      features: [
        'Context preservation across turns',
        'Learning pattern recognition',
        'Progressive difficulty adjustment',
        'Performance tracking and feedback'
      ],
      example: {
        topic: 'Quarterly Planning Meeting',
        context: 'Budget allocation and resource planning',
        memory: ['Previous decisions', 'User preferences', 'Learning patterns'],
        adaptation: 'Dynamic difficulty and encouragement levels'
      }
    }
  ];

  const handleDemoAction = (actionId: string) => {
    setActiveDemo(activeDemo === actionId ? null : actionId);
    if (!completedActions.has(actionId)) {
      setCompletedActions(prev => new Set([...prev, actionId]));
    }
  };

  const getColorClasses = (color: string) => {
    const colors = {
      indigo: 'border-indigo-200 bg-gradient-to-br from-indigo-50 to-white text-indigo-700',
      emerald: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white text-emerald-700',
      amber: 'border-amber-200 bg-gradient-to-br from-amber-50 to-white text-amber-700',
      rose: 'border-rose-200 bg-gradient-to-br from-rose-50 to-white text-rose-700'
    };
    return colors[color as keyof typeof colors] || colors.indigo;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-3 text-purple-800">
            <Sparkles className="h-6 w-6" />
            <span>Advanced AI Chat Actions</span>
            <Badge variant="outline" className="bg-purple-100 text-purple-700">
              Interactive Demo
            </Badge>
          </CardTitle>
          <CardDescription className="text-purple-700">
            Experience next-generation AI-powered language learning with sophisticated chat interactions, 
            personalized coaching, and immersive business scenario simulations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="bg-white border-purple-200">
            <Brain className="h-4 w-4" />
            <AlertDescription>
              These advanced features use AI to create dynamic, personalized learning experiences 
              that adapt to your progress and provide targeted feedback for accelerated language acquisition.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Demo Actions Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {demoActions.map((action) => {
          const IconComponent = action.icon;
          const isActive = activeDemo === action.id;
          const isCompleted = completedActions.has(action.id);
          
          return (
            <Card 
              key={action.id} 
              className={`${getColorClasses(action.color)} transition-all duration-300 hover:shadow-lg ${
                isActive ? 'ring-2 ring-purple-300 shadow-lg' : ''
              }`}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconComponent className="h-5 w-5" />
                    <span className="text-sm font-semibold">{action.title}</span>
                  </div>
                  {isCompleted && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </CardTitle>
                <CardDescription className="text-sm">
                  {action.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Features List */}
                <div>
                  <h4 className="font-medium text-sm mb-2">Key Features:</h4>
                  <div className="grid grid-cols-1 gap-1">
                    {action.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs">
                        <Target className="h-3 w-3 opacity-60" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Example Content */}
                {isActive && (
                  <div className="bg-white rounded-lg p-4 border border-opacity-20 space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Example Content:
                    </h4>
                    
                    {action.id === 'visual_analysis' && (
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium">Visual:</span>
                          <span className="text-xs ml-2">{action.example.visual}</span>
                        </div>
                        <div>
                          <span className="text-xs font-medium">Vocabulary:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {action.example.vocabulary?.map((word, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {word}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-medium">Key Phrases:</span>
                          <div className="space-y-1 mt-1">
                            {action.example.phrases?.map((phrase, i) => (
                              <div key={i} className="text-xs italic bg-gray-50 p-1 rounded">
                                "{phrase}"
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {action.id === 'scenario_simulation' && (
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium">Scenario:</span>
                          <span className="text-xs ml-2">{action.example.scenario}</span>
                        </div>
                        <div>
                          <span className="text-xs font-medium">Roles:</span>
                          <div className="flex gap-1 mt-1">
                            {action.example.roles?.map((role, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-medium">Stages:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {action.example.stages?.map((stage, i) => (
                              <span key={i} className="text-xs bg-gray-100 px-2 py-1 rounded">
                                {i + 1}. {stage}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {action.id === 'personalized_coaching' && (
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium">Focus:</span>
                          <span className="text-xs ml-2">{action.example.focus}</span>
                        </div>
                        <div>
                          <span className="text-xs font-medium">Techniques:</span>
                          <div className="space-y-1 mt-1">
                            {action.example.techniques?.map((technique, i) => (
                              <div key={i} className="text-xs bg-gray-50 p-1 rounded">
                                • {technique}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-medium">Exercises:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {action.example.exercises?.map((exercise, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {exercise}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {action.id === 'multi_turn_conversation' && (
                      <div className="space-y-2">
                        <div>
                          <span className="text-xs font-medium">Topic:</span>
                          <span className="text-xs ml-2">{action.example.topic}</span>
                        </div>
                        <div>
                          <span className="text-xs font-medium">Context:</span>
                          <span className="text-xs ml-2">{action.example.context}</span>
                        </div>
                        <div>
                          <span className="text-xs font-medium">Memory Features:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {action.example.memory?.map((feature, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-xs font-medium">Adaptation:</span>
                          <span className="text-xs ml-2 italic">{action.example.adaptation}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <Button
                  onClick={() => handleDemoAction(action.id)}
                  className={`w-full ${isActive ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                  variant={isActive ? 'default' : 'outline'}
                >
                  {isActive ? 'Hide Details' : 'Explore Feature'}
                  {isCompleted && !isActive && <CheckCircle className="ml-2 h-4 w-4" />}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Progress Summary */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-green-800">
            <TrendingUp className="h-5 w-5" />
            <span>Feature Exploration Progress</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-green-700">
              Features Explored: {completedActions.size} / {demoActions.length}
            </span>
            <div className="flex space-x-1">
              {demoActions.map((action) => (
                <div
                  key={action.id}
                  className={`h-3 w-3 rounded-full ${
                    completedActions.has(action.id) ? 'bg-green-500' : 'bg-green-200'
                  }`}
                />
              ))}
            </div>
          </div>
          {completedActions.size === demoActions.length && (
            <Alert className="mt-4 bg-green-100 border-green-300">
              <Award className="h-4 w-4" />
              <AlertDescription className="text-green-800">
                🎉 Congratulations! You've explored all advanced chat features. 
                These powerful AI capabilities are now ready to accelerate your language learning journey!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}