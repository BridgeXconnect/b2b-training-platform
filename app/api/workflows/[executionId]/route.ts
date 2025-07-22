/**
 * Workflow Execution Management API
 * Task 3: Create Automated Learning Path Workflows - Execution Endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { workflowRegistry } from '@/lib/workflows/WorkflowRegistry';
import { logger } from '@/lib/logger';

/**
 * GET /api/workflows/[executionId] - Get workflow execution status
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { executionId: string } }
) {
  try {
    const { executionId } = params;

    if (!executionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Execution ID is required'
        },
        { status: 400 }
      );
    }

    // Initialize registry if needed
    await workflowRegistry.initialize();

    // Get execution status
    const execution = await workflowRegistry.getExecutionStatus(executionId);

    if (!execution) {
      return NextResponse.json(
        {
          success: false,
          error: 'Workflow execution not found'
        },
        { status: 404 }
      );
    }

    // Convert Map to object for JSON serialization
    const stepExecutions = Object.fromEntries(execution.stepExecutions);

    return NextResponse.json({
      success: true,
      data: {
        ...execution,
        stepExecutions
      }
    });

  } catch (error) {
    logger.error('Error fetching workflow execution:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch execution status'
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/workflows/[executionId] - Control workflow execution (pause/resume/cancel)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { executionId: string } }
) {
  try {
    const { executionId } = params;
    const body = await request.json();
    const { action } = body;

    if (!executionId || !action) {
      return NextResponse.json(
        {
          success: false,
          error: 'Execution ID and action are required'
        },
        { status: 400 }
      );
    }

    if (!['pause', 'resume', 'cancel'].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Action must be one of: pause, resume, cancel'
        },
        { status: 400 }
      );
    }

    // Initialize registry if needed
    await workflowRegistry.initialize();

    // Perform action
    switch (action) {
      case 'pause':
        await workflowRegistry.pauseWorkflow(executionId);
        break;
      case 'resume':
        await workflowRegistry.resumeWorkflow(executionId);
        break;
      case 'cancel':
        await workflowRegistry.cancelWorkflow(executionId);
        break;
    }

    logger.info(`Workflow ${action} action completed for execution: ${executionId}`);

    return NextResponse.json({
      success: true,
      data: {
        executionId,
        action,
        status: `${action}d`
      }
    });

  } catch (error) {
    logger.error(`Error performing workflow action:`, error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to perform workflow action'
      },
      { status: 500 }
    );
  }
}