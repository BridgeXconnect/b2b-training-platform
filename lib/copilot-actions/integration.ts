/**
 * Integration file to migrate existing CopilotKit actions to the new framework
 */

import { BaseAction } from './core/BaseAction';
import { ActionCategory, ActionContext, ActionResult } from './types';
import { CommonSchemas, LearningSchemas } from './validators';
import { createCopilotKitAction, actionRegistry } from './index';
import OpenAI from 'openai';

const openai = new OpenAI();

/**
 * Migrate existing lesson creation action
 */
class CreateLessonActionV2 extends BaseAction {
  constructor() {
    super({
      id: 'create_lesson_v2',
      name: 'create_personalized_lesson',
      description: 'Generate a personalized English lesson based on user progress and weak areas',
      category: ActionCategory.LESSON_CREATION,
      parameters: [
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
          description: 'Current CEFR level (A1, A2, B1, B2, C1, C2)',
          required: true,
          validation: CommonSchemas.cefrLevel
        },
        {
          name: 'weakAreas',
          type: 'string[]',
          description: 'Areas that need improvement',
          required: false
        },
        {
          name: 'learningStyle',
          type: 'string',
          description: 'Preferred learning style',
          required: false,
          validation: LearningSchemas.learningStyle
        }
      ],
      handler: async (params, context) => {
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: `You are an expert in generating personalized English lessons.`
            },
            {
              role: "user",
              content: `Generate a lesson on "${params.topic}" for ${params.cefrLevel} level.`
            }
          ],
          response_format: { type: "json_object" }
        });
        
        return {
          success: true,
          data: JSON.parse(completion.choices[0].message.content!),
          metadata: {
            executionTime: Date.now() - context.timestamp.getTime()
          }
        };
      }
    });
  }
}

/**
 * Migrate progress analysis action
 */
class AnalyzeProgressActionV2 extends BaseAction {
  constructor() {
    super({
      id: 'analyze_progress_v2',
      name: 'analyze_learning_progress',
      description: 'Provide detailed analysis of learning progress and personalized recommendations',
      category: ActionCategory.PROGRESS_ANALYSIS,
      parameters: [
        {
          name: 'timeframe',
          type: 'string',
          description: 'Analysis timeframe (week, month, quarter)',
          required: true
        },
        {
          name: 'includeComparison',
          type: 'boolean',
          description: 'Include comparison with other learners',
          required: false,
          default: false
        }
      ],
      handler: async (params, context) => {
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: `You are an expert in analyzing learning progress.`
            },
            {
              role: "user",
              content: `Analyze progress for the past ${params.timeframe}.`
            }
          ]
        });
        
        return {
          success: true,
          data: completion.choices[0].message.content,
          metadata: {
            executionTime: Date.now() - context.timestamp.getTime()
          }
        };
      }
    });
  }
}

/**
 * Migrate assessment creation action
 */
class CreateAssessmentActionV2 extends BaseAction {
  constructor() {
    super({
      id: 'create_assessment_v2',
      name: 'create_adaptive_assessment',
      description: 'Generate adaptive assessment based on learning history',
      category: ActionCategory.ASSESSMENT,
      parameters: [
        {
          name: 'assessmentType',
          type: 'string',
          description: 'Type of assessment',
          required: true,
          validation: LearningSchemas.assessmentType
        },
        {
          name: 'skillAreas',
          type: 'string[]',
          description: 'Specific skills to assess',
          required: true
        },
        {
          name: 'difficulty',
          type: 'string',
          description: 'Difficulty adjustment method',
          required: true,
          validation: LearningSchemas.difficulty
        },
        {
          name: 'questionCount',
          type: 'number',
          description: 'Number of questions (5-50)',
          required: true,
          validation: LearningSchemas.questionCount
        }
      ],
      handler: async (params, context) => {
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: `You are an expert in creating adaptive assessments.`
            },
            {
              role: "user",
              content: `Create a ${params.assessmentType} assessment with ${params.questionCount} questions.`
            }
          ]
        });
        
        return {
          success: true,
          data: completion.choices[0].message.content,
          metadata: {
            executionTime: Date.now() - context.timestamp.getTime()
          }
        };
      }
    });
  }
}

/**
 * Migrate study plan action
 */
class CreateStudyPlanActionV2 extends BaseAction {
  constructor() {
    super({
      id: 'create_study_plan_v2',
      name: 'generate_study_plan',
      description: 'Create personalized study plan based on goals',
      category: ActionCategory.STUDY_PLANNING,
      parameters: [
        {
          name: 'goalCEFRLevel',
          type: 'string',
          description: 'Target CEFR level',
          required: true,
          validation: CommonSchemas.cefrLevel
        },
        {
          name: 'timeframe',
          type: 'string',
          description: 'Target completion timeframe',
          required: true
        },
        {
          name: 'studyHoursPerWeek',
          type: 'number',
          description: 'Available study hours per week',
          required: true,
          validation: LearningSchemas.studyHoursPerWeek
        },
        {
          name: 'prioritySkills',
          type: 'string[]',
          description: 'Skills to prioritize',
          required: false
        }
      ],
      handler: async (params, context) => {
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            {
              role: "system",
              content: `You are an expert in creating personalized study plans.`
            },
            {
              role: "user",
              content: `Create a study plan to reach ${params.goalCEFRLevel} in ${params.timeframe}.`
            }
          ]
        });
        
        return {
          success: true,
          data: completion.choices[0].message.content,
          metadata: {
            executionTime: Date.now() - context.timestamp.getTime()
          }
        };
      }
    });
  }
}

/**
 * Get all migrated actions for CopilotKit runtime
 */
export function getMigratedActions() {
  // Create action instances
  const actions = [
    new CreateLessonActionV2(),
    new AnalyzeProgressActionV2(),
    new CreateAssessmentActionV2(),
    new CreateStudyPlanActionV2()
  ];
  
  // Register with action registry
  actions.forEach(action => actionRegistry.register(action));
  
  // Convert to CopilotKit format
  return actions.map(action => createCopilotKitAction(action));
}

/**
 * Get action by name (for backward compatibility)
 */
export function getActionByName(name: string) {
  const actionMap: Record<string, string> = {
    'create_personalized_lesson': 'create_lesson_v2',
    'analyze_learning_progress': 'analyze_progress_v2',
    'create_adaptive_assessment': 'create_assessment_v2',
    'generate_study_plan': 'create_study_plan_v2'
  };
  
  const actionId = actionMap[name];
  if (!actionId) return null;
  
  const action = actionRegistry.get(actionId);
  return action ? createCopilotKitAction(action) : null;
}