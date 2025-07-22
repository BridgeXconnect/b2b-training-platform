/**
 * Workflow System Validation
 * Task 3: Create Automated Learning Path Workflows - Validation
 */

import { workflowRegistry } from './WorkflowRegistry';
import { WorkflowCategory } from './types';
import { logger } from '../logger';

/**
 * Validate the workflow system implementation
 */
export async function validateWorkflowSystem(): Promise<{
  success: boolean;
  results: Array<{
    test: string;
    passed: boolean;
    error?: string;
  }>;
}> {
  const results: Array<{ test: string; passed: boolean; error?: string }> = [];

  try {
    // Test 1: Registry initialization
    try {
      await workflowRegistry.initialize();
      results.push({ test: 'Registry initialization', passed: true });
    } catch (error) {
      results.push({ 
        test: 'Registry initialization', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Get all workflows
    try {
      const workflows = await workflowRegistry.getAllWorkflows();
      const passed = workflows.length >= 12; // Should have at least 12 workflows (4 from each class)
      results.push({ 
        test: `Get all workflows (found ${workflows.length})`, 
        passed,
        error: passed ? undefined : 'Expected at least 12 workflows'
      });
    } catch (error) {
      results.push({ 
        test: 'Get all workflows', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 3: Get workflows by category
    try {
      const learningPathWorkflows = await workflowRegistry.getWorkflowsByCategory(
        WorkflowCategory.LEARNING_PATH
      );
      const assessmentWorkflows = await workflowRegistry.getWorkflowsByCategory(
        WorkflowCategory.ASSESSMENT
      );
      const schedulingWorkflows = await workflowRegistry.getWorkflowsByCategory(
        WorkflowCategory.SCHEDULING
      );

      const passed = learningPathWorkflows.length > 0 && 
                    assessmentWorkflows.length > 0 && 
                    schedulingWorkflows.length > 0;
      
      results.push({ 
        test: `Get workflows by category (LP: ${learningPathWorkflows.length}, A: ${assessmentWorkflows.length}, S: ${schedulingWorkflows.length})`, 
        passed,
        error: passed ? undefined : 'Missing workflows in some categories'
      });
    } catch (error) {
      results.push({ 
        test: 'Get workflows by category', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 4: Get specific workflow
    try {
      const workflow = await workflowRegistry.getWorkflow('personalized_learning_path');
      const passed = workflow !== null && workflow.id === 'personalized_learning_path';
      results.push({ 
        test: 'Get specific workflow', 
        passed,
        error: passed ? undefined : 'Failed to retrieve specific workflow'
      });
    } catch (error) {
      results.push({ 
        test: 'Get specific workflow', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 5: Context creation
    try {
      const context = workflowRegistry.createLearningPathContext(
        { userId: 'test-user', sessionId: 'test-session' },
        ['goal1', 'goal2'],
        'B1',
        'B2',
        { sessionLength: 30 }
      );
      
      const passed = context.userId === 'test-user' && 
                    (context as any).learningGoals?.includes('goal1') &&
                    (context as any).currentLevel === 'B1';
      
      results.push({ 
        test: 'Context creation', 
        passed,
        error: passed ? undefined : 'Context creation failed'
      });
    } catch (error) {
      results.push({ 
        test: 'Context creation', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 6: Health check
    try {
      const health = await workflowRegistry.healthCheck();
      const passed = health.status === 'healthy';
      results.push({ 
        test: `Health check (${health.status})`, 
        passed,
        error: passed ? undefined : health.details.lastError
      });
    } catch (error) {
      results.push({ 
        test: 'Health check', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 7: Workflow statistics
    try {
      const stats = await workflowRegistry.getWorkflowStatistics();
      const passed = stats.totalWorkflows > 0;
      results.push({ 
        test: `Workflow statistics (${stats.totalWorkflows} workflows)`, 
        passed,
        error: passed ? undefined : 'No workflows found in statistics'
      });
    } catch (error) {
      results.push({ 
        test: 'Workflow statistics', 
        passed: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    const allPassed = results.every(r => r.passed);
    
    logger.info('Workflow system validation completed', {
      totalTests: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      success: allPassed
    });

    return {
      success: allPassed,
      results
    };

  } catch (error) {
    logger.error('Workflow system validation failed:', error);
    return {
      success: false,
      results: [{
        test: 'System validation',
        passed: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }]
    };
  }
}

/**
 * Run validation and log results
 */
export async function runWorkflowValidation(): Promise<boolean> {
  logger.info('Starting workflow system validation...');
  
  const validation = await validateWorkflowSystem();
  
  validation.results.forEach(result => {
    if (result.passed) {
      logger.info(`✅ ${result.test}: PASSED`);
    } else {
      logger.error(`❌ ${result.test}: FAILED - ${result.error}`);
    }
  });

  if (validation.success) {
    logger.info('🎉 All workflow validation tests passed!');
  } else {
    logger.error('⚠️ Some workflow validation tests failed');
  }

  return validation.success;
}