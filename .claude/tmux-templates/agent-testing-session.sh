#!/bin/bash
# BMAD Agent Testing Session - Comprehensive agent system testing
# Focused on multi-agent coordination and performance validation

set -e

PROJECT_NAME="agent-testing"
PROJECT_PATH="/Users/roymkhabela/Downloads/Ai course platform v2"

# Validate project path exists
if [ ! -d "$PROJECT_PATH" ]; then
    echo "Error: Project path does not exist: $PROJECT_PATH"
    exit 1
fi

# Kill existing session if it exists
tmux kill-session -t "$PROJECT_NAME" 2>/dev/null || true

echo "🧪 Starting BMAD Agent Testing Session..."

# Create main session
tmux new-session -s "$PROJECT_NAME" -d -c "$PROJECT_PATH"

# Window 0: Test Coordinator
tmux rename-window -t "$PROJECT_NAME":0 "Test-Coordinator"
tmux send-keys -t "$PROJECT_NAME":0 "echo '🧪 BMAD Agent System Testing Coordinator'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '========================================'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo ''" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '📋 Available Test Suites:'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '  1. Agent Pool Tests - npm run test:agents:pool'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '  2. Content Agent Tests - npm run test:agents:content'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '  3. Conversation Tests - npm run test:agents:conversation'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '  4. Analysis Tests - npm run test:agents:analysis'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '  5. Assessment Tests - npm run test:agents:assessment'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '  6. Integration Tests - npm run test:agents:integration'" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo ''" Enter
tmux send-keys -t "$PROJECT_NAME":0 "echo '🚀 Run all tests: npm run test:agents:all'" Enter

# Window 1: Content Agent Testing
tmux new-window -t "$PROJECT_NAME" -n "Content-Tests" -c "$PROJECT_PATH"
tmux send-keys -t "$PROJECT_NAME":Content-Tests "echo '📝 Content Agent Testing'" Enter
tmux send-keys -t "$PROJECT_NAME":Content-Tests "echo 'Testing: Lesson generation, Quiz creation, Explanations, Summaries'" Enter
tmux send-keys -t "$PROJECT_NAME":Content-Tests "echo 'Ready to run: npm run test:agents:content'" Enter

# Window 2: Conversation Agent Testing
tmux new-window -t "$PROJECT_NAME" -n "Conversation-Tests" -c "$PROJECT_PATH"
tmux send-keys -t "$PROJECT_NAME":Conversation-Tests "echo '💬 Conversation Agent Testing'" Enter
tmux send-keys -t "$PROJECT_NAME":Conversation-Tests "echo 'Testing: Tutoring, Practice, Discussion, Clarification'" Enter
tmux send-keys -t "$PROJECT_NAME":Conversation-Tests "echo 'Ready to run: npm run test:agents:conversation'" Enter

# Window 3: Analysis Agent Testing
tmux new-window -t "$PROJECT_NAME" -n "Analysis-Tests" -c "$PROJECT_PATH"
tmux send-keys -t "$PROJECT_NAME":Analysis-Tests "echo '📊 Analysis Agent Testing'" Enter
tmux send-keys -t "$PROJECT_NAME":Analysis-Tests "echo 'Testing: Progress analysis, Performance metrics, Learning patterns'" Enter
tmux send-keys -t "$PROJECT_NAME":Analysis-Tests "echo 'Ready to run: npm run test:agents:analysis'" Enter

# Window 4: Assessment Agent Testing
tmux new-window -t "$PROJECT_NAME" -n "Assessment-Tests" -c "$PROJECT_PATH"
tmux send-keys -t "$PROJECT_NAME":Assessment-Tests "echo '✅ Assessment Agent Testing'" Enter
tmux send-keys -t "$PROJECT_NAME":Assessment-Tests "echo 'Testing: Assessment creation, Evaluation, Feedback, Adaptive assessments'" Enter
tmux send-keys -t "$PROJECT_NAME":Assessment-Tests "echo 'Ready to run: npm run test:agents:assessment'" Enter

# Window 5: Performance Monitoring
tmux new-window -t "$PROJECT_NAME" -n "Performance" -c "$PROJECT_PATH"
tmux send-keys -t "$PROJECT_NAME":Performance "echo '⚡ Performance Monitoring'" Enter
tmux send-keys -t "$PROJECT_NAME":Performance "echo 'Real-time agent metrics and load testing'" Enter

# Split performance window for dual monitoring
tmux split-window -t "$PROJECT_NAME":Performance -h
tmux send-keys -t "$PROJECT_NAME":Performance.0 "echo '📈 Agent Pool Metrics'" Enter
tmux send-keys -t "$PROJECT_NAME":Performance.0 "echo 'Monitor: Response times, Success rates, Queue length'" Enter
tmux send-keys -t "$PROJECT_NAME":Performance.1 "echo '🔍 System Health'" Enter
tmux send-keys -t "$PROJECT_NAME":Performance.1 "echo 'Monitor: Memory usage, CPU load, Error rates'" Enter

# Window 6: Integration Testing
tmux new-window -t "$PROJECT_NAME" -n "Integration" -c "$PROJECT_PATH"
tmux send-keys -t "$PROJECT_NAME":Integration "echo '🔗 Integration Testing'" Enter
tmux send-keys -t "$PROJECT_NAME":Integration "echo 'Testing: Multi-agent coordination, Context sharing, Error handling'" Enter
tmux send-keys -t "$PROJECT_NAME":Integration "echo 'Ready to run: npm run test:agents:integration'" Enter

# Return to main window
tmux select-window -t "$PROJECT_NAME":0

echo "✅ BMAD Agent Testing session created!"
echo "🔗 Attach with: tmux attach -t $PROJECT_NAME"
echo ""
echo "📋 Testing Session Structure:"
echo "  0. Test-Coordinator  - Main testing control center"
echo "  1. Content-Tests     - Content agent functionality"
echo "  2. Conversation-Tests - Conversation agent testing"
echo "  3. Analysis-Tests    - Analysis agent validation"
echo "  4. Assessment-Tests  - Assessment agent testing"
echo "  5. Performance      - Real-time performance monitoring"
echo "  6. Integration      - Multi-agent integration tests"
echo ""
echo "🧪 Ready for comprehensive agent testing!"