'use client';

import { useState } from 'react';
import { log } from '../../lib/logger';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import AIChatInterface from '../../components/learning/AIChatInterface';
import ProgressDashboard from '../../components/learning/ProgressDashboard';
import AssessmentGenerator from '../../components/learning/AssessmentGenerator';
import SmartActionPanel from '../../components/learning/SmartActionPanel';
import ContentGenerationPanel from '../../components/content/ContentGenerationPanel';
import MultiModalPanel from '../../components/content/MultiModalPanel';
import { LearningPathInterface } from '../../components/learning/LearningPathInterface';
import { PathOptimizationWizard } from '../../components/learning/PathOptimizationWizard';
import { Brain, MessageCircle, TrendingUp, FileText, Zap, Monitor, Route, Target, Sparkles, Mic } from 'lucide-react';
import { LearningPath } from '../../lib/learning/types';
import { AdvancedChatActions } from '../../components/learning/AdvancedChatActions';
import VoicePracticeInterface from '../../components/voice/VoicePracticeInterface';
import type { VisualAnalysisAction, ScenarioSimulationAction, PersonalizedCoachingAction, MultiTurnConversationFlow } from '../../lib/learning/chat-actions';

export default function LearningPortal() {
  const [activeTab, setActiveTab] = useState('smart-actions');
  const [userId] = useState('user-demo-id'); // In real app, get from auth
  const [currentLearningPath, setCurrentLearningPath] = useState<LearningPath | null>(null);
  const [showPathWizard, setShowPathWizard] = useState(false);
  
  // Advanced chat action states
  const [visualAnalysis, setVisualAnalysis] = useState<VisualAnalysisAction | null>(null);
  const [activeScenario, setActiveScenario] = useState<ScenarioSimulationAction | null>(null);
  const [coachingSession, setCoachingSession] = useState<PersonalizedCoachingAction | null>(null);
  const [conversationFlow, setConversationFlow] = useState<MultiTurnConversationFlow | null>(null);

  const handleActionExecuted = (actionId: string, result: any) => {
    log.userAction('Action executed', userId, { actionId, result });
    // Handle action results - could update other components
  };

  const handlePathGenerated = (path: LearningPath) => {
    setCurrentLearningPath(path);
    setShowPathWizard(false);
    setActiveTab('learning-path');
    log.userAction('Learning path generated', userId, { pathId: path.id, title: path.title });
  };

  const handlePathUpdate = (updatedPath: LearningPath) => {
    setCurrentLearningPath(updatedPath);
    log.userAction('Learning path updated', userId, { pathId: updatedPath.id });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 flex items-center justify-center space-x-3">
            <Brain className="h-10 w-10 text-blue-600" />
            <span>Learning Portal</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            AI-powered learning experience with intelligent workflows and personalized content
          </p>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-10">
            <TabsTrigger value="learning-path" className="flex items-center space-x-2">
              <Route className="h-4 w-4" />
              <span className="hidden sm:inline">Learning Path</span>
            </TabsTrigger>
            <TabsTrigger value="smart-actions" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Smart Actions</span>
            </TabsTrigger>
            <TabsTrigger value="content-generation" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Content</span>
            </TabsTrigger>
            <TabsTrigger value="multimodal" className="flex items-center space-x-2">
              <Monitor className="h-4 w-4" />
              <span className="hidden sm:inline">Multi-Modal</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">AI Chat</span>
            </TabsTrigger>
            <TabsTrigger value="advanced-chat" className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline">Advanced Chat</span>
            </TabsTrigger>
            <TabsTrigger value="voice-practice" className="flex items-center space-x-2">
              <Mic className="h-4 w-4" />
              <span className="hidden sm:inline">Voice Practice</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Progress</span>
            </TabsTrigger>
            <TabsTrigger value="assessments" className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Assessments</span>
            </TabsTrigger>
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
          </TabsList>

          {/* Learning Path Tab */}
          <TabsContent value="learning-path" className="space-y-6">
            {showPathWizard ? (
              <PathOptimizationWizard
                userId={userId}
                onPathGenerated={handlePathGenerated}
                onCancel={() => setShowPathWizard(false)}
              />
            ) : (
              <LearningPathInterface
                userId={userId}
                currentPath={currentLearningPath || undefined}
                onPathUpdate={handlePathUpdate}
                onNodeStart={(nodeId) => {
                  log.userAction('Learning node started', userId, { nodeId });
                }}
                onNodeComplete={(nodeId) => {
                  log.userAction('Learning node completed', userId, { nodeId });
                }}
              />
            )}
          </TabsContent>

          {/* Smart Actions Tab */}
          <TabsContent value="smart-actions" className="space-y-6">
            <SmartActionPanel 
              userId={userId} 
              onActionExecuted={handleActionExecuted}
            />
          </TabsContent>

          {/* Content Generation Tab */}
          <TabsContent value="content-generation" className="space-y-6">
            <ContentGenerationPanel 
              userId={userId}
              onContentGenerated={(content) => console.log('Content generated:', content)}
              onContentSelected={(content) => console.log('Content selected:', content)}
            />
          </TabsContent>

          {/* Multi-Modal Tab */}
          <TabsContent value="multimodal" className="space-y-6">
            <MultiModalPanel 
              userId={userId}
              onContentCreated={(content) => {
                log.userAction('Multi-modal content created', userId, { contentId: content.id, type: content.type });
                console.log('Multi-modal content created:', content);
              }}
              onContentSelected={(content) => {
                log.userAction('Multi-modal content selected', userId, { contentId: content.id, type: content.type });
                console.log('Multi-modal content selected:', content);
              }}
              accessibility={{
                screenReader: false,
                keyboardNavigation: true,
                highContrast: false,
                audioDescriptions: true,
                closedCaptions: true,
                signLanguage: false,
                reducedMotion: false,
                fontSize: 'adjustable',
                colorBlindSupport: false,
                alternativeText: [],
                voiceOver: {
                  enabled: false,
                  language: 'en',
                  speed: 'normal',
                  voice: 'neutral',
                  descriptions: []
                }
              }}
            />
          </TabsContent>

          {/* AI Chat Tab */}
          <TabsContent value="chat" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageCircle className="h-5 w-5" />
                  <span>AI Learning Assistant</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AIChatInterface 
                  businessContext="Business English for Corporate Training"
                  learningGoals={["Professional communication", "Meeting participation", "Email writing"]}
                  cefrLevel="B2"
                />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Advanced Chat Actions Tab */}
          <TabsContent value="advanced-chat" className="space-y-6">
            <div className="grid gap-6">
              {/* Header */}
              <Card className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-purple-800">
                    <Sparkles className="h-5 w-5" />
                    <span>Advanced AI Chat Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-purple-700 mb-4">
                    Experience sophisticated AI-powered learning interactions including visual analysis, 
                    scenario simulations, personalized coaching, and multi-turn conversation flows.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-1">Visual Analysis</h4>
                      <p className="text-purple-600">Describe charts, graphs, and business visuals</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-1">Scenario Practice</h4>
                      <p className="text-purple-600">Role-play business situations</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-1">Personal Coaching</h4>
                      <p className="text-purple-600">Get tailored language coaching</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-purple-200">
                      <h4 className="font-semibold text-purple-800 mb-1">Smart Conversations</h4>
                      <p className="text-purple-600">Multi-turn contextual dialogues</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Advanced Chat Actions Component */}
              <AdvancedChatActions
                visualAnalysis={visualAnalysis}
                activeScenario={activeScenario}
                coachingSession={coachingSession}
                conversationFlow={conversationFlow}
                onActionComplete={(action, result) => {
                  log.userAction('Advanced chat action completed', userId, { action, result });
                  handleActionExecuted(`advanced_${action}`, result);
                }}
              />
              
              {/* Demo Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Try Advanced Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                      onClick={() => setVisualAnalysis({
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
                          },
                          {
                            term: 'outperform',
                            meaning: 'to do better than',
                            usage: 'Q3 outperformed our expectations.'
                          }
                        ],
                        culturalContext: 'In business presentations, always lead with the key takeaway.'
                      })}
                      className="p-4 text-left bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors"
                    >
                      <div className="font-semibold text-indigo-800 mb-2">📊 Analyze Chart</div>
                      <div className="text-sm text-indigo-600">Practice describing business data</div>
                    </button>
                    
                    <button
                      onClick={() => setActiveScenario({
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
                      })}
                      className="p-4 text-left bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors"
                    >
                      <div className="font-semibold text-emerald-800 mb-2">🎭 Role-Play</div>
                      <div className="text-sm text-emerald-600">Practice client interactions</div>
                    </button>
                    
                    <button
                      onClick={() => setCoachingSession({
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
                      })}
                      className="p-4 text-left bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors"
                    >
                      <div className="font-semibold text-amber-800 mb-2">🎯 Get Coaching</div>
                      <div className="text-sm text-amber-600">Personalized language coaching</div>
                    </button>
                    
                    <button
                      onClick={() => setConversationFlow({
                        type: 'multi_turn_conversation',
                        conversationId: 'demo_conv_001',
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
                      })}
                      className="p-4 text-left bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors"
                    >
                      <div className="font-semibold text-rose-800 mb-2">💬 Smart Chat</div>
                      <div className="text-sm text-rose-600">Multi-turn conversations</div>
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Voice Practice Tab */}
          <TabsContent value="voice-practice" className="space-y-6">
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-green-800">
                  <Mic className="h-5 w-5" />
                  <span>Voice Recognition & Speech Analysis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-green-700 mb-4">
                  Practice pronunciation with AI-powered speech analysis. Get real-time feedback on accuracy, 
                  fluency, and pronunciation to improve your business English speaking skills.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-1">Real-time Analysis</h4>
                    <p className="text-green-600">Instant pronunciation feedback</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-1">CEFR Aligned</h4>
                    <p className="text-green-600">Level-appropriate exercises</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-1">Business Focus</h4>
                    <p className="text-green-600">Professional scenarios</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-green-200">
                    <h4 className="font-semibold text-green-800 mb-1">Progress Tracking</h4>
                    <p className="text-green-600">Monitor improvement</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Voice Practice Interface */}
            <VoicePracticeInterface
              userId={userId}
              cefrLevel="B2"
              businessContext="Business English for Corporate Training"
              onProgressUpdate={(progress) => {
                log.userAction('Voice progress updated', userId, { progress });
                // Could integrate with main progress system here
              }}
            />
          </TabsContent>

          {/* Progress Tab */}
          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Learning Progress & Analytics</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProgressDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Assessments Tab */}
          <TabsContent value="assessments" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Adaptive Assessments</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AssessmentGenerator 
                  onAssessmentGenerated={(assessment) => console.log('Assessment generated:', assessment)}
                  onAssessmentStarted={(assessment) => console.log('Assessment started:', assessment)}
                />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Integration Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-purple-700">
                    <Zap className="h-5 w-5" />
                    <span>Smart Actions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-purple-600 mb-4">
                    Intelligent AI workflows that adapt to your learning progress and provide personalized recommendations.
                  </p>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Context-aware action discovery</li>
                    <li>• Multi-step workflow orchestration</li>
                    <li>• Real-time learning recommendations</li>
                    <li>• Automated progress analysis</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-50 to-blue-100">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-blue-700">
                    <MessageCircle className="h-5 w-5" />
                    <span>AI Chat</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-600 mb-4">
                    Advanced AI conversation partner for language practice with CEFR-aligned responses.
                  </p>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Real-time conversation practice</li>
                    <li>• Level-appropriate responses</li>
                    <li>• Grammar and vocabulary feedback</li>
                    <li>• Progress tracking integration</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-green-700">
                    <TrendingUp className="h-5 w-5" />
                    <span>Progress Analytics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-green-600 mb-4">
                    Comprehensive progress tracking with visual analytics and achievement systems.
                  </p>
                  <ul className="text-sm text-green-700 space-y-1">
                    <li>• Visual progress indicators</li>
                    <li>• Achievement badges & milestones</li>
                    <li>• Data export capabilities</li>
                    <li>• Learning streak tracking</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-orange-700">
                    <FileText className="h-5 w-5" />
                    <span>Adaptive Assessments</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-orange-600 mb-4">
                    AI-powered assessment generation with adaptive difficulty and detailed feedback.
                  </p>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• CEFR-aligned quiz generation</li>
                    <li>• Automated scoring algorithms</li>
                    <li>• Adaptive difficulty adjustment</li>
                    <li>• Detailed performance feedback</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-purple-700">
                    <Monitor className="h-5 w-5" />
                    <span>Multi-Modal Learning</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-purple-600 mb-4">
                    Rich multimedia learning experiences with interactive elements and full accessibility support.
                  </p>
                  <ul className="text-sm text-purple-700 space-y-1">
                    <li>• Video and audio content with captions</li>
                    <li>• Interactive drag-drop exercises</li>
                    <li>• AR/VR learning simulations</li>
                    <li>• Comprehensive accessibility features</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-indigo-700">
                    <Brain className="h-5 w-5" />
                    <span>Epic 5: Advanced AI Features - In Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-indigo-600 mb-4">
                    Epic 5 is expanding with advanced AI-powered learning features and multi-modal content capabilities.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-indigo-700 mb-2">✅ Completed Stories:</h4>
                      <ul className="text-indigo-600 space-y-1">
                        <li>• Story 5.1: Advanced AI Actions</li>
                        <li>• Story 5.2: AI Content Generation</li>
                        <li>• Story 5.3: Multi-Modal Resources</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-indigo-700 mb-2">🚀 Latest Features:</h4>
                      <ul className="text-indigo-600 space-y-1">
                        <li>• Advanced AI chat actions</li>
                        <li>• Visual analysis & coaching</li>
                        <li>• Multi-turn conversations</li>
                        <li>• Scenario-based learning</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Feature Integration Status */}
            <Card>
              <CardHeader>
                <CardTitle>Integration Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Epic 4 Components Integration</span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">✅ Complete</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Story 5.1: Advanced CopilotKit Actions</span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">✅ Complete</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Story 5.2: AI Content Generation</span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">✅ Complete</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Story 5.3: Multi-Modal Learning Resources</span>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">✅ Complete</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium">Task 5: Advanced AI Chat Actions</span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">✅ Implemented</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium">Interactive Media Processing</span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">✅ Implemented</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium">Accessibility Framework</span>
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">✅ Implemented</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}