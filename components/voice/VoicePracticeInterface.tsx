'use client';

/**
 * Voice Practice Interface
 * Main component for Story 5.4 Voice Recognition & Speech Analysis
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Mic, 
  MicOff, 
  Play, 
  Square, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle,
  Volume2,
  Settings,
  Award,
  Clock
} from 'lucide-react';

import { 
  VoiceExercise, 
  VoiceUIState, 
  PronunciationAnalysis, 
  VoiceFeatureFlags,
  VoiceFeedback,
  VOICE_EXERCISE_DEFAULTS,
  PRONUNCIATION_THRESHOLDS 
} from '@/lib/voice/types';
import { speechManager } from '@/lib/voice/speechRecognition';
import { pronunciationAnalyzer } from '@/lib/voice/pronunciationAnalysis';
import { voiceExerciseGenerator } from '@/lib/voice/exerciseGenerator';
import { log } from '@/lib/logger';

interface VoicePracticeInterfaceProps {
  userId: string;
  cefrLevel?: string;
  businessContext?: string;
  onProgressUpdate?: (progress: any) => void;
}

export default function VoicePracticeInterface({ 
  userId, 
  cefrLevel = 'B1', 
  businessContext,
  onProgressUpdate 
}: VoicePracticeInterfaceProps) {
  
  // State management
  const [uiState, setUiState] = useState<VoiceUIState>({
    isRecording: false,
    isAnalyzing: false,
    isPlaying: false,
    recordingTime: 0,
  });

  const [currentExercise, setCurrentExercise] = useState<VoiceExercise | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<PronunciationAnalysis | null>(null);
  const [featureFlags, setFeatureFlags] = useState<VoiceFeatureFlags | null>(null);
  const [feedback, setFeedback] = useState<VoiceFeedback[]>([]);
  const [sessionProgress, setSessionProgress] = useState({
    exercisesCompleted: 0,
    totalExercises: 0,
    averageScore: 0
  });

  // Refs
  const recordingTimerRef = useRef<NodeJS.Timeout>();
  const audioContextRef = useRef<AudioContext>();
  const recordedAudioRef = useRef<Blob>();

  /**
   * Initialize voice features
   */
  useEffect(() => {
    const initializeVoiceFeatures = async () => {
      try {
        // Check browser compatibility
        const flags = (speechManager.getSpeechEngine().constructor as any).getFeatureFlags();
        setFeatureFlags(flags);

        if (!flags.browserCompatible) {
          log.warn('Voice features not fully supported', 'VOICE', { flags });
          return;
        }

        // Configure speech recognition
        speechManager.getSpeechEngine().configure({
          language: 'en-US',
          continuous: false,
          interimResults: true
        });

        // Initialize audio recorder
        await speechManager.getAudioRecorder().initialize();

        // Generate initial exercise
        await loadNewExercise();

        log.info('Voice practice interface initialized', 'VOICE');

      } catch (error) {
        log.error('Failed to initialize voice features', 'VOICE', { error });
        setUiState(prev => ({ ...prev, error: 'Failed to initialize voice features' }));
      }
    };

    initializeVoiceFeatures();

    // Cleanup on unmount
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      speechManager.cleanup();
    };
  }, []);

  /**
   * Load a new voice exercise
   */
  const loadNewExercise = useCallback(async () => {
    try {
      const exercise = await voiceExerciseGenerator.generateExercise({
        type: 'pronunciation-drill',
        cefrLevel,
        businessContext,
        difficulty: Math.min(sessionProgress.exercisesCompleted + 3, 10)
      });

      setCurrentExercise(exercise);
      setCurrentAnalysis(null);
      setFeedback([]);

      log.userAction('New exercise loaded', userId, { exerciseId: exercise.id, type: exercise.type });

    } catch (error) {
      log.error('Failed to load exercise', 'VOICE', { error });
      setUiState(prev => ({ ...prev, error: 'Failed to load exercise' }));
    }
  }, [cefrLevel, businessContext, userId, sessionProgress.exercisesCompleted]);

  /**
   * Start voice recording
   */
  const startRecording = useCallback(async () => {
    if (!featureFlags?.browserCompatible) {
      alert('Voice recording is not supported in this browser');
      return;
    }

    try {
      setUiState(prev => ({ ...prev, isRecording: true, recordingTime: 0, error: undefined }));

      // Start audio recording
      await speechManager.getAudioRecorder().startRecording();

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setUiState(prev => ({ ...prev, recordingTime: prev.recordingTime + 1 }));
      }, 1000);

      // Auto-stop after max duration
      setTimeout(() => {
        if (speechManager.getAudioRecorder().getIsRecording()) {
          stopRecording();
        }
      }, VOICE_EXERCISE_DEFAULTS.RECORDING_MAX_DURATION * 1000);

      log.userAction('Recording started', userId, { exerciseId: currentExercise?.id });

    } catch (error) {
      log.error('Failed to start recording', 'VOICE', { error });
      setUiState(prev => ({ ...prev, isRecording: false, error: 'Failed to start recording' }));
    }
  }, [featureFlags, currentExercise, userId]);

  /**
   * Stop voice recording
   */
  const stopRecording = useCallback(async () => {
    try {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      setUiState(prev => ({ ...prev, isRecording: false, isAnalyzing: true }));

      // Stop recording and get audio blob
      const audioBlob = await speechManager.getAudioRecorder().stopRecording();
      recordedAudioRef.current = audioBlob;

      if (!currentExercise) {
        throw new Error('No active exercise');
      }

      // Analyze pronunciation
      const analysisRequest = {
        audioBlob,
        targetText: currentExercise.targetText,
        cefrLevel,
        exerciseType: currentExercise.type,
        businessContext,
        userId
      };

      const result = await pronunciationAnalyzer.analyzePronunciation(analysisRequest);

      setCurrentAnalysis(result.analysis);
      setFeedback(result.feedback);

      // Update progress
      const newProgress = {
        exercisesCompleted: sessionProgress.exercisesCompleted + 1,
        totalExercises: sessionProgress.totalExercises || 5,
        averageScore: ((sessionProgress.averageScore * sessionProgress.exercisesCompleted) + result.analysis.overallScore) / (sessionProgress.exercisesCompleted + 1)
      };
      setSessionProgress(newProgress);

      // Call progress callback
      if (onProgressUpdate) {
        onProgressUpdate({
          ...result.progress,
          sessionProgress: newProgress
        });
      }

      setUiState(prev => ({ ...prev, isAnalyzing: false }));

      log.userAction('Recording analyzed', userId, { 
        exerciseId: currentExercise.id, 
        score: result.analysis.overallScore 
      });

    } catch (error) {
      log.error('Failed to analyze recording', 'VOICE', { error });
      setUiState(prev => ({ 
        ...prev, 
        isRecording: false, 
        isAnalyzing: false, 
        error: 'Failed to analyze recording' 
      }));
    }
  }, [currentExercise, cefrLevel, businessContext, userId, sessionProgress, onProgressUpdate]);

  /**
   * Play recorded audio
   */
  const playRecordedAudio = useCallback(() => {
    if (!recordedAudioRef.current) return;

    try {
      setUiState(prev => ({ ...prev, isPlaying: true }));

      const audioUrl = URL.createObjectURL(recordedAudioRef.current);
      const audio = new Audio(audioUrl);

      audio.onended = () => {
        setUiState(prev => ({ ...prev, isPlaying: false }));
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setUiState(prev => ({ ...prev, isPlaying: false, error: 'Failed to play audio' }));
        URL.revokeObjectURL(audioUrl);
      };

      audio.play();

    } catch (error) {
      log.error('Failed to play audio', 'VOICE', { error });
      setUiState(prev => ({ ...prev, isPlaying: false, error: 'Failed to play audio' }));
    }
  }, []);

  /**
   * Reset current exercise
   */
  const resetExercise = useCallback(() => {
    setCurrentAnalysis(null);
    setFeedback([]);
    recordedAudioRef.current = undefined;
    setUiState(prev => ({ 
      ...prev, 
      recordingTime: 0, 
      error: undefined,
      isPlaying: false
    }));
  }, []);

  /**
   * Get score color based on value
   */
  const getScoreColor = (score: number): string => {
    if (score >= PRONUNCIATION_THRESHOLDS.EXCELLENT) return 'text-green-600';
    if (score >= PRONUNCIATION_THRESHOLDS.GOOD) return 'text-blue-600';
    if (score >= PRONUNCIATION_THRESHOLDS.FAIR) return 'text-yellow-600';
    return 'text-red-600';
  };

  /**
   * Get score badge variant
   */
  const getScoreBadgeVariant = (score: number) => {
    if (score >= PRONUNCIATION_THRESHOLDS.EXCELLENT) return 'default';
    if (score >= PRONUNCIATION_THRESHOLDS.GOOD) return 'secondary';
    return 'outline';
  };

  /**
   * Format recording time
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show compatibility error if needed
  if (featureFlags && !featureFlags.browserCompatible) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <span>Voice Features Unavailable</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Voice recording requires a compatible browser and HTTPS connection. 
              {featureFlags.httpsRequired && ' Please use HTTPS or localhost.'}
              {!featureFlags.speechRecognitionSupported && ' Speech recognition is not supported.'}
              {!featureFlags.audioRecordingSupported && ' Audio recording is not supported.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Session Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-blue-600" />
              <span>Voice Practice Session</span>
            </span>
            <Badge variant="outline">
              {cefrLevel} Level
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-gray-600">
              Progress: {sessionProgress.exercisesCompleted} / {sessionProgress.totalExercises || 5} exercises
            </div>
            <div className="text-sm text-gray-600">
              Avg. Score: {sessionProgress.averageScore.toFixed(0)}%
            </div>
          </div>
          <Progress 
            value={(sessionProgress.exercisesCompleted / (sessionProgress.totalExercises || 5)) * 100} 
            className="w-full" 
          />
        </CardContent>
      </Card>

      {/* Current Exercise */}
      {currentExercise && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{currentExercise.title}</span>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>{currentExercise.estimatedDuration}s</span>
                </Badge>
                <Badge variant="secondary">
                  {currentExercise.type.replace('-', ' ')}
                </Badge>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Instructions */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium mb-2">Instructions:</p>
              <p className="text-blue-700">{currentExercise.instructions}</p>
            </div>

            {/* Target Text */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 font-medium mb-2">Practice Text:</p>
              <p className="text-lg font-medium text-gray-900">"{currentExercise.targetText}"</p>
            </div>

            {/* Recording Controls */}
            <div className="flex items-center justify-center space-x-4 py-6">
              {!uiState.isRecording ? (
                <Button
                  onClick={startRecording}
                  disabled={uiState.isAnalyzing}
                  size="lg"
                  className="flex items-center space-x-2"
                >
                  <Mic className="h-5 w-5" />
                  <span>Start Recording</span>
                </Button>
              ) : (
                <Button
                  onClick={stopRecording}
                  variant="destructive"
                  size="lg"
                  className="flex items-center space-x-2"
                >
                  <Square className="h-5 w-5" />
                  <span>Stop Recording</span>
                </Button>
              )}

              {recordedAudioRef.current && (
                <Button
                  onClick={playRecordedAudio}
                  disabled={uiState.isPlaying}
                  variant="outline"
                  size="lg"
                  className="flex items-center space-x-2"
                >
                  <Volume2 className="h-5 w-5" />
                  <span>{uiState.isPlaying ? 'Playing...' : 'Play Back'}</span>
                </Button>
              )}

              <Button
                onClick={resetExercise}
                variant="ghost"
                size="lg"
                className="flex items-center space-x-2"
              >
                <RotateCcw className="h-5 w-5" />
                <span>Reset</span>
              </Button>
            </div>

            {/* Recording Status */}
            {uiState.isRecording && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-red-600 mb-2">
                  <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                  <span className="font-medium">Recording... {formatTime(uiState.recordingTime)}</span>
                </div>
                <Progress 
                  value={(uiState.recordingTime / VOICE_EXERCISE_DEFAULTS.RECORDING_MAX_DURATION) * 100} 
                  className="w-full max-w-xs mx-auto" 
                />
              </div>
            )}

            {uiState.isAnalyzing && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                  <span className="font-medium">Analyzing pronunciation...</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {currentAnalysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span>Pronunciation Analysis</span>
              <Badge 
                variant={getScoreBadgeVariant(currentAnalysis.overallScore)}
                className={getScoreColor(currentAnalysis.overallScore)}
              >
                {currentAnalysis.overallScore}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Overall Scores */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(currentAnalysis.analysis.accuracy)}`}>
                  {currentAnalysis.analysis.accuracy}%
                </div>
                <div className="text-sm text-gray-600">Accuracy</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(currentAnalysis.analysis.fluency)}`}>
                  {currentAnalysis.analysis.fluency}%
                </div>
                <div className="text-sm text-gray-600">Fluency</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(currentAnalysis.analysis.pronunciation)}`}>
                  {currentAnalysis.analysis.pronunciation}%
                </div>
                <div className="text-sm text-gray-600">Pronunciation</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${getScoreColor(currentAnalysis.analysis.completeness)}`}>
                  {currentAnalysis.analysis.completeness}%
                </div>
                <div className="text-sm text-gray-600">Completeness</div>
              </div>
            </div>

            {/* Feedback */}
            {feedback.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Feedback:</h4>
                {feedback.map((item, index) => (
                  <Alert key={index} className={
                    item.severity === 'success' ? 'border-green-200 bg-green-50' :
                    item.severity === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    'border-red-200 bg-red-50'
                  }>
                    <AlertDescription>
                      {item.message}
                      {item.suggestion && (
                        <div className="mt-1 text-sm font-medium">
                          Suggestion: {item.suggestion}
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {/* Next Exercise Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={loadNewExercise}
                className="flex items-center space-x-2"
              >
                <span>Next Exercise</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {uiState.error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-red-800">
            {uiState.error}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}