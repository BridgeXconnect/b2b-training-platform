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