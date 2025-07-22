import { NextRequest, NextResponse } from 'next/server';
import { OpenAIClientManager, aiConfig, CostEstimator, RateLimiter } from '@/lib/ai-config';
import { UsageMonitor } from '@/lib/usage-monitor';
import { AIErrorHandler } from '@/lib/error-handler';
import { log } from '@/lib/logger';
import { BMADApiHandlers } from '@/lib/agents/api-integration';

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
  // Try BMAD system first, fallback to original implementation
  try {
    return await BMADApiHandlers.handleChatRequest(request);
  } catch (bmadError) {
    log.warn('BMAD system failed, falling back to original implementation', 'API', { 
      error: bmadError instanceof Error ? bmadError.message : String(bmadError) 
    });
  }

  // Original implementation as fallback
  let userId = 'anonymous';
  let sessionId = '';
  
  try {
    const { message, settings, sessionId: reqSessionId, messages } = await request.json();
    sessionId = reqSessionId || '';

    // Validate input
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Extract user ID for rate limiting (from auth header or use sessionId)
    userId = settings?.userId || sessionId || 'anonymous';

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

    // Generate AI response using OpenAI
    const aiResponse = await generateAIResponse(message, settings, messages || []);
    
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
    log.error('Chat API error', 'API', { error: error instanceof Error ? error.message : String(error), userId, sessionId });
    
    // Use AI Error Handler for graceful error handling
    const { message, settings } = await request.json().catch(() => ({}));
    userId = settings?.userId || sessionId || 'anonymous';
    
    const errorResponse = AIErrorHandler.handleError(
      error,
      message || 'Unknown message',
      settings || {},
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
      cefrLevel: settings?.cefrLevel || 'B1',
      messageType: errorResponse.messageType,
      sessionId: sessionId,
      error: errorResponse.fallback ? undefined : {
        code: errorResponse.error.code,
        message: errorResponse.error.userMessage,
        retryable: errorResponse.error.retryable,
      },
      fallback: errorResponse.fallback,
    }, { status: statusCode });
  }
}

// AI Response Generation using OpenAI
async function generateAIResponse(
  message: string, 
  settings: ChatSettings, 
  conversationHistory: ChatMessage[]
) {
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
    const completion = await openai.chat.completions.create({
      model: aiConfig.openai.model.primary,
      messages: messages,
      max_tokens: aiConfig.openai.settings.maxTokens,
      temperature: aiConfig.openai.settings.temperature,
      presence_penalty: 0.1,
      frequency_penalty: 0.1,
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
    log.error('OpenAI API error', 'AI', { error: error instanceof Error ? error.message : String(error), model: model || 'unknown' });
    
    // Fallback to secondary model if primary fails
    if (error instanceof Error && !error.message.includes('insufficient_quota')) {
      try {
        log.warn('Primary model failed, trying secondary model', 'AI', { primaryModel: model, fallbackModel });
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
        log.error('Fallback model also failed', 'AI', { fallbackModel, error: fallbackError instanceof Error ? fallbackError.message : String(fallbackError) });
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