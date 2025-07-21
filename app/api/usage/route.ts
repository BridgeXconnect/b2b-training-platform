import { NextRequest, NextResponse } from 'next/server';
import { UsageMonitor } from '@/lib/usage-monitor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const action = searchParams.get('action') || 'stats';

    switch (action) {
      case 'stats':
        if (userId) {
          const userStats = UsageMonitor.getUserStats(userId);
          return NextResponse.json({
            success: true,
            data: userStats,
          });
        } else {
          const systemStats = UsageMonitor.getSystemStats();
          return NextResponse.json({
            success: true,
            data: systemStats,
          });
        }

      case 'check':
        if (!userId) {
          return NextResponse.json(
            { error: 'User ID required for check action' },
            { status: 400 }
          );
        }
        
        const canMakeRequest = UsageMonitor.canUserMakeRequest(userId);
        return NextResponse.json({
          success: true,
          data: canMakeRequest,
        });

      case 'report':
        const report = UsageMonitor.generateReport(userId || undefined);
        return NextResponse.json({
          success: true,
          data: { report },
        });

      case 'budget':
        const budgetStatus = UsageMonitor.isSystemOverBudget();
        return NextResponse.json({
          success: true,
          data: budgetStatus,
        });

      case 'export':
        const startDate = searchParams.get('startDate') ? 
          new Date(searchParams.get('startDate')!) : undefined;
        const endDate = searchParams.get('endDate') ? 
          new Date(searchParams.get('endDate')!) : undefined;
        
        const exportData = UsageMonitor.exportUsageData(userId || undefined, startDate, endDate);
        return NextResponse.json({
          success: true,
          data: exportData,
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: stats, check, report, budget, export' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve usage data' },
      { status: 500 }
    );
  }
}

// POST endpoint for recording usage (for manual tracking)
export async function POST(request: NextRequest) {
  try {
    const {
      userId,
      sessionId,
      model,
      inputTokens,
      outputTokens,
      estimatedCost,
      feature,
      metadata
    } = await request.json();

    // Validate required fields
    if (!userId || !sessionId || !model || inputTokens === undefined || outputTokens === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, sessionId, model, inputTokens, outputTokens' },
        { status: 400 }
      );
    }

    await UsageMonitor.recordUsage(
      userId,
      sessionId,
      model,
      inputTokens,
      outputTokens,
      estimatedCost || 0,
      feature || 'manual',
      metadata
    );

    return NextResponse.json({
      success: true,
      message: 'Usage recorded successfully',
    });

  } catch (error) {
    console.error('Usage recording error:', error);
    return NextResponse.json(
      { error: 'Failed to record usage' },
      { status: 500 }
    );
  }
}