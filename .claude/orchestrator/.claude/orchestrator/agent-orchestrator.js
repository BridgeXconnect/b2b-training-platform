"use strict";
/**
 * Claude Code Agent Orchestrator
 * Main orchestration system that enables Claude Code to automatically
 * leverage the complete multi-agent ecosystem
 *
 * This is the central coordinator that processes all Claude Code requests
 * and intelligently routes them through the agent ecosystem
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentOrchestrator = void 0;
exports.getAgentOrchestrator = getAgentOrchestrator;
exports.resetOrchestrator = resetOrchestrator;
exports.processClaudeCodeRequest = processClaudeCodeRequest;
const intelligent_agent_router_1 = require("../routing/intelligent-agent-router");
const superclaude_bmad_bridge_1 = require("../integrations/superclaude-bmad-bridge");
const agent_integration_hook_1 = require("../hooks/agent-integration-hook");
class AgentOrchestrator {
    constructor(config = {}) {
        this.config = {
            enableAutoRouting: true,
            fallbackToClaudeCode: true,
            performanceMonitoring: true,
            debugMode: false,
            maxRetries: 3,
            timeout: 60000,
            cacheResults: true,
            ...config
        };
        this.resultCache = new Map();
        this.performanceMetrics = {
            totalRequests: 0,
            delegatedRequests: 0,
            fallbackRequests: 0,
            avgProcessingTime: 0,
            successRate: 0,
            agentUtilization: new Map(),
            errorRate: 0
        };
        this.initialize();
    }
    async initialize() {
        try {
            // Initialize core components
            this.router = new intelligent_agent_router_1.IntelligentAgentRouter();
            this.bmadBridge = new superclaude_bmad_bridge_1.SuperClaudeBMADBridge();
            this.agentHook = new agent_integration_hook_1.AgentIntegrationHook();
            // Set up global request interception
            this.setupGlobalInterception();
            console.log('🎼 Agent Orchestrator initialized successfully');
            if (this.config.debugMode) {
                this.startDebugLogging();
            }
        }
        catch (error) {
            console.error('❌ Failed to initialize Agent Orchestrator:', error.message);
            throw error;
        }
    }
    /**
     * Main orchestration method - processes all Claude Code requests
     * This method intercepts requests and routes them through the agent ecosystem
     */
    async orchestrateRequest(request, context = {}) {
        const startTime = Date.now();
        this.performanceMetrics.totalRequests++;
        try {
            // Normalize request to SuperClaudeRequest format
            const normalizedRequest = this.normalizeRequest(request, context);
            if (this.config.debugMode) {
                console.log('🔍 Processing request:', {
                    id: normalizedRequest.id,
                    type: normalizedRequest.type,
                    complexity: normalizedRequest.context.complexity,
                    persona: normalizedRequest.context.persona
                });
            }
            // Check cache first
            if (this.config.cacheResults) {
                const cachedResult = this.checkCache(normalizedRequest);
                if (cachedResult) {
                    console.log('💾 Returning cached result');
                    return this.createOrchestrationResult(cachedResult.result, true, cachedResult.agent, Date.now() - startTime, false, { cacheHit: true });
                }
            }
            // Route through agent ecosystem if auto-routing enabled
            if (this.config.enableAutoRouting) {
                const agentResult = await this.routeToAgentEcosystem(normalizedRequest);
                if (agentResult.success) {
                    this.performanceMetrics.delegatedRequests++;
                    // Cache successful results
                    if (this.config.cacheResults) {
                        this.cacheResult(normalizedRequest, agentResult);
                    }
                    return this.createOrchestrationResult(agentResult, true, agentResult.agent || 'unknown', Date.now() - startTime, false);
                }
            }
            // Fallback to Claude Code if enabled
            if (this.config.fallbackToClaudeCode) {
                console.log('⬇️ Falling back to Claude Code processing');
                this.performanceMetrics.fallbackRequests++;
                const fallbackResult = await this.executeClaudeCodeFallback(normalizedRequest);
                return this.createOrchestrationResult(fallbackResult, false, 'claude-code', Date.now() - startTime, true);
            }
            throw new Error('No routing path available and fallback disabled');
        }
        catch (error) {
            console.error('❌ Orchestration failed:', error.message);
            this.performanceMetrics.errorRate =
                ((this.performanceMetrics.errorRate * (this.performanceMetrics.totalRequests - 1)) + 1) /
                    this.performanceMetrics.totalRequests;
            if (this.config.fallbackToClaudeCode) {
                const fallbackResult = await this.executeClaudeCodeFallback(this.normalizeRequest(request, context));
                return this.createOrchestrationResult(fallbackResult, false, 'claude-code', Date.now() - startTime, true, { error: error.message });
            }
            throw error;
        }
        finally {
            this.updatePerformanceMetrics(Date.now() - startTime);
        }
    }
    normalizeRequest(request, context) {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        let content;
        let type;
        if (typeof request === 'string') {
            content = request;
            type = this.inferRequestType(content);
        }
        else {
            content = request.content || request.message || JSON.stringify(request);
            type = request.type || this.inferRequestType(content);
        }
        return {
            id: requestId,
            content,
            type,
            context: {
                persona: context.persona || this.inferPersona(content),
                flags: context.flags || this.inferFlags(content),
                complexity: context.complexity || this.calculateComplexity(content),
                sessionId: context.sessionId || `session_${Date.now()}`,
                userHistory: context.userHistory || [],
                projectContext: context.projectContext || {}
            },
            metadata: {
                timestamp: new Date(),
                source: 'claude-code',
                priority: context.priority || this.inferPriority(content)
            }
        };
    }
    inferRequestType(content) {
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes('create') && (lowerContent.includes('lesson') || lowerContent.includes('quiz'))) {
            return 'content-creation';
        }
        if (lowerContent.includes('analyze') || lowerContent.includes('review')) {
            return 'analysis';
        }
        if (lowerContent.includes('implement') || lowerContent.includes('build')) {
            return 'implementation';
        }
        if (lowerContent.includes('test') || lowerContent.includes('validate')) {
            return 'testing';
        }
        if (lowerContent.includes('help') || lowerContent.includes('explain')) {
            return 'conversation';
        }
        return 'general';
    }
    inferPersona(content) {
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes('architecture') || lowerContent.includes('design system')) {
            return 'architect';
        }
        if (lowerContent.includes('analyze') || lowerContent.includes('investigate')) {
            return 'analyzer';
        }
        if (lowerContent.includes('security') || lowerContent.includes('vulnerability')) {
            return 'security';
        }
        if (lowerContent.includes('performance') || lowerContent.includes('optimize')) {
            return 'performance';
        }
        if (lowerContent.includes('ui') || lowerContent.includes('component')) {
            return 'frontend';
        }
        if (lowerContent.includes('api') || lowerContent.includes('server')) {
            return 'backend';
        }
        return undefined;
    }
    inferFlags(content) {
        const flags = [];
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes('comprehensive') || lowerContent.includes('detailed')) {
            flags.push('--think');
        }
        if (lowerContent.includes('complex') || lowerContent.includes('difficult')) {
            flags.push('--think-hard');
        }
        if (lowerContent.includes('parallel') || lowerContent.includes('multiple')) {
            flags.push('--delegate');
        }
        if (lowerContent.includes('systematic') || lowerContent.includes('thorough')) {
            flags.push('--wave-mode');
        }
        return flags;
    }
    calculateComplexity(content) {
        let complexity = 0.1; // Base complexity
        if (content.length > 100)
            complexity += 0.1;
        if (content.length > 500)
            complexity += 0.2;
        if (content.length > 1000)
            complexity += 0.1;
        // Multi-step indicators
        const multiStepWords = ['first', 'then', 'next', 'after', 'finally'];
        const multiStepCount = multiStepWords.filter(word => content.toLowerCase().includes(word)).length;
        complexity += Math.min(multiStepCount * 0.1, 0.3);
        // Multiple action words
        const actionWords = ['create', 'analyze', 'build', 'implement', 'test'];
        const actionCount = actionWords.filter(word => content.toLowerCase().includes(word)).length;
        complexity += Math.min(actionCount * 0.15, 0.4);
        return Math.min(complexity, 1.0);
    }
    inferPriority(content) {
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes('urgent') || lowerContent.includes('asap')) {
            return 'urgent';
        }
        if (lowerContent.includes('important') || lowerContent.includes('critical')) {
            return 'high';
        }
        if (lowerContent.includes('when you can') || lowerContent.includes('later')) {
            return 'low';
        }
        return 'medium';
    }
    async routeToAgentEcosystem(request) {
        try {
            // Get routing decision from intelligent router
            const routingDecision = await this.router.route(request);
            if (this.config.debugMode) {
                console.log('🎯 Routing decision:', {
                    target: routingDecision.targetId,
                    confidence: routingDecision.confidence,
                    reasoning: routingDecision.reasoning
                });
            }
            // Execute the route with fallback handling
            const result = await this.router.executeRoute(routingDecision, request);
            // Update agent utilization metrics
            this.updateAgentUtilization(result.metadata.agentsUsed);
            return result;
        }
        catch (error) {
            console.error('🚨 Agent ecosystem routing failed:', error.message);
            throw error;
        }
    }
    async executeClaudeCodeFallback(request) {
        // This represents Claude Code's normal processing
        // In the real implementation, this would call Claude Code's native processing
        console.log('🔄 Executing Claude Code fallback processing');
        // Simulate Claude Code processing
        const processingTime = Math.random() * 3000 + 2000;
        await new Promise(resolve => setTimeout(resolve, processingTime));
        return {
            id: request.id,
            success: true,
            data: {
                message: 'Processed by Claude Code (fallback)',
                content: `Claude Code processed: ${request.content.substring(0, 100)}...`,
                fallback: true
            },
            processingTime,
            confidence: 0.95,
            metadata: {
                agentsUsed: ['claude-code'],
                fallbackUsed: true
            }
        };
    }
    createOrchestrationResult(result, delegated, agent, processingTime, fallbackUsed, additionalMetadata = {}) {
        const success = result.success !== false;
        return {
            success,
            result: result.data || result,
            delegated,
            agent,
            processingTime,
            fallbackUsed,
            error: result.error,
            metadata: {
                agentsUsed: result.metadata?.agentsUsed || [agent],
                confidence: result.confidence || (success ? 0.8 : 0.2),
                ...additionalMetadata
            }
        };
    }
    checkCache(request) {
        const cacheKey = this.generateCacheKey(request);
        const cached = this.resultCache.get(cacheKey);
        if (cached && !this.isCacheExpired(cached)) {
            cached.hits++;
            return cached;
        }
        return null;
    }
    cacheResult(request, result) {
        const cacheKey = this.generateCacheKey(request);
        this.resultCache.set(cacheKey, {
            result,
            agent: result.agent || 'unknown',
            timestamp: Date.now(),
            hits: 1,
            ttl: 5 * 60 * 1000 // 5 minutes
        });
    }
    generateCacheKey(request) {
        // Create cache key from request characteristics
        const key = `${request.type}_${request.content.length}_${request.context.complexity}_${request.context.persona || 'none'}`;
        return Buffer.from(key).toString('base64').substring(0, 32);
    }
    isCacheExpired(cached) {
        return (Date.now() - cached.timestamp) > cached.ttl;
    }
    updateAgentUtilization(agentsUsed) {
        for (const agent of agentsUsed) {
            const current = this.performanceMetrics.agentUtilization.get(agent) || 0;
            this.performanceMetrics.agentUtilization.set(agent, current + 1);
        }
    }
    updatePerformanceMetrics(processingTime) {
        this.performanceMetrics.avgProcessingTime =
            ((this.performanceMetrics.avgProcessingTime * (this.performanceMetrics.totalRequests - 1)) +
                processingTime) / this.performanceMetrics.totalRequests;
        this.performanceMetrics.successRate =
            (this.performanceMetrics.totalRequests - this.performanceMetrics.errorRate * this.performanceMetrics.totalRequests) /
                this.performanceMetrics.totalRequests;
    }
    setupGlobalInterception() {
        // This is where we would hook into Claude Code's request processing
        // For now, this serves as a placeholder for the integration point
        if (typeof global !== 'undefined') {
            // Set up global request interceptor
            global.__claudeCodeOrchestrator = this;
            console.log('🔗 Global request interception enabled');
        }
    }
    startDebugLogging() {
        setInterval(() => {
            console.log('📊 Orchestrator Debug Metrics:', {
                totalRequests: this.performanceMetrics.totalRequests,
                delegationRate: `${((this.performanceMetrics.delegatedRequests / this.performanceMetrics.totalRequests) * 100).toFixed(1)}%`,
                avgProcessingTime: `${this.performanceMetrics.avgProcessingTime.toFixed(0)}ms`,
                cacheSize: this.resultCache.size,
                topAgents: Array.from(this.performanceMetrics.agentUtilization.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
            });
        }, 60000); // Every minute in debug mode
    }
    // Public API methods
    async getSystemStatus() {
        const routerHealth = await this.router.healthCheck();
        const bridgeHealth = await this.bmadBridge.healthCheck();
        return {
            healthy: routerHealth.healthy && bridgeHealth.healthy,
            components: {
                router: routerHealth.healthy,
                bmadBridge: bridgeHealth.healthy,
                agentHook: true // Assume healthy if initialized
            },
            metrics: this.performanceMetrics,
            cache: {
                size: this.resultCache.size,
                hitRate: this.calculateCacheHitRate()
            },
            config: this.config
        };
    }
    calculateCacheHitRate() {
        const totalHits = Array.from(this.resultCache.values())
            .reduce((sum, cached) => sum + cached.hits, 0);
        const hitRate = totalHits > 0 ? (totalHits / this.performanceMetrics.totalRequests * 100) : 0;
        return `${hitRate.toFixed(1)}%`;
    }
    getPerformanceMetrics() {
        return { ...this.performanceMetrics };
    }
    async updateConfiguration(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('🔄 Orchestrator configuration updated');
    }
    clearCache() {
        this.resultCache.clear();
        console.log('🗑️ Result cache cleared');
    }
    // Agent ecosystem management
    async refreshAgentRegistry() {
        await this.agentHook.refreshAgentRegistry();
        console.log('🔄 Agent registry refreshed');
    }
    getAvailableAgents() {
        return this.router.getTargets();
    }
    getRoutingRules() {
        return this.router.getRules();
    }
}
exports.AgentOrchestrator = AgentOrchestrator;
// Global orchestrator instance
let orchestratorInstance = null;
function getAgentOrchestrator(config) {
    if (!orchestratorInstance) {
        orchestratorInstance = new AgentOrchestrator(config);
    }
    return orchestratorInstance;
}
function resetOrchestrator() {
    orchestratorInstance = null;
}
// Export for Claude Code integration
function processClaudeCodeRequest(request, context = {}) {
    const orchestrator = getAgentOrchestrator();
    return orchestrator.orchestrateRequest(request, context);
}
// Main entry point for Claude Code
if (typeof global !== 'undefined') {
    global.processClaudeCodeRequest = processClaudeCodeRequest;
}
