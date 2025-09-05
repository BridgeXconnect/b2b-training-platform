/**
 * Startup Initialization Service
 * Handles automatic startup of monitoring systems and health checks
 */

import { monitoringScheduler } from './monitoring-scheduler';
import { autonomousSentryMonitor } from './autonomous-sentry-monitor';
import { sentryMcp } from './sentry-mcp-integration';
import { broadcastAgentActivity } from './agent-stream-utils';
import { getMonitoringConfig, validateConfig } from '../config/monitoring-config';

export interface StartupConfig {
  enableAutoStart: boolean;
  enableHealthChecks: boolean;
  enableSentryMonitoring: boolean;
  startupDelay: number; // ms
  waitForMcp: boolean;
  mcpTimeout: number; // ms
  retryAttempts: number;
  retryDelay: number; // ms
}

export interface StartupStatus {
  isInitialized: boolean;
  startTime: Date | null;
  initializationDuration: number;
  servicesStarted: string[];
  servicesFailed: string[];
  errors: string[];
}

export class StartupInitializer {
  private static instance: StartupInitializer;
  private isInitialized = false;
  private startTime: Date | null = null;
  private initializationDuration = 0;
  private servicesStarted: string[] = [];
  private servicesFailed: string[] = [];
  private errors: string[] = [];

  private config: StartupConfig = {
    enableAutoStart: true,
    enableHealthChecks: true,
    enableSentryMonitoring: true,
    startupDelay: 3000, // 3 seconds
    waitForMcp: true,
    mcpTimeout: 30000, // 30 seconds
    retryAttempts: 3,
    retryDelay: 5000, // 5 seconds
  };

  private constructor(config?: Partial<StartupConfig>) {
    // Load environment-specific configuration
    const envConfig = getMonitoringConfig();
    this.config = { ...this.config, ...envConfig.startup };
    
    // Apply any override config
    if (config) {
      this.config = { ...this.config, ...config };
    }
    
    // Validate the final configuration
    if (!validateConfig({ scheduler: envConfig.scheduler, sentryMonitor: envConfig.sentryMonitor, startup: this.config })) {
      console.warn('⚠️ Invalid startup configuration detected, using defaults');
    }
  }

  static getInstance(config?: Partial<StartupConfig>): StartupInitializer {
    if (!StartupInitializer.instance) {
      StartupInitializer.instance = new StartupInitializer(config);
    }
    return StartupInitializer.instance;
  }

  /**
   * Initialize all monitoring services
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('Startup initializer already initialized');
      return;
    }

    if (!this.config.enableAutoStart) {
      console.log('Auto-start disabled, skipping initialization');
      return;
    }

    this.startTime = new Date();
    console.log('🚀 Starting monitoring system initialization...');

    await this.broadcastActivity('startup_initialization_started', {
      config: this.config,
      timestamp: this.startTime
    });

    try {
      // Initial startup delay
      if (this.config.startupDelay > 0) {
        console.log(`⏳ Waiting ${this.config.startupDelay}ms before startup...`);
        await this.delay(this.config.startupDelay);
      }

      // Initialize services in order
      await this.initializeServices();

      this.isInitialized = true;
      this.initializationDuration = Date.now() - this.startTime.getTime();

      console.log(`✅ Monitoring system initialized successfully in ${this.initializationDuration}ms`);
      console.log(`📊 Services started: ${this.servicesStarted.join(', ')}`);
      
      if (this.servicesFailed.length > 0) {
        console.warn(`⚠️ Services failed: ${this.servicesFailed.join(', ')}`);
      }

      await this.broadcastActivity('startup_initialization_completed', {
        duration: this.initializationDuration,
        servicesStarted: this.servicesStarted,
        servicesFailed: this.servicesFailed,
        errors: this.errors,
        timestamp: new Date()
      });

    } catch (error) {
      this.errors.push(error.message);
      console.error('❌ Monitoring system initialization failed:', error);

      await this.broadcastActivity('startup_initialization_failed', {
        error: error.message,
        duration: Date.now() - this.startTime.getTime(),
        servicesStarted: this.servicesStarted,
        servicesFailed: this.servicesFailed,
        errors: this.errors,
        timestamp: new Date()
      });

      throw error;
    }
  }

  /**
   * Initialize all services with proper ordering and error handling
   */
  private async initializeServices(): Promise<void> {
    const services = [
      {
        name: 'MCP Integration',
        enabled: this.config.waitForMcp,
        init: () => this.initializeMcpIntegration()
      },
      {
        name: 'Sentry Monitor',
        enabled: this.config.enableSentryMonitoring,
        init: () => this.initializeSentryMonitor()
      },
      {
        name: 'Monitoring Scheduler',
        enabled: this.config.enableHealthChecks,
        init: () => this.initializeMonitoringScheduler()
      }
    ];

    for (const service of services) {
      if (!service.enabled) {
        console.log(`⏭️ Skipping ${service.name} (disabled)`);
        continue;
      }

      await this.initializeServiceWithRetry(service.name, service.init);
    }
  }

  /**
   * Initialize a service with retry logic
   */
  private async initializeServiceWithRetry(
    serviceName: string, 
    initFunction: () => Promise<void>
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
      try {
        console.log(`🔄 Initializing ${serviceName} (attempt ${attempt}/${this.config.retryAttempts})...`);
        
        await initFunction();
        
        this.servicesStarted.push(serviceName);
        console.log(`✅ ${serviceName} initialized successfully`);

        await this.broadcastActivity('service_started', {
          serviceName,
          attempt,
          timestamp: new Date()
        });

        return; // Success
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ ${serviceName} initialization failed (attempt ${attempt}): ${error.message}`);

        await this.broadcastActivity('service_start_failed', {
          serviceName,
          attempt,
          error: error.message,
          timestamp: new Date()
        });

        if (attempt < this.config.retryAttempts) {
          console.log(`⏳ Retrying ${serviceName} in ${this.config.retryDelay}ms...`);
          await this.delay(this.config.retryDelay);
        }
      }
    }

    // All attempts failed
    this.servicesFailed.push(serviceName);
    this.errors.push(`${serviceName}: ${lastError?.message || 'Unknown error'}`);
    
    console.error(`❌ ${serviceName} failed to initialize after ${this.config.retryAttempts} attempts`);
    
    // Don't throw error to allow other services to continue
    await this.broadcastActivity('service_startup_abandoned', {
      serviceName,
      attempts: this.config.retryAttempts,
      lastError: lastError?.message,
      timestamp: new Date()
    });
  }

  /**
   * Initialize MCP integration
   */
  private async initializeMcpIntegration(): Promise<void> {
    // Wait for MCP tools to be available
    const startTime = Date.now();
    
    while (Date.now() - startTime < this.config.mcpTimeout) {
      if (sentryMcp.isAvailable()) {
        console.log('🔗 MCP Sentry integration is available');
        return;
      }
      
      await this.delay(1000); // Check every second
    }

    throw new Error(`MCP integration not available after ${this.config.mcpTimeout}ms timeout`);
  }

  /**
   * Initialize Sentry monitor
   */
  private async initializeSentryMonitor(): Promise<void> {
    const stats = autonomousSentryMonitor.getStats();
    
    if (stats.isRunning) {
      console.log('📊 Sentry monitor already running');
      return;
    }

    await autonomousSentryMonitor.start();
    console.log('📊 Sentry monitor started');
  }

  /**
   * Initialize monitoring scheduler
   */
  private async initializeMonitoringScheduler(): Promise<void> {
    const status = monitoringScheduler.getStatus();
    
    if (status.isRunning) {
      console.log('⏰ Monitoring scheduler already running');
      return;
    }

    await monitoringScheduler.start();
    console.log('⏰ Monitoring scheduler started');
  }

  /**
   * Get current startup status
   */
  getStatus(): StartupStatus {
    return {
      isInitialized: this.isInitialized,
      startTime: this.startTime,
      initializationDuration: this.initializationDuration,
      servicesStarted: [...this.servicesStarted],
      servicesFailed: [...this.servicesFailed],
      errors: [...this.errors]
    };
  }

  /**
   * Shutdown all services gracefully
   */
  async shutdown(): Promise<void> {
    console.log('🛑 Shutting down monitoring services...');

    await this.broadcastActivity('shutdown_started', {
      timestamp: new Date()
    });

    try {
      // Stop services in reverse order
      if (this.servicesStarted.includes('Monitoring Scheduler')) {
        await monitoringScheduler.stop(true);
        console.log('⏰ Monitoring scheduler stopped');
      }

      if (this.servicesStarted.includes('Sentry Monitor')) {
        autonomousSentryMonitor.stop();
        console.log('📊 Sentry monitor stopped');
      }

      console.log('✅ All services shut down gracefully');

      await this.broadcastActivity('shutdown_completed', {
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Error during shutdown:', error);

      await this.broadcastActivity('shutdown_failed', {
        error: error.message,
        timestamp: new Date()
      });

      throw error;
    }
  }

  /**
   * Restart all services
   */
  async restart(): Promise<void> {
    console.log('🔄 Restarting monitoring services...');

    await this.broadcastActivity('restart_started', {
      timestamp: new Date()
    });

    try {
      await this.shutdown();
      
      // Reset state
      this.isInitialized = false;
      this.servicesStarted = [];
      this.servicesFailed = [];
      this.errors = [];
      
      await this.initialize();

      console.log('✅ Services restarted successfully');

      await this.broadcastActivity('restart_completed', {
        timestamp: new Date()
      });

    } catch (error) {
      console.error('❌ Restart failed:', error);

      await this.broadcastActivity('restart_failed', {
        error: error.message,
        timestamp: new Date()
      });

      throw error;
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<StartupConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Broadcast activity to dashboard
   */
  private async broadcastActivity(type: string, data: any): Promise<void> {
    try {
      await broadcastAgentActivity(type, {
        ...data,
        source: 'startup_initializer',
        agentType: 'startup'
      });
    } catch (error) {
      // Don't fail operations due to broadcast errors
      console.error('Failed to broadcast startup activity:', error);
    }
  }
}

// Export singleton instance
export const startupInitializer = StartupInitializer.getInstance();