/**
 * Test endpoint to verify Sentry integration
 * Generates controlled errors for testing error tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const testType = url.searchParams.get('type') || 'error';

  try {
    switch (testType) {
      case 'error':
        // Test basic error capture
        throw new Error('Test error for Sentry integration verification');
        
      case 'agent-error':
        // Simulate an agent processing error
        Sentry.addBreadcrumb({
          message: 'BMAD Agent processing started',
          category: 'agent',
          level: 'info',
          data: {
            agentType: 'content',
            task: 'Generate lesson content',
            userId: 'test-user-123'
          }
        });
        
        // Add custom context
        Sentry.setContext('agent_context', {
          agent_id: 'agent-content-1',
          agent_type: 'content',
          task_id: 'task-12345',
          processing_time: 2500,
          complexity: 'high'
        });
        
        // Set user context
        Sentry.setUser({
          id: 'test-user-123',
          username: 'testuser',
          email: 'test@example.com'
        });
        
        throw new Error('Agent processing failed: Content generation timeout');
        
      case 'performance':
        // Test performance monitoring using Sentry v8 API
        return await Sentry.startSpan({
          name: 'BMAD Agent Processing',
          op: 'agent.process',
          attributes: {
            'agent.type': 'content',
            'task.type': 'generation',
            'processing_time': 1000
          }
        }, async (span) => {
          // Simulate processing with nested span
          await Sentry.startSpan({
            name: 'AI Content Generation',
            op: 'ai.generate',
            attributes: {
              'ai.model': 'gpt-4',
              'ai.tokens_used': 2500,
              'ai.confidence': 0.85
            }
          }, async () => {
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
          });
          
          return NextResponse.json({
            success: true,
            message: 'Performance test completed',
            type: 'performance',
            duration: '1000ms'
          });
        });
        
      case 'custom':
        // Test custom event capture
        Sentry.captureMessage('BMAD Agent System Health Check', 'info');
        
        Sentry.captureEvent({
          message: 'Agent pool status update',
          level: 'info',
          tags: {
            component: 'bmad-system',
            operation: 'health-check'
          },
          extra: {
            agent_pool: {
              total_agents: 10,
              active_agents: 3,
              queue_length: 2,
              system_health: 'healthy'
            },
            metrics: {
              requests_per_minute: 15,
              average_response_time: 1250,
              success_rate: 98.5
            }
          }
        });
        
        return NextResponse.json({
          success: true,
          message: 'Custom event sent to Sentry',
          type: 'custom'
        });
        
      case 'breadcrumbs':
        // Test breadcrumb tracking
        Sentry.addBreadcrumb({
          message: 'User initiated lesson generation',
          category: 'user.action',
          level: 'info'
        });
        
        Sentry.addBreadcrumb({
          message: 'Content agent selected',
          category: 'agent.selection',
          level: 'info',
          data: { agent_id: 'content-agent-1' }
        });
        
        Sentry.addBreadcrumb({
          message: 'AI model API call initiated',
          category: 'api.call',
          level: 'info',
          data: { model: 'gpt-4', tokens: 500 }
        });
        
        throw new Error('Processing failed after breadcrumb trail');
        
      default:
        return NextResponse.json({
          error: 'Invalid test type',
          available_types: ['error', 'agent-error', 'performance', 'custom', 'breadcrumbs']
        }, { status: 400 });
    }
    
  } catch (error) {
    // Capture the error in Sentry
    Sentry.captureException(error);
    
    return NextResponse.json({
      success: false,
      message: 'Error captured by Sentry',
      error: error.message,
      type: testType,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { message, level = 'error', context = {} } = await request.json();
    
    // Add context if provided
    if (Object.keys(context).length > 0) {
      Sentry.setContext('custom_context', context);
    }
    
    if (level === 'error') {
      throw new Error(message || 'Custom test error from POST request');
    } else {
      Sentry.captureMessage(message || 'Custom test message', level as any);
      
      return NextResponse.json({
        success: true,
        message: 'Custom message sent to Sentry',
        level,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    Sentry.captureException(error);
    
    return NextResponse.json({
      success: false,
      message: 'Error captured by Sentry',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}