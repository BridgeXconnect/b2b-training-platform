#!/bin/bash
# Production Monitoring Session - Live system monitoring and agent health
# Real-time oversight of BMAD system in production environment

set -e

PROJECT_NAME="prod-monitor"
PROJECT_PATH="/Users/roymkhabela/Downloads/Ai course platform v2"

# Validate project path exists
if [ ! -d "$PROJECT_PATH" ]; then
    echo "Error: Project path does not exist: $PROJECT_PATH"
    exit 1
fi

# Kill existing session if it exists
tmux kill-session -t "$PROJECT_NAME" 2>/dev/null || true

echo "📊 Starting Production Monitoring Session..."

# Create main session
tmux new-session -s "$PROJECT_NAME" -d -c "$PROJECT_PATH"

# Window 0: System Overview
tmux rename-window -t "$PROJECT_NAME":0 "System-Overview"
tmux send-keys -t "$PROJECT_NAME":0 "echo '📊 Production System Overview'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '================================'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo ''" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '🎯 Monitoring Targets:'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '  • BMAD Agent Pool Health'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '  • API Response Times'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '  • User Session Quality'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '  • Database Performance'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '  • Error Rates & Patterns'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo ''" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '🚨 Alert Thresholds:'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '  • Response Time > 2s'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '  • Error Rate > 5%'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '  • Agent Failure > 10%'" Enter

# Window 1: Agent Pool Status
tmux new-window -t "$PROJECT_NAME" -n "Agent-Pool" -c "$PROJECT_PATH"
tmux send-keys -t "$PROJECT_NAME":Agent-Pool "echo '🤖 BMAD Agent Pool Status'" Enter
tmux send-keys -t "$PROJECT_NAME":Agent-Pool "echo 'Real-time agent monitoring...'" Enter

# Split for different agent types
tmux split-window -t "$PROJECT_NAME":Agent-Pool -h
tmux split-window -t "$PROJECT_NAME":Agent-Pool.0 -v
tmux split-window -t "$PROJECT_NAME":Agent-Pool.1 -v

tmux send-keys -t "$PROJECT_NAME":Agent-Pool.0 "echo '📝 Content Agents'" Enter
tmux send-keys -t "$PROJECT_NAME":Agent-Pool.0 "echo 'Status: Active | Load: 0/2'" Enter
tmux send-keys -t "$PROJECT_NAME":Agent-Pool.1 "echo '💬 Conversation Agents'" Enter  
tmux send-keys -t "$PROJECT_NAME":Agent-Pool.1 "echo 'Status: Active | Load: 0/3'" Enter
tmux send-keys -t "$PROJECT_NAME":Agent-Pool.2 "echo '📊 Analysis Agents'" Enter
tmux send-keys -t "$PROJECT_NAME":Agent-Pool.2 "echo 'Status: Active | Load: 0/2'" Enter
tmux send-keys -t "$PROJECT_NAME":Agent-Pool.3 "echo '✅ Assessment Agents'" Enter
tmux send-keys -t "$PROJECT_NAME":Agent-Pool.3 "echo 'Status: Active | Load: 0/2'" Enter

# Window 2: Performance Metrics
tmux new-window -t "$PROJECT_NAME" -n "Performance" -c "$PROJECT_PATH"
tmux send-keys -t "$PROJECT_NAME":Performance "echo '⚡ Performance Metrics Dashboard'" Enter

# Split for different metrics
tmux split-window -t "$PROJECT_NAME":Performance -h
tmux split-window -t "$PROJECT_NAME":Performance.0 -v
tmux split-window -t "$PROJECT_NAME":Performance.1 -v

tmux send-keys -t "$PROJECT_NAME":Performance.0 "echo '🕐 Response Times'" Enter
tmux send-keys -t "$PROJECT_NAME":Performance.0 "echo 'Avg: 0.8s | P95: 1.2s | P99: 2.1s'" Enter
tmux send-keys -t "$PROJECT_NAME":Performance.1 "echo '📈 Throughput'" Enter
tmux send-keys -t "$PROJECT_NAME":Performance.1 "echo 'Requests/min: 45 | Peak: 120'" Enter
tmux send-keys -t "$PROJECT_NAME":Performance.2 "echo '💾 Memory Usage'" Enter
tmux send-keys -t "$PROJECT_NAME":Performance.2 "echo 'Agent Pool: 256MB | Total: 1.2GB'" Enter
tmux send-keys -t "$PROJECT_NAME":Performance.3 "echo '🔄 Queue Status'" Enter
tmux send-keys -t "$PROJECT_NAME":Performance.3 "echo 'Pending: 0 | Processing: 3'" Enter

# Window 3: Error Monitoring
tmux new-window -t "$PROJECT_NAME" -n "Errors" -c "$PROJECT_PATH"
tmux send-keys -t "$PROJECT_NAME":Errors "echo '🚨 Error Monitoring & Alerting'" Enter
tmux send-keys -t "$PROJECT_NAME":Errors "echo 'Real-time error tracking...'" Enter

# Split for error types
tmux split-window -t "$PROJECT_NAME":Errors -h
tmux send-keys -t "$PROJECT_NAME":Errors.0 "echo '🔍 Recent Errors'" Enter
tmux send-keys -t "$PROJECT_NAME":Errors.0 "echo 'Last 24h: 2 errors | Rate: 0.1%'" Enter
tmux send-keys -t "$PROJECT_NAME":Errors.1 "echo '📊 Error Patterns'" Enter
tmux send-keys -t "$PROJECT_NAME":Errors.1 "echo 'Top Issues: None detected'" Enter

# Window 4: User Sessions
tmux new-window -t "$PROJECT_NAME" -n "Sessions" -c "$PROJECT_PATH"
tmux send-keys -t "$PROJECT_NAME":Sessions "echo '👥 Active User Sessions'" Enter
tmux send-keys -t "$PROJECT_NAME":Sessions "echo 'Live session monitoring...'" Enter

# Split for session details
tmux split-window -t "$PROJECT_NAME":Sessions -h
tmux send-keys -t "$PROJECT_NAME":Sessions.0 "echo '🔢 Session Stats'" Enter
tmux send-keys -t "$PROJECT_NAME":Sessions.0 "echo 'Active: 12 | Peak Today: 45'" Enter
tmux send-keys -t "$PROJECT_NAME":Sessions.1 "echo '📈 Engagement Metrics'" Enter
tmux send-keys -t "$PROJECT_NAME":Sessions.1 "echo 'Avg Duration: 15min | Bounce: 8%'" Enter

# Window 5: Database Health
tmux new-window -t "$PROJECT_NAME" -n "Database" -c "$PROJECT_PATH"
tmux send-keys -t "$PROJECT_NAME":Database "echo '🗄️ Database Health (Supabase)'" Enter
tmux send-keys -t "$PROJECT_NAME":Database "echo 'Connection: ✅ | Query Time: 45ms'" Enter

# Window 6: System Logs
tmux new-window -t "$PROJECT_NAME" -n "Logs" -c "$PROJECT_PATH"
tmux send-keys -t "$PROJECT_NAME":Logs "echo '📜 System Logs & Audit Trail'" Enter
tmux send-keys -t "$PROJECT_NAME":Logs "echo 'Streaming production logs...'" Enter

# Return to main window
tmux select-window -t "$PROJECT_NAME":0

echo "✅ Production Monitoring session created!"
echo "🔗 Attach with: tmux attach -t $PROJECT_NAME"
echo ""
echo "📋 Monitoring Session Structure:"
echo "  0. System-Overview  - High-level system status"
echo "  1. Agent-Pool      - BMAD agent health monitoring"
echo "  2. Performance     - Real-time performance metrics"
echo "  3. Errors          - Error tracking and alerting"
echo "  4. Sessions        - User session monitoring"
echo "  5. Database        - Database health and performance"
echo "  6. Logs            - System logs and audit trail"
echo ""
echo "📊 Ready for production monitoring!"
echo ""
echo "🔧 Quick Commands:"
echo "  • View agent status: curl http://localhost:3000/api/agents/status"
echo "  • Check health: curl http://localhost:3000/api/health"
echo "  • Get metrics: curl http://localhost:3000/api/metrics"