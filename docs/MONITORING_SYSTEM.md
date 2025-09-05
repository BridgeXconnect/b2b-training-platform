# 🛡️ Autonomous Monitoring System

A comprehensive autonomous error monitoring and fixing system built for the AI Course Platform, featuring real-time Sentry integration, intelligent error classification, and automated code fixes powered by AI.

## 🌟 Features

### **Autonomous Error Detection & Fixing**
- 🔍 **MCP Sentry Integration**: Direct connection to Sentry MCP for real-time error discovery
- 🤖 **AI-Powered Analysis**: Uses Sentry's Seer AI for root cause analysis and fix suggestions
- 🔧 **Automated Code Fixes**: Applies targeted fixes based on AI analysis with confidence scoring
- 📊 **Intelligent Priority Scoring**: Prioritizes errors based on user impact, frequency, and severity

### **Health Monitoring & Recovery**
- 💚 **Continuous Health Checks**: Monitors system health with configurable intervals
- 🔄 **Automatic Recovery**: Self-healing system with intelligent restart mechanisms
- 📈 **Performance Tracking**: Monitors fix success rates, response times, and system metrics
- 🚨 **Alert System**: Real-time activity broadcasting for monitoring dashboards

### **Real-Time Dashboard**
- 📱 **Live Activity Stream**: Real-time monitoring of all system activities via Server-Sent Events
- 📊 **Comprehensive Metrics**: System health, error statistics, scheduler status, and trends
- 🎯 **Visual Health Indicators**: Color-coded status indicators and trend analysis
- ⚡ **Performance Metrics**: Response times, success rates, and uptime tracking

## 🏗️ Architecture

### **Core Components**

```
┌─────────────────────────────────────────────────────────────┐
│                    Monitoring System                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Startup         │  │ Monitoring      │  │ Error Fixing │ │
│  │ Initializer     │  │ Scheduler       │  │ Agent        │ │
│  │                 │  │                 │  │              │ │
│  │ • Auto-start    │  │ • Health checks │  │ • AI analysis│ │
│  │ • Service mgmt  │  │ • Recovery      │  │ • Code fixes │ │
│  │ • Config load   │  │ • Orchestration │  │ • Validation │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐ │
│  │ Sentry Monitor  │  │ MCP Integration │  │ Dashboard    │ │
│  │                 │  │                 │  │              │ │
│  │ • Issue search  │  │ • Search issues │  │ • Real-time  │ │
│  │ • Classification│  │ • Seer AI       │  │ • Metrics    │ │
│  │ • Fix queue     │  │ • Status update │  │ • Activities │ │
│  └─────────────────┘  └─────────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### **Data Flow**

1. **Error Discovery**: Continuous scanning of Sentry for new/updated issues
2. **AI Analysis**: Seer AI provides root cause analysis and fix suggestions
3. **Priority Assessment**: Intelligent scoring based on impact and complexity
4. **Automated Fixing**: Code modifications applied with backup and rollback
5. **Verification**: Fix validation and Sentry issue resolution
6. **Monitoring**: Health checks and system recovery mechanisms

## 🚀 Quick Start

### **Environment Setup**

```bash
# Required environment variables
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn_here
SENTRY_ORG=your_sentry_org
SENTRY_PROJECT=your_sentry_project

# Optional monitoring configuration
DISABLE_AUTO_MONITORING=false
ENABLE_CRITICAL_AUTO_FIX=true
MONITORING_DRY_RUN=false
MIN_USER_IMPACT=10
```

### **Development**

```bash
# Start the development server (monitoring auto-starts)
npm run dev

# Manual monitoring control
node scripts/test-monitoring.js

# View the dashboard
open http://localhost:3000/agents/dashboard
```

### **API Endpoints**

```bash
# Sentry Monitor Control
GET  /api/sentry/monitor?action=status
POST /api/sentry/monitor {"action": "start|stop|scan|fix-issue"}

# Scheduler Control
GET  /api/monitoring/scheduler?action=status
POST /api/monitoring/scheduler {"action": "start|stop|restart"}

# Real-time Activity Stream
EventSource: /api/agents/stream
```

## ⚙️ Configuration

### **Environment-Based Configuration**

The system automatically configures itself based on `NODE_ENV`:

- **Development**: Moderate monitoring, manual approval for fixes
- **Production**: Conservative settings, automatic critical fixes only
- **Test**: Fast intervals, dry-run mode, minimal monitoring

### **Configuration Options**

```typescript
interface MonitoringConfiguration {
  scheduler: {
    healthCheckInterval: number;      // Health check frequency
    enableAutoRestart: boolean;       // Auto-restart failed services
    maxRestartAttempts: number;       // Max restart attempts
  };
  
  sentryMonitor: {
    monitorInterval: number;          // Error scan frequency
    enableCriticalAutoFix: boolean;   // Auto-fix critical errors
    minUserImpact: number;            // Min users affected for auto-fix
    dryRun: boolean;                  // Test mode (no actual fixes)
  };
  
  startup: {
    enableAutoStart: boolean;         // Auto-start on app launch
    waitForMcp: boolean;              // Wait for MCP connection
    retryAttempts: number;            // Service start retry attempts
  };
}
```

### **Environment Variables**

| Variable | Default | Description |
|----------|---------|-------------|
| `DISABLE_AUTO_MONITORING` | `false` | Disable automatic startup |
| `ENABLE_CRITICAL_AUTO_FIX` | `true` | Enable automatic critical error fixes |
| `ENABLE_HIGH_AUTO_FIX` | `false` | Enable automatic high priority fixes |
| `MONITORING_DRY_RUN` | `false` | Run in test mode (no actual fixes) |
| `MIN_USER_IMPACT` | `10` | Minimum users affected for auto-fix |
| `MONITORING_STARTUP_DELAY` | `5000` | Delay before starting monitoring (ms) |
| `MCP_TIMEOUT` | `60000` | MCP connection timeout (ms) |

## 📊 Dashboard Features

### **System Overview**
- **Health Status**: Overall system health with color-coded indicators
- **Active Agents**: Current agent pool status and distribution
- **Success Rate**: Error fix success percentage and trends
- **Performance**: Response times and throughput metrics

### **Sentry Integration**
- **Error Monitor**: Current monitoring status and MCP connectivity
- **Error Statistics**: Critical/high error counts and affected users
- **Trend Analysis**: Error trend detection (increasing/decreasing/stable)
- **Queue Status**: Current fix queue length and processing state

### **Scheduler Status**
- **Uptime Tracking**: System uptime and restart attempts
- **Health Monitoring**: Health check status and consecutive failures
- **Configuration**: Current scheduler settings and intervals
- **Error History**: Recent errors and recovery attempts

### **Live Activity Stream**
- **Real-time Events**: All system activities with timestamps
- **Enhanced Display**: Structured display for Sentry activities
- **Activity Types**: Search, analysis, fixes, health checks, recoveries
- **Contextual Information**: Relevant details for each activity type

## 🔧 API Reference

### **Monitoring Control**

#### **Start Monitoring**
```bash
curl -X POST /api/monitoring/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'
```

#### **Get System Status**
```bash
curl /api/monitoring/scheduler?action=status
```

#### **Trigger Manual Error Scan**
```bash
curl -X POST /api/sentry/monitor \
  -H "Content-Type: application/json" \
  -d '{"action": "scan"}'
```

#### **Fix Specific Issue**
```bash
curl -X POST /api/sentry/monitor \
  -H "Content-Type: application/json" \
  -d '{"action": "fix-issue", "issueId": "PROJECT-123"}'
```

### **Real-time Events**

Connect to the Server-Sent Events stream for real-time monitoring:

```javascript
const eventSource = new EventSource('/api/agents/stream');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Activity:', data.type, data.data);
};
```

## 🛡️ Security & Safety

### **Safety Mechanisms**
- **Dry Run Mode**: Test fixes without applying changes
- **Confidence Thresholds**: Only apply high-confidence fixes automatically
- **Backup Creation**: Automatic file backups before modifications
- **Rollback Capability**: Quick rollback of applied fixes
- **Manual Approval**: High-risk fixes require manual approval

### **Security Features**
- **MCP Integration**: Secure connection to Sentry via MCP protocol
- **Error Sanitization**: Sensitive data filtering in logs and broadcasts
- **Access Control**: API endpoints with proper error handling
- **Audit Trail**: Complete activity logging for compliance

## 🚨 Troubleshooting

### **Common Issues**

#### **MCP Connection Failed**
```bash
# Check MCP server status
curl /api/sentry/monitor?action=status

# Restart with MCP wait disabled
WAIT_FOR_MCP=false npm run dev
```

#### **Monitoring Not Starting**
```bash
# Check startup status
curl /api/monitoring/scheduler?action=status

# Manual initialization
curl -X POST /api/monitoring/scheduler \
  -d '{"action": "initialize"}'
```

#### **Health Checks Failing**
```bash
# Get health status
curl /api/monitoring/scheduler?action=health

# Restart scheduler
curl -X POST /api/monitoring/scheduler \
  -d '{"action": "restart"}'
```

### **Debug Mode**

Enable verbose logging and dry-run mode:

```bash
MONITORING_DRY_RUN=true \
DEBUG=monitoring:* \
npm run dev
```

## 📈 Monitoring & Alerts

### **Key Metrics**
- **System Uptime**: Overall system availability
- **Error Fix Rate**: Percentage of successfully fixed errors
- **Response Time**: Average time to detect and fix errors
- **Health Check Success**: Health check pass/fail rate
- **MCP Connectivity**: Connection stability to Sentry MCP

### **Alert Conditions**
- **Health Check Failures**: 3+ consecutive failures
- **High Error Volume**: Sudden spike in error counts
- **Fix Failures**: Multiple failed fix attempts
- **MCP Disconnection**: Loss of Sentry connectivity
- **System Restart**: Automatic service restarts

## 🔮 Future Enhancements

- **Machine Learning**: Learn from fix success patterns
- **Multi-Project Support**: Monitor multiple Sentry projects
- **Custom Fix Rules**: User-defined fix patterns and rules
- **Integration Expansion**: Support for additional error tracking services
- **Advanced Analytics**: Deeper insights and reporting
- **Slack/Teams Integration**: Real-time notifications and approvals

---

## 📚 Related Documentation

- [Sentry Integration Guide](./SENTRY_INTEGRATION_GUIDE.md)
- [MCP Server Configuration](./MCP_CONFIGURATION.md)
- [Dashboard User Guide](./DASHBOARD_USER_GUIDE.md)
- [API Documentation](./API_DOCUMENTATION.md)

**Built with ❤️ for the AI Course Platform**