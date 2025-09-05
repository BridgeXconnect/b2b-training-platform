/**
 * Monitoring System Configuration
 * Provides environment-specific configuration for the monitoring system
 */

export interface MonitoringConfiguration {
  scheduler: {
    healthCheckInterval: number;
    restartDelay: number;
    maxRestartAttempts: number;
    enableAutoRestart: boolean;
    enableHealthChecks: boolean;
    gracefulShutdownTimeout: number;
  };
  sentryMonitor: {
    monitorInterval: number;
    maxConcurrentFixes: number;
    minUserImpact: number;
    enableCriticalAutoFix: boolean;
    enableHighAutoFix: boolean;
    dryRun: boolean;
  };
  startup: {
    enableAutoStart: boolean;
    enableHealthChecks: boolean;
    enableSentryMonitoring: boolean;
    startupDelay: number;
    waitForMcp: boolean;
    mcpTimeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
}

/**
 * Get monitoring configuration based on environment
 */
export function getMonitoringConfig(): MonitoringConfiguration {
  const isDevelopment = process.env.NODE_ENV !== 'production';
  const isTest = process.env.NODE_ENV === 'test';

  // Test environment - minimal monitoring, fast intervals
  if (isTest) {
    return {
      scheduler: {
        healthCheckInterval: 5000, // 5 seconds
        restartDelay: 1000, // 1 second
        maxRestartAttempts: 2,
        enableAutoRestart: true,
        enableHealthChecks: true,
        gracefulShutdownTimeout: 5000, // 5 seconds
      },
      sentryMonitor: {
        monitorInterval: 30 * 1000, // 30 seconds
        maxConcurrentFixes: 1,
        minUserImpact: 1, // Fix any error in test
        enableCriticalAutoFix: true,
        enableHighAutoFix: true,
        dryRun: true, // Always dry run in tests
      },
      startup: {
        enableAutoStart: false, // Manual start in tests
        enableHealthChecks: true,
        enableSentryMonitoring: false, // Skip Sentry in tests
        startupDelay: 100, // 100ms
        waitForMcp: false,
        mcpTimeout: 5000, // 5 seconds
        retryAttempts: 1,
        retryDelay: 500, // 500ms
      },
    };
  }

  // Development environment - moderate monitoring, reasonable intervals
  if (isDevelopment) {
    return {
      scheduler: {
        healthCheckInterval: 30 * 1000, // 30 seconds
        restartDelay: 3000, // 3 seconds
        maxRestartAttempts: 3,
        enableAutoRestart: true,
        enableHealthChecks: true,
        gracefulShutdownTimeout: 15000, // 15 seconds
      },
      sentryMonitor: {
        monitorInterval: 5 * 60 * 1000, // 5 minutes
        maxConcurrentFixes: 2,
        minUserImpact: 5, // Fix errors affecting 5+ users
        enableCriticalAutoFix: true,
        enableHighAutoFix: false, // Require manual approval in dev
        dryRun: process.env.SENTRY_DRY_RUN === 'true',
      },
      startup: {
        enableAutoStart: process.env.DISABLE_AUTO_MONITORING !== 'true',
        enableHealthChecks: true,
        enableSentryMonitoring: true,
        startupDelay: 3000, // 3 seconds
        waitForMcp: true,
        mcpTimeout: 30000, // 30 seconds
        retryAttempts: 3,
        retryDelay: 5000, // 5 seconds
      },
    };
  }

  // Production environment - conservative monitoring, longer intervals
  return {
    scheduler: {
      healthCheckInterval: 60 * 1000, // 1 minute
      restartDelay: 5000, // 5 seconds
      maxRestartAttempts: 3,
      enableAutoRestart: process.env.ENABLE_AUTO_RESTART !== 'false',
      enableHealthChecks: true,
      gracefulShutdownTimeout: 30000, // 30 seconds
    },
    sentryMonitor: {
      monitorInterval: 15 * 60 * 1000, // 15 minutes
      maxConcurrentFixes: 3,
      minUserImpact: parseInt(process.env.MIN_USER_IMPACT || '10'),
      enableCriticalAutoFix: process.env.ENABLE_CRITICAL_AUTO_FIX !== 'false',
      enableHighAutoFix: process.env.ENABLE_HIGH_AUTO_FIX === 'true',
      dryRun: process.env.MONITORING_DRY_RUN === 'true',
    },
    startup: {
      enableAutoStart: process.env.DISABLE_AUTO_MONITORING !== 'true',
      enableHealthChecks: true,
      enableSentryMonitoring: true,
      startupDelay: parseInt(process.env.MONITORING_STARTUP_DELAY || '5000'),
      waitForMcp: process.env.WAIT_FOR_MCP !== 'false',
      mcpTimeout: parseInt(process.env.MCP_TIMEOUT || '60000'),
      retryAttempts: parseInt(process.env.MONITORING_RETRY_ATTEMPTS || '3'),
      retryDelay: parseInt(process.env.MONITORING_RETRY_DELAY || '10000'),
    },
  };
}

/**
 * Validate monitoring configuration
 */
export function validateConfig(config: MonitoringConfiguration): boolean {
  try {
    // Validate scheduler config
    if (config.scheduler.healthCheckInterval < 1000) {
      throw new Error('Health check interval must be at least 1 second');
    }
    if (config.scheduler.maxRestartAttempts < 1) {
      throw new Error('Max restart attempts must be at least 1');
    }

    // Validate Sentry monitor config
    if (config.sentryMonitor.monitorInterval < 30000) {
      throw new Error('Monitor interval must be at least 30 seconds');
    }
    if (config.sentryMonitor.maxConcurrentFixes < 1) {
      throw new Error('Max concurrent fixes must be at least 1');
    }

    // Validate startup config
    if (config.startup.retryAttempts < 1) {
      throw new Error('Retry attempts must be at least 1');
    }

    return true;
  } catch (error) {
    console.error('Invalid monitoring configuration:', error.message);
    return false;
  }
}

/**
 * Get default configuration
 */
export const defaultConfig = getMonitoringConfig();

/**
 * Environment variables documentation
 */
export const ENV_VARS = {
  // Production overrides
  DISABLE_AUTO_MONITORING: 'Set to "true" to disable automatic monitoring startup',
  ENABLE_AUTO_RESTART: 'Set to "false" to disable automatic service restart',
  ENABLE_CRITICAL_AUTO_FIX: 'Set to "false" to disable automatic critical error fixes',
  ENABLE_HIGH_AUTO_FIX: 'Set to "true" to enable automatic high priority error fixes',
  MONITORING_DRY_RUN: 'Set to "true" to run in dry-run mode (no actual fixes)',
  
  // Timing configuration
  MONITORING_STARTUP_DELAY: 'Startup delay in milliseconds (default: 5000)',
  MCP_TIMEOUT: 'MCP connection timeout in milliseconds (default: 60000)',
  MONITORING_RETRY_ATTEMPTS: 'Number of retry attempts (default: 3)',
  MONITORING_RETRY_DELAY: 'Delay between retries in milliseconds (default: 10000)',
  
  // Sentry configuration
  MIN_USER_IMPACT: 'Minimum users affected before auto-fixing (default: 10)',
  WAIT_FOR_MCP: 'Set to "false" to skip waiting for MCP integration',
  SENTRY_DRY_RUN: 'Development: set to "true" for dry-run mode',
} as const;