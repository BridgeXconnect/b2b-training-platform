'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Wand2, 
  Target, 
  Clock, 
  Brain, 
  Settings, 
  CheckCircle, 
  ArrowRight,
  Sparkles,
  Calendar,
  User
} from 'lucide-react';

import { 
  PathOptimizationRequest,
  LearningPath
} from '@/lib/learning/types';
import { CEFRLevel, LearningStyle, LearningPace, ChallengeLevel } from '@/lib/types/user';
import { DifficultyLevel, ContentType, ContentGenerationContext } from '@/lib/content/types';
import { LearningGoal } from '@/lib/utils/progress';
import { pathIntelligenceEngine } from '@/lib/learning/pathIntelligence';

interface PathOptimizationWizardProps {
  userId: string;
  currentGoals?: LearningGoal[];
  onPathGenerated?: (path: LearningPath) => void;
  onCancel?: () => void;
}

export function PathOptimizationWizard({ 
  userId, 
  currentGoals = [], 
  onPathGenerated, 
  onCancel 
}: PathOptimizationWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const createDefaultContext = (): ContentGenerationContext => ({
    userId,
    cefrLevel: 'B1',
    businessDomain: '',
    learningGoals: [],
    weakAreas: [],
    strongAreas: [],
    preferredTopics: [],
    sessionHistory: {
      completedTopics: [],
      strugglingAreas: [],
      preferredContentTypes: []
    },
    progressMetrics: {
      averageScore: 0,
      completionRate: 0,
      engagementLevel: 'medium',
      learningSpeed: 'normal'
    }
  });

  const [optimizationRequest, setOptimizationRequest] = useState<PathOptimizationRequest>({
    userId,
    learningGoals: currentGoals,
    constraints: {
      difficulty: 'intermediate',
      availableTime: 60, // minutes per day
    },
    preferences: {
      learningStyle: 'mixed',
      contentTypes: ['lesson', 'interactive', 'business-case'],
      challengeLevel: 'challenging',
      pacePreference: 'moderate'
    },
    context: createDefaultContext()
  });

  const steps = [
    { id: 'goals', title: 'Learning Goals', icon: Target },
    { id: 'constraints', title: 'Time & Difficulty', icon: Clock },
    { id: 'preferences', title: 'Learning Style', icon: Brain },
    { id: 'context', title: 'Business Context', icon: User },
    { id: 'review', title: 'Review & Generate', icon: CheckCircle }
  ];

  const contentTypes: { value: ContentType; label: string; description: string }[] = [
    { value: 'lesson', label: 'Lessons', description: 'Structured learning content' },
    { value: 'interactive', label: 'Interactive', description: 'Hands-on exercises' },
    { value: 'business-case', label: 'Business Cases', description: 'Real-world scenarios' },
    { value: 'dialogue', label: 'Dialogues', description: 'Conversation practice' },
    { value: 'quiz', label: 'Quizzes', description: 'Knowledge testing' },
    { value: 'vocabulary', label: 'Vocabulary', description: 'Word building' },
    { value: 'grammar', label: 'Grammar', description: 'Language structure' },
    { value: 'roleplay', label: 'Role Play', description: 'Situational practice' }
  ];

  const updateRequest = (updates: Partial<PathOptimizationRequest>) => {
    setOptimizationRequest(prev => {
      const updated: PathOptimizationRequest = { ...prev };
      
      // Ensure we have defaults
      const defaultContext = createDefaultContext();
      const defaultConstraints = { difficulty: 'intermediate' as DifficultyLevel, availableTime: 60 };
      const defaultPreferences = {
        learningStyle: 'mixed' as LearningStyle,
        contentTypes: ['lesson'] as ContentType[],
        challengeLevel: 'challenging' as ChallengeLevel,
        pacePreference: 'moderate' as LearningPace
      };
      
      if (updates.constraints) {
        updated.constraints = { ...defaultConstraints, ...prev.constraints, ...updates.constraints };
      }
      if (updates.preferences) {
        updated.preferences = { ...defaultPreferences, ...prev.preferences, ...updates.preferences };
      }
      if (updates.context) {
        updated.context = { ...defaultContext, ...prev.context, ...updates.context };
      }
      return { ...updated, ...updates } as PathOptimizationRequest;
    });
  };

  const generatePath = async () => {
    setIsGenerating(true);
    try {
      // Validate and prepare the request
      const request: PathOptimizationRequest = {
        userId,
        learningGoals: optimizationRequest.learningGoals || [],
        constraints: {
          ...optimizationRequest.constraints,
          availableTime: optimizationRequest.constraints?.availableTime || 60,
          difficulty: optimizationRequest.constraints?.difficulty || 'intermediate'
        },
        preferences: {
          learningStyle: optimizationRequest.preferences?.learningStyle || 'mixed',
          contentTypes: optimizationRequest.preferences?.contentTypes || ['lesson'],
          challengeLevel: optimizationRequest.preferences?.challengeLevel || 'challenging',
          pacePreference: optimizationRequest.preferences?.pacePreference || 'moderate'
        },
        context: {
          userId,
          cefrLevel: optimizationRequest.context?.cefrLevel || 'B1',
          businessDomain: optimizationRequest.context?.businessDomain || '',
          learningGoals: optimizationRequest.learningGoals?.map(g => g.name) || [],
          weakAreas: optimizationRequest.context?.weakAreas || [],
          strongAreas: optimizationRequest.context?.strongAreas || [],
          preferredTopics: optimizationRequest.context?.preferredTopics || [],
          sessionHistory: optimizationRequest.context?.sessionHistory || {
            completedTopics: [],
            strugglingAreas: [],
            preferredContentTypes: []
          },
          progressMetrics: optimizationRequest.context?.progressMetrics || {
            averageScore: 0,
            completionRate: 0,
            engagementLevel: 'medium',
            learningSpeed: 'normal'
          }
        }
      };

      const result = await pathIntelligenceEngine.generateOptimalPath(request);
      
      if (onPathGenerated) {
        onPathGenerated(result.optimizedPath);
      }
    } catch (error) {
      console.error('Failed to generate path:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'goals':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">What are your learning goals?</h3>
              <p className="text-muted-foreground mb-6">
                Define specific, measurable objectives for your learning journey.
              </p>
            </div>
            
            <div className="space-y-4">
              {(optimizationRequest.learningGoals || []).map((goal, index) => (
                <Card key={goal.id || index}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{goal.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Target: {goal.target} {goal.unit} ({goal.category})
                        </p>
                      </div>
                      <Badge variant="outline">{goal.category}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {currentGoals.length === 0 && (
                <Card className="border-dashed">
                  <CardContent className="p-6 text-center">
                    <p className="text-muted-foreground">
                      No specific goals set. The AI will create a comprehensive learning path
                      based on your preferences and business context.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <Label>Additional Focus Areas (Optional)</Label>
              <Textarea 
                placeholder="Describe any specific skills or topics you want to focus on..."
                value={optimizationRequest.context?.preferredTopics?.join(', ') || ''}
                onChange={(e) => updateRequest({
                  context: {
                    ...createDefaultContext(),
                    ...optimizationRequest.context,
                    userId,
                    preferredTopics: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                  }
                })}
              />
            </div>
          </div>
        );

      case 'constraints':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Time & Difficulty Preferences</h3>
              <p className="text-muted-foreground mb-6">
                Set your availability and preferred difficulty level.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <Label>Available Time Per Day (minutes)</Label>
                  <div className="mt-2">
                    <Slider
                      value={[optimizationRequest.constraints?.availableTime || 60]}
                      onValueChange={([value]) => updateRequest({
                        constraints: { 
                          ...optimizationRequest.constraints,
                          availableTime: value 
                        }
                      })}
                      max={180}
                      min={15}
                      step={15}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-muted-foreground mt-1">
                      <span>15 min</span>
                      <span className="font-medium">
                        {optimizationRequest.constraints?.availableTime || 60} minutes
                      </span>
                      <span>3 hours</span>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Difficulty Level</Label>
                  <Select 
                    value={optimizationRequest.constraints?.difficulty || 'intermediate'}
                    onValueChange={(value: DifficultyLevel) => updateRequest({
                      constraints: { 
                        ...optimizationRequest.constraints,
                        difficulty: value 
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="elementary">Elementary</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="upper-intermediate">Upper Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                      <SelectItem value="proficient">Proficient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label>CEFR Level</Label>
                  <Select 
                    value={optimizationRequest.context?.cefrLevel || 'B1'}
                    onValueChange={(value: CEFRLevel) => updateRequest({
                      context: { 
                        ...createDefaultContext(),
                        ...optimizationRequest.context,
                        userId,
                        cefrLevel: value 
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A1">A1 - Beginner</SelectItem>
                      <SelectItem value="A2">A2 - Elementary</SelectItem>
                      <SelectItem value="B1">B1 - Intermediate</SelectItem>
                      <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
                      <SelectItem value="C1">C1 - Advanced</SelectItem>
                      <SelectItem value="C2">C2 - Proficient</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="deadline">Target Completion (Optional)</Label>
                  <Input 
                    id="deadline"
                    type="date"
                    onChange={(e) => updateRequest({
                      constraints: { 
                        ...optimizationRequest.constraints,
                        deadline: e.target.value ? new Date(e.target.value) : undefined 
                      }
                    })}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Learning Style Preferences</h3>
              <p className="text-muted-foreground mb-6">
                Customize the learning experience to match your style and preferences.
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <Label>Learning Style</Label>
                <Select 
                  value={optimizationRequest.preferences?.learningStyle || 'mixed'}
                  onValueChange={(value: LearningStyle) => updateRequest({
                    preferences: { 
                      ...optimizationRequest.preferences,
                      learningStyle: value 
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visual">Visual - Learn through images and diagrams</SelectItem>
                    <SelectItem value="auditory">Auditory - Learn through listening</SelectItem>
                    <SelectItem value="kinesthetic">Kinesthetic - Learn through practice</SelectItem>
                    <SelectItem value="mixed">Mixed - Combination of styles</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Challenge Level</Label>
                <Select 
                  value={optimizationRequest.preferences?.challengeLevel || 'challenging'}
                  onValueChange={(value: ChallengeLevel) => updateRequest({
                    preferences: { 
                      ...optimizationRequest.preferences,
                      challengeLevel: value 
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="comfortable">Comfortable - Steady progression</SelectItem>
                    <SelectItem value="challenging">Challenging - Push boundaries</SelectItem>
                    <SelectItem value="very-challenging">Very Challenging - Maximum growth</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Learning Pace</Label>
                <Select 
                  value={optimizationRequest.preferences?.pacePreference || 'normal'}
                  onValueChange={(value: LearningPace) => updateRequest({
                    preferences: { 
                      ...optimizationRequest.preferences,
                      pacePreference: value 
                    }
                  })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="slow">Slow - Take time to master concepts</SelectItem>
                    <SelectItem value="moderate">Moderate - Balanced progression</SelectItem>
                    <SelectItem value="fast">Fast - Rapid advancement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Preferred Content Types</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                  {contentTypes.map((type) => {
                    const isSelected = optimizationRequest.preferences?.contentTypes?.includes(type.value) || false;
                    return (
                      <Card 
                        key={type.value}
                        className={`cursor-pointer transition-all ${
                          isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => {
                          const current = optimizationRequest.preferences?.contentTypes || [];
                          const updated = isSelected 
                            ? current.filter(t => t !== type.value)
                            : [...current, type.value];
                          updateRequest({
                            preferences: { 
                              ...optimizationRequest.preferences,
                              contentTypes: updated 
                            }
                          });
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{type.label}</span>
                            {isSelected && <CheckCircle className="h-4 w-4 text-blue-500" />}
                          </div>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );

      case 'context':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Business Context</h3>
              <p className="text-muted-foreground mb-6">
                Provide context about your business environment for more relevant content.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="business-domain">Business Domain/Industry</Label>
                <Input 
                  id="business-domain"
                  placeholder="e.g., Technology, Finance, Healthcare, Manufacturing..."
                  value={optimizationRequest.context?.businessDomain || ''}
                  onChange={(e) => updateRequest({
                    context: { 
                      ...createDefaultContext(),
                      ...optimizationRequest.context,
                      userId,
                      businessDomain: e.target.value 
                    }
                  })}
                />
              </div>

              <div>
                <Label>Weak Areas (Optional)</Label>
                <Textarea 
                  placeholder="Areas where you struggle or need more practice..."
                  value={optimizationRequest.context?.weakAreas?.join(', ') || ''}
                  onChange={(e) => updateRequest({
                    context: {
                      ...createDefaultContext(),
                      ...optimizationRequest.context,
                      userId,
                      weakAreas: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    }
                  })}
                />
              </div>

              <div>
                <Label>Strong Areas (Optional)</Label>
                <Textarea 
                  placeholder="Areas where you excel and want to build upon..."
                  value={optimizationRequest.context?.strongAreas?.join(', ') || ''}
                  onChange={(e) => updateRequest({
                    context: {
                      ...createDefaultContext(),
                      ...optimizationRequest.context,
                      userId,
                      strongAreas: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    }
                  })}
                />
              </div>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Review Your Preferences</h3>
              <p className="text-muted-foreground mb-6">
                Review your settings before generating your personalized learning path.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Time & Difficulty</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Daily Time:</span>
                    <span>{optimizationRequest.constraints?.availableTime} minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Difficulty:</span>
                    <span className="capitalize">{optimizationRequest.constraints?.difficulty}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>CEFR Level:</span>
                    <span>{optimizationRequest.context?.cefrLevel}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Learning Style</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Style:</span>
                    <span className="capitalize">{optimizationRequest.preferences?.learningStyle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Challenge:</span>
                    <span className="capitalize">{optimizationRequest.preferences?.challengeLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pace:</span>
                    <span className="capitalize">{optimizationRequest.preferences?.pacePreference}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Content Preferences</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {optimizationRequest.preferences?.contentTypes?.map((type) => (
                      <Badge key={type} variant="outline">{type}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {optimizationRequest.context?.businessDomain && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base">Business Context</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{optimizationRequest.context.businessDomain}</p>
                  </CardContent>
                </Card>
              )}
            </div>

            <Button 
              onClick={generatePath}
              disabled={isGenerating}
              className="w-full h-12"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  Generating Your Personalized Learning Path...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Generate AI-Optimized Learning Path
                </>
              )}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            AI Learning Path Optimization
          </CardTitle>
          <CardDescription>
            Create a personalized learning path optimized for your goals, schedule, and learning style.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Step Navigation */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                      isActive ? 'bg-blue-500 text-white' :
                      isCompleted ? 'bg-green-500 text-white' :
                      'bg-gray-200 text-gray-500'
                    }`}>
                      <StepIcon className="h-4 w-4" />
                    </div>
                    <span className={`ml-2 text-sm font-medium ${
                      isActive ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {step.title}
                    </span>
                    {index < steps.length - 1 && (
                      <ArrowRight className="h-4 w-4 mx-4 text-gray-300" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          {currentStep < steps.length - 1 && (
            <div className="flex justify-between mt-8">
              <Button 
                variant="outline" 
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              <Button onClick={nextStep}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}

          {onCancel && (
            <div className="flex justify-center mt-6">
              <Button variant="ghost" onClick={onCancel}>
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}