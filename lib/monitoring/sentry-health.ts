/**
 * Sentry Health Monitoring Utilities
 * Tracks Session Replay instances and configuration health
 */

import * as Sentry from '@sentry/nextjs';

export interface SentryHealthMetrics {
  sessionReplayActive: boolean;
  activeIntegrations: string[];
  samplingRates: {
    traces: number;
    replays: number;
    errors: number;
  };
  environment: string;
  runtime: string;
  dsn: string | undefined;
}

/**
 * Get current Sentry configuration health metrics
 */
export function getSentryHealthMetrics(): SentryHealthMetrics {
  const client = Sentry.getClient();
  const options = client?.getOptions();
  
  // Check for active integrations
  const integrations = options?.integrations || [];
  const activeIntegrations = integrations.map((integration: any) => 
    integration.name || integration.constructor?.name || 'unknown'
  );
  
  // Check if Session Replay is active
  const sessionReplayActive = activeIntegrations.some(name => 
    name.toLowerCase().includes('replay')
  );
  
  return {
    sessionReplayActive,
    activeIntegrations,
    samplingRates: {
      traces: options?.tracesSampleRate || 0,
      replays: options?.replaysSessionSampleRate || 0,
      errors: options?.replaysOnErrorSampleRate || 0,
    },
    environment: options?.environment || 'unknown',
    runtime: typeof window !== 'undefined' ? 'browser' : 'server',
    dsn: options?.dsn || undefined,
  };
}

/**
 * Validate that only one Session Replay instance is active
 */
export function validateSingleSessionReplay(): {
  isValid: boolean;
  issues: string[];
  recommendations: string[];
} {
  const metrics = getSentryHealthMetrics();
  const issues: string[] = [];
  const recommendations: string[] = [];
  
  // Check for multiple replay integrations
  const replayIntegrations = metrics.activeIntegrations.filter(name => 
    name.toLowerCase().includes('replay')
  );
  
  if (replayIntegrations.length > 1) {
    issues.push(`Multiple Session Replay integrations detected: ${replayIntegrations.join(', ')}`);
    recommendations.push('Consolidate to single replayIntegration() instance');
  }
  
  if (replayIntegrations.length === 0 && typeof window !== 'undefined') {
    issues.push('No Session Replay integration found in browser environment');
    recommendations.push('Add replayIntegration() to client configuration');
  }
  
  // Check sampling rates
  if (metrics.samplingRates.replays > 0.1 && metrics.environment === 'production') {
    issues.push(`High replay sampling rate in production: ${metrics.samplingRates.replays}`);
    recommendations.push('Consider reducing replaysSessionSampleRate to 0.01-0.05 for production');
  }
  
  // Check DSN configuration
  if (!metrics.dsn) {
    issues.push('No Sentry DSN configured');
    recommendations.push('Configure NEXT_PUBLIC_SENTRY_DSN environment variable');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    recommendations,
  };
}

/**
 * Log Sentry configuration summary
 */
export function logSentryHealthSummary(): void {
  const metrics = getSentryHealthMetrics();
  const validation = validateSingleSessionReplay();
  
  console.group('🔍 Sentry Configuration Health Check');
  console.log('Environment:', metrics.environment);
  console.log('Runtime:', metrics.runtime);
  console.log('Session Replay Active:', metrics.sessionReplayActive);
  console.log('Active Integrations:', metrics.activeIntegrations);
  console.log('Sampling Rates:', metrics.samplingRates);
  
  if (validation.issues.length > 0) {
    console.warn('⚠️ Configuration Issues:', validation.issues);
    console.info('💡 Recommendations:', validation.recommendations);
  } else {
    console.log('✅ Configuration appears healthy');
  }
  
  console.groupEnd();
}

/**
 * Monitor Session Replay performance impact
 */
export function monitorReplayPerformance(): {
  memoryUsage?: number;
  replayBufferSize?: number;
  networkRequests?: number;
} {
  if (typeof window === 'undefined') return {};
  
  const performance = window.performance;
  const memory = (performance as any).memory;
  
  return {
    memoryUsage: memory?.usedJSHeapSize,
    replayBufferSize: memory?.totalJSHeapSize,
    networkRequests: performance.getEntriesByType('navigation').length,
  };
}

/**
 * Development helper: Auto-validate configuration on load
 */
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Auto-validate after initial load
  setTimeout(() => {
    logSentryHealthSummary();
  }, 2000);
}