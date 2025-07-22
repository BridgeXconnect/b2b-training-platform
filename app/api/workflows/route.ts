/**
 * Workflow Management API
 * Task 3: Create Automated Learning Path Workflows - API Endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { workflowRegistry } from '@/lib/workflows/WorkflowRegistry';
import { WorkflowCategory } from '@/lib/workflows/types';
import { logger } from '@/lib/logger';

/**
 * GET /api/workflows - Get available workflows
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') as WorkflowCategory | null;
    const userId = searchParams.get('userId');
    const recommended = searchParams.get('recommended') === 'true';

    // Initialize registry if needed
    await workflowRegistry.initialize();

    if (recommended && userId) {
      // Get recommended workflows for user
      const context = workflowRegistry.createLearningPathContext(
        { userId },
        [], // learning goals would come from user profile
        'B1', // current level would come from user profile
        'B2', // target level would come from user profile
        {} // preferences would come from user profile
      );
      
      const workflows = await workflowRegistry.getRecommendedWorkflows(context, 5);
      
      return NextResponse.json({
        success: true,
        data: workflows,
        count: workflows.length
      });
    }

    // Get workflows by category or all workflows
    const workflows = category 
      ? await workflowRegistry.getWorkflowsByCategory(category)
      : await workflowRegistry.getAllWorkflows();

    return NextResponse.json({
      success: true,
      data: workflows,
      count: workflows.length
    });

  } catch (error) {
    logger.error('Error fetching workflows:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch workflows'
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflows/execute - Execute a workflow
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { workflowId, context, parameters } = body;

    if (!workflowId || !context || !context.userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: workflowId, context.userId'
        },
        { status: 400 }
      );
    }

    // Initialize registry if needed
    await workflowRegistry.initialize();

    // Execute workflow
    const executionId = await workflowRegistry.executeWorkflow(
      workflowId,
      context,
      parameters
    );

    logger.info(`Workflow execution started: ${workflowId} for user: ${context.userId}`, {
      executionId,
      workflowId
    });

    return NextResponse.json({
      success: true,
      data: {
        executionId,
        workflowId,
        status: 'started'
      }
    });

  } catch (error) {
    logger.error('Error executing workflow:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute workflow'
      },
      { status: 500 }
    );
  }
}