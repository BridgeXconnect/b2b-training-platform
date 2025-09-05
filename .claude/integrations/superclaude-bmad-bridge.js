/**
 * SuperClaude BMAD Bridge - JavaScript Compiled Version
 * Connects SuperClaude Framework to BMAD agent ecosystem
 */

const { EventEmitter } = require('events');

class SuperClaudeBMADBridge extends EventEmitter {
  constructor() {
    super();
    this.bmadSystem = null;
    this.delegationCoordinator = null;
    this.sessionManager = new Map();
    this.activeRequests = new Map();
    this.performanceMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      avgResponseTime: 0,
      lastActivity: new Date()
    };
    
    console.log('🤖 SuperClaude BMAD Bridge initialized');
  }

  async initialize() {
    try {
      // Try to load BMAD system
      const { BMADSystem } = require('../../lib/agents/bmad-agent-system');
      const { DelegationCoordinator } = require('../../lib/agents/delegation-coordinator');
      
      this.bmadSystem = new BMADSystem();
      this.delegationCoordinator = new DelegationCoordinator();
      
      await this.bmadSystem.initialize([]);
      
      console.log('✅ BMAD Bridge initialized successfully');
      return true;
    } catch (error) {
      console.warn('⚠️ BMAD system not available, using fallback mode:', error.message);
      return false;
    }
  }

  async processRequest(request) {
    const startTime = Date.now();
    
    try {
      if (!this.bmadSystem) {
        throw new Error('BMAD system not initialized');
      }

      // Create session if needed
      let sessionId = request.sessionId;
      if (!sessionId) {
        sessionId = this.bmadSystem.createSession(request.userId || 'anonymous', 'user');
        this.sessionManager.set(sessionId, { created: new Date(), userId: request.userId });
      }

      // Process request through BMAD
      const response = await this.bmadSystem.processRequest(
        sessionId,
        request.agentType || 'content',
        request.payload,
        { priority: request.priority || 'medium' }
      );

      this.updateMetrics(true, Date.now() - startTime);
      
      return {
        success: true,
        data: response.data,
        metadata: {
          sessionId,
          agentType: response.agentType,
          confidence: response.metadata.confidence,
          processingTime: Date.now() - startTime
        }
      };

    } catch (error) {
      this.updateMetrics(false, Date.now() - startTime);
      
      return {
        success: false,
        error: error.message,
        metadata: {
          processingTime: Date.now() - startTime
        }
      };
    }
  }

  async healthCheck() {
    try {
      const bmadStatus = this.bmadSystem ? this.bmadSystem.getSystemStatus() : null;
      const bmadHealthy = bmadStatus ? bmadStatus.systemHealth === 'healthy' : false;
      const coordinatorHealthy = this.delegationCoordinator ? true : false;
      
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
        error: error.message,
        components: {
          bmadSystem: false,
          delegationCoordinator: false,
          sessionManager: true
        }
      };
    }
  }

  updateMetrics(success, responseTime) {
    this.performanceMetrics.totalRequests++;
    this.performanceMetrics.lastActivity = new Date();
    
    if (success) {
      this.performanceMetrics.successfulRequests++;
      this.performanceMetrics.avgResponseTime = 
        ((this.performanceMetrics.avgResponseTime * (this.performanceMetrics.totalRequests - 1)) + responseTime) / 
        this.performanceMetrics.totalRequests;
    }
  }

  getPerformanceMetrics() {
    return {
      ...this.performanceMetrics,
      successRate: this.performanceMetrics.totalRequests > 0 ? 
        this.performanceMetrics.successfulRequests / this.performanceMetrics.totalRequests : 0
    };
  }

  getSupportedPersonas() {
    return [
      'architect', 'frontend', 'backend', 'security', 'performance',
      'analyzer', 'qa', 'refactorer', 'devops', 'mentor', 'scribe'
    ];
  }

  mapPersonaToAgent(persona) {
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
}

// Singleton instance
let bridgeInstance = null;

function getSuperClaudeBMADBridge() {
  if (!bridgeInstance) {
    bridgeInstance = new SuperClaudeBMADBridge();
  }
  return bridgeInstance;
}

function resetSuperClaudeBMADBridge() {
  bridgeInstance = null;
}

module.exports = {
  SuperClaudeBMADBridge,
  getSuperClaudeBMADBridge,
  resetSuperClaudeBMADBridge
};