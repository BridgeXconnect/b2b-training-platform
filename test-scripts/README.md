# AI Course Platform - Error Recovery Validation System

Comprehensive testing suite for validating error recovery mechanisms, system health, and production readiness.

## 🎯 Overview

This validation system provides three complementary testing tools:

1. **Error Recovery Validation** (`validate-error-recovery.py`) - Tests error handling and recovery mechanisms
2. **Production Health Check** (`production-health-check.py`) - Validates production environment readiness
3. **Validation Suite Runner** (`run-validation-suite.py`) - Orchestrates comprehensive validation

## 🚀 Quick Start

### Prerequisites

```bash
# Install required Python packages
pip install requests asyncio

# Ensure your development server is running
npm run dev
# or
yarn dev
```

### Run Complete Validation

```bash
# Run comprehensive validation suite
python test-scripts/run-validation-suite.py

# Run with custom URL
python test-scripts/run-validation-suite.py --url http://localhost:3000

# Save report to specific file
python test-scripts/run-validation-suite.py --output my-validation-report.json
```

### Run Individual Tests

```bash
# Production health check only
python test-scripts/production-health-check.py

# Error recovery validation only
python test-scripts/validate-error-recovery.py
```

## 📋 Test Categories

### 1. Error Recovery Validation

Tests critical error scenarios and recovery mechanisms:

#### OpenAI API Error Recovery
- ✅ Invalid API key handling with fallback exercises
- ✅ Rate limit detection and exponential backoff
- ✅ Network failure recovery mechanisms
- ✅ Timeout handling with user notifications

#### Sentry Health Monitoring
- ✅ Sentry connectivity and configuration
- ✅ Error tracking functionality
- ✅ Performance monitoring integration
- ✅ Real-time dashboard connectivity

#### Module Loading Recovery
- ✅ Chunk loading failure simulation
- ✅ Retry mechanism validation
- ✅ Cache recovery strategies
- ✅ Build manifest accessibility

#### User Experience Flow
- ✅ Error boundary functionality
- ✅ Data preservation during errors
- ✅ Graceful degradation testing
- ✅ End-to-end recovery scenarios

### 2. Production Health Check

Validates production environment readiness:

#### Environment Configuration
- ✅ Required environment variables
- ✅ API key configuration
- ✅ Service integrations setup

#### API Endpoints Health
- ✅ Response times and reliability
- ✅ Error handling capabilities
- ✅ Load testing under concurrent requests

#### Integration Health
- ✅ OpenAI API connectivity
- ✅ Sentry monitoring active
- ✅ Database connectivity
- ✅ Frontend asset availability

#### Performance Metrics
- ✅ Response time targets
- ✅ Throughput capabilities
- ✅ Resource utilization
- ✅ Security headers validation

## 📊 Understanding Results

### Overall Scores

- **90-100%**: Excellent - Production ready
- **80-89%**: Good - Minor issues to address
- **60-79%**: Fair - Significant improvements needed
- **Below 60%**: Critical - Not production ready

### Component Status

- 🟢 **Healthy**: All tests passed, optimal performance
- 🟡 **Warning**: Some issues detected, monitoring recommended
- 🔴 **Critical**: Serious issues requiring immediate attention
- ⚪ **Not Tested**: Component not evaluated

### Production Readiness Criteria

For production deployment, the system must achieve:
- Overall health score ≥ 80%
- Error recovery pass rate ≥ 75%
- No critical health issues
- All essential API endpoints responsive

## 🔧 Configuration

### Environment Variables

Create `.env.local` with required configuration:

```bash
# OpenAI Configuration (Required for AI features)
OPENAI_API_KEY=sk-your-openai-api-key-here

# Sentry Configuration (Optional but recommended)
NEXT_PUBLIC_SENTRY_DSN=https://your-frontend-dsn@sentry.io/project-id
SENTRY_DSN=https://your-backend-dsn@sentry.io/project-id
SENTRY_ORG=your-org
SENTRY_PROJECT=your-project

# Environment
NODE_ENV=development
```

### Test Configuration

Modify test behavior in script headers:

```python
# In validate-error-recovery.py
self.test_config = {
    'openai_tests': {
        'invalid_key_test': True,      # Test invalid API key handling
        'rate_limit_simulation': True,  # Test rate limiting
        'network_failure_test': True,   # Test network failures
        'timeout_test': True           # Test timeout handling
    },
    'sentry_tests': {
        'health_check': True,          # Test Sentry connectivity
        'error_tracking': True,        # Test error capture
        'performance_monitoring': True  # Test performance tracking
    }
}
```

## 📈 Interpreting Reports

### Error Recovery Report Structure

```json
{
  "validation_summary": {
    "pass_rate": 0.85,              // 85% of tests passed
    "total_tests": 12,              // Total tests executed
    "failed": 2,                    // Number of failed tests
    "average_test_duration_ms": 450  // Average test execution time
  },
  "error_recovery_assessment": {
    "openai_recovery": {
      "status": "good",             // Overall category health
      "success_rate": 0.9           // Success rate for category
    }
  },
  "recommendations": [
    "Implement more robust OpenAI API error handling"
  ]
}
```

### Health Check Report Structure

```json
{
  "health_summary": {
    "overall_health_score": 0.92,   // 92% health score
    "system_status": "excellent",   // Overall system status
    "healthy": 7,                   // Healthy components
    "warning": 1,                   // Components with warnings
    "critical": 0                   // Critical issues
  },
  "production_readiness": {
    "ready_for_production": true,   // Production ready status
    "blockers": [],                 // Critical blocking issues
    "warnings": ["Security Headers"] // Non-blocking warnings
  }
}
```

## 🚨 Common Issues & Solutions

### OpenAI API Issues

**Problem**: Invalid API key errors
```bash
❌ OpenAI Integration: API key not configured
```
**Solution**: Add valid `OPENAI_API_KEY` to `.env.local`

**Problem**: Rate limiting detected
```bash
⚠️ Rate limit recovery: 3 requests properly throttled
```
**Solution**: This is expected behavior - rate limiting is working correctly

### Sentry Integration Issues

**Problem**: Sentry not connected
```bash
❌ Sentry Health Check: DSN not configured
```
**Solution**: Add Sentry DSN to environment variables (optional for development)

**Problem**: Sentry permissions
```bash
❌ Sentry Integration: Permission denied
```
**Solution**: Verify Sentry auth token and organization permissions

### Performance Issues

**Problem**: Slow API responses
```bash
⚠️ Performance: Response time 3500ms (target: 2000ms)
```
**Solution**: 
- Check server resources
- Optimize database queries
- Review API endpoint efficiency

### Network Issues

**Problem**: Connection timeouts
```bash
❌ API Endpoint /api/health: Connection error - service may be down
```
**Solution**:
- Ensure development server is running (`npm run dev`)
- Check firewall settings
- Verify port 3000 is available

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
# .github/workflows/validation.yml
name: Error Recovery Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Start application
        run: |
          npm run build
          npm start &
          sleep 10
          
      - name: Run validation suite
        run: |
          cd test-scripts
          python run-validation-suite.py --url http://localhost:3000
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
          NEXT_PUBLIC_SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
```

### Pre-deployment Validation

```bash
#!/bin/bash
# scripts/pre-deploy-validation.sh

echo "🚀 Pre-deployment Validation"

# Start application
npm run build
npm start &
APP_PID=$!

# Wait for startup
sleep 15

# Run validation
cd test-scripts
python run-validation-suite.py --url http://localhost:3000

VALIDATION_EXIT=$?

# Cleanup
kill $APP_PID

# Exit with validation result
exit $VALIDATION_EXIT
```

## 📝 Extending the Validation System

### Adding New Test Categories

```python
# In validate-error-recovery.py
async def test_new_category(self):
    """Test new functionality"""
    
    # Test 1: New test case
    await self._test_new_functionality()
    
async def _test_new_functionality(self):
    """Test specific new functionality"""
    start_time = time.time()
    
    try:
        # Your test logic here
        result = await self._make_api_request('/api/new-endpoint')
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        if result and result.get('success'):
            status = TestStatus.PASSED
            message = "New functionality working correctly"
        else:
            status = TestStatus.FAILED
            message = "New functionality failed"
            
        self.results.append(TestResult(
            test_name="New Functionality Test",
            status=status,
            duration_ms=duration_ms,
            details={"test_data": result},
            message=message
        ))
        
    except Exception as e:
        # Handle test errors
        pass
```

### Custom Health Checks

```python
# In production-health-check.py
async def check_custom_component(self):
    """Check custom component health"""
    start_time = time.time()
    
    try:
        # Your health check logic
        response = await self._custom_check()
        
        duration_ms = int((time.time() - start_time) * 1000)
        
        status = HealthStatus.HEALTHY if response.ok else HealthStatus.WARNING
        
        self.checks.append(HealthCheck(
            component="Custom Component",
            status=status,
            response_time_ms=duration_ms,
            details={"custom_metrics": response.data},
            message="Custom component status",
            timestamp=datetime.now().isoformat()
        ))
        
    except Exception as e:
        # Handle check errors
        pass
```

## 🛠️ Troubleshooting

### Debug Mode

Run with Python debugging for detailed output:

```bash
# Enable debug output
PYTHONPATH=. python -u test-scripts/run-validation-suite.py --url http://localhost:3000

# Run with verbose logging
python test-scripts/validate-error-recovery.py 2>&1 | tee validation-debug.log
```

### Manual Endpoint Testing

```bash
# Test API health manually
curl -X GET http://localhost:3000/api/health

# Test chat endpoint
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "test", "context": "validation"}'

# Test voice exercise generation
curl -X POST http://localhost:3000/api/voice/exercise/generate \
  -H "Content-Type: application/json" \
  -d '{"type": "pronunciation-drill", "cefrLevel": "B1"}'
```

## 📞 Support

For issues with the validation system:

1. Check the detailed JSON reports for specific error details
2. Review server logs for application-level errors
3. Verify environment configuration matches requirements
4. Test individual components manually using curl commands
5. Check network connectivity and firewall settings

The validation system is designed to be resilient and provide actionable feedback for fixing issues before production deployment.