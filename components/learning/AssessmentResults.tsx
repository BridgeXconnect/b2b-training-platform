'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Trophy, 
  Target, 
  TrendingUp, 
  Clock,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Download,
  Share2,
  RotateCcw,
  ChevronRight,
  Award,
  Brain,
  Lightbulb,
  BarChart3,
  PieChart,
  FileText
} from 'lucide-react';
import {
  AssessmentResults as Results,
  AssessmentExporter,
  CEFRLevel
} from '@/lib/utils/assessment';
import { cn } from '@/lib/utils';

interface AssessmentResultsProps {
  results: Results;
  onRetakeAssessment?: () => void;
  onViewHistory?: () => void;
  onContinueLearning?: () => void;
}

export default function AssessmentResults({
  results,
  onRetakeAssessment,
  onViewHistory,
  onContinueLearning
}: AssessmentResultsProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [showDetailedFeedback, setShowDetailedFeedback] = useState(false);
  
  const { attempt, skillBreakdown, cefrLevelAnalysis, detailedFeedback, studyRecommendations } = results;
  
  const isPassed = attempt.percentage >= 70; // Assuming 70% is passing
  const scoreColor = isPassed ? 'text-green-600' : attempt.percentage >= 50 ? 'text-yellow-600' : 'text-red-600';
  const scoreIcon = isPassed ? CheckCircle2 : attempt.percentage >= 50 ? AlertCircle : XCircle;
  const ScoreIcon = scoreIcon;

  const handleExportPDF = () => {
    const pdfContent = AssessmentExporter.generatePDFReport(results);
    const blob = new Blob([pdfContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assessment-results-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const jsonData = AssessmentExporter.exportResultsToJSON(results);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `assessment-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const shareText = `I scored ${attempt.percentage}% on my ${cefrLevelAnalysis.currentLevel} level English assessment! 🎯`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Assessment Results',
          text: shareText,
          url: window.location.href
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(shareText);
      alert('Results copied to clipboard!');
    }
  };

  const getPerformanceLevel = (percentage: number): { level: string; color: string; description: string } => {
    if (percentage >= 90) return { level: 'Excellent', color: 'text-green-600', description: 'Outstanding performance!' };
    if (percentage >= 80) return { level: 'Very Good', color: 'text-blue-600', description: 'Strong understanding demonstrated' };
    if (percentage >= 70) return { level: 'Good', color: 'text-green-500', description: 'Solid performance, well done!' };
    if (percentage >= 60) return { level: 'Satisfactory', color: 'text-yellow-600', description: 'Room for improvement' };
    if (percentage >= 50) return { level: 'Needs Work', color: 'text-orange-600', description: 'Additional practice recommended' };
    return { level: 'Below Standard', color: 'text-red-600', description: 'Significant improvement needed' };
  };

  const performance = getPerformanceLevel(attempt.percentage);

  const getSkillColorClass = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const formatTimeSpent = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getCEFRLevelColor = (level: CEFRLevel): string => {
    const colors = {
      'A1': 'bg-gray-500',
      'A2': 'bg-blue-500',
      'B1': 'bg-green-500',
      'B2': 'bg-yellow-500',
      'C1': 'bg-orange-500',
      'C2': 'bg-red-500'
    };
    return colors[level] || 'bg-gray-500';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header with overall score */}
      <Card className={cn("border-2", isPassed ? "border-green-200 bg-green-50" : "border-gray-200")}>
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <ScoreIcon className={cn("h-12 w-12", scoreColor)} />
            <div>
              <div className={cn("text-4xl font-bold", scoreColor)}>
                {attempt.percentage}%
              </div>
              <Badge 
                variant={isPassed ? "default" : "secondary"} 
                className={cn("text-sm", isPassed && "bg-green-600")}
              >
                {performance.level}
              </Badge>
            </div>
          </div>
          
          <CardTitle className="text-2xl">Assessment Complete!</CardTitle>
          <CardDescription className="text-lg">
            {performance.description}
          </CardDescription>

          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              {attempt.score} / {attempt.score / (attempt.percentage / 100)} points
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {formatTimeSpent(attempt.timeSpent)}
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              {detailedFeedback.filter(f => f.isCorrect).length} / {detailedFeedback.length} correct
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex items-center justify-center gap-3">
            <Button onClick={onContinueLearning} className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Continue Learning
            </Button>
            
            {onRetakeAssessment && (
              <Button onClick={onRetakeAssessment} variant="outline" className="flex items-center gap-2">
                <RotateCcw className="h-4 w-4" />
                Retake Assessment
              </Button>
            )}
            
            <Button onClick={handleShare} variant="outline" className="flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Share Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed results tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="skills" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Skills Analysis
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Detailed Feedback
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Study Plan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* CEFR Level Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-blue-600" />
                  CEFR Level Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Current Level</span>
                    <Badge className={getCEFRLevelColor(cefrLevelAnalysis.currentLevel)}>
                      {cefrLevelAnalysis.currentLevel}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Demonstrated Level</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "border-2",
                        cefrLevelAnalysis.demonstratedLevel !== cefrLevelAnalysis.currentLevel && "border-green-500"
                      )}
                    >
                      {cefrLevelAnalysis.demonstratedLevel}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Readiness for Next Level</span>
                      <span className="font-medium">{cefrLevelAnalysis.readinessForNext}%</span>
                    </div>
                    <Progress value={cefrLevelAnalysis.readinessForNext} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Overall Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto">
                    <div className="w-full h-full rounded-full border-8 border-gray-200 relative">
                      <div 
                        className={cn("absolute inset-0 rounded-full border-8 border-transparent", scoreColor.replace('text-', 'border-'))}
                        style={{
                          borderTopColor: 'currentColor',
                          borderRightColor: attempt.percentage > 25 ? 'currentColor' : 'transparent',
                          borderBottomColor: attempt.percentage > 50 ? 'currentColor' : 'transparent',
                          borderLeftColor: attempt.percentage > 75 ? 'currentColor' : 'transparent',
                          transform: `rotate(${(attempt.percentage / 100) * 360}deg)`
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-bold">{attempt.percentage}%</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Overall Score</p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-purple-600" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Questions Answered</span>
                  <Badge variant="outline">{detailedFeedback.length}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Correct Answers</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {detailedFeedback.filter(f => f.isCorrect).length}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Time Spent</span>
                  <Badge variant="outline">{formatTimeSpent(attempt.timeSpent)}</Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Average per Question</span>
                  <Badge variant="outline">
                    {Math.round(attempt.timeSpent / detailedFeedback.length)}s
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Skills Breakdown
              </CardTitle>
              <CardDescription>
                Performance analysis by skill area
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {Object.entries(skillBreakdown)
                  .filter(([_, data]) => data.total > 0)
                  .map(([skill, data]) => (
                    <div key={skill} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium capitalize">{skill.replace('-', ' ')}</h4>
                          <Badge variant="outline" className="text-xs">
                            {data.correct}/{data.total}
                          </Badge>
                        </div>
                        <span className="font-medium">{data.percentage}%</span>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <Progress value={data.percentage} className="flex-1" />
                        <div className={cn("w-3 h-3 rounded-full", getSkillColorClass(data.percentage))} />
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {data.percentage >= 80 
                          ? "Excellent performance in this area!" 
                          : data.percentage >= 60 
                            ? "Good understanding, some room for improvement."
                            : "This area needs more practice and attention."
                        }
                      </p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    Detailed Question Feedback
                  </CardTitle>
                  <CardDescription>
                    Review your answers and learn from explanations
                  </CardDescription>
                </div>
                
                <Button 
                  onClick={() => setShowDetailedFeedback(!showDetailedFeedback)}
                  variant="outline"
                  size="sm"
                >
                  {showDetailedFeedback ? 'Hide Details' : 'Show Details'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {detailedFeedback.map((feedback, index) => (
                  <Card key={feedback.questionId} className="border-l-4 border-l-gray-200">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline">Q{index + 1}</Badge>
                          {feedback.isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <span className="font-medium">
                            {feedback.isCorrect ? 'Correct' : 'Incorrect'}
                          </span>
                        </div>
                        
                        <Badge variant={feedback.isCorrect ? "default" : "destructive"}>
                          {feedback.isCorrect ? '+' : '0'} points
                        </Badge>
                      </div>
                      
                      {showDetailedFeedback && (
                        <div className="mt-4 space-y-3 text-sm">
                          <div>
                            <p className="font-medium text-muted-foreground">Your Answer:</p>
                            <p>{String(feedback.userAnswer)}</p>
                          </div>
                          
                          {!feedback.isCorrect && (
                            <div>
                              <p className="font-medium text-muted-foreground">Correct Answer:</p>
                              <p className="text-green-700">{String(feedback.correctAnswer)}</p>
                            </div>
                          )}
                          
                          <div>
                            <p className="font-medium text-muted-foreground">Explanation:</p>
                            <p>{feedback.explanation}</p>
                          </div>
                          
                          <div>
                            <p className="font-medium text-muted-foreground">Feedback:</p>
                            <p>{feedback.skillAreaFeedback}</p>
                          </div>
                          
                          {feedback.improvementSuggestions.length > 0 && (
                            <div>
                              <p className="font-medium text-muted-foreground">Suggestions:</p>
                              <ul className="list-disc list-inside space-y-1">
                                {feedback.improvementSuggestions.map((suggestion, idx) => (
                                  <li key={idx}>{suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                Personalized Study Recommendations
              </CardTitle>
              <CardDescription>
                Based on your performance, here's what to focus on next
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                {studyRecommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                    <Lightbulb className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p>{recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {results.nextAssessmentSuggestion && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Next Assessment:</strong> {results.nextAssessmentSuggestion}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="flex items-center gap-3 pt-4">
                <Button onClick={onContinueLearning} className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Start Learning Plan
                </Button>
                
                {onViewHistory && (
                  <Button onClick={onViewHistory} variant="outline" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    View Progress History
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export options */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gray-600" />
            Export Results
          </CardTitle>
          <CardDescription>
            Save your assessment results for future reference
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            <Button onClick={handleExportPDF} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Report (PDF)
            </Button>
            
            <Button onClick={handleExportJSON} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export Data (JSON)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}