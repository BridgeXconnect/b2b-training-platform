# Claude Coding Guide - BMAD Method

## Overview
This project follows the **BMAD (Business Multi-Agent Delegation)** methodology for development. When coding, always follow the BMAD approach:

1. **Architecture First**: Design solid architecture before building features
2. **Task Sharding**: Break complex tasks into manageable stories
3. **Multi-Agent Collaboration**: Use specialized agents for different aspects
4. **Documentation-Driven**: Create proper documentation before implementation

## BMAD Resources Location
All BMAD resources are located in `.claude/commands/BMad/`:
- **Tasks**: `.claude/commands/BMad/tasks/`
- **Agents**: `.claude/commands/BMad/agents/`

## When to Use BMAD Method

### Use BMAD for:
- **New Features**: Always start with architecture and story creation
- **Complex Changes**: Break down into manageable stories
- **System Design**: Use architect agent for technical decisions
- **Project Planning**: Use PM/PO agents for planning
- **Quality Assurance**: Use QA agent for testing strategies

### BMAD Workflow:
1. **Analyze Request**: Determine if it's simple or complex
2. **Choose Agent**: Select appropriate BMAD agent (architect, dev, pm, etc.)
3. **Create Story**: If complex, create a proper story first
4. **Design Architecture**: Plan the technical approach
5. **Implement**: Build with proper structure
6. **Document**: Update relevant documentation

## Available BMAD Agents

### Core Agents:
- **Architect** (`.claude/commands/BMad/agents/architect.md`): Technical architecture and system design
- **Dev** (`.claude/commands/BMad/agents/dev.md`): Implementation and coding
- **PM** (`.claude/commands/BMad/agents/pm.md`): Project management and planning
- **PO** (`.claude/commands/BMad/agents/po.md`): Product ownership and requirements
- **QA** (`.claude/commands/BMad/agents/qa.md`): Quality assurance and testing

### Specialized Agents:
- **Analyst** (`.claude/commands/BMad/agents/analyst.md`): Data analysis and insights
- **UX Expert** (`.claude/commands/BMad/agents/ux-expert.md`): User experience design
- **SM** (`.claude/commands/BMad/agents/sm.md`): Scrum master and process
- **BMAD Master** (`.claude/commands/BMad/agents/bmad-master.md`): Overall orchestration
- **BMAD Orchestrator** (`.claude/commands/BMad/agents/bmad-orchestrator.md`): Multi-agent coordination

## Available BMAD Tasks

### Core Tasks:
- **Create Story** (`.claude/commands/BMad/tasks/create-brownfield-story.md`): Create development stories
- **Execute Checklist** (`.claude/commands/BMad/tasks/execute-checklist.md`): Follow structured checklists
- **Create Doc** (`.claude/commands/BMad/tasks/create-doc.md`): Generate documentation
- **Shard Doc** (`.claude/commands/BMad/tasks/shard-doc.md`): Break down complex documentation

### Advanced Tasks:
- **Advanced Elicitation** (`.claude/commands/BMad/tasks/advanced-elicitation.md`): Deep requirement gathering
- **Brainstorming Session** (`.claude/commands/BMad/tasks/facilitate-brainstorming-session.md`): Collaborative ideation
- **Deep Research** (`.claude/commands/BMad/tasks/create-deep-research-prompt.md`): Comprehensive research
- **Index Docs** (`.claude/commands/BMad/tasks/index-docs.md`): Documentation organization

## Coding Standards

### Architecture First Approach:
1. **Never jump straight to coding** for complex features
2. **Always design architecture** before implementation
3. **Create stories** for features that require multiple components
4. **Document decisions** and technical approaches

### Code Quality:
- Follow TypeScript best practices
- Use proper error handling
- Implement proper testing strategies
- Maintain clean, readable code
- Follow existing patterns in the codebase

### Documentation:
- Update relevant documentation when making changes
- Create architecture diagrams for complex features
- Document API changes and new endpoints
- Maintain clear commit messages

## Project Context

This is an **AI Course Platform** with the following key components:
- **Frontend**: Next.js with TypeScript
- **Backend**: Python FastAPI
- **AI Integration**: OpenAI API with BMAD agent system
- **Database**: Supabase
- **UI**: Tailwind CSS with shadcn/ui components

## Current Project Status

The project has a **BMAD agent system** already implemented in `lib/agents/` that provides:
- Multi-agent collaboration
- Intelligent task delegation
- Context management
- Performance monitoring

When working on AI-related features, leverage the existing BMAD system rather than creating new implementations.

## Quick Reference

### For Simple Changes:
- Direct implementation is acceptable
- Follow existing patterns
- Update relevant documentation

### For Complex Features:
1. Use appropriate BMAD agent (architect, dev, pm)
2. Create a story if needed
3. Design architecture first
4. Implement with proper structure
5. Document changes

### For AI Features:
- Leverage existing BMAD agent system in `lib/agents/`
- Use specialized agents for content generation, analysis, etc.
- Follow the established patterns in the codebase

Remember: **BMAD is about structured, thoughtful development** rather than quick hacks. Always consider the bigger picture and maintain system integrity.

## 🤖 Multi-Agent System Architecture

This project implements a **sophisticated multi-tiered agent ecosystem** with automatic orchestration and intelligent task delegation:

### Primary Agent Systems

#### 1. **BMAD (Business Multi-Agent Delegation) System** 
**Location**: `lib/agents/` - Core TypeScript implementation
- **Purpose**: Educational AI platform with specialized content agents
- **Architecture**: Event-driven pool manager with context-aware sessions
- **Agent Types**: Content, Conversation, Analysis, Assessment, Planning, Coordination
- **Key Features**: 
  - Parallel processing with load balancing
  - Context preservation across sessions
  - Performance monitoring and metrics
  - Adaptive difficulty and personalized learning paths

#### 2. **Claude Code Sub-Agent Integration**
**Location**: `.claude/agents/` - Claude Code specialized agents
- **AI Platform Architect**: System design and architecture decisions
- **React UI Specialist**: Frontend development and component creation  
- **Python AI Developer**: Backend AI services and API development
- **Integration Specialist**: Cross-system communication and coordination
- **Performance Security Auditor**: Code quality, security, and optimization

#### 3. **BMAD Core Agents**
**Location**: `.bmad-core/agents/` - Strategic business agents
- **Architect**: Technical architecture and system design
- **Dev/QA/PM/PO**: Development lifecycle management
- **UX Expert**: User experience and interface design
- **Analyst**: Data analysis and insights
- **BMAD Master/Orchestrator**: Overall system coordination

#### 4. **Archon Dynamic Agent System**
**Location**: `archon/` - Dynamic agent generation
- **Purpose**: On-demand agent creation with refinement workflows
- **Features**: Real-time agent spawning, task-specific specialization
- **Interface**: http://localhost:8100 (when running)

### Agent Communication Patterns

#### Hierarchical Coordination
```
Claude Code (Master Orchestrator)
├── BMAD System (Educational AI)
│   ├── Content Agents (Parallel Pool)
│   ├── Conversation Agents (Context-Aware)
│   └── Assessment Agents (Adaptive)
├── Sub-Agent Task Delegation
│   ├── Specialized Domain Experts
│   └── Integration Specialists
└── External Systems Integration
    ├── MCP Servers (Context7, Serena, etc.)
    └── Archon Dynamic Agents
```

#### Intelligent Routing
1. **Task Analysis**: Automatic classification of request complexity and domain
2. **Agent Selection**: Best-fit selection based on capabilities and current load
3. **Context Preservation**: Shared session state across agent interactions
4. **Result Aggregation**: Intelligent combination of multi-agent responses

### Tmux Integration Patterns

While this system differs from traditional tmux orchestrator models, it supports tmux for:

#### Development Workflow Patterns
```bash
# Session Structure for AI Platform Development
tmux new-session -s ai-platform -d -c "$PROJECT_PATH"

# Window 0: Main Development (Claude Code)
tmux rename-window -t ai-platform:0 "Claude-Main"

# Window 1: BMAD System Testing
tmux new-window -t ai-platform -n "BMAD-Dev" -c "$PROJECT_PATH"

# Window 2: Frontend Development
tmux new-window -t ai-platform -n "Frontend-Dev" -c "$PROJECT_PATH"

# Window 3: Backend API Development  
tmux new-window -t ai-platform -n "Backend-API" -c "$PROJECT_PATH"

# Window 4: Agent System Monitoring
tmux new-window -t ai-platform -n "Agent-Monitor" -c "$PROJECT_PATH"
```

#### Agent System Commands
```bash
# BMAD System Status
npm run bmad:status

# Start agent pool
npm run agents:start

# Monitor agent performance
npm run agents:monitor

# Test agent integration
npm run agents:test
```

### Integration Best Practices

#### For Educational AI Features
1. **Use BMAD System**: Leverage existing `lib/agents/` implementation
2. **Agent Selection**: Choose appropriate agent type (Content, Conversation, Analysis, etc.)  
3. **Context Management**: Maintain session state for personalized experiences
4. **Performance Monitoring**: Track agent metrics and system health

#### For Development Tasks
1. **Use Claude Code Sub-Agents**: Access via Task tool for specialized domain work
2. **Tmux Coordination**: Structure sessions for parallel development workflows
3. **MCP Integration**: Leverage external servers for enhanced capabilities
4. **Quality Gates**: Use built-in validation and testing frameworks

#### For Complex Orchestration
1. **BMAD Coordination Agent**: Multi-agent task orchestration
2. **Hierarchical Delegation**: Break complex tasks into specialized sub-tasks
3. **Result Aggregation**: Intelligent combination of multiple agent outputs
4. **Error Handling**: Graceful fallback and retry mechanisms

### System Health Monitoring

#### Key Metrics
- **Agent Pool Status**: Active agents, queue length, error rates
- **Response Times**: Average processing time per agent type
- **Context Retention**: Session state preservation across interactions
- **System Load**: Resource utilization and performance bottlenecks

#### Debugging & Troubleshooting
```bash
# Check agent system status
curl http://localhost:3000/api/agents/status

# View agent metrics
curl http://localhost:3000/api/agents/metrics

# Test agent communication
node lib/agents/test-bmad-system.js
```

This architecture provides **enterprise-grade AI agent orchestration** with educational specialization, combining the power of BMAD methodology with modern multi-agent systems for scalable, intelligent task delegation. 