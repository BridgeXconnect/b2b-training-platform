/**
 * API Integration Layer for BMAD Agent System
 * Handles integration with existing API routes and Next.js app
 */

import { NextRequest, NextResponse } from 'next/server';
import { BMADSystem, AgentType } from './bmad-agent-system';
import { 
  ContentAgent, 
  ConversationAgent, 
  AnalysisAgent, 
  AssessmentAgent, 
  PlanningAgent, 
  CoordinationAgent 
} from './specialized-agents';
import { AdvancedSessionManager } from './session-manager';
import { DelegationCoordinator, DelegationOptions } from './delegation-coordinator';
import { verifyJwtToken } from '../auth/jwt-utils';
import { getUserFromToken } from '../auth/token-utils';

// Global BMAD System Instance
let bmadSystemInstance: BMADSystem | null = null;
let sessionManagerInstance: AdvancedSessionManager | null = null;
let delegationCoordinatorInstance: DelegationCoordinator | null = null;

// Initialize BMAD System
export async function initializeBMADSystem(): Promise<BMADSystem> {
  if (bmadSystemInstance) {
    return bmadSystemInstance;
  }

  // Create session manager
  sessionManagerInstance = new AdvancedSessionManager();

  // Create BMAD system
  bmadSystemInstance = new BMADSystem();

  // Initialize agents
  const agents = [
    new ContentAgent(),
    new ConversationAgent(),
    new AnalysisAgent(),
    new AssessmentAgent(),
    new PlanningAgent(),
    new CoordinationAgent()
  ];

  await bmadSystemInstance.initialize(agents);

  // Create delegation coordinator
  delegationCoordinatorInstance = new DelegationCoordinator(
    bmadSystemInstance, 
    sessionManagerInstance
  );

  // Set up event handlers
  setupEventHandlers();

  return bmadSystemInstance;
}

// Get system instances
export function getBMADSystem(): BMADSystem | null {
  return bmadSystemInstance;
}

export function getSessionManager(): AdvancedSessionManager | null {
  return sessionManagerInstance;
}

export function getDelegationCoordinator(): DelegationCoordinator | null {
  return delegationCoordinatorInstance;
}

// Event Handlers
function setupEventHandlers(): void {
  if (!bmadSystemInstance || !sessionManagerInstance || !delegationCoordinatorInstance) {
    return;
  }

  // Log system events
  delegationCoordinatorInstance.on('taskDelegationStarted', (event) => {
    console.log(`[BMAD] Task delegation started:`, event);
  });

  delegationCoordinatorInstance.on('taskDelegationCompleted', (event) => {
    console.log(`[BMAD] Task delegation completed:`, event);
  });

  delegationCoordinatorInstance.on('taskDelegationFailed', (event) => {
    console.error(`[BMAD] Task delegation failed:`, event);
  });

  sessionManagerInstance.on('sessionCreated', (event) => {
    console.log(`[BMAD] Session created:`, event);
  });

  sessionManagerInstance.on('agentInteractionRecorded', (event) => {
    console.log(`[BMAD] Agent interaction recorded:`, event);
  });
}

// Enhanced API Handler for Chat Route
export async function handleChatRequest(req: NextRequest): Promise<NextResponse> {
  try {
    // Initialize system if needed
    const bmadSystem = await initializeBMADSystem();
    const sessionManager = getSessionManager()!;
    const delegationCoordinator = getDelegationCoordinator()!;

    // Parse request
    const body = await req.json();
    const { message, sessionId: providedSessionId, options = {} } = body;

    // Authenticate user
    const authResult = await authenticateRequest(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Authentication failed', details: authResult.error },
        { status: 401 }
      );
    }

    // Get or create session
    let sessionId = providedSessionId;
    if (!sessionId) {
      sessionId = await sessionManager.createSession(
        authResult.user.id,
        authResult.user.role,
        {
          platform: 'web',
          userAgent: req.headers.get('user-agent') || '',
          deviceType: getDeviceType(req.headers.get('user-agent') || '')
        }
      );
    } else {
      // Validate existing session
      const existingSession = await sessionManager.getSession(sessionId);
      if (!existingSession) {
        // Create new session if provided session doesn't exist
        sessionId = await sessionManager.createSession(
          authResult.user.id,
          authResult.user.role,
          {
            platform: 'web',
            userAgent: req.headers.get('user-agent') || '',
            deviceType: getDeviceType(req.headers.get('user-agent') || '')
          }
        );
      }
    }

    // Analyze request to determine delegation strategy
    const requestAnalysis = analyzeIncomingRequest(message, options);
    
    if (requestAnalysis.requiresMultipleAgents) {
      // Use delegation coordinator for complex requests
      const delegationOptions: DelegationOptions = {
        priority: requestAnalysis.priority,
        timeout: options.timeout || 30000,
        aggregationMethod: requestAnalysis.aggregationMethod || 'combined'
      };

      const result = await delegationCoordinator.delegateTask(
        sessionId,
        requestAnalysis.delegationRequest,
        delegationOptions
      );

      return NextResponse.json({
        success: true,
        sessionId,
        response: result.aggregatedResult?.response || formatDelegationResponse(result),
        metadata: {
          type: 'delegation',
          executionTime: result.executionTime,
          agentsUsed: Array.from(result.results.keys()).length,
          confidence: result.aggregatedResult?.confidence || 0.8
        }
      });

    } else {
      // Use single agent for simple requests
      const agentType = requestAnalysis.recommendedAgent;
      const response = await bmadSystem.processRequest(
        sessionId,
        agentType,
        requestAnalysis.agentPayload,
        { timeout: options.timeout || 15000 }
      );

      return NextResponse.json({
        success: response.success,
        sessionId,
        response: response.data?.response || response.data,
        metadata: {
          type: 'single-agent',
          agentType,
          processingTime: response.processingTime,
          confidence: response.metadata.confidence
        },
        error: response.error
      });
    }

  } catch (error) {
    console.error('[BMAD] Chat request failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Enhanced API Handler for AI Generate Route
export async function handleAIGenerateRequest(req: NextRequest): Promise<NextResponse> {
  try {
    const bmadSystem = await initializeBMADSystem();
    const sessionManager = getSessionManager()!;

    const body = await req.json();
    const { type, parameters, sessionId: providedSessionId } = body;

    // Authenticate user
    const authResult = await authenticateRequest(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Get or create session
    let sessionId = providedSessionId;
    if (!sessionId) {
      sessionId = await sessionManager.createSession(
        authResult.user.id,
        authResult.user.role
      );
    } else {
      // Validate existing session
      const existingSession = await sessionManager.getSession(sessionId);
      if (!existingSession) {
        // Create new session if provided session doesn't exist
        sessionId = await sessionManager.createSession(
          authResult.user.id,
          authResult.user.role
        );
      }
    }

    // Process with appropriate agent
    let agentType: AgentType;
    let payload: any;

    switch (type) {
      case 'lesson':
      case 'content':
      case 'quiz':
      case 'explanation':
        agentType = AgentType.CONTENT;
        payload = { type, parameters };
        break;
      
      case 'assessment':
        agentType = AgentType.ASSESSMENT;
        payload = { assessmentType: 'create', data: parameters };
        break;
      
      case 'study-plan':
        agentType = AgentType.PLANNING;
        payload = { planType: 'study-plan', parameters };
        break;
      
      case 'progress-analysis':
        agentType = AgentType.ANALYSIS;
        payload = { analysisType: 'progress', data: parameters };
        break;
      
      default:
        agentType = AgentType.CONTENT;
        payload = { type, parameters };
    }

    const response = await bmadSystem.processRequest(
      sessionId,
      agentType,
      payload
    );

    return NextResponse.json({
      success: response.success,
      sessionId,
      data: response.data,
      metadata: {
        agentType,
        processingTime: response.processingTime,
        confidence: response.metadata.confidence
      },
      error: response.error
    });

  } catch (error) {
    console.error('[BMAD] Generate request failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// CopilotKit Integration Handler
export async function handleCopilotKitRequest(req: NextRequest): Promise<NextResponse> {
  try {
    const bmadSystem = await initializeBMADSystem();
    const sessionManager = getSessionManager()!;

    const body = await req.json();
    const { action, parameters, sessionId: providedSessionId } = body;

    // Authenticate user
    const authResult = await authenticateRequest(req);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }

    // Get or create session
    let sessionId = providedSessionId;
    if (!sessionId) {
      sessionId = await sessionManager.createSession(
        authResult.user.id,
        authResult.user.role
      );
    } else {
      // Validate existing session
      const existingSession = await sessionManager.getSession(sessionId);
      if (!existingSession) {
        // Create new session if provided session doesn't exist
        sessionId = await sessionManager.createSession(
          authResult.user.id,
          authResult.user.role
        );
      }
    }

    // Map CopilotKit actions to BMAD agents
    const actionMapping = mapCopilotKitAction(action, parameters);
    
    const response = await bmadSystem.processRequest(
      sessionId,
      actionMapping.agentType,
      actionMapping.payload
    );

    return NextResponse.json({
      success: response.success,
      sessionId,
      result: response.data,
      metadata: {
        action,
        agentType: actionMapping.agentType,
        processingTime: response.processingTime,
        confidence: response.metadata.confidence
      },
      error: response.error
    });

  } catch (error) {
    console.error('[BMAD] CopilotKit request failed:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// System Health Check
export async function handleHealthCheck(): Promise<NextResponse> {
  try {
    const bmadSystem = getBMADSystem();
    const sessionManager = getSessionManager();
    const delegationCoordinator = getDelegationCoordinator();

    if (!bmadSystem || !sessionManager || !delegationCoordinator) {
      return NextResponse.json({
        status: 'unhealthy',
        message: 'BMAD system not initialized',
        timestamp: new Date().toISOString()
      }, { status: 503 });
    }

    const systemStatus = bmadSystem.getSystemStatus();
    const performanceMetrics = delegationCoordinator.getPerformanceMetrics();
    const activeTaskCount = delegationCoordinator.getActiveTaskCount();

    return NextResponse.json({
      status: systemStatus.systemHealth,
      bmadSystem: {
        totalAgents: systemStatus.totalAgents,
        agentsByType: systemStatus.agentsByType,
        queueLength: systemStatus.queueLength
      },
      delegation: {
        activeTaskCount,
        performanceMetrics: Object.fromEntries(performanceMetrics)
      },
      sessions: {
        activeSessionCount: sessionManager.getAllActiveSessionIds().length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[BMAD] Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 503 });
  }
}

// Helper Functions
async function authenticateRequest(req: NextRequest): Promise<{
  success: boolean;
  user?: any;
  error?: string;
}> {
  try {
    // Development mode bypass
    if (process.env.NODE_ENV === 'development' && process.env.BYPASS_AUTH === 'true') {
      return {
        success: true,
        user: { id: 'dev-user', role: 'student', email: 'dev@example.com' }
      };
    }

    // Get token from Authorization header or cookie
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.startsWith('Bearer ') 
      ? authHeader.substring(7)
      : req.cookies.get('auth-token')?.value;

    if (!token) {
      return { success: false, error: 'No authentication token provided' };
    }

    // Verify JWT token
    const isValid = verifyJwtToken(token);
    if (!isValid) {
      return { success: false, error: 'Invalid authentication token' };
    }

    // Get user from token
    const user = getUserFromToken(token);
    if (!user) {
      return { success: false, error: 'Could not extract user from token' };
    }

    return { success: true, user };

  } catch (error) {
    console.error('[BMAD] Authentication failed:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Authentication error' 
    };
  }
}

function getDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  }
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  }
  
  return 'desktop';
}

function analyzeIncomingRequest(message: string, options: any): {
  requiresMultipleAgents: boolean;
  recommendedAgent: AgentType;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  delegationRequest: any;
  agentPayload: any;
  aggregationMethod?: 'consensus' | 'combined' | 'best-result';
} {
  const lowerMessage = message.toLowerCase();
  
  // Keywords that indicate complex multi-agent requests
  const complexKeywords = [
    'create comprehensive', 'full course', 'complete study plan',
    'analyze and create', 'assess and recommend', 'review and improve',
    'multiple', 'various', 'different types', 'comprehensive'
  ];

  // Check for multi-agent indicators
  const requiresMultipleAgents = complexKeywords.some(keyword => 
    lowerMessage.includes(keyword)
  ) || options.multiAgent === true;

  // Determine priority
  let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
  if (lowerMessage.includes('urgent') || lowerMessage.includes('asap') || options.urgent) {
    priority = 'urgent';
  } else if (lowerMessage.includes('important') || lowerMessage.includes('priority')) {
    priority = 'high';
  } else if (lowerMessage.includes('when you can') || lowerMessage.includes('no rush')) {
    priority = 'low';
  }

  // Select single agent for simple requests
  let recommendedAgent = AgentType.CONVERSATION; // Default
  
  if (lowerMessage.includes('create') || lowerMessage.includes('generate') || lowerMessage.includes('lesson')) {
    recommendedAgent = AgentType.CONTENT;
  } else if (lowerMessage.includes('analyze') || lowerMessage.includes('review') || lowerMessage.includes('progress')) {
    recommendedAgent = AgentType.ANALYSIS;
  } else if (lowerMessage.includes('assess') || lowerMessage.includes('quiz') || lowerMessage.includes('test')) {
    recommendedAgent = AgentType.ASSESSMENT;
  } else if (lowerMessage.includes('plan') || lowerMessage.includes('schedule') || lowerMessage.includes('strategy')) {
    recommendedAgent = AgentType.PLANNING;
  } else if (lowerMessage.includes('explain') || lowerMessage.includes('help') || lowerMessage.includes('chat')) {
    recommendedAgent = AgentType.CONVERSATION;
  }

  // Create payloads
  const delegationRequest = {
    type: 'comprehensive-learning',
    message,
    options,
    multiStep: true,
    requiresCreativity: true,
    requiresAnalysis: true
  };

  const agentPayload = {
    message,
    conversationType: 'tutoring',
    options
  };

  return {
    requiresMultipleAgents,
    recommendedAgent,
    priority,
    delegationRequest,
    agentPayload,
    aggregationMethod: requiresMultipleAgents ? 'combined' : undefined
  };
}

function mapCopilotKitAction(action: string, parameters: any): {
  agentType: AgentType;
  payload: any;
} {
  switch (action) {
    case 'createLesson':
      return {
        agentType: AgentType.CONTENT,
        payload: { type: 'lesson', parameters }
      };
    
    case 'analyzeProgress':
      return {
        agentType: AgentType.ANALYSIS,
        payload: { analysisType: 'progress', data: parameters }
      };
    
    case 'createAssessment':
      return {
        agentType: AgentType.ASSESSMENT,
        payload: { assessmentType: 'create', data: parameters }
      };
    
    case 'createStudyPlan':
      return {
        agentType: AgentType.PLANNING,
        payload: { planType: 'study-plan', parameters }
      };
    
    case 'generateContent':
      return {
        agentType: AgentType.CONTENT,
        payload: { type: 'content', parameters }
      };
    
    case 'curateContent':
      return {
        agentType: AgentType.CONTENT,
        payload: { type: 'explanation', parameters }
      };
    
    default:
      return {
        agentType: AgentType.COORDINATION,
        payload: { coordinationType: 'orchestrate', agentRequests: [{ action, parameters }] }
      };
  }
}

function formatDelegationResponse(result: any): string {
  if (result.aggregatedResult?.response) {
    return result.aggregatedResult.response;
  }
  
  if (result.success) {
    const successfulResults = Array.from(result.results.values())
      .filter(r => r.success)
      .map(r => r.data?.response || 'Completed successfully')
      .join(' ');
    
    return successfulResults || 'Task completed successfully with multiple agents.';
  }
  
  return 'I encountered some difficulties completing your request. Please try again or rephrase your question.';
}

// Export for API routes
export const BMADApiHandlers = {
  handleChatRequest,
  handleAIGenerateRequest,
  handleCopilotKitRequest,
  handleHealthCheck,
  initializeBMADSystem
};