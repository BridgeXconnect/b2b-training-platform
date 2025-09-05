# Sentry Dashboard Creation Guide
## AI Course Platform Unified Monitoring System

This guide provides step-by-step instructions for creating comprehensive Sentry dashboards and intelligent alerting for the AI Course Platform's full-stack monitoring infrastructure.

## Prerequisites

### Sentry Organization Setup
- **Organization**: `bridgex-uc` (https://us.sentry.io)
- **Frontend Project**: `ai-course-platform-frontend` (Next.js v9)
- **Backend Project**: `ai-course-platform-backend` (FastAPI)
- **Admin Access**: Required for dashboard and alert creation

### Existing Infrastructure
- ✅ **Phase 1**: Frontend Next.js v9 Sentry integration with error boundaries
- ✅ **Phase 2**: Backend FastAPI Sentry integration with middleware
- ✅ **Cross-System Tracing**: Distributed trace correlation
- ✅ **Error Recovery**: Coordinated recovery across frontend/backend

---

## Dashboard 1: AI Course Platform Overview Dashboard

### Purpose
Unified system health monitoring providing executive-level visibility across the entire platform.

### Configuration Steps

#### 1. Create Dashboard
1. Navigate to **Dashboards** in Sentry
2. Click **Create Dashboard**
3. Name: `AI Course Platform - System Overview`
4. Description: `Executive dashboard showing overall platform health, error rates, and user impact metrics`

#### 2. Add Widgets

##### System Health Overview (Big Number)
```json
{
  "title": "Platform Health Score",
  "displayType": "big_number",
  "queries": [
    {
      "conditions": "",
      "fields": ["equation|((1 - (count() / count_unique(user))) * 100)"],
      "aggregates": ["equation|((1 - (count() / count_unique(user))) * 100)"],
      "columns": [],
      "orderby": "",
      "projects": ["ai-course-platform-frontend", "ai-course-platform-backend"]
    }
  ],
  "yAxis": ["equation|((1 - (count() / count_unique(user))) * 100)"]
}
```

##### Combined Error Rate Trends (Time Series)
```json
{
  "title": "Error Rate Trends (Frontend + Backend)",
  "displayType": "line",
  "queries": [
    {
      "name": "Frontend Errors",
      "conditions": "event.type:error",
      "fields": ["count()"],
      "columns": ["project"],
      "aggregates": ["count()"],
      "projects": ["ai-course-platform-frontend"]
    },
    {
      "name": "Backend Errors", 
      "conditions": "event.type:error",
      "fields": ["count()"],
      "columns": ["project"],
      "aggregates": ["count()"],
      "projects": ["ai-course-platform-backend"]
    }
  ],
  "yAxis": ["count()"]
}
```

##### User Impact Metrics (Big Number)
```json
{
  "title": "Users Affected by Errors",
  "displayType": "big_number",
  "queries": [
    {
      "conditions": "event.type:error",
      "fields": ["count_unique(user)"],
      "aggregates": ["count_unique(user)"],
      "projects": ["ai-course-platform-frontend", "ai-course-platform-backend"]
    }
  ]
}
```

##### Performance Overview (Bar Chart)
```json
{
  "title": "Average Response Times by Service",
  "displayType": "bar",
  "queries": [
    {
      "conditions": "",
      "fields": ["avg(transaction.duration)"],
      "columns": ["project"],
      "aggregates": ["avg(transaction.duration)"],
      "projects": ["ai-course-platform-frontend", "ai-course-platform-backend"]
    }
  ]
}
```

##### Cross-System Correlation (Table)
```json
{
  "title": "Top Correlated Errors",
  "displayType": "table",
  "queries": [
    {
      "conditions": "event.type:error",
      "fields": ["title", "count()", "count_unique(user)", "project"],
      "columns": ["title", "project"],
      "aggregates": ["count()", "count_unique(user)"],
      "orderby": "-count()",
      "projects": ["ai-course-platform-frontend", "ai-course-platform-backend"]
    }
  ]
}
```

---

## Dashboard 2: Learning Experience Monitoring Dashboard

### Purpose
Focus on core learning features and their impact on user education experience.

### Configuration Steps

#### 1. Create Dashboard
1. Name: `AI Course Platform - Learning Experience`
2. Description: `Monitoring learning features: voice practice, assessments, AI chat, and learning session health`

#### 2. Add Widgets

##### Voice Practice Monitoring (Time Series)
```json
{
  "title": "Voice Practice Interface Health",
  "displayType": "line",
  "queries": [
    {
      "name": "Voice Practice Errors",
      "conditions": "tags[feature]:voice_practice OR tags[section]:voice_practice",
      "fields": ["count()"],
      "aggregates": ["count()"],
      "projects": ["ai-course-platform-frontend"]
    },
    {
      "name": "Error Boundary Activations",
      "conditions": "tags[errorBoundary]:true AND tags[section]:voice_practice",
      "fields": ["count()"],
      "aggregates": ["count()"],
      "projects": ["ai-course-platform-frontend"]
    }
  ]
}
```

##### Assessment Generation Performance (Bar Chart)
```json
{
  "title": "Assessment Generator Success Rate",
  "displayType": "bar",
  "queries": [
    {
      "conditions": "tags[feature]:assessment_generator",
      "fields": ["equation|((count() - count_if(level, equals, error)) / count() * 100)"],
      "columns": ["environment"],
      "aggregates": ["equation|((count() - count_if(level, equals, error)) / count() * 100)"],
      "projects": ["ai-course-platform-frontend", "ai-course-platform-backend"]
    }
  ]
}
```

##### AI Chat Interactions Health (Time Series)
```json
{
  "title": "AI Chat Performance & Errors",
  "displayType": "line",
  "queries": [
    {
      "name": "Chat API Errors",
      "conditions": "transaction:/api/chat/* OR tags[feature]:ai_chat",
      "fields": ["count()"],
      "aggregates": ["count()"],
      "projects": ["ai-course-platform-frontend", "ai-course-platform-backend"]
    },
    {
      "name": "Chat Response Time",
      "conditions": "transaction:/api/chat/*",
      "fields": ["avg(transaction.duration)"],
      "aggregates": ["avg(transaction.duration)"],
      "projects": ["ai-course-platform-backend"]
    }
  ]
}
```

##### Learning Session Continuity (Big Number)
```json
{
  "title": "Session Recovery Success Rate",
  "displayType": "big_number",
  "queries": [
    {
      "conditions": "tags[error_recovery]:true",
      "fields": ["equation|((count_if(message, contains, success) / count()) * 100)"],
      "aggregates": ["equation|((count_if(message, contains, success) / count()) * 100)"],
      "projects": ["ai-course-platform-frontend", "ai-course-platform-backend"]
    }
  ]
}
```

##### User Progress Impact Assessment (Table)
```json
{
  "title": "Feature Availability & User Impact",
  "displayType": "table",
  "queries": [
    {
      "conditions": "event.type:error",
      "fields": ["tags[feature]", "count()", "count_unique(user)", "avg(user_impact_score)"],
      "columns": ["tags[feature]"],
      "aggregates": ["count()", "count_unique(user)", "avg(user_impact_score)"],
      "orderby": "-count_unique(user)",
      "projects": ["ai-course-platform-frontend", "ai-course-platform-backend"]
    }
  ]
}
```

---

## Dashboard 3: Technical Operations Dashboard

### Purpose
Detailed technical monitoring for developers and operations teams.

### Configuration Steps

#### 1. Create Dashboard
1. Name: `AI Course Platform - Technical Operations`
2. Description: `Technical monitoring: API performance, database health, external services, error boundaries, distributed tracing`

#### 2. Add Widgets

##### API Performance Breakdown (Table)
```json
{
  "title": "API Endpoint Performance Analysis",
  "displayType": "table",
  "queries": [
    {
      "conditions": "event.type:transaction",
      "fields": ["transaction", "count()", "avg(transaction.duration)", "p95(transaction.duration)", "failure_rate()"],
      "columns": ["transaction"],
      "aggregates": ["count()", "avg(transaction.duration)", "p95(transaction.duration)", "failure_rate()"],
      "orderby": "-failure_rate()",
      "projects": ["ai-course-platform-backend"]
    }
  ]
}
```

##### Database Operations Health (Time Series)
```json
{
  "title": "Database Performance & Connection Health",
  "displayType": "line",
  "queries": [
    {
      "name": "DB Query Performance",
      "conditions": "tags[service]:database OR span.description:*SELECT* OR span.description:*INSERT*",
      "fields": ["avg(span.duration)"],
      "aggregates": ["avg(span.duration)"],
      "projects": ["ai-course-platform-backend"]
    },
    {
      "name": "DB Connection Errors",
      "conditions": "tags[service]:database AND level:error",
      "fields": ["count()"],
      "aggregates": ["count()"],
      "projects": ["ai-course-platform-backend"]
    }
  ]
}
```

##### External Service Health (Bar Chart)
```json
{
  "title": "External Service Response Times",
  "displayType": "bar",
  "queries": [
    {
      "conditions": "tags[external]:true OR tags[service]:openai OR tags[service]:supabase",
      "fields": ["avg(transaction.duration)", "tags[service]"],
      "columns": ["tags[service]"],
      "aggregates": ["avg(transaction.duration)"],
      "projects": ["ai-course-platform-frontend", "ai-course-platform-backend"]
    }
  ]
}
```

##### Error Boundary Effectiveness (Big Number)
```json
{
  "title": "Error Containment Success Rate",
  "displayType": "big_number",
  "queries": [
    {
      "conditions": "tags[errorBoundary]:true",
      "fields": ["equation|((count_if(tags[userImpact], equals, medium) + count_if(tags[userImpact], equals, low)) / count() * 100)"],
      "aggregates": ["equation|((count_if(tags[userImpact], equals, medium) + count_if(tags[userImpact], equals, low)) / count() * 100)"],
      "projects": ["ai-course-platform-frontend"]
    }
  ]
}
```

##### Distributed Tracing Health (Time Series)
```json
{
  "title": "Cross-System Trace Correlation Success",
  "displayType": "line",
  "queries": [
    {
      "name": "Successful Traces",
      "conditions": "has:trace AND !has:trace.parent_span_id",
      "fields": ["count()"],
      "aggregates": ["count()"],
      "projects": ["ai-course-platform-frontend", "ai-course-platform-backend"]
    },
    {
      "name": "Broken Traces",
      "conditions": "has:trace AND has:trace.orphan_span",
      "fields": ["count()"],
      "aggregates": ["count()"],
      "projects": ["ai-course-platform-frontend", "ai-course-platform-backend"]
    }
  ]
}
```

---

## Dashboard 4: Business Impact Dashboard

### Purpose
Business and product team visibility into how technical issues affect learning outcomes and user satisfaction.

### Configuration Steps

#### 1. Create Dashboard
1. Name: `AI Course Platform - Business Impact`
2. Description: `Business metrics: user session impact, feature availability, error recovery success, learning outcomes correlation`

#### 2. Add Widgets

##### User Session Impact (Big Number)
```json
{
  "title": "% Users Affected by Errors",
  "displayType": "big_number",
  "queries": [
    {
      "conditions": "event.type:error AND level:error",
      "fields": ["equation|(count_unique(user) / count_unique(user) * 100)"],
      "aggregates": ["equation|(count_unique(user) / count_unique(user) * 100)"],
      "projects": ["ai-course-platform-frontend", "ai-course-platform-backend"]
    }
  ]
}
```

##### Feature Availability Percentages (Table)
```json
{
  "title": "Core Learning Feature Uptime",
  "displayType": "table",
  "queries": [
    {
      "conditions": "",
      "fields": ["tags[feature]", "equation|((count() - count_if(level, equals, error)) / count() * 100)"],
      "columns": ["tags[feature]"],
      "aggregates": ["equation|((count() - count_if(level, equals, error)) / count() * 100)"],
      "orderby": "equation|((count() - count_if(level, equals, error)) / count() * 100)",
      "projects": ["ai-course-platform-frontend", "ai-course-platform-backend"]
    }
  ]
}
```

##### Error Recovery Success Rate (Time Series)
```json
{
  "title": "User Recovery & Retention After Errors",
  "displayType": "line",
  "queries": [
    {
      "name": "Recovery Attempts",
      "conditions": "message:*recovery* OR tags[error_recovery]:true",
      "fields": ["count()"],
      "aggregates": ["count()"],
      "projects": ["ai-course-platform-frontend", "ai-course-platform-backend"]
    },
    {
      "name": "Successful Recoveries",
      "conditions": "message:*recovery* AND (message:*success* OR level:info)",
      "fields": ["count()"],
      "aggregates": ["count()"],
      "projects": ["ai-course-platform-frontend", "ai-course-platform-backend"]
    }
  ]
}
```

##### Learning Outcomes Impact (Bar Chart)
```json
{
  "title": "Error Impact on Learning Sessions",
  "displayType": "bar",
  "queries": [
    {
      "conditions": "tags[feature]:*learning* OR tags[section]:learning",
      "fields": ["count()", "tags[userImpact]"],
      "columns": ["tags[userImpact]"],
      "aggregates": ["count()"],
      "projects": ["ai-course-platform-frontend", "ai-course-platform-backend"]
    }
  ]
}
```

##### User Experience Metrics (World Map)
```json
{
  "title": "Global Error Distribution & User Impact",
  "displayType": "world_map",
  "queries": [
    {
      "conditions": "event.type:error",
      "fields": ["count()", "geo.country_code"],
      "columns": ["geo.country_code"],
      "aggregates": ["count()"],
      "projects": ["ai-course-platform-frontend", "ai-course-platform-backend"]
    }
  ]
}
```

---

## Intelligent Alerting System

### Critical Alerts (Immediate Response - Page/SMS/Slack)

#### 1. Learning Session Crashes
```json
{
  "name": "Critical: Learning Session Crashes",
  "conditions": "event.type:error AND (tags[section]:learning OR tags[feature]:*learning*)",
  "aggregations": [
    {
      "function": "count()",
      "time_window": 300,
      "comparison_delta": 300
    }
  ],
  "triggers": [
    {
      "threshold_type": "above",
      "alert_threshold": 10,
      "resolve_threshold": 5,
      "time_window": 300
    }
  ],
  "actions": [
    {
      "target_type": "team",
      "target_identifier": "learning-platform-team",
      "service": "pagerduty"
    }
  ]
}
```

#### 2. AI Service Complete Failure
```json
{
  "name": "Critical: AI Service Down",
  "conditions": "tags[service]:openai AND level:error",
  "aggregations": [
    {
      "function": "count()",
      "time_window": 300
    }
  ],
  "triggers": [
    {
      "threshold_type": "above",
      "alert_threshold": 5,
      "time_window": 300
    }
  ],
  "actions": [
    {
      "target_type": "team", 
      "target_identifier": "ai-services-team",
      "service": "pagerduty"
    }
  ]
}
```

#### 3. Authentication System Failure
```json
{
  "name": "Critical: Authentication System Down",
  "conditions": "tags[feature]:authentication AND level:error",
  "aggregations": [
    {
      "function": "count()",
      "time_window": 300
    }
  ],
  "triggers": [
    {
      "threshold_type": "above",
      "alert_threshold": 3,
      "time_window": 300
    }
  ]
}
```

#### 4. Database Connection Loss
```json
{
  "name": "Critical: Database Connection Issues",
  "conditions": "tags[service]:database AND level:error AND message:*connection*",
  "aggregations": [
    {
      "function": "count()",
      "time_window": 300
    }
  ],
  "triggers": [
    {
      "threshold_type": "above",
      "alert_threshold": 5,
      "time_window": 300
    }
  ]
}
```

#### 5. Cross-System Trace Correlation Failure
```json
{
  "name": "Critical: Distributed Tracing Failure",
  "conditions": "has:trace AND has:trace.orphan_span",
  "aggregations": [
    {
      "function": "percentage(count(), count()) as failure_rate",
      "time_window": 600
    }
  ],
  "triggers": [
    {
      "threshold_type": "above",
      "alert_threshold": 50,
      "time_window": 600
    }
  ]
}
```

### High Priority Alerts (30 minutes - Slack/Email)

#### 1. Error Boundary Activation Spike
```json
{
  "name": "High: Error Boundary Activation Spike",
  "conditions": "tags[errorBoundary]:true",
  "aggregations": [
    {
      "function": "count()",
      "time_window": 900,
      "comparison_delta": 900
    }
  ],
  "triggers": [
    {
      "threshold_type": "percent_change",
      "alert_threshold": 20,
      "time_window": 900
    }
  ]
}
```

#### 2. API Response Time Degradation
```json
{
  "name": "High: API Performance Degradation",
  "conditions": "event.type:transaction",
  "aggregations": [
    {
      "function": "avg(transaction.duration)",
      "time_window": 1800,
      "comparison_delta": 86400
    }
  ],
  "triggers": [
    {
      "threshold_type": "percent_change",
      "alert_threshold": 100,
      "time_window": 1800
    }
  ]
}
```

#### 3. Voice Practice Component Failures
```json
{
  "name": "High: Voice Practice System Issues",
  "conditions": "tags[section]:voice_practice AND level:error",
  "aggregations": [
    {
      "function": "count()",
      "time_window": 1800
    }
  ],
  "triggers": [
    {
      "threshold_type": "above",
      "alert_threshold": 5,
      "time_window": 1800
    }
  ]
}
```

#### 4. Assessment Generation Errors
```json
{
  "name": "High: Assessment Generation Failures",
  "conditions": "tags[feature]:assessment_generator AND level:error",
  "aggregations": [
    {
      "function": "count()",
      "time_window": 1800
    }
  ],
  "triggers": [
    {
      "threshold_type": "above",
      "alert_threshold": 10,
      "time_window": 1800
    }
  ]
}
```

#### 5. Backend Recovery Endpoint Failures
```json
{
  "name": "High: Error Recovery System Issues",
  "conditions": "transaction:*/api/session/cleanup OR transaction:*/api/error/report",
  "aggregations": [
    {
      "function": "failure_rate()",
      "time_window": 1800
    }
  ],
  "triggers": [
    {
      "threshold_type": "above",
      "alert_threshold": 10,
      "time_window": 1800
    }
  ]
}
```

### Medium Priority Alerts (2 hours - Email)

#### 1. Source Map Upload Failures
```json
{
  "name": "Medium: Source Map Issues",
  "conditions": "message:*source map* AND level:warning",
  "aggregations": [
    {
      "function": "count()",
      "time_window": 7200
    }
  ],
  "triggers": [
    {
      "threshold_type": "above",
      "alert_threshold": 3,
      "time_window": 7200
    }
  ]
}
```

#### 2. Performance Degradation Trends
```json
{
  "name": "Medium: Performance Trend Degradation",
  "conditions": "event.type:transaction",
  "aggregations": [
    {
      "function": "avg(transaction.duration)",
      "time_window": 7200,
      "comparison_delta": 604800
    }
  ],
  "triggers": [
    {
      "threshold_type": "percent_change",
      "alert_threshold": 25,
      "time_window": 7200
    }
  ]
}
```

#### 3. Error Recovery Success Rate Decline
```json
{
  "name": "Medium: Error Recovery Success Declining",
  "conditions": "tags[error_recovery]:true",
  "aggregations": [
    {
      "function": "percentage(count_if(message, contains, success), count())",
      "time_window": 7200,
      "comparison_delta": 86400
    }
  ],
  "triggers": [
    {
      "threshold_type": "below",
      "alert_threshold": 80,
      "time_window": 7200
    }
  ]
}
```

#### 4. User Session Preservation Issues
```json
{
  "name": "Medium: Session Preservation Problems",
  "conditions": "message:*session* AND message:*preservation* AND level:warning",
  "aggregations": [
    {
      "function": "count()",
      "time_window": 7200
    }
  ],
  "triggers": [
    {
      "threshold_type": "above",
      "alert_threshold": 20,
      "time_window": 7200
    }
  ]
}
```

### Learning-Specific Alerts

#### 1. Learning Flow Interruption
```json
{
  "name": "Learning: Core Learning Flow Disrupted",
  "conditions": "(tags[feature]:voice_practice OR tags[feature]:assessment_generator OR tags[feature]:ai_chat) AND level:error",
  "aggregations": [
    {
      "function": "count_unique(user)",
      "time_window": 1800
    }
  ],
  "triggers": [
    {
      "threshold_type": "above",
      "alert_threshold": 5,
      "time_window": 1800
    }
  ]
}
```

#### 2. Assessment Availability Impact
```json
{
  "name": "Learning: Assessment Generation Unavailable",
  "conditions": "tags[feature]:assessment_generator AND level:error",
  "aggregations": [
    {
      "function": "failure_rate()",
      "time_window": 3600
    }
  ],
  "triggers": [
    {
      "threshold_type": "above",
      "alert_threshold": 25,
      "time_window": 3600
    }
  ]
}
```

#### 3. Voice Practice Availability
```json
{
  "name": "Learning: Voice Practice Degraded",
  "conditions": "tags[section]:voice_practice AND (level:error OR level:warning)",
  "aggregations": [
    {
      "function": "count()",
      "time_window": 3600
    }
  ],
  "triggers": [
    {
      "threshold_type": "above",
      "alert_threshold": 15,
      "time_window": 3600
    }
  ]
}
```

#### 4. AI Service Degradation
```json
{
  "name": "Learning: AI Response Quality Degraded",
  "conditions": "tags[service]:openai AND transaction.duration:>5000",
  "aggregations": [
    {
      "function": "count()",
      "time_window": 1800
    }
  ],
  "triggers": [
    {
      "threshold_type": "above",
      "alert_threshold": 10,
      "time_window": 1800
    }
  ]
}
```

#### 5. Progress Loss Prevention
```json
{
  "name": "Learning: User Progress Loss Risk",
  "conditions": "tags[error_recovery]:true AND message:*failed*",
  "aggregations": [
    {
      "function": "count_unique(user)",
      "time_window": 3600
    }
  ],
  "triggers": [
    {
      "threshold_type": "above",
      "alert_threshold": 3,
      "time_window": 3600
    }
  ]
}
```

---

## Implementation Checklist

### Phase 1: Dashboard Creation
- [ ] Create AI Course Platform Overview Dashboard
- [ ] Create Learning Experience Monitoring Dashboard
- [ ] Create Technical Operations Dashboard
- [ ] Create Business Impact Dashboard
- [ ] Test all dashboard widgets and queries
- [ ] Configure dashboard permissions and sharing

### Phase 2: Alert Configuration
- [ ] Create Critical Alerts (5 alerts)
- [ ] Create High Priority Alerts (5 alerts)
- [ ] Create Medium Priority Alerts (4 alerts)
- [ ] Create Learning-Specific Alerts (5 alerts)
- [ ] Configure notification channels (PagerDuty, Slack, Email)
- [ ] Test alert triggering and escalation

### Phase 3: Integration Setup
- [ ] Configure alert channel routing
- [ ] Set up escalation policies
- [ ] Create alert response playbooks
- [ ] Train team on dashboard usage
- [ ] Document troubleshooting procedures

### Phase 4: Monitoring & Optimization
- [ ] Monitor dashboard usage and adoption
- [ ] Track alert accuracy and false positive rates
- [ ] Measure error resolution time improvements
- [ ] Optimize alert thresholds based on patterns
- [ ] Regular dashboard and alert maintenance

---

## Success Metrics

### Dashboard Effectiveness
- **Usage Metrics**: Daily active dashboard users, time spent on dashboards
- **Problem Detection**: Time to detect issues reduced by >50%
- **Cross-Team Visibility**: All teams using appropriate dashboards weekly

### Alert Quality
- **Alert Accuracy**: >90% of alerts lead to actionable responses
- **False Positive Rate**: <10% false positives per alert rule
- **Response Time**: Mean time to acknowledgment <5 minutes for critical alerts

### System Health Improvement
- **Error Resolution**: Mean time to resolution improved by >40%
- **User Impact**: Users affected by errors reduced by >30%
- **Learning Continuity**: Session recovery success rate >95%

### Business Impact
- **Feature Availability**: Core learning features >99.5% uptime
- **User Satisfaction**: Technical error-related support tickets reduced by >50%
- **Learning Outcomes**: Error-related learning session abandonment <2%

This comprehensive dashboard and alerting system transforms the existing Sentry monitoring infrastructure into a proactive system management and exceptional user experience protection platform, providing unified visibility across the entire AI Course Platform stack.