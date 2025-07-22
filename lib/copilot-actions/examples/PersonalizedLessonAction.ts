/**
 * Example: Personalized Lesson Creation Action
 */

import { z } from 'zod';
import OpenAI from 'openai';
import { AdvancedAction } from '../core/AdvancedAction';
import { 
  ActionCategory, 
  ActionContext, 
  ActionResult,
  ActionParameter 
} from '../types';
import { LearningSchemas, CommonSchemas } from '../validators';
import { ErrorHandler, ErrorCode } from '../handlers/ErrorHandler';
import { performanceTracker } from '../monitoring/PerformanceTracker';

const openai = new OpenAI();

/**
 * Personalized lesson action implementation
 */
export class PersonalizedLessonAction extends AdvancedAction {
  constructor() {
    const parameters: ActionParameter[] = [
      {
        name: 'topic',
        type: 'string',
        description: 'The main topic for the lesson',
        required: true,
        validation: LearningSchemas.topic
      },
      {
        name: 'cefrLevel',
        type: 'string',
        description: 'Target CEFR level (A1-C2)',
        required: true,
        validation: CommonSchemas.cefrLevel
      },
      {
        name: 'duration',
        type: 'number',
        description: 'Lesson duration in minutes (15-120)',
        required: true,
        validation: z.number().min(15).max(120)
      },
      {
        name: 'learningStyle',
        type: 'string',
        description: 'Preferred learning style',
        required: false,
        validation: LearningSchemas.learningStyle,
        default: 'mixed'
      },
      {
        name: 'focusAreas',
        type: 'string[]',
        description: 'Specific skills to focus on',
        required: false,
        validation: z.array(LearningSchemas.skillArea).optional()
      },
      {
        name: 'includeAssessment',
        type: 'boolean',
        description: 'Include assessment at the end',
        required: false,
        default: true
      }
    ];
    
    super({
      id: 'personalized_lesson_v2',
      name: 'Create Personalized Lesson',
      description: 'Generate an AI-powered personalized English lesson based on user profile and learning goals',
      category: ActionCategory.LESSON_CREATION,
      parameters,
      handler: async (params, context) => await this.handleLessonCreation(params, context),
      priority: 1,
      rateLimit: {
        maxCallsPerMinute: 10,
        maxCallsPerHour: 100
      },
      chainWith: ['adaptive_assessment_v2', 'progress_analyzer_v2'],
      retryPolicy: {
        maxRetries: 2,
        backoffMultiplier: 2,
        retryableErrors: [ErrorCode.AI_SERVICE_ERROR, ErrorCode.NETWORK_ERROR]
      }
    });
  }
  
  /**
   * Check if action is available
   */
  async isAvailable(context: ActionContext): Promise<boolean> {
    // Check if user has learning context
    if (!context.learningContext) {
      return false;
    }
    
    // Check if user has completed onboarding
    if (context.learningContext.progressData.completedLessons === 0 && 
        !context.metadata?.onboardingComplete) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Calculate recommendation score
   */
  async getRecommendationScore(context: ActionContext): Promise<number> {
    if (!context.learningContext) return 0;
    
    let score = 0.5; // Base score
    
    // Increase score if user hasn't had a lesson recently
    const hoursSinceLastLesson = context.metadata?.hoursSinceLastLesson || 24;
    if (hoursSinceLastLesson > 24) {
      score += 0.2;
    } else if (hoursSinceLastLesson > 48) {
      score += 0.3;
    }
    
    // Increase score if user is behind weekly goal
    const { completedLessons, weeklyGoal } = context.learningContext.progressData;
    const weekProgress = context.metadata?.weekProgress || 0;
    if (weekProgress < weeklyGoal * 0.7) {
      score += 0.2;
    }
    
    // Adjust based on current streak
    if (context.learningContext.progressData.currentStreak === 0) {
      score += 0.1; // Encourage comeback
    }
    
    return Math.min(score, 1.0);
  }
  
  /**
   * Handle lesson creation
   */
  private async handleLessonCreation(
    params: any,
    context: ActionContext
  ): Promise<ActionResult> {
    performanceTracker.start(this.id, context);
    
    try {
      // Generate lesson structure
      const lessonStructure = await this.generateLessonStructure(params, context);
      performanceTracker.trackApiCall(this.id, context, 'openai', 500, 'success');
      
      // Generate lesson content
      const lessonContent = await this.generateLessonContent(lessonStructure, params, context);
      performanceTracker.trackApiCall(this.id, context, 'openai', 800, 'success');
      
      // Add personalization
      const personalizedLesson = await this.personalizeLesson(lessonContent, context);
      
      // Generate assessment if requested
      let assessment = null;
      if (params.includeAssessment) {
        assessment = await this.generateAssessment(lessonContent, params);
        performanceTracker.trackApiCall(this.id, context, 'openai', 400, 'success');
      }
      
      const metrics = performanceTracker.end(this.id, context);
      
      return {
        success: true,
        data: {
          lesson: personalizedLesson,
          assessment,
          metadata: {
            generatedAt: new Date(),
            estimatedDuration: params.duration,
            difficulty: this.calculateDifficulty(params.cefrLevel, context),
            personalizedElements: personalizedLesson.personalizations?.length || 0
          }
        },
        metadata: {
          executionTime: metrics?.duration || 0,
          tokensUsed: metrics?.tokensUsed || 0,
          confidence: 0.95
        }
      };
      
    } catch (error) {
      const metrics = performanceTracker.end(this.id, context);
      
      const handledError = await ErrorHandler.handle(error, context);
      return {
        success: false,
        error: handledError,
        metadata: {
          executionTime: metrics?.duration || 0
        }
      };
    }
  }
  
  /**
   * Generate lesson structure
   */
  private async generateLessonStructure(params: any, context: ActionContext): Promise<any> {
    const prompt = `Create a lesson structure for:
Topic: ${params.topic}
CEFR Level: ${params.cefrLevel}
Duration: ${params.duration} minutes
Learning Style: ${params.learningStyle}
Focus Areas: ${params.focusAreas?.join(', ') || 'general'}

Return a JSON structure with:
- title
- objectives (array of learning objectives)
- sections (array with title, duration, activities)
- vocabulary (key terms to introduce)
- grammar_points (if applicable)`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are an expert English language curriculum designer." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });
    
    const tokens = completion.usage?.total_tokens || 0;
    performanceTracker.trackTokenUsage(this.id, context, tokens);
    
    return JSON.parse(completion.choices[0].message.content!);
  }
  
  /**
   * Generate lesson content
   */
  private async generateLessonContent(structure: any, params: any, context: ActionContext): Promise<any> {
    const prompt = `Based on this lesson structure, create detailed content:
${JSON.stringify(structure, null, 2)}

For each section, provide:
- Detailed instructions
- Example dialogues or texts
- Interactive exercises
- Practice activities

Adapt the content for ${params.learningStyle} learning style.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are an expert English teacher creating engaging lesson content." },
        { role: "user", content: prompt }
      ]
    });
    
    const tokens = completion.usage?.total_tokens || 0;
    performanceTracker.trackTokenUsage(this.id, context, tokens);
    
    return {
      ...structure,
      content: completion.choices[0].message.content
    };
  }
  
  /**
   * Personalize lesson based on user context
   */
  private async personalizeLesson(lesson: any, context: ActionContext): Promise<any> {
    const personalizations: string[] = [];
    
    if (context.learningContext) {
      const { weakAreas, strongAreas } = context.learningContext.assessmentHistory;
      
      // Add extra practice for weak areas
      if (weakAreas.length > 0) {
        personalizations.push(`Added extra practice for: ${weakAreas.join(', ')}`);
        lesson.extraPractice = weakAreas.map(area => ({
          skill: area,
          exercises: `Additional ${area} exercises tailored to your needs`
        }));
      }
      
      // Build on strong areas
      if (strongAreas.length > 0) {
        personalizations.push(`Advanced challenges in: ${strongAreas.join(', ')}`);
        lesson.advancedChallenges = strongAreas.map(area => ({
          skill: area,
          challenge: `Advanced ${area} activity to push your skills further`
        }));
      }
      
      // Adjust based on learning preferences
      const { preferences } = context.learningContext;
      if (preferences.difficulty === 'challenging') {
        lesson.bonusContent = {
          title: 'Extra Challenge',
          description: 'Additional challenging content for ambitious learners'
        };
        personalizations.push('Added bonus challenging content');
      }
    }
    
    return {
      ...lesson,
      personalizations
    };
  }
  
  /**
   * Generate assessment
   */
  private async generateAssessment(lesson: any, params: any): Promise<any> {
    const prompt = `Create a short assessment for this lesson:
Topic: ${params.topic}
Level: ${params.cefrLevel}
Key concepts: ${JSON.stringify(lesson.objectives)}

Generate 5-10 questions that test understanding of the lesson content.
Include multiple choice, fill-in-the-blank, and short answer questions.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: "You are an assessment expert creating fair and effective tests." },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    });
    
    return JSON.parse(completion.choices[0].message.content!);
  }
  
  /**
   * Calculate difficulty based on level and context
   */
  private calculateDifficulty(cefrLevel: string, context: ActionContext): string {
    const levelMap: Record<string, number> = {
      'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6
    };
    
    let difficulty = levelMap[cefrLevel] || 3;
    
    if (context.learningContext?.preferences.difficulty === 'challenging') {
      difficulty += 0.5;
    } else if (context.learningContext?.preferences.difficulty === 'comfortable') {
      difficulty -= 0.5;
    }
    
    if (difficulty <= 2) return 'Beginner';
    if (difficulty <= 4) return 'Intermediate';
    return 'Advanced';
  }
}