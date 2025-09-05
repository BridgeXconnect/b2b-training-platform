/**
 * CopilotKit Advanced Action Framework
 * 
 * This framework provides a comprehensive system for creating, managing,
 * and monitoring AI-powered actions in CopilotKit applications.
 */

// Core interfaces
export * from './types';

// Core classes (explicit re-exports to avoid naming conflicts)
export { BaseAction } from './core/BaseAction';
export { AdvancedAction } from './core/AdvancedAction';
export { ActionRegistry } from './core/ActionRegistry';

// Validation utilities
export * from './validators';

// Error handling
export * from './handlers/ErrorHandler';

// Monitoring and performance
export * from './monitoring';

// Example actions
export * from './examples/PersonalizedLessonAction';

// Main exports
import { ActionRegistry } from './core/ActionRegistry';
import { ActionMonitor } from './monitoring/ActionMonitor';
import { ErrorHandler } from './handlers/ErrorHandler';

/**
 * Global instances
 */
export const actionRegistry = ActionRegistry.getInstance();
export const actionMonitor = ActionMonitor.getInstance();
export const errorHandler = ErrorHandler;

/**
 * Helper function to create a CopilotKit-compatible action
 */
export function createCopilotKitAction(action: any) {
  return {
    name: action.id,
    description: action.description,
    parameters: action.parameters.map((p: any) => ({
      name: p.name,
      type: p.type,
      description: p.description,
      required: p.required
    })),
    handler: async (args: any) => {
      const context = {
        sessionId: `session-${Date.now()}`,
        timestamp: new Date(),
        metadata: {}
      };
      
      const result = await action.execute(args, context);
      
      if (result.success) {
        return result.data;
      } else {
        throw result.error;
      }
    }
  };
}

/**
 * Initialize the action framework
 */
export function initializeActionFramework(config?: {
  monitoring?: boolean;
  monitoringConfig?: any;
  errorListeners?: ((error: any, context: any) => void)[];
}) {
  // Configure monitoring
  if (config?.monitoring !== false) {
    const monitor = ActionMonitor.getInstance(config?.monitoringConfig);
    console.log('Action monitoring enabled');
  }
  
  // Add error listeners
  if (config?.errorListeners) {
    config.errorListeners.forEach(listener => {
      ErrorHandler.addListener(listener);
    });
  }
  
  console.log('CopilotKit Action Framework initialized');
}

/**
 * Register multiple actions at once
 */
export function registerActions(actions: any[]) {
  const registry = ActionRegistry.getInstance();
  
  actions.forEach(action => {
    registry.register(action);
  });
  
  console.log(`Registered ${actions.length} actions`);
}