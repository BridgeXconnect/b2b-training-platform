import { z } from 'zod';
import OpenAI from 'openai';
import { Action, Parameter } from '@copilotkit/shared';

// Runtime-compatible action type (non-generic)
type RuntimeAction = {
  name: string;
  description?: string;
  parameters?: Parameter[];
  handler?: (args: any) => any | Promise<any>;
};

const openai = new OpenAI();

// Context types for intelligent action discovery
export interface LearningContext {
  userId: string;
  currentCEFRLevel: string;
  progressData: {
    completedLessons: number;
    totalLessons: number;
    weeklyGoal: number;
    currentStreak: number;
  };
  assessmentHistory: {
    averageScore: number;
    weakAreas: string[];
    strongAreas: string[];
    lastAssessment: Date;
  };
  preferences: {
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
    studyTime: 'morning' | 'afternoon' | 'evening' | 'flexible';
    difficulty: 'adaptive' | 'challenging' | 'comfortable';
  };
  currentSession: {
    timeSpent: number;
    topicsStudied: string[];
    actionsPerformed: string[];
  };
}

// Enhanced action registry with context awareness
export class AdvancedActionRegistry {
  private static instance: AdvancedActionRegistry;
  private actions: Map<string, RuntimeAction> = new Map();
  private contextualActions: Map<string, (context: LearningContext) => boolean> = new Map();

  public static getInstance(): AdvancedActionRegistry {
    if (!AdvancedActionRegistry.instance) {
      AdvancedActionRegistry.instance = new AdvancedActionRegistry();
    }
    return AdvancedActionRegistry.instance;
  }

  // Register action with contextual availability
  public registerAction(
    actionId: string, 
    action: RuntimeAction, 
    contextFilter?: (context: LearningContext) => boolean
  ) {
    this.actions.set(actionId, action);
    if (contextFilter) {
      this.contextualActions.set(actionId, contextFilter);
    }
  }

  // Get available actions based on learning context
  public getAvailableActions(context: LearningContext): RuntimeAction[] {
    const availableActions: RuntimeAction[] = [];
    
    for (const [actionId, action] of Array.from(this.actions.entries())) {
      const contextFilter = this.contextualActions.get(actionId);
      
      // If no context filter, action is always available
      if (!contextFilter || contextFilter(context)) {
        availableActions.push(action);
      }
    }
    
    return availableActions;
  }

  // Get action recommendations based on context analysis
  public getRecommendedActions(context: LearningContext): string[] {
    const recommendations: string[] = [];
    
    // Analyze user progress and suggest relevant actions
    if (context.progressData.currentStreak === 0) {
      recommendations.push('motivational_boost');
    }
    
    if (context.assessmentHistory.weakAreas.length > 0) {
      recommendations.push('targeted_practice');
    }
    
    if (context.currentSession.timeSpent > 30) {
      recommendations.push('break_reminder');
    }
    
    if (context.progressData.completedLessons % 5 === 0 && context.progressData.completedLessons > 0) {
      recommendations.push('progress_celebration');
    }
    
    return recommendations;
  }
}

// Define parameters for lesson creation
const createLessonParameters = [
  {
    name: 'topic',
    type: 'string' as const,
    description: 'The main topic for the lesson',
    required: true,
  },
  {
    name: 'cefrLevel',
    type: 'string' as const,
    description: 'Current CEFR level (A1, A2, B1, B2, C1, C2)',
    required: true,
  },
  {
    name: 'weakAreas',
    type: 'string[]' as const,
    description: 'Areas that need improvement',
    required: false,
  },
  {
    name: 'learningStyle',
    type: 'string' as const,
    description: 'Preferred learning style (visual, auditory, kinesthetic, mixed)',
    required: false,
  },
] as const satisfies Parameter[];

// Smart lesson generation action
export const createLessonAction: RuntimeAction = {
  name: 'create_personalized_lesson',
  description: 'Generate a personalized English lesson based on user progress and weak areas',
  parameters: createLessonParameters,
  handler: async ({ topic, cefrLevel, weakAreas, learningStyle }: {
    topic: string;
    cefrLevel: string;
    weakAreas?: string[];
    learningStyle?: string;
  }) => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert in generating personalized English lessons. Your task is to create a lesson plan based on the user's requirements. The lesson should be structured, engaging, and tailored to the user's CEFR level and focus areas. Return the lesson as a JSON object with the following structure: { "title": string, "cefrLevel": string, "duration": number, "learningObjectives": string[], "activities": { "title": string, "type": string, "duration": number }[], "vocabulary": { "word": string, "meaning": string, "example": string }[], "assessment": { "question": string, "type": string, "options": string[] }[] }`,
        },
        {
          role: "user",
          content: `Generate a lesson on the topic of "${topic}" for a ${cefrLevel} level student. ${weakAreas ? `The lesson should focus on the following areas: ${weakAreas.join(", ")}.` : ''} ${learningStyle ? `The user's learning style is ${learningStyle}.` : ''}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    return completion.choices[0].message.content!;
  }
};

// Define parameters for progress analysis
const analyzeProgressParameters = [
  {
    name: 'timeframe',
    type: 'string' as const,
    description: 'Analysis timeframe (week, month, quarter)',
    required: true,
  },
  {
    name: 'includeComparison',
    type: 'boolean' as const,
    description: 'Include comparison with other learners',
    required: false,
  },
] as const satisfies Parameter[];

// Progress analysis action
export const analyzeProgressAction: RuntimeAction = {
  name: 'analyze_learning_progress',
  description: 'Provide detailed analysis of learning progress and personalized recommendations',
  parameters: analyzeProgressParameters,
  handler: async ({ timeframe, includeComparison }: {
    timeframe: string;
    includeComparison: boolean;
  }) => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert in analyzing learning progress and providing personalized recommendations. Your task is to generate a detailed progress analysis based on the user's requirements.`,
        },
        {
          role: "user",
          content: `Analyze the user's learning progress for the past ${timeframe}. Include a comparison with other learners: ${includeComparison}.`,
        },
      ],
    });

    return completion.choices[0].message.content!;
  }
};

// Define parameters for assessment creation
const createAssessmentParameters = [
  {
    name: 'assessmentType',
    type: 'string' as const,
    description: 'Type of assessment (diagnostic, formative, summative, placement)',
    required: true,
  },
  {
    name: 'skillAreas',
    type: 'string[]' as const,
    description: 'Specific skills to assess',
    required: true,
  },
  {
    name: 'difficulty',
    type: 'string' as const,
    description: 'Difficulty adjustment method (adaptive, fixed)',
    required: true,
  },
  {
    name: 'questionCount',
    type: 'number' as const,
    description: 'Number of questions (5-50)',
    required: true,
  },
] as const satisfies Parameter[];

// Smart assessment creation
export const createAssessmentAction: RuntimeAction = {
  name: 'create_adaptive_assessment',
  description: 'Generate adaptive assessment based on learning history and current performance',
  parameters: createAssessmentParameters,
  handler: async ({ assessmentType, skillAreas, difficulty, questionCount }: {
    assessmentType: string;
    skillAreas: string[];
    difficulty: string;
    questionCount: number;
  }) => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert in creating adaptive assessments. Your task is to generate an assessment based on the user's requirements.`,
        },
        {
          role: "user",
          content: `Create a ${difficulty} assessment of type "${assessmentType}" with ${questionCount} questions. The assessment should cover the following skill areas: ${skillAreas.join(", ")}.`,
        },
      ],
    });

    return completion.choices[0].message.content!;
  }
};

// Define parameters for study plan generation
const createStudyPlanParameters = [
  {
    name: 'goalCEFRLevel',
    type: 'string' as const,
    description: 'Target CEFR level (A1, A2, B1, B2, C1, C2)',
    required: true,
  },
  {
    name: 'timeframe',
    type: 'string' as const,
    description: 'Target completion timeframe (e.g., "3 months", "6 weeks")',
    required: true,
  },
  {
    name: 'studyHoursPerWeek',
    type: 'number' as const,
    description: 'Available study hours per week (1-40)',
    required: true,
  },
  {
    name: 'prioritySkills',
    type: 'string[]' as const,
    description: 'Skills to prioritize in the study plan',
    required: false,
  },
] as const satisfies Parameter[];

// Study plan generation
export const createStudyPlanAction: RuntimeAction = {
  name: 'generate_study_plan',
  description: 'Create personalized study plan based on goals, schedule, and current progress',
  parameters: createStudyPlanParameters,
  handler: async ({ goalCEFRLevel, timeframe, studyHoursPerWeek, prioritySkills }: {
    goalCEFRLevel: string;
    timeframe: string;
    studyHoursPerWeek: number;
    prioritySkills: string[];
  }) => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert in creating personalized study plans. Your task is to generate a study plan based on the user's goals and schedule.`,
        },
        {
          role: "user",
          content: `Create a study plan to reach the ${goalCEFRLevel} CEFR level in ${timeframe}. The user can study ${studyHoursPerWeek} hours per week and wants to prioritize the following skills: ${prioritySkills.join(", ")}.`,
        },
      ],
    });

    return completion.choices[0].message.content!;
  }
};



// Define parameters for content generation
const generateContentParameters = [
  {
    name: 'contentType',
    type: 'string' as const,
    description: 'Type of content to generate (lesson, quiz, vocabulary, dialogue, business-case, roleplay)',
    required: true,
  },
  {
    name: 'topic',
    type: 'string' as const,
    description: 'Main topic or subject for the content',
    required: true,
  },
  {
    name: 'duration',
    type: 'number' as const,
    description: 'Desired duration in minutes (5-120)',
    required: true,
  },
  {
    name: 'difficulty',
    type: 'string' as const,
    description: 'Difficulty level (adaptive, beginner, intermediate, advanced)',
    required: true,
  },
  {
    name: 'includeSOPs',
    type: 'boolean' as const,
    description: 'Include company SOPs and procedures',
    required: false,
  },
  {
    name: 'customInstructions',
    type: 'string' as const,
    description: 'Additional requirements or focus areas',
    required: false,
  },
] as const satisfies Parameter[];

// Content generation action
export const generateContentAction: RuntimeAction = {
  name: 'generate_ai_content',
  description: 'Generate personalized learning content using AI based on user context and preferences',
  parameters: generateContentParameters,
  handler: async ({ contentType, topic, duration, difficulty, includeSOPs, customInstructions }: {
    contentType: string;
    topic: string;
    duration: number;
    difficulty: string;
    includeSOPs: boolean;
    customInstructions?: string;
  }) => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert in generating personalized learning content. Your task is to generate content based on the user's requirements.`,
        },
        {
          role: "user",
          content: `Generate a ${duration}-minute ${contentType} on the topic of "${topic}" with ${difficulty} difficulty. Include company SOPs: ${includeSOPs}. Custom instructions: ${customInstructions || 'none'}`,
        },
      ],
    });

    return completion.choices[0].message.content!;
  }
};

// Define parameters for content curation
const curateContentParameters = [
  {
    name: 'sessionGoals',
    type: 'string[]' as const,
    description: 'Learning goals for the current session',
    required: true,
  },
  {
    name: 'timeAvailable',
    type: 'number' as const,
    description: 'Available time in minutes (5-180)',
    required: true,
  },
  {
    name: 'focusAreas',
    type: 'string[]' as const,
    description: 'Specific areas to focus on',
    required: true,
  },
  {
    name: 'challengeLevel',
    type: 'string' as const,
    description: 'Desired challenge level (maintain, increase, decrease)',
    required: false,
  },
] as const satisfies Parameter[];

// Content curation action
export const curateContentAction: RuntimeAction = {
  name: 'curate_learning_content',
  description: 'Get AI-curated content recommendations based on learning patterns and progress',
  parameters: curateContentParameters,
  handler: async ({ sessionGoals, timeAvailable, focusAreas, challengeLevel }: {
    sessionGoals: string[];
    timeAvailable: number;
    focusAreas: string[];
    challengeLevel?: string;
  }) => {
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: `You are an expert in curating learning content. Your task is to generate content recommendations based on the user's goals and preferences.`,
        },
        {
          role: "user",
          content: `Curate a learning session for a user with the following goals: ${sessionGoals.join(", ")}. The user has ${timeAvailable} minutes available and wants to focus on the following areas: ${focusAreas.join(", ")}. ${challengeLevel ? `The desired challenge level is ${challengeLevel}.` : ''}`,
        },
      ],
    });

    return completion.choices[0].message.content!;
  }
};

// Export action registry instance
export const actionRegistry = AdvancedActionRegistry.getInstance();

// Register all actions
actionRegistry.registerAction('create_lesson', createLessonAction);
actionRegistry.registerAction('analyze_progress', analyzeProgressAction);
actionRegistry.registerAction('create_assessment', createAssessmentAction);
actionRegistry.registerAction('generate_study_plan', createStudyPlanAction);
actionRegistry.registerAction('generate_content', generateContentAction);
actionRegistry.registerAction('curate_content', curateContentAction);