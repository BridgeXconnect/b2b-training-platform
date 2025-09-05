/**
 * Sentry Integration Service
 * Handles automated dashboard and alert rule creation using integration permissions
 */

import { logger } from '@/lib/logger';
import { 
  dashboardConfigurations, 
  alertConfigurations, 
  type DashboardConfig, 
  type AlertRuleConfig 
} from '@/lib/monitoring/sentry-dashboards';

interface SentryAPIResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class SentryIntegrationService {
  private readonly baseUrl = 'https://sentry.io/api/0';
  private readonly orgSlug: string;
  private readonly projectSlug: string;
  private readonly authToken: string;

  constructor() {
    this.orgSlug = process.env.SENTRY_ORG || 'bridgex-uc';
    this.projectSlug = process.env.SENTRY_PROJECT || 'ai-course-platform-frontend';
    this.authToken = process.env.SENTRY_AUTH_TOKEN || '';
  }

  /**
   * Make authenticated request to Sentry API
   */
  private async makeRequest(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any
  ): Promise<SentryAPIResponse> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
          'Content-Type': 'application/json',
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Sentry API request failed', 'SENTRY_API', {
          endpoint,
          method,
          status: response.status,
          error: errorText,
        });
        
        return {
          success: false,
          error: `API request failed: ${response.status} - ${errorText}`,
        };
      }

      const responseData = await response.json();
      
      logger.info('Sentry API request successful', 'SENTRY_API', {
        endpoint,
        method,
        status: response.status,
      });

      return {
        success: true,
        data: responseData,
      };

    } catch (error) {
      logger.sentryError(error as Error, 'SENTRY_API_ERROR', {
        endpoint,
        method,
      });
      
      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  /**
   * Create a dashboard in Sentry
   */
  async createDashboard(config: DashboardConfig): Promise<SentryAPIResponse> {
    const dashboardData = {
      title: config.title,
      widgets: config.widgets.map(widget => ({
        title: widget.title,
        displayType: widget.displayType,
        interval: widget.interval || '5m',
        queries: widget.queries.map(query => ({
          name: query.name,
          fields: query.fields,
          conditions: query.conditions,
          orderby: query.orderby || '',
        })),
      })),
    };

    return await this.makeRequest(
      `/organizations/${this.orgSlug}/dashboards/`,
      'POST',
      dashboardData
    );
  }

  /**
   * Create all configured dashboards
   */
  async createAllDashboards(): Promise<{ created: number; failed: number; errors: string[] }> {
    const results = {
      created: 0,
      failed: 0,
      errors: [] as string[],
    };

    const dashboards = Object.values(dashboardConfigurations);
    
    logger.info('Creating Sentry dashboards', 'SENTRY_INTEGRATION', {
      count: dashboards.length,
    });

    for (const dashboard of dashboards) {
      const result = await this.createDashboard(dashboard);
      
      if (result.success) {
        results.created++;
        logger.info('Dashboard created successfully', 'SENTRY_INTEGRATION', {
          title: dashboard.title,
          id: result.data?.id,
        });
      } else {
        results.failed++;
        results.errors.push(`${dashboard.title}: ${result.error}`);
        logger.error('Dashboard creation failed', 'SENTRY_INTEGRATION', {
          title: dashboard.title,
          error: result.error,
        });
      }
    }

    return results;
  }

  /**
   * Create an alert rule in Sentry
   */
  async createAlertRule(config: AlertRuleConfig): Promise<SentryAPIResponse> {
    const alertData = {
      name: config.name,
      query: config.query,
      timeWindow: config.timeWindow,
      threshold: config.threshold,
      thresholdType: config.comparison === 'greater_than' ? 1 : 0,
      environment: config.environment || null,
      projects: [this.projectSlug],
      triggers: [
        {
          label: 'critical',
          alertThreshold: config.threshold,
          actions: [
            {
              type: 'email',
              targetType: 'team',
              targetIdentifier: 'team:everyone', // Adjust as needed
            },
          ],
        },
      ],
    };

    return await this.makeRequest(
      `/organizations/${this.orgSlug}/alert-rules/`,
      'POST',
      alertData
    );
  }

  /**
   * Create all configured alert rules
   */
  async createAllAlertRules(): Promise<{ created: number; failed: number; errors: string[] }> {
    const results = {
      created: 0,
      failed: 0,
      errors: [] as string[],
    };

    logger.info('Creating Sentry alert rules', 'SENTRY_INTEGRATION', {
      count: alertConfigurations.length,
    });

    for (const alertConfig of alertConfigurations) {
      const result = await this.createAlertRule(alertConfig);
      
      if (result.success) {
        results.created++;
        logger.info('Alert rule created successfully', 'SENTRY_INTEGRATION', {
          name: alertConfig.name,
          id: result.data?.id,
        });
      } else {
        results.failed++;
        results.errors.push(`${alertConfig.name}: ${result.error}`);
        logger.error('Alert rule creation failed', 'SENTRY_INTEGRATION', {
          name: alertConfig.name,
          error: result.error,
        });
      }
    }

    return results;
  }

  /**
   * Setup complete monitoring infrastructure
   */
  async setupCompleteMonitoring(): Promise<{
    dashboards: { created: number; failed: number; errors: string[] };
    alerts: { created: number; failed: number; errors: string[] };
  }> {
    logger.info('Setting up complete Sentry monitoring infrastructure', 'SENTRY_INTEGRATION');

    const dashboardResults = await this.createAllDashboards();
    const alertResults = await this.createAllAlertRules();

    logger.info('Monitoring setup completed', 'SENTRY_INTEGRATION', {
      dashboards: {
        created: dashboardResults.created,
        failed: dashboardResults.failed,
      },
      alerts: {
        created: alertResults.created,
        failed: alertResults.failed,
      },
    });

    return {
      dashboards: dashboardResults,
      alerts: alertResults,
    };
  }

  /**
   * Get organization projects
   */
  async getProjects(): Promise<SentryAPIResponse> {
    return await this.makeRequest(`/organizations/${this.orgSlug}/projects/`);
  }

  /**
   * Get existing dashboards
   */
  async getDashboards(): Promise<SentryAPIResponse> {
    return await this.makeRequest(`/organizations/${this.orgSlug}/dashboards/`);
  }

  /**
   * Get existing alert rules
   */
  async getAlertRules(): Promise<SentryAPIResponse> {
    return await this.makeRequest(`/organizations/${this.orgSlug}/alert-rules/`);
  }

  /**
   * Health check for integration
   */
  async healthCheck(): Promise<{
    connected: boolean;
    permissions: {
      canReadProjects: boolean;
      canCreateDashboards: boolean;
      canCreateAlerts: boolean;
    };
    organization: string;
    project: string;
  }> {
    const projectsResult = await this.getProjects();
    const dashboardsResult = await this.getDashboards();
    const alertsResult = await this.getAlertRules();

    return {
      connected: projectsResult.success,
      permissions: {
        canReadProjects: projectsResult.success,
        canCreateDashboards: dashboardsResult.success,
        canCreateAlerts: alertsResult.success,
      },
      organization: this.orgSlug,
      project: this.projectSlug,
    };
  }
}

// Export singleton instance
export const sentryIntegration = new SentryIntegrationService();