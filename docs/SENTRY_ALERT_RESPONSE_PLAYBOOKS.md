# Sentry Alert Response Playbooks
## AI Course Platform Incident Response Guide

This document provides step-by-step response procedures for all Sentry alerts in the AI Course Platform monitoring system.

## Alert Classification System

### Severity Levels
- **🚨 Critical**: Immediate response required (0-5 minutes)
- **⚠️ High**: Response required within 30 minutes
- **ℹ️ Medium**: Response required within 2 hours
- **📚 Learning-Specific**: Educational platform feature-specific alerts

### Response Teams
- **Learning Platform Team**: Core learning features, user experience
- **AI Services Team**: OpenAI integration, AI model performance
- **Infrastructure Team**: Database, networking, deployment
- **Frontend Team**: UI components, error boundaries, client-side issues
- **Backend Team**: API services, server-side logic, integration

---

## 🚨 Critical Alert Playbooks

### 1. Learning Session Crashes

#### Alert Trigger
- **Condition**: >10 learning session errors in 5 minutes
- **Impact**: High user impact, learning flow disruption
- **Escalation**: PagerDuty → Learning Platform Team

#### Immediate Response (0-5 minutes)
1. **Acknowledge Alert** in PagerDuty/Sentry
2. **Check Dashboard**: Open "Learning Experience Monitoring Dashboard"
3. **Assess Impact**: 
   - How many users affected?
   - Which learning features are failing?
   - Are error boundaries containing the issues?

#### Investigation Steps (5-15 minutes)
1. **Review Sentry Issues**:
   ```bash
   # Check recent learning-related errors
   # Filter: tags[section]:learning OR tags[feature]:*learning*
   # Time range: Last 30 minutes
   ```

2. **Check Error Boundaries**:
   - Are VoicePracticeErrorBoundary, AssessmentGeneratorErrorBoundary working?
   - Are users seeing recovery options?
   - Check error boundary activation rates

3. **Cross-System Analysis**:
   - Check backend `/api/session/cleanup` endpoint health
   - Verify error recovery coordination is working
   - Look for distributed trace breakdowns

#### Resolution Actions
1. **If Voice Practice Issues**:
   ```bash
   # Check speech recognition service
   # Verify microphone permissions
   # Test WebRTC connection stability
   ```

2. **If Assessment Generation Issues**:
   ```bash
   # Check OpenAI API status
   # Verify AI service quotas and rate limits
   # Test simple mode fallback
   ```

3. **If Chat Interface Issues**:
   ```bash
   # Check chat API endpoints
   # Verify conversation context preservation
   # Test basic chat mode fallback
   ```

#### Recovery Verification
1. **Test Learning Flows**: Manually test affected features
2. **Monitor Recovery**: Watch error rates decline in dashboard
3. **User Communication**: If widespread, update status page
4. **Post-Incident**: Schedule incident review within 24 hours

---

### 2. AI Service Complete Failure

#### Alert Trigger
- **Condition**: >5 OpenAI service errors in 5 minutes
- **Impact**: All AI-powered features unavailable
- **Escalation**: PagerDuty → AI Services Team

#### Immediate Response (0-5 minutes)
1. **Acknowledge Alert**
2. **Check OpenAI Status**: https://status.openai.com/
3. **Assess Scope**:
   - All AI features down or specific endpoints?
   - Backend API errors or frontend integration issues?

#### Investigation Steps (5-15 minutes)
1. **Backend Health Check**:
   ```bash
   curl https://your-backend.com/api/health/detailed
   # Check ai_service status in response
   ```

2. **Review AI Service Logs**:
   ```bash
   # In Sentry: Filter by tags[service]:openai
   # Look for: rate limits, authentication, quota issues
   ```

3. **Check Configuration**:
   - Verify API keys are valid
   - Check rate limiting and quota usage
   - Validate model availability

#### Resolution Actions
1. **If OpenAI Service Down**:
   - Enable fallback modes in all AI features
   - Update users via status page
   - Consider switching to backup models if available

2. **If Authentication Issues**:
   ```bash
   # Rotate API keys if needed
   # Verify environment variables
   # Check key permissions and quotas
   ```

3. **If Rate Limiting**:
   - Implement request queuing
   - Reduce request frequency
   - Scale to higher tier if needed

#### Recovery Verification
1. **Test AI Endpoints**: Verify all AI services responding
2. **Disable Fallback Modes**: Once service is stable
3. **Monitor Usage**: Watch for rate limit recovery
4. **User Communication**: Announce service restoration

---

### 3. Authentication System Failure

#### Alert Trigger
- **Condition**: >3 authentication errors in 5 minutes
- **Impact**: Users cannot access platform
- **Escalation**: PagerDuty → Backend Team + Infrastructure Team

#### Immediate Response (0-5 minutes)
1. **Acknowledge Alert**
2. **Check Auth Status**:
   - Login page accessible?
   - JWT token validation working?
   - Session management functional?

#### Investigation Steps (5-15 minutes)
1. **Backend Auth Endpoints**:
   ```bash
   curl -X POST https://your-backend.com/api/auth/login
   # Check response and error codes
   ```

2. **Database Connectivity**:
   ```bash
   # Check user table access
   # Verify database connection pool
   # Look for connection timeout errors
   ```

3. **External Dependencies**:
   - Supabase auth service status
   - JWT signing key availability
   - Session storage (Redis/database) health

#### Resolution Actions
1. **If Database Issues**:
   - Restart database connections
   - Check connection pool limits
   - Verify database credentials

2. **If JWT Issues**:
   - Verify signing keys
   - Check token expiration logic
   - Validate middleware configuration

3. **If External Service Issues**:
   - Check Supabase status
   - Verify API keys and configuration
   - Test backup authentication methods

#### Recovery Verification
1. **Test Login Flow**: Complete end-to-end authentication
2. **Verify Session Persistence**: Check user stays logged in
3. **Monitor Auth Metrics**: Watch authentication success rates
4. **User Communication**: Inform users of resolution

---

### 4. Database Connection Loss

#### Alert Trigger
- **Condition**: >5 database connection errors in 5 minutes
- **Impact**: All data operations failing
- **Escalation**: PagerDuty → Infrastructure Team + Backend Team

#### Immediate Response (0-5 minutes)
1. **Acknowledge Alert**
2. **Check Database Status**:
   - Supabase dashboard
   - Connection pool status
   - Recent deployment activity

#### Investigation Steps (5-15 minutes)
1. **Connection Pool Analysis**:
   ```python
   # Check database.py connection status
   # Review connection pool configuration
   # Look for connection leaks
   ```

2. **Network Connectivity**:
   ```bash
   # Test network connectivity to database
   ping your-database-host
   telnet your-database-host 5432
   ```

3. **Resource Usage**:
   - Database CPU and memory usage
   - Connection count vs limits
   - Disk space availability

#### Resolution Actions
1. **If Connection Pool Exhausted**:
   ```python
   # Increase pool size in database.py
   # Review connection cleanup logic
   # Restart application to reset pools
   ```

2. **If Database Resource Issues**:
   - Scale database resources
   - Optimize slow queries
   - Clean up unnecessary connections

3. **If Network Issues**:
   - Check firewall rules
   - Verify DNS resolution
   - Test alternative connection paths

#### Recovery Verification
1. **Test Database Operations**: Run basic CRUD operations
2. **Monitor Connection Health**: Watch connection pool metrics
3. **Performance Testing**: Verify response times normal
4. **Gradual Load Increase**: Monitor stability under load

---

### 5. Cross-System Trace Correlation Failure

#### Alert Trigger
- **Condition**: >50% trace correlation failure rate
- **Impact**: Debugging and monitoring visibility loss
- **Escalation**: Slack → Infrastructure Team + Frontend Team

#### Immediate Response (0-5 minutes)
1. **Acknowledge Alert**
2. **Check Trace Health**:
   - Sentry Performance tab
   - Distributed tracing overview
   - Recent deployment correlation

#### Investigation Steps (5-15 minutes)
1. **Trace Configuration**:
   ```typescript
   // Check sentry.server.config.ts
   // Verify tracePropagationTargets
   // Review instrumentation.ts setup
   ```

2. **Frontend-Backend Correlation**:
   ```bash
   # Check HTTP headers propagation
   # Verify trace ID passing between services
   # Look for trace context loss points
   ```

3. **Service Integration**:
   - OpenAI API trace correlation
   - Supabase trace context
   - Error boundary trace preservation

#### Resolution Actions
1. **If Configuration Issues**:
   ```typescript
   // Update tracePropagationTargets in sentry config
   // Verify instrumentation setup
   // Check middleware trace handling
   ```

2. **If Header Propagation Issues**:
   ```bash
   # Fix HTTP header forwarding
   # Update CORS configuration
   # Verify middleware order
   ```

3. **If Service Integration Problems**:
   ```bash
   # Update external service integrations
   # Fix trace context preservation
   # Verify SDK versions compatibility
   ```

#### Recovery Verification
1. **Test Trace Flow**: Follow request through full stack
2. **Monitor Trace Success Rate**: Watch correlation metrics improve
3. **Validate Debug Capability**: Ensure error traces are complete
4. **Documentation Update**: Update trace configuration docs

---

## ⚠️ High Priority Alert Playbooks

### 1. Error Boundary Activation Spike

#### Alert Trigger
- **Condition**: >20% increase in error boundary activations
- **Impact**: Multiple components failing, user experience degraded
- **Escalation**: Slack → Frontend Team + Learning Platform Team

#### Response Steps (within 30 minutes)
1. **Assessment**:
   - Which error boundaries are activating most?
   - Are users seeing appropriate recovery options?
   - Is error containment working effectively?

2. **Investigation**:
   ```bash
   # Check error boundary logs in Sentry
   # Filter: tags[errorBoundary]:true
   # Group by: tags[errorBoundaryLevel] and component
   ```

3. **Resolution**:
   - Review recent code changes
   - Test error boundary recovery flows
   - Update error boundary configurations if needed

---

### 2. API Response Time Degradation

#### Alert Trigger
- **Condition**: 2x increase in average response time
- **Impact**: Poor user experience, potential timeouts
- **Escalation**: Slack → Backend Team + Infrastructure Team

#### Response Steps (within 30 minutes)
1. **Performance Analysis**:
   ```bash
   # Check Technical Operations Dashboard
   # Identify slowest endpoints
   # Review database query performance
   ```

2. **Root Cause Investigation**:
   - Recent deployment correlation
   - Database performance metrics
   - External service response times

3. **Optimization Actions**:
   - Optimize slow database queries
   - Scale resources if needed
   - Implement caching where appropriate

---

### 3. Voice Practice Component Failures

#### Alert Trigger
- **Condition**: >5 voice practice errors in 30 minutes
- **Impact**: Voice learning features unavailable
- **Escalation**: Slack → Learning Platform Team

#### Response Steps (within 30 minutes)
1. **Feature Assessment**:
   - Test voice recognition functionality
   - Check microphone permission handling
   - Verify speech-to-text service status

2. **Browser Compatibility**:
   - Test across different browsers
   - Check WebRTC API availability
   - Verify HTTPS requirements

3. **Fallback Activation**:
   - Enable text-only mode if needed
   - Update user guidance
   - Test recovery workflows

---

### 4. Assessment Generation Errors

#### Alert Trigger
- **Condition**: >10 assessment generation failures in 30 minutes
- **Impact**: AI-powered assessments unavailable
- **Escalation**: Slack → AI Services Team + Learning Platform Team

#### Response Steps (within 30 minutes)
1. **AI Service Check**:
   - Verify OpenAI API connectivity
   - Check rate limits and quotas
   - Test assessment generation manually

2. **Fallback Implementation**:
   - Enable simple assessment mode
   - Use pre-built assessment templates
   - Inform users of temporary limitations

3. **Service Recovery**:
   - Clear generation cache if needed
   - Restart AI service connections
   - Monitor generation success rates

---

### 5. Backend Recovery Endpoint Failures

#### Alert Trigger
- **Condition**: >10% failure rate on recovery endpoints
- **Impact**: Error recovery system degraded
- **Escalation**: Slack → Backend Team + Infrastructure Team

#### Response Steps (within 30 minutes)
1. **Endpoint Testing**:
   ```bash
   curl -X POST https://your-backend.com/api/session/cleanup
   curl -X POST https://your-backend.com/api/error/report
   ```

2. **Recovery System Health**:
   - Check error recovery coordination
   - Verify backend cleanup functionality
   - Test cross-system recovery flows

3. **System Restoration**:
   - Fix failing recovery endpoints
   - Update error handling logic
   - Test recovery workflows end-to-end

---

## ℹ️ Medium Priority Alert Playbooks

### 1. Source Map Upload Failures

#### Response Steps (within 2 hours)
1. **Build Process Check**:
   ```bash
   # Verify source map generation in build
   # Check Sentry CLI configuration
   # Review deployment pipeline
   ```

2. **Upload Configuration**:
   ```bash
   # Check .sentryclirc configuration
   # Verify SENTRY_AUTH_TOKEN
   # Test manual source map upload
   ```

3. **Resolution**:
   - Fix build configuration
   - Update deployment scripts
   - Verify source maps in production

### 2. Performance Degradation Trends

#### Response Steps (within 2 hours)
1. **Trend Analysis**:
   - Review 7-day performance trends
   - Identify degrading endpoints
   - Compare with previous baselines

2. **Optimization Planning**:
   - Prioritize optimization targets
   - Plan performance improvements
   - Schedule optimization work

### 3. Error Recovery Success Rate Decline

#### Response Steps (within 2 hours)
1. **Recovery Analysis**:
   - Review recovery success patterns
   - Identify failing recovery scenarios
   - Test recovery workflows manually

2. **Improvement Actions**:
   - Update recovery logic
   - Enhance error handling
   - Improve user guidance

### 4. User Session Preservation Issues

#### Response Steps (within 2 hours)
1. **Session Management Review**:
   - Check session storage mechanisms
   - Verify session cleanup logic
   - Test session persistence

2. **User Experience Impact**:
   - Monitor user retention after errors
   - Review session restoration flows
   - Update session handling if needed

---

## 📚 Learning-Specific Alert Playbooks

### 1. Learning Flow Interruption

#### Response Steps (within 30 minutes)
1. **Flow Analysis**:
   - Identify interrupted learning paths
   - Check feature integration points
   - Test critical learning workflows

2. **User Impact Assessment**:
   - Count affected learning sessions
   - Review user progress preservation
   - Check learning outcome impact

3. **Flow Restoration**:
   - Fix broken integration points
   - Test complete learning workflows
   - Verify progress preservation

### 2. Assessment Availability Impact

#### Response Steps (within 1 hour)
1. **Assessment System Health**:
   - Test assessment generation
   - Check AI service integration
   - Verify template fallbacks

2. **Learning Impact**:
   - Monitor learning progression blocks
   - Check alternative assessment options
   - Update learner communications

### 3. Voice Practice Availability

#### Response Steps (within 1 hour)
1. **Voice System Check**:
   - Test speech recognition
   - Verify audio processing
   - Check browser compatibility

2. **Learning Alternative**:
   - Enable text-based alternatives
   - Provide pronunciation guides
   - Update learning materials

### 4. AI Service Degradation

#### Response Steps (within 30 minutes)
1. **AI Performance Check**:
   - Test response quality
   - Monitor response times
   - Check service quotas

2. **Learning Quality**:
   - Verify educational content quality
   - Test alternative AI models
   - Monitor learning outcomes

### 5. Progress Loss Prevention

#### Response Steps (within 15 minutes)
1. **Progress Protection**:
   - Verify backup mechanisms
   - Test progress restoration
   - Check data persistence

2. **User Support**:
   - Contact affected users
   - Provide progress recovery
   - Update loss prevention logic

---

## Escalation Procedures

### Level 1: Team Response
- **Timeline**: First 30 minutes
- **Responsibility**: Primary team handles investigation and initial response
- **Communication**: Team Slack channel updates

### Level 2: Cross-Team Coordination
- **Timeline**: 30 minutes - 2 hours
- **Responsibility**: Multiple teams coordinate response
- **Communication**: Incident channel created, stakeholders notified

### Level 3: Leadership Involvement
- **Timeline**: 2+ hours or high business impact
- **Responsibility**: Team leads and management involved
- **Communication**: Executive updates, customer communication

### Level 4: All-Hands Response
- **Timeline**: Critical system outage >4 hours
- **Responsibility**: All technical teams mobilized
- **Communication**: Public status page, customer notifications

---

## Communication Templates

### Internal Status Update
```
🔴 INCIDENT UPDATE - [Alert Name]
Status: [Investigating/Identified/Monitoring/Resolved]
Impact: [Description of user impact]
Current Actions: [What we're doing now]
ETA: [Expected resolution time]
Next Update: [When next update will be sent]
```

### Customer Communication
```
We're currently experiencing issues with [affected feature]. 
Our team is actively working on a resolution. 
Estimated resolution time: [ETA]
We'll update this message as we have more information.
```

### Resolution Announcement
```
✅ RESOLVED - [Alert Name]
The issue affecting [feature/service] has been resolved.
Duration: [Total downtime]
Root Cause: [Brief explanation]
Prevention: [Steps taken to prevent recurrence]
```

---

## Post-Incident Procedures

### Immediate Post-Resolution (within 1 hour)
1. **Verify Full Recovery**: All metrics back to normal
2. **Update Stakeholders**: Send resolution notification
3. **Document Timeline**: Capture key events and actions
4. **Schedule Review**: Plan post-incident review meeting

### Post-Incident Review (within 24-48 hours)
1. **Timeline Analysis**: Review response timeline and effectiveness
2. **Root Cause Analysis**: Deep dive into underlying causes
3. **Process Evaluation**: Assess playbook effectiveness
4. **Improvement Actions**: Identify and assign follow-up tasks

### Follow-Up Actions (within 1 week)
1. **Implement Improvements**: Execute identified action items
2. **Update Playbooks**: Revise procedures based on learnings
3. **Team Training**: Share learnings with broader team
4. **Monitoring Enhancement**: Improve detection and alerting

This comprehensive playbook system ensures rapid, effective response to all types of incidents in the AI Course Platform, minimizing user impact and maintaining high service quality.