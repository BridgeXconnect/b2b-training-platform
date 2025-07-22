/**
 * Error handling framework for CopilotKit actions
 */

import { ActionError, ActionContext } from '../types';

/**
 * Error codes enum
 */
export enum ErrorCode {
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_PARAM = 'MISSING_REQUIRED_PARAM',
  INVALID_PARAM_TYPE = 'INVALID_PARAM_TYPE',
  PARAM_OUT_OF_RANGE = 'PARAM_OUT_OF_RANGE',
  
  // Execution errors
  EXECUTION_ERROR = 'EXECUTION_ERROR',
  HANDLER_ERROR = 'HANDLER_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  
  // Resource errors
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_UNAVAILABLE = 'RESOURCE_UNAVAILABLE',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  
  // AI/ML specific
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  MODEL_NOT_AVAILABLE = 'MODEL_NOT_AVAILABLE',
  CONTEXT_TOO_LARGE = 'CONTEXT_TOO_LARGE',
  GENERATION_FAILED = 'GENERATION_FAILED',
  
  // Action specific
  ACTION_NOT_FOUND = 'ACTION_NOT_FOUND',
  ACTION_UNAVAILABLE = 'ACTION_UNAVAILABLE',
  ACTION_CHAIN_ERROR = 'ACTION_CHAIN_ERROR',
  
  // System errors
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR'
}

/**
 * Error severity levels
 */
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Extended error interface with additional metadata
 */
export interface ExtendedActionError extends ActionError {
  severity: ErrorSeverity;
  userMessage?: string;
  developerMessage?: string;
  stackTrace?: string;
  correlationId?: string;
  retryAfter?: number; // Seconds
  helpUrl?: string;
}

/**
 * Error handler class
 */
export class ErrorHandler {
  private static errorListeners: ((error: ExtendedActionError, context: ActionContext) => void)[] = [];
  
  /**
   * Create an extended error
   */
  static createError(
    code: ErrorCode | string,
    message: string,
    options?: {
      details?: any;
      recoverable?: boolean;
      severity?: ErrorSeverity;
      userMessage?: string;
      developerMessage?: string;
      stackTrace?: string;
      retryAfter?: number;
      helpUrl?: string;
    }
  ): ExtendedActionError {
    const error: ExtendedActionError = {
      code,
      message,
      details: options?.details,
      timestamp: new Date(),
      recoverable: options?.recoverable ?? this.isRecoverable(code),
      severity: options?.severity ?? this.getSeverity(code),
      userMessage: options?.userMessage,
      developerMessage: options?.developerMessage,
      stackTrace: options?.stackTrace ?? new Error().stack,
      correlationId: this.generateCorrelationId(),
      retryAfter: options?.retryAfter,
      helpUrl: options?.helpUrl ?? this.getHelpUrl(code)
    };
    
    return error;
  }
  
  /**
   * Handle an error
   */
  static async handle(
    error: any,
    context: ActionContext,
    options?: {
      log?: boolean;
      notify?: boolean;
      throwOriginal?: boolean;
    }
  ): Promise<ExtendedActionError> {
    const extendedError = this.normalizeError(error);
    
    // Log the error
    if (options?.log !== false) {
      this.logError(extendedError, context);
    }
    
    // Notify listeners
    if (options?.notify !== false) {
      this.notifyListeners(extendedError, context);
    }
    
    // Throw original if requested
    if (options?.throwOriginal) {
      throw error;
    }
    
    return extendedError;
  }
  
  /**
   * Normalize any error to ExtendedActionError
   */
  static normalizeError(error: any): ExtendedActionError {
    // If already an ExtendedActionError, return as is
    if (this.isExtendedActionError(error)) {
      return error;
    }
    
    // If it's an ActionError, extend it
    if (this.isActionError(error)) {
      return {
        ...error,
        severity: this.getSeverity(error.code),
        correlationId: this.generateCorrelationId()
      };
    }
    
    // Handle specific error types
    if (error instanceof TypeError) {
      return this.createError(
        ErrorCode.INVALID_PARAM_TYPE,
        error.message,
        {
          details: error,
          stackTrace: error.stack
        }
      );
    }
    
    if (error instanceof RangeError) {
      return this.createError(
        ErrorCode.PARAM_OUT_OF_RANGE,
        error.message,
        {
          details: error,
          stackTrace: error.stack
        }
      );
    }
    
    // Handle API errors
    if (error?.response?.status) {
      return this.handleApiError(error);
    }
    
    // Default handling
    return this.createError(
      ErrorCode.UNKNOWN_ERROR,
      error?.message || 'An unknown error occurred',
      {
        details: error,
        stackTrace: error?.stack
      }
    );
  }
  
  /**
   * Handle API errors
   */
  private static handleApiError(error: any): ExtendedActionError {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    
    switch (status) {
      case 429:
        return this.createError(
          ErrorCode.RATE_LIMIT_EXCEEDED,
          message,
          {
            details: error.response?.data,
            retryAfter: error.response?.headers?.['retry-after']
          }
        );
      
      case 403:
        return this.createError(
          ErrorCode.INSUFFICIENT_PERMISSIONS,
          message,
          {
            details: error.response?.data
          }
        );
      
      case 404:
        return this.createError(
          ErrorCode.RESOURCE_NOT_FOUND,
          message,
          {
            details: error.response?.data
          }
        );
      
      case 500:
      case 502:
      case 503:
      case 504:
        return this.createError(
          ErrorCode.AI_SERVICE_ERROR,
          message,
          {
            details: error.response?.data,
            recoverable: true
          }
        );
      
      default:
        return this.createError(
          ErrorCode.NETWORK_ERROR,
          message,
          {
            details: error.response?.data
          }
        );
    }
  }
  
  /**
   * Determine if error code is recoverable
   */
  private static isRecoverable(code: string): boolean {
    const recoverableCodes = [
      ErrorCode.TIMEOUT_ERROR,
      ErrorCode.RATE_LIMIT_EXCEEDED,
      ErrorCode.RESOURCE_UNAVAILABLE,
      ErrorCode.AI_SERVICE_ERROR,
      ErrorCode.NETWORK_ERROR
    ];
    
    return recoverableCodes.includes(code as ErrorCode);
  }
  
  /**
   * Get severity for error code
   */
  private static getSeverity(code: string): ErrorSeverity {
    const severityMap: Record<string, ErrorSeverity> = {
      [ErrorCode.VALIDATION_ERROR]: ErrorSeverity.LOW,
      [ErrorCode.MISSING_REQUIRED_PARAM]: ErrorSeverity.LOW,
      [ErrorCode.INVALID_PARAM_TYPE]: ErrorSeverity.LOW,
      [ErrorCode.PARAM_OUT_OF_RANGE]: ErrorSeverity.LOW,
      
      [ErrorCode.RATE_LIMIT_EXCEEDED]: ErrorSeverity.MEDIUM,
      [ErrorCode.QUOTA_EXCEEDED]: ErrorSeverity.MEDIUM,
      [ErrorCode.RESOURCE_NOT_FOUND]: ErrorSeverity.MEDIUM,
      
      [ErrorCode.EXECUTION_ERROR]: ErrorSeverity.HIGH,
      [ErrorCode.AI_SERVICE_ERROR]: ErrorSeverity.HIGH,
      [ErrorCode.DATABASE_ERROR]: ErrorSeverity.HIGH,
      
      [ErrorCode.SYSTEM_ERROR]: ErrorSeverity.CRITICAL,
      [ErrorCode.INSUFFICIENT_PERMISSIONS]: ErrorSeverity.CRITICAL
    };
    
    return severityMap[code] || ErrorSeverity.MEDIUM;
  }
  
  /**
   * Get help URL for error code
   */
  private static getHelpUrl(code: string): string {
    // In production, this would return actual documentation URLs
    return `https://docs.example.com/errors/${code.toLowerCase()}`;
  }
  
  /**
   * Generate correlation ID
   */
  private static generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Log error
   */
  private static logError(error: ExtendedActionError, context: ActionContext): void {
    const logData = {
      correlationId: error.correlationId,
      timestamp: error.timestamp,
      code: error.code,
      message: error.message,
      severity: error.severity,
      context: {
        userId: context.userId,
        sessionId: context.sessionId
      },
      details: error.details
    };
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('[CRITICAL ERROR]', logData);
        break;
      case ErrorSeverity.HIGH:
        console.error('[ERROR]', logData);
        break;
      case ErrorSeverity.MEDIUM:
        console.warn('[WARNING]', logData);
        break;
      case ErrorSeverity.LOW:
        console.log('[INFO]', logData);
        break;
    }
  }
  
  /**
   * Add error listener
   */
  static addListener(
    listener: (error: ExtendedActionError, context: ActionContext) => void
  ): void {
    this.errorListeners.push(listener);
  }
  
  /**
   * Remove error listener
   */
  static removeListener(
    listener: (error: ExtendedActionError, context: ActionContext) => void
  ): void {
    this.errorListeners = this.errorListeners.filter(l => l !== listener);
  }
  
  /**
   * Notify all listeners
   */
  private static notifyListeners(
    error: ExtendedActionError,
    context: ActionContext
  ): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error, context);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });
  }
  
  /**
   * Type guards
   */
  private static isActionError(error: any): error is ActionError {
    return error &&
           typeof error === 'object' &&
           'code' in error &&
           'message' in error &&
           'timestamp' in error &&
           'recoverable' in error;
  }
  
  private static isExtendedActionError(error: any): error is ExtendedActionError {
    return this.isActionError(error) && 'severity' in error;
  }
  
  /**
   * Create user-friendly error messages
   */
  static getUserMessage(error: ExtendedActionError): string {
    if (error.userMessage) {
      return error.userMessage;
    }
    
    const userMessages: Record<string, string> = {
      [ErrorCode.VALIDATION_ERROR]: 'Please check your input and try again.',
      [ErrorCode.RATE_LIMIT_EXCEEDED]: 'You\'re making too many requests. Please wait a moment and try again.',
      [ErrorCode.AI_SERVICE_ERROR]: 'Our AI service is temporarily unavailable. Please try again later.',
      [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'You don\'t have permission to perform this action.',
      [ErrorCode.NETWORK_ERROR]: 'Network connection issue. Please check your internet and try again.'
    };
    
    return userMessages[error.code] || 'An error occurred. Please try again.';
  }
}