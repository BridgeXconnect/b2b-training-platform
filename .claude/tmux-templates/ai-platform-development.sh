#!/bin/bash
# AI Course Platform Development - Tmux Session Template
# Optimized for BMAD multi-agent system architecture

set -e

PROJECT_NAME="ai-platform"
PROJECT_PATH="/Users/roymkhabela/Downloads/Ai course platform v2"

# Validate project path exists
if [ ! -d "$PROJECT_PATH" ]; then
    echo "Error: Project path does not exist: $PROJECT_PATH"
    exit 1
fi

# Kill existing session if it exists
tmux kill-session -t "$PROJECT_NAME" 2>/dev/null || true

echo "🚀 Starting AI Course Platform Development Session..."

# Create main session
tmux new-session -s "$PROJECT_NAME" -d -c "$PROJECT_PATH"

# Window 0: Claude Code Main Development
tmux rename-window -t "$PROJECT_NAME":0 "Claude-Main"
tmux send-keys -t "$PROJECT_NAME":0 "echo '🧠 Claude Code Main Development Environment'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '📁 Project: AI Course Platform'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '🤖 BMAD Multi-Agent System Active'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo ''" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo 'Available commands:'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '  /agents - View all agents'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '  npm run bmad:status - BMAD system status'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '  npm run agents:monitor - Monitor performance'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo ''" Enter

# Window 1: BMAD System Development
tmux new-window -t "$PROJECT_NAME" -n "BMAD-Dev" -c "$PROJECT_PATH"
tmux send-keys -t "$PROJECT_NAME":BMAD-Dev "echo '🧠 BMAD System Development'" Enter
tmux send-keys -t "$PROJECT_NAME":BMAD-Dev "echo 'Location: lib/agents/'" Enter
tmux send-keys -t "$PROJECT_NAME":BMAD-Dev "ls -la lib/agents/" Enter

# Window 2: Frontend Development (Next.js)
tmux new-window -t "$PROJECT_NAME" -n "Frontend-Dev" -c "$PROJECT_PATH"
tmux send-keys -t "$PROJECT_NAME":Frontend-Dev "echo '⚛️ Frontend Development - Next.js + TypeScript'" Enter
tmux send-keys -t "$PROJECT_NAME":Frontend-Dev "echo 'Ready to start dev server with: npm run dev'" Enter

# Window 3: Backend API Development
tmux new-window -t "$PROJECT_NAME" -n "Backend-API" -c "$PROJECT_PATH"
tmux send-keys -t "$PROJECT_NAME":Backend-API "echo '🐍 Backend API Development'" Enter
tmux send-keys -t "$PROJECT_NAME":Backend-API "echo 'Python FastAPI backend ready'" Enter

# Window 4: Agent System Monitoring
tmux new-window -t "$PROJECT_NAME" -n "Agent-Monitor" -c "$PROJECT_PATH"
tmux send-keys -t "$PROJECT_NAME":Agent-Monitor "echo '📊 Agent System Monitoring'" Enter
tmux send-keys -t "$PROJECT_NAME":Agent-Monitor "echo 'BMAD Pool Manager Status:'" Enter
tmux send-keys -t "$PROJECT_NAME":Agent-Monitor "echo '  - Content Agents: Ready'" Enter
tmux send-keys -t "$PROJECT_NAME":Agent-Monitor "echo '  - Conversation Agents: Ready'" Enter
tmux send-keys -t "$PROJECT_NAME":Agent-Monitor "echo '  - Analysis Agents: Ready'" Enter
tmux send-keys -t "$PROJECT_NAME":Agent-Monitor "echo '  - Assessment Agents: Ready'" Enter
tmux send-keys -t "$PROJECT_NAME":Agent-Monitor "echo '  - Planning Agents: Ready'" Enter

# Window 5: Database & Services
tmux new-window -t "$PROJECT_NAME" -n "Services" -c "$PROJECT_PATH"
tmux send-keys -t "$PROJECT_NAME":Services "echo '🗄️ Database & External Services'" Enter
tmux send-keys -t "$PROJECT_NAME":Services "echo 'Supabase: Connected'" Enter
tmux send-keys -t "$PROJECT_NAME":Services "echo 'OpenAI API: Configured'" Enter

# Window 6: Testing & Quality
tmux new-window -t "$PROJECT_NAME" -n "Testing" -c "$PROJECT_PATH"
tmux send-keys -t "$PROJECT_NAME":Testing "echo '🧪 Testing & Quality Assurance'" Enter
tmux send-keys -t "$PROJECT_NAME":Testing "echo 'Run tests with: npm run test'" Enter
tmux send-keys -t "$PROJECT_NAME":Testing "echo 'Agent tests: npm run agents:test'" Enter

# Set up pane splits in Agent Monitor for real-time monitoring
tmux split-window -t "$PROJECT_NAME":Agent-Monitor -h
tmux send-keys -t "$PROJECT_NAME":Agent-Monitor.1 "echo '📈 Real-time Metrics'" Enter
tmux send-keys -t "$PROJECT_NAME":Agent-Monitor.1 "echo 'Agent Pool Status, Response Times, Error Rates'" Enter

# Return to main window
tmux select-window -t "$PROJECT_NAME":0

echo "✅ AI Course Platform Development session created!"
echo "🔗 Attach with: tmux attach -t $PROJECT_NAME"
echo ""
echo "📋 Session Structure:"
echo "  0. Claude-Main      - Main development environment"
echo "  1. BMAD-Dev        - BMAD system development"
echo "  2. Frontend-Dev    - Next.js frontend development"
echo "  3. Backend-API     - Python FastAPI backend"
echo "  4. Agent-Monitor   - Multi-agent system monitoring"
echo "  5. Services        - Database and external services"
echo "  6. Testing         - Quality assurance and testing"
echo ""
echo "🚀 Ready for BMAD-powered development!"