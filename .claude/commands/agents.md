# /agents - Multi-Agent System Discovery & Management

## Purpose
Discover, list, and manage all active agents across BMAD, Archon, Tmux, and MCP systems.

## Usage
```
/agents [subcommand] [options]
```

## Subcommands

### List All Agents
```
/agents
/agents list
```
Shows all discovered agents across all systems with their status and capabilities.

### Filter by Type
```
/agents type:bmad
/agents type:archon
/agents type:tmux
/agents type:mcp
/agents type:claude
```

### Show Active Only
```
/agents --active
```

### Get Agent Details
```
/agents details <agent-id>
```

### Start/Stop Services
```
/agents start archon
/agents stop archon
/agents restart all
```

### Spawn New Agent
```
/agents spawn <type> <name> [options]
```

## Implementation Details

This command integrates with:
- **BMAD System**: Internal TypeScript agents in `lib/agents/`
- **Archon Service**: Multi-agent orchestration on port 8100
- **Tmux Sessions**: Parallel terminal-based agents
- **MCP Servers**: Context7, Serena, TestSprite, Sentry, etc.
- **Claude Processes**: Active Claude subagent processes

## Agent Discovery

The system automatically discovers agents through:
1. Tmux session scanning
2. Process monitoring
3. Service health checks
4. Registry synchronization
5. MCP server enumeration

## Output Format

```
🤖 Multi-Agent System Status
═══════════════════════════════════════════

📊 Summary: 23 agents (19 active, 4 idle)

🔷 BMAD Internal Agents (6)
  ✅ content-agent       - Active | Content generation, quizzes
  ✅ conversation-agent  - Active | Chat, tutoring, discussions
  ✅ analysis-agent      - Active | Progress analysis, insights
  ✅ assessment-agent    - Active | Evaluations, testing
  ✅ planning-agent      - Active | Study plans, scheduling
  ✅ coordination-agent  - Active | Orchestration, delegation

🔶 Archon System (1)
  ❌ archon-service      - Error  | Agent generation (port 8100)

🟦 Tmux Sessions (3)
  ✅ agent-dashboard     - Active | Monitoring, visualization
  ✅ coordination-1234   - Active | Task coordination
  ✅ coordination-5678   - Active | Task coordination

🟩 MCP Servers (6)
  ✅ context7            - Active | Documentation, patterns
  ✅ serena              - Active | Code analysis, project mgmt
  ✅ testsprite          - Active | Testing, validation
  ✅ sentry              - Active | Error tracking, monitoring
  ✅ n8n                 - Active | Workflow automation
  ✅ playwright          - Active | Browser automation

🔵 Claude Processes (7)
  ✅ claude-2510         - Active | Main instance
  ✅ claude-9153         - Active | Subagent
  ✅ claude-11814        - Active | Subagent
  ...

═══════════════════════════════════════════
💡 Use '/agents help' for detailed commands
```

## Auto-Start Configuration

The system includes auto-start scripts for:
- Archon service initialization
- Tmux session restoration
- Agent discovery daemon
- Health monitoring

## Persistence

All agent states are persisted in:
- `.agent-orchestrator/registry/agents.json`
- `.tmux/resurrect/` for session restoration
- `.agent-orchestrator/logs/` for history

## Integration with SuperClaude

This command integrates with SuperClaude Framework:
- Auto-activates appropriate personas based on agent types
- Uses MCP servers for enhanced capabilities
- Supports wave orchestration for complex multi-agent tasks
- Enables delegation through `--delegate` flags