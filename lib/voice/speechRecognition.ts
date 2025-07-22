/**
 * Speech Recognition Engine
 * Web Speech API integration for Story 5.4 Voice Features
 */

import { 
  BrowserSpeechRecognition,
  SpeechRecognitionSettings,
  VoiceFeatureFlags,
  VOICE_EXERCISE_DEFAULTS 
} from './types';
import { log } from '../logger';

export class SpeechRecognitionEngine {
  private recognition: BrowserSpeechRecognition | null = null;
  private isInitialized: boolean = false;
  private currentTranscript: string = '';
  private interimTranscript: string = '';
  
  constructor() {
    this.initializeSpeechRecognition();
  }

  /**
   * Initialize Web Speech API
   */
  private initializeSpeechRecognition(): void {
    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.setupEventHandlers();
        this.isInitialized = true;
        log.info('Speech recognition initialized', 'VOICE');
      } else {
        log.warn('Speech recognition not supported', 'VOICE');
      }
    } catch (error) {
      log.error('Failed to initialize speech recognition', 'VOICE', { error });
    }
  }

  /**
   * Set up event handlers for speech recognition
   */
  private setupEventHandlers(): void {
    if (!this.recognition) return;

    this.recognition.onstart = () => {
      log.info('Speech recognition started', 'VOICE');
    };

    this.recognition.onend = () => {
      log.info('Speech recognition ended', 'VOICE');
    };

    this.recognition.onerror = (event: any) => {
      log.error('Speech recognition error', 'VOICE', { error: event.error });
    };

    this.recognition.onresult = (event: any) => {
      this.handleResults(event);
    };

    this.recognition.onsoundstart = () => {
      log.debug('Sound detected', 'VOICE');
    };

    this.recognition.onspeechstart = () => {
      log.debug('Speech detected', 'VOICE');
    };
  }

  /**
   * Handle speech recognition results
   */
  private handleResults(event: any): void {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      
      if (event.results[i].isFinal) {
        finalTranscript += transcript;
      } else {
        interimTranscript += transcript;
      }
    }

    this.currentTranscript = finalTranscript;
    this.interimTranscript = interimTranscript;
  }

  /**
   * Check if speech recognition is supported
   */
  public static isSupported(): boolean {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  /**
   * Check browser compatibility and requirements
   */
  public static getFeatureFlags(): VoiceFeatureFlags {
    const speechSupported = SpeechRecognitionEngine.isSupported();
    const audioSupported = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const isHttps = location.protocol === 'https:' || location.hostname === 'localhost';
    const browserCompatible = speechSupported && audioSupported;

    return {
      speechRecognitionSupported: speechSupported,
      audioRecordingSupported: audioSupported,
      browserCompatible,
      httpsRequired: !isHttps
    };
  }

  /**
   * Configure speech recognition settings
   */
  public configure(settings: Partial<SpeechRecognitionSettings>): void {
    if (!this.recognition) {
      throw new Error('Speech recognition not initialized');
    }

    const defaultSettings: SpeechRecognitionSettings = {
      language: 'en-US',
      continuous: false,
      interimResults: true,
      maxAlternatives: 1
    };

    const config = { ...defaultSettings, ...settings };

    this.recognition.lang = config.language;
    this.recognition.continuous = config.continuous;
    this.recognition.interimResults = config.interimResults;
    this.recognition.maxAlternatives = config.maxAlternatives;

    log.info('Speech recognition configured', 'VOICE', { config });
  }

  /**
   * Start speech recognition
   */
  public start(): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.recognition) {
        reject(new Error('Speech recognition not supported'));
        return;
      }

      this.currentTranscript = '';
      this.interimTranscript = '';

      const handleEnd = () => {
        this.recognition!.removeEventListener('end', handleEnd);
        this.recognition!.removeEventListener('error', handleError);
        resolve(this.currentTranscript);
      };

      const handleError = (event: any) => {
        this.recognition!.removeEventListener('end', handleEnd);
        this.recognition!.removeEventListener('error', handleError);
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.addEventListener('end', handleEnd);
      this.recognition.addEventListener('error', handleError);

      try {
        this.recognition.start();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop speech recognition
   */
  public stop(): void {
    if (this.recognition) {
      this.recognition.stop();
    }
  }

  /**
   * Abort speech recognition
   */
  public abort(): void {
    if (this.recognition) {
      this.recognition.abort();
    }
  }

  /**
   * Get current transcript (including interim results)
   */
  public getCurrentTranscript(): { final: string; interim: string } {
    return {
      final: this.currentTranscript,
      interim: this.interimTranscript
    };
  }

  /**
   * Check if recognition is initialized
   */
  public isReady(): boolean {
    return this.isInitialized && this.recognition !== null;
  }
}

/**
 * Audio Recording Manager
 */
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioStream: MediaStream | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording: boolean = false;

  /**
   * Initialize audio recording
   */
  public async initialize(): Promise<void> {
    try {
      this.audioStream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      this.mediaRecorder = new MediaRecorder(this.audioStream, {
        mimeType: 'audio/webm;codecs=opus'
      });

      this.setupRecorderEvents();
      log.info('Audio recorder initialized', 'VOICE');
    } catch (error) {
      log.error('Failed to initialize audio recorder', 'VOICE', { error });
      throw error;
    }
  }

  /**
   * Set up media recorder event handlers
   */
  private setupRecorderEvents(): void {
    if (!this.mediaRecorder) return;

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.recordedChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstart = () => {
      log.info('Audio recording started', 'VOICE');
      this.isRecording = true;
    };

    this.mediaRecorder.onstop = () => {
      log.info('Audio recording stopped', 'VOICE');
      this.isRecording = false;
    };
  }

  /**
   * Start recording
   */
  public startRecording(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder) {
        reject(new Error('Audio recorder not initialized'));
        return;
      }

      if (this.isRecording) {
        reject(new Error('Recording already in progress'));
        return;
      }

      this.recordedChunks = [];
      
      try {
        this.mediaRecorder.start(100); // Record in 100ms chunks
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop recording and return audio blob
   */
  public stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('No active recording'));
        return;
      }

      const handleStop = () => {
        const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        this.recordedChunks = [];
        resolve(audioBlob);
      };

      this.mediaRecorder.addEventListener('stop', handleStop, { once: true });
      this.mediaRecorder.stop();
    });
  }

  /**
   * Clean up resources
   */
  public cleanup(): void {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
    
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
    
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.isRecording = false;
  }

  /**
   * Check if currently recording
   */
  public getIsRecording(): boolean {
    return this.isRecording;
  }
}

/**
 * Singleton speech recognition manager
 */
class SpeechManager {
  private speechEngine: SpeechRecognitionEngine | null = null;
  private audioRecorder: AudioRecorder | null = null;

  public getSpeechEngine(): SpeechRecognitionEngine {
    if (!this.speechEngine) {
      this.speechEngine = new SpeechRecognitionEngine();
    }
    return this.speechEngine;
  }

  public getAudioRecorder(): AudioRecorder {
    if (!this.audioRecorder) {
      this.audioRecorder = new AudioRecorder();
    }
    return this.audioRecorder;
  }

  public cleanup(): void {
    if (this.speechEngine) {
      this.speechEngine.stop();
    }
    if (this.audioRecorder) {
      this.audioRecorder.cleanup();
    }
    this.speechEngine = null;
    this.audioRecorder = null;
  }
}

export const speechManager = new SpeechManager();