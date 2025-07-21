/**
 * Unified Error Handling Utilities
 * Consolidates error handling patterns across the application
 */

import { log } from './logger';
import { AIErrorHandler } from './error-handler';

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly context?: Record<string, any>;

  constructor(
    message: string,
    code: string = 'GENERAL_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string, value?: any) {
    super(message, 'VALIDATION_ERROR', 400, true, { field, value });
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 'AUTH_ERROR', 401, true);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 'AUTHORIZATION_ERROR', 403, true);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 'NOT_FOUND', 404, true, { resource });
    this.name = 'NotFoundError';
  }
}

export class RateLimitError extends AppError {
  constructor(limit: number, resetTime?: Date) {
    super('Rate limit exceeded', 'RATE_LIMIT', 429, true, { limit, resetTime });
    this.name = 'RateLimitError';
  }
}

export class AIServiceError extends AppError {
  constructor(message: string, provider: string, model?: string) {
    super(message, 'AI_SERVICE_ERROR', 502, true, { provider, model });
    this.name = 'AIServiceError';
  }
}

/**
 * Unified error handling utilities
 */
export class ErrorHandler {
  /**
   * Handle and log errors with context
   */
  static handle(error: unknown, context: string, metadata?: Record<string, any>): AppError {
    const appError = this.normalize(error);
    
    // Log the error with appropriate level
    if (appError.statusCode >= 500) {
      log.error(appError.message, context, { 
        ...metadata, 
        code: appError.code,
        stack: appError.stack,
        context: appError.context
      });
    } else if (appError.statusCode >= 400) {
      log.warn(appError.message, context, { 
        ...metadata, 
        code: appError.code,
        context: appError.context
      });
    } else {
      log.info(appError.message, context, { 
        ...metadata, 
        code: appError.code
      });
    }

    return appError;
  }

  /**
   * Convert unknown error to AppError
   */
  static normalize(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    if (error instanceof Error) {
      // Handle specific error types
      if (error.name === 'ValidationError') {
        return new ValidationError(error.message);
      }
      
      if (error.message.includes('rate limit') || error.message.includes('429')) {
        return new RateLimitError(60); // Default 60 requests limit
      }
      
      if (error.message.includes('unauthorized') || error.message.includes('401')) {
        return new AuthenticationError(error.message);
      }
      
      if (error.message.includes('forbidden') || error.message.includes('403')) {
        return new AuthorizationError(error.message);
      }
      
      if (error.message.includes('not found') || error.message.includes('404')) {
        return new NotFoundError('Resource');
      }

      // Check for AI service errors
      if (error.message.includes('openai') || error.message.includes('OpenAI')) {
        return new AIServiceError(error.message, 'OpenAI');
      }

      return new AppError(error.message, 'UNKNOWN_ERROR', 500, true);
    }

    if (typeof error === 'string') {
      return new AppError(error, 'STRING_ERROR', 500, true);
    }

    return new AppError('An unknown error occurred', 'UNKNOWN_ERROR', 500, false);
  }

  /**
   * Create API response for errors
   */
  static toResponse(error: AppError): {
    success: false;
    error: {
      code: string;
      message: string;
      statusCode: number;
      context?: Record<string, any>;
    };
  } {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        statusCode: error.statusCode,
        ...(process.env.NODE_ENV === 'development' && { context: error.context })
      }
    };
  }

  /**
   * Handle AI-specific errors with fallback
   */
  static async handleAIError<T>(
    operation: () => Promise<T>,
    fallback: () => T,
    context: string,
    metadata?: Record<string, any>
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      const aiError = AIErrorHandler.classifyError(error);
      
      log.error(`AI operation failed: ${aiError.message}`, context, {
        ...metadata,
        errorCode: aiError.code,
        retryable: aiError.retryable,
        fallbackAvailable: aiError.fallbackAvailable
      });

      if (aiError.fallbackAvailable) {
        log.info('Using fallback for AI operation', context, metadata);
        return fallback();
      }

      throw this.normalize(error);
    }
  }

  /**
   * Retry operation with exponential backoff
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxAttempts: number = 3,
    baseDelay: number = 1000,
    context?: string
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts) {
          break;
        }

        const appError = this.normalize(error);
        if (!this.isRetryable(appError)) {
          break;
        }

        const delay = baseDelay * Math.pow(2, attempt - 1);
        log.warn(`Operation failed, retrying in ${delay}ms (attempt ${attempt}/${maxAttempts})`, context || 'RETRY', {
          error: appError.message,
          attempt,
          delay
        });

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw this.normalize(lastError);
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: AppError): boolean {
    // Don't retry client errors (4xx) except rate limits
    if (error.statusCode >= 400 && error.statusCode < 500) {
      return error.code === 'RATE_LIMIT';
    }

    // Retry server errors (5xx) and network errors
    return error.statusCode >= 500 || error.code === 'NETWORK_ERROR';
  }

  /**
   * Validate and throw if invalid
   */
  static validate(condition: boolean, message: string, field?: string, value?: any): void {
    if (!condition) {
      throw new ValidationError(message, field, value);
    }
  }

  /**
   * Assert and throw if false
   */
  static assert(condition: boolean, message: string, code?: string): void {
    if (!condition) {
      throw new AppError(message, code || 'ASSERTION_ERROR', 500, true);
    }
  }

  /**
   * Wrap async function with error handling
   */
  static wrap<TArgs extends any[], TReturn>(
    fn: (...args: TArgs) => Promise<TReturn>,
    context: string
  ): (...args: TArgs) => Promise<TReturn> {
    return async (...args: TArgs): Promise<TReturn> => {
      try {
        return await fn(...args);
      } catch (error) {
        throw this.handle(error, context);
      }
    };
  }
}

/**
 * Convenience error handling decorators and utilities
 */
export const handleError = ErrorHandler.handle;
export const normalizeError = ErrorHandler.normalize;
export const retryOperation = ErrorHandler.retry;
export const validateInput = ErrorHandler.validate;
export const assertCondition = ErrorHandler.assert;
export const wrapAsync = ErrorHandler.wrap;

/**
 * Common error patterns
 */
export const commonErrors = {
  required: (field: string) => new ValidationError(`${field} is required`, field),
  invalid: (field: string, value: any) => new ValidationError(`Invalid ${field}`, field, value),
  notFound: (resource: string) => new NotFoundError(resource),
  unauthorized: () => new AuthenticationError(),
  forbidden: () => new AuthorizationError(),
  rateLimit: (limit: number) => new RateLimitError(limit),
  aiService: (message: string, provider: string) => new AIServiceError(message, provider)
};

/**
 * Error boundary for React components
 */
export class ErrorBoundary {
  static handleComponentError(error: Error, errorInfo: any, componentName: string): void {
    log.error(`Component error in ${componentName}`, 'COMPONENT', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }
}