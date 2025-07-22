# BMAD Quick Reference

## How to Use BMAD with Claude

When working on this project, Claude should follow the BMAD methodology. Here's how to access and use the BMAD resources:

### 1. BMAD Agent Activation
To use a BMAD agent, reference the agent file directly:
- **Architect**: `.claude/commands/BMad/agents/architect.md`
- **Dev**: `.claude/commands/BMad/agents/dev.md`
- **PM**: `.claude/commands/BMad/agents/pm.md`
- **PO**: `.claude/commands/BMad/agents/po.md`
- **QA**: `.claude/commands/BMad/agents/qa.md`

### 2. BMAD Task Execution
To execute BMAD tasks, reference the task files:
- **Create Story**: `.claude/commands/BMad/tasks/create-brownfield-story.md`
- **Execute Checklist**: `.claude/commands/BMad/tasks/execute-checklist.md`
- **Create Doc**: `.claude/commands/BMad/tasks/create-doc.md`
- **Advanced Elicitation**: `.claude/commands/BMad/tasks/advanced-elicitation.md`

### 3. BMAD Workflow for Complex Features

**Step 1: Choose Agent**
- For technical decisions → Use Architect agent
- For implementation → Use Dev agent
- For planning → Use PM/PO agents
- For testing → Use QA agent

**Step 2: Create Story (if needed)**
- Use `create-brownfield-story.md` task
- Define requirements, acceptance criteria
- Break down into manageable pieces

**Step 3: Design Architecture**
- Use Architect agent for system design
- Create technical documentation
- Plan implementation approach

**Step 4: Implement**
- Follow the designed architecture
- Use proper patterns and conventions
- Maintain code quality standards

**Step 5: Document**
- Update relevant documentation
- Create/update architecture diagrams
- Document API changes

### 4. When to Use BMAD vs Direct Implementation

**Use BMAD for:**
- New features requiring multiple components
- Complex system changes
- Architecture decisions
- Planning and coordination
- Quality assurance planning

**Direct implementation is OK for:**
- Simple bug fixes
- Minor UI changes
- Documentation updates
- Small refactoring tasks

### 5. Accessing BMAD Resources

Claude can access these resources by:
1. Reading the specific agent/task files from `.claude/commands/BMad/`
2. Following the instructions in those files
3. Using the defined workflows and checklists
4. Maintaining the agent personas when activated

### 6. Current Project Context

This AI Course Platform already has:
- BMAD agent system implemented in `lib/agents/`
- Multi-agent collaboration capabilities
- Intelligent task delegation
- Context management and persistence

When working on AI features, leverage the existing BMAD system rather than creating new implementations.

### 7. Key BMAD Principles

1. **Architecture First**: Design before building
2. **Task Sharding**: Break complex work into stories
3. **Multi-Agent Collaboration**: Use specialized agents
4. **Documentation-Driven**: Document before implementing
5. **Quality Focus**: Maintain high standards throughout

Remember: BMAD is about **structured, thoughtful development** rather than quick hacks. Always consider the bigger picture and maintain system integrity. 