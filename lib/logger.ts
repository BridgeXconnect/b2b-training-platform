/**
 * Production-ready logging system with Sentry integration
 * Replaces console.log statements with structured logging
 * Integrates with existing Sentry projects for error tracking
 */

import * as Sentry from '@sentry/nextjs';

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  message: string;
  context?: string;
  metadata?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  feature?: string;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Keep last 1000 logs in memory

  constructor(logLevel: LogLevel = LogLevel.INFO) {
    this.logLevel = logLevel;
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(
        process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO
      );
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.logLevel;
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // In production, send to logging service
    if (process.env.NODE_ENV === 'production') {
      this.sendToLoggingService(entry);
    } else {
      // Development: still use console for immediate feedback
      this.outputToConsole(entry);
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const context = entry.context ? `[${entry.context}]` : '';
    const metadata = entry.metadata ? JSON.stringify(entry.metadata) : '';
    const logMessage = `${timestamp} ${context} ${entry.message} ${metadata}`.trim();

    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
    }
  }

  private sendToLoggingService(entry: LogEntry): void {
    // Send to Sentry based on log level
    if (entry.level === LogLevel.ERROR) {
      // Send errors to Sentry with context
      Sentry.withScope((scope) => {
        // Add contextual information
        if (entry.context) {
          scope.setTag('context', entry.context);
        }
        if (entry.feature) {
          scope.setTag('feature', entry.feature);
        }
        if (entry.userId) {
          scope.setUser({ id: entry.userId });
        }
        if (entry.sessionId) {
          scope.setTag('sessionId', entry.sessionId);
        }
        if (entry.metadata) {
          scope.setContext('metadata', entry.metadata);
        }

        // Capture the error
        Sentry.captureException(new Error(entry.message));
      });
    } else if (entry.level === LogLevel.WARN) {
      // Send warnings as messages with lower severity
      Sentry.withScope((scope) => {
        scope.setLevel('warning');
        if (entry.context) scope.setTag('context', entry.context);
        if (entry.metadata) scope.setContext('metadata', entry.metadata);
        
        Sentry.captureMessage(entry.message, 'warning');
      });
    }

    // For performance tracking in development
    if (process.env.NODE_ENV === 'development' && entry.context === 'PERFORMANCE') {
      console.debug('Performance metric:', entry.message, entry.metadata);
    }
  }

  public error(message: string, context?: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.addLog({
        timestamp: new Date(),
        level: LogLevel.ERROR,
        message,
        context,
        metadata
      });
    }
  }

  public warn(message: string, context?: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.addLog({
        timestamp: new Date(),
        level: LogLevel.WARN,
        message,
        context,
        metadata
      });
    }
  }

  public info(message: string, context?: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.addLog({
        timestamp: new Date(),
        level: LogLevel.INFO,
        message,
        context,
        metadata
      });
    }
  }

  public debug(message: string, context?: string, metadata?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.addLog({
        timestamp: new Date(),
        level: LogLevel.DEBUG,
        message,
        context,
        metadata
      });
    }
  }

  // Convenience methods for common scenarios
  public aiRequest(message: string, metadata?: Record<string, any>): void {
    this.info(message, 'AI', metadata);
  }

  public userAction(message: string, userId?: string, metadata?: Record<string, any>): void {
    this.info(message, 'USER', { ...metadata, userId });
  }

  public apiCall(message: string, metadata?: Record<string, any>): void {
    this.info(message, 'API', metadata);
  }

  public assessment(message: string, metadata?: Record<string, any>): void {
    this.info(message, 'ASSESSMENT', metadata);
  }

  public performance(message: string, metadata?: Record<string, any>): void {
    this.debug(message, 'PERFORMANCE', metadata);
  }

  // Get recent logs for debugging
  public getRecentLogs(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  // Get logs by level
  public getLogsByLevel(level: LogLevel, count: number = 50): LogEntry[] {
    return this.logs
      .filter(log => log.level === level)
      .slice(-count);
  }

  // Get error logs
  public getErrors(count: number = 20): LogEntry[] {
    return this.getLogsByLevel(LogLevel.ERROR, count);
  }

  // Export logs for analysis
  public exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Clear logs (for memory management)
  public clearLogs(): void {
    this.logs = [];
  }

  // Sentry-specific methods for enhanced error tracking
  public sentryError(error: Error, context?: string, metadata?: Record<string, any>): void {
    Sentry.withScope((scope) => {
      if (context) scope.setTag('context', context);
      if (metadata) scope.setContext('metadata', metadata);
      
      scope.setLevel('error');
      Sentry.captureException(error);
    });

    // Also log locally
    this.error(error.message, context, { ...metadata, stack: error.stack });
  }

  public setUserContext(userId: string, email?: string, username?: string): void {
    Sentry.setUser({ 
      id: userId, 
      email, 
      username 
    });
  }

  public setLearningContext(sessionId: string, courseId?: string, lessonId?: string): void {
    Sentry.setTag('sessionId', sessionId);
    if (courseId) Sentry.setTag('courseId', courseId);
    if (lessonId) Sentry.setTag('lessonId', lessonId);
  }

  public addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
    Sentry.addBreadcrumb({
      message,
      category,
      data,
      timestamp: Date.now() / 1000,
    });
  }

  // AI-specific error tracking
  public aiError(message: string, provider: string, metadata?: Record<string, any>): void {
    this.sentryError(new Error(message), 'AI', {
      ...metadata,
      provider,
      aiOperation: true,
    });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience exports
export const log = {
  error: (message: string, context?: string, metadata?: Record<string, any>) => 
    logger.error(message, context, metadata),
  warn: (message: string, context?: string, metadata?: Record<string, any>) => 
    logger.warn(message, context, metadata),
  info: (message: string, context?: string, metadata?: Record<string, any>) => 
    logger.info(message, context, metadata),
  debug: (message: string, context?: string, metadata?: Record<string, any>) => 
    logger.debug(message, context, metadata),
  aiRequest: (message: string, metadata?: Record<string, any>) => 
    logger.aiRequest(message, metadata),
  userAction: (message: string, userId?: string, metadata?: Record<string, any>) => 
    logger.userAction(message, userId, metadata),
  apiCall: (message: string, metadata?: Record<string, any>) => 
    logger.apiCall(message, metadata),
  assessment: (message: string, metadata?: Record<string, any>) => 
    logger.assessment(message, metadata),
  performance: (message: string, metadata?: Record<string, any>) => 
    logger.performance(message, metadata)
};