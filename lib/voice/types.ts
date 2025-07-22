/**
 * Voice Recognition & Speech Analysis Types
 * Comprehensive type definitions for Story 5.4 Voice Features
 */

export interface VoiceRecording {
  id: string;
  audioBlob: Blob;
  transcript: string;
  duration: number;
  timestamp: Date;
  exerciseId?: string;
  userId: string;
}

export interface PronunciationAnalysis {
  id: string;
  recordingId: string;
  transcript: string;
  targetText: string;
  overallScore: number; // 0-100
  cefrLevel: string;
  analysis: {
    accuracy: number;
    fluency: number;
    pronunciation: number;
    completeness: number;
  };
  feedback: string[];
  improvements: string[];
  wordAnalysis: WordPronunciationAnalysis[];
  timestamp: Date;
}

export interface WordPronunciationAnalysis {
  word: string;
  score: number; // 0-100
  phonetic: string;
  feedback: string;
  severity: 'good' | 'minor' | 'major';
}

export interface VoiceExercise {
  id: string;
  title: string;
  type: VoiceExerciseType;
  cefrLevel: string;
  targetText: string;
  instructions: string;
  difficulty: number; // 1-10
  businessContext?: string;
  estimatedDuration: number; // seconds
  createdAt: Date;
}

export type VoiceExerciseType = 
  | 'pronunciation-drill'
  | 'dialogue-practice'
  | 'business-presentation'
  | 'phone-conversation'
  | 'meeting-simulation'
  | 'free-speech'
  | 'word-repetition'
  | 'sentence-reading';

export interface SpeechRecognitionSettings {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export interface VoiceSession {
  id: string;
  userId: string;
  exerciseId: string;
  recordings: VoiceRecording[];
  analyses: PronunciationAnalysis[];
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'paused';
  overallProgress: number; // 0-100
}

export interface VoiceProgress {
  userId: string;
  totalSessions: number;
  totalRecordings: number;
  averagePronunciationScore: number;
  averageAccuracy: number;
  averageFluency: number;
  weakAreas: string[];
  strongAreas: string[];
  cefrLevelProgress: Record<string, number>;
  lastUpdated: Date;
}

export interface VoiceFeedback {
  type: 'pronunciation' | 'fluency' | 'accuracy' | 'completeness';
  severity: 'success' | 'warning' | 'error';
  message: string;
  suggestion?: string;
  timestamp: Date;
}

export interface AudioRecorderConfig {
  sampleRate: number;
  bitRate: number;
  maxDuration: number; // seconds
  format: 'wav' | 'mp3' | 'webm';
}

export interface SpeechAnalysisRequest {
  audioBlob: Blob;
  targetText: string;
  cefrLevel: string;
  exerciseType: VoiceExerciseType;
  businessContext?: string;
  userId: string;
}

export interface SpeechAnalysisResponse {
  transcript: string;
  analysis: PronunciationAnalysis;
  feedback: VoiceFeedback[];
  nextExercise?: VoiceExercise;
  progress: Partial<VoiceProgress>;
}

export interface VoiceUIState {
  isRecording: boolean;
  isAnalyzing: boolean;
  isPlaying: boolean;
  currentExercise?: VoiceExercise;
  currentRecording?: VoiceRecording;
  currentAnalysis?: PronunciationAnalysis;
  error?: string;
  recordingTime: number;
}

export interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: any;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onaudioend: ((this: any, ev: Event) => any) | null;
  onaudiostart: ((this: any, ev: Event) => any) | null;
  onend: ((this: any, ev: Event) => any) | null;
  onerror: ((this: any, ev: any) => any) | null;
  onnomatch: ((this: any, ev: any) => any) | null;
  onresult: ((this: any, ev: any) => any) | null;
  onsoundend: ((this: any, ev: Event) => any) | null;
  onsoundstart: ((this: any, ev: Event) => any) | null;
  onspeechend: ((this: any, ev: Event) => any) | null;
  onspeechstart: ((this: any, ev: Event) => any) | null;
  onstart: ((this: any, ev: Event) => any) | null;
  abort(): void;
  start(): void;
  stop(): void;
}

// Browser compatibility types
declare global {
  interface Window {
    SpeechRecognition: {
      new(): BrowserSpeechRecognition;
    };
    webkitSpeechRecognition: {
      new(): BrowserSpeechRecognition;
    };
  }
}

export interface VoiceFeatureFlags {
  speechRecognitionSupported: boolean;
  audioRecordingSupported: boolean;
  browserCompatible: boolean;
  httpsRequired: boolean;
}

export const VOICE_EXERCISE_DEFAULTS = {
  RECORDING_MAX_DURATION: 120, // seconds
  ANALYSIS_TIMEOUT: 30000, // ms
  MIN_RECORDING_DURATION: 1, // seconds
  SUPPORTED_LANGUAGES: ['en-US', 'en-GB', 'en-AU'],
  CEFR_LEVELS: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
} as const;

export const PRONUNCIATION_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 75,
  FAIR: 60,
  NEEDS_IMPROVEMENT: 40
} as const;