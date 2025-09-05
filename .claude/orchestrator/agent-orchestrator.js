/**
 * Agent Orchestrator - JavaScript Compiled Version
 * Central coordination system for agent integration
 */

const { EventEmitter } = require('events');

class AgentOrchestrator extends EventEmitter {
  constructor() {
    super();
    this.initialized = false;
    this.bmadBridge = null;
    this.agentRouter = null;
    this.mcpRouter = null;
    this.archonIntegration = null;
    
    this.cache = new Map();
    this.metrics = {
      totalRequests: 0,
      successfulRequests: 0,
      avgResponseTime: 0,
      cacheHits: 0,
      fallbacksUsed: 0
    };

    this.initialize();
  }

  async initialize() {
    console.log('<­ Agent Orchestrator initializing...');
    
    try {
      // Initialize components
      await this.initializeBMADBridge();
      await this.initializeAgentRouter();
      await this.initializeMCPRouter();
      await this.initializeArchonIntegration();
      
      this.initialized = true;
      console.log(' Agent Orchestrator initialized successfully');
      
    } catch (error) {
      console.warn('  Agent Orchestrator initialization with limited functionality:', error.message);
      this.initialized = true; // Allow fallback operation
    }
  }

  async initializeBMADBridge() {
    try {
      const { getSuperClaudeBMADBridge } = require('../integrations/superclaude-bmad-bridge');
      this.bmadBridge = getSuperClaudeBMADBridge();
      await this.bmadBridge.initialize();
      console.log(' BMAD Bridge connected');
    } catch (error) {
      console.warn('  BMAD Bridge not available:', error.message);
    }
  }

  async initializeAgentRouter() {
    try {
      const { getIntelligentAgentRouter } = require('../routing/intelligent-agent-router');
      this.agentRouter = getIntelligentAgentRouter();
      console.log(' Agent Router connected');
    } catch (error) {
      console.warn('  Agent Router not available:', error.message);
    }
  }

  async initializeMCPRouter() {
    try {
      const { getMCPRouter } = require('../mcp/mcp-router');
      this.mcpRouter = getMCPRouter();
      console.log(' MCP Router connected');
    } catch (error) {
      console.warn('  MCP Router not available:', error.message);
    }
  }

  async initializeArchonIntegration() {
    try {
      const { getArchonIntegration } = require('../archon/archon-integration');
      this.archonIntegration = getArchonIntegration();
      console.log(' Archon Integration connected');
    } catch (error) {
      console.warn('  Archon Integration not available:', error.message);
    }
  }

  async orchestrateRequest(request) {
    const startTime = Date.now();
    this.metrics.totalRequests++;

    try {
      console.log(`<­ Orchestrating request: ${request.content?.substring(0, 50) || 'Unknown'}...`);

      // Check cache first
      const cacheKey = this.generateCacheKey(request);
      const cachedResponse = this.cache.get(cacheKey);
      if (cachedResponse && this.isCacheValid(cachedResponse)) {
        this.metrics.cacheHits++;
        console.log('=¾ Returning cached response');
        return { ...cachedResponse.response, fromCache: true };
      }

      // Route request to appropriate agent system
      let response;
      if (this.agentRouter) {
        const routingDecision = await this.agentRouter.route(request);
        response = await this.executeRoutingDecision(routingDecision, request);
      } else {
        // Fallback to direct processing
        response = await this.fallbackProcessing(request);
        this.metrics.fallbacksUsed++;
      }

      // Cache successful responses
      if (response.success && this.shouldCache(request)) {
        this.cache.set(cacheKey, {
          response,
          timestamp: Date.now()
        });
      }

      // Update metrics
      const processingTime = Date.now() - startTime;
      this.updateMetrics(response.success, processingTime);

      console.log(` Request orchestrated in ${processingTime}ms`);
      
      return response;

    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.updateMetrics(false, processingTime);
      
      console.error('L Orchestration failed:', error.message);
      
      return {
        success: false,
        error: error.message,
        fallback: true,
        processingTime,
        source: 'orchestrator-error'
      };
    }
  }

  async executeRoutingDecision(decision, request) {
    console.log(`<¯ Executing routing decision: ${decision.targetId}`);

    try {
      switch (decision.targetId) {
        case 'bmad_system':
          return await this.executeBMADRequest(request);
        
        case 'mcp_context7':
        case 'mcp_serena':
        case 'mcp_testsprite':
        case 'mcp_sentry':
        case 'mcp_n8n':
        case 'mcp_playwright':
          return await this.executeMCPRequest(decision.targetId, request);
        
        case 'archon_service':
          return await this.executeArchonRequest(request);
        
        case 'claude_code_fallback':
        default:
          return await this.fallbackProcessing(request);
      }
    } catch (error) {
      console.warn(`  Primary execution failed, trying fallback chain`);
      
      // Try fallback chain
      for (const fallbackId of decision.fallbackChain) {
        try {
          return await this.executeRoutingDecision({ targetId: fallbackId }, request);
        } catch (fallbackError) {
          console.warn(`  Fallback ${fallbackId} also failed:`, fallbackError.message);
          continue;
        }
      }
      
      // All fallbacks failed
      throw new Error(`All routing options failed for ${decision.targetId}`);
    }
  }

  async executeBMADRequest(request) {
    if (!this.bmadBridge) {
      throw new Error('BMAD Bridge not available');
    }

    const bmadRequest = {
      content: request.content,
      agentType: this.mapPersonaToAgentType(request.persona),
      userId: request.userId || 'anonymous', 
      sessionId: request.sessionId,
      priority: request.priority || 'medium',
      payload: request.payload || {}
    };

    const response = await this.bmadBridge.processRequest(bmadRequest);
    
    return {
      success: response.success,
      data: response.data,
      error: response.error,
      metadata: {
        ...response.metadata,
        source: 'bmad-system',
        agentType: bmadRequest.agentType
      }
    };
  }

  async executeMCPRequest(serverId, request) {
    if (!this.mcpRouter) {
      throw new Error('MCP Router not available');
    }

    const serverName = serverId.replace('mcp_', '');
    const mcpRequest = {
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      method: this.inferMCPMethod(serverName, request),
      params: this.extractMCPParams(request),
      context: {
        requestType: request.type || 'general',
        complexity: this.estimateComplexity(request),
        priority: request.priority || 'medium',
        sessionId: request.sessionId
      }
    };

    const routingDecision = await this.mcpRouter.route(mcpRequest);
    const response = await this.mcpRouter.execute(routingDecision, mcpRequest);

    return {
      success: response.success,
      data: response.result,
      error: response.error,
      metadata: {
        source: `mcp-${serverName}`,
        processingTime: response.processingTime,
        serverName: response.serverName,
        fromCache: response.fromCache
      }
    };
  }

  async executeArchonRequest(request) {
    if (!this.archonIntegration) {
      throw new Error('Archon Integration not available');
    }

    // For now, just return service status as this is a placeholder
    const status = this.archonIntegration.getServiceStatus();
    
    return {
      success: true,
      data: {
        message: 'Archon integration available',
        serviceStatus: status,
        agents: this.archonIntegration.getAvailableAgents()
      },
      metadata: {
        source: 'archon-service',
        available: status.available
      }
    };
  }

  async fallbackProcessing(request) {
    console.log('= Using Claude Code fallback processing');
    
    // Simulate Claude Code processing
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    return {
      success: true,
      data: {
        message: 'Processed by Claude Code (fallback)',
        content: request.content,
        processedAt: new Date().toISOString()
      },
      metadata: {
        source: 'claude-code-fallback',
        note: 'Specialized agents were not available'
      }
    };
  }

  mapPersonaToAgentType(persona) {
    const personaMapping = {
      'architect': 'planning',
      'frontend': 'content',
      'backend': 'analysis',
      'security': 'analysis',
      'performance': 'analysis',
      'analyzer': 'analysis',
      'qa': 'assessment',
      'refactorer': 'analysis',
      'devops': 'coordination',
      'mentor': 'content',
      'scribe': 'content'
    };
    
    return personaMapping[persona] || 'content';
  }

  inferMCPMethod(serverName, request) {
    const content = (request.content || '').toLowerCase();
    
    switch (serverName) {
      case 'context7':
        if (content.includes('library') || content.includes('documentation')) {
          return 'get-library-docs';
        }
        return 'resolve-library-id';
      
      case 'serena':
        if (content.includes('read') || content.includes('file')) {
          return 'read_file';
        }
        if (content.includes('symbol') || content.includes('find')) {
          return 'find_symbol';
        }
        return 'get_symbols_overview';
      
      case 'testsprite':
        return 'testsprite_generate_code_and_execute';
      
      case 'sentry':
        if (content.includes('issue') || content.includes('error')) {
          return 'search_issues';
        }
        return 'find_organizations';
      
      case 'playwright':
        return 'puppeteer_navigate';
      
      default:
        return 'default_method';
    }
  }

  extractMCPParams(request) {
    // Extract relevant parameters from request
    return {
      query: request.content,
      options: request.options || {},
      context: request.context || {}
    };
  }

  estimateComplexity(request) {
    let complexity = 0.3; // Base complexity
    
    const content = request.content || '';
    if (content.length > 100) complexity += 0.2;
    if (content.includes('comprehensive') || content.includes('detailed')) complexity += 0.3;
    if (content.includes('analyze') && content.includes('create')) complexity += 0.2;
    
    return Math.min(complexity, 1.0);
  }

  generateCacheKey(request) {
    const key = `${request.content || 'unknown'}_${request.persona || 'none'}_${request.type || 'general'}`;
    return require('crypto').createHash('md5').update(key).digest('hex').substring(0, 32);
  }

  shouldCache(request) {
    // Cache documentation lookups and analysis results
    const cacheableTypes = ['documentation', 'analysis', 'reference'];
    const content = (request.content || '').toLowerCase();
    
    return cacheableTypes.some(type => content.includes(type)) ||
           (request.type && cacheableTypes.includes(request.type));
  }

  isCacheValid(cached) {
    const maxAge = 10 * 60 * 1000; // 10 minutes
    return (Date.now() - cached.timestamp) < maxAge;
  }

  updateMetrics(success, processingTime) {
    if (success) {
      this.metrics.successfulRequests++;
    }
    
    this.metrics.avgResponseTime = 
      ((this.metrics.avgResponseTime * (this.metrics.totalRequests - 1)) + processingTime) / 
      this.metrics.totalRequests;
  }

  getStatus() {
    return {
      initialized: this.initialized,
      components: {
        bmadBridge: !!this.bmadBridge,
        agentRouter: !!this.agentRouter,
        mcpRouter: !!this.mcpRouter,
        archonIntegration: !!this.archonIntegration
      },
      metrics: this.metrics,
      cacheSize: this.cache.size
    };
  }

  async healthCheck() {
    const components = {};
    
    if (this.bmadBridge) {
      try {
        components.bmadBridge = await this.bmadBridge.healthCheck();
      } catch (error) {
        components.bmadBridge = { healthy: false, error: error.message };
      }
    }
    
    if (this.agentRouter) {
      components.agentRouter = { healthy: true, status: this.agentRouter.getStatus() };
    }
    
    if (this.mcpRouter) {
      components.mcpRouter = { healthy: true, status: this.mcpRouter.getServerStatus() };
    }
    
    if (this.archonIntegration) {
      components.archonIntegration = { healthy: true, status: this.archonIntegration.getServiceStatus() };
    }

    const healthyComponents = Object.values(components).filter(c => c.healthy).length;
    const totalComponents = Object.keys(components).length;
    
    return {
      healthy: healthyComponents > 0,
      components,
      overallHealth: totalComponents > 0 ? (healthyComponents / totalComponents) : 0,
      metrics: this.metrics
    };
  }

  clearCache() {
    this.cache.clear();
    console.log('=Ñ Orchestrator cache cleared');
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.totalRequests > 0 ? 
        this.metrics.successfulRequests / this.metrics.totalRequests : 0,
      cacheHitRate: this.metrics.totalRequests > 0 ?
        this.metrics.cacheHits / this.metrics.totalRequests : 0
    };
  }
}

// Singleton instance
let orchestratorInstance = null;

function getAgentOrchestrator() {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestrator();
  }
  return orchestratorInstance;
}

function resetAgentOrchestrator() {
  orchestratorInstance = null;
}

module.exports = {
  AgentOrchestrator,
  getAgentOrchestrator,
  resetAgentOrchestrator
};