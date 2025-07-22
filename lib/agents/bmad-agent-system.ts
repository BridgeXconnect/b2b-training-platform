/**
 * BMAD (Business Multi-Agent Delegation) System
 * Parallel agent architecture for AI course platform
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';

// Agent Types and Interfaces
export interface AgentContext {
  sessionId: string;
  userId: string;
  userRole: string;
  conversationHistory: Message[];
  learningProgress: any;
  preferences: any;
  timestamp: Date;
}

export interface AgentRequest {
  id: string;
  type: AgentType;
  payload: any;
  context: AgentContext;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  timeout: number;
  retries: number;
}

export interface AgentResponse {
  id: string;
  agentType: AgentType;
  success: boolean;
  data: any;
  error?: string;
  processingTime: number;
  metadata: {
    confidence: number;
    tokens?: number;
    model?: string;
  };
}

export enum AgentType {
  CONTENT = 'content',
  CONVERSATION = 'conversation', 
  ANALYSIS = 'analysis',
  ASSESSMENT = 'assessment',
  PLANNING = 'planning',
  COORDINATION = 'coordination'
}

export enum AgentStatus {
  IDLE = 'idle',
  BUSY = 'busy',
  ERROR = 'error',
  MAINTENANCE = 'maintenance'
}

// Base Agent Class
export abstract class BaseAgent extends EventEmitter {
  protected id: string;
  protected type: AgentType;
  protected status: AgentStatus;
  protected maxConcurrent: number;
  protected currentTasks: number;
  protected lastActivity: Date;
  protected metrics: AgentMetrics;

  constructor(type: AgentType, maxConcurrent: number = 3) {
    super();
    this.id = uuidv4();
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

  abstract process(request: AgentRequest): Promise<AgentResponse>;

  async execute(request: AgentRequest): Promise<AgentResponse> {
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
    } catch (error) {
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
    } finally {
      this.currentTasks--;
      this.status = this.currentTasks > 0 ? AgentStatus.BUSY : AgentStatus.IDLE;
      this.lastActivity = new Date();
    }
  }

  private updateMetrics(processingTime: number, success: boolean) {
    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
    
    this.metrics.totalProcessingTime += processingTime;
    this.metrics.averageResponseTime = 
      this.metrics.totalProcessingTime / this.metrics.totalRequests;
  }

  getMetrics(): AgentMetrics & { id: string; type: AgentType; status: AgentStatus } {
    return {
      ...this.metrics,
      id: this.id,
      type: this.type,
      status: this.status
    };
  }

  canAcceptRequest(): boolean {
    return this.status !== AgentStatus.ERROR && 
           this.status !== AgentStatus.MAINTENANCE &&
           this.currentTasks < this.maxConcurrent;
  }
}

// Agent Metrics Interface
interface AgentMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  totalProcessingTime: number;
}

// Message Interface
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  metadata?: any;
}

// Agent Pool Manager
export class AgentPoolManager extends EventEmitter {
  private agents: Map<AgentType, BaseAgent[]>;
  private requestQueue: AgentRequest[];
  private processingQueue: boolean;

  constructor() {
    super();
    this.agents = new Map();
    this.requestQueue = [];
    this.processingQueue = false;
  }

  registerAgent(agent: BaseAgent) {
    const agentType = (agent as any).type;
    
    if (!this.agents.has(agentType)) {
      this.agents.set(agentType, []);
    }
    
    this.agents.get(agentType)!.push(agent);
    
    agent.on('taskCompleted', (event) => {
      this.emit('agentTaskCompleted', event);
    });
    
    agent.on('taskFailed', (event) => {
      this.emit('agentTaskFailed', event);
    });
  }

  async executeRequest(request: AgentRequest): Promise<AgentResponse> {
    const availableAgents = this.getAvailableAgents(request.type);
    
    if (availableAgents.length === 0) {
      // Add to queue if no agents available
      return new Promise((resolve, reject) => {
        this.requestQueue.push(request);
        
        const timeout = setTimeout(() => {
          reject(new Error('Request timeout'));
        }, request.timeout || 30000);
        
        const onComplete = (response: AgentResponse) => {
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

  private getAvailableAgents(type: AgentType): BaseAgent[] {
    const agents = this.agents.get(type) || [];
    return agents.filter(agent => agent.canAcceptRequest());
  }

  private selectBestAgent(agents: BaseAgent[]): BaseAgent {
    // Simple load-based selection - can be enhanced with more sophisticated algorithms
    return agents.reduce((best, current) => {
      const bestMetrics = best.getMetrics();
      const currentMetrics = current.getMetrics();
      
      // Prefer agents with better success rate and lower current load
      const bestScore = bestMetrics.successfulRequests / (bestMetrics.totalRequests || 1) - 
                       ((current as any).currentTasks * 0.1);
      const currentScore = currentMetrics.successfulRequests / (currentMetrics.totalRequests || 1) - 
                          ((current as any).currentTasks * 0.1);
      
      return currentScore > bestScore ? current : best;
    });
  }

  private async processQueue() {
    if (this.processingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.processingQueue = true;
    
    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift()!;
      const availableAgents = this.getAvailableAgents(request.type);
      
      if (availableAgents.length > 0) {
        const selectedAgent = this.selectBestAgent(availableAgents);
        try {
          const response = await selectedAgent.execute(request);
          if (request.payload.onComplete) {
            request.payload.onComplete(response);
          }
        } catch (error) {
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
      } else {
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
      agentsByType: {} as any,
      queueLength: this.requestQueue.length,
      systemHealth: 'healthy' as 'healthy' | 'degraded' | 'critical'
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
      .reduce((sum: number, type: any) => sum + type.error, 0);
    
    if (errorAgents > status.totalAgents * 0.5) {
      status.systemHealth = 'critical';
    } else if (errorAgents > status.totalAgents * 0.2) {
      status.systemHealth = 'degraded';
    }

    return status;
  }
}

// Context Manager for Multi-Agent Sessions
export class AgentContextManager {
  private contexts: Map<string, AgentContext>;
  private sessionHistory: Map<string, any[]>;

  constructor() {
    this.contexts = new Map();
    this.sessionHistory = new Map();
  }

  createContext(sessionId: string, userId: string, userRole: string): AgentContext {
    const context: AgentContext = {
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

  getContext(sessionId: string): AgentContext | null {
    return this.contexts.get(sessionId) || null;
  }

  updateContext(sessionId: string, updates: Partial<AgentContext>) {
    const context = this.contexts.get(sessionId);
    if (context) {
      Object.assign(context, updates);
      context.timestamp = new Date();
    }
  }

  addToHistory(sessionId: string, entry: any) {
    const history = this.sessionHistory.get(sessionId) || [];
    history.push({
      ...entry,
      timestamp: new Date()
    });
    this.sessionHistory.set(sessionId, history);
  }

  getHistory(sessionId: string): any[] {
    return this.sessionHistory.get(sessionId) || [];
  }

  cleanup(maxAge: number = 24 * 60 * 60 * 1000) { // 24 hours default
    const cutoff = new Date(Date.now() - maxAge);
    
    for (const [sessionId, context] of this.contexts.entries()) {
      if (context.timestamp < cutoff) {
        this.contexts.delete(sessionId);
        this.sessionHistory.delete(sessionId);
      }
    }
  }
}

// Main BMAD System
export class BMADSystem {
  private poolManager: AgentPoolManager;
  private contextManager: AgentContextManager;
  private initialized: boolean;

  constructor() {
    this.poolManager = new AgentPoolManager();
    this.contextManager = new AgentContextManager();
    this.initialized = false;
  }

  async initialize(agents: BaseAgent[]) {
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

  async processRequest(
    sessionId: string, 
    agentType: AgentType, 
    payload: any,
    options: {
      priority?: 'low' | 'medium' | 'high' | 'urgent';
      timeout?: number;
    } = {}
  ): Promise<AgentResponse> {
    const context = this.contextManager.getContext(sessionId);
    if (!context) {
      throw new Error('Invalid session ID');
    }

    const request: AgentRequest = {
      id: uuidv4(),
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

  createSession(userId: string, userRole: string): string {
    const sessionId = uuidv4();
    this.contextManager.createContext(sessionId, userId, userRole);
    return sessionId;
  }

  getSystemStatus() {
    return this.poolManager.getSystemStatus();
  }

  getSessionContext(sessionId: string) {
    return {
      context: this.contextManager.getContext(sessionId),
      history: this.contextManager.getHistory(sessionId)
    };
  }
}