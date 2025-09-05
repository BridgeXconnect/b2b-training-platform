/**
 * Learning Path Workflow Implementation
 * Task 3: Create Automated Learning Path Workflows - Learning Path Module
 */

import {
  WorkflowDefinition,
  WorkflowCategory,
  WorkflowStep,
  WorkflowTrigger,
  LearningPathWorkflowContext,
  WorkflowContext
} from './types';
import { 
  RecommendationContext, 
  RecommendationRequest,
  IntelligentRecommendationEngine 
} from '../services/recommendation-engine';
import { ActionContext } from '../copilot-actions/types';
import { logger } from '../logger';

/**
 * Learning Path Workflow for personalized progression
 * Implements AC: 2, 4, 9 (Workflow automation, lesson planning, orchestration)
 */
export class LearningPathWorkflow {
  private static instance: LearningPathWorkflow;
  private recommendationEngine: IntelligentRecommendationEngine | null = null;

  constructor(recommendationEngine?: IntelligentRecommendationEngine) {
    this.recommendationEngine = recommendationEngine || null;
  }

  public static getInstance(): LearningPathWorkflow {
    if (!LearningPathWorkflow.instance) {
      LearningPathWorkflow.instance = new LearningPathWorkflow();
    }
    return LearningPathWorkflow.instance;
  }

  /**
   * Create personalized learning path workflow
   */
  public createPersonalizedLearningPathWorkflow(): WorkflowDefinition {
    const steps: WorkflowStep[] = [
      {
        id: 'assess_current_level',
        name: 'Assess Current Learning Level',
        description: 'Evaluate user current skill level and learning progress',
        type: 'action',
        action: 'analyze_learning_progress',
        parameters: {
          timeframe: 'current',
          includeComparison: true,
          assessmentType: 'comprehensive'
        },
        timeout: 30000, // 30 seconds
        retryPolicy: {
          maxAttempts: 3,
          backoffType: 'exponential',
          initialDelayMs: 1000,
          maxDelayMs: 10000
        }
      },
      {
        id: 'identify_learning_goals',
        name: 'Identify Learning Goals',
        description: 'Extract and prioritize user learning objectives',
        type: 'action',
        action: 'extract_learning_goals',
        parameters: {
          source: 'user_profile',
          prioritize: true,
          timeHorizon: 'quarterly'
        },
        dependencies: ['assess_current_level'],
        conditions: [{
          type: 'result',
          expression: 'results.assess_current_level && results.assess_current_level.success'
        }]
      },
      {
        id: 'analyze_skill_gaps',
        name: 'Analyze Skill Gaps',
        description: 'Identify gaps between current level and learning goals',
        type: 'action',
        action: 'analyze_skill_gaps',
        parameters: {
          includeRootCause: true,
          priorityThreshold: 0.7
        },
        dependencies: ['assess_current_level', 'identify_learning_goals']
      },
      {
        id: 'generate_content_recommendations',
        name: 'Generate Content Recommendations',
        description: 'Create personalized content recommendations based on analysis',
        type: 'action',
        action: 'generate_recommendations',
        parameters: {
          maxRecommendations: 10,
          recommendationType: 'session-plan',
          includeAlternatives: true
        },
        dependencies: ['analyze_skill_gaps'],
        onSuccess: async (result: any, context: WorkflowContext) => {
          logger.info(`Generated ${result?.recommendations?.length || 0} content recommendations for user ${context.userId}`);
        }
      },
      {
        id: 'create_learning_sequence',
        name: 'Create Learning Sequence',
        description: 'Organize recommendations into optimal learning sequence',
        type: 'action',
        action: 'create_learning_sequence',
        parameters: {
          sequenceType: 'adaptive',
          includeReviewPoints: true,
          allowParallelTracks: false
        },
        dependencies: ['generate_content_recommendations']
      },
      {
        id: 'schedule_learning_sessions',
        name: 'Schedule Learning Sessions',
        description: 'Create optimized schedule for learning sessions',
        type: 'action',
        action: 'schedule_learning_sessions',
        parameters: {
          timeHorizon: 30, // days
          respectTimePreferences: true,
          includeBreaks: true
        },
        dependencies: ['create_learning_sequence'],
        conditions: [{
          type: 'context',
          expression: 'context.preferences && context.preferences.timeSlots && context.preferences.timeSlots.length > 0'
        }]
      },
      {
        id: 'create_progress_milestones',
        name: 'Create Progress Milestones',
        description: 'Define measurable progress milestones and checkpoints',
        type: 'action',
        action: 'create_progress_milestones',
        parameters: {
          milestoneType: 'adaptive',
          frequency: 'weekly',
          includeRewards: true
        },
        dependencies: ['create_learning_sequence']
      },
      {
        id: 'setup_adaptive_monitoring',
        name: 'Setup Adaptive Monitoring',
        description: 'Configure monitoring for adaptive path adjustments',
        type: 'action',
        action: 'setup_adaptive_monitoring',
        parameters: {
          monitoringFrequency: 'real-time',
          adaptationTriggers: ['poor_performance', 'rapid_progress', 'changed_goals'],
          autoAdjustment: true
        },
        dependencies: ['schedule_learning_sessions', 'create_progress_milestones']
      },
      {
        id: 'finalize_learning_path',
        name: 'Finalize Learning Path',
        description: 'Compile and validate complete learning path',
        type: 'action',
        action: 'finalize_learning_path',
        parameters: {
          validateSequence: true,
          generateSummary: true,
          createUserPreview: true
        },
        dependencies: ['setup_adaptive_monitoring']
      }
    ];

    const triggers: WorkflowTrigger[] = [
      {
        id: 'manual_trigger',
        type: 'manual',
        name: 'Manual Learning Path Creation',
        description: 'User or admin manually requests learning path creation',
        priority: 'medium'
      },
      {
        id: 'auto_new_user',
        type: 'automatic',
        name: 'New User Onboarding',
        description: 'Automatically create learning path for new users',
        condition: async (context: WorkflowContext) => {
          const lpContext = context as LearningPathWorkflowContext;
          return lpContext.progressData.completedLessons.length === 0;
        },
        priority: 'high'
      },
      {
        id: 'auto_goal_change',
        type: 'automatic',
        name: 'Learning Goals Changed',
        description: 'Recreate learning path when user goals change significantly',
        condition: async (context: WorkflowContext) => {
          // This would check if learning goals have changed recently
          return false; // Placeholder logic
        },
        priority: 'medium'
      },
      {
        id: 'scheduled_review',
        type: 'scheduled',
        name: 'Monthly Learning Path Review',
        description: 'Scheduled monthly review and optimization of learning paths',
        schedule: {
          expression: '0 9 1 * *', // First day of month at 9 AM
          timezone: 'UTC',
          enabled: true
        },
        priority: 'low'
      }
    ];

    return {
      id: 'personalized_learning_path',
      name: 'Personalized Learning Path Creation',
      description: 'Creates a comprehensive personalized learning path based on user goals, current level, and preferences',
      version: '1.0.0',
      category: WorkflowCategory.LEARNING_PATH,
      steps,
      triggers,
      metadata: {
        created: new Date(),
        updated: new Date(),
        version: '1.0.0',
        author: 'LearningPathWorkflow',
        tags: ['personalization', 'learning-path', 'adaptive', 'recommendation'],
        estimatedDuration: 15, // minutes
        requiredLevel: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
        learningObjectives: [
          'Create personalized learning sequence',
          'Optimize learning schedule',
          'Establish progress tracking',
          'Enable adaptive adjustments'
        ]
      },
      configuration: {
        maxConcurrentSteps: 2,
        enableParallelExecution: true,
        persistState: true,
        enableAuditLog: true,
        timeout: 900000, // 15 minutes
        errorHandling: {
          onStepFailure: 'continue',
          onWorkflowFailure: 'notify',
          maxGlobalRetries: 3
        },
        notifications: {
          onStart: false,
          onComplete: true,
          onFailure: true,
          onStepComplete: false,
          recipients: [],
          channels: ['push']
        }
      }
    };
  }

  /**
   * Create skill-focused learning path workflow
   */
  public createSkillFocusedLearningPathWorkflow(): WorkflowDefinition {
    const steps: WorkflowStep[] = [
      {
        id: 'identify_target_skills',
        name: 'Identify Target Skills',
        description: 'Determine specific skills to focus on',
        type: 'action',
        action: 'identify_target_skills',
        parameters: {
          skillAnalysisDepth: 'detailed',
          includePrerequisites: true
        }
      },
      {
        id: 'assess_skill_proficiency',
        name: 'Assess Current Skill Proficiency',
        description: 'Evaluate current proficiency in target skills',
        type: 'action',
        action: 'assess_skill_proficiency',
        parameters: {
          assessmentType: 'diagnostic',
          includeSubskills: true
        },
        dependencies: ['identify_target_skills']
      },
      {
        id: 'create_skill_progression_map',
        name: 'Create Skill Progression Map',
        description: 'Map out skill development progression',
        type: 'action',
        action: 'create_skill_progression_map',
        parameters: {
          progressionType: 'adaptive',
          includeAlternativePaths: true
        },
        dependencies: ['assess_skill_proficiency']
      },
      {
        id: 'generate_skill_exercises',
        name: 'Generate Skill-Specific Exercises',
        description: 'Create exercises targeted at specific skills',
        type: 'action',
        action: 'generate_skill_exercises',
        parameters: {
          exerciseTypes: ['practice', 'application', 'assessment'],
          difficulty: 'adaptive',
          quantity: 'optimal'
        },
        dependencies: ['create_skill_progression_map']
      },
      {
        id: 'setup_skill_tracking',
        name: 'Setup Skill Progress Tracking',
        description: 'Configure detailed skill progress monitoring',
        type: 'action',
        action: 'setup_skill_tracking',
        parameters: {
          trackingGranularity: 'subskill',
          updateFrequency: 'per-exercise',
          enablePredictiveAnalytics: true
        },
        dependencies: ['generate_skill_exercises']
      }
    ];

    return {
      id: 'skill_focused_learning_path',
      name: 'Skill-Focused Learning Path',
      description: 'Creates learning path focused on specific skill development',
      version: '1.0.0',
      category: WorkflowCategory.SKILL_DEVELOPMENT,
      steps,
      triggers: [
        {
          id: 'skill_gap_detected',
          type: 'automatic',
          name: 'Skill Gap Detected',
          description: 'Triggered when assessment identifies specific skill gaps',
          condition: async (context: WorkflowContext) => {
            const lpContext = context as LearningPathWorkflowContext;
            return lpContext.skillGaps.length > 0;
          },
          priority: 'high'
        }
      ],
      metadata: {
        created: new Date(),
        updated: new Date(),
        version: '1.0.0',
        author: 'LearningPathWorkflow',
        tags: ['skills', 'focused', 'progression', 'tracking'],
        estimatedDuration: 10,
        requiredLevel: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
        learningObjectives: [
          'Develop specific skills',
          'Track skill progression',
          'Provide targeted practice'
        ]
      },
      configuration: {
        maxConcurrentSteps: 1,
        enableParallelExecution: false,
        persistState: true,
        enableAuditLog: true,
        timeout: 600000, // 10 minutes
        errorHandling: {
          onStepFailure: 'retry',
          onWorkflowFailure: 'stop',
          maxGlobalRetries: 2
        },
        notifications: {
          onStart: false,
          onComplete: true,
          onFailure: true,
          onStepComplete: false,
          recipients: [],
          channels: ['push']
        }
      }
    };
  }

  /**
   * Create adaptive difficulty learning path workflow
   */
  public createAdaptiveDifficultyWorkflow(): WorkflowDefinition {
    const steps: WorkflowStep[] = [
      {
        id: 'analyze_performance_trends',
        name: 'Analyze Performance Trends',
        description: 'Analyze recent performance to identify patterns',
        type: 'action',
        action: 'analyze_performance_trends',
        parameters: {
          lookbackPeriod: 14, // days
          includePredictiveAnalysis: true
        }
      },
      {
        id: 'calculate_optimal_difficulty',
        name: 'Calculate Optimal Difficulty',
        description: 'Determine optimal difficulty level for engagement and learning',
        type: 'action',
        action: 'calculate_optimal_difficulty',
        parameters: {
          algorithm: 'adaptive_zone',
          targetSuccessRate: 0.75,
          considerUserPreferences: true
        },
        dependencies: ['analyze_performance_trends']
      },
      {
        id: 'adjust_content_difficulty',
        name: 'Adjust Content Difficulty',
        description: 'Modify upcoming content based on calculated difficulty',
        type: 'action',
        action: 'adjust_content_difficulty',
        parameters: {
          adjustmentScope: 'upcoming_sessions',
          gradualTransition: true
        },
        dependencies: ['calculate_optimal_difficulty']
      },
      {
        id: 'update_learning_path',
        name: 'Update Learning Path',
        description: 'Update existing learning path with difficulty adjustments',
        type: 'action',
        action: 'update_learning_path',
        parameters: {
          preserveOverallProgression: true,
          notifyUser: true
        },
        dependencies: ['adjust_content_difficulty']
      }
    ];

    return {
      id: 'adaptive_difficulty_learning_path',
      name: 'Adaptive Difficulty Learning Path',
      description: 'Automatically adjusts learning path difficulty based on performance',
      version: '1.0.0',
      category: WorkflowCategory.ADAPTIVE_DIFFICULTY,
      steps,
      triggers: [
        {
          id: 'performance_threshold',
          type: 'automatic',
          name: 'Performance Threshold Triggered',
          description: 'Triggered when performance indicates need for difficulty adjustment',
          condition: async (context: WorkflowContext) => {
            const lpContext = context as LearningPathWorkflowContext;
            const avgAccuracy = lpContext.progressData.averageAccuracy;
            return avgAccuracy < 0.6 || avgAccuracy > 0.9;
          },
          priority: 'high'
        },
        {
          id: 'scheduled_adjustment',
          type: 'scheduled',
          name: 'Scheduled Difficulty Review',
          description: 'Weekly review of difficulty settings',
          schedule: {
            expression: '0 10 * * 1', // Monday at 10 AM
            timezone: 'UTC',
            enabled: true
          },
          priority: 'medium'
        }
      ],
      metadata: {
        created: new Date(),
        updated: new Date(),
        version: '1.0.0',
        author: 'LearningPathWorkflow',
        tags: ['adaptive', 'difficulty', 'performance', 'automatic'],
        estimatedDuration: 5,
        requiredLevel: ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'],
        learningObjectives: [
          'Maintain optimal challenge level',
          'Improve learning efficiency',
          'Prevent frustration and boredom'
        ]
      },
      configuration: {
        maxConcurrentSteps: 1,
        enableParallelExecution: false,
        persistState: true,
        enableAuditLog: true,
        timeout: 300000, // 5 minutes
        errorHandling: {
          onStepFailure: 'continue',
          onWorkflowFailure: 'notify',
          maxGlobalRetries: 2
        },
        notifications: {
          onStart: false,
          onComplete: false,
          onFailure: true,
          onStepComplete: false,
          recipients: [],
          channels: ['push']
        }
      }
    };
  }

  /**
   * Create comprehensive onboarding workflow
   */
  public createOnboardingWorkflow(): WorkflowDefinition {
    const steps: WorkflowStep[] = [
      {
        id: 'welcome_assessment',
        name: 'Welcome Assessment',
        description: 'Comprehensive initial assessment of user skills and preferences',
        type: 'action',
        action: 'welcome_assessment',
        parameters: {
          assessmentType: 'comprehensive',
          includePreferences: true,
          estimatedTime: 15 // minutes
        }
      },
      {
        id: 'goal_setting_session',
        name: 'Goal Setting Session',
        description: 'Interactive session to establish learning goals',
        type: 'action',
        action: 'goal_setting_session',
        parameters: {
          sessionType: 'guided',
          includeTimeline: true,
          suggestGoals: true
        },
        dependencies: ['welcome_assessment']
      },
      {
        id: 'create_initial_path',
        name: 'Create Initial Learning Path',
        description: 'Create first personalized learning path',
        type: 'action',
        action: 'create_personalized_lesson',
        parameters: {
          pathType: 'onboarding',
          duration: 'first_week',
          includeVariety: true
        },
        dependencies: ['goal_setting_session']
      },
      {
        id: 'schedule_first_sessions',
        name: 'Schedule First Learning Sessions',
        description: 'Schedule initial learning sessions based on preferences',
        type: 'action',
        action: 'schedule_learning_sessions',
        parameters: {
          sessionCount: 3,
          timeframe: 'first_week',
          gentle: true
        },
        dependencies: ['create_initial_path']
      },
      {
        id: 'setup_reminders',
        name: 'Setup Learning Reminders',
        description: 'Configure reminder system for new user',
        type: 'action',
        action: 'setup_reminders',
        parameters: {
          reminderType: 'gentle',
          frequency: 'daily',
          customization: 'high'
        },
        dependencies: ['schedule_first_sessions']
      },
      {
        id: 'provide_onboarding_resources',
        name: 'Provide Onboarding Resources',
        description: 'Share helpful resources and tips for new users',
        type: 'action',
        action: 'provide_onboarding_resources',
        parameters: {
          resourceTypes: ['tips', 'tutorials', 'faq'],
          deliveryMethod: 'progressive'
        },
        dependencies: ['setup_reminders']
      }
    ];

    return {
      id: 'comprehensive_onboarding',
      name: 'Comprehensive User Onboarding',
      description: 'Complete onboarding workflow for new users',
      version: '1.0.0',
      category: WorkflowCategory.LEARNING_PATH,
      steps,
      triggers: [
        {
          id: 'new_user_signup',
          type: 'automatic',
          name: 'New User Signup',
          description: 'Triggered when new user completes registration',
          condition: async (context: WorkflowContext) => {
            const lpContext = context as LearningPathWorkflowContext;
            return lpContext.progressData.completedLessons.length === 0 &&
                   lpContext.learningGoals.length === 0;
          },
          priority: 'critical'
        }
      ],
      metadata: {
        created: new Date(),
        updated: new Date(),
        version: '1.0.0',
        author: 'LearningPathWorkflow',
        tags: ['onboarding', 'new-user', 'assessment', 'goals'],
        estimatedDuration: 25,
        requiredLevel: [],
        learningObjectives: [
          'Assess initial skill level',
          'Establish learning goals',
          'Create first learning path',
          'Setup support systems'
        ]
      },
      configuration: {
        maxConcurrentSteps: 1,
        enableParallelExecution: false,
        persistState: true,
        enableAuditLog: true,
        timeout: 1500000, // 25 minutes
        errorHandling: {
          onStepFailure: 'retry',
          onWorkflowFailure: 'notify',
          maxGlobalRetries: 3
        },
        notifications: {
          onStart: true,
          onComplete: true,
          onFailure: true,
          onStepComplete: false,
          recipients: ['user', 'support'],
          channels: ['email', 'push']
        }
      }
    };
  }

  /**
   * Get all learning path workflow definitions
   */
  public getAllWorkflows(): WorkflowDefinition[] {
    return [
      this.createPersonalizedLearningPathWorkflow(),
      this.createSkillFocusedLearningPathWorkflow(),
      this.createAdaptiveDifficultyWorkflow(),
      this.createOnboardingWorkflow()
    ];
  }

  /**
   * Get workflow by type
   */
  public getWorkflowByType(type: 'personalized' | 'skill-focused' | 'adaptive' | 'onboarding'): WorkflowDefinition | null {
    switch (type) {
      case 'personalized':
        return this.createPersonalizedLearningPathWorkflow();
      case 'skill-focused':
        return this.createSkillFocusedLearningPathWorkflow();
      case 'adaptive':
        return this.createAdaptiveDifficultyWorkflow();
      case 'onboarding':
        return this.createOnboardingWorkflow();
      default:
        return null;
    }
  }

  /**
   * Create recommendation context for workflow
   */
  public createRecommendationContext(
    learningPathContext: LearningPathWorkflowContext
  ): RecommendationContext {
    return {
      userId: learningPathContext.userId,
      userProfile: {
        id: learningPathContext.userId,
        userId: learningPathContext.userId,
        personalInfo: {
          firstName: '',
          lastName: '',
          email: '',
          timezone: 'UTC',
          location: ''
        },
        createdAt: new Date(),
        preferences: {
          communication: {
            aiPersonality: 'professional' as any,
            feedbackFrequency: 'balanced' as any,
            language: 'en',
            complexity: 'moderate' as const,
            conversationStyle: 'conversational' as const,
            errorCorrection: 'immediate' as const
          },
          accessibility: {
            fontSize: 'medium' as any,
            colorScheme: 'light' as any,
            screenReader: false,
            highContrast: false,
            reducedMotion: false,
            keyboardNavigation: false,
            audioDescriptions: false
          },
          notifications: {
            email: true,
            inApp: true,
            reminders: true,
            achievements: true,
            progress: true,
            marketing: false,
            weeklyReports: true,
            communityUpdates: false
          }
        },
        learningPreferences: {} as any,
        cefrTracking: {} as any,
        privacy: {} as any,
        profileCompletion: {} as any,
        updatedAt: new Date()
      },
      currentSession: undefined,
      recentProgress: {
        totalStudyTime: 30,
        completedLessons: 0,
        currentStreak: 5,
        longestStreak: 10,
        cefrProgress: {
          current: 'B1' as any,
          nextLevel: 'B2' as any,
          progressToNext: 65
        },
        weeklyGoal: {
          target: 10,
          completed: 6
        },
        monthlyStats: {
          lessonsCompleted: 12,
          hoursStudied: 25,
          goalsMet: 3
        },
        assessments: {} as any
      },
      assessmentHistory: [],
      learningGoals: [],
      preferences: {
        contentTypes: [],
        difficultyPreference: 'intermediate' as any,
        sessionLength: 30,
        challengeLevel: 'balanced' as any,
        focusAreas: [],
        avoidAreas: [],
        timeOfDay: 'any' as any,
        learningStyle: 'mixed' as any
      },
      learningAnalytics: {
        userId: learningPathContext.userId,
        learningPattern: {
          preferredContentTypes: [],
          optimalSessionLength: 30,
          bestPerformanceTime: 'morning',
          learningSpeed: 'medium' as any,
          retentionRate: 0.8,
          challengePreference: 'balanced' as any
        },
        skillProfile: {
          strengths: [],
          weaknesses: [],
          rapidImprovement: [],
          needsAttention: []
        },
        engagementMetrics: {
          averageSessionTime: 30,
          completionRate: 0.8,
          dropoffPoints: [],
          motivationFactors: ['achievement', 'progress']
        },
        predictionModel: {
          successProbability: 0.85,
          timeToCompletion: 30,
          difficultyTolerance: 0.7,
          burnoutRisk: 0.2
        }
      }
    };
  }
}

// Export singleton instance
export const learningPathWorkflow = LearningPathWorkflow.getInstance();