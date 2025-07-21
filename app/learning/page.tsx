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
import { Brain, MessageCircle, TrendingUp, FileText, Zap } from 'lucide-react';

export default function LearningPortal() {
  const [activeTab, setActiveTab] = useState('smart-actions');
  const [userId] = useState('user-demo-id'); // In real app, get from auth

  const handleActionExecuted = (actionId: string, result: any) => {
    log.userAction('Action executed', userId, { actionId, result });
    // Handle action results - could update other components
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
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="smart-actions" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span className="hidden sm:inline">Smart Actions</span>
            </TabsTrigger>
            <TabsTrigger value="content-generation" className="flex items-center space-x-2">
              <Brain className="h-4 w-4" />
              <span className="hidden sm:inline">AI Content</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">AI Chat</span>
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

              <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-indigo-700">
                    <Brain className="h-5 w-5" />
                    <span>Epic 4: Core Learning Features - Complete</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-indigo-600 mb-4">
                    All Epic 4 components are now integrated and working together to provide a comprehensive learning experience.
                  </p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <h4 className="font-semibold text-indigo-700 mb-2">✅ Completed Stories:</h4>
                      <ul className="text-indigo-600 space-y-1">
                        <li>• Story 4.1: AI Chat Interface</li>
                        <li>• Story 4.2: Progress Tracking</li>
                        <li>• Story 4.3: Assessment System</li>
                        <li>• Story 4.4: User Profiles</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-indigo-700 mb-2">🚀 Now Available:</h4>
                      <ul className="text-indigo-600 space-y-1">
                        <li>• Story 5.1: Advanced AI Actions</li>
                        <li>• Intelligent workflow orchestration</li>
                        <li>• Context-aware recommendations</li>
                        <li>• Multi-step learning processes</li>
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
                  <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">Story 5.1: Advanced CopilotKit Actions</span>
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">🔄 Active Development</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                    <span className="font-medium">Smart Workflow Engine</span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">✅ Implemented</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium">Context-Aware AI Actions</span>
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