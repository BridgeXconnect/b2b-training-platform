/**
 * Advanced Chat Action Types
 * Multi-turn conversation and state management types
 */

import { 
  ActionContext, 
  ActionResult, 
  AdvancedAction,
  LearningContext
} from '../types';
import { WorkflowContext } from '../../workflows/types';
import { DifficultyLevel, RealTimePerformanceMetrics } from '../../services/adaptive-difficulty';
import { RecommendationContext } from '../../services/recommendation-engine';

// Multi-turn conversation types
export interface ConversationState {
  conversationId: string;
  sessionId: string;
  currentTurn: number;
  totalTurns: number;
  context: ConversationContext;
  history: ConversationTurn[];
  metadata: ConversationMetadata;
  flags: ConversationFlags;
  lastUpdated: Date;
}

export interface ConversationContext {
  topic: string;
  scenario: ConversationScenario;
  objectives: string[];
  userProfile: UserConversationProfile;
  adaptiveSettings: AdaptiveConversationSettings;
  performanceTracking: ConversationPerformanceTracking;
  systemIntegration: SystemIntegrationContext;
}

export interface ConversationScenario {
  id: string;
  name: string;
  type: 'business_meeting' | 'client_presentation' | 'negotiation' | 
        'email_writing' | 'phone_call' | 'interview' | 'roleplay' | 'assessment';
  description: string;
  difficulty: DifficultyLevel;
  estimatedDuration: number; // minutes
  learningObjectives: string[];
  businessContext: string;
  roleAssignments: RoleAssignment[];
  scenarioFlow: ScenarioFlow;
  successCriteria: SuccessCriteria;
}

export interface RoleAssignment {
  role: string;
  description: string;
  responsibilities: string[];
  communicationStyle: 'formal' | 'informal' | 'technical' | 'friendly' | 'assertive';
  backgroundInfo: string;
}

export interface ScenarioFlow {
  phases: ScenarioPhase[];
  transitions: FlowTransition[];
  branchingLogic: BranchingRule[];
  adaptiveAdjustments: AdaptiveAdjustment[];
}

export interface ScenarioPhase {
  id: string;
  name: string;
  description: string;
  duration: number; // minutes
  objectives: string[];
  requiredActions: string[];
  evaluationCriteria: EvaluationCriterion[];
  aiPrompts: AIPromptTemplate[];
}

export interface FlowTransition {
  fromPhase: string;
  toPhase: string;
  condition: TransitionCondition;
  actions: TransitionAction[];
}

export interface TransitionCondition {
  type: 'performance' | 'time' | 'completion' | 'user_choice' | 'ai_decision';
  criteria: any;
  threshold?: number;
}

export interface TransitionAction {
  type: 'update_context' | 'adjust_difficulty' | 'provide_feedback' | 'log_event';
  parameters: Record<string, any>;
}

export interface BranchingRule {
  id: string;
  condition: string; // JavaScript expression
  targetPhase: string;
  priority: number;
  description: string;
}

export interface AdaptiveAdjustment {
  trigger: AdaptiveTrigger;
  adjustmentType: 'difficulty' | 'pace' | 'support' | 'complexity';
  magnitude: number; // -1 to 1
  reasoning: string;
}

export interface AdaptiveTrigger {
  metric: 'accuracy' | 'response_time' | 'engagement' | 'frustration';
  threshold: number;
  direction: 'above' | 'below';
  consecutiveOccurrences: number;
}

export interface SuccessCriteria {
  completionRequirements: CompletionRequirement[];
  performanceTargets: PerformanceTarget[];
  skillDemonstration: SkillRequirement[];
  adaptiveThresholds: AdaptiveThreshold[];
}

export interface CompletionRequirement {
  type: 'objective_completed' | 'time_spent' | 'turns_completed' | 'score_achieved';
  value: any;
  weight: number; // 0-1
}

export interface PerformanceTarget {
  skill: string;
  minScore: number; // 0-100
  weight: number; // 0-1
  required: boolean;
}

export interface SkillRequirement {
  skill: string;
  demonstrations: number; // Required number of successful demonstrations
  accuracy: number; // Required accuracy 0-1
}

export interface AdaptiveThreshold {
  metric: string;
  value: number;
  adjustment: 'pass' | 'continue' | 'remediate';
}

export interface UserConversationProfile {
  conversationStyle: 'direct' | 'collaborative' | 'analytical' | 'expressive';
  communicationPreferences: CommunicationPreferences;
  skillLevels: Record<string, number>; // skill -> level (0-100)
  learningGoals: string[];
  previousConversations: ConversationHistory[];
  strengths: string[];
  improvementAreas: string[];
}

export interface CommunicationPreferences {
  feedbackStyle: 'immediate' | 'delayed' | 'summary';
  errorCorrection: 'gentle' | 'direct' | 'contextual';
  encouragementLevel: 'minimal' | 'moderate' | 'high';
  complexityGrowth: 'gradual' | 'rapid' | 'adaptive';
}

export interface ConversationHistory {
  conversationId: string;
  scenario: string;
  date: Date;
  performance: ConversationPerformance;
  outcomes: string[];
  feedback: string[];
}

export interface ConversationPerformance {
  overallScore: number; // 0-100
  skillScores: Record<string, number>;
  turnQuality: TurnQuality[];
  engagement: number; // 0-1
  fluency: number; // 0-1
  accuracy: number; // 0-1
  appropriateness: number; // 0-1
}

export interface TurnQuality {
  turnNumber: number;
  clarity: number; // 0-1
  relevance: number; // 0-1
  grammarAccuracy: number; // 0-1
  vocabularyUse: number; // 0-1
  pragmaticCompetence: number; // 0-1
}

export interface AdaptiveConversationSettings {
  realTimeAdjustment: boolean;
  difficultyAdaptation: DifficultyAdaptationSettings;
  supportLevel: SupportLevelSettings;
  feedbackSettings: ConversationFeedbackSettings;
  personalizationLevel: 'low' | 'medium' | 'high';
}

export interface DifficultyAdaptationSettings {
  enabled: boolean;
  adjustmentFrequency: 'per_turn' | 'per_phase' | 'per_conversation';
  performanceWindow: number; // Number of turns to consider
  thresholds: {
    increaseThreshold: number; // 0-1
    decreaseThreshold: number; // 0-1
  };
  maxAdjustmentPerTurn: number; // Max change in difficulty points
}

export interface SupportLevelSettings {
  vocabularySupport: 'none' | 'hints' | 'definitions' | 'examples';
  grammarSupport: 'none' | 'corrections' | 'suggestions' | 'explanations';
  contextualHelp: 'none' | 'prompts' | 'scaffolding' | 'guided';
  culturalGuidance: boolean;
}

export interface ConversationFeedbackSettings {
  immediateCorrection: boolean;
  encouragingLanguage: boolean;
  detailedExplanations: boolean;
  performanceSummary: boolean;
  improvementSuggestions: boolean;
  positiveReinforcement: boolean;
}

export interface ConversationPerformanceTracking {
  currentMetrics: RealTimeConversationMetrics;
  historicalTrends: ConversationTrend[];
  skillProgression: SkillProgression[];
  engagementIndicators: EngagementIndicator[];
  adaptiveHistory: AdaptiveDecisionLog[];
}

export interface RealTimeConversationMetrics {
  turnsCompleted: number;
  averageResponseTime: number;
  currentEngagement: number; // 0-1
  accuracyTrend: number[]; // Last 5 turns
  difficultyComfort: number; // -1 (too hard) to 1 (too easy)
  conversationFlow: number; // 0-1 smoothness
  objectiveProgress: Record<string, number>; // objective -> progress %
}

export interface ConversationTrend {
  metric: string;
  values: number[];
  timestamps: Date[];
  trend: 'improving' | 'stable' | 'declining';
  confidenceLevel: number; // 0-1
}

export interface SkillProgression {
  skill: string;
  startLevel: number;
  currentLevel: number;
  targetLevel: number;
  progressRate: number; // improvement per turn
  milestones: SkillMilestone[];
}

export interface SkillMilestone {
  level: number;
  achieved: boolean;
  achievedAt?: Date;
  description: string;
}

export interface EngagementIndicator {
  indicator: 'response_time' | 'message_length' | 'question_asking' | 'initiative_taking';
  value: number;
  trend: 'up' | 'down' | 'stable';
  significance: 'low' | 'medium' | 'high';
}

export interface AdaptiveDecisionLog {
  timestamp: Date;
  trigger: string;
  decision: string;
  reasoning: string;
  impact: AdaptiveImpact;
}

export interface AdaptiveImpact {
  performanceChange: number;
  engagementChange: number;
  userSatisfaction: number; // 0-1
  effectiveness: number; // 0-1
}

export interface SystemIntegrationContext {
  recommendationEngine: RecommendationIntegration;
  workflowEngine: WorkflowIntegration;
  adaptiveDifficulty: AdaptiveDifficultyIntegration;
  contentGeneration: ContentGenerationIntegration;
}

export interface RecommendationIntegration {
  enabled: boolean;
  contextData: RecommendationContext;
  realTimeUpdates: boolean;
  suggestedActions: string[];
  nextSteps: string[];
}

export interface WorkflowIntegration {
  workflowId?: string;
  executionId?: string;
  currentStep?: string;
  workflowContext?: WorkflowContext;
  triggeredWorkflows: string[];
}

export interface AdaptiveDifficultyIntegration {
  enabled: boolean;
  currentDifficulty: DifficultyLevel;
  realTimeMetrics: RealTimePerformanceMetrics;
  adjustmentHistory: any[];
  predictedAdjustments: any[];
}

export interface ContentGenerationIntegration {
  dynamicContent: boolean;
  contextualPrompts: string[];
  adaptiveResponses: string[];
  scenarioVariations: string[];
}

export interface ConversationTurn {
  turnId: string;
  turnNumber: number;
  participant: 'user' | 'ai' | 'system';
  content: ConversationContent;
  analysis: TurnAnalysis;
  feedback: TurnFeedback;
  timestamp: Date;
  context: TurnContext;
}

export interface ConversationContent {
  message: string;
  messageType: 'text' | 'structured' | 'multimedia' | 'action';
  metadata: ContentMetadata;
  annotations: ContentAnnotation[];
  attachments?: ConversationAttachment[];
}

export interface ContentMetadata {
  length: number;
  complexity: number; // 0-100
  sentiment: 'positive' | 'neutral' | 'negative';
  formality: number; // 0-100
  topics: string[];
  intents: string[];
}

export interface ContentAnnotation {
  type: 'grammar' | 'vocabulary' | 'pronunciation' | 'pragmatics' | 'culture';
  start: number;
  end: number;
  annotation: string;
  severity: 'info' | 'suggestion' | 'correction' | 'error';
}

export interface ConversationAttachment {
  type: 'image' | 'audio' | 'document' | 'link';
  url: string;
  metadata: Record<string, any>;
  description?: string;
}

export interface TurnAnalysis {
  linguistic: LinguisticAnalysis;
  pragmatic: PragmaticAnalysis;
  performance: TurnPerformanceAnalysis;
  learning: LearningAnalysis;
}

export interface LinguisticAnalysis {
  grammarScore: number; // 0-100
  vocabularyLevel: number; // 0-100
  syntaxComplexity: number; // 0-100
  lexicalDiversity: number; // 0-100
  errors: LanguageError[];
  strengths: string[];
}

export interface LanguageError {
  type: 'grammar' | 'vocabulary' | 'syntax' | 'spelling';
  description: string;
  suggestion: string;
  impact: 'minor' | 'moderate' | 'major';
  position: { start: number; end: number };
}

export interface PragmaticAnalysis {
  appropriateness: number; // 0-100
  coherence: number; // 0-100
  relevance: number; // 0-100
  socialCompetence: number; // 0-100
  culturalSensitivity: number; // 0-100
}

export interface TurnPerformanceAnalysis {
  objectiveAlignment: number; // 0-100
  skillDemonstration: Record<string, number>;
  engagement: number; // 0-100
  responseTime: number; // seconds
  turnQuality: number; // 0-100
}

export interface LearningAnalysis {
  conceptsUsed: string[];
  skillsApplied: string[];
  improvementOpportunities: string[];
  masteryIndicators: string[];
  nextLearningSteps: string[];
}

export interface TurnFeedback {
  immediate: ImmediateFeedback;
  developmental: DevelopmentalFeedback;
  encouragement: EncouragementFeedback;
  nextSteps: NextStepsFeedback;
}

export interface ImmediateFeedback {
  corrections: FeedbackCorrection[];
  reinforcements: string[];
  suggestions: string[];
  clarifications: string[];
}

export interface FeedbackCorrection {
  type: 'grammar' | 'vocabulary' | 'pronunciation' | 'pragmatics';
  original: string;
  corrected: string;
  explanation: string;
  example?: string;
}

export interface DevelopmentalFeedback {
  skillProgress: string[];
  areasForImprovement: string[];
  strengthsReinforced: string[];
  learningRecommendations: string[];
}

export interface EncouragementFeedback {
  achievements: string[];
  progress: string[];
  motivation: string[];
  positiveObservations: string[];
}

export interface NextStepsFeedback {
  immediateActions: string[];
  practiceRecommendations: string[];
  resourceSuggestions: string[];
  challengeOpportunities: string[];
}

export interface TurnContext {
  phaseId: string;
  objectiveStates: Record<string, ObjectiveState>;
  conversationState: ConversationState;
  systemState: SystemState;
}

export interface ObjectiveState {
  objective: string;
  progress: number; // 0-100
  completed: boolean;
  evidence: string[];
  requiredActions: string[];
}

export interface SystemState {
  difficulty: DifficultyLevel;
  supportLevel: number; // 0-100
  adaptiveFlags: Record<string, boolean>;
  performanceMetrics: Record<string, number>;
}

export interface ConversationMetadata {
  createdAt: Date;
  lastActive: Date;
  totalDuration: number; // minutes
  participantCount: number;
  language: string;
  cefrLevel: string;
  businessDomain: string;
  tags: string[];
}

export interface ConversationFlags {
  isActive: boolean;
  isPaused: boolean;
  requiresAttention: boolean;
  needsIntervention: boolean;
  isCompleted: boolean;
  hasErrors: boolean;
  adaptiveMode: boolean;
}

// Chat Action specific interfaces
export interface ChatActionContext extends ActionContext {
  conversationState?: ConversationState;
  learningContext: LearningContext;
  systemIntegration: SystemIntegrationContext;
}

export interface ChatActionResult extends ActionResult {
  conversationUpdate?: Partial<ConversationState>;
  nextActions?: string[];
  systemUpdates?: Record<string, any>;
  learningOutcomes?: string[];
}

export interface MultiTurnChatAction extends AdvancedAction {
  // Multi-turn specific methods
  initializeConversation(context: ChatActionContext): Promise<ConversationState>;
  processTurn(
    turn: ConversationTurn,
    state: ConversationState,
    context: ChatActionContext
  ): Promise<ChatActionResult>;
  updateConversationState(
    currentState: ConversationState,
    updates: Partial<ConversationState>
  ): Promise<ConversationState>;
  
  // Conversation flow control
  shouldContinueConversation(state: ConversationState): Promise<boolean>;
  getNextTurnPrompt(state: ConversationState, context: ChatActionContext): Promise<string>;
  handleConversationCompletion(state: ConversationState): Promise<ChatActionResult>;
  
  // Integration methods
  integrateWithSystems(
    state: ConversationState,
    context: ChatActionContext
  ): Promise<SystemIntegrationContext>;
}

// Evaluation criteria
export interface EvaluationCriterion {
  id: string;
  name: string;
  description: string;
  weight: number; // 0-1
  evaluationType: 'automatic' | 'ai_assessment' | 'user_self_assessment' | 'peer_assessment';
  metrics: EvaluationMetric[];
  passingScore: number; // 0-100
}

export interface EvaluationMetric {
  name: string;
  type: 'boolean' | 'numeric' | 'categorical' | 'text';
  weight: number; // 0-1
  calculationMethod: string;
  targetValue?: any;
}

// AI Prompt Templates
export interface AIPromptTemplate {
  id: string;
  name: string;
  template: string;
  variables: PromptVariable[];
  context: PromptContext;
  adaptiveAdjustments: PromptAdjustment[];
}

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  description: string;
  defaultValue?: any;
}

export interface PromptContext {
  conversationPhase: string;
  userLevel: string;
  difficulty: number;
  businessContext: string;
  learningObjectives: string[];
}

export interface PromptAdjustment {
  condition: string; // JavaScript expression
  modification: string;
  priority: number;
}

export default {
  // Export commonly used enums/constants
};