# BMAD Agent System Architecture

## Overview
The platform implements a sophisticated BMAD (Business Multi-Agent Delegation) system for parallel AI processing and intelligent task coordination.

## Agent Types (6 Specialized Agents)
1. **ContentAgent**: Lesson/quiz/explanation generation
2. **ConversationAgent**: Multi-type chat handling (tutoring, practice, discussion)
3. **AnalysisAgent**: Progress/performance/learning pattern analysis
4. **AssessmentAgent**: Assessment creation, evaluation, adaptive testing
5. **PlanningAgent**: Study plans, lesson sequences, learning paths
6. **CoordinationAgent**: Multi-agent orchestration and result aggregation

## System Components
- **BMADSystem**: Main orchestration class
- **AgentPoolManager**: Load balancing and agent selection
- **AgentContextManager**: Session and context management
- **BaseAgent**: Abstract base class with metrics and error handling

## Current Implementation Status
- **BMAD System**: Fully implemented in `lib/agents/`
- **API Integration**: Available but commented out in chat route
- **Agent Discovery**: 25 agents reported as active
- **CopilotKit Integration**: BMAD handlers available for enhanced actions
- **Demo Mode**: Currently using direct OpenAI integration for simplicity

## Integration Points
- `/api/chat`: BMAD integration commented out, using fallback
- `/api/copilotkit`: BMAD handlers for CopilotKit actions
- `/api/agents`: Agent management and status endpoints
- Frontend components: Ready for BMAD integration