/**
 * AI Service Configuration and Client Management
 * Centralized configuration for all AI integrations
 */

import OpenAI from 'openai';

// AI Configuration Interface
export interface AIConfig {
  openai: {
    apiKey: string;
    orgId?: string;
    model: {
      primary: string;
      secondary: string;
    };
    settings: {
      maxTokens: number;
      temperature: number;
      timeout: number;
      maxRetries: number;
    };
  };
  anthropic?: {
    apiKey: string;
  };
  rateLimit: {
    maxRequestsPerMinute: number;
    maxTokensPerUserDaily: number;
  };
  budget: {
    monthlyUSD: number;
    dailyUSD: number;
  };
  content: {
    cacheEnabled: boolean;
    cacheTTLHours: number;
    cefrValidationEnabled: boolean;
    qualityThreshold: number;
  };
}

// Environment Configuration
const aiConfig: AIConfig = {
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    orgId: process.env.OPENAI_ORG_ID,
    model: {
      primary: process.env.AI_MODEL_PRIMARY || 'gpt-4-turbo-preview',
      secondary: process.env.AI_MODEL_SECONDARY || 'gpt-3.5-turbo',
    },
    settings: {
      maxTokens: parseInt(process.env.AI_MAX_TOKENS || '4000'),
      temperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
      timeout: parseInt(process.env.AI_REQUEST_TIMEOUT || '30000'),
      maxRetries: parseInt(process.env.AI_MAX_RETRIES || '3'),
    },
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
  },
  rateLimit: {
    maxRequestsPerMinute: parseInt(process.env.AI_MAX_REQUESTS_PER_MINUTE || '60'),
    maxTokensPerUserDaily: parseInt(process.env.AI_MAX_TOKENS_PER_USER_DAILY || '50000'),
  },
  budget: {
    monthlyUSD: parseInt(process.env.AI_MONTHLY_BUDGET_USD || '1000'),
    dailyUSD: parseInt(process.env.AI_DAILY_BUDGET_USD || '50'),
  },
  content: {
    cacheEnabled: process.env.CONTENT_CACHE_ENABLED === 'true',
    cacheTTLHours: parseInt(process.env.CONTENT_CACHE_TTL_HOURS || '24'),
    cefrValidationEnabled: process.env.CEFR_VALIDATION_ENABLED === 'true',
    qualityThreshold: parseFloat(process.env.QUALITY_SCORE_THRESHOLD || '0.8'),
  },
};

// Validation
export function validateAIConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!aiConfig.openai.apiKey) {
    errors.push('OPENAI_API_KEY is required');
  }

  if (aiConfig.openai.settings.maxTokens < 100 || aiConfig.openai.settings.maxTokens > 8000) {
    errors.push('AI_MAX_TOKENS must be between 100 and 8000');
  }

  if (aiConfig.openai.settings.temperature < 0 || aiConfig.openai.settings.temperature > 2) {
    errors.push('AI_TEMPERATURE must be between 0 and 2');
  }

  if (aiConfig.budget.dailyUSD <= 0 || aiConfig.budget.monthlyUSD <= 0) {
    errors.push('Budget limits must be positive numbers');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// OpenAI Client Singleton
class OpenAIClientManager {
  private static instance: OpenAI | null = null;
  private static initialized = false;

  public static getInstance(): OpenAI {
    if (!this.initialized) {
      const validation = validateAIConfig();
      if (!validation.valid) {
        throw new Error(`AI Configuration invalid: ${validation.errors.join(', ')}`);
      }

      this.instance = new OpenAI({
        apiKey: aiConfig.openai.apiKey,
        organization: aiConfig.openai.orgId,
        timeout: aiConfig.openai.settings.timeout,
        maxRetries: aiConfig.openai.settings.maxRetries,
      });

      this.initialized = true;
    }

    if (!this.instance) {
      throw new Error('Failed to initialize OpenAI client');
    }

    return this.instance;
  }

  public static reset(): void {
    this.instance = null;
    this.initialized = false;
  }
}

// Usage Tracking Interface
export interface UsageMetrics {
  requestCount: number;
  totalTokens: number;
  estimatedCost: number;
  timestamp: Date;
}

// Cost Estimation Utilities
export class CostEstimator {
  // OpenAI pricing (as of 2024)
  private static readonly PRICING = {
    'gpt-4-turbo-preview': {
      input: 0.01,   // per 1K tokens
      output: 0.03,  // per 1K tokens
    },
    'gpt-3.5-turbo': {
      input: 0.0005, // per 1K tokens
      output: 0.0015, // per 1K tokens
    },
  };

  public static estimateRequestCost(
    model: string,
    inputTokens: number,
    outputTokens: number
  ): number {
    const pricing = this.PRICING[model as keyof typeof this.PRICING];
    if (!pricing) {
      console.warn(`Unknown model for cost estimation: ${model}`);
      return 0;
    }

    const inputCost = (inputTokens / 1000) * pricing.input;
    const outputCost = (outputTokens / 1000) * pricing.output;
    
    return inputCost + outputCost;
  }

  public static estimateTokenCount(text: string): number {
    // Rough estimation: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }
}

// Rate Limiting Utilities
export class RateLimiter {
  private static requests: Map<string, number[]> = new Map();

  public static canMakeRequest(userId: string): boolean {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = aiConfig.rateLimit.maxRequestsPerMinute;

    if (!this.requests.has(userId)) {
      this.requests.set(userId, []);
    }

    const userRequests = this.requests.get(userId)!;
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => 
      now - timestamp < windowMs
    );

    // Update the stored requests
    this.requests.set(userId, validRequests);

    // Check if user can make another request
    return validRequests.length < maxRequests;
  }

  public static recordRequest(userId: string): void {
    const now = Date.now();
    
    if (!this.requests.has(userId)) {
      this.requests.set(userId, []);
    }

    this.requests.get(userId)!.push(now);
  }
}

// Export configuration and utilities
export { aiConfig, OpenAIClientManager };
export default aiConfig;