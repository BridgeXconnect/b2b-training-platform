/**
 * Sentry Dashboard Configurations for AI Course Platform
 * These configurations can be used to create dashboards in the Sentry UI
 */

export interface DashboardWidget {
  title: string;
  displayType: 'line' | 'area' | 'bar' | 'table' | 'world_map' | 'big_number';
  queries: Array<{
    name: string;
    fields: string[];
    conditions: string;
    orderby?: string;
  }>;
  interval?: string;
}

export interface DashboardConfig {
  title: string;
  description: string;
  widgets: DashboardWidget[];
}

// Application Health Dashboard
export const applicationHealthDashboard: DashboardConfig = {
  title: "AI Course Platform - Application Health",
  description: "Overall system health, error rates, and availability monitoring",
  widgets: [
    {
      title: "Error Rate",
      displayType: "line",
      queries: [{
        name: "Error Rate",
        fields: ["equation|count_if(event.type,equals,error) / count() * 100"],
        conditions: "event.type:error OR event.type:transaction",
      }],
      interval: "5m"
    },
    {
      title: "Total Events",
      displayType: "big_number",
      queries: [{
        name: "Total Events",
        fields: ["count()"],
        conditions: "",
      }]
    },
    {
      title: "Error Events by Type",
      displayType: "table",
      queries: [{
        name: "Errors by Type",
        fields: ["error.type", "count()"],
        conditions: "event.type:error",
        orderby: "-count()"
      }]
    },
    {
      title: "Performance Issues",
      displayType: "line",
      queries: [{
        name: "P95 Response Time",
        fields: ["p95(transaction.duration)"],
        conditions: "event.type:transaction",
      }]
    },
    {
      title: "Browser Distribution",
      displayType: "table",
      queries: [{
        name: "Browser Distribution",
        fields: ["browser.name", "count()"],
        conditions: "has:browser.name",
        orderby: "-count()"
      }]
    },
    {
      title: "Release Health",
      displayType: "line",
      queries: [{
        name: "Crash Free Sessions",
        fields: ["percentage(sessions_crashed, sessions) AS crash_rate"],
        conditions: "release:*",
      }]
    }
  ]
};

// AI Chat Performance Dashboard
export const aiChatPerformanceDashboard: DashboardConfig = {
  title: "AI Course Platform - AI Chat Performance",
  description: "AI chat system performance, API response times, and user interactions",
  widgets: [
    {
      title: "AI API Response Time",
      displayType: "line",
      queries: [{
        name: "OpenAI API Response Time",
        fields: ["avg(measurements.ai_response_time)"],
        conditions: "transaction.op:ai.chat.completion",
      }]
    },
    {
      title: "Chat Success Rate",
      displayType: "big_number",
      queries: [{
        name: "Chat Success Rate",
        fields: ["equation|(count_if(transaction.status,equals,ok) / count()) * 100"],
        conditions: "transaction:/api/chat",
      }]
    },
    {
      title: "AI Service Errors",
      displayType: "table",
      queries: [{
        name: "AI Errors",
        fields: ["error.type", "count()"],
        conditions: "error.type:*OpenAI* OR error.type:*AI* OR tags.context:AI",
        orderby: "-count()"
      }]
    },
    {
      title: "Token Usage Trends",
      displayType: "line",
      queries: [{
        name: "Token Usage",
        fields: ["sum(measurements.ai_tokens_total)"],
        conditions: "has:measurements.ai_tokens_total",
      }]
    },
    {
      title: "Chat Message Types",
      displayType: "table",
      queries: [{
        name: "Message Types",
        fields: ["tags.messageType", "count()"],
        conditions: "has:tags.messageType",
        orderby: "-count()"
      }]
    },
    {
      title: "User Engagement",
      displayType: "line",
      queries: [{
        name: "Active Chat Sessions",
        fields: ["count_unique(user.id)"],
        conditions: "transaction:/api/chat",
      }]
    }
  ]
};

// User Experience Dashboard
export const userExperienceDashboard: DashboardConfig = {
  title: "AI Course Platform - User Experience",
  description: "User journey analytics, session quality, and learning progress",
  widgets: [
    {
      title: "Session Quality Score",
      displayType: "big_number",
      queries: [{
        name: "Avg Session Quality",
        fields: ["avg(measurements.session_quality_score)"],
        conditions: "has:measurements.session_quality_score",
      }]
    },
    {
      title: "User Journey Progression",
      displayType: "line",
      queries: [{
        name: "Learning Nodes Completed",
        fields: ["count()"],
        conditions: "message:*Learning node completed*",
      }]
    },
    {
      title: "Feature Adoption",
      displayType: "table",
      queries: [{
        name: "Feature Usage",
        fields: ["tags.feature", "count_unique(user.id)"],
        conditions: "has:tags.feature",
        orderby: "-count_unique(user.id)"
      }]
    },
    {
      title: "CEFR Level Distribution",
      displayType: "table",
      queries: [{
        name: "CEFR Levels",
        fields: ["tags.cefrLevel", "count_unique(user.id)"],
        conditions: "has:tags.cefrLevel",
        orderby: "-count_unique(user.id)"
      }]
    },
    {
      title: "Error Impact on Users",
      displayType: "line",
      queries: [{
        name: "Users Affected by Errors",
        fields: ["count_unique(user.id)"],
        conditions: "event.type:error",
      }]
    },
    {
      title: "Session Duration",
      displayType: "line",
      queries: [{
        name: "Avg Session Duration",
        fields: ["avg(measurements.session_duration)"],
        conditions: "has:measurements.session_duration",
      }]
    }
  ]
};

// Performance Monitoring Dashboard
export const performanceMonitoringDashboard: DashboardConfig = {
  title: "AI Course Platform - Performance Monitoring",
  description: "API performance, resource utilization, and system metrics",
  widgets: [
    {
      title: "API Response Times",
      displayType: "line",
      queries: [{
        name: "P95 API Response Time",
        fields: ["p95(transaction.duration)"],
        conditions: "transaction.op:http.server",
      }]
    },
    {
      title: "Throughput",
      displayType: "line",
      queries: [{
        name: "Requests per Minute",
        fields: ["rpm()"],
        conditions: "event.type:transaction",
      }]
    },
    {
      title: "Slowest Endpoints",
      displayType: "table",
      queries: [{
        name: "Slow Endpoints",
        fields: ["transaction", "p95(transaction.duration)", "count()"],
        conditions: "event.type:transaction",
        orderby: "-p95(transaction.duration)"
      }]
    },
    {
      title: "Database Performance",
      displayType: "line",
      queries: [{
        name: "DB Query Time",
        fields: ["avg(spans.db)"],
        conditions: "span.op:db",
      }]
    },
    {
      title: "Memory Usage",
      displayType: "line",
      queries: [{
        name: "Memory Usage",
        fields: ["avg(measurements.memory_usage)"],
        conditions: "has:measurements.memory_usage",
      }]
    },
    {
      title: "Cache Hit Rate",
      displayType: "big_number",
      queries: [{
        name: "Cache Hit Rate",
        fields: ["avg(measurements.cache_hit_rate)"],
        conditions: "has:measurements.cache_hit_rate",
      }]
    }
  ]
};

// Business Intelligence Dashboard
export const businessIntelligenceDashboard: DashboardConfig = {
  title: "AI Course Platform - Business Intelligence",
  description: "User engagement, learning outcomes, and business metrics",
  widgets: [
    {
      title: "Daily Active Users",
      displayType: "line",
      queries: [{
        name: "DAU",
        fields: ["count_unique(user.id)"],
        conditions: "",
      }]
    },
    {
      title: "Learning Completion Rate",
      displayType: "big_number",
      queries: [{
        name: "Completion Rate",
        fields: ["equation|(count_if(message,contains,completed) / count_if(message,contains,started)) * 100"],
        conditions: "message:*Learning* AND (message:*completed* OR message:*started*)",
      }]
    },
    {
      title: "Feature Usage Statistics",
      displayType: "table",
      queries: [{
        name: "Feature Usage",
        fields: ["tags.feature", "count()", "count_unique(user.id)"],
        conditions: "has:tags.feature",
        orderby: "-count()"
      }]
    },
    {
      title: "User Engagement Trends",
      displayType: "line",
      queries: [{
        name: "Session Count",
        fields: ["count()"],
        conditions: "message:*Chat request received*",
      }]
    },
    {
      title: "Content Generation Usage",
      displayType: "line",
      queries: [{
        name: "Content Generated",
        fields: ["count()"],
        conditions: "message:*Content generated*",
      }]
    },
    {
      title: "A/B Testing Results",
      displayType: "table",
      queries: [{
        name: "A/B Test Results",
        fields: ["tags.ab_test_variant", "avg(measurements.conversion_rate)"],
        conditions: "has:tags.ab_test_variant",
        orderby: "-avg(measurements.conversion_rate)"
      }]
    }
  ]
};

// Alert Configurations
export interface AlertRuleConfig {
  name: string;
  query: string;
  timeWindow: number;
  threshold: number;
  comparison: 'greater_than' | 'less_than' | 'equal_to';
  environment?: string;
}

export const alertConfigurations: AlertRuleConfig[] = [
  {
    name: "Critical Error Rate Alert",
    query: "event.type:error",
    timeWindow: 5,
    threshold: 5,
    comparison: 'greater_than'
  },
  {
    name: "API Performance Degradation",
    query: "event.type:transaction transaction.op:http.server",
    timeWindow: 10,
    threshold: 2000,
    comparison: 'greater_than'
  },
  {
    name: "AI Service Failure",
    query: "error.type:*OpenAI* OR error.type:*AI*",
    timeWindow: 5,
    threshold: 1,
    comparison: 'greater_than'
  },
  {
    name: "Low User Engagement",
    query: "message:*Chat request received*",
    timeWindow: 60,
    threshold: 10,
    comparison: 'less_than'
  },
  {
    name: "High Memory Usage",
    query: "measurements.memory_usage:>500",
    timeWindow: 15,
    threshold: 1,
    comparison: 'greater_than'
  }
];

export const dashboardConfigurations = {
  applicationHealthDashboard,
  aiChatPerformanceDashboard,
  userExperienceDashboard,
  performanceMonitoringDashboard,
  businessIntelligenceDashboard
};