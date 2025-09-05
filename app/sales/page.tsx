'use client';

import { useState } from 'react';
import { CourseRequestForm } from '@/components/course/CourseRequestForm';
import { CurriculumOutline, FullCourse } from '@/lib/services/course-generator';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, FileText, Users, Target, MessageCircle, Sparkles, GraduationCap, 
  Clock, BookOpen, CheckCircle, Download, Loader2, ArrowRight, Star, 
  Globe, Building, Award, TrendingUp 
} from 'lucide-react';

export default function SalesPage() {
  const [curriculum, setCurriculum] = useState<CurriculumOutline | null>(null);
  const [fullCourse, setFullCourse] = useState<FullCourse | null>(null);
  const [isGeneratingCourse, setIsGeneratingCourse] = useState(false);
  const [courseGenerationProgress, setCourseGenerationProgress] = useState(0);

  const handleCurriculumReceived = (newCurriculum: CurriculumOutline) => {
    setCurriculum(newCurriculum);
    setFullCourse(null); // Reset full course when new curriculum is generated
  };

  const generateFullCourse = async () => {
    if (!curriculum) return;
    
    setIsGeneratingCourse(true);
    setCourseGenerationProgress(0);
    
    // Simulate progressive generation with visual feedback
    const progressInterval = setInterval(() => {
      setCourseGenerationProgress(prev => {
        if (prev >= 85) return prev;
        return prev + Math.random() * 15;
      });
    }, 1000);

    try {
      const response = await fetch('/api/course/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ curriculum })
      });

      const result = await response.json();
      
      if (result.success) {
        setCourseGenerationProgress(100);
        setTimeout(() => {
          setFullCourse(result.course);
        }, 500);
      } else {
        throw new Error(result.error || 'Failed to generate course materials');
      }
    } catch (error) {
      console.error('Error generating full course:', error);
      // More user-friendly error handling (we'll implement this in the UI)
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setIsGeneratingCourse(false);
        setCourseGenerationProgress(0);
      }, 1000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-3">
                <GraduationCap className="h-12 w-12" />
              </div>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              B2B English Course Creator
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 leading-relaxed">
              Generate AI-powered, CEFR-aligned English courses for your business clients in minutes
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Globe className="h-4 w-4 mr-2" />
                CEFR Aligned
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Building className="h-4 w-4 mr-2" />
                Business Focused
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <Award className="h-4 w-4 mr-2" />
                Professional Quality
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                <TrendingUp className="h-4 w-4 mr-2" />
                AI Powered
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Step Indicator */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-semibold">
                1
              </div>
              <div className="ml-4">
                <p className="font-semibold text-gray-900">Course Requirements</p>
                <p className="text-sm text-gray-600">Define client needs</p>
              </div>
            </div>
            
            <ArrowRight className="h-5 w-5 text-gray-400" />
            
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                curriculum ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {curriculum ? <CheckCircle className="h-5 w-5" /> : '2'}
              </div>
              <div className="ml-4">
                <p className={`font-semibold ${curriculum ? 'text-gray-900' : 'text-gray-500'}`}>
                  Curriculum Review
                </p>
                <p className="text-sm text-gray-600">Approve structure</p>
              </div>
            </div>
            
            <ArrowRight className="h-5 w-5 text-gray-400" />
            
            <div className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                fullCourse ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {fullCourse ? <CheckCircle className="h-5 w-5" /> : '3'}
              </div>
              <div className="ml-4">
                <p className={`font-semibold ${fullCourse ? 'text-gray-900' : 'text-gray-500'}`}>
                  Course Materials
                </p>
                <p className="text-sm text-gray-600">Generate & export</p>
              </div>
            </div>
          </div>
        </div>

        {/* Course Request Form */}
        <CourseRequestForm onCurriculumReceived={handleCurriculumReceived} />

        {/* Generated Curriculum Display */}
        {curriculum && (
          <div className="mt-12 max-w-6xl mx-auto">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="bg-green-600 rounded-full p-2">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-gray-900">
                        Curriculum Generated Successfully
                      </CardTitle>
                      <p className="text-gray-600">Review and approve your custom course structure</p>
                    </div>
                  </div>
                  <Button 
                    onClick={generateFullCourse}
                    disabled={isGeneratingCourse}
                    size="lg"
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg"
                  >
                    {isGeneratingCourse ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generating Materials...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        Generate Full Course
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-8">
                {/* Course Overview */}
                <div className="mb-8">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {curriculum.courseTitle}
                    </h3>
                    <div className="flex flex-wrap gap-4">
                      <Badge variant="outline" className="border-blue-200 text-blue-700">
                        <Clock className="h-3 w-3 mr-1" />
                        {curriculum.duration}
                      </Badge>
                      <Badge variant="outline" className="border-green-200 text-green-700">
                        <Award className="h-3 w-3 mr-1" />
                        {curriculum.cefrLevel} Level
                      </Badge>
                      <Badge variant="outline" className="border-purple-200 text-purple-700">
                        <BookOpen className="h-3 w-3 mr-1" />
                        {curriculum.estimatedHours} hours
                      </Badge>
                      <Badge variant="outline" className="border-orange-200 text-orange-700">
                        <Users className="h-3 w-3 mr-1" />
                        {curriculum.modules.length} modules
                      </Badge>
                    </div>
                  </div>

                  {/* Learning Objectives */}
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <Target className="h-5 w-5 mr-2 text-blue-600" />
                      Learning Objectives
                    </h4>
                    <div className="grid md:grid-cols-2 gap-3">
                      {curriculum.learningObjectives.map((objective, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          <p className="text-gray-700 text-sm">{objective}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Course Modules */}
                  <div className="mb-8">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                      Course Modules
                    </h4>
                    <div className="space-y-4">
                      {curriculum.modules.map((module, index) => (
                        <Card key={index} className="border border-gray-200 hover:shadow-md transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div>
                                <h5 className="text-lg font-semibold text-gray-900">
                                  Module {module.moduleNumber}: {module.title}
                                </h5>
                                <Badge variant="secondary" className="mt-2">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {module.duration}
                                </Badge>
                              </div>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                              <div>
                                <h6 className="font-medium text-gray-900 mb-2 flex items-center">
                                  <FileText className="h-4 w-4 mr-2 text-blue-600" />
                                  Key Topics
                                </h6>
                                <ul className="space-y-1">
                                  {module.topics.map((topic, topicIndex) => (
                                    <li key={topicIndex} className="text-sm text-gray-700 flex items-center">
                                      <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mr-2"></div>
                                      {topic}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h6 className="font-medium text-gray-900 mb-2 flex items-center">
                                  <Users className="h-4 w-4 mr-2 text-green-600" />
                                  Learning Activities
                                </h6>
                                <ul className="space-y-1">
                                  {module.activities.map((activity, activityIndex) => (
                                    <li key={activityIndex} className="text-sm text-gray-700 flex items-center">
                                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full mr-2"></div>
                                      {activity}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Assessment Strategy */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                      <MessageCircle className="h-5 w-5 mr-2 text-amber-600" />
                      Assessment Strategy
                    </h4>
                    <p className="text-gray-700 leading-relaxed">{curriculum.assessmentStrategy}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Course Generation Progress */}
        {isGeneratingCourse && (
          <div className="mt-8 max-w-2xl mx-auto">
            <Card className="shadow-lg">
              <CardContent className="p-8 text-center">
                <div className="mb-6">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Generating Complete Course Materials
                  </h3>
                  <p className="text-gray-600">
                    Creating lesson plans, trainer guides, student materials, and assessments...
                  </p>
                </div>
                <Progress value={courseGenerationProgress} className="w-full mb-4" />
                <p className="text-sm text-gray-500">
                  {Math.round(courseGenerationProgress)}% complete
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Full Course Materials Display */}
        {fullCourse && (
          <div className="mt-12 max-w-6xl mx-auto">
            <Card className="shadow-2xl border-0 bg-gradient-to-br from-green-50 via-white to-emerald-50">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                <div className="text-center py-4">
                  <div className="flex justify-center mb-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                      <CheckCircle className="h-8 w-8" />
                    </div>
                  </div>
                  <CardTitle className="text-3xl mb-2">
                    Course Materials Generated Successfully!
                  </CardTitle>
                  <p className="text-green-100">
                    Your complete course package is ready for delivery
                  </p>
                </div>
              </CardHeader>
              
              <CardContent className="p-8">
                {/* Materials Summary Cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card className="border-2 border-blue-100 hover:border-blue-200 transition-colors">
                    <CardContent className="p-6 text-center">
                      <div className="bg-blue-100 rounded-full p-3 w-fit mx-auto mb-4">
                        <FileText className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-blue-800 mb-2">Lesson Plans</h3>
                      <p className="text-3xl font-bold text-blue-600 mb-1">{fullCourse.lessonPlans.length}</p>
                      <p className="text-sm text-gray-600">Detailed instructional guides</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2 border-green-100 hover:border-green-200 transition-colors">
                    <CardContent className="p-6 text-center">
                      <div className="bg-green-100 rounded-full p-3 w-fit mx-auto mb-4">
                        <Users className="h-6 w-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-green-800 mb-2">Trainer Guides</h3>
                      <p className="text-3xl font-bold text-green-600 mb-1">{fullCourse.trainerGuides.length}</p>
                      <p className="text-sm text-gray-600">Professional teaching support</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2 border-purple-100 hover:border-purple-200 transition-colors">
                    <CardContent className="p-6 text-center">
                      <div className="bg-purple-100 rounded-full p-3 w-fit mx-auto mb-4">
                        <BookOpen className="h-6 w-6 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-purple-800 mb-2">Student Materials</h3>
                      <p className="text-3xl font-bold text-purple-600 mb-1">{fullCourse.studentMaterials.length}</p>
                      <p className="text-sm text-gray-600">Interactive learning resources</p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-2 border-orange-100 hover:border-orange-200 transition-colors">
                    <CardContent className="p-6 text-center">
                      <div className="bg-orange-100 rounded-full p-3 w-fit mx-auto mb-4">
                        <Target className="h-6 w-6 text-orange-600" />
                      </div>
                      <h3 className="font-semibold text-orange-800 mb-2">Assessments</h3>
                      <p className="text-3xl font-bold text-orange-600 mb-1">{fullCourse.assessments.length}</p>
                      <p className="text-sm text-gray-600">Progress evaluation tools</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Sample Materials Preview */}
                <div className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                    <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
                    Sample Lesson Plans Preview
                  </h3>
                  
                  <div className="grid gap-4">
                    {fullCourse.lessonPlans.slice(0, 2).map((lesson, index) => (
                      <Card key={index} className="border border-gray-200">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900">
                                Module {lesson.moduleNumber}, Lesson {lesson.lessonNumber}: {lesson.title}
                              </h4>
                              <div className="flex items-center gap-4 mt-2">
                                <Badge variant="outline">
                                  <Clock className="h-3 w-3 mr-1" />
                                  {lesson.duration} minutes
                                </Badge>
                                <Badge variant="outline">
                                  <Target className="h-3 w-3 mr-1" />
                                  {lesson.objectives.length} objectives
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600">
                            <strong>Key Objectives:</strong> {lesson.objectives.slice(0, 2).join(', ')}
                            {lesson.objectives.length > 2 && '...'}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Success Message and Next Steps */}
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Course package complete!</strong> Your comprehensive English training materials 
                    are ready for trainer delivery and client approval. All materials are CEFR-aligned 
                    and professionally structured for immediate implementation.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-center mt-8">
                  <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg">
                    <Download className="h-4 w-4 mr-2" />
                    Export Course Package
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}