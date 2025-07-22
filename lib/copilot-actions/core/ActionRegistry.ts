/**
 * Action Registry for managing CopilotKit actions
 */

import {
  IActionRegistry,
  BaseAction,
  AdvancedAction,
  ActionContext,
  ActionCategory
} from '../types';
import { ActionMonitor } from '../monitoring/ActionMonitor';

/**
 * Action Registry implementation
 */
export class ActionRegistry implements IActionRegistry {
  private actions: Map<string, BaseAction | AdvancedAction> = new Map();
  private categoryIndex: Map<ActionCategory, Set<string>> = new Map();
  private monitor: ActionMonitor;
  
  private static instance: ActionRegistry;
  
  constructor(monitor?: ActionMonitor) {
    this.monitor = monitor || ActionMonitor.getInstance();
    
    // Initialize category index
    Object.values(ActionCategory).forEach(category => {
      this.categoryIndex.set(category, new Set());
    });
  }
  
  /**
   * Get singleton instance
   */
  static getInstance(): ActionRegistry {
    if (!ActionRegistry.instance) {
      ActionRegistry.instance = new ActionRegistry();
    }
    return ActionRegistry.instance;
  }
  
  /**
   * Register an action
   */
  register(action: BaseAction | AdvancedAction): void {
    if (this.actions.has(action.id)) {
      console.warn(`Action ${action.id} is already registered. Overwriting...`);
    }
    
    this.actions.set(action.id, action);
    
    // Update category index
    const categorySet = this.categoryIndex.get(action.category);
    if (categorySet) {
      categorySet.add(action.id);
    }
    
    console.log(`Registered action: ${action.id} (${action.name})`);
  }
  
  /**
   * Unregister an action
   */
  unregister(actionId: string): void {
    const action = this.actions.get(actionId);
    if (!action) {
      console.warn(`Action ${actionId} not found`);
      return;
    }
    
    this.actions.delete(actionId);
    
    // Update category index
    const categorySet = this.categoryIndex.get(action.category);
    if (categorySet) {
      categorySet.delete(actionId);
    }
    
    console.log(`Unregistered action: ${actionId}`);
  }
  
  /**
   * Get action by ID
   */
  get(actionId: string): BaseAction | AdvancedAction | undefined {
    return this.actions.get(actionId);
  }
  
  /**
   * Get all actions
   */
  getAll(): (BaseAction | AdvancedAction)[] {
    return Array.from(this.actions.values());
  }
  
  /**
   * Get actions by category
   */
  getByCategory(category: ActionCategory): (BaseAction | AdvancedAction)[] {
    const actionIds = this.categoryIndex.get(category);
    if (!actionIds) return [];
    
    return Array.from(actionIds)
      .map(id => this.actions.get(id))
      .filter((action): action is BaseAction | AdvancedAction => action !== undefined);
  }
  
  /**
   * Get available actions for context
   */
  async getAvailable(context: ActionContext): Promise<(BaseAction | AdvancedAction)[]> {
    const available: (BaseAction | AdvancedAction)[] = [];
    
    for (const action of this.actions.values()) {
      // Check if action is advanced and has availability check
      if ('isAvailable' in action) {
        const isAvailable = await action.isAvailable(context);
        if (isAvailable) {
          available.push(action);
        }
      } else {
        // Base actions are always available
        available.push(action);
      }
    }
    
    return available;
  }
  
  /**
   * Get recommended actions for context
   */
  async getRecommended(context: ActionContext, limit: number = 5): Promise<AdvancedAction[]> {
    const recommendations: { action: AdvancedAction; score: number }[] = [];
    
    for (const action of this.actions.values()) {
      // Only advanced actions can have recommendations
      if ('getRecommendationScore' in action) {
        const advancedAction = action as AdvancedAction;
        
        // Check if available
        const isAvailable = await advancedAction.isAvailable(context);
        if (!isAvailable) continue;
        
        // Get recommendation score
        const score = await advancedAction.getRecommendationScore(context);
        recommendations.push({ action: advancedAction, score });
      }
    }
    
    // Sort by score and return top N
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(rec => rec.action);
  }
  
  /**
   * Execute action by ID
   */
  async execute(
    actionId: string,
    params: any,
    context: ActionContext
  ): Promise<any> {
    const action = this.actions.get(actionId);
    if (!action) {
      throw new Error(`Action ${actionId} not found`);
    }
    
    // Track execution start
    this.monitor.track({
      actionId: action.id,
      actionName: action.name,
      eventType: 'start',
      timestamp: new Date(),
      context,
      params
    });
    
    try {
      const result = await action.execute(params, context);
      
      // Track success
      this.monitor.track({
        actionId: action.id,
        actionName: action.name,
        eventType: 'success',
        timestamp: new Date(),
        context,
        duration: result.metadata?.executionTime,
        result: result.data
      });
      
      return result;
      
    } catch (error: any) {
      // Track failure
      this.monitor.track({
        actionId: action.id,
        actionName: action.name,
        eventType: 'failure',
        timestamp: new Date(),
        context,
        error: {
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message,
          details: error.details,
          timestamp: new Date(),
          recoverable: error.recoverable || false
        }
      });
      
      throw error;
    }
  }
  
  /**
   * Get action chains
   */
  getActionChains(actionId: string): string[] {
    const action = this.actions.get(actionId);
    if (!action || !('chainWith' in action)) {
      return [];
    }
    
    return (action as AdvancedAction).chainWith || [];
  }
  
  /**
   * Get composable actions
   */
  getComposableActions(actionId: string): string[] {
    const action = this.actions.get(actionId);
    if (!action || !('composeWith' in action)) {
      return [];
    }
    
    return (action as AdvancedAction).composeWith || [];
  }
  
  /**
   * Get registry statistics
   */
  getStatistics(): {
    totalActions: number;
    actionsByCategory: Record<string, number>;
    advancedActions: number;
    baseActions: number;
  } {
    const stats = {
      totalActions: this.actions.size,
      actionsByCategory: {} as Record<string, number>,
      advancedActions: 0,
      baseActions: 0
    };
    
    // Count by category
    for (const [category, actionIds] of this.categoryIndex.entries()) {
      stats.actionsByCategory[category] = actionIds.size;
    }
    
    // Count advanced vs base
    for (const action of this.actions.values()) {
      if ('isAvailable' in action) {
        stats.advancedActions++;
      } else {
        stats.baseActions++;
      }
    }
    
    return stats;
  }
  
  /**
   * Export registry for debugging
   */
  export(): {
    actions: Array<{
      id: string;
      name: string;
      category: ActionCategory;
      type: 'base' | 'advanced';
    }>;
    statistics: ReturnType<ActionRegistry['getStatistics']>;
  } {
    const actions = Array.from(this.actions.values()).map(action => ({
      id: action.id,
      name: action.name,
      category: action.category,
      type: 'isAvailable' in action ? 'advanced' as const : 'base' as const
    }));
    
    return {
      actions,
      statistics: this.getStatistics()
    };
  }
}

/**
 * Global action registry instance
 */
export const actionRegistry = ActionRegistry.getInstance();