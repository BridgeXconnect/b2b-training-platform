'use client';

import { useState } from 'react';
import { useCopilotAction } from '@copilotkit/react-core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CourseRequest, CurriculumOutline } from '@/lib/services/course-generator';
import { 
  Building, Users, Clock, Target, Sparkles, Loader2, CheckCircle, 
  AlertCircle, FileText, Award, Send 
} from 'lucide-react';

interface CourseRequestFormProps {
  onCurriculumReceived?: (curriculum: CurriculumOutline) => void;
}

export function CourseRequestForm({ onCurriculumReceived }: CourseRequestFormProps) {
  const [formData, setFormData] = useState<CourseRequest>({
    clientNeeds: '',
    industry: '',
    cefrLevel: 'B1',
    duration: '',
    participants: 1,
    specificGoals: []
  });

  const [isLoading, setIsLoading] = useState(false);
  const [curriculum, setCurriculum] = useState<CurriculumOutline | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // CopilotKit Action for AI-assisted course generation
  useCopilotAction({
    name: "generateCurriculum",
    description: "Generate a comprehensive English course curriculum based on client requirements",
    parameters: [
      {
        name: "clientNeeds",
        type: "string",
        description: "Specific client needs and requirements"
      },
      {
        name: "industry", 
        type: "string",
        description: "Client's industry sector"
      },
      {
        name: "cefrLevel",
        type: "string", 
        description: "Target CEFR level (A1, A2, B1, B2, C1, C2)"
      },
      {
        name: "duration",
        type: "string",
        description: "Course duration (e.g., '4 weeks', '2 months')"
      },
      {
        name: "participants",
        type: "number",
        description: "Number of participants"
      }
    ],
    handler: async ({ clientNeeds, industry, cefrLevel, duration, participants }) => {
      const request: CourseRequest = {
        clientNeeds,
        industry,
        cefrLevel: cefrLevel as CourseRequest['cefrLevel'],
        duration,
        participants: Number(participants),
      };

      const response = await fetch('/api/course/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      const result = await response.json();
      
      if (result.success) {
        setCurriculum(result.curriculum);
        onCurriculumReceived?.(result.curriculum);
        return `Course curriculum "${result.curriculum.courseTitle}" generated successfully with ${result.curriculum.modules.length} modules.`;
      } else {
        throw new Error(result.error || 'Failed to generate curriculum');
      }
    }
  });

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.clientNeeds.trim()) {
      errors.clientNeeds = 'Client needs description is required';
    } else if (formData.clientNeeds.trim().length < 20) {
      errors.clientNeeds = 'Please provide a more detailed description (at least 20 characters)';
    }

    if (!formData.industry.trim()) {
      errors.industry = 'Industry sector is required';
    }

    if (!formData.duration.trim()) {
      errors.duration = 'Course duration is required';
    }

    if (formData.participants < 1 || formData.participants > 50) {
      errors.participants = 'Number of participants must be between 1 and 50';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/course/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setCurriculum(result.curriculum);
        onCurriculumReceived?.(result.curriculum);
        setError(null);
      } else {
        setError(result.error || 'Failed to generate curriculum');
      }
    } catch (error) {
      console.error('Error generating curriculum:', error);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CourseRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Helper function to get CEFR level description
  const getCefrDescription = (level: string): string => {
    const descriptions = {
      A1: 'Can understand familiar everyday expressions and basic phrases',
      A2: 'Can communicate in simple tasks requiring basic information exchange',
      B1: 'Can understand clear standard input on familiar matters',
      B2: 'Can understand complex text and interact with fluency',
      C1: 'Can understand demanding, longer texts with implicit meaning',
      C2: 'Can understand virtually everything heard or read with ease'
    };
    return descriptions[level as keyof typeof descriptions] || '';
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <div className="flex items-center space-x-4">
            <div className="bg-blue-600 rounded-full p-3">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl text-gray-900">
                Course Requirements Form
              </CardTitle>
              <p className="text-gray-600 mt-1">
                Tell us about your client's English training needs and we'll create a custom curriculum
              </p>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-8">
          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Client Needs Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Target className="h-5 w-5 text-blue-600" />
                <Label className="text-lg font-semibold text-gray-900">
                  Client Needs & Business Context
                </Label>
              </div>
              
              <div>
                <Label htmlFor="clientNeeds" className="text-sm font-medium text-gray-700">
                  Specific Requirements & Challenges *
                </Label>
                <Textarea
                  id="clientNeeds"
                  placeholder="Describe your client's specific English language needs, current challenges, business context, and training objectives. Be as detailed as possible to help us create the most relevant curriculum..."
                  value={formData.clientNeeds}
                  onChange={(e) => handleInputChange('clientNeeds', e.target.value)}
                  className={`mt-2 min-h-[120px] ${validationErrors.clientNeeds ? 'border-red-300' : ''}`}
                  rows={5}
                />
                {validationErrors.clientNeeds && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.clientNeeds}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  {formData.clientNeeds.length}/500 characters
                </p>
              </div>
            </div>

            {/* Business Details Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-blue-600" />
                <Label className="text-lg font-semibold text-gray-900">
                  Business Details
                </Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="industry" className="text-sm font-medium text-gray-700">
                    Industry Sector *
                  </Label>
                  <Input
                    id="industry"
                    placeholder="e.g., Healthcare, Finance, Technology, Manufacturing"
                    value={formData.industry}
                    onChange={(e) => handleInputChange('industry', e.target.value)}
                    className={`mt-2 ${validationErrors.industry ? 'border-red-300' : ''}`}
                  />
                  {validationErrors.industry && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.industry}</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="participants" className="text-sm font-medium text-gray-700">
                    Number of Participants
                  </Label>
                  <Input
                    id="participants"
                    type="number"
                    min="1"
                    max="50"
                    value={formData.participants}
                    onChange={(e) => handleInputChange('participants', parseInt(e.target.value) || 1)}
                    className={`mt-2 ${validationErrors.participants ? 'border-red-300' : ''}`}
                  />
                  {validationErrors.participants && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.participants}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Maximum 50 participants per course</p>
                </div>
              </div>
            </div>

            {/* Course Structure Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-blue-600" />
                <Label className="text-lg font-semibold text-gray-900">
                  Course Structure & Level
                </Label>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="cefrLevel" className="text-sm font-medium text-gray-700">
                    Target CEFR Level *
                  </Label>
                  <Select value={formData.cefrLevel} onValueChange={(value) => handleInputChange('cefrLevel', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A1">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">A1 - Beginner</span>
                          <Badge variant="outline" className="ml-2">Basic</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="A2">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">A2 - Elementary</span>
                          <Badge variant="outline" className="ml-2">Basic</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="B1">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">B1 - Intermediate</span>
                          <Badge variant="outline" className="ml-2">Independent</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="B2">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">B2 - Upper Intermediate</span>
                          <Badge variant="outline" className="ml-2">Independent</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="C1">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">C1 - Advanced</span>
                          <Badge variant="outline" className="ml-2">Proficient</Badge>
                        </div>
                      </SelectItem>
                      <SelectItem value="C2">
                        <div className="flex items-center justify-between w-full">
                          <span className="font-medium">C2 - Mastery</span>
                          <Badge variant="outline" className="ml-2">Proficient</Badge>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="mt-2 text-xs text-gray-600">
                    {getCefrDescription(formData.cefrLevel)}
                  </p>
                </div>

                <div>
                  <Label htmlFor="duration" className="text-sm font-medium text-gray-700">
                    Course Duration *
                  </Label>
                  <Input
                    id="duration"
                    placeholder="e.g., 4 weeks, 2 months, 40 hours"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', e.target.value)}
                    className={`mt-2 ${validationErrors.duration ? 'border-red-300' : ''}`}
                  />
                  {validationErrors.duration && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.duration}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Include timeframe or total hours (e.g., "8 weeks" or "40 hours")
                  </p>
                </div>
              </div>
            </div>

            {/* Additional Requirements Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <Label className="text-lg font-semibold text-gray-900">
                  Additional Requirements (Optional)
                </Label>
              </div>
              
              <div>
                <Label htmlFor="specificGoals" className="text-sm font-medium text-gray-700">
                  Specific Learning Goals & Focus Areas
                </Label>
                <Textarea
                  id="specificGoals"
                  placeholder="Any specific skills, vocabulary, communication scenarios, or business situations to emphasize (e.g., presentations, negotiations, customer service, technical writing)..."
                  value={formData.specificGoals?.join('\n') || ''}
                  onChange={(e) => handleInputChange('specificGoals', e.target.value.split('\n').filter(goal => goal.trim()))}
                  className="mt-2"
                  rows={3}
                />
                <p className="mt-1 text-xs text-gray-500">
                  One goal per line. This helps us customize the content to your client's specific needs.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <Button 
                type="submit" 
                disabled={isLoading} 
                size="lg"
                className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg px-8 py-3"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Generating Curriculum...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Generate Course Curriculum
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Success Display */}
          {curriculum && !isLoading && (
            <div className="mt-8">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <div className="space-y-2">
                    <p className="font-semibold">✅ Curriculum Generated Successfully!</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                      <div>
                        <p className="font-medium">Course Title:</p>
                        <p className="text-green-700">{curriculum.courseTitle}</p>
                      </div>
                      <div>
                        <p className="font-medium">Duration:</p>
                        <p className="text-green-700">{curriculum.duration}</p>
                      </div>
                      <div>
                        <p className="font-medium">CEFR Level:</p>
                        <p className="text-green-700">{curriculum.cefrLevel}</p>
                      </div>
                      <div>
                        <p className="font-medium">Total Hours:</p>
                        <p className="text-green-700">{curriculum.estimatedHours} hours</p>
                      </div>
                    </div>
                    <p className="text-sm text-green-600 mt-2">
                      Scroll down to review the complete curriculum and generate full course materials.
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}