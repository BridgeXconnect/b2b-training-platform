'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Play, 
  Pause, 
  Square,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  ArrowUp,
  ArrowDown,
  Save,
  CheckCircle2,
  AlertCircle,
  Target
} from 'lucide-react';
import {
  Assessment,
  AssessmentQuestion,
  AssessmentSession,
  AssessmentSessionManager,
  QuestionType
} from '@/lib/utils/assessment';
import { cn } from '@/lib/utils';

interface QuizInterfaceProps {
  assessment: Assessment;
  onSessionComplete: (session: AssessmentSession) => void;
  onSessionSave?: (session: AssessmentSession) => void;
  initialSession?: AssessmentSession;
}

export default function QuizInterface({
  assessment,
  onSessionComplete,
  onSessionSave,
  initialSession
}: QuizInterfaceProps) {
  const [session, setSession] = useState<AssessmentSession>(
    initialSession || AssessmentSessionManager.createSession(assessment.id, 'current_user')
  );
  const [currentQuestion, setCurrentQuestion] = useState<AssessmentQuestion>(
    assessment.questions[session.currentQuestionIndex] || assessment.questions[0]
  );
  const [currentAnswer, setCurrentAnswer] = useState<any>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(assessment.duration * 60); // Convert to seconds
  const [isTimerRunning, setIsTimerRunning] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  
  // Audio/recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  // Ordering question state
  const [orderingItems, setOrderingItems] = useState<string[]>([]);
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize question state
  useEffect(() => {
    const question = assessment.questions[session.currentQuestionIndex];
    if (question) {
      setCurrentQuestion(question);
      
      // Load existing answer if available
      const existingAnswer = session.answers[question.id];
      if (existingAnswer) {
        setCurrentAnswer(existingAnswer);
        if (question.type === 'ordering' && Array.isArray(existingAnswer)) {
          setOrderingItems(existingAnswer);
        }
      } else {
        // Initialize based on question type
        if (question.type === 'ordering' && question.options) {
          setOrderingItems([...question.options].sort(() => Math.random() - 0.5));
        } else {
          setCurrentAnswer('');
        }
      }
    }
  }, [session.currentQuestionIndex, assessment.questions]);

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

  // Auto-save effect
  useEffect(() => {
    if (autoSaveEnabled && currentAnswer) {
      autoSaveRef.current = setTimeout(() => {
        handleAutoSave();
      }, 3000); // Auto-save after 3 seconds of inactivity
    }

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [currentAnswer, autoSaveEnabled]);

  // Recording timer effect
  useEffect(() => {
    let recordingTimer: NodeJS.Timeout;
    if (isRecording) {
      recordingTimer = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }

    return () => {
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
    };
  }, [isRecording]);

  const handleTimeUp = () => {
    setIsTimerRunning(false);
    const completedSession = AssessmentSessionManager.completeSession(session);
    onSessionComplete(completedSession);
  };

  const handleAutoSave = () => {
    if (currentAnswer && currentQuestion) {
      const updatedSession = AssessmentSessionManager.saveAnswer(
        session,
        currentQuestion.id,
        currentAnswer
      );
      setSession(updatedSession);
      if (onSessionSave) {
        onSessionSave(updatedSession);
      }
    }
  };

  const handleAnswerChange = (answer: any) => {
    setCurrentAnswer(answer);
  };

  const handleNextQuestion = () => {
    // Save current answer
    if (currentAnswer || currentQuestion.type === 'ordering') {
      const answerToSave = currentQuestion.type === 'ordering' ? orderingItems : currentAnswer;
      const updatedSession = AssessmentSessionManager.saveAnswer(
        session,
        currentQuestion.id,
        answerToSave
      );
      
      // Move to next question
      if (session.currentQuestionIndex < assessment.questions.length - 1) {
        const nextSession = AssessmentSessionManager.nextQuestion(updatedSession);
        setSession(nextSession);
      } else {
        // Assessment complete
        const completedSession = AssessmentSessionManager.completeSession(updatedSession);
        setSession(completedSession);
        onSessionComplete(completedSession);
      }
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

  const handleQuitAssessment = () => {
    if (confirm('Are you sure you want to quit? Your progress will be saved.')) {
      const completedSession = AssessmentSessionManager.completeSession(session);
      onSessionComplete(completedSession);
    }
  };

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        setAudioBlob(audioBlob);
        setCurrentAnswer(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playRecording = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        setIsPlayingAudio(true);
        
        audioRef.current.onended = () => {
          setIsPlayingAudio(false);
          URL.revokeObjectURL(audioUrl);
        };
      }
    }
  };

  // Drag and drop for ordering questions
  const handleDragStart = (item: string) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedItem) {
      const newItems = [...orderingItems];
      const draggedIndex = newItems.indexOf(draggedItem);
      newItems.splice(draggedIndex, 1);
      newItems.splice(targetIndex, 0, draggedItem);
      setOrderingItems(newItems);
      setDraggedItem(null);
    }
  };

  const moveItemUp = (index: number) => {
    if (index > 0) {
      const newItems = [...orderingItems];
      [newItems[index], newItems[index - 1]] = [newItems[index - 1], newItems[index]];
      setOrderingItems(newItems);
    }
  };

  const moveItemDown = (index: number) => {
    if (index < orderingItems.length - 1) {
      const newItems = [...orderingItems];
      [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
      setOrderingItems(newItems);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = AssessmentSessionManager.getSessionProgress(session, assessment.questions.length);
  const isLastQuestion = session.currentQuestionIndex === assessment.questions.length - 1;
  const canProceed = currentAnswer || 
    (currentQuestion.type === 'ordering' && orderingItems.length > 0) ||
    session.answers[currentQuestion.id];

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

      case 'fill-blank':
        return (
          <div className="space-y-4">
            <Input
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Enter your answer..."
              className="text-lg"
            />
          </div>
        );

      case 'essay':
        return (
          <div className="space-y-4">
            <Textarea
              value={currentAnswer}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Write your response here..."
              className="min-h-[200px] text-base"
            />
            <div className="text-sm text-muted-foreground">
              Word count: {currentAnswer ? currentAnswer.split(/\s+/).filter(Boolean).length : 0}
            </div>
          </div>
        );

      case 'listening':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="text-center">
                <Volume2 className="h-12 w-12 mx-auto text-blue-600 mb-4" />
                <p className="text-lg font-medium mb-2">Audio Question</p>
                <p className="text-muted-foreground mb-4">Click to play the audio clip</p>
                <Button onClick={() => alert('Audio playback not implemented in demo')} className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Play Audio
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              {currentQuestion.options?.map((option, index) => {
                const optionValue = String.fromCharCode(65 + index);
                return (
                  <div key={index} className="flex items-center space-x-3">
                    <input
                      type="radio"
                      id={`option-${index}`}
                      name="listening-choice"
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
          </div>
        );

      case 'speaking':
        return (
          <div className="space-y-6">
            <div className="text-center p-6 border rounded-lg">
              <Mic className="h-12 w-12 mx-auto text-red-600 mb-4" />
              <p className="text-lg font-medium mb-2">Speaking Response</p>
              <p className="text-muted-foreground mb-4">Record your response (60-90 seconds)</p>
              
              <div className="flex items-center justify-center gap-4">
                {!isRecording ? (
                  <Button onClick={startRecording} className="flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    Start Recording
                  </Button>
                ) : (
                  <Button onClick={stopRecording} variant="destructive" className="flex items-center gap-2">
                    <Square className="h-4 w-4" />
                    Stop Recording ({formatTime(recordingTime)})
                  </Button>
                )}
                
                {audioBlob && (
                  <Button onClick={playRecording} variant="outline" className="flex items-center gap-2">
                    {isPlayingAudio ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    {isPlayingAudio ? 'Playing...' : 'Play Recording'}
                  </Button>
                )}
              </div>
              
              {audioBlob && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600 inline mr-2" />
                  Recording completed successfully!
                </div>
              )}
            </div>
            <audio ref={audioRef} style={{ display: 'none' }} />
          </div>
        );

      case 'ordering':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Drag and drop the items below to put them in the correct order, or use the arrow buttons.
            </p>
            
            <div className="space-y-2">
              {orderingItems.map((item, index) => (
                <div
                  key={item}
                  draggable
                  onDragStart={() => handleDragStart(item)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, index)}
                  className={cn(
                    "flex items-center justify-between p-4 border rounded-lg cursor-move",
                    "hover:bg-gray-50 transition-colors",
                    draggedItem === item && "opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{index + 1}</Badge>
                    <span>{item}</span>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveItemUp(index)}
                      disabled={index === 0}
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveItemDown(index)}
                      disabled={index === orderingItems.length - 1}
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return <div>Unsupported question type: {currentQuestion.type}</div>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header with timer and progress */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                {assessment.title}
              </CardTitle>
              <CardDescription>
                Question {progress.current} of {progress.total}
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
                
                <Button onClick={handleQuitAssessment} variant="outline" size="sm">
                  <Square className="h-4 w-4 mr-2" />
                  Quit
                </Button>
              </div>
            </div>
          </div>
          
          <Progress value={progress.percentage} className="w-full" />
        </CardHeader>
      </Card>

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
              <Badge variant="outline">{currentQuestion.cefrLevel}</Badge>
              <Badge variant="secondary">{currentQuestion.type.replace('-', ' ')}</Badge>
              <Badge variant="outline">{currentQuestion.skillArea}</Badge>
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
              {autoSaveEnabled && currentAnswer && (
                <div className="flex items-center gap-1 text-sm text-green-600">
                  <Save className="h-4 w-4" />
                  Auto-saved
                </div>
              )}
              
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