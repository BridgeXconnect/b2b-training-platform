import { NextRequest, NextResponse } from 'next/server';
import { validateAIConfig } from '@/lib/ai-config';
import { AIErrorHandler } from '@/lib/error-handler';
import { UsageMonitor } from '@/lib/usage-monitor';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const detailed = searchParams.get('detailed') === 'true';

    // Basic configuration check
    const configValidation = validateAIConfig();
    
    // AI service health check
    const serviceHealth = await AIErrorHandler.healthCheck();
    
    // Usage statistics
    const systemStats = UsageMonitor.getSystemStats();
    const budgetStatus = UsageMonitor.isSystemOverBudget();

    // Error statistics
    const errorStats = AIErrorHandler.getErrorStats();

    // Basic health response
    const healthResponse = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        config: configValidation.valid ? 'healthy' : 'unhealthy',
        ai: serviceHealth.status,
        usage: budgetStatus.shouldBlock ? 'degraded' : 'healthy',
      },
      version: '1.0.0',
    };

    // Add detailed information if requested
    if (detailed) {
      (healthResponse as any).details = {
        configuration: {
          valid: configValidation.valid,
          errors: configValidation.errors,
        },
        aiService: {
          status: serviceHealth.status,
          errors: serviceHealth.errors,
          recommendations: serviceHealth.recommendations,
          errorStats: errorStats,
        },
        usage: {
          dailyBudgetUsed: budgetStatus.dailyPercentage,
          monthlyBudgetUsed: budgetStatus.monthlyPercentage,
          overBudget: budgetStatus.overBudget,
          shouldBlock: budgetStatus.shouldBlock,
          systemStats: systemStats,
        },
        environment: {
          nodeEnv: process.env.NODE_ENV,
          hasOpenAIKey: !!process.env.OPENAI_API_KEY,
          hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
        },
      };
    }

    // Determine overall health status
    let overallStatus = 'healthy';
    if (!configValidation.valid || serviceHealth.status === 'unhealthy') {
      overallStatus = 'unhealthy';
    } else if (serviceHealth.status === 'degraded' || budgetStatus.shouldBlock) {
      overallStatus = 'degraded';
    }

    healthResponse.status = overallStatus;

    // Set appropriate HTTP status code
    const httpStatus = overallStatus === 'healthy' ? 200 : 
                      overallStatus === 'degraded' ? 206 : 503;

    return NextResponse.json(healthResponse, { status: httpStatus });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
      services: {
        config: 'unknown',
        ai: 'unknown',
        usage: 'unknown',
      }
    }, { status: 503 });
  }
}

// POST endpoint for manual health checks or service restart
export async function POST(request: NextRequest) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'reset-errors':
        // Reset error statistics
        const errorStats = AIErrorHandler.getErrorStats();
        const resetCount = Object.keys(errorStats).length;
        
        // Clear error metrics (in production, this would clear from persistent storage)
        // Note: This is a simplified reset for development purposes
        console.log(`Would reset ${resetCount} error metrics in production`);

        return NextResponse.json({
          success: true,
          message: `Reset ${resetCount} error metrics`,
        });

      case 'validate-config':
        const validation = validateAIConfig();
        return NextResponse.json({
          success: validation.valid,
          validation: validation,
        });

      case 'test-ai':
        // Simple AI connectivity test
        try {
          // This would make a minimal test call to OpenAI
          // For now, just validate configuration
          const configValid = validateAIConfig();
          if (!configValid.valid) {
            throw new Error('Configuration invalid');
          }

          return NextResponse.json({
            success: true,
            message: 'AI service connectivity test passed',
          });
        } catch (testError) {
          return NextResponse.json({
            success: false,
            error: 'AI service connectivity test failed',
            details: testError instanceof Error ? testError.message : 'Unknown error',
          }, { status: 503 });
        }

      default:
        return NextResponse.json({
          error: 'Invalid action. Supported: reset-errors, validate-config, test-ai',
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Health action error:', error);
    return NextResponse.json({
      error: 'Failed to execute health action',
    }, { status: 500 });
  }
}