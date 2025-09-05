/**
 * Advanced AI Chat Actions
 * Task 5: Build Advanced AI Chat Actions
 * 
 * Multi-turn conversation workflows with state management and
 * intelligent integration with all completed systems.
 */

export * from './ScenarioBasedChatAction';
export * from './SkillAssessmentChatAction';
export * from './FeedbackGenerationAction';
export * from './types';
export * from './utils/conversationState';
export * from './utils/contextPreservation';

// Note: ContextualHelpAction, chatWorkflowEngine, and ChatActionRegistry 
// are not yet implemented. Commented out to prevent compilation errors.
// export * from './ContextualHelpAction';
// export * from './workflows/chatWorkflowEngine';
// import { ChatActionRegistry } from './registry/ChatActionRegistry';
// export const chatActionRegistry = new ChatActionRegistry();