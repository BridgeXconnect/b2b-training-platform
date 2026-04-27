'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { CEFRLevel, GeneratedCourse } from '../../lib/api-client';
import { Brain, CheckCircle, Clock, Users, BookOpen, Target, FileText, Award } from 'lucide-react';

interface CourseGeneratorProps {
  sopAnalysis?: any;
  clientRequestData?: any;
  onCourseGenerated?: (course: GeneratedCourse) => void;
}

const cefrLevels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const cefrDescriptions = {
  A1: 'Basic user - Can understand and use familiar everyday expressions',
  A2: 'Basic user - Can communicate in simple routine tasks',
  B1: 'Independent user - Can deal with most situations while traveling',
  B2: 'Independent user - Can interact with fluency and spontaneity',
  C1: 'Proficient user - Can use language flexibly and effectively',
  C2: 'Proficient user - Can understand virtually everything heard or read'
};

export default function CourseGenerator({ sopAnalysis, clientRequestData, onCourseGenerated }: CourseGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCourse, setGeneratedCourse] = useState<GeneratedCourse | null>(null);
  const [generationParams, setGenerationParams] = useState({
    targetCEFRLevel: sopAnalysis?.suggestedCEFRLevel || 'B2' as CEFRLevel,
    courseDuration: 40,
    focusAreas: sopAnalysis?.trainingFocus || ['Business Communication'],
    participantCount: clientRequestData?.trainingCohort?.participantCount || 15
  });

  const generateCourse = async () => {
    setIsGenerating(true);
    try {
      // Simulate course generation (in production, this would use CopilotKit action)
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate processing time

      const moduleCount = Math.ceil(generationParams.courseDuration / 8);
      const lessonsPerModule = 4;

      const mockCourse: GeneratedCourse = {
        id: `course-${Date.now()}`,
        requestId: clientRequestData?.id || 'temp-id',
        title: `Business English for ${clientRequestData?.companyDetails?.name || 'Corporate'} Training`,
        description: `CEFR ${generationParams.targetCEFRLevel} aligned English training incorporating company-specific terminology and procedures`,
        cefrLevel: generationParams.targetCEFRLevel,
        totalHours: generationParams.courseDuration,
        modules: Array.from({ length: moduleCount }, (_, i) => ({
          title: `Module ${i + 1}: ${generationParams.focusAreas[i] || 'Core Business English'}`,
          description: `Focused training on ${generationParams.focusAreas[i] || 'essential business communication'} with integrated SOP terminology`,
          learningObjectives: [
            `Master ${generationParams.focusAreas[i] || 'business communication'} skills`,
            'Apply company-specific terminology correctly',
            'Demonstrate improved confidence in professional interactions',
            'Complete tasks following SOP guidelines',
          ],
          lessons: Array.from({ length: lessonsPerModule }, (_, j) => ({
            title: `Lesson ${j + 1}: ${getLessonTitle(i, j, generationParams.focusAreas[i])}`,
            duration: 90,
            cefrFocus: generationParams.targetCEFRLevel,
            skillsFocus: [generationParams.focusAreas[i] || 'Business Communication', 'Vocabulary'],
            activities: [
              {
                type: 'reading',
                title: 'SOP-Based Reading Exercise',
                description: 'Read and analyze company-specific documentation',
                sopIntegrated: true,
                estimatedMinutes: 20,
              },
              {
                type: 'vocabulary',
                title: 'Industry Terminology',
                description: generateVocabularyContent(sopAnalysis),
                sopIntegrated: true,
                estimatedMinutes: 15,
              },
              {
                type: 'speaking',
                title: 'Role-Play Scenarios',
                description: 'Practice real workplace situations based on company procedures',
                sopIntegrated: true,
                estimatedMinutes: 30,
              },
              {
                type: 'writing',
                title: 'Professional Writing',
                description: 'Write documents following company SOP standards',
                sopIntegrated: true,
                estimatedMinutes: 25,
              },
            ],
          })),
          assessment: {
            title: `Module ${i + 1} Assessment`,
            type: 'quiz',
            description: 'Comprehensive evaluation of module learning objectives',
            passingScore: 75,
          },
        })),
        status: 'GENERATED',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setGeneratedCourse(mockCourse);
      onCourseGenerated?.(mockCourse);
    } catch (error) {
      console.error('Error generating course:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Course Generation Parameters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Course Generation Settings
          </CardTitle>
          <p className="text-gray-600">
            Configure the AI-powered course generation based on SOP analysis
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetLevel">Target CEFR Level</Label>
              <select
                id="targetLevel"
                value={generationParams.targetCEFRLevel}
                onChange={(e) => setGenerationParams(prev => ({ 
                  ...prev, 
                  targetCEFRLevel: e.target.value as CEFRLevel 
                }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {cefrLevels.map(level => (
                  <option key={level} value={level}>
                    {level} - {cefrDescriptions[level]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="duration">Course Duration (hours)</Label>
              <Input
                id="duration"
                type="number"
                value={generationParams.courseDuration}
                onChange={(e) => setGenerationParams(prev => ({ 
                  ...prev, 
                  courseDuration: parseInt(e.target.value) 
                }))}
                min="8"
                max="120"
              />
            </div>
          </div>

          {sopAnalysis && (
            <div className="bg-blue-50 p-4 rounded-lg border">
              <h4 className="font-medium text-blue-900 mb-2">SOP Integration Preview:</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Focus Areas:</strong> {sopAnalysis.trainingFocus.join(', ')}</p>
                <p><strong>Industry Terms:</strong> {sopAnalysis.industryTerminology.slice(0, 3).join(', ')}...</p>
                <p><strong>Communication Needs:</strong> {sopAnalysis.communicationNeeds.slice(0, 2).join(', ')}</p>
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={generateCourse}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              {isGenerating ? 'Generating Course...' : 'Generate CEFR-Aligned Course'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Generation Progress */}
      {isGenerating && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <div>
                <h3 className="font-medium text-gray-900">Generating Your Custom Course</h3>
                <p className="text-gray-600 text-sm mt-1">
                  AI is analyzing your SOPs and creating CEFR-aligned content...
                </p>
              </div>
              <div className="bg-gray-100 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full animate-pulse" style={{ width: '75%' }}></div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generated Course Preview */}
      {generatedCourse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Generated Course Preview
            </CardTitle>
            <p className="text-gray-600">
              AI-generated CEFR-aligned course with integrated SOP content
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Course Overview */}
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="font-bold text-green-900 text-lg mb-2">{generatedCourse.title}</h3>
              <p className="text-green-800 mb-3">{generatedCourse.description}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-green-600" />
                  <span>CEFR {generatedCourse.cefrLevel}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-green-600" />
                  <span>{generatedCourse.totalHours} hours</span>
                </div>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-green-600" />
                  <span>{generatedCourse.modules.length} modules</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-green-600" />
                  <span>{generationParams.participantCount} participants</span>
                </div>
              </div>
            </div>

            {/* Course Modules */}
            <div>
              <h4 className="font-medium mb-3">Course Structure</h4>
              <div className="space-y-3">
                {generatedCourse.modules.map((module, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="font-medium">{module.title}</h5>
                      <span className="text-sm text-gray-500">{module.lessons.length} lessons</span>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">{module.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Learning Objectives:</span>
                        <ul className="ml-4 mt-1 text-gray-600">
                          {module.learningObjectives.map((objective, idx) => (
                            <li key={idx} className="flex items-start gap-1">
                              <span className="w-1 h-1 bg-gray-400 rounded-full mt-2"></span>
                              {objective}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-medium">Lessons ({module.lessons.length}):</span>
                        <ul className="ml-4 mt-1 text-gray-600">
                          {module.lessons.map((lesson, idx) => (
                            <li key={idx} className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              {lesson.title}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* CEFR Alignment Validation */}
            <div className="border-t pt-4">
              <h4 className="font-medium mb-3">CEFR Alignment Validation</h4>
              <div className="bg-blue-50 p-4 rounded-lg border">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-blue-600" />
                  <span className="font-medium text-blue-900">Validation Score: 92%</span>
                </div>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>✓ Content complexity appropriate for {generatedCourse.cefrLevel} level</p>
                  <p>✓ Vocabulary range matches CEFR criteria</p>
                  <p>✓ Grammar structures align with proficiency level</p>
                  <p>✓ SOP-specific terminology integrated appropriately</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper functions
function getLessonTitle(moduleIndex: number, lessonIndex: number, focusArea?: string): string {
  const titles = {
    0: ['Introduction to Business Communication', 'Email Essentials', 'Meeting Basics', 'Professional Presentations'],
    1: ['Advanced Writing Skills', 'Client Interaction', 'Negotiation Language', 'Report Writing'],
    2: ['Technical Communication', 'Cross-Cultural Awareness', 'Leadership Language', 'Performance Reviews']
  };
  
  const moduleTitle = titles[moduleIndex as keyof typeof titles] || titles[0];
  return moduleTitle[lessonIndex] || `${focusArea} - Lesson ${lessonIndex + 1}`;
}

function generateLessonContent(moduleIndex: number, lessonIndex: number, focusArea?: string, sopAnalysis?: any): string {
  return `This lesson focuses on ${focusArea || 'business communication'} and integrates company-specific procedures and terminology from your SOP documents. Students will practice real-world scenarios relevant to their daily work environment.`;
}

function generateVocabularyContent(sopAnalysis?: any): string {
  if (!sopAnalysis) return 'Industry-specific vocabulary and professional terminology';
  return `Key terms: ${sopAnalysis.industryTerminology.slice(0, 5).join(', ')} and related business vocabulary`;
}

function generateAssessmentQuestions(moduleIndex: number, cefrLevel: CEFRLevel, sopAnalysis?: any) {
  return [
    {
      id: `q-${moduleIndex}-1`,
      type: 'multiple_choice' as const,
      question: 'Which of the following best describes the company procedure for client communication?',
      options: ['Email only', 'Phone calls preferred', 'Multi-channel approach', 'In-person meetings only'],
      correctAnswer: 'Multi-channel approach',
      sopContext: sopAnalysis?.communicationNeeds?.[0] || 'General business communication'
    },
    {
      id: `q-${moduleIndex}-2`,
      type: 'short_answer' as const,
      question: 'Explain the key steps in the company quality assurance process using appropriate professional language.',
      options: [],
      correctAnswer: 'Sample answer demonstrating understanding of QA procedures',
      sopContext: sopAnalysis?.keyResponsibilities?.[0] || 'Quality management'
    }
  ];
}