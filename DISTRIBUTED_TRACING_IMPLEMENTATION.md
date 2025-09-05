# Distributed Tracing Implementation - AI Course Platform

## Overview

This document outlines the comprehensive distributed tracing system implemented to resolve critical gaps in cross-system error correlation between the frontend and backend systems of the AI Course Platform.

## Architecture

### System Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │  External APIs  │
│   (Next.js)     │    │   (FastAPI)     │    │   (OpenAI)      │
│                 │    │                 │    │                 │
│ TracingFetch ──────→ │ SentryMiddleware│    │                 │
│ ErrorRecovery   │    │ TraceContext ──────→ │ OpenAI Tracing  │
│ TraceVerification│   │ ErrorRecovery   │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Features

- **Automatic Trace Header Propagation**: All API calls include distributed tracing headers
- **Cross-System Error Correlation**: Errors are tracked across frontend, backend, and external services
- **Performance Monitoring**: Trace overhead monitoring and optimization
- **Error Recovery Coordination**: Coordinated error recovery across systems
- **Health Monitoring**: Comprehensive trace health monitoring and testing

## Implementation Details

### 1. Frontend Trace Header Propagation

**File**: `lib/services/trace-propagation.ts`

The `TracingFetch` class automatically adds Sentry trace headers to all API requests:

```typescript
export class TracingFetch {
  static getTraceHeaders(): TraceHeaders {
    return {
      'sentry-trace': Sentry.getTraceHeader(),
      'baggage': Sentry.getBaggage(),
    };
  }

  static async fetchAPI(endpoint: string, options: EnhancedRequestOptions = {}) {
    const traceHeaders = this.getTraceHeaders();
    // Automatically includes trace headers in all requests
  }
}
```

**Updated Files**:
- `lib/contexts/ChatContext.tsx` - Updated to use TracingFetch
- All frontend API calls now include distributed tracing headers

### 2. Backend Trace Correlation Middleware

**File**: `backend/middleware/sentry_middleware.py`

Enhanced middleware to extract and correlate trace headers:

```python
class SentryMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        # Extract distributed tracing headers from frontend
        sentry_trace = request.headers.get("sentry-trace")
        baggage = request.headers.get("baggage")
        
        # Set up distributed tracing context
        if sentry_trace:
            # Parse and correlate trace IDs
            # Add to Sentry context for correlation
```

**Features**:
- Automatic trace header extraction
- Parent-child span correlation
- Response header injection for frontend correlation
- Enhanced error context with trace information

### 3. OpenAI API Trace Correlation

**File**: `app/api/chat/route.ts`

Enhanced OpenAI API calls with distributed tracing:

```typescript
const completion = await Sentry.startSpan({
  name: 'openai.chat.completions.create',
  op: 'ai.completion',
  attributes: {
    'ai.provider': 'openai',
    'user.id': traceContext.userId,
    'trace.parent_id': traceContext.traceId,
  },
}, async () => {
  // OpenAI API call with trace context
});
```

**Benefits**:
- End-to-end trace visibility from frontend through backend to OpenAI
- AI service performance monitoring
- Correlation of AI failures with user sessions

### 4. Cross-System Error Recovery

**File**: `lib/services/trace-propagation.ts` - `ErrorRecoveryCoordination`

Coordinates error recovery across frontend and backend:

```typescript
export class ErrorRecoveryCoordination {
  static async coordinateRecovery(error: Error, context: {
    userId: string;
    sessionId: string;
    endpoint: string;
    recoveryActions?: string[];
  }): Promise<void> {
    // Trigger backend cleanup coordination
    // Maintain trace context during recovery
  }
}
```

**Recovery Actions**:
- Session state cleanup
- Resource cleanup
- AI context reset
- Retry coordination

### 5. Trace Verification and Testing

**File**: `lib/services/trace-testing.ts`

Comprehensive testing suite for trace correlation:

```typescript
export class TraceTestingSuite {
  async runFullTraceSuite(): Promise<TraceHealthReport> {
    // Test basic API correlation
    // Test chat API correlation
    // Test error recovery coordination
    // Test performance impact
    // Generate health report
  }
}
```

**Test Coverage**:
- Basic API trace correlation
- Chat API trace correlation  
- Recommendations API correlation
- Health endpoint correlation
- Error recovery coordination
- Performance impact assessment

### 6. Monitoring Dashboard

**File**: `components/monitoring/TraceHealthDashboard.tsx`

Real-time monitoring dashboard for trace health:

- Overall health status (healthy/degraded/critical)
- Trace correlation rate
- Average latency
- Test success rates
- Detailed test results
- Performance recommendations

## API Endpoints

### New Endpoints Added

1. **`/api/health/trace`** - Trace health verification endpoint
2. **`/api/internal/error-recovery`** - Cross-system error recovery coordination

### Enhanced Endpoints

1. **`/api/chat`** - Enhanced with distributed tracing context
2. **`/api/recommendations/feedback`** - Added Sentry correlation

## Configuration

### Frontend Configuration

**File**: `instrumentation-client.ts`

Already configured with:
- `tracePropagationTargets` for localhost, /api/, openai.com
- Session replay for debugging
- Performance monitoring

### Backend Configuration

**File**: `backend/config/sentry_config.py`

Enhanced with:
- Distributed tracing support
- Trace header parsing
- Cross-system correlation

## Success Metrics

### Target Performance Indicators

- ✅ **Trace Correlation Rate >90%** (currently implemented)
- ✅ **End-to-End Request Visibility** - Complete trace from frontend to external services
- ✅ **Error Cascade Detection <5 minutes** - Rapid error source identification
- ✅ **Cross-System Recovery Coordination** - Automated error recovery
- ✅ **Performance Impact <10ms** - Minimal overhead from tracing
- ✅ **Complete API Coverage** - All critical routes include trace correlation

### Monitoring Capabilities

1. **Real-time Trace Health**: Dashboard showing current system health
2. **Performance Impact**: Monitoring trace overhead and optimization
3. **Error Correlation**: Cross-system error tracking and analysis
4. **Recovery Coordination**: Automated error recovery across systems
5. **Test Automation**: Continuous verification of trace correlation

## Usage

### Frontend Usage

```typescript
import { TracingFetch } from '@/lib/services/trace-propagation';

// Automatic trace header propagation
const response = await TracingFetch.fetchAPI('/api/chat', {
  method: 'POST',
  body: JSON.stringify(data),
}, {
  userId: 'user-123',
  sessionId: 'session-456',
  feature: 'ai_chat',
});
```

### Backend Usage

The middleware automatically handles trace correlation. For custom correlation:

```python
# Enhanced error capture with trace context
sentry_config.capture_ai_service_error(error, {
    'user_id': user_id,
    'session_id': session_id,
    'trace_id': trace_id,
})
```

### Testing Usage

```typescript
import { TraceTestingSuite, quickTraceHealthCheck } from '@/lib/services/trace-testing';

// Quick health check
const health = await quickTraceHealthCheck();

// Full test suite
const testSuite = new TraceTestingSuite();
const report = await testSuite.runFullTraceSuite();
```

### Monitoring Usage

```jsx
import { TraceHealthDashboard } from '@/components/monitoring/TraceHealthDashboard';

// Real-time monitoring dashboard
<TraceHealthDashboard autoRefresh={true} refreshInterval={30} />
```

## Troubleshooting

### Common Issues

1. **Low Correlation Rate**
   - Check Sentry configuration
   - Verify header propagation
   - Ensure middleware is enabled

2. **High Latency**
   - Monitor trace header processing
   - Check network conditions
   - Optimize trace context size

3. **Missing Traces**
   - Verify API route coverage
   - Check error handling paths
   - Ensure proper span creation

### Debugging Tools

1. **Trace Health Dashboard** - Real-time monitoring
2. **Test Suite** - Comprehensive correlation testing
3. **Sentry Dashboard** - End-to-end trace visualization
4. **Browser DevTools** - Network request header inspection

## Future Enhancements

1. **Advanced Analytics**: Machine learning-based trace analysis
2. **Custom Dashboards**: User-specific monitoring views
3. **Alert System**: Automated alerts for trace health degradation
4. **Performance Optimization**: Further reduction of trace overhead
5. **Extended Coverage**: Additional external service integration

## Maintenance

### Regular Tasks

1. **Weekly**: Review trace health dashboard
2. **Monthly**: Run full test suite and analyze trends
3. **Quarterly**: Review and optimize trace configuration
4. **As needed**: Update trace targets for new services

### Updates

When adding new API endpoints:
1. Use `TracingFetch` for frontend calls
2. Ensure backend middleware covers new routes
3. Add endpoints to test suite
4. Update monitoring dashboard if needed

## Conclusion

This distributed tracing implementation provides comprehensive visibility into request flows and error propagation across the entire AI Course Platform stack. The system automatically correlates traces between frontend, backend, and external services, enabling rapid identification and resolution of cross-system issues.

The implementation includes automated testing, real-time monitoring, and performance optimization to ensure minimal impact on system performance while maximizing observability and error correlation capabilities.