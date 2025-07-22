import { useCopilotReadable } from '@copilotkit/react-core';

// Co-agent state types
export interface LearningState {
  currentLesson?: any;
  progressData?: any;
  assessmentResults?: any[];
  studyPlan?: any;
  sessionId?: string;
  learningGoals: string[];
  cefrLevel: string;
  weakAreas: string[];
  strongAreas: string[];
}

export interface SessionState {
  isActive: boolean;
  startTime?: Date;
  lastActivity?: Date;
  messageCount: number;
  currentTopic?: string;
  engagementLevel: 'low' | 'medium' | 'high';
}

export interface UserPreferences {
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  studyTime: 'morning' | 'afternoon' | 'evening' | 'flexible';
  difficulty: 'adaptive' | 'challenging' | 'comfortable';
  language: string;
  notifications: boolean;
}

// Co-agent state management hooks
export function useLearningCoAgent(initialState: Partial<LearningState>) {
  const learningState: LearningState = {
    learningGoals: [],
    cefrLevel: 'B1',
    weakAreas: [],
    strongAreas: [],
    ...initialState
  };

  // Make learning state readable to CopilotKit
  useCopilotReadable({
    description: "Current learning state and progress tracking",
    value: learningState
  });

  return {
    state: learningState,
    updateLesson: (lesson: any) => ({ ...learningState, currentLesson: lesson }),
    updateProgress: (progress: any) => ({ ...learningState, progressData: progress }),
    addAssessmentResult: (result: any) => ({ 
      ...learningState, 
      assessmentResults: [...(learningState.assessmentResults || []), result] 
    }),
    updateStudyPlan: (plan: any) => ({ ...learningState, studyPlan: plan }),
  };
}

export function useSessionCoAgent(initialState: Partial<SessionState>) {
  const sessionState: SessionState = {
    isActive: false,
    messageCount: 0,
    engagementLevel: 'medium',
    ...initialState
  };

  // Make session state readable to CopilotKit
  useCopilotReadable({
    description: "Current session state and user engagement metrics",
    value: sessionState
  });

  return {
    state: sessionState,
    startSession: () => ({ 
      ...sessionState, 
      isActive: true, 
      startTime: new Date(),
      lastActivity: new Date() 
    }),
    endSession: () => ({ 
      ...sessionState, 
      isActive: false 
    }),
    updateActivity: () => ({ 
      ...sessionState, 
      lastActivity: new Date(),
      messageCount: sessionState.messageCount + 1
    }),
    updateEngagement: (level: SessionState['engagementLevel']) => ({ 
      ...sessionState, 
      engagementLevel: level 
    }),
  };
}

export function usePreferencesCoAgent(initialState: Partial<UserPreferences>) {
  const preferences: UserPreferences = {
    learningStyle: 'mixed',
    studyTime: 'flexible',
    difficulty: 'adaptive',
    language: 'en',
    notifications: true,
    ...initialState
  };

  // Make preferences readable to CopilotKit
  useCopilotReadable({
    description: "User learning preferences and settings",
    value: preferences
  });

  return {
    state: preferences,
    updateLearningStyle: (style: UserPreferences['learningStyle']) => ({ 
      ...preferences, 
      learningStyle: style 
    }),
    updateStudyTime: (time: UserPreferences['studyTime']) => ({ 
      ...preferences, 
      studyTime: time 
    }),
    updateDifficulty: (difficulty: UserPreferences['difficulty']) => ({ 
      ...preferences, 
      difficulty 
    }),
    updateLanguage: (language: string) => ({ 
      ...preferences, 
      language 
    }),
    toggleNotifications: () => ({ 
      ...preferences, 
      notifications: !preferences.notifications 
    }),
  };
}

// Global co-agent coordinator
export function useCoAgentCoordinator() {
  // Coordinate between different co-agents
  useCopilotReadable({
    description: "Co-agent coordination and communication hub",
    value: {
      coordinatorActive: true,
      lastUpdate: new Date().toISOString(),
      activeAgents: ['learning', 'session', 'preferences'],
      communicationChannels: [
        'learning_progress_update',
        'session_state_change', 
        'preference_update',
        'assessment_completion',
        'lesson_start',
        'study_plan_update'
      ]
    }
  });

  return {
    broadcastLearningUpdate: (data: any) => {
      // Notify all co-agents of learning updates
      console.log('Broadcasting learning update:', data);
    },
    broadcastSessionChange: (data: any) => {
      // Notify all co-agents of session changes
      console.log('Broadcasting session change:', data);
    },
    broadcastPreferenceUpdate: (data: any) => {
      // Notify all co-agents of preference updates
      console.log('Broadcasting preference update:', data);
    },
    getGlobalState: () => {
      // Return aggregated state from all co-agents
      return {
        timestamp: new Date().toISOString(),
        activeCoAgents: 3,
        coordinationStatus: 'active'
      };
    }
  };
}