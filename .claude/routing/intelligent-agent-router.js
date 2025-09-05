/**
 * Intelligent Agent Router - JavaScript Compiled Version
 * Smart routing system with fallback chains for multi-agent ecosystem
 */

const { EventEmitter } = require('events');
const crypto = require('crypto');

class IntelligentAgentRouter extends EventEmitter {
  constructor() {
    super();
    this.targets = new Map();
    this.rules = [];
    this.metrics = {
      totalRoutes: 0,
      successfulRoutes: 0,
      fallbacksUsed: 0,
      avgDecisionTime: 0,
      routesByTarget: new Map(),
      performanceByTarget: new Map()
    };
    
    this.agentHook = null;
    this.circuitBreakers = new Map();
    this.cache = new Map();
    this.healthMonitor = new HealthMonitor();

    this.initialize();
  }

  initialize() {
    console.log('🧭 Intelligent Agent Router initializing...');
    
    // Initialize route targets
    this.initializeTargets();
    
    // Initialize routing rules
    this.initializeRules();
    
    // Start health monitoring
    this.healthMonitor.startMonitoring();
    
    console.log('✅ Intelligent Agent Router initialized');
  }

  initializeTargets() {
    const targets = [
      {
        id: 'bmad_system',
        type: 'bmad',
        endpoint: 'internal://bmad',
        priority: 90,
        capabilities: ['content-creation', 'tutoring', 'analysis', 'assessment'],
        healthEndpoint: 'internal://bmad/health'
      },
      {
        id: 'mcp_context7',
        type: 'mcp',
        endpoint: 'mcp://context7',
        priority: 95,
        capabilities: ['documentation', 'library-patterns', 'code-examples'],
        healthEndpoint: 'mcp://context7/health'
      },
      {
        id: 'mcp_serena',
        type: 'mcp',
        endpoint: 'mcp://serena',
        priority: 90,
        capabilities: ['code-analysis', 'file-operations', 'symbol-search'],
        healthEndpoint: 'mcp://serena/health'
      },
      {
        id: 'mcp_testsprite',
        type: 'mcp',
        endpoint: 'mcp://testsprite',
        priority: 85,
        capabilities: ['test-generation', 'quality-assurance'],
        healthEndpoint: 'mcp://testsprite/health'
      },
      {
        id: 'archon_service',
        type: 'archon',
        endpoint: 'http://localhost:8100',
        priority: 80,
        capabilities: ['dynamic-agents', 'workflow-orchestration'],
        healthEndpoint: 'http://localhost:8100/health'
      },
      {
        id: 'claude_code_fallback',
        type: 'claude-code',
        endpoint: 'internal://claude-code',
        priority: 50,
        capabilities: ['general-assistance', 'fallback'],
        healthEndpoint: 'internal://claude-code/health'
      }
    ];

    targets.forEach(target => {
      this.targets.set(target.id, target);
      this.circuitBreakers.set(target.id, new CircuitBreaker(target.id));
      this.metrics.routesByTarget.set(target.id, 0);
      this.metrics.performanceByTarget.set(target.id, { avgTime: 0, successRate: 1.0 });
    });

    console.log(`🎯 Initialized ${targets.length} route targets`);
  }

  initializeRules() {
    const rules = [
      {
        id: 'content_creation',
        name: 'Content Creation Routing',
        pattern: /create.*lesson|generate.*content|build.*course/i,
        targetTypes: ['bmad'],
        priority: 100,
        conditions: [
          { type: 'content', operator: 'contains', value: 'lesson|course|quiz', weight: 0.8 }
        ],
        fallbackChain: ['bmad_system', 'claude_code_fallback'],
        enabled: true
      },
      {
        id: 'documentation_lookup',
        name: 'Documentation and Library Lookup',
        pattern: /documentation|library|api.*reference|example/i,
        targetTypes: ['mcp'],
        priority: 95,
        conditions: [
          { type: 'content', operator: 'contains', value: 'documentation|library|api', weight: 0.9 }
        ],
        fallbackChain: ['mcp_context7', 'bmad_system', 'claude_code_fallback'],
        enabled: true
      },
      {
        id: 'code_analysis',
        name: 'Code Analysis and Review',
        pattern: /analyze.*code|review.*code|refactor/i,
        targetTypes: ['mcp'],
        priority: 90,
        conditions: [
          { type: 'content', operator: 'contains', value: 'analyze|review|refactor', weight: 0.8 }
        ],
        fallbackChain: ['mcp_serena', 'bmad_system', 'claude_code_fallback'],
        enabled: true
      },
      {
        id: 'testing_workflows',
        name: 'Testing and Quality Assurance',
        pattern: /test|quality|validation/i,
        targetTypes: ['mcp'],
        priority: 85,
        conditions: [
          { type: 'content', operator: 'contains', value: 'test|quality|validation', weight: 0.9 }
        ],
        fallbackChain: ['mcp_testsprite', 'bmad_system', 'claude_code_fallback'],
        enabled: true
      }
    ];

    this.rules = rules;
    console.log(`📋 Initialized ${rules.length} routing rules`);
  }

  async route(request) {
    const startTime = Date.now();
    
    try {
      // Check cache for similar requests
      const cachedRoute = this.checkCache(request);
      if (cachedRoute && !this.isCacheExpired(cachedRoute)) {
        console.log(`💾 Using cached route: ${cachedRoute.decision.targetId}`);
        return cachedRoute.decision;
      }

      // Evaluate routing rules
      const ruleScores = this.evaluateRules(request);
      
      // Select best target
      const decision = await this.makeRoutingDecision(ruleScores, request);
      
      // Cache the decision
      this.cacheDecision(request, decision);
      
      // Update metrics
      const decisionTime = Date.now() - startTime;
      this.updateMetrics(decision, decisionTime);
      
      console.log(`🧭 Routed request to ${decision.targetId} (confidence: ${decision.confidence.toFixed(2)})`);
      
      return decision;

    } catch (error) {
      console.error('❌ Routing failed:', error.message);
      
      // Return fallback decision
      return {
        targetId: 'claude_code_fallback',
        confidence: 0.5,
        reasoning: `Routing failed: ${error.message}`,
        fallbackChain: ['claude_code_fallback'],
        estimatedResponseTime: 5000,
        riskScore: 0.8
      };
    }
  }

  evaluateRules(request) {
    const scores = [];
    
    for (const rule of this.rules) {
      if (!rule.enabled) continue;
      
      let score = 0;
      
      // Pattern matching
      if (rule.pattern instanceof RegExp) {
        const content = request.content || request.query || '';
        if (rule.pattern.test(content)) {
          score += 0.6;
        }
      }
      
      // Condition evaluation
      for (const condition of rule.conditions) {
        const conditionScore = this.evaluateCondition(condition, request);
        score += conditionScore * condition.weight;
      }
      
      if (score > 0.3) { // Minimum threshold
        scores.push({
          rule,
          score: Math.min(score, 1.0),
          reasoning: `Rule '${rule.name}' matched with score ${score.toFixed(2)}`
        });
      }
    }
    
    return scores.sort((a, b) => b.score - a.score);
  }

  evaluateCondition(condition, request) {
    const content = (request.content || request.query || '').toLowerCase();
    
    switch (condition.type) {
      case 'content':
        if (condition.operator === 'contains') {
          const patterns = condition.value.split('|');
          return patterns.some(pattern => content.includes(pattern)) ? 1 : 0;
        }
        break;
      
      case 'complexity':
        const complexity = this.estimateComplexity(request);
        if (condition.operator === 'greater') {
          return complexity > condition.value ? 1 : 0;
        }
        break;
    }
    
    return 0;
  }

  async makeRoutingDecision(ruleScores, request) {
    if (ruleScores.length === 0) {
      // No rules matched, use fallback
      return {
        targetId: 'claude_code_fallback',
        confidence: 0.5,
        reasoning: 'No routing rules matched, using fallback',
        fallbackChain: ['claude_code_fallback'],
        estimatedResponseTime: 5000,
        riskScore: 0.3
      };
    }

    const bestRule = ruleScores[0];
    const targetCandidates = this.getViableTargets(bestRule.rule.targetTypes);
    
    if (targetCandidates.length === 0) {
      // No viable targets, use fallback chain
      return {
        targetId: bestRule.rule.fallbackChain[bestRule.rule.fallbackChain.length - 1],
        confidence: 0.4,
        reasoning: 'No viable targets available, using fallback',
        fallbackChain: bestRule.rule.fallbackChain,
        estimatedResponseTime: 8000,
        riskScore: 0.6
      };
    }

    const bestTarget = targetCandidates[0];
    
    return {
      targetId: bestTarget.id,
      confidence: bestRule.score,
      reasoning: bestRule.reasoning,
      fallbackChain: bestRule.rule.fallbackChain,
      estimatedResponseTime: this.estimateResponseTime(bestTarget, request),
      riskScore: this.calculateRiskScore(bestTarget, request)
    };
  }

  getViableTargets(targetTypes) {
    const candidates = [];
    
    for (const [targetId, target] of this.targets.entries()) {
      if (targetTypes.includes(target.type)) {
        const circuitBreaker = this.circuitBreakers.get(targetId);
        const isHealthy = this.healthMonitor.isHealthy(targetId);
        
        if (isHealthy && !circuitBreaker.isOpen()) {
          candidates.push(target);
        }
      }
    }
    
    return candidates.sort((a, b) => b.priority - a.priority);
  }

  estimateComplexity(request) {
    let complexity = 0.2; // Base complexity
    
    const content = request.content || request.query || '';
    
    if (content.length > 100) complexity += 0.2;
    if (content.includes('comprehensive') || content.includes('detailed')) complexity += 0.3;
    if (content.includes('analyze') && content.includes('create')) complexity += 0.3;
    
    return Math.min(complexity, 1.0);
  }

  estimateResponseTime(target, request) {
    const baseTime = {
      'bmad': 3000,
      'mcp': 2000,
      'archon': 5000,
      'claude-code': 1000
    };
    
    let time = baseTime[target.type] || 2000;
    
    const complexity = this.estimateComplexity(request);
    time *= (1 + complexity * 0.5);
    
    return Math.floor(time);
  }

  calculateRiskScore(target, request) {
    let risk = 0.1; // Base risk
    
    const circuitBreaker = this.circuitBreakers.get(target.id);
    if (circuitBreaker.getFailureRate() > 0.1) {
      risk += 0.3;
    }
    
    const complexity = this.estimateComplexity(request);
    risk += complexity * 0.2;
    
    return Math.min(risk, 1.0);
  }

  checkCache(request) {
    const cacheKey = this.generateCacheKey(request);
    return this.cache.get(cacheKey) || null;
  }

  generateCacheKey(request) {
    const key = `${request.content || request.query || 'unknown'}_${request.persona || 'none'}`;
    return crypto.createHash('md5').update(key).digest('hex').substring(0, 32);
  }

  isCacheExpired(cached) {
    const maxAge = 5 * 60 * 1000; // 5 minutes
    return (Date.now() - cached.timestamp) > maxAge;
  }

  cacheDecision(request, decision) {
    const cacheKey = this.generateCacheKey(request);
    this.cache.set(cacheKey, {
      decision,
      timestamp: Date.now(),
      hits: 1
    });
  }

  updateMetrics(decision, decisionTime) {
    this.metrics.totalRoutes++;
    this.metrics.avgDecisionTime = 
      ((this.metrics.avgDecisionTime * (this.metrics.totalRoutes - 1)) + decisionTime) / 
      this.metrics.totalRoutes;
    
    const targetCount = this.metrics.routesByTarget.get(decision.targetId) || 0;
    this.metrics.routesByTarget.set(decision.targetId, targetCount + 1);
  }

  getMetrics() {
    return {
      ...this.metrics,
      routesByTarget: Object.fromEntries(this.metrics.routesByTarget),
      performanceByTarget: Object.fromEntries(this.metrics.performanceByTarget)
    };
  }

  getStatus() {
    return {
      initialized: true,
      targets: this.targets.size,
      rules: this.rules.length,
      cacheSize: this.cache.size,
      metrics: this.getMetrics()
    };
  }
}

class CircuitBreaker {
  constructor(targetId) {
    this.targetId = targetId;
    this.failures = 0;
    this.successes = 0;
    this.lastFailure = null;
    this.state = 'closed'; // closed, open, half-open
    this.threshold = 5;
    this.timeout = 60000; // 1 minute
  }

  recordSuccess() {
    this.successes++;
    this.failures = 0;
    this.state = 'closed';
  }

  recordFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  isOpen() {
    if (this.state === 'closed') return false;
    
    if (this.state === 'open' && this.lastFailure) {
      const elapsed = Date.now() - this.lastFailure;
      if (elapsed > this.timeout) {
        this.state = 'half-open';
        return false;
      }
    }
    
    return this.state === 'open';
  }

  getFailureRate() {
    const total = this.failures + this.successes;
    return total > 0 ? this.failures / total : 0;
  }
}

class HealthMonitor {
  constructor() {
    this.healthStatus = new Map();
  }

  startMonitoring() {
    // Simulate health monitoring
    setInterval(() => {
      // In real implementation, this would check actual service health
      const targets = ['bmad_system', 'mcp_context7', 'mcp_serena', 'mcp_testsprite', 'archon_service'];
      
      targets.forEach(targetId => {
        // Simulate 95% uptime
        const isHealthy = Math.random() > 0.05;
        this.healthStatus.set(targetId, isHealthy);
      });
      
      // Claude Code fallback is always healthy
      this.healthStatus.set('claude_code_fallback', true);
    }, 30000); // Every 30 seconds
  }

  isHealthy(targetId) {
    return this.healthStatus.get(targetId) !== false;
  }

  getHealthStatus() {
    return Object.fromEntries(this.healthStatus);
  }
}

// Singleton instance
let routerInstance = null;

function getIntelligentAgentRouter() {
  if (!routerInstance) {
    routerInstance = new IntelligentAgentRouter();
  }
  return routerInstance;
}

function resetIntelligentAgentRouter() {
  routerInstance = null;
}

module.exports = {
  IntelligentAgentRouter,
  getIntelligentAgentRouter,
  resetIntelligentAgentRouter
};