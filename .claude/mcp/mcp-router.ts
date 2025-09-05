/**
 * MCP Server Router
 * Intelligent routing to MCP servers based on request context
 * 
 * This module handles automatic routing to the appropriate MCP servers
 * (Context7, Serena, TestSprite, Sentry, N8n, Playwright) based on request analysis
 */

export interface MCPServerConfig {
  name: string;
  capabilities: string[];
  endpoint: string;
  priority: number;
  healthEndpoint?: string;
  timeout: number;
  retries: number;
  circuitBreaker: {
    threshold: number;
    timeout: number;
    halfOpenRetries: number;
  };
}

export interface MCPRequest {
  id: string;
  method: string;
  params: any;
  context: {
    requestType: string;
    complexity: number;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    sessionId?: string;
  };
}

export interface MCPResponse {
  id: string;
  success: boolean;
  result?: any;
  error?: string;
  serverName: string;
  processingTime: number;
  fromCache?: boolean;
}

export interface RoutingDecision {
  serverId: string;
  confidence: number;
  reasoning: string;
  fallbackServers: string[];
  estimatedResponseTime: number;
}

export class MCPRouter {
  private servers: Map<string, MCPServerConfig>;
  private healthStatus: Map<string, boolean>;
  private circuitBreakers: Map<string, MCPCircuitBreaker>;
  private requestCache: Map<string, MCPResponse>;
  private performanceMetrics: Map<string, ServerMetrics>;

  constructor() {
    this.servers = new Map();
    this.healthStatus = new Map();
    this.circuitBreakers = new Map();
    this.requestCache = new Map();
    this.performanceMetrics = new Map();

    this.initializeServers();
    this.startHealthMonitoring();
  }

  private initializeServers() {
    const serverConfigs: MCPServerConfig[] = [
      {
        name: 'context7',
        capabilities: [
          'documentation-lookup', 'library-patterns', 'code-examples',
          'api-reference', 'best-practices', 'framework-guides'
        ],
        endpoint: 'mcp://context7',
        priority: 95,
        timeout: 10000,
        retries: 2,
        circuitBreaker: { threshold: 5, timeout: 30000, halfOpenRetries: 3 }
      },
      {
        name: 'serena',
        capabilities: [
          'code-analysis', 'file-operations', 'project-management',
          'symbol-search', 'refactoring', 'code-navigation'
        ],
        endpoint: 'mcp://serena',
        priority: 90,
        timeout: 15000,
        retries: 2,
        circuitBreaker: { threshold: 5, timeout: 30000, halfOpenRetries: 3 }
      },
      {
        name: 'testsprite',
        capabilities: [
          'test-generation', 'test-execution', 'quality-assurance',
          'validation', 'coverage-analysis', 'test-reporting'
        ],
        endpoint: 'mcp://testsprite',
        priority: 85,
        timeout: 20000,
        retries: 2,
        circuitBreaker: { threshold: 5, timeout: 30000, halfOpenRetries: 3 }
      },
      {
        name: 'sentry',
        capabilities: [
          'error-tracking', 'performance-monitoring', 'issue-analysis',
          'release-tracking', 'alerting', 'performance-insights'
        ],
        endpoint: 'mcp://sentry',
        priority: 88,
        timeout: 8000,
        retries: 3,
        circuitBreaker: { threshold: 3, timeout: 20000, halfOpenRetries: 2 }
      },
      {
        name: 'n8n',
        capabilities: [
          'workflow-automation', 'integration-pipelines', 'data-transformation',
          'api-orchestration', 'scheduled-tasks', 'webhook-handling'
        ],
        endpoint: 'mcp://n8n',
        priority: 80,
        timeout: 12000,
        retries: 2,
        circuitBreaker: { threshold: 5, timeout: 45000, halfOpenRetries: 3 }
      },
      {
        name: 'playwright',
        capabilities: [
          'browser-automation', 'e2e-testing', 'visual-testing',
          'performance-testing', 'accessibility-testing', 'screenshot-capture'
        ],
        endpoint: 'mcp://playwright',
        priority: 82,
        timeout: 25000,
        retries: 2,
        circuitBreaker: { threshold: 4, timeout: 60000, halfOpenRetries: 2 }
      }
    ];

    for (const config of serverConfigs) {
      this.servers.set(config.name, config);
      this.healthStatus.set(config.name, true);
      this.circuitBreakers.set(config.name, new MCPCircuitBreaker(config.circuitBreaker));
      this.performanceMetrics.set(config.name, {
        totalRequests: 0,
        successfulRequests: 0,
        avgResponseTime: 0,
        lastUsed: new Date(),
        errorRate: 0
      });
    }

    console.log(`🔗 MCP Router initialized with ${this.servers.size} servers`);
  }

  /**
   * Route request to optimal MCP server
   */
  async route(request: MCPRequest): Promise<RoutingDecision> {
    try {
      // Analyze request to determine best server
      const serverScores = this.analyzeRequestForServers(request);
      
      // Filter by health and circuit breaker status
      const viableServers = this.filterViableServers(serverScores);
      
      if (viableServers.length === 0) {
        throw new Error('No viable MCP servers available');
      }

      // Select best server
      const bestServer = viableServers[0];
      const fallbackServers = viableServers.slice(1, 3).map(s => s.serverId);

      return {
        serverId: bestServer.serverId,
        confidence: bestServer.score,
        reasoning: bestServer.reasoning,
        fallbackServers,
        estimatedResponseTime: this.estimateResponseTime(bestServer.serverId, request)
      };

    } catch (error) {
      throw new Error(`MCP routing failed: ${error.message}`);
    }
  }

  /**
   * Execute request on selected MCP server with fallback handling
   */
  async execute(decision: RoutingDecision, request: MCPRequest): Promise<MCPResponse> {
    const attempts = [decision.serverId, ...decision.fallbackServers];
    let lastError: Error | null = null;

    // Check cache first
    const cacheKey = this.generateCacheKey(request);
    const cachedResponse = this.requestCache.get(cacheKey);
    if (cachedResponse && this.isCacheValid(cachedResponse)) {
      console.log(`💾 Returning cached MCP response for ${decision.serverId}`);
      return { ...cachedResponse, fromCache: true };
    }

    for (const serverId of attempts) {
      try {
        console.log(`🔗 Executing MCP request on ${serverId}`);
        
        const response = await this.executeOnServer(serverId, request);
        
        // Update metrics
        this.updateServerMetrics(serverId, true, response.processingTime);
        
        // Cache successful responses
        if (response.success && this.shouldCache(request)) {
          this.requestCache.set(cacheKey, response);
        }

        return response;

      } catch (error) {
        console.warn(`⚠️ MCP server ${serverId} failed: ${error.message}`);
        lastError = error;
        this.updateServerMetrics(serverId, false, 0);
      }
    }

    throw new Error(`All MCP servers failed. Last error: ${lastError?.message}`);
  }

  private analyzeRequestForServers(request: MCPRequest): ServerScore[] {
    const scores: ServerScore[] = [];

    for (const [serverId, config] of this.servers.entries()) {
      const score = this.calculateServerScore(serverId, config, request);
      
      if (score > 0.1) { // Minimum viability threshold
        scores.push({
          serverId,
          score,
          reasoning: this.explainServerScore(serverId, config, request, score)
        });
      }
    }

    return scores.sort((a, b) => b.score - a.score);
  }

  private calculateServerScore(serverId: string, config: MCPServerConfig, request: MCPRequest): number {
    let score = 0;

    // Base priority score
    score += (config.priority / 100) * 0.3;

    // Capability matching
    const capabilityMatch = this.calculateCapabilityMatch(request, config.capabilities);
    score += capabilityMatch * 0.4;

    // Health and performance factors
    const health = this.healthStatus.get(serverId) ? 1 : 0.1;
    score += health * 0.15;

    const metrics = this.performanceMetrics.get(serverId)!;
    const performanceScore = 1 - (metrics.errorRate * 0.5) - (Math.min(metrics.avgResponseTime / 10000, 0.5));
    score += Math.max(performanceScore, 0.1) * 0.15;

    // Request type specific scoring
    score += this.getRequestTypeScore(request, config) * 0.2;

    // Circuit breaker penalty
    const circuitBreaker = this.circuitBreakers.get(serverId)!;
    if (circuitBreaker.isOpen()) {
      score *= 0.1;
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateCapabilityMatch(request: MCPRequest, capabilities: string[]): number {
    const requestType = request.context.requestType.toLowerCase();
    const method = request.method.toLowerCase();
    
    let matches = 0;
    let totalRelevant = 0;

    for (const capability of capabilities) {
      const capabilityWords = capability.toLowerCase().split('-');
      totalRelevant++;

      // Check for direct matches
      if (requestType.includes(capability.toLowerCase()) || 
          method.includes(capability.toLowerCase())) {
        matches += 2; // High weight for direct matches
        continue;
      }

      // Check for partial word matches
      for (const word of capabilityWords) {
        if (requestType.includes(word) || method.includes(word)) {
          matches += 1;
          break;
        }
      }
    }

    return totalRelevant > 0 ? Math.min(matches / (totalRelevant * 2), 1) : 0;
  }

  private getRequestTypeScore(request: MCPRequest, config: MCPServerConfig): number {
    const requestType = request.context.requestType.toLowerCase();
    const method = request.method.toLowerCase();

    // Server-specific scoring based on request patterns
    switch (config.name) {
      case 'context7':
        if (requestType.includes('documentation') || 
            requestType.includes('library') || 
            method.includes('resolve-library-id') ||
            method.includes('get-library-docs')) {
          return 1.0;
        }
        break;

      case 'serena':
        if (requestType.includes('code') || 
            requestType.includes('file') || 
            method.includes('read_file') ||
            method.includes('find_symbol')) {
          return 1.0;
        }
        break;

      case 'testsprite':
        if (requestType.includes('test') || 
            requestType.includes('validation') || 
            method.includes('testsprite_')) {
          return 1.0;
        }
        break;

      case 'sentry':
        if (requestType.includes('error') || 
            requestType.includes('monitoring') || 
            method.includes('get_issue_details') ||
            method.includes('search_issues')) {
          return 1.0;
        }
        break;

      case 'n8n':
        if (requestType.includes('workflow') || 
            requestType.includes('automation') || 
            method.includes('create_workflow')) {
          return 1.0;
        }
        break;

      case 'playwright':
        if (requestType.includes('browser') || 
            requestType.includes('e2e') || 
            method.includes('puppeteer_')) {
          return 1.0;
        }
        break;
    }

    return 0.5; // Default score for non-specific matches
  }

  private explainServerScore(serverId: string, config: MCPServerConfig, request: MCPRequest, score: number): string {
    const reasons = [];
    
    if (score > 0.8) {
      reasons.push('high capability match');
    }
    if (config.priority > 85) {
      reasons.push('high priority server');
    }
    if (this.healthStatus.get(serverId)) {
      reasons.push('healthy status');
    }
    
    const metrics = this.performanceMetrics.get(serverId)!;
    if (metrics.errorRate < 0.1) {
      reasons.push('low error rate');
    }

    return reasons.length > 0 ? reasons.join(', ') : 'basic compatibility';
  }

  private filterViableServers(scores: ServerScore[]): ServerScore[] {
    return scores.filter(serverScore => {
      const serverId = serverScore.serverId;
      const isHealthy = this.healthStatus.get(serverId);
      const circuitBreaker = this.circuitBreakers.get(serverId)!;
      
      return isHealthy && !circuitBreaker.isOpen() && serverScore.score > 0.2;
    });
  }

  private estimateResponseTime(serverId: string, request: MCPRequest): number {
    const config = this.servers.get(serverId)!;
    const metrics = this.performanceMetrics.get(serverId)!;
    
    // Base estimate from historical data
    let estimate = metrics.avgResponseTime || config.timeout * 0.3;
    
    // Adjust based on request complexity
    if (request.context.complexity > 0.7) {
      estimate *= 1.5;
    } else if (request.context.complexity < 0.3) {
      estimate *= 0.8;
    }
    
    // Adjust based on priority
    if (request.context.priority === 'urgent') {
      estimate *= 0.9; // Assume faster processing for urgent requests
    }

    return Math.min(estimate, config.timeout);
  }

  private async executeOnServer(serverId: string, request: MCPRequest): Promise<MCPResponse> {
    const startTime = Date.now();
    const config = this.servers.get(serverId)!;
    const circuitBreaker = this.circuitBreakers.get(serverId)!;

    // Check circuit breaker
    if (circuitBreaker.isOpen()) {
      throw new Error(`Circuit breaker open for ${serverId}`);
    }

    try {
      // Execute request on MCP server
      const result = await this.callMCPServer(config, request);
      
      circuitBreaker.recordSuccess();
      
      return {
        id: request.id,
        success: true,
        result,
        serverName: serverId,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      circuitBreaker.recordFailure();
      throw error;
    }
  }

  private async callMCPServer(config: MCPServerConfig, request: MCPRequest): Promise<any> {
    // Placeholder for actual MCP server call
    // In full implementation, this would use the actual MCP protocol
    
    console.log(`📡 Calling MCP server ${config.name} with method ${request.method}`);
    
    // Simulate server processing based on server type
    const processingTime = this.simulateProcessingTime(config.name, request);
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Simulate server response
    return this.simulateServerResponse(config.name, request);
  }

  private simulateProcessingTime(serverName: string, request: MCPRequest): number {
    const baseTime = {
      'context7': 800,
      'serena': 1200,
      'testsprite': 2000,
      'sentry': 600,
      'n8n': 1000,
      'playwright': 3000
    };

    let time = baseTime[serverName] || 1000;
    
    // Adjust for complexity
    time *= (1 + request.context.complexity * 0.5);
    
    // Add some randomness
    time += Math.random() * 500;
    
    return Math.floor(time);
  }

  private simulateServerResponse(serverName: string, request: MCPRequest): any {
    // Simulate appropriate responses based on server capabilities
    switch (serverName) {
      case 'context7':
        return {
          documentation: `Documentation for ${request.params?.library || 'requested library'}`,
          examples: ['example1', 'example2'],
          patterns: ['pattern1', 'pattern2']
        };
      
      case 'serena':
        return {
          analysis: 'Code analysis completed',
          symbols: ['symbol1', 'symbol2'],
          suggestions: ['suggestion1', 'suggestion2']
        };
      
      case 'testsprite':
        return {
          testsPassed: Math.floor(Math.random() * 50) + 10,
          testsFailed: Math.floor(Math.random() * 5),
          coverage: `${Math.floor(Math.random() * 30) + 70}%`
        };
      
      case 'sentry':
        return {
          issues: Math.floor(Math.random() * 10),
          errors: Math.floor(Math.random() * 20),
          performance: 'Good'
        };
      
      case 'n8n':
        return {
          workflowId: `workflow_${Date.now()}`,
          status: 'created',
          nodes: Math.floor(Math.random() * 10) + 3
        };
      
      case 'playwright':
        return {
          testResults: 'Tests completed',
          screenshots: ['screenshot1.png', 'screenshot2.png'],
          performance: { loadTime: Math.random() * 3000 + 1000 }
        };
      
      default:
        return { message: `Response from ${serverName}` };
    }
  }

  private generateCacheKey(request: MCPRequest): string {
    const key = `${request.method}_${JSON.stringify(request.params)}_${request.context.requestType}`;
    return Buffer.from(key).toString('base64').substring(0, 32);
  }

  private shouldCache(request: MCPRequest): boolean {
    // Cache documentation lookups and static analysis results
    const cacheableMethods = [
      'resolve-library-id', 'get-library-docs', 'find_symbol', 
      'get_symbols_overview', 'read_file'
    ];
    
    return cacheableMethods.includes(request.method) || 
           request.context.requestType.includes('documentation');
  }

  private isCacheValid(response: MCPResponse): boolean {
    const maxAge = 10 * 60 * 1000; // 10 minutes
    return (Date.now() - new Date(response.id).getTime()) < maxAge;
  }

  private updateServerMetrics(serverId: string, success: boolean, responseTime: number) {
    const metrics = this.performanceMetrics.get(serverId)!;
    
    metrics.totalRequests++;
    metrics.lastUsed = new Date();
    
    if (success) {
      metrics.successfulRequests++;
      metrics.avgResponseTime = 
        ((metrics.avgResponseTime * (metrics.totalRequests - 1)) + responseTime) / 
        metrics.totalRequests;
    }
    
    metrics.errorRate = 1 - (metrics.successfulRequests / metrics.totalRequests);
  }

  private startHealthMonitoring() {
    // Simulate health monitoring
    setInterval(() => {
      for (const serverId of this.servers.keys()) {
        // Simulate health checks - in real implementation would ping actual servers
        const isHealthy = Math.random() > 0.05; // 95% uptime simulation
        this.healthStatus.set(serverId, isHealthy);
        
        if (!isHealthy) {
          console.warn(`⚠️ MCP server ${serverId} health check failed`);
        }
      }
    }, 30000); // Every 30 seconds
  }

  // Public API methods
  getServerStatus() {
    const status = {};
    
    for (const [serverId, config] of this.servers.entries()) {
      const metrics = this.performanceMetrics.get(serverId)!;
      const circuitBreaker = this.circuitBreakers.get(serverId)!;
      
      status[serverId] = {
        healthy: this.healthStatus.get(serverId),
        circuitBreakerOpen: circuitBreaker.isOpen(),
        totalRequests: metrics.totalRequests,
        successRate: `${((metrics.successfulRequests / Math.max(metrics.totalRequests, 1)) * 100).toFixed(1)}%`,
        avgResponseTime: `${metrics.avgResponseTime.toFixed(0)}ms`,
        capabilities: config.capabilities.length
      };
    }
    
    return status;
  }

  getPerformanceMetrics() {
    return Object.fromEntries(this.performanceMetrics);
  }

  clearCache() {
    this.requestCache.clear();
    console.log('🗑️ MCP request cache cleared');
  }
}

// Supporting classes and interfaces
class MCPCircuitBreaker {
  private failures = 0;
  private lastFailure: Date | null = null;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private halfOpenRetries = 0;

  constructor(private config: MCPServerConfig['circuitBreaker']) {}

  recordSuccess() {
    this.failures = 0;
    this.state = 'closed';
    this.halfOpenRetries = 0;
  }

  recordFailure() {
    this.failures++;
    this.lastFailure = new Date();
    
    if (this.failures >= this.config.threshold) {
      this.state = 'open';
    }
  }

  isOpen(): boolean {
    if (this.state === 'closed') return false;
    
    if (this.state === 'open' && this.lastFailure) {
      const elapsed = Date.now() - this.lastFailure.getTime();
      if (elapsed > this.config.timeout) {
        this.state = 'half-open';
        this.halfOpenRetries = 0;
        return false;
      }
    }
    
    if (this.state === 'half-open') {
      if (this.halfOpenRetries >= this.config.halfOpenRetries) {
        this.state = 'open';
        return true;
      }
      this.halfOpenRetries++;
      return false;
    }
    
    return this.state === 'open';
  }
}

interface ServerScore {
  serverId: string;
  score: number;
  reasoning: string;
}

interface ServerMetrics {
  totalRequests: number;
  successfulRequests: number;
  avgResponseTime: number;
  lastUsed: Date;
  errorRate: number;
}

// Singleton instance
let mcpRouterInstance: MCPRouter | null = null;

export function getMCPRouter(): MCPRouter {
  if (!mcpRouterInstance) {
    mcpRouterInstance = new MCPRouter();
  }
  return mcpRouterInstance;
}

export function resetMCPRouter() {
  mcpRouterInstance = null;
}