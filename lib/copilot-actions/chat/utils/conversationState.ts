/**
 * Conversation State Management Utilities
 * Handles multi-turn conversation state persistence and updates
 */

import { 
  ConversationState, 
  ConversationTurn, 
  ConversationContext,
  RealTimeConversationMetrics,
  SystemIntegrationContext,
  ConversationMetadata,
  ConversationFlags,
  TurnContext,
  ObjectiveState
} from '../types';
import { LearningContext } from '../../types';

export class ConversationStateManager {
  private stateCache = new Map<string, ConversationState>();
  private stateHistory = new Map<string, ConversationState[]>();

  /**
   * Create a new conversation state
   */
  async createConversationState(
    conversationId: string,
    sessionId: string,
    context: ConversationContext,
    learningContext: LearningContext
  ): Promise<ConversationState> {
    const state: ConversationState = {
      conversationId,
      sessionId,
      currentTurn: 0,
      totalTurns: 0,
      context,
      history: [],
      metadata: this.createMetadata(learningContext),
      flags: this.createInitialFlags(),
      lastUpdated: new Date()
    };

    // Cache the initial state
    this.stateCache.set(conversationId, state);
    this.stateHistory.set(conversationId, [{ ...state }]);

    return state;
  }

  /**
   * Update conversation state with new turn
   */
  async updateStateWithTurn(
    conversationId: string,
    turn: ConversationTurn,
    updates?: Partial<ConversationState>
  ): Promise<ConversationState> {
    const currentState = await this.getConversationState(conversationId);
    if (!currentState) {
      throw new Error(`Conversation state not found: ${conversationId}`);
    }

    const updatedState: ConversationState = {
      ...currentState,
      currentTurn: turn.turnNumber,
      totalTurns: Math.max(currentState.totalTurns, turn.turnNumber),
      history: [...currentState.history, turn],
      lastUpdated: new Date(),
      ...updates
    };

    // Update performance tracking
    updatedState.context.performanceTracking = this.updatePerformanceTracking(
      updatedState.context.performanceTracking,
      turn
    );

    // Update adaptive settings based on turn analysis
    if (turn.analysis && updatedState.context.adaptiveSettings.realTimeAdjustment) {
      updatedState.context.adaptiveSettings = await this.adjustAdaptiveSettings(
        updatedState.context.adaptiveSettings,
        turn.analysis
      );
    }

    // Cache updated state and maintain history
    this.stateCache.set(conversationId, updatedState);
    this.addToHistory(conversationId, updatedState);

    return updatedState;
  }

  /**
   * Get current conversation state
   */
  async getConversationState(conversationId: string): Promise<ConversationState | null> {
    return this.stateCache.get(conversationId) || null;
  }

  /**
   * Update conversation context
   */
  async updateConversationContext(
    conversationId: string,
    contextUpdates: Partial<ConversationContext>
  ): Promise<ConversationState> {
    const currentState = await this.getConversationState(conversationId);
    if (!currentState) {
      throw new Error(`Conversation state not found: ${conversationId}`);
    }

    const updatedContext: ConversationContext = {
      ...currentState.context,
      ...contextUpdates
    };

    const updatedState: ConversationState = {
      ...currentState,
      context: updatedContext,
      lastUpdated: new Date()
    };

    this.stateCache.set(conversationId, updatedState);
    this.addToHistory(conversationId, updatedState);

    return updatedState;
  }

  /**
   * Update system integration context
   */
  async updateSystemIntegration(
    conversationId: string,
    systemUpdates: Partial<SystemIntegrationContext>
  ): Promise<ConversationState> {
    const currentState = await this.getConversationState(conversationId);
    if (!currentState) {
      throw new Error(`Conversation state not found: ${conversationId}`);
    }

    const updatedSystemIntegration: SystemIntegrationContext = {
      ...currentState.context.systemIntegration,
      ...systemUpdates
    };

    return this.updateConversationContext(conversationId, {
      systemIntegration: updatedSystemIntegration
    });
  }

  /**
   * Update conversation flags
   */
  async updateConversationFlags(
    conversationId: string,
    flagUpdates: Partial<ConversationFlags>
  ): Promise<ConversationState> {
    const currentState = await this.getConversationState(conversationId);
    if (!currentState) {
      throw new Error(`Conversation state not found: ${conversationId}`);
    }

    const updatedFlags: ConversationFlags = {
      ...currentState.flags,
      ...flagUpdates
    };

    const updatedState: ConversationState = {
      ...currentState,
      flags: updatedFlags,
      lastUpdated: new Date()
    };

    this.stateCache.set(conversationId, updatedState);
    return updatedState;
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(conversationId: string, limit?: number): Promise<ConversationState[]> {
    const history = this.stateHistory.get(conversationId) || [];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Create turn context from conversation state
   */
  async createTurnContext(
    state: ConversationState,
    phaseId: string
  ): Promise<TurnContext> {
    const objectiveStates = this.calculateObjectiveStates(state);
    const systemState = this.extractSystemState(state);

    return {
      phaseId,
      objectiveStates,
      conversationState: state,
      systemState
    };
  }

  /**
   * Analyze conversation patterns
   */
  async analyzeConversationPatterns(conversationId: string): Promise<{
    engagementTrend: number[];
    performanceTrend: number[];
    difficultyAdjustments: any[];
    skillProgression: any[];
  }> {
    const history = await this.getConversationHistory(conversationId);
    
    const engagementTrend = history.map(state => 
      state.context.performanceTracking.currentMetrics.currentEngagement
    );

    const performanceTrend = history.map(state => {
      const metrics = state.context.performanceTracking.currentMetrics;
      return metrics.accuracyTrend.reduce((sum, acc) => sum + acc, 0) / metrics.accuracyTrend.length;
    });

    const difficultyAdjustments = history
      .map(state => state.context.performanceTracking.adaptiveHistory)
      .flat();

    const skillProgression = history
      .map(state => state.context.performanceTracking.skillProgression)
      .flat();

    return {
      engagementTrend,
      performanceTrend,
      difficultyAdjustments,
      skillProgression
    };
  }

  /**
   * Clean up old conversation states
   */
  async cleanupOldStates(maxAge: number = 24 * 60 * 60 * 1000): Promise<void> {
    const cutoffTime = new Date(Date.now() - maxAge);
    
    for (const [conversationId, state] of this.stateCache.entries()) {
      if (state.lastUpdated < cutoffTime && !state.flags.isActive) {
        this.stateCache.delete(conversationId);
        this.stateHistory.delete(conversationId);
      }
    }
  }

  // Private helper methods

  private createMetadata(learningContext: LearningContext): ConversationMetadata {
    return {
      createdAt: new Date(),
      lastActive: new Date(),
      totalDuration: 0,
      participantCount: 2, // user + AI
      language: 'en',
      cefrLevel: learningContext.currentCEFRLevel,
      businessDomain: learningContext.preferences.learningStyle || 'general',
      tags: []
    };
  }

  private createInitialFlags(): ConversationFlags {
    return {
      isActive: true,
      isPaused: false,
      requiresAttention: false,
      needsIntervention: false,
      isCompleted: false,
      hasErrors: false,
      adaptiveMode: true
    };
  }

  private updatePerformanceTracking(
    currentTracking: any,
    turn: ConversationTurn
  ): any {
    // Update real-time metrics
    const updatedMetrics: RealTimeConversationMetrics = {
      ...currentTracking.currentMetrics,
      turnsCompleted: turn.turnNumber,
      averageResponseTime: this.calculateAverageResponseTime(currentTracking, turn),
      currentEngagement: turn.analysis?.performance?.engagement || currentTracking.currentMetrics.currentEngagement,
      accuracyTrend: this.updateAccuracyTrend(currentTracking.currentMetrics.accuracyTrend, turn),
      conversationFlow: this.calculateConversationFlow(currentTracking, turn),
      objectiveProgress: this.updateObjectiveProgress(currentTracking.currentMetrics.objectiveProgress, turn)
    };

    return {
      ...currentTracking,
      currentMetrics: updatedMetrics
    };
  }

  private calculateAverageResponseTime(currentTracking: any, turn: ConversationTurn): number {
    const currentAvg = currentTracking.currentMetrics.averageResponseTime;
    const turnResponseTime = turn.analysis?.performance?.responseTime || 15;
    const totalTurns = turn.turnNumber;
    
    return ((currentAvg * (totalTurns - 1)) + turnResponseTime) / totalTurns;
  }

  private updateAccuracyTrend(currentTrend: number[], turn: ConversationTurn): number[] {
    const turnAccuracy = this.calculateTurnAccuracy(turn);
    const updatedTrend = [...currentTrend, turnAccuracy].slice(-5); // Keep last 5
    return updatedTrend;
  }

  private calculateTurnAccuracy(turn: ConversationTurn): number {
    if (!turn.analysis?.linguistic) return 0.7; // Default

    const grammar = turn.analysis.linguistic.grammarScore / 100;
    const vocabulary = turn.analysis.linguistic.vocabularyLevel / 100;
    const pragmatic = turn.analysis.pragmatic?.appropriateness || 70;
    
    return (grammar + vocabulary + (pragmatic / 100)) / 3;
  }

  private calculateConversationFlow(currentTracking: any, turn: ConversationTurn): number {
    // Analyze conversation coherence and flow
    const relevance = turn.analysis?.pragmatic?.relevance || 70;
    const coherence = turn.analysis?.pragmatic?.coherence || 70;
    
    return ((relevance + coherence) / 2) / 100;
  }

  private updateObjectiveProgress(
    currentProgress: Record<string, number>,
    turn: ConversationTurn
  ): Record<string, number> {
    // Update progress based on turn analysis
    const updatedProgress = { ...currentProgress };
    
    if (turn.analysis?.learning?.conceptsUsed) {
      turn.analysis.learning.conceptsUsed.forEach(concept => {
        if (updatedProgress[concept] !== undefined) {
          updatedProgress[concept] = Math.min(100, updatedProgress[concept] + 5);
        }
      });
    }
    
    return updatedProgress;
  }

  private async adjustAdaptiveSettings(currentSettings: any, analysis: any): Promise<any> {
    // Implement adaptive adjustment logic based on turn analysis
    const adjustments = { ...currentSettings };
    
    // Adjust support level based on performance
    if (analysis.performance?.turnQuality < 60) {
      adjustments.supportLevel.vocabularySupport = 'definitions';
      adjustments.supportLevel.grammarSupport = 'suggestions';
    } else if (analysis.performance?.turnQuality > 85) {
      adjustments.supportLevel.vocabularySupport = 'hints';
      adjustments.supportLevel.grammarSupport = 'corrections';
    }
    
    return adjustments;
  }

  private calculateObjectiveStates(state: ConversationState): Record<string, ObjectiveState> {
    const objectives: Record<string, ObjectiveState> = {};
    
    state.context.scenario.learningObjectives.forEach((objective, index) => {
      const progress = this.calculateObjectiveProgress(state, objective);
      
      objectives[`obj_${index}`] = {
        objective,
        progress,
        completed: progress >= 100,
        evidence: this.extractObjectiveEvidence(state, objective),
        requiredActions: []
      };
    });
    
    return objectives;
  }

  private calculateObjectiveProgress(state: ConversationState, objective: string): number {
    // Analyze conversation history to determine objective progress
    const relevantTurns = state.history.filter(turn => 
      turn.analysis?.learning?.conceptsUsed?.includes(objective) ||
      turn.content.metadata.topics.includes(objective)
    );
    
    const baseProgress = (relevantTurns.length / Math.max(1, state.totalTurns)) * 100;
    const qualityMultiplier = relevantTurns.reduce((avg, turn) => 
      avg + (turn.analysis?.performance?.turnQuality || 70), 0
    ) / Math.max(1, relevantTurns.length) / 100;
    
    return Math.min(100, baseProgress * qualityMultiplier);
  }

  private extractObjectiveEvidence(state: ConversationState, objective: string): string[] {
    return state.history
      .filter(turn => turn.analysis?.learning?.conceptsUsed?.includes(objective))
      .map(turn => turn.content.message.substring(0, 100) + '...');
  }

  private extractSystemState(state: ConversationState): any {
    return {
      difficulty: state.context.systemIntegration.adaptiveDifficulty.currentDifficulty,
      supportLevel: 70, // Calculate from adaptive settings
      adaptiveFlags: {
        realTimeAdjustment: state.context.adaptiveSettings.realTimeAdjustment,
        difficultyAdaptation: state.context.adaptiveSettings.difficultyAdaptation.enabled
      },
      performanceMetrics: {
        engagement: state.context.performanceTracking.currentMetrics.currentEngagement,
        accuracy: state.context.performanceTracking.currentMetrics.accuracyTrend.slice(-1)[0] || 0.7
      }
    };
  }

  private addToHistory(conversationId: string, state: ConversationState): void {
    const history = this.stateHistory.get(conversationId) || [];
    history.push({ ...state });
    
    // Keep only last 50 states to prevent memory issues
    if (history.length > 50) {
      history.shift();
    }
    
    this.stateHistory.set(conversationId, history);
  }
}

// Export singleton instance
export const conversationStateManager = new ConversationStateManager();