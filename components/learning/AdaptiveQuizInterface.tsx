'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Play, 
  Pause, 
  Square,
  Target,
  TrendingUp,
  TrendingDown,
  Activity,
  Brain,
  Zap,
  CheckCircle2,
  AlertCircle,
  BarChart3
} from 'lucide-react';
import {
  Assessment,
  AssessmentQuestion,
  AssessmentSession,
  AssessmentSessionManager,
  AdaptiveDifficultyEngine,
  AdaptiveAssessmentState,
  DifficultyAdjustment,
  AdaptiveDifficultyConfig
} from '@/lib/utils/assessment';
import { cn } from '@/lib/utils';

interface AdaptiveQuizInterfaceProps {
  assessment: Assessment;
  userHistory?: any[]; // AssessmentResults[] - simplified for demo
  onSessionComplete: (session: AssessmentSession, adaptiveState: AdaptiveAssessmentState) => void;
  onSessionSave?: (session: AssessmentSession, adaptiveState: AdaptiveAssessmentState) => void;
  adaptiveConfig?: Partial<AdaptiveDifficultyConfig>;
}

export default function AdaptiveQuizInterface({
  assessment,
  userHistory = [],
  onSessionComplete,
  onSessionSave,
  adaptiveConfig = {}
}: AdaptiveQuizInterfaceProps) {
  // Initialize adaptive state
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveAssessmentState>(() =>
    AdaptiveDifficultyEngine.createAdaptiveState(userHistory, adaptiveConfig)
  );
  
  const [session, setSession] = useState<AssessmentSession>(() =>
    AssessmentSessionManager.createSession(assessment.id, 'current_user', adaptiveState)
  );
  
  const [currentQuestion, setCurrentQuestion] = useState<AssessmentQuestion>(
    assessment.questions[session.currentQuestionIndex] || assessment.questions[0]
  );
  
  const [currentAnswer, setCurrentAnswer] = useState<any>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(assessment.duration * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [difficultyAdjustment, setDifficultyAdjustment] = useState<DifficultyAdjustment | null>(null);
  const [showDifficultyNotification, setShowDifficultyNotification] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect
  useEffect(() => {
    if (isTimerRunning && timeRemaining > 0) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleTimeUp();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [isTimerRunning, timeRemaining]);

  // Question initialization effect
  useEffect(() => {
    const question = assessment.questions[session.currentQuestionIndex];
    if (question) {
      setCurrentQuestion(question);
      
      // Load existing answer if available
      const existingAnswer = session.answers[question.id];
      setCurrentAnswer(existingAnswer || '');
    }
  }, [session.currentQuestionIndex, assessment.questions]);

  const handleTimeUp = () => {
    setIsTimerRunning(false);
    const completedSession = AssessmentSessionManager.completeSession(session);
    onSessionComplete(completedSession, adaptiveState);
  };

  const handleAnswerChange = (answer: any) => {
    setCurrentAnswer(answer);
  };

  const evaluateAnswer = (question: AssessmentQuestion, answer: any): boolean => {
    // Simplified evaluation - in real app, this would be more sophisticated
    if (question.type === 'multiple-choice') {
      return answer === question.correctAnswer;
    }
    // Add other question type evaluations as needed
    return true; // Default for demo
  };

  const handleNextQuestion = () => {
    const isCorrect = evaluateAnswer(currentQuestion, currentAnswer);
    
    // Update session with answer and correctness
    let updatedSession = AssessmentSessionManager.saveAnswer(
      session,
      currentQuestion.id,
      currentAnswer,
      isCorrect,
      currentQuestion.difficulty
    );

    // Check for adaptive difficulty adjustment
    const adjustment = AdaptiveDifficultyEngine.calculateNextDifficulty(
      updatedSession,
      adaptiveState,
      { ...AdaptiveDifficultyEngine['DEFAULT_CONFIG'], ...adaptiveConfig }
    );

    if (adjustment) {
      // Apply difficulty adjustment
      const newAdaptiveState = AdaptiveDifficultyEngine.applyDifficultyAdjustment(
        adaptiveState,
        adjustment
      );
      setAdaptiveState(newAdaptiveState);
      
      // Update session with adjustment
      updatedSession = AssessmentSessionManager.updateSessionWithDifficultyAdjustment(
        updatedSession,
        adjustment
      );
      
      // Show notification
      setDifficultyAdjustment(adjustment);
      setShowDifficultyNotification(true);
      setTimeout(() => setShowDifficultyNotification(false), 4000);
    }

    // Move to next question or complete assessment
    if (session.currentQuestionIndex < assessment.questions.length - 1) {
      const nextSession = AssessmentSessionManager.nextQuestion(updatedSession);
      setSession(nextSession);
    } else {
      // Assessment complete
      const completedSession = AssessmentSessionManager.completeSession(updatedSession);
      setSession(completedSession);
      onSessionComplete(completedSession, adaptiveState);
    }
  };

  const handlePreviousQuestion = () => {
    if (session.currentQuestionIndex > 0) {
      const updatedSession = { ...session };
      updatedSession.currentQuestionIndex--;
      setSession(updatedSession);
    }
  };

  const handlePauseResume = () => {
    if (session.isPaused) {
      const resumedSession = AssessmentSessionManager.resumeSession(session);
      setSession(resumedSession);
      setIsTimerRunning(true);
    } else {
      const pausedSession = AssessmentSessionManager.pauseSession(session);
      setSession(pausedSession);
      setIsTimerRunning(false);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: number): string => {
    if (difficulty <= 2) return 'text-green-600';
    if (difficulty <= 3) return 'text-yellow-600';
    if (difficulty <= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  const getDifficultyLabel = (difficulty: number): string => {
    if (difficulty <= 2) return 'Easy';
    if (difficulty <= 3) return 'Medium';
    if (difficulty <= 4) return 'Hard';
    return 'Expert';
  };

  const progress = AssessmentSessionManager.getSessionProgress(session, assessment.questions.length);
  const isLastQuestion = session.currentQuestionIndex === assessment.questions.length - 1;
  const canProceed = currentAnswer || session.answers[currentQuestion.id];
  const sessionSummary = AssessmentSessionManager.getAdaptiveSessionSummary(session);

  const renderQuestionContent = () => {
    switch (currentQuestion.type) {
      case 'multiple-choice':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => {
              const optionValue = String.fromCharCode(65 + index); // A, B, C, D
              return (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id={`option-${index}`}
                    name="multiple-choice"
                    value={optionValue}
                    checked={currentAnswer === optionValue}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                    <span className="font-medium mr-2">{optionValue}.</span>
                    {option}
                  </label>
                </div>
              );
            })}
          </div>
        );

      default:
        return <div>Question type not yet implemented in adaptive interface</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Adaptive Difficulty Notification */}
      {showDifficultyNotification && difficultyAdjustment && (
        <Alert className="border-blue-200 bg-blue-50">
          <Activity className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-blue-600" />
            <span>
              {difficultyAdjustment.toDifficulty > difficultyAdjustment.fromDifficulty ? (
                <>
                  <TrendingUp className="h-4 w-4 inline text-green-600" />
                  Difficulty increased to {getDifficultyLabel(difficultyAdjustment.toDifficulty)}
                </>
              ) : (
                <>
                  <TrendingDown className="h-4 w-4 inline text-orange-600" />
                  Difficulty adjusted to {getDifficultyLabel(difficultyAdjustment.toDifficulty)}
                </>
              )}
              - {difficultyAdjustment.reason}
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Header with adaptive metrics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                {assessment.title}
                <Badge variant="outline" className="flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Adaptive
                </Badge>
              </CardTitle>
              <CardDescription>
                Question {progress.current} of {progress.total} • Current Difficulty: {" "}
                <span className={getDifficultyColor(currentQuestion.difficulty)}>
                  {getDifficultyLabel(currentQuestion.difficulty)} ({currentQuestion.difficulty}/5)
                </span>
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span className={timeRemaining < 300 ? 'text-red-600 font-bold' : ''}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button onClick={handlePauseResume} variant="outline" size="sm">
                  {session.isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  {session.isPaused ? 'Resume' : 'Pause'}
                </Button>
              </div>
            </div>
          </div>
          
          <Progress value={progress.percentage} className="w-full" />
        </CardHeader>
      </Card>

      {/* Adaptive Performance Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <div>
                <div className="text-lg font-bold">{sessionSummary.performance.accuracy}%</div>
                <div className="text-xs text-muted-foreground">Accuracy</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <div>
                <div className="text-lg font-bold">{sessionSummary.difficulty.current}</div>
                <div className="text-xs text-muted-foreground">Current Level</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-purple-600" />
              <div>
                <div className="text-lg font-bold">{sessionSummary.difficulty.adjustments}</div>
                <div className="text-xs text-muted-foreground">Adjustments</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-600" />
              <div>
                <div className="text-lg font-bold">{Math.round(sessionSummary.difficulty.stability * 100)}%</div>
                <div className="text-xs text-muted-foreground">Stability</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low time warning */}
      {timeRemaining < 300 && timeRemaining > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Warning: Less than 5 minutes remaining!
          </AlertDescription>
        </Alert>
      )}

      {/* Main question card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge 
                variant="outline" 
                className={cn("border-2", getDifficultyColor(currentQuestion.difficulty))}
              >
                {currentQuestion.cefrLevel}
              </Badge>
              <Badge variant="secondary">{currentQuestion.type.replace('-', ' ')}</Badge>
              <Badge variant="outline">{currentQuestion.skillArea}</Badge>
              <Badge 
                variant="outline"
                className={getDifficultyColor(currentQuestion.difficulty)}
              >
                {getDifficultyLabel(currentQuestion.difficulty)}
              </Badge>
            </div>
            
            {currentQuestion.timeLimit && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                {Math.round(currentQuestion.timeLimit / 60)} min suggested
              </div>
            )}
          </div>
          
          <CardTitle className="text-xl">{currentQuestion.question}</CardTitle>
          
          {currentQuestion.context && (
            <CardDescription className="text-base mt-2">
              {currentQuestion.context}
            </CardDescription>
          )}
          
          {currentQuestion.businessScenario && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Business Scenario:</p>
              <p className="text-sm text-blue-800">{currentQuestion.businessScenario}</p>
            </div>
          )}
        </CardHeader>
        
        <CardContent>
          {renderQuestionContent()}
        </CardContent>
      </Card>

      {/* Real-time recommendations */}
      {sessionSummary.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Brain className="h-4 w-4 text-purple-600" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessionSummary.recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <Zap className="h-3 w-3 text-yellow-500 mt-1 flex-shrink-0" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button
              onClick={handlePreviousQuestion}
              disabled={session.currentQuestionIndex === 0}
              variant="outline"
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>
            
            <div className="flex items-center gap-2">
              <Badge variant={canProceed ? "default" : "secondary"}>
                {canProceed ? "Ready to continue" : "Answer required"}
              </Badge>
            </div>
            
            <Button
              onClick={handleNextQuestion}
              disabled={!canProceed}
              className={isLastQuestion ? "bg-green-600 hover:bg-green-700" : ""}
            >
              {isLastQuestion ? "Complete Assessment" : "Next"}
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}