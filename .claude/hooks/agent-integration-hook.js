/**
 * Claude Code Agent Integration Hook
 * Automatically detects and routes requests to multi-agent ecosystem
 * 
 * This hook intercepts Claude Code requests and intelligently determines
 * whether to delegate to BMAD, Archon, MCP, or other specialized agents
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class AgentIntegrationHook {
  constructor() {
    this.projectRoot = process.cwd();
    this.agentRegistry = new Map();
    this.bmadSystem = null;
    this.mcpServers = new Map();
    this.archonService = null;
    this.performanceMetrics = {
      totalRequests: 0,
      agentDelegations: 0,
      fallbacksToClaudeCode: 0,
      avgResponseTime: 0
    };
    
    this.initialize();
  }

  async initialize() {
    try {
      // Load agent registry
      await this.loadAgentRegistry();
      
      // Check BMAD system availability
      await this.checkBMADAvailability();
      
      // Detect MCP servers
      await this.detectMCPServers();
      
      // Check Archon service
      await this.checkArchonAvailability();
      
      console.log(`🤖 Agent Integration Hook initialized: ${this.agentRegistry.size} agents available`);
    } catch (error) {
      console.warn('⚠️ Agent Integration Hook initialization failed:', error.message);
    }
  }

  async loadAgentRegistry() {
    const registryPath = path.join(this.projectRoot, '.agent-orchestrator', 'registry', 'agents.json');
    
    if (fs.existsSync(registryPath)) {
      try {
        const registryData = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
        
        // Load BMAD agents
        if (registryData.bmad) {
          registryData.bmad.forEach(agent => {
            this.agentRegistry.set(`bmad_${agent.type}`, {
              type: 'bmad',
              agentType: agent.type,
              capabilities: agent.capabilities || [],
              status: 'active',
              endpoint: `lib/agents/${agent.type}`,
              performance: { success_rate: 0.9, avg_response_time: 1500 }
            });
          });
        }

        // Load MCP servers
        if (registryData.mcp) {
          registryData.mcp.forEach(server => {
            this.agentRegistry.set(`mcp_${server.name}`, {
              type: 'mcp',
              serverName: server.name,
              capabilities: server.capabilities || [],
              status: server.status || 'active',
              endpoint: server.endpoint,
              performance: { success_rate: 0.95, avg_response_time: 800 }
            });
          });
        }

        // Load Tmux sessions
        if (registryData.tmux) {
          registryData.tmux.forEach(session => {
            this.agentRegistry.set(`tmux_${session.name}`, {
              type: 'tmux',
              sessionName: session.name,
              capabilities: ['parallel-processing', 'terminal-operations'],
              status: 'active',
              endpoint: `tmux:${session.name}`,
              performance: { success_rate: 0.85, avg_response_time: 2000 }
            });
          });
        }

      } catch (error) {
        console.warn('Failed to load agent registry:', error.message);
      }
    }
  }

  async checkBMADAvailability() {
    const bmadSystemPath = path.join(this.projectRoot, 'lib', 'agents', 'bmad-agent-system.ts');
    const delegationCoordinatorPath = path.join(this.projectRoot, 'lib', 'agents', 'delegation-coordinator.ts');
    
    if (fs.existsSync(bmadSystemPath) && fs.existsSync(delegationCoordinatorPath)) {
      this.bmadSystem = {
        available: true,
        systemPath: bmadSystemPath,
        coordinatorPath: delegationCoordinatorPath,
        capabilities: [
          'content-generation', 'conversation-management', 'analysis', 
          'assessment', 'planning', 'coordination'
        ]
      };
    }
  }

  async detectMCPServers() {
    // Check for active MCP servers
    const mcpServers = [
      { name: 'context7', capabilities: ['documentation', 'patterns', 'library-integration'] },
      { name: 'serena', capabilities: ['code-analysis', 'project-management', 'file-operations'] },  
      { name: 'testsprite', capabilities: ['testing', 'validation', 'quality-assurance'] },
      { name: 'sentry', capabilities: ['error-tracking', 'monitoring', 'performance-analysis'] },
      { name: 'n8n', capabilities: ['workflow-automation', 'integration-pipelines'] },
      { name: 'playwright', capabilities: ['browser-automation', 'e2e-testing', 'visual-validation'] }
    ];

    for (const server of mcpServers) {
      // Assume servers are available if agent registry shows them as active
      const registryEntry = this.agentRegistry.get(`mcp_${server.name}`);
      if (registryEntry && registryEntry.status === 'active') {
        this.mcpServers.set(server.name, {
          available: true,
          capabilities: server.capabilities,
          performance: registryEntry.performance
        });
      }
    }
  }

  async checkArchonAvailability() {
    try {
      // Check if Archon service is running on port 8100
      const { stdout } = await execAsync('lsof -ti:8100');
      if (stdout.trim()) {
        this.archonService = {
          available: true,
          endpoint: 'http://localhost:8100',
          capabilities: ['dynamic-agent-generation', 'workflow-orchestration', 'agent-refinement']
        };
      }
    } catch (error) {
      // Archon service not available
      this.archonService = { available: false };
    }
  }

  /**
   * Main hook function - intercepts Claude Code requests
   * and determines if they should be delegated to agents
   */
  async processRequest(request, context = {}) {
    this.performanceMetrics.totalRequests++;
    const startTime = Date.now();

    try {
      // Analyze request for delegation potential
      const analysis = this.analyzeRequest(request, context);
      
      if (analysis.shouldDelegate) {
        console.log(`🎯 Delegating request to: ${analysis.recommendedAgents.join(', ')}`);
        
        // Route to appropriate agent system
        const result = await this.delegateRequest(request, analysis, context);
        
        this.performanceMetrics.agentDelegations++;
        this.performanceMetrics.avgResponseTime = 
          ((this.performanceMetrics.avgResponseTime * (this.performanceMetrics.totalRequests - 1)) + 
           (Date.now() - startTime)) / this.performanceMetrics.totalRequests;

        return {
          delegated: true,
          agent: analysis.primaryAgent,
          result: result,
          metadata: {
            executionTime: Date.now() - startTime,
            agentsUsed: analysis.recommendedAgents,
            confidence: analysis.confidence
          }
        };
      }

      // Fall back to Claude Code
      this.performanceMetrics.fallbacksToClaudeCode++;
      return {
        delegated: false,
        reason: analysis.reason,
        fallbackToClaudeCode: true
      };

    } catch (error) {
      console.error('🚨 Agent delegation failed:', error.message);
      this.performanceMetrics.fallbacksToClaudeCode++;
      
      return {
        delegated: false,
        error: error.message,
        fallbackToClaudeCode: true
      };
    }
  }

  analyzeRequest(request, context) {
    const analysis = {
      shouldDelegate: false,
      confidence: 0,
      primaryAgent: null,
      recommendedAgents: [],
      reason: '',
      complexity: 0,
      delegationType: 'single-agent' // or 'multi-agent', 'parallel', 'sequential'
    };

    // Extract request characteristics
    const requestText = this.extractRequestText(request);
    const requestType = this.classifyRequest(requestText, context);
    
    // Calculate complexity score
    analysis.complexity = this.calculateComplexity(requestText, context);
    
    // Determine if delegation is beneficial
    if (analysis.complexity > 0.3 || this.hasSpecializedRequirements(requestText)) {
      analysis.shouldDelegate = true;
      analysis.confidence = Math.min(0.9, analysis.complexity + 0.2);
      
      // Select appropriate agents
      const agentSelection = this.selectOptimalAgents(requestType, analysis.complexity, context);
      analysis.primaryAgent = agentSelection.primary;
      analysis.recommendedAgents = agentSelection.agents;
      analysis.delegationType = agentSelection.type;
      
    } else {
      analysis.reason = `Low complexity (${analysis.complexity.toFixed(2)}) - Claude Code sufficient`;
    }

    return analysis;
  }

  extractRequestText(request) {
    if (typeof request === 'string') return request;
    if (request.message) return request.message;
    if (request.content) return request.content;
    if (request.prompt) return request.prompt;
    return JSON.stringify(request);
  }

  classifyRequest(text, context) {
    const lowerText = text.toLowerCase();
    
    // Content creation patterns
    if (lowerText.includes('create') && (lowerText.includes('lesson') || lowerText.includes('content') || lowerText.includes('quiz'))) {
      return 'content-creation';
    }
    
    // Analysis patterns
    if (lowerText.includes('analyze') || lowerText.includes('review') || lowerText.includes('examine')) {
      return 'analysis';
    }
    
    // Code-related patterns
    if (lowerText.includes('implement') || lowerText.includes('build') || lowerText.includes('develop')) {
      return 'implementation';
    }
    
    // Testing patterns
    if (lowerText.includes('test') || lowerText.includes('validation') || lowerText.includes('quality')) {
      return 'testing';
    }
    
    // Documentation patterns
    if (lowerText.includes('document') || lowerText.includes('explain') || lowerText.includes('guide')) {
      return 'documentation';
    }
    
    // Conversation/tutoring patterns
    if (lowerText.includes('help') || lowerText.includes('teach') || lowerText.includes('tutor')) {
      return 'conversation';
    }
    
    // Planning patterns
    if (lowerText.includes('plan') || lowerText.includes('strategy') || lowerText.includes('roadmap')) {
      return 'planning';
    }
    
    // Assessment patterns
    if (lowerText.includes('assess') || lowerText.includes('evaluate') || lowerText.includes('grade')) {
      return 'assessment';
    }
    
    return 'general';
  }

  calculateComplexity(text, context) {
    let complexity = 0.1; // Base complexity
    
    // Text length factor
    if (text.length > 500) complexity += 0.2;
    if (text.length > 1000) complexity += 0.1;
    
    // Multi-step indicators
    if (text.includes('first') || text.includes('then') || text.includes('next') || text.includes('finally')) {
      complexity += 0.3;
    }
    
    // Multiple requirements
    const requirementWords = ['create', 'analyze', 'implement', 'test', 'document', 'plan'];
    const requirementCount = requirementWords.filter(word => text.toLowerCase().includes(word)).length;
    complexity += Math.min(requirementCount * 0.15, 0.4);
    
    // Technical complexity indicators
    if (text.includes('integrate') || text.includes('architecture') || text.includes('system')) {
      complexity += 0.2;
    }
    
    // Context complexity
    if (context.sessionHistory && context.sessionHistory.length > 5) {
      complexity += 0.1;
    }
    
    return Math.min(complexity, 1.0);
  }

  hasSpecializedRequirements(text) {
    const specializedPatterns = [
      'generate content', 'create lesson', 'create quiz', 'tutoring session',
      'analyze progress', 'assess performance', 'create study plan',
      'browser automation', 'e2e test', 'visual validation',
      'error tracking', 'monitor performance', 'workflow automation'
    ];
    
    return specializedPatterns.some(pattern => 
      text.toLowerCase().includes(pattern)
    );
  }

  selectOptimalAgents(requestType, complexity, context) {
    const selection = {
      primary: null,
      agents: [],
      type: 'single-agent'
    };

    // Map request types to optimal agents
    const agentMapping = {
      'content-creation': ['bmad_content', 'mcp_context7'],
      'analysis': ['bmad_analysis', 'mcp_serena'],
      'implementation': ['bmad_content', 'mcp_serena', 'mcp_context7'],
      'testing': ['mcp_testsprite', 'mcp_playwright'],
      'documentation': ['mcp_context7', 'bmad_content'],
      'conversation': ['bmad_conversation'],
      'planning': ['bmad_planning'],
      'assessment': ['bmad_assessment'],
      'general': ['bmad_coordination']
    };

    const candidateAgents = agentMapping[requestType] || ['bmad_coordination'];
    
    // Filter by availability
    const availableAgents = candidateAgents.filter(agentId => {
      const agent = this.agentRegistry.get(agentId);
      return agent && agent.status === 'active';
    });

    if (availableAgents.length === 0) {
      return selection; // No suitable agents available
    }

    selection.primary = availableAgents[0];
    selection.agents = availableAgents;

    // Determine delegation type based on complexity and agent count
    if (complexity > 0.7 && availableAgents.length > 2) {
      selection.type = 'parallel';
    } else if (complexity > 0.5 && availableAgents.length > 1) {
      selection.type = 'sequential';
    } else {
      selection.type = 'single-agent';
    }

    return selection;
  }

  async delegateRequest(request, analysis, context) {
    const { primaryAgent, recommendedAgents, delegationType } = analysis;
    
    try {
      switch (delegationType) {
        case 'single-agent':
          return await this.delegateToSingleAgent(request, primaryAgent, context);
        
        case 'parallel':
          return await this.delegateToMultipleAgents(request, recommendedAgents, 'parallel', context);
        
        case 'sequential':
          return await this.delegateToMultipleAgents(request, recommendedAgents, 'sequential', context);
        
        default:
          throw new Error(`Unsupported delegation type: ${delegationType}`);
      }
    } catch (error) {
      console.error(`Delegation failed for ${delegationType}:`, error.message);
      throw error;
    }
  }

  async delegateToSingleAgent(request, agentId, context) {
    const agent = this.agentRegistry.get(agentId);
    if (!agent) {
      throw new Error(`Agent ${agentId} not found in registry`);
    }

    switch (agent.type) {
      case 'bmad':
        return await this.callBMADAgent(agent, request, context);
      
      case 'mcp':
        return await this.callMCPServer(agent, request, context);
      
      case 'tmux':
        return await this.callTmuxSession(agent, request, context);
      
      default:
        throw new Error(`Unsupported agent type: ${agent.type}`);
    }
  }

  async delegateToMultipleAgents(request, agentIds, executionType, context) {
    const results = new Map();
    const errors = [];

    if (executionType === 'parallel') {
      // Execute all agents in parallel
      const promises = agentIds.map(async (agentId) => {
        try {
          const result = await this.delegateToSingleAgent(request, agentId, context);
          results.set(agentId, result);
          return result;
        } catch (error) {
          errors.push({ agentId, error: error.message });
          return null;
        }
      });

      await Promise.allSettled(promises);
    } else {
      // Execute agents sequentially
      for (const agentId of agentIds) {
        try {
          const result = await this.delegateToSingleAgent(request, agentId, context);
          results.set(agentId, result);
          
          // Enrich context with previous results for next agent
          context.previousResults = context.previousResults || {};
          context.previousResults[agentId] = result;
        } catch (error) {
          errors.push({ agentId, error: error.message });
          break; // Stop on first error in sequential execution
        }
      }
    }

    return {
      success: results.size > 0,
      results: Object.fromEntries(results),
      errors,
      executionType,
      agentCount: agentIds.length
    };
  }

  async callBMADAgent(agent, request, context) {
    try {
      // For now, we'll use a placeholder implementation
      // In a full implementation, this would call the actual BMAD system
      
      console.log(`📡 Calling BMAD agent: ${agent.agentType}`);
      
      // Simulate BMAD agent call
      return {
        success: true,
        agentType: agent.agentType,
        data: {
          message: `BMAD ${agent.agentType} agent processed request`,
          capabilities: agent.capabilities,
          processingTime: Math.random() * 2000 + 500
        },
        metadata: {
          confidence: 0.85,
          agent: agent.agentType
        }
      };
    } catch (error) {
      throw new Error(`BMAD agent ${agent.agentType} failed: ${error.message}`);
    }
  }

  async callMCPServer(agent, request, context) {
    try {
      console.log(`🔗 Calling MCP server: ${agent.serverName}`);
      
      // Simulate MCP server call
      return {
        success: true,
        serverName: agent.serverName,
        data: {
          message: `MCP ${agent.serverName} server processed request`,
          capabilities: agent.capabilities,
          processingTime: Math.random() * 1000 + 300
        },
        metadata: {
          confidence: 0.9,
          server: agent.serverName
        }
      };
    } catch (error) {
      throw new Error(`MCP server ${agent.serverName} failed: ${error.message}`);
    }
  }

  async callTmuxSession(agent, request, context) {
    try {
      console.log(`⚡ Calling Tmux session: ${agent.sessionName}`);
      
      // Simulate Tmux session call
      return {
        success: true,
        sessionName: agent.sessionName,
        data: {
          message: `Tmux ${agent.sessionName} session processed request`,
          capabilities: agent.capabilities,
          processingTime: Math.random() * 3000 + 1000
        },
        metadata: {
          confidence: 0.8,
          session: agent.sessionName
        }
      };
    } catch (error) {
      throw new Error(`Tmux session ${agent.sessionName} failed: ${error.message}`);
    }
  }

  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      delegationRate: this.performanceMetrics.totalRequests > 0 
        ? (this.performanceMetrics.agentDelegations / this.performanceMetrics.totalRequests * 100).toFixed(1) + '%'
        : '0%',
      availableAgents: this.agentRegistry.size,
      systemStatus: {
        bmad: this.bmadSystem?.available || false,
        mcp: this.mcpServers.size,
        archon: this.archonService?.available || false
      }
    };
  }

  async refreshAgentRegistry() {
    await this.initialize();
  }
}

// Global instance
let agentHook = null;

// Hook functions for Claude Code integration
async function preRequestHook(request, context) {
  if (!agentHook) {
    agentHook = new AgentIntegrationHook();
  }
  
  // Process request through agent integration system
  const result = await agentHook.processRequest(request, context);
  
  if (result.delegated) {
    console.log(`✅ Request delegated to ${result.agent} (${result.metadata.executionTime}ms)`);
    return {
      skipClaudeCode: true,
      response: result.result,
      metadata: result.metadata
    };
  }
  
  // Continue with Claude Code
  return {
    skipClaudeCode: false,
    reason: result.reason
  };
}

async function postRequestHook(request, response, context) {
  if (agentHook) {
    // Log performance metrics periodically
    if (agentHook.performanceMetrics.totalRequests % 10 === 0) {
      console.log('📊 Agent Integration Metrics:', agentHook.getPerformanceMetrics());
    }
  }
  
  return response;
}

// Export for use
module.exports = {
  AgentIntegrationHook,
  preRequestHook,
  postRequestHook
};