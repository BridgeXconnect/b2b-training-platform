"use strict";
/**
 * Intelligent Agent Router
 * Smart routing system with fallback chains for multi-agent ecosystem
 *
 * Provides intelligent routing between Claude Code, BMAD, MCP servers,
 * Archon, and Tmux sessions with automatic fallback and optimization
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IntelligentAgentRouter = void 0;
exports.getIntelligentAgentRouter = getIntelligentAgentRouter;
exports.resetRouter = resetRouter;
const superclaude_bmad_bridge_1 = require("../integrations/superclaude-bmad-bridge");
const agent_integration_hook_1 = require("../hooks/agent-integration-hook");
class IntelligentAgentRouter {
    constructor() {
        this.targets = new Map();
        this.rules = new Map();
        this.circuitBreakers = new Map();
        this.cache = new Map();
        this.metrics = {
            totalRoutes: 0,
            successfulRoutes: 0,
            fallbacksUsed: 0,
            avgDecisionTime: 0,
            routesByTarget: new Map(),
            performanceByTarget: new Map()
        };
        this.initialize();
    }
    async initialize() {
        try {
            // Initialize core components
            this.bmadBridge = new superclaude_bmad_bridge_1.SuperClaudeBMADBridge();
            this.agentHook = new agent_integration_hook_1.AgentIntegrationHook();
            this.healthMonitor = new HealthMonitor();
            // Load routing targets
            await this.loadRoutingTargets();
            // Load routing rules
            this.loadRoutingRules();
            // Start health monitoring
            this.healthMonitor.startMonitoring(this.targets, this.updateTargetHealth.bind(this));
            console.log('🧭 Intelligent Agent Router initialized successfully');
        }
        catch (error) {
            console.error('❌ Failed to initialize Intelligent Agent Router:', error.message);
            throw error;
        }
    }
    async loadRoutingTargets() {
        // BMAD System targets
        this.addTarget({
            id: 'bmad_system',
            type: 'bmad',
            endpoint: 'lib/agents/bmad-agent-system',
            capabilities: ['content-generation', 'conversation', 'analysis', 'assessment', 'planning', 'coordination'],
            priority: 100,
            healthScore: 0.95,
            responseTime: 1500,
            successRate: 0.92,
            lastUsed: new Date()
        });
        // MCP Server targets
        const mcpServers = [
            { id: 'mcp_context7', capabilities: ['documentation', 'patterns', 'library-integration'] },
            { id: 'mcp_serena', capabilities: ['code-analysis', 'project-management', 'file-operations'] },
            { id: 'mcp_testsprite', capabilities: ['testing', 'validation', 'quality-assurance'] },
            { id: 'mcp_sentry', capabilities: ['error-tracking', 'monitoring', 'performance-analysis'] },
            { id: 'mcp_n8n', capabilities: ['workflow-automation', 'integration-pipelines'] },
            { id: 'mcp_playwright', capabilities: ['browser-automation', 'e2e-testing', 'visual-validation'] }
        ];
        mcpServers.forEach(server => {
            this.addTarget({
                id: server.id,
                type: 'mcp',
                endpoint: `mcp://${server.id.replace('mcp_', '')}`,
                capabilities: server.capabilities,
                priority: 90,
                healthScore: 0.90,
                responseTime: 800,
                successRate: 0.88,
                lastUsed: new Date()
            });
        });
        // Archon service
        this.addTarget({
            id: 'archon_service',
            type: 'archon',
            endpoint: 'http://localhost:8100',
            capabilities: ['dynamic-agent-generation', 'workflow-orchestration', 'agent-refinement'],
            priority: 85,
            healthScore: 0.85,
            responseTime: 2000,
            successRate: 0.80,
            lastUsed: new Date()
        });
        // Tmux sessions
        const tmuxSessions = ['agent-dashboard', 'coordination-1753882647', 'coordination-1753885955'];
        tmuxSessions.forEach(session => {
            this.addTarget({
                id: `tmux_${session}`,
                type: 'tmux',
                endpoint: `tmux:${session}`,
                capabilities: ['parallel-processing', 'terminal-operations', 'coordination'],
                priority: 70,
                healthScore: 0.80,
                responseTime: 2500,
                successRate: 0.75,
                lastUsed: new Date()
            });
        });
        // Claude Code fallback
        this.addTarget({
            id: 'claude_code_fallback',
            type: 'claude-code',
            endpoint: 'internal',
            capabilities: ['general-purpose', 'fallback', 'comprehensive'],
            priority: 50,
            healthScore: 1.0,
            responseTime: 5000,
            successRate: 0.95,
            lastUsed: new Date()
        });
    }
    loadRoutingRules() {
        // Content creation rules
        this.addRule({
            id: 'content_creation',
            name: 'Content Creation Routing',
            pattern: /create|generate|build.*(?:lesson|content|quiz|material)/i,
            targetTypes: ['bmad', 'mcp'],
            priority: 100,
            conditions: [
                { type: 'complexity', operator: 'greater', value: 0.3, weight: 0.8 },
                { type: 'content', operator: 'contains', value: 'educational', weight: 0.6 }
            ],
            fallbackChain: ['bmad_system', 'mcp_context7', 'claude_code_fallback'],
            enabled: true
        });
        // Analysis rules
        this.addRule({
            id: 'analysis_routing',
            name: 'Analysis Task Routing',
            pattern: /analyze|review|examine|investigate/i,
            targetTypes: ['bmad', 'mcp'],
            priority: 95,
            conditions: [
                { type: 'complexity', operator: 'greater', value: 0.4, weight: 0.9 },
                { type: 'persona', operator: 'equals', value: 'analyzer', weight: 1.0 }
            ],
            fallbackChain: ['bmad_system', 'mcp_serena', 'claude_code_fallback'],
            enabled: true
        });
        // Testing rules
        this.addRule({
            id: 'testing_routing',
            name: 'Testing and Validation Routing',
            pattern: /test|validate|qa|quality|e2e/i,
            targetTypes: ['mcp'],
            priority: 90,
            conditions: [
                { type: 'content', operator: 'contains', value: 'test', weight: 0.9 }
            ],
            fallbackChain: ['mcp_testsprite', 'mcp_playwright', 'claude_code_fallback'],
            enabled: true
        });
        // Documentation rules
        this.addRule({
            id: 'documentation_routing',
            name: 'Documentation and Patterns',
            pattern: /document|explain|guide|pattern|library/i,
            targetTypes: ['mcp', 'bmad'],
            priority: 85,
            conditions: [
                { type: 'content', operator: 'contains', value: 'documentation', weight: 0.8 }
            ],
            fallbackChain: ['mcp_context7', 'bmad_system', 'claude_code_fallback'],
            enabled: true
        });
        // Complex orchestration rules
        this.addRule({
            id: 'complex_orchestration',
            name: 'Complex Multi-Agent Orchestration',
            pattern: /comprehensive|complete|full|complex|orchestrate/i,
            targetTypes: ['bmad', 'archon'],
            priority: 110,
            conditions: [
                { type: 'complexity', operator: 'greater', value: 0.7, weight: 1.0 },
                { type: 'flags', operator: 'contains', value: '--wave-mode', weight: 0.9 }
            ],
            fallbackChain: ['archon_service', 'bmad_system', 'claude_code_fallback'],
            enabled: true
        });
        // Performance monitoring rules
        this.addRule({
            id: 'performance_monitoring',
            name: 'Performance and Error Monitoring',
            pattern: /error|monitor|performance|debug|track/i,
            targetTypes: ['mcp'],
            priority: 88,
            conditions: [
                { type: 'content', operator: 'regex', value: /sentry|error|performance|monitor/i, weight: 0.8 }
            ],
            fallbackChain: ['mcp_sentry', 'bmad_system', 'claude_code_fallback'],
            enabled: true
        });
        // Parallel processing rules
        this.addRule({
            id: 'parallel_processing',
            name: 'Parallel Processing Tasks',
            pattern: /parallel|concurrent|batch|multiple/i,
            targetTypes: ['tmux', 'archon'],
            priority: 75,
            conditions: [
                { type: 'flags', operator: 'contains', value: '--delegate', weight: 0.9 }
            ],
            fallbackChain: ['tmux_agent-dashboard', 'archon_service', 'bmad_system'],
            enabled: true
        });
    }
    /**
     * Main routing function - determines best target for a request
     */
    async route(request) {
        const startTime = Date.now();
        this.metrics.totalRoutes++;
        try {
            // Check cache for similar requests
            const cachedRoute = this.checkCache(request);
            if (cachedRoute && !this.isCacheExpired(cachedRoute)) {
                console.log(`💾 Using cached route: ${cachedRoute.decision.targetId}`);
                return cachedRoute.decision;
            }
            // Evaluate routing rules
            const ruleMatches = this.evaluateRules(request);
            // Score and rank targets
            const targetScores = this.scoreTargets(request, ruleMatches);
            // Select best target with circuit breaker checks
            const decision = this.selectOptimalTarget(targetScores, request);
            // Cache the decision
            this.cacheRoute(request, decision);
            // Update metrics
            this.metrics.avgDecisionTime =
                ((this.metrics.avgDecisionTime * (this.metrics.totalRoutes - 1)) +
                    (Date.now() - startTime)) / this.metrics.totalRoutes;
            console.log(`🎯 Routing decision: ${decision.targetId} (confidence: ${decision.confidence.toFixed(2)})`);
            return decision;
        }
        catch (error) {
            console.error('❌ Routing failed:', error.message);
            // Fallback to Claude Code
            return {
                targetId: 'claude_code_fallback',
                confidence: 0.5,
                reasoning: `Routing error: ${error.message}`,
                fallbackChain: ['claude_code_fallback'],
                estimatedResponseTime: 5000,
                riskScore: 0.3
            };
        }
    }
    evaluateRules(request) {
        const matches = new Map();
        for (const [ruleId, rule] of this.rules.entries()) {
            if (!rule.enabled)
                continue;
            let score = 0;
            let totalWeight = 0;
            // Check pattern match
            const content = request.content;
            const patternMatch = typeof rule.pattern === 'string'
                ? content.toLowerCase().includes(rule.pattern.toLowerCase())
                : rule.pattern.test(content);
            if (!patternMatch)
                continue;
            // Evaluate conditions
            for (const condition of rule.conditions) {
                const conditionScore = this.evaluateCondition(condition, request);
                score += conditionScore * condition.weight;
                totalWeight += condition.weight;
            }
            // Normalize score
            const normalizedScore = totalWeight > 0 ? score / totalWeight : 0;
            if (normalizedScore > 0.3) { // Minimum threshold
                matches.set(ruleId, normalizedScore * (rule.priority / 100));
            }
        }
        return matches;
    }
    evaluateCondition(condition, request) {
        const { type, operator, value } = condition;
        switch (type) {
            case 'complexity':
                const complexity = this.calculateComplexity(request);
                return this.compareValues(complexity, operator, value) ? 1 : 0;
            case 'persona':
                const persona = request.context.persona || '';
                return this.compareValues(persona, operator, value) ? 1 : 0;
            case 'flags':
                const flags = request.context.flags || [];
                return this.compareValues(flags, operator, value) ? 1 : 0;
            case 'content':
                const content = request.content.toLowerCase();
                return this.compareValues(content, operator, value) ? 1 : 0;
            case 'performance':
                // Performance-based routing conditions
                return 0.5; // Placeholder
            case 'availability':
                // Availability-based routing conditions
                return 0.8; // Placeholder
            default:
                return 0;
        }
    }
    compareValues(actual, operator, expected) {
        switch (operator) {
            case 'equals': return actual === expected;
            case 'contains':
                if (Array.isArray(actual))
                    return actual.includes(expected);
                return String(actual).includes(String(expected));
            case 'greater': return Number(actual) > Number(expected);
            case 'less': return Number(actual) < Number(expected);
            case 'regex': return new RegExp(expected).test(String(actual));
            default: return false;
        }
    }
    calculateComplexity(request) {
        // Use similar logic to SuperClaude bridge
        let complexity = 0.1;
        const content = request.content.toLowerCase();
        if (content.length > 500)
            complexity += 0.2;
        if (content.includes('create') && content.includes('analyze'))
            complexity += 0.3;
        if (request.context.flags?.includes('--think'))
            complexity += 0.2;
        if (request.context.flags?.includes('--think-hard'))
            complexity += 0.3;
        return Math.min(complexity, 1.0);
    }
    scoreTargets(request, ruleMatches) {
        const scores = new Map();
        for (const [targetId, target] of this.targets.entries()) {
            let score = 0;
            // Base score from target priority and health
            score += (target.priority / 100) * 0.3;
            score += target.healthScore * 0.2;
            score += (1 - (target.responseTime / 10000)) * 0.2; // Faster is better
            // Rule-based scoring
            for (const [ruleId, ruleScore] of ruleMatches.entries()) {
                const rule = this.rules.get(ruleId);
                if (rule && rule.targetTypes.includes(target.type)) {
                    score += ruleScore * 0.3;
                }
            }
            // Capability matching
            const capabilityMatch = this.calculateCapabilityMatch(request, target.capabilities);
            score += capabilityMatch * 0.2;
            // Circuit breaker penalty
            const circuitBreaker = this.circuitBreakers.get(targetId);
            if (circuitBreaker && circuitBreaker.isOpen()) {
                score *= 0.1; // Heavily penalize open circuit breakers
            }
            // Recent usage bonus (freshness)
            const timeSinceUsed = Date.now() - target.lastUsed.getTime();
            const freshnessBonus = Math.max(0, 1 - (timeSinceUsed / 3600000)); // 1 hour decay
            score += freshnessBonus * 0.1;
            scores.set(targetId, Math.max(0, Math.min(1, score)));
        }
        return scores;
    }
    calculateCapabilityMatch(request, capabilities) {
        const content = request.content.toLowerCase();
        let matches = 0;
        for (const capability of capabilities) {
            if (content.includes(capability.replace('-', ' ')) ||
                content.includes(capability.replace('-', ''))) {
                matches++;
            }
        }
        return Math.min(matches / capabilities.length, 1.0);
    }
    selectOptimalTarget(scores, request) {
        // Sort targets by score
        const sortedTargets = Array.from(scores.entries())
            .sort((a, b) => b[1] - a[1])
            .filter(([_, score]) => score > 0.1); // Minimum viable score
        if (sortedTargets.length === 0) {
            throw new Error('No viable targets found for request');
        }
        const [bestTargetId, bestScore] = sortedTargets[0];
        const target = this.targets.get(bestTargetId);
        // Build fallback chain from remaining viable targets
        const fallbackChain = sortedTargets
            .slice(1, 4) // Top 3 alternatives
            .map(([id, _]) => id);
        // Add Claude Code as ultimate fallback if not already present
        if (!fallbackChain.includes('claude_code_fallback')) {
            fallbackChain.push('claude_code_fallback');
        }
        return {
            targetId: bestTargetId,
            confidence: bestScore,
            reasoning: `Selected based on scoring: priority(${target.priority}), health(${target.healthScore}), capabilities match`,
            fallbackChain,
            estimatedResponseTime: target.responseTime,
            riskScore: this.calculateRiskScore(target, bestScore)
        };
    }
    calculateRiskScore(target, confidence) {
        let risk = 0;
        // Health-based risk
        risk += (1 - target.healthScore) * 0.4;
        // Performance-based risk
        risk += (target.responseTime / 10000) * 0.3;
        // Success rate risk
        risk += (1 - target.successRate) * 0.2;
        // Confidence risk
        risk += (1 - confidence) * 0.1;
        return Math.min(risk, 1.0);
    }
    /**
     * Execute request through selected target with fallback handling
     */
    async executeRoute(decision, request) {
        const attempts = [decision.targetId, ...decision.fallbackChain];
        let lastError = null;
        for (const targetId of attempts) {
            try {
                console.log(`🚀 Attempting execution on: ${targetId}`);
                const result = await this.executeOnTarget(targetId, request);
                // Update success metrics
                this.updateTargetMetrics(targetId, true, result.processingTime);
                this.metrics.successfulRoutes++;
                return result;
            }
            catch (error) {
                console.warn(`⚠️ Target ${targetId} failed: ${error.message}`);
                lastError = error;
                this.updateTargetMetrics(targetId, false, 0);
                this.updateCircuitBreaker(targetId, false);
                if (targetId !== 'claude_code_fallback') {
                    this.metrics.fallbacksUsed++;
                }
            }
        }
        throw new Error(`All routing targets failed. Last error: ${lastError?.message}`);
    }
    async executeOnTarget(targetId, request) {
        const target = this.targets.get(targetId);
        if (!target) {
            throw new Error(`Target ${targetId} not found`);
        }
        // Check circuit breaker
        const circuitBreaker = this.circuitBreakers.get(targetId);
        if (circuitBreaker && circuitBreaker.isOpen()) {
            throw new Error(`Circuit breaker open for ${targetId}`);
        }
        const startTime = Date.now();
        try {
            let result;
            switch (target.type) {
                case 'bmad':
                    result = await this.executeBMADRequest(request);
                    break;
                case 'mcp':
                    result = await this.executeMCPRequest(targetId, request);
                    break;
                case 'archon':
                    result = await this.executeArchonRequest(request);
                    break;
                case 'tmux':
                    result = await this.executeTmuxRequest(targetId, request);
                    break;
                case 'claude-code':
                default:
                    result = await this.executeClaudeCodeFallback(request);
                    break;
            }
            result.processingTime = Date.now() - startTime;
            this.updateCircuitBreaker(targetId, true);
            return result;
        }
        catch (error) {
            this.updateCircuitBreaker(targetId, false);
            throw error;
        }
    }
    async executeBMADRequest(request) {
        return await this.bmadBridge.processRequest(request);
    }
    async executeMCPRequest(targetId, request) {
        // Placeholder for MCP server integration
        // In full implementation, this would call the actual MCP server
        const serverName = targetId.replace('mcp_', '');
        return {
            id: request.id,
            success: true,
            data: {
                message: `MCP ${serverName} processed request`,
                server: serverName
            },
            delegationType: 'single',
            processingTime: Math.random() * 1000 + 500,
            confidence: 0.85,
            metadata: {
                agentsUsed: [serverName]
            }
        };
    }
    async executeArchonRequest(request) {
        // Placeholder for Archon service integration
        return {
            id: request.id,
            success: true,
            data: {
                message: 'Archon service processed request',
                agentGenerated: true
            },
            delegationType: 'orchestrated',
            processingTime: Math.random() * 2000 + 1000,
            confidence: 0.80,
            metadata: {
                agentsUsed: ['archon-generated-agent']
            }
        };
    }
    async executeTmuxRequest(targetId, request) {
        // Placeholder for Tmux session integration
        const sessionName = targetId.replace('tmux_', '');
        return {
            id: request.id,
            success: true,
            data: {
                message: `Tmux session ${sessionName} processed request`,
                parallelProcessing: true
            },
            delegationType: 'parallel',
            processingTime: Math.random() * 3000 + 1500,
            confidence: 0.75,
            metadata: {
                agentsUsed: [sessionName]
            }
        };
    }
    async executeClaudeCodeFallback(request) {
        // This represents falling back to Claude Code's normal processing
        return {
            id: request.id,
            success: true,
            data: {
                message: 'Processed by Claude Code fallback',
                fallback: true
            },
            processingTime: Math.random() * 5000 + 2000,
            confidence: 0.95,
            metadata: {
                agentsUsed: ['claude-code'],
                fallbackUsed: true
            }
        };
    }
    // Helper methods
    addTarget(target) {
        this.targets.set(target.id, target);
        this.circuitBreakers.set(target.id, new CircuitBreaker(target.id));
    }
    addRule(rule) {
        this.rules.set(rule.id, rule);
    }
    checkCache(request) {
        const cacheKey = this.generateCacheKey(request);
        return this.cache.get(cacheKey) || null;
    }
    cacheRoute(request, decision) {
        const cacheKey = this.generateCacheKey(request);
        this.cache.set(cacheKey, {
            decision,
            timestamp: Date.now(),
            hits: 1
        });
    }
    generateCacheKey(request) {
        // Create cache key from request characteristics
        const key = `${request.type}_${request.content.length}_${request.context.persona || 'none'}`;
        return Buffer.from(key).toString('base64').substring(0, 32);
    }
    isCacheExpired(cached) {
        const maxAge = 5 * 60 * 1000; // 5 minutes
        return (Date.now() - cached.timestamp) > maxAge;
    }
    updateTargetMetrics(targetId, success, responseTime) {
        const target = this.targets.get(targetId);
        if (!target)
            return;
        // Update target performance
        target.lastUsed = new Date();
        if (success) {
            target.responseTime = (target.responseTime * 0.9) + (responseTime * 0.1); // EMA
            target.successRate = (target.successRate * 0.95) + (0.05); // Slight improvement
            target.healthScore = Math.min(1.0, target.healthScore + 0.01);
        }
        else {
            target.successRate = target.successRate * 0.95; // Degrade on failure
            target.healthScore = Math.max(0.1, target.healthScore - 0.05);
        }
        // Update routing metrics
        const currentCount = this.metrics.routesByTarget.get(targetId) || 0;
        this.metrics.routesByTarget.set(targetId, currentCount + 1);
        const currentPerf = this.metrics.performanceByTarget.get(targetId) || { avgTime: 0, successRate: 0 };
        this.metrics.performanceByTarget.set(targetId, {
            avgTime: success ? ((currentPerf.avgTime * 0.9) + (responseTime * 0.1)) : currentPerf.avgTime,
            successRate: target.successRate
        });
    }
    updateCircuitBreaker(targetId, success) {
        const circuitBreaker = this.circuitBreakers.get(targetId);
        if (circuitBreaker) {
            if (success) {
                circuitBreaker.recordSuccess();
            }
            else {
                circuitBreaker.recordFailure();
            }
        }
    }
    updateTargetHealth(targetId, health) {
        const target = this.targets.get(targetId);
        if (target) {
            target.healthScore = health;
        }
    }
    // Public API
    getMetrics() {
        return { ...this.metrics };
    }
    getTargets() {
        return Array.from(this.targets.values());
    }
    getRules() {
        return Array.from(this.rules.values());
    }
    async healthCheck() {
        const targetHealth = new Map();
        for (const [id, target] of this.targets.entries()) {
            targetHealth.set(id, target.healthScore > 0.5);
        }
        return {
            healthy: true,
            targets: Object.fromEntries(targetHealth),
            metrics: this.getMetrics(),
            cacheSize: this.cache.size,
            circuitBreakers: Object.fromEntries(Array.from(this.circuitBreakers.entries()).map(([id, cb]) => [id, cb.getState()]))
        };
    }
}
exports.IntelligentAgentRouter = IntelligentAgentRouter;
// Supporting classes
class CircuitBreaker {
    constructor(targetId, threshold = 5, timeout = 60000) {
        this.targetId = targetId;
        this.threshold = threshold;
        this.timeout = timeout;
        this.failures = 0;
        this.lastFailure = null;
        this.state = 'closed';
    }
    recordSuccess() {
        this.failures = 0;
        this.state = 'closed';
    }
    recordFailure() {
        this.failures++;
        this.lastFailure = new Date();
        if (this.failures >= this.threshold) {
            this.state = 'open';
            console.warn(`🔴 Circuit breaker OPEN for ${this.targetId}`);
        }
    }
    isOpen() {
        if (this.state === 'closed')
            return false;
        if (this.state === 'open' && this.lastFailure) {
            const elapsed = Date.now() - this.lastFailure.getTime();
            if (elapsed > this.timeout) {
                this.state = 'half-open';
                console.log(`🟡 Circuit breaker HALF-OPEN for ${this.targetId}`);
                return false;
            }
        }
        return this.state === 'open';
    }
    getState() {
        return {
            state: this.state,
            failures: this.failures,
            lastFailure: this.lastFailure
        };
    }
}
class HealthMonitor {
    constructor() {
        this.interval = null;
    }
    startMonitoring(targets, updateCallback) {
        this.interval = setInterval(async () => {
            for (const [id, target] of targets.entries()) {
                try {
                    const health = await this.checkTargetHealth(target);
                    updateCallback(id, health);
                }
                catch (error) {
                    updateCallback(id, 0.1); // Minimum health on check failure
                }
            }
        }, 30000); // Check every 30 seconds
    }
    async checkTargetHealth(target) {
        // Placeholder health check - in full implementation would ping actual services
        switch (target.type) {
            case 'bmad':
                return 0.95; // Assume BMAD is healthy
            case 'mcp':
                return Math.random() * 0.2 + 0.8; // 0.8-1.0
            case 'archon':
                return Math.random() * 0.3 + 0.7; // 0.7-1.0
            case 'tmux':
                return Math.random() * 0.2 + 0.7; // 0.7-0.9
            case 'claude-code':
                return 1.0; // Always healthy
            default:
                return 0.5;
        }
    }
    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
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
function resetRouter() {
    routerInstance = null;
}
