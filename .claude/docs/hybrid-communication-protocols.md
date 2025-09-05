# Hybrid Communication Protocols
## Standardized Communication Between Manual Tmux Orchestration and Automated Agent Systems

### Overview

This document establishes standardized communication protocols for seamless interaction between traditional tmux orchestration and modern multi-agent systems (BMAD + Claude Code + MCP).

## Protocol Architecture

### 1. **Message Flow Hierarchy**

```
User/Developer
      ↓
┌─────────────────┐
│   Claude Code   │ (Master Orchestrator)
│  SuperClaude    │
└─────────────────┘
      ↓
┌─────────────────┐
│  Tmux Session   │ (Visual Coordination)
│   Management    │
└─────────────────┘
      ↓
┌─────────────────┐
│  Agent Systems  │ (Intelligent Processing)
│ BMAD/MCP/Archon │
└─────────────────┘
      ↓
┌─────────────────┐
│   Execution     │ (Task Completion)
│   & Results     │
└─────────────────┘
```

### 2. **Communication Channels**

#### **Channel 1: Command Interface**
- **Purpose**: Direct user commands and tmux session management
- **Protocol**: Bash scripts + tmux commands
- **Examples**: Session creation, window management, manual coordination

#### **Channel 2: Agent API Interface**  
- **Purpose**: Intelligent task processing and automation
- **Protocol**: HTTP API + TypeScript interfaces
- **Examples**: BMAD agent requests, MCP server coordination

#### **Channel 3: Hybrid Bridge Interface**
- **Purpose**: Coordination between manual and automated systems
- **Protocol**: Message queuing + event-driven coordination
- **Examples**: Escalation, handoffs, context synchronization

## Standardized Message Formats

### 1. **Tmux Command Messages**

```typescript
interface TmuxCommand {
  session: string;
  window?: string;
  pane?: number;
  command: string;
  background?: boolean;
  timeout?: number;
  metadata: {
    timestamp: Date;
    source: 'manual' | 'automated' | 'hybrid';
    priority: 'low' | 'medium' | 'high' | 'urgent';
  };
}

// Example
const tmuxCmd: TmuxCommand = {
  session: 'ai-platform',
  window: 'BMAD-Dev',
  command: 'npm run agents:status',
  metadata: {
    timestamp: new Date(),
    source: 'automated',
    priority: 'medium'
  }
};
```

### 2. **Agent Request Messages**

```typescript
interface AgentRequest {
  id: string;
  type: AgentType;
  payload: {
    operation: string;
    parameters: Record<string, any>;
    context: AgentContext;
  };
  routing: {
    preferredAgent?: string;
    fallbackStrategy: 'queue' | 'redirect' | 'escalate';
    timeout: number;
  };
  coordination: {
    tmuxSession?: string;
    requiresManualReview: boolean;
    escalationThreshold: number;
  };
}

// Example
const agentReq: AgentRequest = {
  id: 'content-gen-001',
  type: AgentType.CONTENT,
  payload: {
    operation: 'generateLesson',
    parameters: { topic: 'React Hooks', level: 'intermediate' },
    context: sessionContext
  },
  routing: {
    fallbackStrategy: 'queue',
    timeout: 30000
  },
  coordination: {
    tmuxSession: 'ai-platform',
    requiresManualReview: false,
    escalationThreshold: 3
  }
};
```

### 3. **Hybrid Coordination Messages**

```typescript
interface HybridMessage {
  id: string;
  type: 'escalation' | 'handoff' | 'sync' | 'notification';
  source: 'tmux' | 'agent' | 'system';
  target: 'tmux' | 'agent' | 'user';
  payload: {
    action: string;
    data: any;
    instructions?: string;
  };
  metadata: {
    timestamp: Date;
    urgency: 'info' | 'warning' | 'error' | 'critical';
    requiresResponse: boolean;
    timeout?: number;
  };
}

// Example: Agent escalation to manual intervention
const escalationMsg: HybridMessage = {
  id: 'esc-001',
  type: 'escalation',
  source: 'agent',
  target: 'tmux',
  payload: {
    action: 'manual_intervention_required',
    data: {
      error: 'API rate limit exceeded',
      suggestedActions: ['wait', 'use_fallback_model', 'notify_user']
    },
    instructions: 'Agent cannot complete task due to rate limiting'
  },
  metadata: {
    timestamp: new Date(),
    urgency: 'warning',
    requiresResponse: true,
    timeout: 300000 // 5 minutes
  }
};
```

## Communication Patterns

### 1. **Request-Response Pattern**

```typescript
class HybridCommunicator {
  async sendTmuxCommand(command: TmuxCommand): Promise<TmuxResponse> {
    // Send command to tmux session
    const result = await tmux.sendKeys(command.session, command.command);
    
    // Capture output if needed
    const output = await tmux.capturePane(command.session);
    
    return {
      success: result.exitCode === 0,
      output: output,
      timestamp: new Date()
    };
  }
  
  async sendAgentRequest(request: AgentRequest): Promise<AgentResponse> {
    // Route to appropriate agent system
    const system = this.selectAgentSystem(request.type);
    
    // Execute request with timeout and error handling
    try {
      const response = await system.processRequest(request);
      
      // Handle coordination requirements
      if (request.coordination.requiresManualReview) {
        await this.requestManualReview(response, request.coordination.tmuxSession);
      }
      
      return response;
    } catch (error) {
      // Auto-escalate on failure
      await this.escalateToManual(request, error);
      throw error;
    }
  }
}
```

### 2. **Event-Driven Pattern**

```typescript
class EventCoordinator extends EventEmitter {
  constructor() {
    super();
    this.setupEventHandlers();
  }
  
  private setupEventHandlers() {
    // Agent events
    this.on('agent:completed', this.handleAgentCompletion);
    this.on('agent:failed', this.handleAgentFailure);
    this.on('agent:timeout', this.handleAgentTimeout);
    
    // Tmux events  
    this.on('tmux:session_created', this.handleSessionCreated);
    this.on('tmux:window_activated', this.handleWindowActivated);
    this.on('tmux:command_executed', this.handleCommandExecuted);
    
    // Hybrid coordination events
    this.on('hybrid:escalation', this.handleEscalation);
    this.on('hybrid:handoff', this.handleHandoff);
    this.on('hybrid:sync_required', this.handleSyncRequired);
  }
  
  private async handleAgentFailure(event: AgentFailureEvent) {
    // Determine if manual intervention is needed
    if (event.retries >= event.maxRetries) {
      // Escalate to tmux session
      const escalation: HybridMessage = {
        type: 'escalation',
        source: 'agent',
        target: 'tmux',
        payload: {
          action: 'manual_intervention',
          data: event.error
        }
      };
      
      await this.sendHybridMessage(escalation);
      
      // Highlight relevant tmux window
      if (event.tmuxSession) {
        await tmux.highlightWindow(event.tmuxSession, 'Agent-Monitor');
      }
    }
  }
}
```

### 3. **Pub-Sub Pattern**

```typescript
class MessageBroker {
  private subscribers: Map<string, Function[]> = new Map();
  
  subscribe(topic: string, handler: Function) {
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, []);
    }
    this.subscribers.get(topic)!.push(handler);
  }
  
  async publish(topic: string, message: any) {
    const handlers = this.subscribers.get(topic) || [];
    
    // Execute all handlers in parallel
    await Promise.all(
      handlers.map(handler => 
        this.safeExecute(handler, message)
      )
    );
  }
  
  private async safeExecute(handler: Function, message: any) {
    try {
      await handler(message);
    } catch (error) {
      console.error('Handler execution failed:', error);
    }
  }
}

// Usage
const broker = new MessageBroker();

// Subscribe to agent completions
broker.subscribe('agent:content:completed', (message) => {
  tmux.sendNotification(message.session, `Content generated: ${message.title}`);
});

// Subscribe to tmux window changes
broker.subscribe('tmux:window:activated', (message) => {
  if (message.window === 'Agent-Monitor') {
    // Refresh agent metrics display
    bmadSystem.refreshMetrics();
  }
});
```

## Coordination Protocols

### 1. **Escalation Protocol**

```typescript
interface EscalationRule {
  condition: (context: any) => boolean;
  action: 'notify' | 'pause' | 'redirect' | 'manual_takeover';
  timeout: number;
  escalationChain: string[];
}

const escalationRules: EscalationRule[] = [
  {
    condition: (ctx) => ctx.errorCount > 3,
    action: 'notify',
    timeout: 60000,
    escalationChain: ['tmux:notification', 'user:alert']
  },
  {
    condition: (ctx) => ctx.responseTime > 30000,
    action: 'redirect',
    timeout: 5000,
    escalationChain: ['agent:fallback', 'manual_takeover']
  },
  {
    condition: (ctx) => ctx.severity === 'critical',
    action: 'manual_takeover',
    timeout: 0,
    escalationChain: ['tmux:highlight', 'user:immediate']
  }
];

class EscalationManager {
  async processEscalation(context: any, rules: EscalationRule[]) {
    for (const rule of rules) {
      if (rule.condition(context)) {
        await this.executeEscalation(rule, context);
        break; // First matching rule wins
      }
    }
  }
  
  private async executeEscalation(rule: EscalationRule, context: any) {
    for (const target of rule.escalationChain) {
      const [system, action] = target.split(':');
      
      switch (system) {
        case 'tmux':
          await this.handleTmuxEscalation(action, context);
          break;
        case 'agent':
          await this.handleAgentEscalation(action, context);
          break;
        case 'user':
          await this.handleUserEscalation(action, context);
          break;
      }
    }
  }
}
```

### 2. **Handoff Protocol**

```typescript
interface HandoffProtocol {
  from: 'tmux' | 'agent';
  to: 'tmux' | 'agent';
  trigger: HandoffTrigger;
  contextTransfer: ContextTransferConfig;
  validation: ValidationConfig;
}

interface HandoffTrigger {
  type: 'completion' | 'failure' | 'timeout' | 'manual' | 'threshold';
  condition: any;
}

interface ContextTransferConfig {
  preserveHistory: boolean;
  includeMetrics: boolean;
  shareResources: boolean;
  contextMapping: Record<string, string>;
}

class HandoffManager {
  async executeHandoff(protocol: HandoffProtocol, context: any) {
    // 1. Validate handoff conditions
    if (!this.validateHandoffConditions(protocol, context)) {
      throw new Error('Handoff conditions not met');
    }
    
    // 2. Prepare context transfer
    const transferContext = await this.prepareContextTransfer(
      protocol.contextTransfer, 
      context
    );
    
    // 3. Execute handoff
    switch (protocol.to) {
      case 'tmux':
        await this.handoffToTmux(transferContext);
        break;
      case 'agent':
        await this.handoffToAgent(transferContext);
        break;
    }
    
    // 4. Validate successful handoff
    await this.validateHandoff(protocol.validation, transferContext);
  }
  
  private async handoffToTmux(context: any) {
    // Create appropriate tmux session/window
    const session = await tmux.ensureSession(context.targetSession);
    
    // Transfer context as tmux environment variables
    await tmux.setEnvironment(session, context.environmentVars);
    
    // Display handoff information
    await tmux.sendMessage(session, context.handoffMessage);
  }
  
  private async handoffToAgent(context: any) {
    // Find appropriate agent
    const agent = await bmadSystem.selectOptimalAgent(context.taskType);
    
    // Transfer context to agent session
    const agentContext = this.mapToAgentContext(context);
    
    // Initiate agent processing
    await agent.process({
      id: context.requestId,
      type: context.agentType,
      payload: context.payload,
      context: agentContext
    });
  }
}
```

### 3. **Synchronization Protocol**

```typescript
class SynchronizationManager {
  private syncPoints: Map<string, SyncPoint> = new Map();
  
  async establishSyncPoint(id: string, participants: string[], timeout: number) {
    const syncPoint: SyncPoint = {
      id,
      participants,
      arrived: new Set(),
      data: new Map(),
      timeout: Date.now() + timeout,
      resolved: false
    };
    
    this.syncPoints.set(id, syncPoint);
    
    // Set up timeout cleanup
    setTimeout(() => this.cleanupSyncPoint(id), timeout);
    
    return syncPoint;
  }
  
  async arrive(syncId: string, participant: string, data?: any) {
    const syncPoint = this.syncPoints.get(syncId);
    if (!syncPoint || syncPoint.resolved) {
      throw new Error(`Invalid or expired sync point: ${syncId}`);
    }
    
    syncPoint.arrived.add(participant);
    if (data) {
      syncPoint.data.set(participant, data);
    }
    
    // Check if all participants have arrived
    if (syncPoint.arrived.size === syncPoint.participants.length) {
      await this.resolveSyncPoint(syncPoint);
    }
  }
  
  private async resolveSyncPoint(syncPoint: SyncPoint) {
    syncPoint.resolved = true;
    
    // Combine data from all participants
    const combinedData = Object.fromEntries(syncPoint.data);
    
    // Notify all participants
    for (const participant of syncPoint.participants) {
      await this.notifyParticipant(participant, {
        syncId: syncPoint.id,
        status: 'resolved',
        data: combinedData
      });
    }
    
    // Cleanup
    this.syncPoints.delete(syncPoint.id);
  }
}
```

## Implementation Examples

### 1. **Development Session Coordination**

```typescript
// Start development session with hybrid coordination
async function startDevelopmentSession() {
  // 1. Create tmux session structure
  const session = await tmux.createSession('ai-platform');
  await tmux.setupWindows(session, developmentWindowConfig);
  
  // 2. Initialize BMAD agent system
  const bmadSystem = new BMADSystem();
  await bmadSystem.initialize(agentPool);
  
  // 3. Establish communication bridge
  const communicator = new HybridCommunicator();
  await communicator.connectSystems(session, bmadSystem);
  
  // 4. Set up event coordination
  const coordinator = new EventCoordinator();
  coordinator.linkSystems(session, bmadSystem);
  
  // 5. Initialize monitoring
  const monitor = new SystemMonitor();
  await monitor.startMonitoring(session, bmadSystem);
}
```

### 2. **Task Execution with Fallback**

```typescript
async function executeHybridTask(task: Task) {
  try {
    // 1. Attempt automated processing
    const agentResponse = await bmadSystem.processRequest(
      task.sessionId,
      task.agentType,
      task.payload
    );
    
    if (agentResponse.success) {
      // Display results in tmux
      await tmux.displayResults(task.sessionId, agentResponse.data);
      return agentResponse;
    }
  } catch (error) {
    // 2. Escalate to manual intervention
    const escalation: HybridMessage = {
      type: 'escalation',
      source: 'agent',
      target: 'tmux',
      payload: {
        action: 'manual_completion',
        data: { task, error: error.message }
      }
    };
    
    await communicator.sendHybridMessage(escalation);
    
    // 3. Wait for manual completion
    return await this.waitForManualCompletion(task.id);
  }
}
```

## Best Practices

### 1. **Message Design**
- **Structured**: Use consistent interfaces and schemas
- **Traceable**: Include unique IDs and timestamps
- **Context-Rich**: Provide sufficient information for decision-making
- **Timeout-Aware**: Always include timeout handling

### 2. **Error Handling**
- **Graceful Degradation**: Fall back to manual processes when automation fails
- **Clear Escalation**: Provide actionable information for manual intervention
- **Context Preservation**: Maintain state across system boundaries
- **Recovery Paths**: Design for resumption after errors

### 3. **Performance Optimization**
- **Async Communication**: Use non-blocking message passing
- **Batch Processing**: Group related messages when possible
- **Circuit Breakers**: Prevent cascade failures
- **Resource Pooling**: Reuse connections and sessions

### 4. **Security Considerations**
- **Message Validation**: Validate all inter-system messages
- **Access Control**: Restrict system-to-system communication
- **Audit Logging**: Log all coordination activities
- **Sensitive Data**: Encrypt sensitive information in transit

This hybrid communication protocol enables seamless coordination between traditional tmux orchestration and modern multi-agent systems while maintaining the strengths of both approaches.