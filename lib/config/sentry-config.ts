/**
 * Sentry Configuration Helper
 * Centralized configuration for optimal performance across environments
 */

export const sentryConfig = {
  // Environment-based sampling rates
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // Optimized Session Replay sampling (single instance configuration)
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // Release and environment tracking
  environment: process.env.NODE_ENV || 'development',
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 
           process.env.VERCEL_GIT_COMMIT_SHA || 
           'development',
  
  // DSN configuration
  clientDsn: process.env.NEXT_PUBLIC_SENTRY_DSN || 
             'https://4019585a73fc7b0fc2a9b436fcaa1b8b@o4509757514842112.ingest.us.sentry.io/4509757643161600',
  serverDsn: process.env.SENTRY_DSN || 
             'https://e0f790fef4cd1dbf8f9e2e12e44ca625@o4509757514842112.ingest.us.sentry.io/4509757643620352',
  
  // Debug configuration
  debug: process.env.NODE_ENV === 'development',
  
  // Performance optimization flags
  enableTracing: true,
  enableUserSession: true,
  
  // AI Platform specific tags
  tags: {
    component: 'ai-course-platform',
    platform: 'nextjs',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '2.0.0',
  },
  
  // Trace propagation targets for AI services
  tracePropagationTargets: [
    'localhost',
    /^\/api\//,
    /openai\.com/,
    /supabase\.co/,
    ...(process.env.NEXT_PUBLIC_API_URL ? [process.env.NEXT_PUBLIC_API_URL] : []),
    ...(process.env.SUPABASE_URL ? [process.env.SUPABASE_URL] : []),
  ],
  
  // Error filtering configuration
  errorFilters: {
    ignoredMessages: [
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured',
      'Loading chunk',
      'Loading CSS chunk',
      'ChunkLoadError',
    ],
    ignoredUrls: [
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
    ],
  },
};

/**
 * Get runtime-specific configuration
 */
export function getRuntimeConfig(runtime: 'browser' | 'nodejs' | 'edge') {
  const baseConfig = {
    dsn: runtime === 'browser' ? sentryConfig.clientDsn : sentryConfig.serverDsn,
    debug: sentryConfig.debug,
    environment: sentryConfig.environment,
    release: sentryConfig.release,
    tracesSampleRate: sentryConfig.tracesSampleRate,
    tracePropagationTargets: sentryConfig.tracePropagationTargets,
  };

  switch (runtime) {
    case 'browser':
      return {
        ...baseConfig,
        replaysSessionSampleRate: sentryConfig.replaysSessionSampleRate,
        replaysOnErrorSampleRate: sentryConfig.replaysOnErrorSampleRate,
        initialScope: {
          tags: {
            ...sentryConfig.tags,
            runtime: 'browser',
          },
        },
      };
      
    case 'nodejs':
      return {
        ...baseConfig,
        profilesSampleRate: sentryConfig.profilesSampleRate,
        initialScope: {
          tags: {
            ...sentryConfig.tags,
            runtime: 'nodejs',
          },
        },
      };
      
    case 'edge':
      return {
        ...baseConfig,
        // Edge runtime has limited features
        initialScope: {
          tags: {
            ...sentryConfig.tags,
            runtime: 'edge',
          },
        },
      };
      
    default:
      return baseConfig;
  }
}

/**
 * Environment-specific optimizations
 */
export const environmentOptimizations = {
  development: {
    breadcrumbsConsole: true,
    verboseLogging: true,
    replayBufferSize: 'small' as const,
  },
  staging: {
    breadcrumbsConsole: false,
    verboseLogging: false,
    replayBufferSize: 'medium' as const,
  },
  production: {
    breadcrumbsConsole: false,
    verboseLogging: false,
    replayBufferSize: 'large' as const,
    enableCompression: true,
  },
} as const;