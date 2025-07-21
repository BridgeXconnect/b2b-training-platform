/**
 * Comprehensive Error Handling and Fallback System for AI Services
 * Provides graceful degradation and user-friendly error responses
 */

export interface AIError {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
  fallbackAvailable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface FallbackResponse {
  content: string;
  messageType: 'error' | 'fallback' | 'encouragement' | 'greeting';
  source: 'mock' | 'template' | 'cached';
}

export class AIErrorHandler {
  private static fallbackResponses: Map<string, string[]> = new Map([
    ['greeting', [
      'Hello! I\'m here to help you practice your English. How would you like to start today?',
      'Welcome! I\'m ready to help you improve your business English skills. What would you like to work on?',
      'Hi there! Let\'s practice some English together. What topic interests you most?'
    ]],
    ['practice', [
      'Let\'s practice together! Could you tell me more about what you\'d like to work on?',
      'I\'m here to help you practice. What specific business scenario would you like to explore?',
      'Great! Let\'s work on your English skills. What area would you like to focus on today?'
    ]],
    ['encouragement', [
      'Keep up the good work! Practice makes perfect in language learning.',
      'You\'re doing great! Every conversation helps improve your English skills.',
      'Excellent effort! Continue practicing and you\'ll see steady improvement.'
    ]],
    ['technical_error', [
      'I apologize for the technical difficulty. Let\'s try a different approach to continue our lesson.',
      'We\'re experiencing a brief technical issue. In the meantime, would you like to practice pronunciation?',
      'Sorry about that! While we resolve this, perhaps we could work on vocabulary instead?'
    ]]
  ]);

  // Classify errors and determine appropriate responses
  public static classifyError(error: unknown): AIError {
    if (!error) {
      return {
        code: 'UNKNOWN_ERROR',
        message: 'Unknown error occurred',
        userMessage: 'Something went wrong. Please try again.',
        retryable: true,
        fallbackAvailable: true,
        severity: 'medium'
      };
    }

    const errorMessage = (error as any)?.message || error?.toString() || 'Unknown error';
    const errorCode = (error as any)?.code || 'UNKNOWN';

    // OpenAI specific errors
    if (errorMessage.includes('rate_limit_exceeded')) {
      return {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'OpenAI rate limit exceeded',
        userMessage: 'I\'m getting a lot of requests right now. Please wait a moment and try again.',
        retryable: true,
        fallbackAvailable: true,
        severity: 'medium'
      };
    }

    if (errorMessage.includes('insufficient_quota')) {
      return {
        code: 'QUOTA_EXCEEDED',
        message: 'OpenAI quota exceeded',
        userMessage: 'Our AI service is temporarily unavailable. Please try again later.',
        retryable: false,
        fallbackAvailable: true,
        severity: 'high'
      };
    }

    if (errorMessage.includes('context_length_exceeded')) {
      return {
        code: 'CONTEXT_TOO_LONG',
        message: 'Context length exceeded',
        userMessage: 'Our conversation has gotten quite long! Let\'s start fresh to continue learning.',
        retryable: true,
        fallbackAvailable: true,
        severity: 'low'
      };
    }

    if (errorMessage.includes('invalid_api_key') || errorMessage.includes('authentication')) {
      return {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
        userMessage: 'We\'re experiencing technical difficulties. Please try again in a few minutes.',
        retryable: false,
        fallbackAvailable: true,
        severity: 'critical'
      };
    }

    if (errorMessage.includes('model_not_found') || errorMessage.includes('model_overloaded')) {
      return {
        code: 'MODEL_ERROR',
        message: 'AI model unavailable',
        userMessage: 'I\'m switching to a backup system. Your learning experience might be slightly different.',
        retryable: true,
        fallbackAvailable: true,
        severity: 'medium'
      };
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('ECONNRESET')) {
      return {
        code: 'TIMEOUT_ERROR',
        message: 'Request timeout',
        userMessage: 'The response is taking longer than usual. Let me try that again.',
        retryable: true,
        fallbackAvailable: true,
        severity: 'low'
      };
    }

    if (errorMessage.includes('safety') || errorMessage.includes('content_filter')) {
      return {
        code: 'CONTENT_FILTERED',
        message: 'Content filtered by safety system',
        userMessage: 'Let\'s try a different topic. What business scenario would you like to practice?',
        retryable: false,
        fallbackAvailable: true,
        severity: 'low'
      };
    }

    // Network errors
    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('network')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connectivity issue',
        userMessage: 'I\'m having trouble connecting. Please check your internet and try again.',
        retryable: true,
        fallbackAvailable: true,
        severity: 'medium'
      };
    }

    // Default classification
    return {
      code: 'GENERAL_ERROR',
      message: errorMessage,
      userMessage: 'I encountered an issue, but I\'m here to help! Let\'s continue with your English practice.',
      retryable: true,
      fallbackAvailable: true,
      severity: 'medium'
    };
  }

  // Generate fallback response based on context
  public static generateFallbackResponse(
    originalMessage: string,
    settings: {
      cefrLevel?: string;
      businessContext?: string;
      messageType?: string;
    },
    errorCode?: string
  ): FallbackResponse {
    const cefrLevel = settings.cefrLevel || 'B1';
    const businessContext = settings.businessContext || 'business English';
    
    // Determine fallback category
    let category = 'practice';
    if (originalMessage.toLowerCase().includes('hello') || originalMessage.toLowerCase().includes('hi')) {
      category = 'greeting';
    } else if (errorCode === 'TECHNICAL_ERROR' || errorCode === 'QUOTA_EXCEEDED') {
      category = 'technical_error';
    } else if (Math.random() > 0.7) {
      category = 'encouragement';
    }

    // Get appropriate responses for category
    const responses = this.fallbackResponses.get(category) || this.fallbackResponses.get('practice')!;
    const baseResponse = responses[Math.floor(Math.random() * responses.length)];

    // Customize response for CEFR level and context
    const customizedResponse = this.customizeForCEFR(baseResponse, cefrLevel, businessContext);

    return {
      content: customizedResponse,
      messageType: category === 'greeting' ? 'greeting' : 
                   category === 'encouragement' ? 'encouragement' : 'fallback',
      source: 'template'
    };
  }

  // Customize response for CEFR level appropriateness
  private static customizeForCEFR(response: string, cefrLevel: string, businessContext: string): string {
    const cefrCustomizations = {
      A1: {
        vocabulary: new Map([
          ['scenario', 'situation'],
          ['explore', 'look at'],
          ['pronunciation', 'how to say words'],
          ['technical difficulty', 'small problem'],
          ['comprehensive', 'complete']
        ]),
        addedContext: ` We can practice simple ${businessContext} conversations.`
      },
      A2: {
        vocabulary: new Map([
          ['comprehensive', 'complete'],
          ['scenario', 'work situation'],
          ['technical difficulty', 'technical problem']
        ]),
        addedContext: ` Let's work on ${businessContext} topics that help your job.`
      },
      B1: {
        vocabulary: new Map([]),
        addedContext: ` We can focus on practical ${businessContext} communication skills.`
      },
      B2: {
        vocabulary: new Map([]),
        addedContext: ` Let's work on advanced ${businessContext} scenarios and professional communication.`
      },
      C1: {
        vocabulary: new Map([
          ['practice', 'refine'],
          ['work on', 'develop'],
          ['help', 'assist you in advancing']
        ]),
        addedContext: ` We can explore sophisticated ${businessContext} communication strategies.`
      },
      C2: {
        vocabulary: new Map([
          ['practice', 'perfect'],
          ['help', 'guide you toward mastery of'],
          ['work on', 'refine your expertise in']
        ]),
        addedContext: ` Let's focus on nuanced ${businessContext} communication and cultural competency.`
      }
    };

    const customization = cefrCustomizations[cefrLevel as keyof typeof cefrCustomizations] || cefrCustomizations.B1;
    
    // Apply vocabulary substitutions
    let customizedResponse = response;
    for (const [original, replacement] of Array.from(customization.vocabulary.entries())) {
      if (typeof original === 'string' && typeof replacement === 'string') {
        customizedResponse = customizedResponse.replace(new RegExp(original, 'gi'), replacement);
      }
    }

    // Add context-appropriate ending
    customizedResponse += customization.addedContext;

    return customizedResponse;
  }

  // Generate error response with logging
  public static handleError(
    error: unknown,
    originalMessage: string,
    settings: {
      cefrLevel?: string;
      businessContext?: string;
      messageType?: string;
    },
    sessionId: string,
    userId: string
  ): {
    content: string;
    messageType: string;
    error: AIError;
    fallback: boolean;
  } {
    const aiError = this.classifyError(error);
    
    // Log error for monitoring
    this.logError(aiError, sessionId, userId, originalMessage);

    // Generate fallback response if available
    if (aiError.fallbackAvailable) {
      const fallbackResponse = this.generateFallbackResponse(
        originalMessage,
        settings,
        aiError.code
      );

      return {
        content: fallbackResponse.content,
        messageType: fallbackResponse.messageType,
        error: aiError,
        fallback: true
      };
    }

    // Use error message if no fallback
    return {
      content: aiError.userMessage,
      messageType: 'error',
      error: aiError,
      fallback: false
    };
  }

  // Log errors for monitoring and debugging
  private static logError(
    error: AIError,
    sessionId: string,
    userId: string,
    originalMessage: string
  ): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      sessionId,
      userId,
      errorCode: error.code,
      severity: error.severity,
      originalMessage: originalMessage.substring(0, 100), // Limit for privacy
      retryable: error.retryable,
      fallbackUsed: error.fallbackAvailable
    };

    // In production, send to logging service
    console.error('[AI Error]', logEntry);

    // Track error metrics
    this.trackErrorMetrics(error.code, error.severity);
  }

  // Track error metrics for monitoring
  private static errorMetrics: Map<string, number> = new Map();
  
  private static trackErrorMetrics(errorCode: string, severity: string): void {
    const key = `${errorCode}:${severity}`;
    const current = this.errorMetrics.get(key) || 0;
    this.errorMetrics.set(key, current + 1);

    // Log critical errors immediately
    if (severity === 'critical') {
      console.error(`[CRITICAL ERROR] ${errorCode} - Count: ${current + 1}`);
    }
  }

  // Get error statistics for monitoring
  public static getErrorStats(): { [key: string]: number } {
    return Object.fromEntries(this.errorMetrics);
  }

  // Health check for AI services
  public static async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    errors: string[];
    recommendations: string[];
  }> {
    const errors: string[] = [];
    const recommendations: string[] = [];
    
    // Check for high error rates
    const totalErrors = Array.from(this.errorMetrics.values()).reduce((sum, count) => sum + count, 0);
    const criticalErrors = Array.from(this.errorMetrics.entries())
      .filter(([key]) => key.includes('critical'))
      .reduce((sum, [, count]) => sum + count, 0);

    if (criticalErrors > 0) {
      errors.push(`${criticalErrors} critical errors detected`);
      recommendations.push('Check API credentials and service status');
    }

    if (totalErrors > 50) {
      errors.push('High error rate detected');
      recommendations.push('Consider enabling additional fallback mechanisms');
    }

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (criticalErrors > 0) {
      status = 'unhealthy';
    } else if (totalErrors > 20) {
      status = 'degraded';
    }

    return {
      status,
      errors,
      recommendations
    };
  }
}

export default AIErrorHandler;