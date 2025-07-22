'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  Image, 
  Play, 
  Users, 
  MessageSquare,
  ChevronRight,
  Target,
  Volume2,
  Mic,
  Check,
  X,
  TrendingUp,
  Award
} from 'lucide-react';
import type { 
  VisualAnalysisAction, 
  ScenarioSimulationAction, 
  PersonalizedCoachingAction,
  MultiTurnConversationFlow 
} from '@/lib/learning/chat-actions';

interface AdvancedChatActionsProps {
  visualAnalysis?: VisualAnalysisAction | null;
  activeScenario?: ScenarioSimulationAction | null;
  coachingSession?: PersonalizedCoachingAction | null;
  conversationFlow?: MultiTurnConversationFlow | null;
  onActionComplete?: (action: string, result: any) => void;
}

export function AdvancedChatActions({
  visualAnalysis,
  activeScenario,
  coachingSession,
  conversationFlow,
  onActionComplete
}: AdvancedChatActionsProps) {
  const [activeTab, setActiveTab] = useState('visual');
  const [scenarioProgress, setScenarioProgress] = useState(0);
  const [coachingProgress, setCoachingProgress] = useState<Record<string, boolean>>({});

  // Visual Analysis Component
  const VisualAnalysisPanel = () => {
    if (!visualAnalysis) return null;

    return (
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-indigo-600" />
            Visual Analysis Practice
          </CardTitle>
          <CardDescription>
            Learn to describe and present visual business data effectively
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Visual Description */}
          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <h4 className="font-medium text-sm mb-2">What we're analyzing:</h4>
            <p className="text-sm text-gray-700">{visualAnalysis.visualDescription}</p>
          </div>

          {/* Language Points */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-indigo-600" />
              Key Language Points
            </h4>
            <div className="grid gap-2">
              {visualAnalysis.languagePoints.map((point, index) => (
                <div 
                  key={index} 
                  className="bg-indigo-50 rounded-lg p-3 border border-indigo-100 hover:border-indigo-300 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-indigo-600 mt-0.5">•</span>
                    <p className="text-sm text-gray-700">{point}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vocabulary Practice */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Target className="h-4 w-4 text-indigo-600" />
              Essential Vocabulary
            </h4>
            <div className="grid md:grid-cols-2 gap-3">
              {visualAnalysis.vocabulary.map((vocab, index) => (
                <div 
                  key={index} 
                  className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-indigo-700">{vocab.term}</span>
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                      <Volume2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{vocab.meaning}</p>
                  <p className="text-xs text-indigo-600 italic">"{vocab.usage}"</p>
                </div>
              ))}
            </div>
          </div>

          {/* Cultural Context */}
          {visualAnalysis.culturalContext && (
            <div className="bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg p-4">
              <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Award className="h-4 w-4 text-purple-600" />
                Cultural Insight
              </h4>
              <p className="text-sm text-gray-700">{visualAnalysis.culturalContext}</p>
            </div>
          )}

          {/* Practice Button */}
          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-700"
            onClick={() => onActionComplete?.('visual_practice', { completed: true })}
          >
            Practice Describing This Visual
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  };

  // Scenario Simulation Component
  const ScenarioSimulationPanel = () => {
    if (!activeScenario) return null;

    const currentStage = activeScenario.stages[scenarioProgress] || activeScenario.stages[0];
    const progressPercentage = ((scenarioProgress + 1) / activeScenario.stages.length) * 100;

    return (
      <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-emerald-600" />
            {activeScenario.scenario.title}
          </CardTitle>
          <CardDescription>
            Interactive business scenario simulation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Stage {scenarioProgress + 1} of {activeScenario.stages.length}</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Scenario Context */}
          <div className="bg-white rounded-lg p-4 border border-emerald-100">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <h5 className="font-medium text-xs text-emerald-700 mb-1">Your Role:</h5>
                <p className="text-sm">{activeScenario.scenario.roleYouPlay}</p>
              </div>
              <div>
                <h5 className="font-medium text-xs text-emerald-700 mb-1">AI Role:</h5>
                <p className="text-sm">{activeScenario.scenario.roleAIPlays}</p>
              </div>
            </div>
            <div className="pt-3 border-t">
              <p className="text-sm text-gray-600">{activeScenario.scenario.context}</p>
            </div>
          </div>

          {/* Current Stage */}
          <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-emerald-600" />
              {currentStage.name}
            </h4>
            <p className="text-sm text-gray-700 mb-3">{currentStage.description}</p>
            
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-emerald-700">Required Actions:</h5>
              <div className="space-y-1">
                {currentStage.requiredActions.map((action, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="text-xs text-emerald-700">{index + 1}</span>
                    </div>
                    <span className="text-gray-700">{action}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Objectives */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Scenario Objectives:</h4>
            <div className="grid gap-2">
              {activeScenario.scenario.objectives.map((objective, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg p-2"
                >
                  <Target className="h-3 w-3 text-emerald-500 flex-shrink-0" />
                  <span className="text-gray-700">{objective}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => {
                if (scenarioProgress < activeScenario.stages.length - 1) {
                  setScenarioProgress(scenarioProgress + 1);
                }
              }}
            >
              {scenarioProgress < activeScenario.stages.length - 1 ? 'Next Stage' : 'Complete Scenario'}
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
            <Button 
              variant="outline"
              className="border-emerald-300"
              onClick={() => onActionComplete?.('scenario_help', { stage: currentStage.name })}
            >
              Get Help
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Personalized Coaching Component
  const PersonalizedCoachingPanel = () => {
    if (!coachingSession) return null;

    const completedExercises = Object.values(coachingProgress).filter(Boolean).length;
    const totalExercises = coachingSession.practiceExercises.length;
    const progressPercentage = (completedExercises / totalExercises) * 100;

    return (
      <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-600" />
            Personalized {coachingSession.focus.area} Coaching
          </CardTitle>
          <CardDescription>
            Tailored exercises and techniques for your learning style
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Overview */}
          <div className="bg-white rounded-lg p-4 border border-amber-100">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-sm">Skill Progress</h4>
              <Badge variant="outline" className="text-xs">
                {coachingSession.coachingStyle} style
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Current Level</span>
                <span className="font-medium">{coachingSession.focus.currentLevel}/10</span>
              </div>
              <Progress value={coachingSession.focus.currentLevel * 10} className="h-2" />
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span>Target: {coachingSession.focus.targetLevel}/10</span>
                <span>Focus: {coachingSession.focus.specificSkill}</span>
              </div>
            </div>
          </div>

          {/* Techniques */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-amber-600" />
              Learning Techniques
            </h4>
            <div className="space-y-3">
              {coachingSession.techniques.map((technique, index) => (
                <div 
                  key={index} 
                  className="bg-amber-50 rounded-lg p-4 border border-amber-100"
                >
                  <h5 className="font-semibold text-sm text-amber-800 mb-2">
                    {technique.name}
                  </h5>
                  <p className="text-sm text-gray-700 mb-2">{technique.description}</p>
                  <div className="bg-white rounded p-2 border border-amber-200">
                    <p className="text-xs text-amber-700 italic">
                      Example: {technique.example}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Practice Exercises */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Practice Exercises</h4>
              <span className="text-xs text-gray-600">
                {completedExercises}/{totalExercises} completed
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2 mb-3" />
            <div className="grid gap-3">
              {coachingSession.practiceExercises.map((exercise, index) => (
                <div 
                  key={index} 
                  className={`bg-white rounded-lg p-4 border ${
                    coachingProgress[`exercise_${index}`] 
                      ? 'border-green-300 bg-green-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h5 className="font-medium text-sm">{exercise.type}</h5>
                      <p className="text-xs text-gray-600">{exercise.duration} minutes</p>
                    </div>
                    {coachingProgress[`exercise_${index}`] ? (
                      <Check className="h-5 w-5 text-green-600" />
                    ) : (
                      <Badge variant="outline" className="text-xs">
                        Level {exercise.difficulty}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{exercise.instructions}</p>
                  <div className="flex gap-2">
                    <Button 
                      size="sm"
                      className={`flex-1 ${
                        coachingProgress[`exercise_${index}`]
                          ? 'bg-green-600 hover:bg-green-700'
                          : 'bg-amber-600 hover:bg-amber-700'
                      }`}
                      onClick={() => {
                        setCoachingProgress(prev => ({
                          ...prev,
                          [`exercise_${index}`]: true
                        }));
                        onActionComplete?.('exercise_complete', { 
                          exercise: exercise.type,
                          index 
                        });
                      }}
                    >
                      {coachingProgress[`exercise_${index}`] ? 'Completed' : 'Start Exercise'}
                    </Button>
                    <Button 
                      size="sm"
                      variant="outline"
                      className="border-amber-300"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Multi-turn Conversation Component
  const ConversationFlowPanel = () => {
    if (!conversationFlow) return null;

    const turnProgress = (conversationFlow.currentTurn / conversationFlow.maxTurns) * 100;

    return (
      <Card className="border-rose-200 bg-gradient-to-br from-rose-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-rose-600" />
            Multi-turn Conversation Practice
          </CardTitle>
          <CardDescription>
            {conversationFlow.context.topic}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Turn {conversationFlow.currentTurn} of {conversationFlow.maxTurns}</span>
              <span>{Math.round(turnProgress)}% Complete</span>
            </div>
            <Progress value={turnProgress} className="h-2" />
          </div>

          {/* Context */}
          <div className="bg-white rounded-lg p-4 border border-rose-100">
            <h4 className="font-medium text-sm mb-2">Scenario Context</h4>
            <p className="text-sm text-gray-700">{conversationFlow.context.businessScenario}</p>
          </div>

          {/* Conversation Flow */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-rose-50 rounded-lg p-3 border border-rose-100">
              <h5 className="font-medium text-xs text-rose-700 mb-2">Topics Covered</h5>
              <div className="space-y-1">
                {conversationFlow.context.previousPoints.map((point, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <Check className="h-3 w-3 text-green-600" />
                    <span className="text-gray-700">{point}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-rose-50 rounded-lg p-3 border border-rose-100">
              <h5 className="font-medium text-xs text-rose-700 mb-2">Upcoming Topics</h5>
              <div className="space-y-1">
                {conversationFlow.context.upcomingPoints.map((point, index) => (
                  <div key={index} className="flex items-center gap-2 text-xs">
                    <ChevronRight className="h-3 w-3 text-rose-400" />
                    <span className="text-gray-700">{point}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="bg-gradient-to-r from-rose-100 to-pink-100 rounded-lg p-4">
            <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-rose-600" />
              Your Performance
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-xs text-gray-600 mb-1">Successful Phrases</p>
                <p className="font-semibold text-rose-700">
                  {conversationFlow.memory.successfulPhrases.length} used
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Vocabulary Range</p>
                <p className="font-semibold text-rose-700">
                  {conversationFlow.memory.vocabularyUsed.length} words
                </p>
              </div>
            </div>
            {conversationFlow.memory.userMistakes.length > 0 && (
              <div className="mt-3 pt-3 border-t border-rose-200">
                <p className="text-xs text-gray-600 mb-1">Areas for improvement:</p>
                <div className="flex flex-wrap gap-1">
                  {conversationFlow.memory.userMistakes.slice(0, 3).map((mistake, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {mistake}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Adaptive Settings */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Encouragement Level</span>
            <div className="flex gap-1">
              {Array.from({ length: 5 }, (_, i) => (
                <div
                  key={i}
                  className={`h-2 w-2 rounded-full ${
                    i < conversationFlow.adaptations.encouragementLevel
                      ? 'bg-rose-500'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="visual" className="text-xs">
            <Image className="h-3 w-3 mr-1" />
            Visual
          </TabsTrigger>
          <TabsTrigger value="scenario" className="text-xs">
            <Play className="h-3 w-3 mr-1" />
            Scenario
          </TabsTrigger>
          <TabsTrigger value="coaching" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            Coaching
          </TabsTrigger>
          <TabsTrigger value="conversation" className="text-xs">
            <MessageSquare className="h-3 w-3 mr-1" />
            Conversation
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visual" className="mt-4">
          <VisualAnalysisPanel />
        </TabsContent>

        <TabsContent value="scenario" className="mt-4">
          <ScenarioSimulationPanel />
        </TabsContent>

        <TabsContent value="coaching" className="mt-4">
          <PersonalizedCoachingPanel />
        </TabsContent>

        <TabsContent value="conversation" className="mt-4">
          <ConversationFlowPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}