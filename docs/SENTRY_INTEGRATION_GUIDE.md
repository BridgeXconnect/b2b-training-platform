# Sentry Integration Setup Guide

## Overview

This guide covers the complete setup and management of the Sentry monitoring integration for the AI Course Platform. The integration provides automated dashboard creation, alert rule management, webhook processing, and comprehensive monitoring capabilities.

## Prerequisites

1. **Sentry Organization**: Access to a Sentry organization (`bridgex-uc`)
2. **Environment Variables**: Proper Sentry configuration in `.env.local`
3. **Integration Permissions**: Admin access to create public integrations

## Step 1: Create Sentry Public Integration

### 1.1 Access Integration Creation

Navigate to: `https://sentry.io/settings/bridgex-uc/developer-settings/new-public/`

### 1.2 Complete Integration Form

Fill out the form with these values:

**Required Fields:**
- **Name**: `AI Course Platform Monitoring Integration`
- **Author**: `BridgeX UC`
- **Webhook URL**: `https://your-domain.com/api/sentry/webhook`
  - For development: `http://localhost:3002/api/sentry/webhook`
- **Redirect URL**: `https://your-domain.com/api/sentry/setup`
  - For development: `http://localhost:3002/api/sentry/setup`

**Important Settings:**
- ✅ **Verify Installation**: Enable
- ✅ **Alert Rule Action**: Enable (crucial for programmatic alert management)

**Optional Fields:**
- **Overview**: "Comprehensive monitoring integration for AI Course Platform with automated dashboard and alert management"
- **Authorized JavaScript Origins**: Add your domain(s)

### 1.3 Save and Install

1. Click "Save Changes" to create the integration
2. Install the integration in your organization
3. Note down the integration details for configuration

## Step 2: Environment Configuration

### 2.1 Update Environment Variables

Add/update these variables in `.env.local`:

```bash
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://4019585a73fc7b0fc2a9b436fcaa1b8b@o4509757514842112.ingest.us.sentry.io/4509757643161600
SENTRY_DSN=https://e0f790fef4cd1dbf8f9e2e12e44ca625@o4509757514842112.ingest.us.sentry.io/4509757643620352
SENTRY_ORG=bridgex-uc
SENTRY_PROJECT=ai-course-platform-frontend
SENTRY_AUTH_TOKEN=your-integration-auth-token

# Sentry Integration Settings
SENTRY_WEBHOOK_SECRET=generate-random-secret-key
```

### 2.2 Generate Webhook Secret

Generate a secure random string for `SENTRY_WEBHOOK_SECRET`:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

## Step 3: Integration Testing

### 3.1 Health Check

Test the integration connection:

```bash
curl http://localhost:3002/api/sentry/integration?action=health
```

Expected response:
```json
{
  "connected": true,
  "permissions": {
    "canReadProjects": true,
    "canCreateDashboards": true,
    "canCreateAlerts": true
  },
  "organization": "bridgex-uc",
  "project": "ai-course-platform-frontend"
}
```

### 3.2 Webhook Endpoint Test

Test webhook endpoint:

```bash
curl http://localhost:3002/api/sentry/webhook
```

Expected response:
```json
{
  "status": "Sentry webhook endpoint active",
  "timestamp": "2024-01-31T..."
}
```

## Step 4: Automated Setup

### 4.1 Complete Monitoring Setup

Run the complete setup to create all dashboards and alerts:

```bash
curl -X POST http://localhost:3002/api/sentry/integration \
  -H "Content-Type: application/json" \
  -d '{"action": "setup_complete"}'
```

### 4.2 Individual Components

Create only dashboards:
```bash
curl -X POST http://localhost:3002/api/sentry/integration \
  -H "Content-Type: application/json" \
  -d '{"action": "create_dashboards"}'
```

Create only alerts:
```bash
curl -X POST http://localhost:3002/api/sentry/integration \
  -H "Content-Type: application/json" \
  -d '{"action": "create_alerts"}'
```

## Step 5: Dashboard Configuration

The integration automatically creates 5 comprehensive dashboards:

### 5.1 Application Health Dashboard
- **Purpose**: Overall system health monitoring
- **Widgets**: Error rates, total events, browser distribution, release health
- **Access**: `https://sentry.io/organizations/bridgex-uc/dashboards/`

### 5.2 AI Chat Performance Dashboard
- **Purpose**: AI-specific performance monitoring
- **Widgets**: API response times, chat success rates, token usage, user engagement
- **Metrics**: OpenAI API performance, chat interaction quality

### 5.3 User Experience Dashboard
- **Purpose**: User journey and engagement analytics
- **Widgets**: Session quality, learning progression, feature adoption, CEFR distribution
- **Focus**: User-centered metrics and learning outcomes

### 5.4 Performance Monitoring Dashboard
- **Purpose**: System performance and resource utilization
- **Widgets**: API response times, throughput, database performance, memory usage
- **Metrics**: Technical performance indicators

### 5.5 Business Intelligence Dashboard
- **Purpose**: Business metrics and user analytics
- **Widgets**: Daily active users, completion rates, feature usage, A/B testing results
- **Focus**: Business outcomes and product metrics

## Step 6: Alert Configuration

### 6.1 Automated Alert Rules

The integration creates 5 critical alert rules:

1. **Critical Error Rate Alert**
   - Triggers when error rate > 5% in 5 minutes
   - Immediate notification for system issues

2. **API Performance Degradation**
   - Triggers when API response time > 2000ms in 10 minutes
   - Performance degradation early warning

3. **AI Service Failure**
   - Triggers on any OpenAI/AI service errors
   - Critical AI functionality monitoring

4. **Low User Engagement**
   - Triggers when chat requests < 10 in 60 minutes
   - Business metric alerting

5. **High Memory Usage**
   - Triggers when memory usage > 500MB
   - Resource monitoring and capacity planning

### 6.2 Alert Management

View and manage alerts:
- Sentry UI: `https://sentry.io/organizations/bridgex-uc/alerts/rules/`
- API: `GET /api/sentry/integration?action=alerts`

## Step 7: Monitoring Integration

### 7.1 Enhanced API Monitoring

The chat API (`/api/chat/route.ts`) now includes:

- **Performance Tracking**: Response times, token usage, success rates
- **Business Metrics**: Feature usage, user engagement, learning analytics
- **Error Impact**: User-centric error tracking and recovery monitoring
- **Custom Events**: AI-specific metrics and business intelligence

### 7.2 Custom Metrics

Available custom metrics:
- `ai_response_time`: OpenAI API response times
- `ai_tokens_total`: Token usage tracking
- `session_quality_score`: User session quality
- `learning_completion_rate`: Educational outcome metrics
- `feature_adoption_*`: Feature usage statistics

## Step 8: React Component Integration

### 8.1 Monitoring Dashboard Component

Use the `SentryIntegrationManager` component:

```typescript
import { SentryIntegrationManager } from '@/components/monitoring/sentry-integration-manager';

export default function MonitoringPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Sentry Integration Management</h1>
      <SentryIntegrationManager />
    </div>
  );
}
```

### 8.2 Component Features

- **Health Monitoring**: Real-time integration status
- **Setup Management**: One-click dashboard/alert creation
- **Result Tracking**: Visual feedback on setup operations
- **Error Handling**: Clear error reporting and resolution guidance

## Troubleshooting

### Common Issues

#### 1. Permission Errors (403)
**Symptom**: API requests return 403 "Permission denied"
**Solution**: 
- Verify the integration is properly installed
- Check that the auth token has correct scopes
- Ensure the integration has "Alert Rule Action" enabled

#### 2. Webhook Not Receiving Events
**Symptom**: No webhook events received
**Solution**:
- Verify webhook URL is publicly accessible
- Check webhook secret configuration
- Ensure integration is installed and active

#### 3. Dashboard Creation Failures
**Symptom**: Dashboard creation returns errors
**Solution**:
- Verify organization and project settings
- Check dashboard widget configurations
- Ensure proper authentication

#### 4. Monitoring Data Missing
**Symptom**: Custom metrics not appearing
**Solution**:
- Verify Sentry SDK initialization
- Check custom measurement implementations
- Ensure proper error tracking integration

### Debug Commands

Check integration health:
```bash
curl http://localhost:3002/api/sentry/integration?action=health
```

List existing dashboards:
```bash
curl http://localhost:3002/api/sentry/integration?action=dashboards
```

List alert rules:
```bash
curl http://localhost:3002/api/sentry/integration?action=alerts
```

## Advanced Configuration

### Custom Dashboard Creation

Modify dashboard configurations in `lib/monitoring/sentry-dashboards.ts`:

```typescript
export const customDashboard: DashboardConfig = {
  title: "Custom Dashboard",
  description: "Your custom monitoring dashboard",
  widgets: [
    // Your custom widgets
  ]
};
```

### Custom Alert Rules

Add custom alert rules in `lib/monitoring/sentry-dashboards.ts`:

```typescript
export const customAlerts: AlertRuleConfig[] = [
  {
    name: "Custom Alert",
    query: "your.custom.query",
    timeWindow: 5,
    threshold: 10,
    comparison: 'greater_than'
  }
];
```

### Webhook Event Handling

Extend webhook handling in `app/api/sentry/webhook/route.ts`:

```typescript
case 'your.custom.event':
  await handleCustomEvent(event);
  break;
```

## Security Considerations

1. **Webhook Secret**: Always use and validate webhook signatures
2. **Environment Variables**: Keep auth tokens secure and rotate regularly
3. **API Access**: Restrict integration permissions to minimum required
4. **Error Handling**: Avoid exposing sensitive information in error messages

## Maintenance

### Regular Tasks

1. **Monitor Integration Health**: Weekly health checks
2. **Review Alert Rules**: Monthly review and adjustment
3. **Dashboard Updates**: Quarterly dashboard optimization
4. **Token Rotation**: Rotate auth tokens every 6 months

### Performance Optimization

1. **Metric Sampling**: Adjust sample rates based on volume
2. **Dashboard Widgets**: Optimize query performance
3. **Alert Thresholds**: Fine-tune based on baseline metrics
4. **Webhook Processing**: Monitor webhook response times

## Support

For issues with this integration:

1. **Check Logs**: Review application logs for error details
2. **Health Check**: Run integration health check
3. **Sentry Documentation**: Refer to [Sentry API docs](https://docs.sentry.io/api/)
4. **Component Debug**: Use the SentryIntegrationManager component for troubleshooting

## Conclusion

This integration provides comprehensive monitoring for the AI Course Platform with automated setup, real-time alerting, and detailed analytics. The system is designed to be self-managing while providing visibility into all aspects of application performance and user experience.