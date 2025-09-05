'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Wand2, 
  BookOpen, 
  FileText, 
  MessageSquare,
  Brain,
  Sparkles,
  Clock,
  Target,
  ChevronRight,
  Download,
  Eye,
  Settings,
  Lightbulb,
  TrendingUp,
  Monitor,
  Volume2,
  Gamepad2
} from 'lucide-react';
import { 
  ContentGenerationContext, 
  ContentType, 
  GeneratedContent,
  ContentRecommendation,
  DifficultyLevel,
  ContentGenerationRequest
} from '../../lib/content/types';
import { contentGenerator } from '../../lib/content/generators/core';
import { lessonGenerator } from '../../lib/content/generators/lessonGenerator';
import { quizGenerator } from '../../lib/content/generators/quizGenerator';
import { contentCurator } from '../../lib/content/curators/contentCurator';
// Removed BMAD system - using direct content generation

interface ContentGenerationPanelProps {
  userId: string;
  sessionId?: string;
  onContentGenerated?: (content: GeneratedContent) => void;
  onContentSelected?: (content: GeneratedContent) => void;
}

export default function ContentGenerationPanel({ 
  userId, 
  sessionId,
  onContentGenerated, 
  onContentSelected 
}: ContentGenerationPanelProps) {
  const [activeTab, setActiveTab] = useState('generate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent[]>([]);
  const [recommendations, setRecommendations] = useState<ContentRecommendation[]>([]);
  const [selectedContentType, setSelectedContentType] = useState<ContentType>('lesson');
  const [generationSpecs, setGenerationSpecs] = useState({
    topic: '',
    duration: 30,
    difficulty: 'adaptive',
    includeSOPs: false,
    customInstructions: ''
  });

  // Mock user context - in real app, get from auth/profile
  const [userContext] = useState<ContentGenerationContext>({
    userId,
    cefrLevel: 'B2',
    businessDomain: 'Corporate Training',
    learningGoals: ['Professional communication', 'Business writing', 'Presentation skills'],
    weakAreas: ['grammar', 'pronunciation'],
    strongAreas: ['vocabulary', 'reading'],
    preferredTopics: ['meetings', 'email', 'presentations'],
    sessionHistory: {
      completedTopics: ['basic-communication', 'email-etiquette'],
      strugglingAreas: ['complex-grammar', 'formal-writing'],
      preferredContentTypes: ['lesson', 'dialogue', 'quiz']
    },
    progressMetrics: {
      averageScore: 0.75,
      completionRate: 0.8,
      engagementLevel: 'high',
      learningSpeed: 'normal'
    }
  });

  // Load personalized recommendations on mount
  useEffect(() => {
    loadPersonalizedRecommendations();
  }, [userId]);

  const loadPersonalizedRecommendations = async () => {
    try {
      const recs = await contentCurator.curatePersonalizedContent(
        userContext,
        ['Improve weak areas', 'Practice professional communication'],
        45 // 45 minutes available
      );
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const handleGenerateContent = async () => {
    if (!generationSpecs.topic.trim()) {
      alert('Please specify a topic for content generation');
      return;
    }

    setIsGenerating(true);
    
    try {
      let contentResult: any;
      
      // Direct API call (BMAD system removed for MVP simplification)
      const response = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: `Generate a ${selectedContentType} about "${generationSpecs.topic}" for CEFR ${userContext.cefrLevel} level in ${userContext.businessDomain} context. Duration: ${generationSpecs.duration} minutes. ${generationSpecs.customInstructions ? `Additional requirements: ${generationSpecs.customInstructions}` : ''}`,
            contentType: selectedContentType,
            model: 'gpt-4-turbo-preview',
            temperature: 0.7,
            maxTokens: 4000
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        if (data.error) {
          throw new Error(data.error);
        }
        
        contentResult = data;

      // Create a GeneratedContent object from the response
      const content: GeneratedContent = {
        id: `gen-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: selectedContentType,
        title: contentResult.title || `${selectedContentType.charAt(0).toUpperCase() + selectedContentType.slice(1)}: ${generationSpecs.topic}`,
        description: contentResult.description || `AI-generated ${selectedContentType} content about ${generationSpecs.topic}`,
        content: contentResult.content ? 
          (Array.isArray(contentResult.content) ? contentResult.content : [{ id: 'main', type: 'text', content: contentResult.content }]) :
          [{ id: 'main', type: 'text', content: contentResult }],
        metadata: {
          cefrLevel: userContext.cefrLevel,
          businessDomain: userContext.businessDomain,
          topics: [generationSpecs.topic],
          estimatedDuration: generationSpecs.duration,
          qualityScore: contentResult.metadata?.qualityScore || 0.9,
          businessRelevance: contentResult.metadata?.businessRelevance || 0.9,
          tokensUsed: contentResult.metadata?.estimatedTokens || contentResult.metadata?.tokensUsed || 0,
          model: contentResult.metadata?.model || 'bmad-content-agent',
          difficulty: (generationSpecs.difficulty || 'intermediate') as DifficultyLevel,
          skills: ['communication', 'language'],
          sopIntegration: generationSpecs.includeSOPs,
          generationSource: 'ai-original' as const,
          engagementPrediction: contentResult.metadata?.engagementPrediction || 0.8
        },
        aiGenerated: true,
        generationTimestamp: new Date(),
        version: '1.0'
      };

      setGeneratedContent(prev => [content, ...prev]);
      
      if (onContentGenerated) {
        onContentGenerated(content);
      }

      // Clear form
      setGenerationSpecs(prev => ({ ...prev, topic: '', customInstructions: '' }));
      
      // Switch to content library tab to show result
      setActiveTab('library');

    } catch (error) {
      console.error('Content generation failed:', error);
      
      // Try fallback generation with existing generators
      try {
        console.log('Attempting fallback content generation...');
        let fallbackContent;
        
        if (selectedContentType === 'lesson') {
          fallbackContent = await lessonGenerator.generateBusinessLesson(userContext, {
            topic: generationSpecs.topic || 'Business Communication',
            duration: generationSpecs.duration || 30,
            includeSOPs: generationSpecs.includeSOPs,
            focusSkills: ['reading', 'writing', 'speaking', 'listening']
          });
        } else if (selectedContentType === 'quiz') {
          fallbackContent = await quizGenerator.generateAdaptiveQuiz(userContext, {
            topic: generationSpecs.topic || 'Business Vocabulary',
            questionCount: 10,
            difficulty: generationSpecs.difficulty as DifficultyLevel,
            includeExplanations: true
          });
        } else {
          const request: ContentGenerationRequest = {
            context: userContext,
            type: selectedContentType,
            specifications: {
              topics: generationSpecs.topic ? [generationSpecs.topic] : ['Business Communication'],
              difficulty: generationSpecs.difficulty as DifficultyLevel,
              duration: generationSpecs.duration,
              includeSOPs: generationSpecs.includeSOPs,
              customInstructions: generationSpecs.customInstructions,
              contentFormat: 'practical'
            }
          };
          const result = await contentGenerator.generateContent(request);
          fallbackContent = result.content;
        }
        
        if (fallbackContent) {
          setGeneratedContent(prev => [fallbackContent, ...prev]);
          if (onContentGenerated) {
            onContentGenerated(fallbackContent);
          }
          setActiveTab('library');
        } else {
          throw new Error('Fallback generation also failed');
        }
      } catch (fallbackError) {
        console.error('Fallback generation failed:', fallbackError);
        alert(`Content generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const getContentTypeIcon = (type: ContentType) => {
    const icons = {
      lesson: <BookOpen className="h-4 w-4" />,
      quiz: <FileText className="h-4 w-4" />,
      exercise: <Target className="h-4 w-4" />,
      vocabulary: <Brain className="h-4 w-4" />,
      dialogue: <MessageSquare className="h-4 w-4" />,
      reading: <BookOpen className="h-4 w-4" />,
      listening: <MessageSquare className="h-4 w-4" />,
      writing: <FileText className="h-4 w-4" />,
      speaking: <MessageSquare className="h-4 w-4" />,
      grammar: <Settings className="h-4 w-4" />,
      'business-case': <TrendingUp className="h-4 w-4" />,
      roleplay: <MessageSquare className="h-4 w-4" />,
      video: <Monitor className="h-4 w-4" />,
      audio: <Volume2 className="h-4 w-4" />,
      interactive: <Gamepad2 className="h-4 w-4" />,
      simulation: <Settings className="h-4 w-4" />,
      'ar-vr': <Monitor className="h-4 w-4" />,
      multimedia: <Monitor className="h-4 w-4" />
    };
    return icons[type as keyof typeof icons] || <BookOpen className="h-4 w-4" />;
  };

  const formatDuration = (minutes: number) => {
    return minutes < 60 ? `${minutes}m` : `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
  };

  const handleContentSelect = (content: GeneratedContent) => {
    if (onContentSelected) {
      onContentSelected(content);
    }
  };

  const handleRecommendationSelect = (recommendation: ContentRecommendation) => {
    handleContentSelect(recommendation.content);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wand2 className="h-5 w-5 text-purple-600" />
            <span>AI Content Generation & Curation</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Generate personalized learning content tailored to your progress, preferences, and business context. 
            AI creates lessons, quizzes, and exercises specifically designed for your {userContext.cefrLevel} level 
            in {userContext.businessDomain}.
          </p>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate" className="flex items-center space-x-2">
            <Wand2 className="h-4 w-4" />
            <span>Generate</span>
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center space-x-2">
            <Lightbulb className="h-4 w-4" />
            <span>Recommended</span>
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4" />
            <span>My Content</span>
          </TabsTrigger>
          <TabsTrigger value="curator" className="flex items-center space-x-2">
            <Brain className="h-4 w-4" />
            <span>Smart Curation</span>
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Content Type Selection */}
              <div>
                <label className="block text-sm font-medium mb-3">Content Type</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(['lesson', 'quiz', 'vocabulary', 'dialogue'] as ContentType[]).map((type) => (
                    <Button
                      key={type}
                      variant={selectedContentType === type ? 'default' : 'outline'}
                      onClick={() => setSelectedContentType(type)}
                      className="flex items-center space-x-2 justify-start"
                    >
                      {getContentTypeIcon(type)}
                      <span className="capitalize">{type}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Generation Specifications */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Topic</label>
                  <input
                    type="text"
                    value={generationSpecs.topic}
                    onChange={(e) => setGenerationSpecs(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="e.g., Business meetings, Email communication"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Duration (minutes)</label>
                  <input
                    type="number"
                    value={generationSpecs.duration}
                    onChange={(e) => setGenerationSpecs(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))}
                    min="5"
                    max="120"
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="includeSOPs"
                    checked={generationSpecs.includeSOPs}
                    onChange={(e) => setGenerationSpecs(prev => ({ ...prev, includeSOPs: e.target.checked }))}
                    className="rounded"
                  />
                  <label htmlFor="includeSOPs" className="text-sm font-medium">
                    Include Company SOPs & Procedures
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Custom Instructions (Optional)</label>
                  <textarea
                    value={generationSpecs.customInstructions}
                    onChange={(e) => setGenerationSpecs(prev => ({ ...prev, customInstructions: e.target.value }))}
                    placeholder="Any specific requirements or focus areas..."
                    rows={3}
                    className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateContent}
                disabled={isGenerating || !generationSpecs.topic.trim()}
                className="w-full flex items-center space-x-2"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-spin" />
                    <span>Generating Content...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    <span>Generate {selectedContentType.charAt(0).toUpperCase() + selectedContentType.slice(1)}</span>
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                <span>Personalized Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-6">
                AI-curated content based on your learning progress, weak areas ({userContext.weakAreas.join(', ')}), 
                and {userContext.businessDomain} context.
              </p>
              
              <div className="space-y-4">
                {recommendations.length > 0 ? (
                  recommendations.map((rec, index) => (
                    <div key={rec.content.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getContentTypeIcon(rec.content.type)}
                            <h3 className="font-semibold">{rec.content.title}</h3>
                            <Badge variant="outline">{rec.content.type}</Badge>
                            <Badge variant="secondary">{rec.content.metadata.cefrLevel}</Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">{rec.content.description}</p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDuration(rec.content.metadata.estimatedDuration)}</span>
                            </span>
                            <span>Relevance: {Math.round(rec.relevanceScore * 100)}%</span>
                            <span>Quality: {Math.round(rec.content.metadata.qualityScore * 100)}%</span>
                          </div>
                          
                          <div className="text-sm bg-blue-50 p-3 rounded-lg mb-3">
                            <strong>Why recommended:</strong> {rec.reasoning}
                          </div>
                          
                          {rec.adaptationSuggestions && rec.adaptationSuggestions.length > 0 && (
                            <div className="text-xs text-gray-600">
                              <strong>Suggestions:</strong> {rec.adaptationSuggestions.join(', ')}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRecommendationSelect(rec)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleRecommendationSelect(rec)}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Lightbulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Loading personalized recommendations...</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Library Tab */}
        <TabsContent value="library" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <span>Generated Content Library</span>
                </div>
                <Badge variant="secondary">{generatedContent.length} items</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {generatedContent.length > 0 ? (
                  generatedContent.map((content) => (
                    <div key={content.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            {getContentTypeIcon(content.type)}
                            <h3 className="font-semibold">{content.title}</h3>
                            <Badge variant="outline">{content.type}</Badge>
                            <Badge variant="secondary">{content.metadata.cefrLevel}</Badge>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-3">{content.description}</p>
                          
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                            <span className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{formatDuration(content.metadata.estimatedDuration)}</span>
                            </span>
                            <span>Quality: {Math.round(content.metadata.qualityScore * 100)}%</span>
                            <span>Business Relevance: {Math.round(content.metadata.businessRelevance * 100)}%</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {content.metadata.topics.map(topic => (
                              <Badge key={topic} variant="outline" className="text-xs">{topic}</Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex space-x-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => console.log('Download:', content.id)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleContentSelect(content)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No generated content yet</p>
                    <p className="text-sm text-gray-400">Use the Generate tab to create your first content</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Smart Curation Tab */}
        <TabsContent value="curator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Brain className="h-5 w-5 text-purple-600" />
                <span>Smart Content Curation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Learning Analytics */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">Your Learning Profile</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">CEFR Level</div>
                      <div className="font-semibold">{userContext.cefrLevel}</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Average Score</div>
                      <div className="font-semibold">{Math.round(userContext.progressMetrics.averageScore * 100)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Completion Rate</div>
                      <div className="font-semibold">{Math.round(userContext.progressMetrics.completionRate * 100)}%</div>
                    </div>
                    <div>
                      <div className="text-gray-600">Engagement</div>
                      <div className="font-semibold capitalize">{userContext.progressMetrics.engagementLevel}</div>
                    </div>
                  </div>
                </div>

                {/* Focus Areas */}
                <div>
                  <h3 className="font-semibold mb-3">Current Focus Areas</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-red-600">Needs Improvement</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {userContext.weakAreas.map(area => (
                          <Badge key={area} variant="destructive" className="text-xs">{area}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-600">Strong Areas</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {userContext.strongAreas.map(area => (
                          <Badge key={area} variant="secondary" className="text-xs bg-green-100 text-green-800">{area}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div>
                  <h3 className="font-semibold mb-3">Smart Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Button variant="outline" className="justify-start">
                      <Target className="h-4 w-4 mr-2" />
                      Generate targeted practice for weak areas
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Create progress assessment
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Brain className="h-4 w-4 mr-2" />
                      Adaptive difficulty adjustment
                    </Button>
                    <Button variant="outline" className="justify-start">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Discover new topics
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}