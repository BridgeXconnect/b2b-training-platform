'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  FileText, 
  Zap, 
  Clock, 
  Target, 
  Brain,
  Settings,
  Play,
  Save,
  Download,
  Shuffle
} from 'lucide-react';
import { 
  Assessment, 
  AssessmentGenerator as Generator, 
  CEFRLevel,
  AdaptiveDifficultyEngine,
  AdaptiveDifficultyConfig
} from '@/lib/utils/assessment';
import { 
  adaptiveDifficultyEngine,
  createDifficultyContext,
  type DifficultyLevel,
  type DifficultyCalculationResult,
  type AdaptiveProgressMetrics
} from '@/lib/services/adaptive-difficulty';
import { UserProfile } from '@/lib/types/user';
// Removed BMAD system - using direct assessment generation
import { assessmentService, AssessmentRecord } from '@/lib/services/assessment-service';

interface AssessmentGeneratorProps {
  onAssessmentGenerated: (assessment: Assessment) => void;
  onAssessmentStarted: (assessment: Assessment) => void;
  sessionId?: string;
  userId?: string;
}

export default function AssessmentGenerator({ 
  onAssessmentGenerated, 
  onAssessmentStarted,
  sessionId,
  userId = 'current_user'
}: AssessmentGeneratorProps) {
  const [activeTab, setActiveTab] = useState('quick');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAssessment, setGeneratedAssessment] = useState<Assessment | null>(null);
  const [adaptiveDifficulty, setAdaptiveDifficulty] = useState<DifficultyLevel | null>(null);
  const [difficultyCalculating, setDifficultyCalculating] = useState(false);
  const [assessmentRecord, setAssessmentRecord] = useState<AssessmentRecord | null>(null);
  const [recentAssessments, setRecentAssessments] = useState<AssessmentRecord[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  
  // Quick generation settings
  const [quickSettings, setQuickSettings] = useState({
    cefrLevel: 'B2' as CEFRLevel,
    businessContext: 'B2B Sales',
    duration: 30,
    questionCount: 15,
    adaptiveDifficulty: true
  });

  // Advanced settings
  const [advancedSettings, setAdvancedSettings] = useState({
    cefrLevel: 'B2' as CEFRLevel,
    businessContext: 'B2B Sales',
    duration: 30,
    questionCount: 15,
    adaptiveDifficulty: true,
    adaptiveConfig: {
      initialDifficulty: 3,
      adjustmentSensitivity: 0.7,
      targetAccuracy: 75,
      maxDifficultyJump: 1,
      minimumQuestions: 3
    } as Partial<AdaptiveDifficultyConfig>,
    skillFocus: [] as string[],
    difficultyRange: [2, 4] as [number, number],
    questionTypes: ['multiple-choice', 'fill-blank'] as string[],
    includeEssays: false,
    passingScore: 70,
    timePerQuestion: 120, // seconds
    businessScenarios: ['Client meetings', 'Email communication', 'Presentations']
  });

  const [customSettings, setCustomSettings] = useState({
    title: '',
    description: '',
    learningObjectives: [] as string[],
    objectiveInput: '',
    customQuestions: [] as any[],
    questionInput: '',
    questionType: 'multiple-choice',
    skillArea: 'communication'
  });

  const cefrLevels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const businessContexts = [
    'B2B Sales', 'Marketing', 'Project Management', 'HR & Recruitment', 
    'Finance & Accounting', 'Customer Service', 'Operations', 'Leadership'
  ];
  const skillAreas = ['grammar', 'vocabulary', 'comprehension', 'communication', 'business-context'];
  const questionTypes = ['multiple-choice', 'fill-blank', 'essay', 'listening', 'speaking', 'ordering'];

  // Load recent assessments on mount
  useEffect(() => {
    const loadRecentAssessments = async () => {
      try {
        const assessments = await assessmentService.getUserAssessments(5);
        setRecentAssessments(assessments);
      } catch (error) {
        console.warn('Failed to load recent assessments:', error);
      }
    };

    if (userId && userId !== 'current_user') {
      loadRecentAssessments();
    }
  }, [userId]);

  const handleQuickGenerate = async () => {
    setIsGenerating(true);
    try {
      // Calculate adaptive difficulty if enabled
      if (quickSettings.adaptiveDifficulty) {
        setDifficultyCalculating(true);
        // Create minimal user profile and performance metrics for difficulty calculation
        const userProfile: UserProfile = {
          id: userId,
          userId: userId,
          personalInfo: {
            firstName: 'User',
            lastName: 'Test',
            email: 'test@example.com',
            timezone: 'UTC'
          },
          learningPreferences: {
            goals: ['Professional Communication'],
            studySchedule: {
              preferredDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
              preferredTime: '17:00',
              sessionDuration: 30,
              frequency: 'weekly' as const,
              timeZone: 'UTC'
            },
            businessContext: quickSettings.businessContext,
            industry: 'Technology',
            jobRole: 'Professional',
            topics: [],
            learningStyle: 'visual' as const,
            pace: 'moderate' as const,
            challengeLevel: 'comfortable' as const,
            focusAreas: [],
            weakAreas: [],
            motivations: []
          },
          cefrTracking: {
            currentLevel: quickSettings.cefrLevel,
            targetLevel: quickSettings.cefrLevel,
            progressionHistory: [],
            lastUpdated: new Date(),
            assessmentHistory: [],
            skillBreakdown: {
              listening: quickSettings.cefrLevel,
              reading: quickSettings.cefrLevel,
              speaking: quickSettings.cefrLevel,
              writing: quickSettings.cefrLevel
            }
          },
          preferences: {
            notifications: {
              email: true,
              inApp: true,
              reminders: true,
              achievements: true,
              progress: true,
              marketing: false,
              weeklyReports: true,
              communityUpdates: false
            },
            communication: {
              aiPersonality: 'formal' as const,
              feedbackFrequency: 'daily' as const,
              language: 'en',
              complexity: 'moderate' as const,
              conversationStyle: 'structured' as const,
              errorCorrection: 'immediate' as const
            },
            accessibility: {
              fontSize: 'medium' as const,
              colorScheme: 'light' as const,
              screenReader: false,
              highContrast: false,
              reducedMotion: false,
              keyboardNavigation: true,
              audioDescriptions: false
            }
          },
          privacy: {
            profileVisibility: 'private' as const,
            shareProgress: false,
            shareAchievements: false,
            shareLearningGoals: false,
            dataRetention: '1year' as const,
            analyticsOptOut: false,
            thirdPartySharing: false
          },
          profileCompletion: {
            score: 50,
            completedSections: ['personalInfo'],
            recommendations: [],
            lastUpdated: new Date(),
            milestones: []
          },
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const recentPerformance: AdaptiveProgressMetrics = {
          totalStudyTime: 5,
          completedLessons: 1,
          currentStreak: 1,
          longestStreak: 1,
          cefrProgress: {
            current: quickSettings.cefrLevel,
            nextLevel: quickSettings.cefrLevel,
            progressToNext: 25
          },
          weeklyGoal: {
            target: 3,
            completed: 1
          },
          monthlyStats: {
            lessonsCompleted: 1,
            hoursStudied: 5,
            goalsMet: 0
          },
          assessments: {
            totalAssessments: 1,
            averageScore: 75,
            bestScore: 75,
            recentScore: 75,
            assessmentStreak: 1,
            skillPerformance: {},
            cefrProgression: {
              startLevel: quickSettings.cefrLevel,
              currentLevel: quickSettings.cefrLevel,
              demonstratedLevel: quickSettings.cefrLevel,
              readinessForNext: 25,
              levelHistory: []
            },
            monthlyAssessmentStats: {
              assessmentsTaken: 1,
              averageScore: 75,
              skillsImproved: 0,
              timeSpent: 1
            }
          },
          accuracy: 0.75,
          consistency: 0.7,
          improvement: 0.1,
          engagement: 0.8,
          completionRate: 0.8
        };
        
        const context = createDifficultyContext(
          userId, 
          sessionId || `session-${Date.now()}`, 
          userProfile, 
          recentPerformance
        );
        const difficultyResult = await adaptiveDifficultyEngine.calculateDifficulty(context);
        setAdaptiveDifficulty(difficultyResult.recommendedLevel);
        setDifficultyCalculating(false);
      }
      
      // Generate assessment using direct assessment generator
      await new Promise(resolve => setTimeout(resolve, 1000));
      const assessment = Generator.generateAssessment(
        quickSettings.cefrLevel,
        quickSettings.businessContext,
        ['Business Communication', 'Professional Language Skills'],
        quickSettings.duration,
        quickSettings.questionCount
      );
      
      // Create backend assessment record
      try {
        const assessmentRecord = await assessmentService.startAssessment({
          assessment_type: 'generated',
          cefr_level: assessment.cefrLevel.toLowerCase(),
          skill_breakdown: {
            assessmentId: assessment.id,
            title: assessment.title,
            businessContext: assessment.businessContext,
            adaptiveDifficulty: assessment.adaptiveDifficulty,
            questionCount: assessment.questions.length,
            totalPoints: assessment.totalPoints
          }
        });
        setAssessmentRecord(assessmentRecord);
        
        // Update recent assessments list
        const updatedAssessments = await assessmentService.getUserAssessments(5);
        setRecentAssessments(updatedAssessments);
      } catch (error) {
        console.warn('Failed to create assessment record:', error);
        // Continue without backend record - assessment can still be used
      }
      
      setGeneratedAssessment(assessment);
      onAssessmentGenerated(assessment);
    } catch (error) {
      console.error('Failed to generate assessment:', error);
      // Try fallback generation
      try {
        const fallbackAssessment = Generator.generateAssessment(
          quickSettings.cefrLevel,
          quickSettings.businessContext,
          ['Business Communication', 'Professional Language Skills'],
          quickSettings.duration,
          quickSettings.questionCount
        );
        setGeneratedAssessment(fallbackAssessment);
        onAssessmentGenerated(fallbackAssessment);
      } catch (fallbackError) {
        console.error('Fallback generation also failed:', fallbackError);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAdvancedGenerate = async () => {
    setIsGenerating(true);
    setDifficultyCalculating(true);
    
    try {
      // First calculate optimal difficulty level using new adaptive system
      const difficultyContext = createDifficultyContext(
        'user-id', // In real app, get from auth context
        `session-${Date.now()}`,
        {
          id: 'user-id',
          cefrLevel: advancedSettings.cefrLevel,
          targetCefrLevel: advancedSettings.cefrLevel,
          learningGoals: advancedSettings.skillFocus.length > 0 ? advancedSettings.skillFocus : ['Business Communication'],
          businessContext: advancedSettings.businessContext,
          preferences: {
            sessionLength: advancedSettings.duration,
            challengeLevel: 'balanced'
          }
        } as any,
        {
          accuracy: advancedSettings.adaptiveConfig.targetAccuracy ? advancedSettings.adaptiveConfig.targetAccuracy / 100 : 0.75,
          consistency: 0.8,
          improvement: 0.1,
          engagement: 0.8,
          completionRate: 0.9
        } as any
      );

      const difficultyResult = await adaptiveDifficultyEngine.calculateDifficulty(difficultyContext);
      setAdaptiveDifficulty(difficultyResult.recommendedLevel);
      setDifficultyCalculating(false);

      // Generate assessment using direct assessment generator
      await new Promise(resolve => setTimeout(resolve, 1500));
      let assessment = Generator.generateAssessment(
        advancedSettings.cefrLevel,
        advancedSettings.businessContext,
        advancedSettings.skillFocus.length > 0 ? advancedSettings.skillFocus : ['Business Communication'],
        advancedSettings.duration,
        advancedSettings.questionCount
      );
      
      // Apply advanced customizations
      assessment.passingScore = advancedSettings.passingScore;
      assessment.adaptiveDifficulty = advancedSettings.adaptiveDifficulty;
      
      // Apply our adaptive difficulty recommendations
      let finalAssessment = assessment;
      if (advancedSettings.adaptiveDifficulty && adaptiveDifficulty) {
        // Enhance assessment with adaptive difficulty metadata
        finalAssessment = {
          ...assessment,
          adaptiveDifficulty: true, // Enable adaptive difficulty
          adaptiveMeta: {
            initialDifficulty: difficultyResult.recommendedLevel.overall,
            confidence: difficultyResult.confidence,
            reasoning: difficultyResult.reasoning,
            expectedAccuracy: difficultyResult.validationMetrics.expectedAccuracy,
            expectedEngagement: difficultyResult.validationMetrics.expectedEngagement,
            riskFactors: difficultyResult.validationMetrics.riskFactors
          }
        };
      }
      
      // Create backend assessment record with advanced metadata
      try {
        const assessmentRecord = await assessmentService.startAssessment({
          assessment_type: 'advanced_generated',
          cefr_level: finalAssessment.cefrLevel.toLowerCase(),
          skill_breakdown: {
            assessmentId: finalAssessment.id,
            title: finalAssessment.title,
            businessContext: finalAssessment.businessContext,
            adaptiveDifficulty: finalAssessment.adaptiveDifficulty,
            questionCount: finalAssessment.questions.length,
            totalPoints: finalAssessment.totalPoints,
            skillFocus: advancedSettings.skillFocus,
            passingScore: finalAssessment.passingScore,
            adaptiveConfig: advancedSettings.adaptiveConfig,
            difficultyAnalysis: adaptiveDifficulty ? {
              overall: adaptiveDifficulty.overall,
              cognitive: adaptiveDifficulty.cognitive,
              linguistic: adaptiveDifficulty.linguistic,
              contextual: adaptiveDifficulty.contextual,
              description: adaptiveDifficulty.description
            } : null
          }
        });
        setAssessmentRecord(assessmentRecord);
        
        // Update recent assessments list
        const updatedAssessments = await assessmentService.getUserAssessments(5);
        setRecentAssessments(updatedAssessments);
      } catch (error) {
        console.warn('Failed to create advanced assessment record:', error);
        // Continue without backend record - assessment can still be used
      }
      
      setGeneratedAssessment(finalAssessment);
      onAssessmentGenerated(finalAssessment);
    } catch (error) {
      console.error('Failed to generate advanced assessment:', error);
      setDifficultyCalculating(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomGenerate = async () => {
    if (!customSettings.title || customSettings.learningObjectives.length === 0) {
      alert('Please provide a title and at least one learning objective');
      return;
    }

    setIsGenerating(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const assessment: Assessment = {
        id: `custom_${Date.now()}`,
        title: customSettings.title,
        description: customSettings.description,
        cefrLevel: 'B2', // Default for custom
        duration: 45,
        totalPoints: customSettings.customQuestions.length * 5,
        questions: customSettings.customQuestions,
        createdAt: new Date().toISOString(),
        businessContext: 'Custom',
        learningObjectives: customSettings.learningObjectives,
        passingScore: 70,
        adaptiveDifficulty: false
      };
      
      setGeneratedAssessment(assessment);
      onAssessmentGenerated(assessment);
    } catch (error) {
      console.error('Failed to create custom assessment:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const addLearningObjective = () => {
    if (customSettings.objectiveInput.trim()) {
      setCustomSettings(prev => ({
        ...prev,
        learningObjectives: [...prev.learningObjectives, prev.objectiveInput.trim()],
        objectiveInput: ''
      }));
    }
  };

  const removeLearningObjective = (index: number) => {
    setCustomSettings(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter((_, i) => i !== index)
    }));
  };

  const handleSaveAssessment = async () => {
    if (!generatedAssessment) return;
    
    setIsSaving(true);
    try {
      // Save assessment template to backend
      await assessmentService.saveAssessmentTemplate({
        name: generatedAssessment.title,
        description: generatedAssessment.description || 'Generated assessment template',
        configuration: {
          cefrLevel: generatedAssessment.cefrLevel,
          businessContext: generatedAssessment.businessContext,
          duration: generatedAssessment.duration,
          questionCount: generatedAssessment.questions.length,
          totalPoints: generatedAssessment.totalPoints,
          learningObjectives: generatedAssessment.learningObjectives,
          adaptiveDifficulty: generatedAssessment.adaptiveDifficulty,
          passingScore: generatedAssessment.passingScore,
          questions: generatedAssessment.questions
        },
        isPublic: false
      });
      
      // Also save to local storage as backup
      localStorage.setItem(`assessment_${generatedAssessment.id}`, JSON.stringify(generatedAssessment));
      alert('Assessment template saved successfully!');
    } catch (error) {
      console.error('Failed to save assessment template:', error);
      // Fallback to local storage only
      localStorage.setItem(`assessment_${generatedAssessment.id}`, JSON.stringify(generatedAssessment));
      alert('Assessment saved locally (backend save failed)');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportAssessment = () => {
    if (generatedAssessment) {
      const dataStr = JSON.stringify(generatedAssessment, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${generatedAssessment.title.replace(/\s+/g, '_')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assessment Generator</h2>
          <p className="text-muted-foreground">
            Create AI-powered assessments tailored to your learning objectives
          </p>
          {assessmentRecord && (
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="bg-green-50 text-green-700">
                ✓ Assessment Saved to Progress
              </Badge>
            </div>
          )}
        </div>
        {generatedAssessment && (
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSaveAssessment}
              disabled={isSaving}
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? 'Saving...' : 'Save Template'}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportAssessment}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => onAssessmentStarted(generatedAssessment)}>
              <Play className="h-4 w-4 mr-2" />
              Start Assessment
            </Button>
          </div>
        )}
      </div>

      {/* Recent Assessments */}
      {recentAssessments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <FileText className="h-4 w-4" />
              Recent Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {recentAssessments.map((assessment) => (
                <div key={assessment.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div>
                    <div className="text-xs font-medium text-gray-900">
                      {assessment.assessment_type.replace('_', ' ').toUpperCase()}
                    </div>
                    <div className="text-xs text-gray-600">
                      {assessment.cefr_level.toUpperCase()} • {new Date(assessment.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  {assessment.percentage && (
                    <Badge variant={assessment.percentage >= 70 ? 'default' : 'secondary'}>
                      {assessment.percentage}%
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quick" className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Quick Generate
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Advanced
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Custom
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Quick Assessment Generation
              </CardTitle>
              <CardDescription>
                Generate a complete assessment in seconds with AI-powered question creation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cefr-level">CEFR Level</Label>
                  <Select 
                    value={quickSettings.cefrLevel} 
                    onValueChange={(value: CEFRLevel) => 
                      setQuickSettings(prev => ({ ...prev, cefrLevel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cefrLevels.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="business-context">Business Context</Label>
                  <Select 
                    value={quickSettings.businessContext} 
                    onValueChange={(value: string) => 
                      setQuickSettings(prev => ({ ...prev, businessContext: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {businessContexts.map(context => (
                        <SelectItem key={context} value={context}>{context}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    value={quickSettings.duration}
                    onChange={(e) => 
                      setQuickSettings(prev => ({ ...prev, duration: parseInt(e.target.value) || 30 }))
                    }
                    min="10"
                    max="120"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="question-count">Number of Questions</Label>
                  <Input
                    id="question-count"
                    type="number"
                    value={quickSettings.questionCount}
                    onChange={(e) => 
                      setQuickSettings(prev => ({ ...prev, questionCount: parseInt(e.target.value) || 15 }))
                    }
                    min="5"
                    max="50"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="adaptive"
                  checked={quickSettings.adaptiveDifficulty}
                  onCheckedChange={(checked: boolean) => 
                    setQuickSettings(prev => ({ ...prev, adaptiveDifficulty: checked }))
                  }
                />
                <Label htmlFor="adaptive">Enable Adaptive Difficulty</Label>
              </div>

              <Button 
                onClick={handleQuickGenerate} 
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Shuffle className="h-4 w-4 mr-2 animate-spin" />
                    Generating Assessment...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Assessment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-green-600" />
                Advanced Assessment Configuration
              </CardTitle>
              <CardDescription>
                Fine-tune every aspect of your assessment for optimal learning outcomes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Basic Settings */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>CEFR Level</Label>
                  <Select 
                    value={advancedSettings.cefrLevel} 
                    onValueChange={(value: CEFRLevel) => 
                      setAdvancedSettings(prev => ({ ...prev, cefrLevel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cefrLevels.map(level => (
                        <SelectItem key={level} value={level}>{level}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Business Context</Label>
                  <Select 
                    value={advancedSettings.businessContext} 
                    onValueChange={(value: string) => 
                      setAdvancedSettings(prev => ({ ...prev, businessContext: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {businessContexts.map(context => (
                        <SelectItem key={context} value={context}>{context}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Passing Score (%)</Label>
                  <Input
                    type="number"
                    value={advancedSettings.passingScore}
                    onChange={(e) => 
                      setAdvancedSettings(prev => ({ ...prev, passingScore: parseInt(e.target.value) || 70 }))
                    }
                    min="50"
                    max="100"
                  />
                </div>
              </div>

              {/* Difficulty Range */}
              <div className="space-y-3">
                <Label>Difficulty Range</Label>
                <div className="px-3">
                  <Slider
                    value={advancedSettings.difficultyRange}
                    onValueChange={(value: number[]) => 
                      setAdvancedSettings(prev => ({ ...prev, difficultyRange: value as [number, number] }))
                    }
                    max={5}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>Easy ({advancedSettings.difficultyRange[0]})</span>
                    <span>Hard ({advancedSettings.difficultyRange[1]})</span>
                  </div>
                </div>
              </div>

              {/* Question Types */}
              <div className="space-y-3">
                <Label>Question Types</Label>
                <div className="flex flex-wrap gap-2">
                  {questionTypes.map(type => (
                    <Badge
                      key={type}
                      variant={advancedSettings.questionTypes.includes(type) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setAdvancedSettings(prev => ({
                          ...prev,
                          questionTypes: prev.questionTypes.includes(type)
                            ? prev.questionTypes.filter(t => t !== type)
                            : [...prev.questionTypes, type]
                        }));
                      }}
                    >
                      {type.replace('-', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Skill Focus */}
              <div className="space-y-3">
                <Label>Skill Focus Areas</Label>
                <div className="flex flex-wrap gap-2">
                  {skillAreas.map(skill => (
                    <Badge
                      key={skill}
                      variant={advancedSettings.skillFocus.includes(skill) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        setAdvancedSettings(prev => ({
                          ...prev,
                          skillFocus: prev.skillFocus.includes(skill)
                            ? prev.skillFocus.filter(s => s !== skill)
                            : [...prev.skillFocus, skill]
                        }));
                      }}
                    >
                      {skill.replace('-', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Adaptive Difficulty Configuration */}
              <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="advanced-adaptive"
                    checked={advancedSettings.adaptiveDifficulty}
                    onCheckedChange={(checked: boolean) => 
                      setAdvancedSettings(prev => ({ ...prev, adaptiveDifficulty: checked }))
                    }
                  />
                  <Label htmlFor="advanced-adaptive" className="font-medium">Enable Adaptive Difficulty</Label>
                </div>

                {advancedSettings.adaptiveDifficulty && (
                  <div className="space-y-4 pl-4">
                    <div className="text-sm text-muted-foreground">
                      Configure how the assessment adapts to user performance in real-time.
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Initial Difficulty (1-5)</Label>
                        <div className="px-3">
                          <Slider
                            value={[advancedSettings.adaptiveConfig.initialDifficulty || 3]}
                            onValueChange={(value: number[]) => 
                              setAdvancedSettings(prev => ({
                                ...prev,
                                adaptiveConfig: { ...prev.adaptiveConfig, initialDifficulty: value[0] }
                              }))
                            }
                            min={1}
                            max={5}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Easy (1)</span>
                            <span>Current: {advancedSettings.adaptiveConfig.initialDifficulty || 3}</span>
                            <span>Expert (5)</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Target Accuracy (%)</Label>
                        <div className="px-3">
                          <Slider
                            value={[advancedSettings.adaptiveConfig.targetAccuracy || 75]}
                            onValueChange={(value: number[]) => 
                              setAdvancedSettings(prev => ({
                                ...prev,
                                adaptiveConfig: { ...prev.adaptiveConfig, targetAccuracy: value[0] }
                              }))
                            }
                            min={50}
                            max={90}
                            step={5}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>50%</span>
                            <span>{advancedSettings.adaptiveConfig.targetAccuracy || 75}%</span>
                            <span>90%</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Adjustment Sensitivity</Label>
                        <div className="px-3">
                          <Slider
                            value={[(advancedSettings.adaptiveConfig.adjustmentSensitivity || 0.7) * 10]}
                            onValueChange={(value: number[]) => 
                              setAdvancedSettings(prev => ({
                                ...prev,
                                adaptiveConfig: { ...prev.adaptiveConfig, adjustmentSensitivity: value[0] / 10 }
                              }))
                            }
                            min={1}
                            max={10}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Conservative</span>
                            <span>{Math.round((advancedSettings.adaptiveConfig.adjustmentSensitivity || 0.7) * 10)}/10</span>
                            <span>Aggressive</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Min Questions Before Adjust</Label>
                        <div className="px-3">
                          <Slider
                            value={[advancedSettings.adaptiveConfig.minimumQuestions || 3]}
                            onValueChange={(value: number[]) => 
                              setAdvancedSettings(prev => ({
                                ...prev,
                                adaptiveConfig: { ...prev.adaptiveConfig, minimumQuestions: value[0] }
                              }))
                            }
                            min={1}
                            max={8}
                            step={1}
                            className="w-full"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>1</span>
                            <span>{advancedSettings.adaptiveConfig.minimumQuestions || 3}</span>
                            <span>8</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-blue-700 bg-blue-100 p-2 rounded">
                      <strong>How it works:</strong> The system monitors performance and adjusts question difficulty to maintain your target accuracy. 
                      Higher sensitivity means faster adjustments, while more minimum questions provides more stable difficulty changes.
                    </div>
                  </div>
                )}
              </div>

              {/* Real-time Adaptive Difficulty Analysis */}
              {advancedSettings.adaptiveDifficulty && (difficultyCalculating || adaptiveDifficulty) && (
                <div className="space-y-3 p-4 border rounded-lg bg-purple-50">
                  <div className="flex items-center gap-2">
                    <Brain className="h-4 w-4 text-purple-600" />
                    <Label className="font-medium text-purple-900">Smart Difficulty Analysis</Label>
                  </div>
                  
                  {difficultyCalculating ? (
                    <div className="flex items-center gap-2 text-sm text-purple-700">
                      <Shuffle className="h-4 w-4 animate-spin" />
                      Calculating optimal difficulty level...
                    </div>
                  ) : adaptiveDifficulty && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="text-center">
                          <div className="text-xs font-medium text-purple-700">Overall</div>
                          <div className="text-lg font-bold text-purple-900">{adaptiveDifficulty.overall}/100</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-medium text-purple-700">Cognitive</div>
                          <div className="text-lg font-bold text-purple-900">{adaptiveDifficulty.cognitive}/100</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-medium text-purple-700">Linguistic</div>
                          <div className="text-lg font-bold text-purple-900">{adaptiveDifficulty.linguistic}/100</div>
                        </div>
                        <div className="text-center">
                          <div className="text-xs font-medium text-purple-700">Contextual</div>
                          <div className="text-lg font-bold text-purple-900">{adaptiveDifficulty.contextual}/100</div>
                        </div>
                      </div>
                      <div className="text-xs text-purple-600 bg-white rounded p-2">
                        <strong>Recommendation:</strong> {adaptiveDifficulty.description}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <Button 
                onClick={handleAdvancedGenerate} 
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Shuffle className="h-4 w-4 mr-2 animate-spin" />
                    Generating Advanced Assessment...
                  </>
                ) : (
                  <>
                    <Settings className="h-4 w-4 mr-2" />
                    Generate Advanced Assessment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Custom Assessment Builder
              </CardTitle>
              <CardDescription>
                Create completely custom assessments with your own questions and objectives
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-title">Assessment Title</Label>
                  <Input
                    id="custom-title"
                    value={customSettings.title}
                    onChange={(e) => 
                      setCustomSettings(prev => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="e.g., Advanced Business Communication"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custom-description">Description</Label>
                  <Textarea
                    id="custom-description"
                    value={customSettings.description}
                    onChange={(e) => 
                      setCustomSettings(prev => ({ ...prev, description: e.target.value }))
                    }
                    placeholder="Brief description of the assessment..."
                  />
                </div>
              </div>

              {/* Learning Objectives */}
              <div className="space-y-3">
                <Label>Learning Objectives</Label>
                <div className="flex gap-2">
                  <Input
                    value={customSettings.objectiveInput}
                    onChange={(e) => 
                      setCustomSettings(prev => ({ ...prev, objectiveInput: e.target.value }))
                    }
                    placeholder="Add a learning objective..."
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addLearningObjective();
                      }
                    }}
                  />
                  <Button onClick={addLearningObjective} variant="outline">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {customSettings.learningObjectives.map((objective, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeLearningObjective(index)}
                    >
                      {objective} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <Button 
                onClick={handleCustomGenerate} 
                disabled={isGenerating || !customSettings.title || customSettings.learningObjectives.length === 0}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Shuffle className="h-4 w-4 mr-2 animate-spin" />
                    Creating Custom Assessment...
                  </>
                ) : (
                  <>
                    <Brain className="h-4 w-4 mr-2" />
                    Create Custom Assessment
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generated Assessment Preview */}
      {generatedAssessment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Generated Assessment Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{generatedAssessment.questions.length}</div>
                  <div className="text-sm text-muted-foreground">Questions</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{generatedAssessment.duration}</div>
                  <div className="text-sm text-muted-foreground">Minutes</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{generatedAssessment.totalPoints}</div>
                  <div className="text-sm text-muted-foreground">Points</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{generatedAssessment.passingScore}%</div>
                  <div className="text-sm text-muted-foreground">To Pass</div>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-2">Assessment Details</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Title:</strong> {generatedAssessment.title}</div>
                  <div><strong>Level:</strong> {generatedAssessment.cefrLevel}</div>
                  <div><strong>Context:</strong> {generatedAssessment.businessContext}</div>
                  <div><strong>Objectives:</strong> {generatedAssessment.learningObjectives.join(', ')}</div>
                  <div><strong>Adaptive:</strong> {generatedAssessment.adaptiveDifficulty ? 'Yes' : 'No'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {generatedAssessment.cefrLevel} Level
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {generatedAssessment.duration} min
                </Badge>
                {generatedAssessment.adaptiveDifficulty && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Brain className="h-3 w-3" />
                    Adaptive
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}