'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, BookOpen, Smile, Target, FileText, BarChart3, Calendar, TrendingUp, Brain, Image, Play, Users, MessageSquare } from 'lucide-react';
import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChatMessage } from './ChatMessage';
import { useChat, ChatProvider } from '@/lib/contexts/ChatContext';
import { CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { logger } from '@/lib/logger';
import { 
  adaptiveDifficultyEngine, 
  createDifficultyContext, 
  updateRealTimeMetrics,
  type DifficultyLevel,
  type RealTimePerformanceMetrics,
  type DifficultyAdjustment,
  type UserDifficultyFeedback
} from '@/lib/services/adaptive-difficulty';
import { CEFRLevel } from '@/lib/types/user';
import { chatActionHandlers, conversationManager, type VisualAnalysisAction, type ScenarioSimulationAction, type PersonalizedCoachingAction, type MultiTurnConversationFlow } from '@/lib/learning/chat-actions';

function AIChatInterfaceContent({ businessContext, learningGoals, cefrLevel }: {
  businessContext: string;
  learningGoals: string[];
  cefrLevel: string;
}) {
  const [inputValue, setInputValue] = useState('');
  const [generatedLesson, setGeneratedLesson] = useState<any>(null);
  const [progressAnalysis, setProgressAnalysis] = useState<any>(null);
  const [assessment, setAssessment] = useState<any>(null);
  const [studyPlan, setStudyPlan] = useState<any>(null);
  
  // Advanced chat action states
  const [visualAnalysis, setVisualAnalysis] = useState<VisualAnalysisAction | null>(null);
  const [activeScenario, setActiveScenario] = useState<ScenarioSimulationAction | null>(null);
  const [coachingSession, setCoachingSession] = useState<PersonalizedCoachingAction | null>(null);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [scenarioStage, setScenarioStage] = useState(0);
  
  const { messages, isLoading, sendMessage, currentSessionId } = useChat();

  // Enhanced send message with error tracking
  const handleSendMessageWithTracking = useCallback(async (message: string, context?: string) => {
    try {
      logger.addBreadcrumb(`Sending message: ${context || 'user-input'}`, 'chat', {
        messageLength: message.length,
        context,
        sessionId: currentSessionId,
      });
      
      await sendMessage(message);
      
      logger.addBreadcrumb('Message sent successfully', 'chat', {
        context,
        sessionId: currentSessionId,
      });
    } catch (error) {
      logger.sentryError(
        error instanceof Error ? error : new Error(String(error)),
        'CHAT',
        {
          context: context || 'user-input',
          message: message.substring(0, 100), // First 100 chars for context
          sessionId: currentSessionId,
        }
      );
      throw error; // Re-throw to let the UI handle the error display
    }
  }, [sendMessage, currentSessionId]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Adaptive Difficulty State
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel | null>(null);
  const [realTimeMetrics, setRealTimeMetrics] = useState<RealTimePerformanceMetrics | undefined>();
  const [difficultyAdjustments, setDifficultyAdjustments] = useState<DifficultyAdjustment[]>([]);
  const [showDifficultyIndicator, setShowDifficultyIndicator] = useState(true);
  const [userFeedbackPrompt, setUserFeedbackPrompt] = useState<boolean>(false);

  // Adaptive Difficulty Functions
  const initializeDifficulty = useCallback(async () => {
    if (!currentSessionId) return;
    
    try {
      const context = createDifficultyContext(
        'user-id', // In real app, get from auth context
        currentSessionId,
        {
          id: 'user-id',
          cefrLevel: cefrLevel as CEFRLevel,
          targetCefrLevel: cefrLevel as CEFRLevel,
          learningGoals: learningGoals,
          businessContext: businessContext,
          preferences: {
            sessionLength: 30,
            challengeLevel: 'balanced'
          }
        } as any,
        {
          accuracy: 0.7,
          consistency: 0.8,
          improvement: 0.1,
          engagement: 0.8,
          completionRate: 0.9
        } as any
      );
      
      const result = await adaptiveDifficultyEngine.calculateDifficulty(context);
      setCurrentDifficulty(result.recommendedLevel);
    } catch (error) {
      console.error('Failed to initialize difficulty:', error);
    }
  }, [currentSessionId, cefrLevel, learningGoals, businessContext]);

  const updateRealTimePerformance = useCallback((response: {
    isCorrect: boolean;
    responseTime: number;
    confidence?: number;
    engagement?: number;
    strugglingWith?: string[];
  }) => {
    const updatedMetrics = updateRealTimeMetrics(realTimeMetrics, response);
    setRealTimeMetrics(updatedMetrics);
    
    // Trigger real-time adjustment if needed
    if (currentDifficulty && updatedMetrics.totalAttempts % 3 === 0) {
      checkForDifficultyAdjustment(updatedMetrics);
    }
  }, [realTimeMetrics, currentDifficulty]);

  const checkForDifficultyAdjustment = useCallback(async (metrics: RealTimePerformanceMetrics) => {
    if (!currentDifficulty || !currentSessionId) return;
    
    try {
      const context = createDifficultyContext(
        'user-id',
        currentSessionId,
        {
          id: 'user-id',
          cefrLevel: cefrLevel as CEFRLevel,
          targetCefrLevel: cefrLevel as CEFRLevel,
          learningGoals: learningGoals,
          businessContext: businessContext,
          preferences: {
            sessionLength: 30,
            challengeLevel: 'balanced'
          }
        } as any,
        {
          accuracy: 0.7,
          consistency: 0.8,
          improvement: 0.1,
          engagement: 0.8,
          completionRate: 0.9
        } as any
      );
      
      context.realTimeMetrics = metrics;
      
      const adjustment = await adaptiveDifficultyEngine.adjustRealTime(
        currentDifficulty,
        metrics,
        context
      );
      
      if (Math.abs(adjustment.recommendedDifficulty.overall - currentDifficulty.overall) >= 5) {
        setDifficultyAdjustments(prev => [...prev, adjustment]);
        setCurrentDifficulty(adjustment.recommendedDifficulty);
        
        // Show user feedback prompt occasionally
        if (Math.random() < 0.3) {
          setUserFeedbackPrompt(true);
        }
      }
    } catch (error) {
      console.error('Failed to adjust difficulty:', error);
    }
  }, [currentDifficulty, currentSessionId, cefrLevel, learningGoals, businessContext]);

  const submitDifficultyFeedback = useCallback(async (feedback: Omit<UserDifficultyFeedback, 'userId' | 'sessionId'>) => {
    if (!currentSessionId) return;
    
    const fullFeedback: UserDifficultyFeedback = {
      ...feedback,
      userId: 'user-id',
      sessionId: currentSessionId,
      timestamp: new Date()
    };
    
    try {
      await adaptiveDifficultyEngine.processFeedback('user-id', fullFeedback);
      setUserFeedbackPrompt(false);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  }, [currentSessionId]);

  // Make learning context readable to CopilotKit
  useCopilotReadable({
    description: "Current learning context, user progress, and adaptive difficulty information",
    value: {
      businessContext,
      learningGoals,
      cefrLevel,
      currentSessionId,
      messageCount: messages.length,
      learningAreas: ["business communication", "presentation skills", "email writing", "negotiations"],
      // Adaptive Difficulty Context
      currentDifficulty: currentDifficulty ? {
        overall: currentDifficulty.overall,
        cognitive: currentDifficulty.cognitive,
        linguistic: currentDifficulty.linguistic,
        contextual: currentDifficulty.contextual,
        description: currentDifficulty.description
      } : null,
      realTimeMetrics: realTimeMetrics ? {
        accuracy: realTimeMetrics.totalAttempts > 0 ? realTimeMetrics.correctAnswers / realTimeMetrics.totalAttempts : 0,
        averageResponseTime: realTimeMetrics.averageResponseTime,
        confidenceLevel: realTimeMetrics.confidenceLevel,
        engagementScore: realTimeMetrics.engagementScore,
        strugglingIndicators: realTimeMetrics.strugglingIndicators,
        frustratedIndicators: realTimeMetrics.frustratedIndicators,
        boredIndicators: realTimeMetrics.boredIndicators
      } : null,
      recentAdjustments: difficultyAdjustments.slice(-2).map(adj => ({
        reason: adj.adjustmentReason.explanation,
        confidenceLevel: adj.adjustmentReason.confidenceLevel,
        timeframe: adj.timeframe,
        difficultyChange: adj.recommendedDifficulty.overall - adj.currentDifficulty.overall
      }))
    }
  });

  // Adaptive Difficulty Action: Adjust conversation difficulty in real-time
  useCopilotAction({
    name: "adjust_difficulty_realtime",
    description: "Adjust conversation difficulty based on user performance and provide feedback",
    parameters: [
      {
        name: "performanceAssessment",
        type: "object",
        description: "Assessment of current user performance",
        required: true,
      },
      {
        name: "suggestionType",
        type: "string",
        description: "Type of difficulty adjustment (easier, harder, maintain, adaptive)",
        required: true,
      }
    ],
    handler: async ({ performanceAssessment, suggestionType }) => {
      // Process performance metrics based on assessment
      const assessment = performanceAssessment as any; // Type assertion for flexibility
      const performanceData = {
        isCorrect: assessment.accuracy > 0.7,
        responseTime: assessment.responseTime || 15,
        confidence: assessment.confidence || 0.7,
        engagement: assessment.engagement || 0.8,
        strugglingWith: assessment.strugglingWith || []
      };
      
      // Update real-time performance
      updateRealTimePerformance(performanceData);
      
      // Generate adaptive response
      let adjustmentMessage = '';
      const currentLevel = currentDifficulty?.overall || 50;
      
      switch (suggestionType) {
        case 'easier':
          adjustmentMessage = `I've noticed you might be finding this challenging. Let me adjust the conversation to be more supportive and use simpler language structures. Current difficulty: ${currentLevel}/100`;
          break;
        case 'harder':
          adjustmentMessage = `You're doing great! Let me increase the complexity a bit with more advanced vocabulary and business scenarios. Current difficulty: ${currentLevel}/100`;
          break;
        case 'adaptive':
          adjustmentMessage = `Based on your performance, I'm automatically adjusting the conversation difficulty to match your current level. This helps optimize your learning experience. Current difficulty: ${currentLevel}/100`;
          break;
        default:
          adjustmentMessage = `Maintaining current difficulty level based on your performance. You're doing well! Current difficulty: ${currentLevel}/100`;
      }
      
      return adjustmentMessage;
    },
    render: ({ status, args, result }) => {
      if (status === "complete" && currentDifficulty) {
        return (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 my-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-purple-900">Adaptive Difficulty Adjustment</h3>
              <Badge variant="outline">Level {currentDifficulty.overall}/100</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div className="text-center">
                <div className="text-sm font-medium text-purple-700">Overall</div>
                <div className="text-lg font-bold text-purple-900">{currentDifficulty.overall}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-purple-700">Cognitive</div>
                <div className="text-lg font-bold text-purple-900">{currentDifficulty.cognitive}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-purple-700">Linguistic</div>
                <div className="text-lg font-bold text-purple-900">{currentDifficulty.linguistic}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-purple-700">Contextual</div>
                <div className="text-lg font-bold text-purple-900">{currentDifficulty.contextual}</div>
              </div>
            </div>
            <div className="text-xs text-purple-600 bg-white rounded p-2">
              <strong>Adjustment:</strong> {currentDifficulty.description}
            </div>
            {realTimeMetrics && (
              <div className="mt-2 text-xs text-purple-600">
                <strong>Performance:</strong> {realTimeMetrics.totalAttempts > 0 ? 
                  `${Math.round((realTimeMetrics.correctAnswers / realTimeMetrics.totalAttempts) * 100)}% accuracy` : 
                  'Building baseline'
                } • Confidence: {Math.round(realTimeMetrics.confidenceLevel * 100)}%
              </div>
            )}
          </div>
        );
      }
      return <div></div>;
    }
  });

  // Frontend action: Create personalized lesson
  useCopilotAction({
    name: "create_lesson_frontend",
    description: "Create a personalized lesson and display it in the interface",
    parameters: [
      {
        name: "topic",
        type: "string",
        description: "The main topic for the lesson",
        required: true,
      },
      {
        name: "focusArea",
        type: "string", 
        description: "Specific area to focus on (e.g., grammar, vocabulary, conversation)",
        required: false,
      }
    ],
    handler: async ({ topic, focusArea }) => {
      const lesson = {
        title: `${topic} Lesson`,
        cefrLevel,
        focusArea: focusArea || "general",
        activities: [
          { type: "vocabulary", duration: 10, description: `Key vocabulary for ${topic}` },
          { type: "practice", duration: 15, description: `Practice exercises for ${topic}` },
          { type: "roleplay", duration: 10, description: `Role-play scenarios using ${topic}` }
        ],
        vocabulary: [
          { word: "example", meaning: "An instance of something", example: `Here's an example of ${topic}` }
        ],
        createdAt: new Date().toISOString()
      };
      setGeneratedLesson(lesson);
      return `Created a personalized lesson on ${topic}${focusArea ? ` focusing on ${focusArea}` : ''}. The lesson includes vocabulary, practice exercises, and role-play activities.`;
    },
    render: ({ status, args, result }) => {
      if (status === "complete" && generatedLesson) {
        return (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 my-4">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">{generatedLesson.title}</h3>
              <Badge variant="outline">{generatedLesson.cefrLevel}</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-blue-700">Focus: {generatedLesson.focusArea}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {generatedLesson.activities.map((activity: any, index: number) => (
                  <div key={index} className="bg-white rounded p-2 border border-blue-100">
                    <div className="font-medium text-xs text-blue-800 capitalize">{activity.type}</div>
                    <div className="text-xs text-gray-600">{activity.duration} min</div>
                    <div className="text-xs mt-1">{activity.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      }
      return <div></div>;
    }
  });

  // Frontend action: Analyze learning progress  
  useCopilotAction({
    name: "analyze_progress_frontend",
    description: "Analyze learning progress and show visual feedback",
    parameters: [
      {
        name: "timeframe",
        type: "string",
        description: "Analysis timeframe (week, month, quarter)",
        required: true,
      }
    ],
    handler: async ({ timeframe }) => {
      const analysis = {
        timeframe,
        completedLessons: Math.floor(Math.random() * 20) + 5,
        totalStudyTime: Math.floor(Math.random() * 50) + 10,
        improvementAreas: ["pronunciation", "grammar", "vocabulary"],
        strongAreas: ["listening", "reading comprehension"],
        recommendedFocus: "speaking practice",
        progressScore: Math.floor(Math.random() * 30) + 70
      };
      setProgressAnalysis(analysis);
      return `Analyzed your progress for the past ${timeframe}. You've completed ${analysis.completedLessons} lessons with ${analysis.totalStudyTime} hours of study time. Your progress score is ${analysis.progressScore}%.`;
    },
    render: ({ status, args, result }) => {
      if (status === "complete" && progressAnalysis) {
        return (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 my-4">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="h-5 w-5 text-green-600" />
              <h3 className="font-semibold text-green-900">Progress Analysis</h3>
              <Badge variant="outline">{progressAnalysis.timeframe}</Badge>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
              <div className="text-center">
                <div className="text-lg font-bold text-green-700">{progressAnalysis.completedLessons}</div>
                <div className="text-xs text-gray-600">Lessons</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-700">{progressAnalysis.totalStudyTime}h</div>
                <div className="text-xs text-gray-600">Study Time</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-700">{progressAnalysis.progressScore}%</div>
                <div className="text-xs text-gray-600">Progress</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-700">{progressAnalysis.strongAreas.length}</div>
                <div className="text-xs text-gray-600">Strong Areas</div>
              </div>
            </div>
            <div className="text-sm">
              <p className="mb-1"><strong>Focus on:</strong> {progressAnalysis.recommendedFocus}</p>
              <p><strong>Strong areas:</strong> {progressAnalysis.strongAreas.join(", ")}</p>
            </div>
          </div>
        );
      }
      return <div></div>;
    }
  });

  // Frontend action: Create assessment
  useCopilotAction({
    name: "create_assessment_frontend", 
    description: "Create and display an interactive assessment",
    parameters: [
      {
        name: "skillArea",
        type: "string",
        description: "Skill to assess (vocabulary, grammar, listening, speaking)",
        required: true,
      },
      {
        name: "questionCount",
        type: "number",
        description: "Number of questions (5-20)",
        required: false,
      }
    ],
    handler: async ({ skillArea, questionCount = 10 }) => {
      const assessment = {
        title: `${skillArea.charAt(0).toUpperCase() + skillArea.slice(1)} Assessment`,
        skillArea,
        questionCount,
        estimatedTime: questionCount * 2,
        difficulty: cefrLevel,
        questions: Array.from({length: questionCount}, (_, i) => ({
          id: i + 1,
          question: `Sample ${skillArea} question ${i + 1}`,
          type: "multiple-choice",
          options: ["Option A", "Option B", "Option C", "Option D"]
        })),
        createdAt: new Date().toISOString()
      };
      setAssessment(assessment);
      return `Created a ${questionCount}-question assessment for ${skillArea}. Estimated completion time: ${assessment.estimatedTime} minutes.`;
    },
    render: ({ status, args, result }) => {
      if (status === "complete" && assessment) {
        return (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 my-4">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-5 w-5 text-purple-600" />
              <h3 className="font-semibold text-purple-900">{assessment.title}</h3>
              <Badge variant="outline">{assessment.difficulty}</Badge>
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-purple-700">
                {assessment.questionCount} questions • {assessment.estimatedTime} minutes
              </div>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                Start Assessment
              </Button>
            </div>
            <div className="text-xs text-gray-600">
              Skill focus: {assessment.skillArea} • Difficulty: {assessment.difficulty}
            </div>
          </div>
        );
      }
      return <div></div>;
    }
  });

  // Advanced Action: Visual Analysis
  useCopilotAction({
    name: "analyze_visual",
    description: "Analyze images, diagrams, or visual business content and explain in the target language",
    parameters: [
      { name: "visualContent", type: "string", description: "Visual content to analyze" },
      { name: "analysisDepth", type: "string", description: "Level of analysis depth" },
      { name: "languageFocus", type: "string", description: "Language focus for analysis" }
    ],
    handler: async (params: { visualContent: any; analysisDepth: any; languageFocus: any }) => {
      const analysis: VisualAnalysisAction = {
        type: 'visual_analysis',
        visualDescription: 'A quarterly sales chart showing 25% growth in Q3',
        languagePoints: [
          'Use "The chart shows..." to introduce data',
          'Express percentages: "There was a 25% increase..."',
          'Compare periods: "Q3 outperformed Q2 by..."'
        ],
        vocabulary: [
          {
            term: 'quarterly',
            meaning: 'occurring every three months',
            usage: 'Our quarterly reports show steady growth.'
          }
        ],
        culturalContext: 'In business presentations, always lead with the key takeaway.'
      };
      return { analysis };
    },
    render: ({ status, result }: { status: string; result: any }) => {
      if (status === "complete" && result?.analysis) {
        const analysis = result.analysis as VisualAnalysisAction;
        setVisualAnalysis(analysis);
        return (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 my-4">
            <div className="flex items-center gap-2 mb-3">
              <Image className="h-5 w-5 text-indigo-600" />
              <h3 className="font-semibold text-indigo-900">Visual Analysis</h3>
              <Badge variant="outline">Language Practice</Badge>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded p-3 border border-indigo-100">
                <p className="text-sm text-gray-700 mb-2">{analysis.visualDescription}</p>
                <div className="space-y-1">
                  <h4 className="font-medium text-xs text-indigo-800">Language Points:</h4>
                  {analysis.languagePoints.map((point, index) => (
                    <div key={index} className="text-xs text-gray-600 flex items-start gap-1">
                      <span className="text-indigo-500">•</span>
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {analysis.vocabulary.slice(0, 4).map((vocab, index) => (
                  <div key={index} className="bg-white rounded p-2 border border-indigo-100">
                    <div className="font-medium text-xs text-indigo-800">{vocab.term}</div>
                    <div className="text-xs text-gray-600">{vocab.meaning}</div>
                    <div className="text-xs text-indigo-600 italic mt-1">"{vocab.usage}"</div>
                  </div>
                ))}
              </div>
              {analysis.culturalContext && (
                <div className="bg-indigo-100 rounded p-2">
                  <div className="text-xs font-medium text-indigo-800">Cultural Tip:</div>
                  <div className="text-xs text-indigo-700">{analysis.culturalContext}</div>
                </div>
              )}
            </div>
          </div>
        );
      }
      return <div></div>;
    }
  });

  // Advanced Action: Scenario Simulation
  useCopilotAction({
    name: "start_scenario",
    description: "Start an interactive business scenario simulation for practice",
    parameters: [
      { name: "scenarioType", type: "string", description: "Type of business scenario" },
      { name: "difficulty", type: "string", description: "Difficulty level" },
      { name: "industry", type: "string", description: "Industry context" }
    ],
    handler: async (params: { scenarioType: any; difficulty: any; industry: any }) => {
      const { scenarioType, difficulty, industry } = params;
      const scenario: ScenarioSimulationAction = {
        type: 'scenario_simulation',
        scenario: {
          title: 'Client Meeting Simulation',
          context: 'You are presenting a project update to an important client.',
          roleYouPlay: 'Project Manager',
          roleAIPlays: 'Client Representative',
          objectives: ['Present progress clearly', 'Address concerns', 'Secure approval'],
          challengeLevel: 6
        },
        stages: [
          {
            name: 'Opening',
            description: 'Welcome and agenda setting',
            requiredActions: ['Professional greeting', 'Set expectations'],
            successCriteria: ['Clear communication', 'Professional tone']
          }
        ],
        feedback: { realTime: true, focusAreas: ['presentation skills'] }
      };
      return { scenario };
    },
    render: ({ status, result }: { status: string; result: any }) => {
      if (status === "complete" && result?.scenario) {
        const scenario = result.scenario as ScenarioSimulationAction;
        setActiveScenario(scenario);
        setScenarioStage(0);
        return (
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 my-4">
            <div className="flex items-center gap-2 mb-3">
              <Play className="h-5 w-5 text-emerald-600" />
              <h3 className="font-semibold text-emerald-900">{scenario.scenario.title}</h3>
              <Badge variant="outline">Level {scenario.scenario.challengeLevel}/10</Badge>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded p-3 border border-emerald-100">
                <p className="text-sm text-gray-700 mb-2">{scenario.scenario.context}</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="font-medium text-emerald-700">You are:</span>
                    <span className="text-gray-600 ml-1">{scenario.scenario.roleYouPlay}</span>
                  </div>
                  <div>
                    <span className="font-medium text-emerald-700">I am:</span>
                    <span className="text-gray-600 ml-1">{scenario.scenario.roleAIPlays}</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm text-emerald-800 mb-2">Objectives:</h4>
                <div className="space-y-1">
                  {scenario.scenario.objectives.map((objective, index) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                      <Target className="h-3 w-3 text-emerald-500" />
                      <span className="text-gray-700">{objective}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-emerald-100 rounded p-3">
                <h4 className="font-medium text-sm text-emerald-800 mb-1">
                  Stage {scenarioStage + 1}: {scenario.stages[scenarioStage].name}
                </h4>
                <p className="text-xs text-emerald-700 mb-2">
                  {scenario.stages[scenarioStage].description}
                </p>
                <Button 
                  size="sm" 
                  className="bg-emerald-600 hover:bg-emerald-700 text-xs"
                  onClick={() => {
                    sendMessage(`Let's begin: ${scenario.stages[scenarioStage].requiredActions[0]}`);
                  }}
                >
                  Start This Stage
                </Button>
              </div>
            </div>
          </div>
        );
      }
      return <div></div>;
    }
  });

  // Advanced Action: Personalized Coaching
  useCopilotAction({
    name: "provide_coaching",
    description: "Provide personalized language coaching and feedback",
    parameters: [
      { name: "coachingArea", type: "string", description: "Area to focus coaching on" },
      { name: "userLevel", type: "string", description: "User's current level" },
      { name: "focusSkills", type: "string", description: "Skills to focus on" }
    ],
    handler: async (params: { coachingArea: any; userLevel: any; focusSkills: any }) => {
      const { coachingArea, userLevel, focusSkills } = params;
      const coaching: PersonalizedCoachingAction = {
        type: 'personalized_coaching',
        coachingStyle: 'balanced',
        focus: {
          area: 'pronunciation',
          specificSkill: 'business terminology',
          currentLevel: 6,
          targetLevel: 8
        },
        techniques: [
          {
            name: 'Stress Patterns',
            description: 'Practice word stress in business terms',
            example: 'pre-SEN-ta-tion, not PRE-sen-ta-tion'
          }
        ],
        practiceExercises: [
          {
            type: 'Pronunciation Practice',
            duration: 10,
            difficulty: 6,
            instructions: 'Practice key business terms focusing on correct stress patterns.'
          }
        ]
      };
      return { coaching };
    },
    render: ({ status, result }) => {
      if (status === "complete" && result?.coaching) {
        const coaching = result.coaching as PersonalizedCoachingAction;
        setCoachingSession(coaching);
        return (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 my-4">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-amber-600" />
              <h3 className="font-semibold text-amber-900">Personalized Coaching</h3>
              <Badge variant="outline" className="capitalize">{coaching.coachingStyle}</Badge>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded p-3 border border-amber-100">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm text-amber-800">{coaching.focus.area}</h4>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-gray-600">Progress:</span>
                    <div className="flex gap-1">
                      {Array.from({ length: 10 }, (_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < coaching.focus.currentLevel
                              ? 'bg-amber-500'
                              : i < coaching.focus.targetLevel
                              ? 'bg-amber-200'
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  Focus: {coaching.focus.specificSkill}
                </p>
              </div>
              <div>
                <h4 className="font-medium text-sm text-amber-800 mb-2">Techniques:</h4>
                <div className="space-y-2">
                  {coaching.techniques.map((technique, index) => (
                    <div key={index} className="bg-white rounded p-2 border border-amber-100">
                      <div className="font-medium text-xs text-amber-700">{technique.name}</div>
                      <div className="text-xs text-gray-600">{technique.description}</div>
                      <div className="text-xs text-amber-600 italic mt-1">Example: {technique.example}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium text-sm text-amber-800 mb-2">Practice Exercises:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {coaching.practiceExercises.map((exercise, index) => (
                    <div key={index} className="bg-amber-100 rounded p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-xs text-amber-800">{exercise.type}</span>
                        <span className="text-xs text-amber-700">{exercise.duration} min</span>
                      </div>
                      <div className="text-xs text-amber-700">{exercise.instructions}</div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2 text-xs border-amber-300 hover:bg-amber-200"
                        onClick={() => sendMessage(`Start ${exercise.type} exercise`)}
                      >
                        Start Exercise
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      }
      return <div></div>;
    }
  });

  // Advanced Action: Multi-turn Conversation
  useCopilotAction({
    name: "continue_conversation",
    description: "Continue a multi-turn conversation with context awareness",
    parameters: [
      { name: "conversationId", type: "string", description: "Conversation identifier" },
      { name: "turnCount", type: "number", description: "Number of conversation turns" },
      { name: "context", type: "string", description: "Conversation context" }
    ],
    handler: async (params: { conversationId: any; turnCount: any; context: any }) => {
      const conversationFlow: MultiTurnConversationFlow = {
        type: 'multi_turn_conversation',
        conversationId: `conv_${currentSessionId}_${Date.now()}`,
        currentTurn: 3,
        maxTurns: 8,
        context: {
          topic: 'Budget Planning Meeting',
          businessScenario: 'Quarterly budget review and planning session',
          previousPoints: ['Q3 performance review', 'Resource analysis'],
          upcomingPoints: ['Q4 projections', 'Investment priorities']
        },
        memory: {
          userMistakes: ['tense confusion', 'missing articles'],
          successfulPhrases: ['effective negotiation phrases', 'clear explanations'],
          vocabularyUsed: ['budget', 'projections', 'resources', 'investment'],
          grammarPatterns: ['conditional sentences', 'passive voice']
        },
        adaptations: {
          difficultyAdjustment: 0,
          encouragementLevel: 4
        }
      };
      return { conversationFlow, feedback: { positive: 'Good use of business terminology', improvement: 'Work on tense consistency', suggestion: 'Try using more conditional phrases' } };
    },
    render: ({ status, result }) => {
      if (status === "complete" && result?.conversationFlow) {
        const flow = result.conversationFlow as MultiTurnConversationFlow;
        return (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 my-4">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="h-5 w-5 text-rose-600" />
              <h3 className="font-semibold text-rose-900">Conversation Progress</h3>
              <Badge variant="outline">Turn {flow.currentTurn}/{flow.maxTurns}</Badge>
            </div>
            <div className="space-y-3">
              <div className="bg-white rounded p-3 border border-rose-100">
                <h4 className="font-medium text-sm text-rose-800 mb-2">{flow.context.topic}</h4>
                <p className="text-xs text-gray-600 mb-2">{flow.context.businessScenario}</p>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-rose-600">✓</span>
                    <span className="text-gray-600">Covered: {flow.context.previousPoints.length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-rose-600">→</span>
                    <span className="text-gray-600">Upcoming: {flow.context.upcomingPoints.length}</span>
                  </div>
                </div>
              </div>
              {result.feedback && (
                <div className="bg-rose-100 rounded p-3">
                  <h4 className="font-medium text-xs text-rose-800 mb-1">Feedback:</h4>
                  <div className="space-y-1 text-xs">
                    {result.feedback.positive && (
                      <div className="text-green-700">✓ {result.feedback.positive}</div>
                    )}
                    {result.feedback.improvement && (
                      <div className="text-amber-700">↑ {result.feedback.improvement}</div>
                    )}
                    {result.feedback.suggestion && (
                      <div className="text-rose-700">💡 {result.feedback.suggestion}</div>
                    )}
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white rounded p-2 border border-rose-100">
                  <div className="font-medium text-rose-700">Successful Phrases</div>
                  <div className="text-gray-600">{flow.memory.successfulPhrases.length} recorded</div>
                </div>
                <div className="bg-white rounded p-2 border border-rose-100">
                  <div className="font-medium text-rose-700">Areas to Improve</div>
                  <div className="text-gray-600">{flow.memory.userMistakes.length} identified</div>
                </div>
              </div>
            </div>
          </div>
        );
      }
      return <div></div>;
    }
  });

  // Frontend action: Generate study plan
  useCopilotAction({
    name: "create_study_plan_frontend",
    description: "Create and display a personalized study plan",
    parameters: [
      {
        name: "targetLevel",
        type: "string", 
        description: "Target CEFR level (A1, A2, B1, B2, C1, C2)",
        required: true,
      },
      {
        name: "weeksToGoal",
        type: "number",
        description: "Number of weeks to reach the goal",
        required: false,
      }
    ],
    handler: async ({ targetLevel, weeksToGoal = 12 }) => {
      const plan = {
        currentLevel: cefrLevel,
        targetLevel,
        duration: weeksToGoal,
        studyHoursPerWeek: 8,
        milestones: [
          { week: Math.floor(weeksToGoal * 0.25), goal: "Foundation building", skills: ["vocabulary expansion", "basic grammar"] },
          { week: Math.floor(weeksToGoal * 0.5), goal: "Skill development", skills: ["conversation practice", "writing exercises"] },
          { week: Math.floor(weeksToGoal * 0.75), goal: "Advanced practice", skills: ["business scenarios", "presentation skills"] },
          { week: weeksToGoal, goal: "Target achievement", skills: ["assessment preparation", "final review"] }
        ],
        createdAt: new Date().toISOString()
      };
      setStudyPlan(plan);
      return `Created a ${weeksToGoal}-week study plan to progress from ${cefrLevel} to ${targetLevel}. Plan includes 4 major milestones with ${plan.studyHoursPerWeek} hours per week.`;
    },
    render: ({ status, args, result }) => {
      if (status === "complete" && studyPlan) {
        return (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 my-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="h-5 w-5 text-orange-600" />
              <h3 className="font-semibold text-orange-900">Study Plan</h3>
              <Badge variant="outline">{studyPlan.currentLevel} → {studyPlan.targetLevel}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div className="text-sm">
                <strong>Duration:</strong> {studyPlan.duration} weeks
              </div>
              <div className="text-sm">
                <strong>Study time:</strong> {studyPlan.studyHoursPerWeek}h/week
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-orange-800">Milestones:</h4>
              {studyPlan.milestones.map((milestone: any, index: number) => (
                <div key={index} className="bg-white rounded p-2 border border-orange-100">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-xs">Week {milestone.week}</span>
                    <span className="text-xs text-gray-600">{milestone.goal}</span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Focus: {milestone.skills.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }
      return <div></div>;
    }
  });

  // Auto-focus textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize chat session and adaptive difficulty when component mounts
  useEffect(() => {
    if (currentSessionId && !currentDifficulty) {
      initializeDifficulty();
    }
  }, [currentSessionId, businessContext, learningGoals, cefrLevel, initializeDifficulty, currentDifficulty]);

  const handleSend = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    try {
      await handleSendMessageWithTracking(inputValue.trim(), 'user-input');
      setInputValue('');
      
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      // Error is already logged by handleSendMessageWithTracking
      // UI error handling can be added here if needed
      console.error('Failed to send message:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  };

  const suggestedPrompts = [
    "Start a business conversation about project updates",
    "Help me practice giving feedback to team members",
    "Let's discuss quarterly budget planning",
    "Role-play a client presentation",
    "Practice explaining technical concepts simply"
  ];

  const suggestions = [
    { text: "Start a business conversation", emoji: "👔", category: "Practice" },
    { text: "Give feedback to team", emoji: "💬", category: "Practice" },
    { text: "Explain quarterly budget", emoji: "📊", category: "Explain" },
    { text: "Practice client presentation", emoji: "🎯", category: "Practice" },
    { text: "Simplify technical concepts", emoji: "🔧", category: "Practice" },
  ];
  
  const advancedActions = [
    { 
      text: "Analyze a business chart", 
      emoji: "📈", 
      action: "analyze_visual",
      description: "Practice describing visual data"
    },
    { 
      text: "Start negotiation scenario", 
      emoji: "🤝", 
      action: "start_scenario",
      params: { scenarioType: "negotiation" },
      description: "Role-play business negotiation"
    },
    { 
      text: "Get pronunciation coaching", 
      emoji: "🎯", 
      action: "provide_coaching",
      params: { coachingArea: "pronunciation", userLevel: 5 },
      description: "Improve your pronunciation"
    },
    { 
      text: "Practice presentation Q&A", 
      emoji: "🎤", 
      action: "start_scenario",
      params: { scenarioType: "presentation" },
      description: "Handle executive questions"
    }
  ];

  // Session greeting for new sessions
  const getSessionGreeting = () => {
    if (messages.length === 0) {
      return `Welcome to your ${businessContext} training session! I'm here to help you practice ${learningGoals.join(" and ")} at CEFR ${cefrLevel} level. How would you like to start?`;
    }
    return null;
  };

  const greeting = getSessionGreeting();

  return (
    <div className="flex flex-col h-[600px] max-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <Card className="rounded-none border-x-0 border-t-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                B2B English Learning Assistant
              </CardTitle>
              <CardDescription className="text-sm">
                Practice {businessContext} conversations at CEFR {cefrLevel} level
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                CEFR {cefrLevel}
              </Badge>
              {currentSessionId && (
                <Badge variant="secondary" className="text-xs">
                  Session Active
                </Badge>
              )}
              {currentDifficulty && showDifficultyIndicator && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-purple-600" />
                  <Badge variant="outline" className="text-xs bg-purple-50 border-purple-200 text-purple-800">
                    Adaptive {currentDifficulty.overall}/100
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {/* Session greeting */}
        {greeting && (
          <Alert>
            <Smile className="h-4 w-4" />
            <AlertDescription>{greeting}</AlertDescription>
          </Alert>
        )}

        {/* Suggested prompts for empty chat */}
        {messages.length === 0 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-3">Try practicing with:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestions.map((suggestion) => (
                  <Button
                    key={suggestion.text}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto py-2 px-3 text-xs"
                    onClick={() => setInputValue(suggestion.text)}
                  >
                    <span className="mr-2">{suggestion.emoji}</span>
                    <span className="text-gray-600">{suggestion.text}</span>
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-3">Advanced Learning Features:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {advancedActions.map((action) => (
                  <Button
                    key={action.text}
                    variant="outline"
                    size="sm"
                    className="justify-start text-left h-auto py-3 px-3 text-xs border-2 hover:border-blue-400 transition-colors"
                    onClick={() => {
                      // Trigger the advanced action
                      const actionMessage = action.params 
                        ? `/${action.action} ${JSON.stringify(action.params)}`
                        : `/${action.action}`;
                      sendMessage(actionMessage);
                    }}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span>{action.emoji}</span>
                        <span className="font-medium text-gray-700">{action.text}</span>
                      </div>
                      <span className="text-gray-500 text-xs">{action.description}</span>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* User Difficulty Feedback Prompt */}
        {userFeedbackPrompt && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-yellow-600" />
              <h4 className="font-medium text-yellow-900">Quick Feedback</h4>
            </div>
            <p className="text-sm text-yellow-800 mb-3">
              How is the current difficulty level for you?
            </p>
            <div className="flex gap-2 flex-wrap">
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-yellow-300 hover:bg-yellow-100"
                onClick={() => submitDifficultyFeedback({
                  contentId: 'current-session',
                  perceivedDifficulty: 'too-easy' as const,
                  confidence: 'medium' as const,
                  enjoyment: 3,
                  frustration: 2,
                  comments: 'Too easy - user feedback',
                  timestamp: new Date()
                })}
              >
                Too Easy
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-yellow-300 hover:bg-yellow-100"
                onClick={() => submitDifficultyFeedback({
                  contentId: 'current-session',
                  perceivedDifficulty: 'just-right' as const,
                  confidence: 'high' as const,
                  enjoyment: 4,
                  frustration: 2,
                  comments: 'Just right - user feedback',
                  timestamp: new Date()
                })}
              >
                Just Right
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-xs border-yellow-300 hover:bg-yellow-100"
                onClick={() => submitDifficultyFeedback({
                  contentId: 'current-session',
                  perceivedDifficulty: 'too-hard' as const,
                  confidence: 'low' as const,
                  enjoyment: 2,
                  frustration: 4,
                  comments: 'Too hard - user feedback',
                  timestamp: new Date()
                })}
              >
                Too Hard
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-xs text-yellow-700"
                onClick={() => setUserFeedbackPrompt(false)}
              >
                Skip
              </Button>
            </div>
          </div>
        )}

        {/* Existing messages */}
        <div className="space-y-4">
          {messages.map((message) => (
            <ChatMessage
              key={message.id}
              {...message}
            />
          ))}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            AI is thinking...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <Card className="rounded-none border-x-0 border-b-0 bg-white">
        <div className="p-4">
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Type your message for language practice..."
              className="min-h-[44px] max-h-[120px] resize-none bg-gray-50 border-gray-200"
              rows={1}
              disabled={isLoading}
            />
            <Button 
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="h-10 px-3 bg-blue-600 hover:bg-blue-700"
              size="icon"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>Press Enter to send • Shift+Enter for new line</span>
            <span>{inputValue.length}/1000</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

interface AIChatInterfaceProps {
  businessContext: string;
  learningGoals: string[];
  cefrLevel: string;
}

export default function AIChatInterface({ businessContext, learningGoals, cefrLevel }: AIChatInterfaceProps) {
  
  // Set up user context for Sentry on component mount
  useEffect(() => {
    logger.setLearningContext(
      `chat-${Date.now()}`, // session ID
      'ai-course-platform', // course ID
      'ai-chat' // lesson ID
    );
    logger.addBreadcrumb('AI Chat Interface mounted', 'ui', {
      businessContext,
      cefrLevel,
      learningGoals: learningGoals.length,
    });
  }, [businessContext, cefrLevel, learningGoals]);

  return (
    <ErrorBoundary context="ai-chat-interface">
      <ChatProvider>
        <AIChatInterfaceContent
          businessContext={businessContext}
          learningGoals={learningGoals}
          cefrLevel={cefrLevel}
        />
      </ChatProvider>
    </ErrorBoundary>
  );
}

// Wrapper component for easier usage
export function LearningChatInterface({ user }: { user: { cefrLevel: string } }) {
  const businessContext = "B2B sales";
  const learningGoals = ["email writing", "presentations", "client communication", "negotiations"];
  
  return (
    <AIChatInterface
      businessContext={businessContext}
      learningGoals={learningGoals}
      cefrLevel={user.cefrLevel}
    />
  );
}