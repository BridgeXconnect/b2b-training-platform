/**
 * Voice Exercise Generator
 * AI-powered voice exercise creation for Story 5.4 Voice Features
 */

import { 
  VoiceExercise, 
  VoiceExerciseType, 
  VOICE_EXERCISE_DEFAULTS 
} from './types';
import { OpenAIClientManager } from '../ai-config';
import { log } from '../logger';

export class VoiceExerciseGenerator {
  private static instance: VoiceExerciseGenerator;
  private openai = OpenAIClientManager.getInstance();

  private constructor() {}

  public static getInstance(): VoiceExerciseGenerator {
    if (!VoiceExerciseGenerator.instance) {
      VoiceExerciseGenerator.instance = new VoiceExerciseGenerator();
    }
    return VoiceExerciseGenerator.instance;
  }

  /**
   * Generate a voice exercise based on parameters
   */
  public async generateExercise(params: {
    type: VoiceExerciseType;
    cefrLevel: string;
    businessContext?: string;
    topic?: string;
    difficulty?: number;
  }): Promise<VoiceExercise> {
    
    try {
      const exerciseContent = await this.generateExerciseContent(params);
      
      return {
        id: `exercise_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: exerciseContent.title,
        type: params.type,
        cefrLevel: params.cefrLevel,
        targetText: exerciseContent.targetText,
        instructions: exerciseContent.instructions,
        difficulty: params.difficulty || this.getDefaultDifficulty(params.cefrLevel),
        businessContext: params.businessContext,
        estimatedDuration: this.estimateDuration(params.type, exerciseContent.targetText),
        createdAt: new Date()
      };

    } catch (error) {
      log.error('Voice exercise generation failed', 'VOICE', { error });
      return this.generateFallbackExercise(params);
    }
  }

  /**
   * Generate exercise content using AI
   */
  private async generateExerciseContent(params: {
    type: VoiceExerciseType;
    cefrLevel: string;
    businessContext?: string;
    topic?: string;
  }): Promise<{
    title: string;
    targetText: string;
    instructions: string;
  }> {
    
    const prompt = this.buildExercisePrompt(params);
    
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are an expert English language teacher creating voice pronunciation exercises. Create exercises appropriate for ${params.cefrLevel} level learners.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 800,
      temperature: 0.7
    });

    const aiResponse = completion.choices[0]?.message?.content || '';
    return this.parseExerciseContent(aiResponse, params);
  }

  /**
   * Build AI prompt for exercise generation
   */
  private buildExercisePrompt(params: {
    type: VoiceExerciseType;
    cefrLevel: string;
    businessContext?: string;
    topic?: string;
  }): string {
    
    const typeDescriptions = {
      'pronunciation-drill': 'focused on specific sounds, phonemes, or word patterns',
      'dialogue-practice': 'conversational exchanges between two speakers',
      'business-presentation': 'professional presentation or pitch scenarios',
      'phone-conversation': 'telephone communication in business contexts',
      'meeting-simulation': 'meeting participation and discussion',
      'free-speech': 'open-ended speaking on a topic',
      'word-repetition': 'individual word pronunciation practice',
      'sentence-reading': 'reading sentences with proper intonation'
    };

    const cefrGuidance = {
      'A1': 'Very simple vocabulary (500-1000 words), present tense, basic everyday expressions, short sentences',
      'A2': 'Simple vocabulary (1000-2000 words), basic past and future tenses, familiar topics, compound sentences',
      'B1': 'Intermediate vocabulary (2000-3000 words), various tenses, workplace topics, complex sentences',
      'B2': 'Advanced vocabulary (3000-4000 words), sophisticated grammar, abstract concepts, detailed discussions',
      'C1': 'Extensive vocabulary (4000-5000 words), complex structures, implicit meanings, professional scenarios',
      'C2': 'Comprehensive vocabulary (5000+ words), all language structures, subtle distinctions, native-like precision'
    };

    return `
Create a voice pronunciation exercise with the following specifications:

EXERCISE TYPE: ${params.type} - ${typeDescriptions[params.type]}
CEFR LEVEL: ${params.cefrLevel} - ${cefrGuidance[params.cefrLevel as keyof typeof cefrGuidance] || cefrGuidance['B1']}
${params.businessContext ? `BUSINESS CONTEXT: ${params.businessContext}` : ''}
${params.topic ? `TOPIC: ${params.topic}` : ''}

Please provide the response in JSON format:
{
  "title": "Clear, engaging exercise title",
  "targetText": "The exact text the student should speak (appropriate length for ${params.type})",
  "instructions": "Clear step-by-step instructions for the student"
}

Requirements:
- Target text should be 1-3 sentences for most exercises
- For dialogue-practice: provide both sides of the conversation
- For business contexts: use professional language and scenarios
- For ${params.cefrLevel} level: use appropriate complexity and vocabulary
- Instructions should be encouraging and specific
- Focus on common pronunciation challenges for non-native speakers
`;
  }

  /**
   * Parse exercise content from AI response
   */
  private parseExerciseContent(aiResponse: string, params: any): {
    title: string;
    targetText: string;
    instructions: string;
  } {
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      const exerciseData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (exerciseData && exerciseData.title && exerciseData.targetText && exerciseData.instructions) {
        return {
          title: exerciseData.title,
          targetText: exerciseData.targetText,
          instructions: exerciseData.instructions
        };
      }
      
      throw new Error('Invalid exercise format from AI');

    } catch (error) {
      log.error('Failed to parse exercise content', 'VOICE', { error });
      return this.getFallbackExerciseContent(params);
    }
  }

  /**
   * Generate fallback exercise content
   */
  private getFallbackExerciseContent(params: {
    type: VoiceExerciseType;
    cefrLevel: string;
    businessContext?: string;
  }): {
    title: string;
    targetText: string;
    instructions: string;
  } {
    
    const fallbackExercises = {
      'pronunciation-drill': {
        title: 'Word Pronunciation Practice',
        targetText: 'Hello, my name is Sarah and I work in marketing.',
        instructions: 'Speak clearly and slowly. Focus on pronouncing each word distinctly.'
      },
      'dialogue-practice': {
        title: 'Business Introduction',
        targetText: 'Hello, nice to meet you. I am the project manager for this initiative.',
        instructions: 'Imagine you are introducing yourself in a business meeting. Speak with confidence.'
      },
      'business-presentation': {
        title: 'Opening Statement',
        targetText: 'Good morning everyone. Today I will present our quarterly results and future strategy.',
        instructions: 'Speak as if presenting to a board meeting. Use a professional, confident tone.'
      },
      'phone-conversation': {
        title: 'Phone Greeting',
        targetText: 'Good morning, this is John calling from ABC Company. How may I help you?',
        instructions: 'Speak clearly as if on a business phone call. Ensure good articulation.'
      },
      'meeting-simulation': {
        title: 'Meeting Contribution',
        targetText: 'I would like to suggest that we consider alternative approaches to this challenge.',
        instructions: 'Speak as if contributing to a team meeting. Be clear and professional.'
      },
      'free-speech': {
        title: 'Topic Discussion',
        targetText: 'Tell me about your experience with teamwork and collaboration in your workplace.',
        instructions: 'Speak naturally about this topic for 30-60 seconds. Focus on clear pronunciation.'
      },
      'word-repetition': {
        title: 'Key Vocabulary',
        targetText: 'Management, development, implementation, communication, responsibility.',
        instructions: 'Pronounce each word clearly with proper stress patterns.'
      },
      'sentence-reading': {
        title: 'Business Communication',
        targetText: 'Our team successfully completed the project ahead of schedule and under budget.',
        instructions: 'Read this sentence with proper intonation and word stress.'
      }
    };

    return fallbackExercises[params.type] || fallbackExercises['pronunciation-drill'];
  }

  /**
   * Generate fallback exercise
   */
  private generateFallbackExercise(params: {
    type: VoiceExerciseType;
    cefrLevel: string;
    businessContext?: string;
    difficulty?: number;
  }): VoiceExercise {
    
    const content = this.getFallbackExerciseContent(params);
    
    return {
      id: `fallback_exercise_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: content.title,
      type: params.type,
      cefrLevel: params.cefrLevel,
      targetText: content.targetText,
      instructions: content.instructions,
      difficulty: params.difficulty || this.getDefaultDifficulty(params.cefrLevel),
      businessContext: params.businessContext,
      estimatedDuration: this.estimateDuration(params.type, content.targetText),
      createdAt: new Date()
    };
  }

  /**
   * Get default difficulty based on CEFR level
   */
  private getDefaultDifficulty(cefrLevel: string): number {
    const difficultyMap = {
      'A1': 2,
      'A2': 3,
      'B1': 5,
      'B2': 6,
      'C1': 8,
      'C2': 9
    };
    return difficultyMap[cefrLevel as keyof typeof difficultyMap] || 5;
  }

  /**
   * Estimate exercise duration
   */
  private estimateDuration(type: VoiceExerciseType, targetText: string): number {
    const wordCount = targetText.split(' ').length;
    const baseSecondsPerWord = 1.5; // Average speaking pace
    
    const typeMultipliers = {
      'word-repetition': 2.5, // More time for repetition
      'pronunciation-drill': 3.0,
      'dialogue-practice': 2.0,
      'sentence-reading': 1.5,
      'business-presentation': 1.8,
      'phone-conversation': 1.7,
      'meeting-simulation': 1.8,
      'free-speech': 1.0 // Faster, more natural
    };

    const multiplier = typeMultipliers[type] || 1.5;
    const estimatedDuration = Math.round(wordCount * baseSecondsPerWord * multiplier);
    
    // Add buffer time for setup and analysis
    return Math.min(Math.max(estimatedDuration + 10, 15), VOICE_EXERCISE_DEFAULTS.RECORDING_MAX_DURATION);
  }

  /**
   * Generate multiple exercises for a practice session
   */
  public async generatePracticeSession(params: {
    cefrLevel: string;
    businessContext?: string;
    exerciseCount?: number;
    includeTypes?: VoiceExerciseType[];
  }): Promise<VoiceExercise[]> {
    
    const exerciseCount = params.exerciseCount || 3;
    const exerciseTypes: VoiceExerciseType[] = params.includeTypes || [
      'pronunciation-drill',
      'dialogue-practice', 
      'business-presentation'
    ];

    const exercises: VoiceExercise[] = [];

    for (let i = 0; i < exerciseCount; i++) {
      const type = exerciseTypes[i % exerciseTypes.length];
      
      try {
        const exercise = await this.generateExercise({
          type,
          cefrLevel: params.cefrLevel,
          businessContext: params.businessContext,
          difficulty: Math.min(this.getDefaultDifficulty(params.cefrLevel) + i, 10)
        });
        
        exercises.push(exercise);
        
      } catch (error) {
        log.error('Failed to generate exercise in session', 'VOICE', { error, index: i });
        // Continue with remaining exercises
      }
    }

    return exercises;
  }

  /**
   * Get recommended exercise types for CEFR level
   */
  public getRecommendedExerciseTypes(cefrLevel: string): VoiceExerciseType[] {
    const recommendations = {
      'A1': ['word-repetition', 'sentence-reading', 'pronunciation-drill'],
      'A2': ['pronunciation-drill', 'sentence-reading', 'dialogue-practice'],
      'B1': ['dialogue-practice', 'pronunciation-drill', 'business-presentation'],
      'B2': ['business-presentation', 'dialogue-practice', 'meeting-simulation'],
      'C1': ['meeting-simulation', 'business-presentation', 'phone-conversation'],
      'C2': ['phone-conversation', 'free-speech', 'meeting-simulation']
    };

    return (recommendations[cefrLevel as keyof typeof recommendations] || recommendations['B1']) as VoiceExerciseType[];
  }
}

export const voiceExerciseGenerator = VoiceExerciseGenerator.getInstance();