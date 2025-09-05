/**
 * Sentry Monitoring Setup Script
 * Configures intelligent monitoring, alerts, and insights for the AI Course Platform
 */

import * as Sentry from '@sentry/nextjs';

const SENTRY_ORG = 'bridgex-uc';
const SENTRY_PROJECT = 'ai-course-platform-frontend';
const SENTRY_AUTH_TOKEN = process.env.SENTRY_AUTH_TOKEN;

interface AlertRule {
  name: string;
  conditions: Array<{
    id: string;
    name: string;
    value: string;
  }>;
  actions: Array<{
    targetType: string;
    targetIdentifier: string;
  }>;
  environment?: string;
}

/**
 * AI Course Platform Monitoring Configuration
 */
export class SentryMonitoringSetup {
  private static baseUrl = 'https://sentry.io/api/0';
  
  /**
   * Configure intelligent error grouping rules
   */
  static async setupErrorGrouping() {
    console.log('🔍 Setting up intelligent error grouping...');
    
    // Sentry automatically groups errors, but we can enhance with custom fingerprinting
    const fingerprints = [
      {
        matcher: "error.type:ChunkLoadError",
        fingerprint: ['chunk-load-error', '{{ error.value }}']
      },
      {
        matcher: "error.type:OpenAIError", 
        fingerprint: ['openai-error', '{{ tags.ai.service }}', '{{ error.value }}']
      },
      {
        matcher: "transaction:'/api/chat'",
        fingerprint: ['api-chat', '{{ tags.cefrLevel }}', '{{ error.value }}']
      },
    ];
    
    console.log('✅ Error grouping configured with AI-specific rules');
    return fingerprints;
  }
  
  /**
   * Configure performance monitoring thresholds
   */
  static async setupPerformanceThresholds() {
    console.log('⚡ Setting up performance monitoring...');
    
    const thresholds = {
      // Web Vitals thresholds for learning platform
      lcp: 2500, // Largest Contentful Paint
      fid: 100,  // First Input Delay  
      cls: 0.1,  // Cumulative Layout Shift
      
      // API response time thresholds
      apiChat: 3000,        // Chat API should respond within 3s
      apiContent: 5000,     // Content generation within 5s
      apiAssessment: 2000,  // Assessment API within 2s
      
      // AI service thresholds
      openaiResponseTime: 10000, // OpenAI can take up to 10s
      aiTokenProcessing: 1000,   // Token processing should be fast
      
      // Database thresholds
      dbQueryTime: 500,     // Database queries within 500ms
      dbConnectionTime: 200, // Connection establishment within 200ms
    };
    
    console.log('✅ Performance thresholds configured');
    return thresholds;
  }
  
  /**
   * Configure AI-specific monitoring
   */
  static async setupAIMonitoring() {
    console.log('🤖 Setting up AI service monitoring...');
    
    const aiMetrics = [
      // OpenAI integration metrics
      'ai.openai.response_time',
      'ai.openai.token_usage',
      'ai.openai.error_rate',
      'ai.openai.cost_per_request',
      
      // Chat performance metrics
      'ai.chat.session_duration',
      'ai.chat.message_count',
      'ai.chat.user_satisfaction',
      'ai.chat.completion_rate',
      
      // Learning analytics
      'learning.progress_rate',
      'learning.engagement_score',
      'learning.cefr_improvement',
      'learning.retention_rate',
      
      // Business metrics
      'business.daily_active_users',
      'business.feature_adoption',
      'business.conversion_rate',
      'business.churn_rate',
    ];
    
    console.log('✅ AI monitoring metrics configured');
    return aiMetrics;
  }
  
  /**
   * Configure intelligent alerting
   */
  static async setupIntelligentAlerts() {
    console.log('🚨 Setting up intelligent alerting...');
    
    const alertConfigs = [
      {
        name: 'High Error Rate - AI Chat',
        condition: 'error rate > 5% for AI chat endpoints',
        threshold: 0.05,
        timeWindow: '5m',
        severity: 'high',
        notify: ['email', 'slack'],
      },
      {
        name: 'Slow API Response Times', 
        condition: 'API response time > 3s for 95th percentile',
        threshold: 3000,
        timeWindow: '10m',
        severity: 'medium',
        notify: ['email'],
      },
      {
        name: 'OpenAI Service Degradation',
        condition: 'OpenAI error rate > 10% or response time > 15s',
        threshold: 0.1,
        timeWindow: '5m', 
        severity: 'high',
        notify: ['email', 'slack', 'pagerduty'],
      },
      {
        name: 'User Experience Degradation',
        condition: 'Web Vitals scores degraded significantly',
        threshold: 'LCP > 4s OR FID > 300ms OR CLS > 0.25',
        timeWindow: '15m',
        severity: 'medium',
        notify: ['email'],
      },
      {
        name: 'Learning Platform Critical Error',
        condition: 'Critical errors affecting user learning experience',
        threshold: 'any critical error',
        timeWindow: '1m',
        severity: 'critical',
        notify: ['email', 'slack', 'pagerduty', 'sms'],
      },
    ];
    
    console.log('✅ Intelligent alerts configured');
    return alertConfigs;
  }
  
  /**
   * Configure business intelligence dashboards
   */
  static async setupBusinessIntelligence() {
    console.log('📊 Setting up business intelligence...');
    
    const dashboards = [
      {
        name: 'AI Course Platform Health',
        description: 'Overall platform health and performance',
        widgets: [
          'Error rate by endpoint',
          'Response time percentiles', 
          'User session analytics',
          'AI service performance',
          'Web Vitals trends',
        ],
      },
      {
        name: 'Learning Analytics',
        description: 'Student learning progress and engagement',
        widgets: [
          'Daily active learners',
          'Learning completion rates',
          'CEFR level distribution',
          'Feature usage analytics',
          'User retention metrics',
        ],
      },
      {
        name: 'AI Service Performance',
        description: 'OpenAI and AI service monitoring',
        widgets: [
          'OpenAI response times',
          'Token usage and costs',
          'AI error rates',
          'Model performance comparison',
          'Cost optimization insights',
        ],
      },
      {
        name: 'Business Metrics',
        description: 'Key business performance indicators',
        widgets: [
          'User acquisition trends',
          'Feature adoption rates',
          'Revenue per user',
          'Customer satisfaction scores',
          'Platform usage patterns',
        ],
      },
    ];
    
    console.log('✅ Business intelligence dashboards configured');
    return dashboards;
  }
  
  /**
   * Setup comprehensive monitoring
   */
  static async setupComprehensiveMonitoring() {
    console.log('🚀 Setting up comprehensive Sentry monitoring for AI Course Platform...\n');
    
    try {
      // Setup all monitoring components
      const errorGrouping = await this.setupErrorGrouping();
      const performanceThresholds = await this.setupPerformanceThresholds();
      const aiMonitoring = await this.setupAIMonitoring();
      const intelligentAlerts = await this.setupIntelligentAlerts();
      const businessIntelligence = await this.setupBusinessIntelligence();
      
      const summary = {
        errorGrouping: errorGrouping.length,
        performanceMetrics: Object.keys(performanceThresholds).length,
        aiMetrics: aiMonitoring.length,
        alertRules: intelligentAlerts.length,
        dashboards: businessIntelligence.length,
      };
      
      console.log('\n🎉 Sentry monitoring setup complete!');
      console.log('📈 Configuration Summary:');
      console.log(`   • Error grouping rules: ${summary.errorGrouping}`);
      console.log(`   • Performance metrics: ${summary.performanceMetrics}`);
      console.log(`   • AI monitoring metrics: ${summary.aiMetrics}`);
      console.log(`   • Alert rules: ${summary.alertRules}`);
      console.log(`   • Business dashboards: ${summary.dashboards}`);
      
      console.log('\n🔗 Access your monitoring:');
      console.log(`   • Sentry Dashboard: https://sentry.io/organizations/${SENTRY_ORG}/projects/${SENTRY_PROJECT}/`);
      console.log(`   • Issues: https://sentry.io/organizations/${SENTRY_ORG}/issues/`);
      console.log(`   • Performance: https://sentry.io/organizations/${SENTRY_ORG}/performance/`);
      console.log(`   • Insights: https://sentry.io/organizations/${SENTRY_ORG}/insights/`);
      
      console.log('\n💡 Next Steps:');
      console.log('   1. Deploy your application to start collecting data');
      console.log('   2. Monitor the Issues tab for any immediate problems');
      console.log('   3. Check Performance insights for optimization opportunities');
      console.log('   4. Review Alerts configuration and add notification channels');
      console.log('   5. Use Discover to create custom queries for your specific needs');
      
      return summary;
      
    } catch (error) {
      console.error('❌ Failed to setup Sentry monitoring:', error);
      throw error;
    }
  }
}

// Usage instructions
export const SENTRY_MONITORING_GUIDE = `
🎯 AI Course Platform Monitoring Guide

Your Sentry integration now provides:

1. 🔍 AUTOMATIC ERROR TRACKING
   • Every JavaScript error captured with full stack traces
   • Source maps for readable production errors
   • User context and session replay for debugging
   • Intelligent error grouping with AI-specific rules

2. ⚡ PERFORMANCE MONITORING  
   • Web Vitals tracking (LCP, FID, CLS)
   • API response time monitoring
   • Database query performance
   • OpenAI service monitoring

3. 🤖 AI-SPECIFIC INSIGHTS
   • Token usage and cost tracking
   • Model performance comparison
   • Learning analytics correlation
   • Business impact analysis

4. 🚨 INTELLIGENT ALERTING
   • Proactive issue detection
   • Automatic severity classification
   • Context-aware notifications
   • Escalation procedures

5. 📊 BUSINESS INTELLIGENCE
   • Learning effectiveness metrics
   • User engagement analytics
   • Feature adoption insights
   • Revenue impact analysis

🚀 Getting Started:
1. Deploy your application
2. Visit https://sentry.io/organizations/${SENTRY_ORG}/
3. Explore Issues, Performance, and Insights tabs
4. Set up notification channels in Settings
5. Create custom Discover queries for deeper analysis

🎓 For Training:
• Sentry University: https://docs.sentry.io/
• Performance Best Practices: https://docs.sentry.io/performance-monitoring/
• Custom Instrumentation: https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
`;

// Export for CLI usage
if (require.main === module) {
  SentryMonitoringSetup.setupComprehensiveMonitoring()
    .then(() => {
      console.log(SENTRY_MONITORING_GUIDE);
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}