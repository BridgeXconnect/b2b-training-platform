/**
 * Sentry Intelligent Alerting Configuration
 * Defines smart alerts for the AI Course Platform
 */

export interface AlertThreshold {
  metric: string;
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals';
  value: number | string;
  timeWindow: string;
  environment?: string[];
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  thresholds: AlertThreshold[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  channels: ('email' | 'slack' | 'webhook' | 'pagerduty')[];
  tags?: Record<string, string>;
  enabled: boolean;
}

/**
 * AI Course Platform Alert Configuration
 */
export const AI_COURSE_PLATFORM_ALERTS: AlertRule[] = [
  // Error Rate Alerts
  {
    id: 'high-error-rate-global',
    name: 'High Global Error Rate',
    description: 'Overall platform error rate is above acceptable threshold',
    thresholds: [
      {
        metric: 'error_rate',
        condition: 'greater_than',
        value: 5, // 5% error rate
        timeWindow: '5m',
      }
    ],
    severity: 'high',
    channels: ['email', 'slack'],
    tags: { component: 'platform', type: 'error_rate' },
    enabled: true,
  },
  
  {
    id: 'critical-error-rate-ai-chat',
    name: 'Critical Error Rate - AI Chat',
    description: 'AI chat functionality experiencing high error rates',
    thresholds: [
      {
        metric: 'error_rate',
        condition: 'greater_than',
        value: 10, // 10% error rate for AI chat
        timeWindow: '3m',
      }
    ],
    severity: 'critical',
    channels: ['email', 'slack', 'pagerduty'],
    tags: { component: 'ai_chat', type: 'error_rate' },
    enabled: true,
  },

  // Performance Alerts
  {
    id: 'slow-api-response-times',
    name: 'Slow API Response Times',
    description: 'API endpoints responding slower than acceptable thresholds',
    thresholds: [
      {
        metric: 'p95_response_time',
        condition: 'greater_than',
        value: 3000, // 3 seconds
        timeWindow: '10m',
      }
    ],
    severity: 'medium',
    channels: ['email'],
    tags: { component: 'api', type: 'performance' },
    enabled: true,
  },

  {
    id: 'critical-api-response-times',
    name: 'Critical API Response Times',
    description: 'API endpoints experiencing unacceptable response times',
    thresholds: [
      {
        metric: 'p95_response_time',
        condition: 'greater_than',
        value: 10000, // 10 seconds
        timeWindow: '5m',
      }
    ],
    severity: 'critical',
    channels: ['email', 'slack', 'pagerduty'],
    tags: { component: 'api', type: 'performance' },
    enabled: true,
  },

  // AI Service Alerts
  {
    id: 'openai-service-degradation',
    name: 'OpenAI Service Degradation',
    description: 'OpenAI service experiencing issues or degraded performance',
    thresholds: [
      {
        metric: 'ai_service_error_rate',
        condition: 'greater_than',
        value: 15, // 15% error rate
        timeWindow: '5m',
      }
    ],
    severity: 'high',
    channels: ['email', 'slack'],
    tags: { component: 'ai_service', service: 'openai', type: 'degradation' },
    enabled: true,
  },

  {
    id: 'openai-high-costs',
    name: 'OpenAI High Costs Alert',
    description: 'OpenAI usage costs exceeding budget thresholds',
    thresholds: [
      {
        metric: 'ai_service_cost_hourly',
        condition: 'greater_than',
        value: 50, // $50 per hour
        timeWindow: '1h',
      }
    ],
    severity: 'medium',
    channels: ['email', 'slack'],
    tags: { component: 'ai_service', service: 'openai', type: 'cost' },
    enabled: true,
  },

  {
    id: 'openai-quota-exhaustion',
    name: 'OpenAI Quota Near Exhaustion',
    description: 'OpenAI API quota approaching limits',
    thresholds: [
      {
        metric: 'ai_service_quota_usage',
        condition: 'greater_than',
        value: 80, // 80% of quota used
        timeWindow: '30m',
      }
    ],
    severity: 'high',
    channels: ['email', 'slack'],
    tags: { component: 'ai_service', service: 'openai', type: 'quota' },
    enabled: true,
  },

  // User Experience Alerts
  {
    id: 'web-vitals-degradation',
    name: 'Web Vitals Degradation',
    description: 'User experience metrics showing degraded performance',
    thresholds: [
      {
        metric: 'lcp_p75',
        condition: 'greater_than',
        value: 4000, // 4 seconds LCP
        timeWindow: '15m',
      }
    ],
    severity: 'medium',
    channels: ['email'],
    tags: { component: 'frontend', type: 'web_vitals' },
    enabled: true,
  },

  {
    id: 'session-replay-errors',
    name: 'High Session Replay Error Rate',
    description: 'Many user sessions showing error patterns',
    thresholds: [
      {
        metric: 'session_error_rate',
        condition: 'greater_than',
        value: 25, // 25% of sessions have errors
        timeWindow: '30m',
      }
    ],
    severity: 'high',
    channels: ['email', 'slack'],
    tags: { component: 'frontend', type: 'session_quality' },
    enabled: true,
  },

  // Learning Platform Specific Alerts
  {
    id: 'learning-completion-rate-drop',
    name: 'Learning Completion Rate Drop',
    description: 'Student completion rates dropping significantly',
    thresholds: [
      {
        metric: 'learning_completion_rate',
        condition: 'less_than',
        value: 60, // Less than 60% completion rate
        timeWindow: '2h',
      }
    ],
    severity: 'medium',
    channels: ['email'],
    tags: { component: 'learning', type: 'engagement' },
    enabled: true,
  },

  {
    id: 'user-engagement-drop',
    name: 'User Engagement Drop',
    description: 'Significant drop in user engagement metrics',
    thresholds: [
      {
        metric: 'daily_active_users',
        condition: 'less_than',
        value: 0.7, // 30% drop from baseline
        timeWindow: '4h',
      }
    ],
    severity: 'high',
    channels: ['email', 'slack'],
    tags: { component: 'platform', type: 'engagement' },
    enabled: true,
  },

  // Infrastructure Alerts
  {
    id: 'database-connection-issues',
    name: 'Database Connection Issues',
    description: 'Database experiencing connection problems',
    thresholds: [
      {
        metric: 'db_connection_error_rate',
        condition: 'greater_than',
        value: 5, // 5% connection errors
        timeWindow: '5m',
      }
    ],
    severity: 'high',
    channels: ['email', 'slack', 'pagerduty'],
    tags: { component: 'database', type: 'connection' },
    enabled: true,
  },

  {
    id: 'memory-usage-high',
    name: 'High Memory Usage',
    description: 'Application memory usage approaching limits',
    thresholds: [
      {
        metric: 'memory_usage_percentage',
        condition: 'greater_than',
        value: 85, // 85% memory usage
        timeWindow: '10m',
      }
    ],
    severity: 'medium',
    channels: ['email'],
    tags: { component: 'infrastructure', type: 'memory' },
    enabled: true,
  },

  // Security Alerts
  {
    id: 'unusual-error-patterns',
    name: 'Unusual Error Patterns Detected',
    description: 'Potential security issues or attack patterns detected',
    thresholds: [
      {
        metric: 'security_error_rate',
        condition: 'greater_than',
        value: 1, // Any security-related errors
        timeWindow: '5m',
      }
    ],
    severity: 'critical',
    channels: ['email', 'slack', 'pagerduty'],
    tags: { component: 'security', type: 'threat_detection' },
    enabled: true,
  },

  {
    id: 'failed-authentication-spike',
    name: 'Authentication Failure Spike',
    description: 'Unusual spike in authentication failures',
    thresholds: [
      {
        metric: 'auth_failure_rate',
        condition: 'greater_than',
        value: 20, // 20% auth failure rate
        timeWindow: '10m',
      }
    ],
    severity: 'high',
    channels: ['email', 'slack'],
    tags: { component: 'auth', type: 'security' },
    enabled: true,
  },
];

/**
 * Alert Channel Configuration
 */
export interface AlertChannel {
  type: 'email' | 'slack' | 'webhook' | 'pagerduty';
  name: string;
  config: Record<string, any>;
  enabled: boolean;
}

export const ALERT_CHANNELS: AlertChannel[] = [
  {
    type: 'email',
    name: 'Development Team',
    config: {
      recipients: ['dev-team@example.com'],
      subject: '[AI Course Platform] {{ alert.name }}',
    },
    enabled: true,
  },
  {
    type: 'slack',
    name: 'AI Platform Alerts',
    config: {
      webhook_url: process.env.SLACK_WEBHOOK_URL,
      channel: '#ai-platform-alerts',
      username: 'Sentry Bot',
    },
    enabled: !!process.env.SLACK_WEBHOOK_URL,
  },
  {
    type: 'webhook',
    name: 'Custom Webhook',
    config: {
      url: process.env.CUSTOM_ALERT_WEBHOOK_URL,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.WEBHOOK_API_KEY,
      },
    },
    enabled: !!process.env.CUSTOM_ALERT_WEBHOOK_URL,
  },
];

/**
 * Business Intelligence Metrics
 */
export const BUSINESS_METRICS = {
  // Learning Effectiveness
  learning_completion_rate: {
    name: 'Learning Completion Rate',
    description: 'Percentage of learning sessions completed successfully',
    target: 75, // 75% completion rate target
    critical_threshold: 50, // Alert if below 50%
  },
  
  user_engagement_score: {
    name: 'User Engagement Score',
    description: 'Composite score of user interaction and time spent',
    target: 80, // Target engagement score
    critical_threshold: 60, // Alert if below 60%
  },
  
  ai_response_quality: {
    name: 'AI Response Quality',
    description: 'Quality score of AI-generated responses',
    target: 85, // 85% quality score target
    critical_threshold: 70, // Alert if below 70%
  },
  
  // Business Metrics
  daily_active_users: {
    name: 'Daily Active Users',
    description: 'Number of unique users active daily',
    target_growth: 5, // 5% week-over-week growth
    critical_drop: -20, // Alert if 20% drop
  },
  
  feature_adoption_rate: {
    name: 'Feature Adoption Rate',
    description: 'Rate at which users adopt new features',
    target: 40, // 40% adoption within 30 days
    critical_threshold: 20, // Alert if below 20%
  },
  
  // Technical Metrics
  error_resolution_time: {
    name: 'Error Resolution Time',
    description: 'Average time to resolve critical errors',
    target: 60, // 60 minutes target
    critical_threshold: 180, // Alert if over 3 hours
  },
  
  api_availability: {
    name: 'API Availability',
    description: 'Percentage of successful API requests',
    target: 99.9, // 99.9% availability target
    critical_threshold: 98.0, // Alert if below 98%
  },
};

/**
 * Smart Alert Configuration
 */
export const SMART_ALERT_CONFIG = {
  // Anomaly detection settings
  anomaly_detection: {
    enabled: true,
    sensitivity: 'medium', // low, medium, high
    min_data_points: 100, // Minimum data points for analysis
    baseline_period: '7d', // 7 days baseline
  },
  
  // Alert fatigue prevention
  alert_fatigue_prevention: {
    enabled: true,
    max_alerts_per_hour: 10, // Max 10 alerts per hour
    similar_alert_grouping: true, // Group similar alerts
    escalation_delay: '15m', // Wait 15 minutes before escalating
  },
  
  // Business hours configuration
  business_hours: {
    timezone: 'UTC',
    weekdays: {
      start: '09:00',
      end: '17:00',
    },
    weekend_alerts: false, // Reduce non-critical alerts on weekends
  },
  
  // Auto-resolution settings
  auto_resolution: {
    enabled: true,
    conditions: [
      'error_rate < 1% for 30 minutes',
      'response_time < 1000ms for 15 minutes',
      'no_new_errors for 60 minutes',
    ],
  },
};

export default {
  alerts: AI_COURSE_PLATFORM_ALERTS,
  channels: ALERT_CHANNELS,
  metrics: BUSINESS_METRICS,
  smart_config: SMART_ALERT_CONFIG,
};