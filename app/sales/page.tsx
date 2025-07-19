'use client';

import { useState } from 'react';
import { RoleGuard } from '../../lib/contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import ClientRequestForm from '../../components/sales/ClientRequestForm';
import RequestsList from '../../components/sales/RequestsList';
import CourseGenerator from '../../components/sales/CourseGenerator';
import { Plus, FileText, Users, Target, MessageCircle, Sparkles } from 'lucide-react';

export default function SalesPortal() {
  const [activeTab, setActiveTab] = useState<'overview' | 'new-request' | 'requests' | 'ai-assistant' | 'course-generator'>('overview');

  return (
    <RoleGuard allowedRoles={['sales', 'admin']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Sales Portal
            </h1>
            <p className="text-gray-600">
              Manage client requests and B2B English training course generation
            </p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 mb-6 bg-white rounded-lg p-1 border">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('new-request')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'new-request'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              New Client Request
            </button>
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'requests'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Manage Requests
            </button>
            <button
              onClick={() => setActiveTab('ai-assistant')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'ai-assistant'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              AI Assistant
            </button>
            <button
              onClick={() => setActiveTab('course-generator')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'course-generator'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Sparkles className="h-4 w-4" />
              Course Generator
            </button>
          </div>

          {/* Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Quick Stats */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">12</div>
                  <p className="text-xs text-muted-foreground">
                    +2 from last week
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Completed Courses</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">28</div>
                  <p className="text-xs text-muted-foreground">
                    +5 this month
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Participants</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">342</div>
                  <p className="text-xs text-muted-foreground">
                    Across all programs
                  </p>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-4">
                    <Button 
                      onClick={() => setActiveTab('new-request')}
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Create New Client Request
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => setActiveTab('requests')}
                    >
                      View All Requests
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'new-request' && (
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>New Client Request</CardTitle>
                  <p className="text-gray-600">
                    Capture client requirements for B2B English training course generation
                  </p>
                </CardHeader>
                <CardContent>
                  <ClientRequestForm />
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'requests' && (
            <div>
              <RequestsList />
            </div>
          )}

          {activeTab === 'ai-assistant' && (
            <div className="max-w-4xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    AI Training Assistant
                  </CardTitle>
                  <p className="text-gray-600">
                    Get intelligent assistance with SOP analysis, course generation, and CEFR alignment
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                      <h3 className="font-semibold text-blue-900 mb-2">AI Assistant Capabilities:</h3>
                      <ul className="text-blue-800 space-y-1 text-sm">
                        <li>• Analyze SOP documents for training requirements</li>
                        <li>• Generate CEFR-aligned course structures</li>
                        <li>• Validate content against CEFR standards</li>
                        <li>• Provide recommendations for course improvements</li>
                        <li>• Answer questions about B2B English training best practices</li>
                      </ul>
                    </div>
                    
                    <div className="border rounded-lg p-6 bg-blue-50" style={{ height: '500px' }}>
                      <div className="h-full flex flex-col items-center justify-center space-y-4">
                        <MessageCircle className="h-16 w-16 text-blue-600" />
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-blue-900 mb-2">B2B Training Assistant</h3>
                          <p className="text-blue-800 text-sm mb-4">
                            AI-powered assistance for course generation, SOP analysis, and CEFR alignment
                          </p>
                          <div className="bg-white p-4 rounded-lg border border-blue-200 text-left text-sm">
                            <p className="font-medium text-blue-900 mb-2">Ready to help with:</p>
                            <ul className="text-blue-800 space-y-1">
                              <li>• SOP document analysis</li>
                              <li>• CEFR-aligned course structure</li>
                              <li>• Training requirement assessment</li>
                              <li>• Industry-specific vocabulary</li>
                            </ul>
                          </div>
                          <p className="text-xs text-blue-600 mt-4">
                            AI chat integration available when OpenAI API key is configured
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'course-generator' && (
            <div className="max-w-6xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    AI Course Generator
                  </CardTitle>
                  <p className="text-gray-600">
                    Generate CEFR-aligned English training courses with integrated SOP content
                  </p>
                </CardHeader>
                <CardContent>
                  <CourseGenerator 
                    sopAnalysis={null} // In production, this would come from SOP analysis
                    clientRequestData={null} // In production, this would come from selected client request
                    onCourseGenerated={(course) => {
                      console.log('Generated course:', course);
                      // Handle course generation completion
                    }}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </RoleGuard>
  );
}