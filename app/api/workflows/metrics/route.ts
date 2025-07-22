/**
 * Workflow Metrics API
 * Task 3: Create Automated Learning Path Workflows - Metrics Endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { workflowRegistry } from '@/lib/workflows/WorkflowRegistry';
import { logger } from '@/lib/logger';

/**
 * GET /api/workflows/metrics - Get workflow system metrics
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const workflowId = searchParams.get('workflowId');

    // Initialize registry if needed
    await workflowRegistry.initialize();

    if (workflowId) {
      // Get metrics for specific workflow
      const metrics = await workflowRegistry.getWorkflowMetrics(workflowId);
      
      return NextResponse.json({
        success: true,
        data: metrics
      });
    } else {
      // Get system-wide metrics
      const stats = await workflowRegistry.getWorkflowStatistics();
      
      return NextResponse.json({
        success: true,
        data: stats
      });
    }

  } catch (error) {
    logger.error('Error fetching workflow metrics:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch metrics'
      },
      { status: 500 }
    );
  }
}