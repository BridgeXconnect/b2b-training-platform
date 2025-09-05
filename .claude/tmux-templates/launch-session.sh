#!/bin/bash
# BMAD Multi-Agent System - Tmux Session Launcher
# Master script for launching different development and monitoring sessions

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_PATH="/Users/roymkhabela/Downloads/Ai course platform v2"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════╗"
    echo "║                  BMAD Multi-Agent System                     ║"
    echo "║                   Tmux Session Launcher                      ║"
    echo "╚══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_menu() {
    echo -e "${CYAN}Available Session Templates:${NC}"
    echo ""
    echo -e "  ${GREEN}1.${NC} AI Platform Development    - Full development environment"
    echo -e "  ${GREEN}2.${NC} Agent Testing Session      - Comprehensive agent testing"
    echo -e "  ${GREEN}3.${NC} Production Monitoring      - Live system monitoring"
    echo -e "  ${GREEN}4.${NC} Quick Development          - Minimal development setup"
    echo ""
    echo -e "  ${YELLOW}l.${NC} List active sessions"
    echo -e "  ${YELLOW}k.${NC} Kill all sessions"
    echo -e "  ${RED}q.${NC} Quit"
    echo ""
}

list_sessions() {
    echo -e "${CYAN}Active Tmux Sessions:${NC}"
    if tmux list-sessions 2>/dev/null; then
        echo ""
    else
        echo -e "${YELLOW}No active sessions found.${NC}"
        echo ""
    fi
}

kill_all_sessions() {
    echo -e "${YELLOW}Killing all tmux sessions...${NC}"
    tmux kill-server 2>/dev/null || true
    echo -e "${GREEN}All sessions terminated.${NC}"
    echo ""
}

launch_development() {
    echo -e "${GREEN}🚀 Launching AI Platform Development Session...${NC}"
    "$SCRIPT_DIR/ai-platform-development.sh"
    
    echo ""
    echo -e "${CYAN}Would you like to attach to the session now? (y/n):${NC}"
    read -r attach_choice
    if [[ $attach_choice =~ ^[Yy]$ ]]; then
        tmux attach -t ai-platform
    fi
}

launch_testing() {
    echo -e "${GREEN}🧪 Launching Agent Testing Session...${NC}"
    "$SCRIPT_DIR/agent-testing-session.sh"
    
    echo ""
    echo -e "${CYAN}Would you like to attach to the session now? (y/n):${NC}"
    read -r attach_choice
    if [[ $attach_choice =~ ^[Yy]$ ]]; then
        tmux attach -t agent-testing
    fi
}

launch_monitoring() {
    echo -e "${GREEN}📊 Launching Production Monitoring Session...${NC}"
    "$SCRIPT_DIR/production-monitoring.sh"
    
    echo ""
    echo -e "${CYAN}Would you like to attach to the session now? (y/n):${NC}"
    read -r attach_choice
    if [[ $attach_choice =~ ^[Yy]$ ]]; then
        tmux attach -t prod-monitor
    fi
}

launch_quick() {
    echo -e "${GREEN}⚡ Launching Quick Development Session...${NC}"
    
    PROJECT_NAME="quick-dev"
    
    # Kill existing session if it exists
    tmux kill-session -t "$PROJECT_NAME" 2>/dev/null || true
    
    # Create simple session
    tmux new-session -s "$PROJECT_NAME" -d -c "$PROJECT_PATH"
    tmux rename-window -t "$PROJECT_NAME":0 "Main"
    tmux send-keys -t "$PROJECT_NAME":0 "echo '⚡ Quick Development Session'" Enter
    tmux send-keys -t "$PROJECT_NAME":0 "echo 'Ready for rapid prototyping and testing'" Enter
    
    # Add a second window for testing
    tmux new-window -t "$PROJECT_NAME" -n "Test" -c "$PROJECT_PATH"
    tmux send-keys -t "$PROJECT_NAME":Test "echo '🧪 Testing Window'" Enter
    
    # Return to main window
    tmux select-window -t "$PROJECT_NAME":0
    
    echo -e "${GREEN}✅ Quick development session created!${NC}"
    echo -e "${CYAN}Attach with: tmux attach -t $PROJECT_NAME${NC}"
    
    echo ""
    echo -e "${CYAN}Would you like to attach to the session now? (y/n):${NC}"
    read -r attach_choice
    if [[ $attach_choice =~ ^[Yy]$ ]]; then
        tmux attach -t quick-dev
    fi
}

# Validate tmux is installed
if ! command -v tmux &> /dev/null; then
    echo -e "${RED}Error: tmux is not installed or not in PATH${NC}"
    exit 1
fi

# Validate project path
if [ ! -d "$PROJECT_PATH" ]; then
    echo -e "${RED}Error: Project path does not exist: $PROJECT_PATH${NC}"
    exit 1
fi

# Main loop
while true; do
    clear
    print_header
    list_sessions
    print_menu
    
    echo -e "${CYAN}Select an option:${NC}"
    read -r choice
    
    case $choice in
        1)
            launch_development
            ;;
        2)
            launch_testing
            ;;
        3)
            launch_monitoring
            ;;
        4)
            launch_quick
            ;;
        l|L)
            clear
            print_header
            list_sessions
            echo -e "${CYAN}Press Enter to continue...${NC}"
            read -r
            ;;
        k|K)
            kill_all_sessions
            ;;
        q|Q)
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option. Please try again.${NC}"
            sleep 1
            ;;
    esac
done