import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { OpenAIClientManager, aiConfig, CostEstimator, RateLimiter } from '@/lib/ai-config';
import { UsageMonitor } from '@/lib/usage-monitor';
import { AIErrorHandler } from '@/lib/error-handler';
import { logger } from '@/lib/logger';
// import { BMADApiHandlers } from '@/lib/agents/api-integration'; // REMOVED - BMAD system deleted
import { trackAIChat, trackFeature } from '@/lib/monitoring/sentry-monitoring';
import { SessionManager } from '@/lib/auth/session';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatSettings {
  cefrLevel?: string;
  businessContext?: string;
  learningGoals?: string[];
  userId?: string;
}

export async function POST(request: NextRequest) {
  // Start Sentry transaction for performance monitoring
  return await Sentry.withScope(async () => {
    return await Sentry.startSpan({
      name: 'POST /api/chat',
      op: 'http.server',
      attributes: {
        'api': 'chat',
        'feature': 'ai-conversation',
      },
    }, async () => {
      let userId = 'anonymous';
      let sessionId = '';
      
      // Extract user information using SessionManager
      const sessionInfo = SessionManager.extractUserFromRequest(request);
      userId = sessionInfo.userId;
      sessionId = sessionInfo.sessionId;

      try {
        // BMAD System temporarily disabled for Story 4.1 - Direct OpenAI Integration
        // TODO: Re-enable BMAD system after chat integration is validated
        logger.info('Using direct OpenAI implementation for Story 4.1 testing', 'API', {
          userId,
          sessionId
        });

        // Original implementation as fallback
        const { message, settings, sessionId: reqSessionId, messages } = await request.json();
        sessionId = reqSessionId || '';
        userId = settings?.userId || sessionId || 'anonymous';

        // Validate input
        if (!message || typeof message !== 'string') {
          return NextResponse.json(
            { error: 'Message is required' },
            { status: 400 }
          );
        }

        // Set Sentry user context
        Sentry.setUser({ id: userId });
        Sentry.setTag('cefrLevel', settings?.cefrLevel || 'B1');
        Sentry.setTag('businessContext', settings?.businessContext || 'general');
        
        // Add breadcrumb for request
        logger.addBreadcrumb('Chat request received', 'api', {
          userId,
          sessionId,
          messageLength: message.length,
        });

        // Rate limiting check
        if (!RateLimiter.canMakeRequest(userId)) {
          return NextResponse.json(
            { error: 'Rate limit exceeded. Please wait before making another request.' },
            { status: 429 }
          );
        }

        // Usage limit check
        const usageCheck = UsageMonitor.canUserMakeRequest(userId);
        if (!usageCheck.allowed) {
          return NextResponse.json(
            { error: usageCheck.reason, tokensRemaining: usageCheck.tokensRemaining },
            { status: 429 }
          );
        }

        // System budget check
        const systemBudget = UsageMonitor.isSystemOverBudget();
        if (systemBudget.shouldBlock) {
          return NextResponse.json(
            { error: 'Service temporarily unavailable due to budget limits.' },
            { status: 503 }
          );
        }

        // Generate AI response using OpenAI with enhanced distributed tracing
        const aiResponse = await Sentry.startSpan({
          name: 'ai.chat.completion',
          op: 'ai.chat.completion',
          attributes: {
            provider: 'openai',
            model: aiConfig.openai.model.primary,
            'user.id': userId,
            'session.id': sessionId,
          },
        }, async (span) => {
          // Add distributed tracing context to span
          span.setAttributes({
            'trace.correlation': 'frontend-backend-openai',
            'api.endpoint': '/api/chat',
            'ai.message_length': message.length,
            'ai.context_messages': (messages || []).length,
          });
          
          return await generateAIResponse(message, settings, messages || [], {
            userId,
            sessionId,
            traceId: span.spanContext().traceId || 'unknown',
          });
        });
        
        // Record the request for rate limiting
        RateLimiter.recordRequest(userId);

        // Record usage for monitoring and billing
        await UsageMonitor.recordUsage(
          userId,
          sessionId,
          aiResponse.usage.model || aiConfig.openai.model.primary,
          aiResponse.usage.inputTokens,
          aiResponse.usage.outputTokens,
          aiResponse.usage.estimatedCost,
          'chat',
          {
            cefrLevel: settings?.cefrLevel,
            businessContext: settings?.businessContext,
          }
        );

        // Mark transaction as successful
        Sentry.setTag('response.messageType', aiResponse.messageType);
        Sentry.setContext('usage', aiResponse.usage);

        // Track AI chat performance with enhanced monitoring
        trackAIChat({
          userId,
          sessionId,
          messageType: aiResponse.messageType,
          responseTime: Date.now() - (request.headers.get('x-start-time') ? parseInt(request.headers.get('x-start-time')!) : Date.now()),
          tokenUsage: {
            input: aiResponse.usage.inputTokens,
            output: aiResponse.usage.outputTokens,
            total: aiResponse.usage.totalTokens,
          },
          success: true,
          model: aiResponse.usage.model || aiConfig.openai.model.primary,
          cefrLevel: settings?.cefrLevel,
          businessContext: settings?.businessContext,
        });

        // Track feature usage
        trackFeature({
          userId,
          feature: 'ai_chat',
          action: 'message_sent',
          metadata: {
            messageType: aiResponse.messageType,
            cefrLevel: settings?.cefrLevel,
            businessContext: settings?.businessContext,
          },
          success: true,
          duration: Date.now() - (request.headers.get('x-start-time') ? parseInt(request.headers.get('x-start-time')!) : Date.now()),
        });

        logger.addBreadcrumb('Chat response generated', 'api', {
          messageType: aiResponse.messageType,
          tokenUsage: aiResponse.usage.totalTokens,
        });

        return NextResponse.json({
          content: aiResponse.content,
          cefrLevel: settings?.cefrLevel || 'B1',
          messageType: aiResponse.messageType,
          sessionId: sessionId,
          usage: aiResponse.usage,
          userStats: {
            tokensRemaining: usageCheck.tokensRemaining,
            budgetRemaining: usageCheck.budgetRemaining,
          },
        });

    } catch (error) {
      // Track error with enhanced monitoring
      const errorObj = error instanceof Error ? error : new Error(String(error));
      
      // Track AI chat failure
      trackAIChat({
        userId,
        sessionId,
        messageType: 'error',
        responseTime: Date.now() - (request.headers.get('x-start-time') ? parseInt(request.headers.get('x-start-time')!) : Date.now()),
        tokenUsage: {
          input: 0,
          output: 0,
          total: 0,
        },
        success: false,
        model: aiConfig.openai.model.primary,
      });

      // Track feature failure
      trackFeature({
        userId,
        feature: 'ai_chat',
        action: 'message_failed',
        success: false,
        duration: Date.now() - (request.headers.get('x-start-time') ? parseInt(request.headers.get('x-start-time')!) : Date.now()),
      });

      // Mark transaction as error
      logger.sentryError(errorObj, 'API', {
        userId: userId,
        sessionId: sessionId,
        endpoint: 'chat',
      });

      // Use AI Error Handler for graceful error handling
      try {
        const { message: errorMessage, settings: errorSettings } = await request.json();
        const errorResponse = AIErrorHandler.handleError(
          error,
          errorMessage || 'Unknown message',
          errorSettings || {},
          sessionId || 'unknown-session',
          userId
        );

        // Determine appropriate HTTP status code
        let statusCode = 500;
        if (errorResponse.error.code === 'RATE_LIMIT_EXCEEDED') {
          statusCode = 429;
        } else if (errorResponse.error.code === 'QUOTA_EXCEEDED') {
          statusCode = 503;
        } else if (errorResponse.error.severity === 'low') {
          statusCode = 200; // Return fallback content successfully
        }

        // Return error response with fallback content if available
        return NextResponse.json({
          content: errorResponse.content,
          cefrLevel: errorSettings?.cefrLevel || 'B1',
          messageType: errorResponse.messageType,
          sessionId: sessionId,
          error: errorResponse.fallback ? undefined : {
            code: errorResponse.error.code,
            message: errorResponse.error.userMessage,
            retryable: errorResponse.error.retryable,
          },
          fallback: errorResponse.fallback,
        }, { status: statusCode });
      } catch (jsonError) {
        // If we can't parse the request JSON again, return a basic error
        return NextResponse.json({
          error: 'An unexpected error occurred',
          retryable: true,
        }, { status: 500 });
      }
      
    }
    });
  });
}

// AI Response Generation using OpenAI with distributed tracing
async function generateAIResponse(
  message: string, 
  settings: ChatSettings, 
  conversationHistory: ChatMessage[],
  traceContext?: {
    userId: string;
    sessionId: string;
    traceId: string;
  }
) {
  // Validate API key is configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'sk-your-openai-api-key-here') {
    throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY environment variable.');
  }

  const openai = OpenAIClientManager.getInstance();
  const model = aiConfig.openai.model.primary;
  const fallbackModel = aiConfig.openai.model.secondary;
  
  const cefrLevel = settings?.cefrLevel || 'B1';
  const businessContext = settings?.businessContext || 'B2B sales';
  const learningGoals = settings?.learningGoals || ['communication'];

  // Build system prompt based on CEFR level and context
  const systemPrompt = buildSystemPrompt(cefrLevel, businessContext, learningGoals);
  
  // Prepare conversation context (limit to last 10 messages for context window)
  const recentHistory = conversationHistory.slice(-10);
  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...recentHistory,
    { role: 'user', content: message }
  ];

  // Estimate input tokens for cost tracking
  const inputText = messages.map(m => m.content).join(' ');
  const estimatedInputTokens = CostEstimator.estimateTokenCount(inputText);

  try {
    // Add distributed tracing context to OpenAI request
    const completion = await Sentry.startSpan({
      name: 'openai.chat.completions.create',
      op: 'ai.completion',
      attributes: {
        'ai.provider': 'openai',
        'ai.model': aiConfig.openai.model.primary,
        'ai.max_tokens': aiConfig.openai.settings.maxTokens,
        'ai.temperature': aiConfig.openai.settings.temperature,
        ...(traceContext && {
          'user.id': traceContext.userId,
          'session.id': traceContext.sessionId,
          'trace.parent_id': traceContext.traceId,
        }),
      },
    }, async (span) => {
      // Add OpenAI-specific breadcrumb with trace correlation
      Sentry.addBreadcrumb({
        message: 'OpenAI API request initiated',
        category: 'ai.request',
        level: 'info',
        data: {
          model: aiConfig.openai.model.primary,
          messageCount: messages.length,
          estimatedTokens: estimatedInputTokens,
          traceCorrelated: Boolean(traceContext?.traceId),
          ...traceContext,
        },
      });

      return await openai.chat.completions.create({
        model: aiConfig.openai.model.primary,
        messages: messages,
        max_tokens: aiConfig.openai.settings.maxTokens,
        temperature: aiConfig.openai.settings.temperature,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      });
    });

    const responseContent = completion.choices[0]?.message?.content || 
      'I apologize, but I couldn\'t generate a response. Please try again.';

    // Determine message type based on content analysis
    const messageType = analyzeMessageType(message, responseContent);

    // Calculate usage and cost
    const usage = {
      inputTokens: estimatedInputTokens,
      outputTokens: completion.usage?.completion_tokens || 0,
      totalTokens: completion.usage?.total_tokens || 0,
      estimatedCost: CostEstimator.estimateRequestCost(
        aiConfig.openai.model.primary,
        completion.usage?.prompt_tokens || estimatedInputTokens,
        completion.usage?.completion_tokens || 0
      )
    };

    return {
      content: responseContent,
      messageType,
      usage: {
        ...usage,
        model: aiConfig.openai.model.primary,
      }
    };

  } catch (error) {
    logger.error('OpenAI API error', 'AI', { error: error instanceof Error ? error.message : String(error), model: model || 'unknown' });
    
    // Fallback to secondary model if primary fails
    if (error instanceof Error && !error.message.includes('insufficient_quota')) {
      try {
        logger.warn('Primary model failed, trying secondary model', 'AI', { primaryModel: model, fallbackModel });
        const fallbackCompletion = await openai.chat.completions.create({
          model: aiConfig.openai.model.secondary,
          messages: messages,
          max_tokens: Math.min(aiConfig.openai.settings.maxTokens, 2000),
          temperature: aiConfig.openai.settings.temperature,
        });

        const fallbackContent = fallbackCompletion.choices[0]?.message?.content || 
          'I apologize for the delay. How can I help you practice your English today?';

        return {
          content: fallbackContent,
          messageType: 'encouragement' as const,
          usage: {
            inputTokens: estimatedInputTokens,
            outputTokens: fallbackCompletion.usage?.completion_tokens || 0,
            totalTokens: fallbackCompletion.usage?.total_tokens || 0,
            estimatedCost: CostEstimator.estimateRequestCost(
              aiConfig.openai.model.secondary,
              fallbackCompletion.usage?.prompt_tokens || estimatedInputTokens,
              fallbackCompletion.usage?.completion_tokens || 0
            ),
            model: aiConfig.openai.model.secondary,
          }
        };
      } catch (fallbackError) {
        logger.error('Fallback model also failed', 'AI', { fallbackModel, error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError) });
        throw error; // Re-throw original error
      }
    }
    
    throw error;
  }
}

// Build CEFR-appropriate system prompt
function buildSystemPrompt(cefrLevel: string, businessContext: string, learningGoals: string[]): string {
  const cefrGuidelines = {
    A1: 'Use simple present tense, basic vocabulary (500-1000 words), short sentences, and familiar everyday expressions. Focus on concrete, immediate needs.',
    A2: 'Use simple past and future tenses, common vocabulary (1000-2000 words), compound sentences, and routine task descriptions. Include simple personal and work topics.',
    B1: 'Use various tenses, intermediate vocabulary (2000-3000 words), complex sentences, and can discuss experiences and opinions. Include workplace situations and problem-solving.',
    B2: 'Use sophisticated grammar, advanced vocabulary (3000-4000 words), detailed explanations, and abstract concepts. Include complex business scenarios and nuanced discussions.',
    C1: 'Use complex language structures, extensive vocabulary (4000-5000 words), implicit meanings, and sophisticated expressions. Include strategic business thinking and cultural nuances.',
    C2: 'Use virtually all language structures, comprehensive vocabulary (5000+ words), subtle distinctions, and native-like precision. Include high-level business strategy and cultural sensitivity.'
  };

  return `You are an expert English language tutor specializing in business English for ${businessContext}. 

Your student is at CEFR ${cefrLevel} level. ${cefrGuidelines[cefrLevel as keyof typeof cefrGuidelines]}

Learning goals: ${learningGoals.join(', ')}

Guidelines:
1. Always match your language complexity to the ${cefrLevel} level
2. Provide practical business scenarios for ${businessContext}
3. Offer constructive feedback and encouragement
4. Include specific language examples and phrases
5. Ask follow-up questions to encourage practice
6. Correct errors gently and provide better alternatives
7. Keep responses engaging and relevant to their work context

Be supportive, practical, and educational. Focus on real-world business communication skills.`;
}

// Analyze response to determine message type
function analyzeMessageType(userMessage: string, aiResponse: string): string {
  const userLower = userMessage.toLowerCase();
  const responseLower = aiResponse.toLowerCase();

  if (userLower.includes('hello') || userLower.includes('hi') || userLower.includes('start')) {
    return 'greeting';
  }
  
  if (responseLower.includes('practice') || responseLower.includes('try') || responseLower.includes('let\'s')) {
    return 'practice';
  }
  
  if (responseLower.includes('feedback') || responseLower.includes('good job') || responseLower.includes('well done')) {
    return 'feedback';
  }
  
  return 'encouragement';
}