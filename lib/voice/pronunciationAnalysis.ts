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
import { OpenAIClientManager } from '../ai-config';
import { log } from '../logger';

export class PronunciationAnalyzer {
  private static instance: PronunciationAnalyzer;
  private openai = OpenAIClientManager.getInstance();

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
      // Convert audio blob to transcript using external service or Web Speech API
      const transcript = await this.transcribeAudio(request.audioBlob);
      
      // Generate AI-powered pronunciation analysis
      const analysis = await this.generatePronunciationAnalysis({
        transcript,
        targetText: request.targetText,
        cefrLevel: request.cefrLevel,
        exerciseType: request.exerciseType,
        businessContext: request.businessContext,
        userId: request.userId
      });

      // Generate feedback based on analysis
      const feedback = this.generateFeedback(analysis);

      // Calculate progress update
      const progress = this.calculateProgressUpdate(analysis);

      return {
        transcript,
        analysis,
        feedback,
        progress
      };

    } catch (error) {
      log.error('Pronunciation analysis failed', 'VOICE', { error });
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
   * Generate comprehensive pronunciation analysis using AI
   */
  private async generatePronunciationAnalysis(params: {
    transcript: string;
    targetText: string;
    cefrLevel: string;
    exerciseType: VoiceExerciseType;
    businessContext?: string;
    userId: string;
  }): Promise<PronunciationAnalysis> {
    
    const prompt = this.buildAnalysisPrompt(params);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert English pronunciation coach and CEFR assessor. Analyze pronunciation accuracy and provide detailed feedback.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      });

      const aiResponse = completion.choices[0]?.message?.content || '';
      return this.parseAIAnalysis(aiResponse, params);

    } catch (error) {
      log.error('AI pronunciation analysis failed', 'VOICE', { error });
      
      // Fallback to basic analysis
      return this.generateBasicAnalysis(params);
    }
  }

  /**
   * Build AI prompt for pronunciation analysis
   */
  private buildAnalysisPrompt(params: {
    transcript: string;
    targetText: string;
    cefrLevel: string;
    exerciseType: VoiceExerciseType;
    businessContext?: string;
  }): string {
    return `
Analyze this pronunciation exercise:

TARGET TEXT: "${params.targetText}"
ACTUAL SPEECH: "${params.transcript}"
CEFR LEVEL: ${params.cefrLevel}
EXERCISE TYPE: ${params.exerciseType}
${params.businessContext ? `BUSINESS CONTEXT: ${params.businessContext}` : ''}

Please provide a detailed analysis in JSON format:
{
  "overallScore": 0-100,
  "accuracy": 0-100,
  "fluency": 0-100, 
  "pronunciation": 0-100,
  "completeness": 0-100,
  "feedback": ["specific feedback point 1", "point 2"],
  "improvements": ["improvement suggestion 1", "suggestion 2"],
  "wordAnalysis": [
    {
      "word": "word",
      "score": 0-100,
      "phonetic": "IPA notation",
      "feedback": "specific word feedback",
      "severity": "good|minor|major"
    }
  ]
}

Focus on:
1. Pronunciation accuracy compared to target
2. CEFR-appropriate expectations for ${params.cefrLevel}
3. Business English relevance if applicable
4. Specific improvements for weak areas
5. Positive reinforcement for good pronunciation
`;
  }

  /**
   * Parse AI analysis response
   */
  private parseAIAnalysis(aiResponse: string, params: any): PronunciationAnalysis {
    try {
      // Extract JSON from AI response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const analysisData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (!analysisData) {
        throw new Error('Invalid AI response format');
      }

      return {
        id: `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        recordingId: `recording_${params.userId}_${Date.now()}`,
        transcript: params.transcript,
        targetText: params.targetText,
        overallScore: Math.max(0, Math.min(100, analysisData.overallScore || 0)),
        cefrLevel: params.cefrLevel,
        analysis: {
          accuracy: Math.max(0, Math.min(100, analysisData.accuracy || 0)),
          fluency: Math.max(0, Math.min(100, analysisData.fluency || 0)),
          pronunciation: Math.max(0, Math.min(100, analysisData.pronunciation || 0)),
          completeness: Math.max(0, Math.min(100, analysisData.completeness || 0))
        },
        feedback: Array.isArray(analysisData.feedback) ? analysisData.feedback : [],
        improvements: Array.isArray(analysisData.improvements) ? analysisData.improvements : [],
        wordAnalysis: this.parseWordAnalysis(analysisData.wordAnalysis || []),
        timestamp: new Date()
      };

    } catch (error) {
      log.error('Failed to parse AI analysis', 'VOICE', { error });
      return this.generateBasicAnalysis(params);
    }
  }

  /**
   * Parse word-level analysis
   */
  private parseWordAnalysis(wordData: any[]): WordPronunciationAnalysis[] {
    return wordData.map(word => ({
      word: word.word || '',
      score: Math.max(0, Math.min(100, word.score || 0)),
      phonetic: word.phonetic || '',
      feedback: word.feedback || '',
      severity: ['good', 'minor', 'major'].includes(word.severity) ? word.severity : 'minor'
    }));
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