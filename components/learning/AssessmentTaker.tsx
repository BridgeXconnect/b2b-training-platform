'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  ArrowLeft,
  Flag,
  Target,
  BookOpen,
  AlertCircle
} from 'lucide-react';
import { Assessment } from '@/lib/utils/assessment';
import { assessmentService } from '@/lib/services/assessment-service';

interface AssessmentTakerProps {
  assessment: Assessment;
  onComplete: (results: AssessmentResults) => void;
  onClose: () => void;
  userId?: string;
}

interface AssessmentResults {
  assessmentId: string;
  score: number;
  percentage: number;
  timeSpent: number;
  answers: Record<string, any>;
  skillBreakdown: Record<string, number>;
  passed: boolean;
}

export default function AssessmentTaker({ 
  assessment, 
  onComplete, 
  onClose,
  userId = 'current_user'
}: AssessmentTakerProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [startTime] = useState(Date.now());
  const [timeRemaining, setTimeRemaining] = useState(assessment.duration * 60); // Convert to seconds
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());

  const currentQuestion = assessment.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / assessment.questions.length) * 100;
  const allQuestionsAnswered = assessment.questions.every((_, index) => answers[index] !== undefined);

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleSubmit();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (value: any) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestionIndex]: value
    }));
  };

  const toggleFlag = () => {
    setFlaggedQuestions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(currentQuestionIndex)) {
        newSet.delete(currentQuestionIndex);
      } else {
        newSet.add(currentQuestionIndex);
      }
      return newSet;
    });
  };

  const calculateResults = (): AssessmentResults => {
    let totalPoints = 0;
    let earnedPoints = 0;
    const skillBreakdown: Record<string, number> = {};

    assessment.questions.forEach((question, index) => {
      const userAnswer = answers[index];
      const questionPoints = question.points || 1;
      totalPoints += questionPoints;

      // Simple scoring logic - in a real app, this would be more sophisticated
      let isCorrect = false;
      if (question.type === 'multiple-choice' && question.correctAnswer) {
        isCorrect = userAnswer === question.correctAnswer;
      } else if (question.type === 'fill-blank' && question.correctAnswer) {
        const correctAnswer = Array.isArray(question.correctAnswer) ? question.correctAnswer[0] : question.correctAnswer;
        isCorrect = userAnswer?.toString().toLowerCase().trim() === correctAnswer.toLowerCase().trim();
      } else if (question.type === 'essay') {
        // For essays, assume partial credit based on length and keywords
        const wordCount = (userAnswer || '').split(' ').filter((w: string) => w.length > 0).length;
        isCorrect = wordCount >= 50; // Basic heuristic
      }

      if (isCorrect) {
        earnedPoints += questionPoints;
      }

      // Track skill performance
      const skill = question.skillArea || 'general';
      if (!skillBreakdown[skill]) {
        skillBreakdown[skill] = 0;
      }
      skillBreakdown[skill] += isCorrect ? questionPoints : 0;
    });

    const percentage = Math.round((earnedPoints / totalPoints) * 100);
    const timeSpent = Math.round((Date.now() - startTime) / 1000);

    return {
      assessmentId: assessment.id,
      score: earnedPoints,
      percentage,
      timeSpent,
      answers,
      skillBreakdown,
      passed: percentage >= (assessment.passingScore || 70)
    };
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const results = calculateResults();
      
      // Record assessment attempt in backend
      try {
        await assessmentService.recordAssessmentAttempt({
          assessment_id: assessment.id,
          answers: results.answers,
          score: results.percentage,
          time_spent: results.timeSpent,
          feedback: `Assessment completed with ${results.percentage}% score. ${results.passed ? 'Passed' : 'Did not pass'}.`
        });
      } catch (error) {
        console.warn('Failed to record assessment attempt:', error);
      }

      onComplete(results);
    } catch (error) {
      console.error('Failed to submit assessment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToNext = () => {
    if (currentQuestionIndex < assessment.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    switch (currentQuestion.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium">{currentQuestion.question}</p>
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id={`option-${index}`}
                    name={`question-${currentQuestionIndex}`}
                    value={option}
                    checked={answers[currentQuestionIndex] === option}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        );

      case 'fill-blank':
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium">{currentQuestion.question}</p>
            <Textarea
              value={answers[currentQuestionIndex] || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Enter your answer..."
              className="min-h-[100px]"
            />
          </div>
        );

      case 'essay':
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium">{currentQuestion.question}</p>
            <Textarea
              value={answers[currentQuestionIndex] || ''}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Write your response here..."
              className="min-h-[200px]"
            />
            <div className="text-xs text-muted-foreground">
              Word count: {(answers[currentQuestionIndex] || '').split(' ').filter((w: string) => w.length > 0).length}
            </div>
          </div>
        );

      default:
        return (
          <div className="space-y-4">
            <p className="text-lg font-medium">{currentQuestion.question}</p>
            <p className="text-sm text-muted-foreground">Question type not supported</p>
          </div>
        );
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {assessment.title}
              </CardTitle>
              <CardDescription>
                Question {currentQuestionIndex + 1} of {assessment.questions.length}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span className={timeRemaining < 300 ? 'text-red-600 font-bold' : ''}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={onClose}>
                Exit
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        </CardHeader>
      </Card>

      {/* Question Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant={answers[currentQuestionIndex] !== undefined ? 'default' : 'outline'}>
                {answers[currentQuestionIndex] !== undefined ? 'Answered' : 'Not Answered'}
              </Badge>
              {currentQuestion.skillArea && (
                <Badge variant="secondary">{currentQuestion.skillArea}</Badge>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFlag}
              className={flaggedQuestions.has(currentQuestionIndex) ? 'bg-yellow-50' : ''}
            >
              <Flag className={`h-4 w-4 ${flaggedQuestions.has(currentQuestionIndex) ? 'text-yellow-600' : ''}`} />
              {flaggedQuestions.has(currentQuestionIndex) ? 'Flagged' : 'Flag'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="min-h-[300px]">
          {renderQuestion()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goToPrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          {assessment.questions.map((_, index) => (
            <button
              key={index}
              onClick={() => goToQuestion(index)}
              className={`w-8 h-8 text-xs rounded border ${
                index === currentQuestionIndex
                  ? 'bg-blue-600 text-white border-blue-600'
                  : answers[index] !== undefined
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : flaggedQuestions.has(index)
                  ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                  : 'bg-gray-100 text-gray-600 border-gray-300'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {currentQuestionIndex === assessment.questions.length - 1 ? (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? (
              'Submitting...'
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Submit Assessment
              </>
            )}
          </Button>
        ) : (
          <Button onClick={goToNext}>
            Next
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Submission Warning */}
      {!allQuestionsAnswered && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">
                You have {assessment.questions.length - Object.keys(answers).length} unanswered questions. 
                You can still submit, but consider reviewing your answers.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}