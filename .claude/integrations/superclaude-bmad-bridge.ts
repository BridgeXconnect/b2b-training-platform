/**
 * SuperClaude-BMAD Integration Bridge
 * Connects SuperClaude Framework with local BMAD agent ecosystem
 * 
 * This bridge enables automatic delegation from Claude Code to BMAD agents
 * based on SuperClaude's intelligent routing and persona system
 */

import { BMADSystem, AgentType, AgentRequest, AgentResponse } from '../../lib/agents/bmad-agent-system';
import { DelegationCoordinator, DelegationOptions } from '../../lib/agents/delegation-coordinator';
import { AdvancedSessionManager } from '../../lib/agents/session-manager';

export interface SuperClaudeRequest {
  id: string;
  content: string;
  type: string;
  context: {
    persona?: string;
    flags?: string[];
    complexity?: number;
    sessionId?: string;
    userHistory?: any[];
    projectContext?: any;
  };
  metadata: {
    timestamp: Date;
    source: 'claude-code' | 'direct' | 'hook';
    priority: 'low' | 'medium' | 'high' | 'urgent';
  };
}

export interface SuperClaudeResponse {
  id: string;
  success: boolean;
  data: any;
  agent?: string;
  delegationType?: 'single' | 'parallel' | 'sequential' | 'orchestrated';
  processingTime: number;
  confidence: number;
  metadata: {
    agentsUsed: string[];
    fallbackUsed?: boolean;
    error?: string;
    warnings?: string[];
  };
}

export interface BridgeConfiguration {
  autoActivation: boolean;
  complexityThreshold: number;
  enableFallback: boolean;
  performanceMonitoring: boolean;
  maxConcurrentDelegations: number;
  timeoutSettings: {
    single: number;
    parallel: number;
    sequential: number;
  };
}

export class SuperClaudeBMADBridge {
  private bmadSystem: BMADSystem;
  private delegationCoordinator: DelegationCoordinator;
  private sessionManager: AdvancedSessionManager;
  private config: BridgeConfiguration;
  private performanceMetrics: Map<string, any>;
  private activeRequests: Map<string, SuperClaudeRequest>;

  constructor(config: Partial<BridgeConfiguration> = {}) {
    this.config = {
      autoActivation: true,
      complexityThreshold: 0.3,
      enableFallback: true,
      performanceMonitoring: true,
      maxConcurrentDelegations: 5,
      timeoutSettings: {
        single: 30000,
        parallel: 45000,
        sequential: 60000
      },
      ...config
    };

    this.performanceMetrics = new Map();
    this.activeRequests = new Map();
    
    this.initializeBMADSystem();
  }

  private async initializeBMADSystem() {
    try {
      // Initialize BMAD components
      this.bmadSystem = new BMADSystem();
      this.sessionManager = new AdvancedSessionManager();
      this.delegationCoordinator = new DelegationCoordinator(this.bmadSystem, this.sessionManager);

      // Set up event listeners
      this.setupEventListeners();

      console.log('🔗 SuperClaude-BMAD Bridge initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize SuperClaude-BMAD Bridge:', error.message);
      throw error;
    }
  }

  private setupEventListeners() {
    // Listen to delegation events
    this.delegationCoordinator.on('taskDelegationStarted', (event) => {
      console.log(`🚀 Task delegation started: ${event.taskId} (${event.strategy})`);
    });

    this.delegationCoordinator.on('taskDelegationCompleted', (event) => {
      console.log(`✅ Task delegation completed: ${event.taskId} (${event.executionTime}ms)`);
      this.updatePerformanceMetrics(event);
    });

    this.delegationCoordinator.on('taskDelegationFailed', (event) => {
      console.error(`❌ Task delegation failed: ${event.sessionId} - ${event.error}`);
    });
  }

  /**
   * Main entry point for SuperClaude requests
   * Analyzes request and determines optimal delegation strategy
   */
  async processRequest(request: SuperClaudeRequest): Promise<SuperClaudeResponse> {
    const startTime = Date.now();
    this.activeRequests.set(request.id, request);

    try {
      // Analyze request for delegation potential
      const analysis = await this.analyzeRequestForDelegation(request);
      
      if (analysis.shouldDelegate) {
        // Delegate to BMAD system
        const result = await this.delegateToAgents(request, analysis);
        
        return {
          id: request.id,
          success: result.success,
          data: result.aggregatedResult || result.results,
          agent: analysis.primaryAgent,
          delegationType: analysis.delegationType,
          processingTime: Date.now() - startTime,
          confidence: result.success ? 0.9 : 0.5,
          metadata: {
            agentsUsed: analysis.recommendedAgents,
            fallbackUsed: false
          }
        };
      } else {
        // Return request to Claude Code for direct processing
        throw new Error('No suitable delegation path found - fallback to Claude Code');
      }

    } catch (error) {
      console.warn(`⚠️ Delegation failed for request ${request.id}, falling back to Claude Code`);
      
      if (this.config.enableFallback) {
        return {
          id: request.id,
          success: false,
          data: null,
          processingTime: Date.now() - startTime,
          confidence: 0.1,
          metadata: {
            agentsUsed: [],
            fallbackUsed: true,
            error: error.message
          }
        };
      } else {
        throw error;
      }
    } finally {
      this.activeRequests.delete(request.id);
    }
  }

  private async analyzeRequestForDelegation(request: SuperClaudeRequest) {
    const analysis = {
      shouldDelegate: false,
      confidence: 0,
      primaryAgent: '',
      recommendedAgents: [] as string[],
      delegationType: 'single' as 'single' | 'parallel' | 'sequential' | 'orchestrated',
      reasoning: '',
      complexity: 0
    };

    // Extract characteristics from request
    const requestText = request.content.toLowerCase();
    const context = request.context;
    
    // Calculate complexity based on content and context
    analysis.complexity = this.calculateRequestComplexity(request);
    
    // Check if complexity exceeds threshold
    if (analysis.complexity < this.config.complexityThreshold) {
      analysis.reasoning = `Below complexity threshold (${analysis.complexity.toFixed(2)} < ${this.config.complexityThreshold})`;
      return analysis;
    }

    // Map SuperClaude personas to BMAD agents
    const personaAgentMapping = this.mapPersonaToBMADAgents(context.persona);
    
    // Analyze request type and content
    const requestAnalysis = this.analyzeRequestContent(requestText);
    
    // Combine persona and content analysis
    const combinedAgents = [...personaAgentMapping, ...requestAnalysis.agents];
    const uniqueAgents = [...new Set(combinedAgents)];

    if (uniqueAgents.length > 0) {
      analysis.shouldDelegate = true;
      analysis.confidence = Math.min(0.95, analysis.complexity + 0.3);
      analysis.primaryAgent = uniqueAgents[0];
      analysis.recommendedAgents = uniqueAgents;
      
      // Determine delegation type
      if (uniqueAgents.length > 2 && analysis.complexity > 0.7) {
        analysis.delegationType = 'orchestrated';
      } else if (uniqueAgents.length > 1 && requestAnalysis.hasParallelPotential) {
        analysis.delegationType = 'parallel';
      } else if (uniqueAgents.length > 1) {
        analysis.delegationType = 'sequential';
      } else {
        analysis.delegationType = 'single';
      }

      analysis.reasoning = `High complexity (${analysis.complexity.toFixed(2)}) with ${uniqueAgents.length} suitable agents`;
    } else {
      analysis.reasoning = 'No suitable BMAD agents identified for request type';
    }

    return analysis;
  }

  private calculateRequestComplexity(request: SuperClaudeRequest): number {
    let complexity = 0.1; // Base complexity

    const content = request.content.toLowerCase();
    const context = request.context;

    // Content length factor
    if (content.length > 100) complexity += 0.1;
    if (content.length > 500) complexity += 0.2;
    if (content.length > 1000) complexity += 0.1;

    // Multi-step indicators
    const multiStepWords = ['first', 'then', 'next', 'after', 'finally', 'step', 'phase'];
    const multiStepCount = multiStepWords.filter(word => content.includes(word)).length;
    complexity += Math.min(multiStepCount * 0.1, 0.3);

    // Multiple action words
    const actionWords = ['create', 'analyze', 'build', 'implement', 'design', 'test', 'evaluate'];
    const actionCount = actionWords.filter(word => content.includes(word)).length;
    complexity += Math.min(actionCount * 0.15, 0.4);

    // SuperClaude flags indicate complexity
    if (context.flags) {
      if (context.flags.includes('--think')) complexity += 0.2;
      if (context.flags.includes('--think-hard')) complexity += 0.3;
      if (context.flags.includes('--ultrathink')) complexity += 0.4;
      if (context.flags.includes('--delegate')) complexity += 0.2;
      if (context.flags.includes('--wave-mode')) complexity += 0.3;
    }

    // Persona complexity indicators
    const complexPersonas = ['architect', 'analyzer', 'security', 'performance'];
    if (context.persona && complexPersonas.includes(context.persona)) {
      complexity += 0.2;
    }

    // Context richness
    if (context.userHistory && context.userHistory.length > 3) complexity += 0.1;
    if (context.projectContext) complexity += 0.1;

    return Math.min(complexity, 1.0);
  }

  private mapPersonaToBMADAgents(persona?: string): string[] {
    if (!persona) return [];

    const personaMapping: Record<string, string[]> = {
      'architect': ['coordination', 'planning'],
      'frontend': ['content', 'conversation'],
      'backend': ['analysis', 'planning'],
      'analyzer': ['analysis'],
      'security': ['analysis', 'coordination'],
      'mentor': ['conversation', 'content'],
      'refactorer': ['analysis', 'coordination'],
      'performance': ['analysis'],
      'qa': ['assessment', 'analysis'],
      'devops': ['coordination', 'planning'],
      'scribe': ['content']
    };

    return personaMapping[persona] || [];
  }

  private analyzeRequestContent(content: string) {
    const analysis = {
      agents: [] as string[],
      hasParallelPotential: false,
      estimatedSteps: 1
    };

    // Content creation indicators
    if (content.includes('create') || content.includes('generate')) {
      if (content.includes('lesson') || content.includes('content') || content.includes('material')) {
        analysis.agents.push('content');
      }
      if (content.includes('quiz') || content.includes('test') || content.includes('assessment')) {
        analysis.agents.push('assessment');
      }
    }

    // Analysis indicators
    if (content.includes('analyze') || content.includes('review') || content.includes('examine')) {
      analysis.agents.push('analysis');
    }

    // Conversation indicators
    if (content.includes('help') || content.includes('explain') || content.includes('tutor')) {
      analysis.agents.push('conversation');
    }

    // Planning indicators
    if (content.includes('plan') || content.includes('strategy') || content.includes('roadmap')) {
      analysis.agents.push('planning');
    }

    // Assessment indicators
    if (content.includes('assess') || content.includes('evaluate') || content.includes('grade')) {
      analysis.agents.push('assessment');
    }

    // Coordination indicators
    if (content.includes('comprehensive') || content.includes('complete') || content.includes('full')) {
      analysis.agents.push('coordination');
      analysis.hasParallelPotential = true;
    }

    // Multiple requirements suggest parallel potential
    const requirementCount = analysis.agents.length;
    if (requirementCount > 2) {
      analysis.hasParallelPotential = true;
      analysis.estimatedSteps = requirementCount;
    }

    return analysis;
  }

  private async delegateToAgents(request: SuperClaudeRequest, analysis: any) {
    const sessionId = request.context.sessionId || `session_${Date.now()}`;
    
    // Create delegation request
    const delegationRequest = {
      type: this.mapToBMADRequestType(request, analysis),
      content: request.content,
      context: request.context,
      multiStep: analysis.delegationType !== 'single',
      requiresCreativity: this.requiresCreativity(request.content),
      requiresAnalysis: this.requiresAnalysis(request.content),
      timeConstraints: request.metadata.priority === 'urgent' ? { urgent: true } : undefined,
      dependencies: [],
      dataVolume: request.content.length > 1000 ? 'large' : 'normal'
    };

    // Set delegation options based on analysis
    const options: DelegationOptions = {
      priority: request.metadata.priority,
      timeout: this.config.timeoutSettings[analysis.delegationType] || this.config.timeoutSettings.single,
      maxConcurrent: this.config.maxConcurrentDelegations,
      aggregationMethod: this.selectAggregationMethod(analysis.delegationType)
    };

    try {
      // Delegate through coordination system
      const result = await this.delegationCoordinator.delegateTask(
        sessionId,
        delegationRequest,
        options
      );

      return result;
    } catch (error) {
      console.error('BMAD delegation failed:', error.message);
      throw error;
    }
  }

  private mapToBMADRequestType(request: SuperClaudeRequest, analysis: any): string {
    if (analysis.recommendedAgents.length > 2) {
      return 'comprehensive-learning';
    }
    if (analysis.recommendedAgents.includes('content') && analysis.recommendedAgents.includes('assessment')) {
      return 'content-creation-suite';
    }
    if (analysis.recommendedAgents.includes('conversation')) {
      return 'personalized-tutoring';
    }
    return 'general';
  }

  private requiresCreativity(content: string): boolean {
    const creativityWords = ['create', 'design', 'innovative', 'creative', 'original', 'unique'];
    return creativityWords.some(word => content.toLowerCase().includes(word));
  }

  private requiresAnalysis(content: string): boolean {
    const analysisWords = ['analyze', 'examine', 'review', 'assess', 'evaluate', 'investigate'];
    return analysisWords.some(word => content.toLowerCase().includes(word));
  }

  private selectAggregationMethod(delegationType: string): DelegationOptions['aggregationMethod'] {
    switch (delegationType) {
      case 'parallel': return 'combined';
      case 'sequential': return 'best-result';
      case 'orchestrated': return 'consensus';
      default: return 'combined';
    }
  }

  private updatePerformanceMetrics(event: any) {
    if (!this.config.performanceMonitoring) return;

    const agentType = event.agent || 'unknown';
    const existing = this.performanceMetrics.get(agentType) || {
      totalRequests: 0,
      successfulRequests: 0,
      avgResponseTime: 0,
      lastUpdated: new Date()
    };

    existing.totalRequests++;
    if (event.success) existing.successfulRequests++;
    existing.avgResponseTime = 
      ((existing.avgResponseTime * (existing.totalRequests - 1)) + event.executionTime) / 
      existing.totalRequests;
    existing.lastUpdated = new Date();

    this.performanceMetrics.set(agentType, existing);
  }

  // Public API methods
  getPerformanceMetrics() {
    return Object.fromEntries(this.performanceMetrics);
  }

  getActiveRequestCount() {
    return this.activeRequests.size;
  }

  async refreshConfiguration(newConfig: Partial<BridgeConfiguration>) {
    this.config = { ...this.config, ...newConfig };
    console.log('🔄 SuperClaude-BMAD Bridge configuration updated');
  }

  async healthCheck() {
    try {
      const bmadStatus = this.bmadSystem.getSystemStatus();
      const bmadHealthy = bmadStatus.systemHealth === 'healthy';
      const coordinatorHealthy = this.delegationCoordinator.getActiveTaskCount() !== undefined;
      
      return {
        healthy: bmadHealthy && coordinatorHealthy,
        components: {
          bmadSystem: bmadHealthy,
          delegationCoordinator: coordinatorHealthy,
          sessionManager: !!this.sessionManager
        },
        status: bmadStatus,
        metrics: this.getPerformanceMetrics(),
        activeRequests: this.activeRequests.size
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }
}

// Singleton instance for global use
let bridgeInstance: SuperClaudeBMADBridge | null = null;

export function getSuperClaudeBMADBridge(config?: Partial<BridgeConfiguration>): SuperClaudeBMADBridge {
  if (!bridgeInstance) {
    bridgeInstance = new SuperClaudeBMADBridge(config);
  }
  return bridgeInstance;
}

export function resetBridge() {
  bridgeInstance = null;
}