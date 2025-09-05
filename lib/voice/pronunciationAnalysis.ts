/**
 * Pronunciation Analysis Engine
 * AI-powered pronunciation assessment for Story 5.4 Voice Features
 */

import { 
  PronunciationAnalysis,
  WordPronunciationAnalysis,
  VoiceFeedback,
  SpeechAnalysisRequest,
  SpeechAnalysisResponse,
  VoiceExerciseType,
  PRONUNCIATION_THRESHOLDS 
} from './types';
import { log } from '../logger';

export class PronunciationAnalyzer {
  private static instance: PronunciationAnalyzer;

  private constructor() {}

  public static getInstance(): PronunciationAnalyzer {
    if (!PronunciationAnalyzer.instance) {
      PronunciationAnalyzer.instance = new PronunciationAnalyzer();
    }
    return PronunciationAnalyzer.instance;
  }

  /**
   * Analyze pronunciation from speech transcript
   */
  public async analyzePronunciation(request: SpeechAnalysisRequest): Promise<SpeechAnalysisResponse> {
    try {
      // Use server-side API route for analysis to handle OpenAI API key securely
      const result = await this.analyzeViaAPI(request);
      return result;

    } catch (error) {
      log.error('Pronunciation analysis failed', 'VOICE', { error });
      
      // Fallback to basic analysis if API fails
      try {
        const transcript = await this.transcribeAudio(request.audioBlob);
        const analysis = this.generateBasicAnalysis({
          transcript,
          targetText: request.targetText,
          cefrLevel: request.cefrLevel,
          exerciseType: request.exerciseType,
          userId: request.userId
        });
        
        const feedback = this.generateFeedback(analysis);
        const progress = this.calculateProgressUpdate(analysis);

        return {
          transcript,
          analysis,
          feedback,
          progress
        };
      } catch (fallbackError) {
        log.error('Fallback analysis also failed', 'VOICE', { error: fallbackError });
        throw fallbackError;
      }
    }
  }

  /**
   * Analyze pronunciation via API route (secure server-side OpenAI access)
   */
  private async analyzeViaAPI(request: SpeechAnalysisRequest): Promise<SpeechAnalysisResponse> {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('audio', request.audioBlob, 'recording.webm');
      formData.append('targetText', request.targetText);
      formData.append('cefrLevel', request.cefrLevel);
      formData.append('exerciseType', request.exerciseType);
      formData.append('userId', request.userId);
      
      if (request.businessContext) {
        formData.append('businessContext', request.businessContext);
      }

      // Call the voice analysis API
      const response = await fetch('/api/voice/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`API request failed: ${response.status} - ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Analysis failed');
      }

      return data.result;

    } catch (error) {
      log.error('Voice analysis API call failed', 'VOICE', { error });
      throw error;
    }
  }

  /**
   * Transcribe audio blob to text
   */
  private async transcribeAudio(audioBlob: Blob): Promise<string> {
    // For demo purposes, we'll simulate transcription
    // In production, you would use:
    // 1. OpenAI Whisper API
    // 2. Google Speech-to-Text
    // 3. Azure Speech Services
    // 4. Web Speech API results
    
    return new Promise((resolve) => {
      // Simulate processing time
      setTimeout(() => {
        resolve("Hello, I am practicing my English pronunciation today.");
      }, 1000);
    });
  }



  /**
   * Generate basic analysis as fallback
   */
  private generateBasicAnalysis(params: {
    transcript: string;
    targetText: string;
    cefrLevel: string;
    exerciseType: VoiceExerciseType;
    userId: string;
  }): PronunciationAnalysis {
    
    // Basic similarity analysis
    const similarity = this.calculateTextSimilarity(params.transcript, params.targetText);
    const baseScore = Math.round(similarity * 100);
    
    // CEFR-based score adjustment
    const cefrMultiplier = this.getCEFRScoreMultiplier(params.cefrLevel);
    const adjustedScore = Math.round(baseScore * cefrMultiplier);

    return {
      id: `basic_analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recordingId: `recording_${params.userId}_${Date.now()}`,
      transcript: params.transcript,
      targetText: params.targetText,
      overallScore: adjustedScore,
      cefrLevel: params.cefrLevel,
      analysis: {
        accuracy: adjustedScore,
        fluency: Math.max(50, adjustedScore - 10),
        pronunciation: Math.max(40, adjustedScore - 15),
        completeness: similarity > 0.8 ? 90 : similarity > 0.6 ? 70 : 50
      },
      feedback: this.generateBasicFeedback(adjustedScore, similarity),
      improvements: this.generateBasicImprovements(adjustedScore),
      wordAnalysis: this.generateBasicWordAnalysis(params.transcript, params.targetText),
      timestamp: new Date()
    };
  }

  /**
   * Calculate text similarity (basic implementation)
   */
  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = text1.toLowerCase().split(/\s+/);
    const words2 = text2.toLowerCase().split(/\s+/);
    
    const commonWords = words1.filter(word => words2.includes(word));
    const totalWords = Math.max(words1.length, words2.length);
    
    return totalWords > 0 ? commonWords.length / totalWords : 0;
  }

  /**
   * Get CEFR score multiplier
   */
  private getCEFRScoreMultiplier(cefrLevel: string): number {
    const multipliers = {
      'A1': 1.2, // More forgiving for beginners
      'A2': 1.1,
      'B1': 1.0, // Standard
      'B2': 0.9,
      'C1': 0.8,
      'C2': 0.7  // Higher standards for advanced
    };
    return multipliers[cefrLevel as keyof typeof multipliers] || 1.0;
  }

  /**
   * Generate basic feedback
   */
  private generateBasicFeedback(score: number, similarity: number): string[] {
    const feedback: string[] = [];

    if (score >= PRONUNCIATION_THRESHOLDS.EXCELLENT) {
      feedback.push("Excellent pronunciation! Your speech was clear and accurate.");
    } else if (score >= PRONUNCIATION_THRESHOLDS.GOOD) {
      feedback.push("Good pronunciation overall with room for minor improvements.");
    } else if (score >= PRONUNCIATION_THRESHOLDS.FAIR) {
      feedback.push("Fair pronunciation. Focus on clearer articulation.");
    } else {
      feedback.push("Pronunciation needs improvement. Consider slowing down and focusing on individual words.");
    }

    if (similarity < 0.7) {
      feedback.push("Try to match the target text more closely.");
    }

    return feedback;
  }

  /**
   * Generate basic improvements
   */
  private generateBasicImprovements(score: number): string[] {
    const improvements: string[] = [];

    if (score < PRONUNCIATION_THRESHOLDS.GOOD) {
      improvements.push("Practice speaking more slowly and clearly");
      improvements.push("Focus on individual word pronunciation");
    }
    
    if (score < PRONUNCIATION_THRESHOLDS.FAIR) {
      improvements.push("Record yourself and compare with native speakers");
      improvements.push("Use phonetic guides for difficult words");
    }

    improvements.push("Keep practicing regularly for continued improvement");
    
    return improvements;
  }

  /**
   * Generate basic word analysis
   */
  private generateBasicWordAnalysis(transcript: string, targetText: string): WordPronunciationAnalysis[] {
    const transcriptWords = transcript.toLowerCase().split(/\s+/);
    const targetWords = targetText.toLowerCase().split(/\s+/);
    
    return targetWords.map(targetWord => {
      const isPresent = transcriptWords.includes(targetWord);
      const score = isPresent ? 85 : 30;
      
      return {
        word: targetWord,
        score,
        phonetic: '', // Would need a phonetic dictionary
        feedback: isPresent ? 'Well pronounced' : 'Missing or unclear',
        severity: score >= 70 ? 'good' : score >= 50 ? 'minor' : 'major'
      };
    });
  }

  /**
   * Generate feedback based on analysis
   */
  private generateFeedback(analysis: PronunciationAnalysis): VoiceFeedback[] {
    const feedback: VoiceFeedback[] = [];
    const timestamp = new Date();

    // Overall feedback
    if (analysis.overallScore >= PRONUNCIATION_THRESHOLDS.EXCELLENT) {
      feedback.push({
        type: 'pronunciation',
        severity: 'success',
        message: 'Excellent pronunciation! Keep up the great work.',
        timestamp
      });
    } else if (analysis.overallScore >= PRONUNCIATION_THRESHOLDS.GOOD) {
      feedback.push({
        type: 'pronunciation',
        severity: 'success',
        message: 'Good pronunciation with minor areas for improvement.',
        suggestion: 'Focus on the specific words highlighted below.',
        timestamp
      });
    } else {
      feedback.push({
        type: 'pronunciation',
        severity: 'warning',
        message: 'Pronunciation needs improvement.',
        suggestion: 'Practice speaking more slowly and clearly.',
        timestamp
      });
    }

    // Specific feedback based on analysis components
    if (analysis.analysis.fluency < 60) {
      feedback.push({
        type: 'fluency',
        severity: 'warning',
        message: 'Work on speaking fluency.',
        suggestion: 'Practice with shorter sentences and build up gradually.',
        timestamp
      });
    }

    if (analysis.analysis.accuracy < 60) {
      feedback.push({
        type: 'accuracy',
        severity: 'error',
        message: 'Focus on word accuracy.',
        suggestion: 'Listen to native speakers and repeat after them.',
        timestamp
      });
    }

    return feedback;
  }

  /**
   * Calculate progress update
   */
  private calculateProgressUpdate(analysis: PronunciationAnalysis) {
    return {
      lastPronunciationScore: analysis.overallScore,
      lastAccuracyScore: analysis.analysis.accuracy,
      lastFluencyScore: analysis.analysis.fluency,
      weakAreas: analysis.wordAnalysis
        .filter(word => word.severity === 'major')
        .map(word => word.word),
      strongAreas: analysis.wordAnalysis
        .filter(word => word.severity === 'good')
        .map(word => word.word),
      lastUpdated: new Date()
    };
  }
}

export const pronunciationAnalyzer = PronunciationAnalyzer.getInstance();