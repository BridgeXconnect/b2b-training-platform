"use strict";
/**
 * BMAD (Business Multi-Agent Delegation) System
 * Parallel agent architecture for AI course platform
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BMADSystem = exports.AgentContextManager = exports.AgentPoolManager = exports.BaseAgent = exports.AgentStatus = exports.AgentType = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
var AgentType;
(function (AgentType) {
    AgentType["CONTENT"] = "content";
    AgentType["CONVERSATION"] = "conversation";
    AgentType["ANALYSIS"] = "analysis";
    AgentType["ASSESSMENT"] = "assessment";
    AgentType["PLANNING"] = "planning";
    AgentType["COORDINATION"] = "coordination";
    AgentType["ANALYTICS"] = "analytics";
    AgentType["COLLABORATION"] = "collaboration";
    AgentType["ONBOARDING"] = "onboarding";
    AgentType["MATERIALS"] = "materials";
})(AgentType || (exports.AgentType = AgentType = {}));
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["IDLE"] = "idle";
    AgentStatus["BUSY"] = "busy";
    AgentStatus["ERROR"] = "error";
    AgentStatus["MAINTENANCE"] = "maintenance";
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
// Base Agent Class
class BaseAgent extends events_1.EventEmitter {
    constructor(type, maxConcurrent = 3) {
        super();
        this.id = (0, uuid_1.v4)();
        this.type = type;
        this.status = AgentStatus.IDLE;
        this.maxConcurrent = maxConcurrent;
        this.currentTasks = 0;
        this.lastActivity = new Date();
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            totalProcessingTime: 0
        };
    }
    async execute(request) {
        if (this.currentTasks >= this.maxConcurrent) {
            throw new Error(`Agent ${this.type} is at capacity`);
        }
        this.currentTasks++;
        this.status = AgentStatus.BUSY;
        this.metrics.totalRequests++;
        const startTime = Date.now();
        try {
            const response = await this.process(request);
            const processingTime = Date.now() - startTime;
            this.updateMetrics(processingTime, true);
            this.emit('taskCompleted', { agentId: this.id, request, response });
            return {
                ...response,
                processingTime
            };
        }
        catch (error) {
            const processingTime = Date.now() - startTime;
            this.updateMetrics(processingTime, false);
            this.emit('taskFailed', { agentId: this.id, request, error });
            return {
                id: request.id,
                agentType: this.type,
                success: false,
                data: null,
                error: error.message,
                processingTime,
                metadata: { confidence: 0 }
            };
        }
        finally {
            this.currentTasks--;
            this.status = this.currentTasks > 0 ? AgentStatus.BUSY : AgentStatus.IDLE;
            this.lastActivity = new Date();
        }
    }
    updateMetrics(processingTime, success) {
        if (success) {
            this.metrics.successfulRequests++;
        }
        else {
            this.metrics.failedRequests++;
        }
        this.metrics.totalProcessingTime += processingTime;
        this.metrics.averageResponseTime =
            this.metrics.totalProcessingTime / this.metrics.totalRequests;
    }
    getMetrics() {
        return {
            ...this.metrics,
            id: this.id,
            type: this.type,
            status: this.status
        };
    }
    canAcceptRequest() {
        return this.status !== AgentStatus.ERROR &&
            this.status !== AgentStatus.MAINTENANCE &&
            this.currentTasks < this.maxConcurrent;
    }
}
exports.BaseAgent = BaseAgent;
// Agent Pool Manager
class AgentPoolManager extends events_1.EventEmitter {
    constructor() {
        super();
        this.agents = new Map();
        this.requestQueue = [];
        this.processingQueue = false;
    }
    registerAgent(agent) {
        const agentType = agent.type;
        if (!this.agents.has(agentType)) {
            this.agents.set(agentType, []);
        }
        this.agents.get(agentType).push(agent);
        agent.on('taskCompleted', (event) => {
            this.emit('agentTaskCompleted', event);
        });
        agent.on('taskFailed', (event) => {
            this.emit('agentTaskFailed', event);
        });
    }
    async executeRequest(request) {
        const availableAgents = this.getAvailableAgents(request.type);
        if (availableAgents.length === 0) {
            // Add to queue if no agents available
            return new Promise((resolve, reject) => {
                this.requestQueue.push(request);
                const timeout = setTimeout(() => {
                    reject(new Error('Request timeout'));
                }, request.timeout || 30000);
                const onComplete = (response) => {
                    clearTimeout(timeout);
                    resolve(response);
                };
                request.payload.onComplete = onComplete;
                this.processQueue();
            });
        }
        // Select best agent based on load and performance
        const selectedAgent = this.selectBestAgent(availableAgents);
        return await selectedAgent.execute(request);
    }
    getAvailableAgents(type) {
        const agents = this.agents.get(type) || [];
        return agents.filter(agent => agent.canAcceptRequest());
    }
    selectBestAgent(agents) {
        // Simple load-based selection - can be enhanced with more sophisticated algorithms
        return agents.reduce((best, current) => {
            const bestMetrics = best.getMetrics();
            const currentMetrics = current.getMetrics();
            // Prefer agents with better success rate and lower current load
            const bestScore = bestMetrics.successfulRequests / (bestMetrics.totalRequests || 1) -
                (current.currentTasks * 0.1);
            const currentScore = currentMetrics.successfulRequests / (currentMetrics.totalRequests || 1) -
                (current.currentTasks * 0.1);
            return currentScore > bestScore ? current : best;
        });
    }
    async processQueue() {
        if (this.processingQueue || this.requestQueue.length === 0) {
            return;
        }
        this.processingQueue = true;
        while (this.requestQueue.length > 0) {
            const request = this.requestQueue.shift();
            const availableAgents = this.getAvailableAgents(request.type);
            if (availableAgents.length > 0) {
                const selectedAgent = this.selectBestAgent(availableAgents);
                try {
                    const response = await selectedAgent.execute(request);
                    if (request.payload.onComplete) {
                        request.payload.onComplete(response);
                    }
                }
                catch (error) {
                    if (request.payload.onComplete) {
                        request.payload.onComplete({
                            id: request.id,
                            agentType: request.type,
                            success: false,
                            data: null,
                            error: error.message,
                            processingTime: 0,
                            metadata: { confidence: 0 }
                        });
                    }
                }
            }
            else {
                // Put back in queue if no agents available
                this.requestQueue.unshift(request);
                break;
            }
        }
        this.processingQueue = false;
    }
    getSystemStatus() {
        const status = {
            totalAgents: 0,
            agentsByType: {},
            queueLength: this.requestQueue.length,
            systemHealth: 'healthy'
        };
        for (const [type, agents] of this.agents.entries()) {
            status.totalAgents += agents.length;
            status.agentsByType[type] = {
                total: agents.length,
                idle: agents.filter(a => a.getMetrics().status === AgentStatus.IDLE).length,
                busy: agents.filter(a => a.getMetrics().status === AgentStatus.BUSY).length,
                error: agents.filter(a => a.getMetrics().status === AgentStatus.ERROR).length
            };
        }
        // Simple health calculation
        const errorAgents = Object.values(status.agentsByType)
            .reduce((sum, type) => sum + (Number(type.error) || 0), 0);
        if (errorAgents > (status.totalAgents * 0.5)) {
            status.systemHealth = 'critical';
        }
        else if (errorAgents > (status.totalAgents * 0.2)) {
            status.systemHealth = 'degraded';
        }
        return status;
    }
}
exports.AgentPoolManager = AgentPoolManager;
// Context Manager for Multi-Agent Sessions
class AgentContextManager {
    constructor() {
        this.contexts = new Map();
        this.sessionHistory = new Map();
    }
    createContext(sessionId, userId, userRole) {
        const context = {
            sessionId,
            userId,
            userRole,
            conversationHistory: [],
            learningProgress: {},
            preferences: {},
            timestamp: new Date()
        };
        this.contexts.set(sessionId, context);
        this.sessionHistory.set(sessionId, []);
        return context;
    }
    getContext(sessionId) {
        return this.contexts.get(sessionId) || null;
    }
    updateContext(sessionId, updates) {
        const context = this.contexts.get(sessionId);
        if (context) {
            Object.assign(context, updates);
            context.timestamp = new Date();
        }
    }
    addToHistory(sessionId, entry) {
        const history = this.sessionHistory.get(sessionId) || [];
        history.push({
            ...entry,
            timestamp: new Date()
        });
        this.sessionHistory.set(sessionId, history);
    }
    getHistory(sessionId) {
        return this.sessionHistory.get(sessionId) || [];
    }
    cleanup(maxAge = 24 * 60 * 60 * 1000) {
        const cutoff = new Date(Date.now() - maxAge);
        for (const [sessionId, context] of this.contexts.entries()) {
            if (context.timestamp < cutoff) {
                this.contexts.delete(sessionId);
                this.sessionHistory.delete(sessionId);
            }
        }
    }
}
exports.AgentContextManager = AgentContextManager;
// Main BMAD System
class BMADSystem {
    constructor() {
        this.poolManager = new AgentPoolManager();
        this.contextManager = new AgentContextManager();
        this.initialized = false;
    }
    async initialize(agents) {
        if (this.initialized) {
            return;
        }
        // Register all agents
        agents.forEach(agent => {
            this.poolManager.registerAgent(agent);
        });
        // Set up cleanup intervals
        setInterval(() => {
            this.contextManager.cleanup();
        }, 60 * 60 * 1000); // Cleanup every hour
        this.initialized = true;
    }
    async processRequest(sessionId, agentType, payload, options = {}) {
        const context = this.contextManager.getContext(sessionId);
        if (!context) {
            throw new Error('Invalid session ID');
        }
        const request = {
            id: (0, uuid_1.v4)(),
            type: agentType,
            payload,
            context,
            priority: options.priority || 'medium',
            timeout: options.timeout || 30000,
            retries: 3
        };
        const response = await this.poolManager.executeRequest(request);
        // Update context with response
        this.contextManager.addToHistory(sessionId, {
            request: request.payload,
            response: response.data,
            agentType,
            success: response.success
        });
        return response;
    }
    createSession(userId, userRole) {
        const sessionId = (0, uuid_1.v4)();
        this.contextManager.createContext(sessionId, userId, userRole);
        return sessionId;
    }
    getSystemStatus() {
        return this.poolManager.getSystemStatus();
    }
    getSessionContext(sessionId) {
        return {
            context: this.contextManager.getContext(sessionId),
            history: this.contextManager.getHistory(sessionId)
        };
    }
}
exports.BMADSystem = BMADSystem;
