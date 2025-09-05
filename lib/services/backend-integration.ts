/**
 * Backend Integration Service
 * Connects BMAD Agent System with FastAPI Backend
 * Handles data persistence, user sessions, and API communication
 */

import { apiClient } from '../api-client';
// Removed BMAD system - simplified backend integration for MVP
import { logger } from '../logger';

// Backend Integration Types
export interface BackendIntegrationOptions {
  enablePersistence?: boolean;
  enableAnalytics?: boolean;
  enableCaching?: boolean;
  syncInterval?: number; // in milliseconds
}

export interface UserSession {
  id: string;
  userId: string;
  backendUserId?: string;
  role: string;
  isAuthenticated: boolean;
  persistenceEnabled: boolean;
  lastSync: Date;
  metadata: Record<string, any>;
}

export interface PersistableData {
  type: 'course' | 'lesson' | 'assessment' | 'user_progress' | 'analytics' | 'conversation';
  sessionId: string;
  userId: string;
  data: any;
  metadata: {
    agentType?: string;
    confidence?: number;
    timestamp: Date;
    source: 'bmad' | 'user' | 'system';
  };
}

export interface SyncStatus {
  success: boolean;
  itemsProcessed: number;
  itemsSkipped: number;
  errors: string[];
  lastSync: Date;
}

export class BackendIntegrationService {
  private static instance: BackendIntegrationService | null = null;
  private options: BackendIntegrationOptions;
  private activeSessions = new Map<string, UserSession>();
  private pendingData = new Map<string, PersistableData[]>();
  private syncQueue: PersistableData[] = [];
  private isOnline = true;
  private syncTimer: NodeJS.Timeout | null = null;

  constructor(options: BackendIntegrationOptions = {}) {
    this.options = {
      enablePersistence: true,
      enableAnalytics: true,
      enableCaching: true,
      syncInterval: 5000, // 5 seconds
      ...options
    };

    this.initialize();
  }

  public static getInstance(options?: BackendIntegrationOptions): BackendIntegrationService {
    if (!BackendIntegrationService.instance) {
      BackendIntegrationService.instance = new BackendIntegrationService(options);
    }
    return BackendIntegrationService.instance;
  }

  private async initialize(): Promise<void> {
    try {
      // Test backend connectivity
      await this.testBackendConnection();
      
      // Start sync timer if persistence is enabled
      if (this.options.enablePersistence && this.options.syncInterval) {
        this.startSyncTimer();
      }

      // Set up event listeners for BMAD system
      this.setupBMADEventListeners();

      logger.info('[BackendIntegration] Service initialized successfully');
    } catch (error) {
      logger.error('[BackendIntegration] Initialization failed:', error);
      this.isOnline = false;
    }
  }

  // Backend Connectivity
  private async testBackendConnection(): Promise<boolean> {
    try {
      const response = await apiClient.healthCheck();
      this.isOnline = response.status === 'healthy';
      logger.info('[BackendIntegration] Backend connectivity:', this.isOnline ? 'ONLINE' : 'OFFLINE');
      return this.isOnline;
    } catch (error) {
      logger.error('[BackendIntegration] Backend connection test failed:', error);
      this.isOnline = false;
      return false;
    }
  }

  // User Session Management
  public async createUserSession(userId: string, role: string, metadata: Record<string, any> = {}): Promise<UserSession> {
    const sessionId = `session_${Date.now()}_${userId}`;
    
    // Try to authenticate with backend
    let backendUserId: string | undefined;
    let isAuthenticated = false;

    if (this.isOnline) {
      try {
        const currentUser = await apiClient.getCurrentUser();
        backendUserId = currentUser.id;
        isAuthenticated = true;
      } catch (error) {
        logger.warn('[BackendIntegration] Could not authenticate with backend:', error);
      }
    }

    const session: UserSession = {
      id: sessionId,
      userId,
      backendUserId,
      role,
      isAuthenticated,
      persistenceEnabled: Boolean(this.options.enablePersistence) && Boolean(this.isOnline),
      lastSync: new Date(),
      metadata
    };

    this.activeSessions.set(sessionId, session);
    logger.info(`[BackendIntegration] Created session: ${sessionId} for user: ${userId}`);

    return session;
  }

  public getSession(sessionId: string): UserSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  public async syncSession(sessionId: string): Promise<SyncStatus> {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    const pendingItems = this.pendingData.get(sessionId) || [];
    const syncStatus: SyncStatus = {
      success: true,
      itemsProcessed: 0,
      itemsSkipped: 0,
      errors: [],
      lastSync: new Date()
    };

    if (!this.isOnline || !session.persistenceEnabled) {
      syncStatus.itemsSkipped = pendingItems.length;
      syncStatus.success = false;
      syncStatus.errors.push('Backend offline or persistence disabled');
      return syncStatus;
    }

    // Process pending data
    for (const item of pendingItems) {
      try {
        await this.persistData(item);
        syncStatus.itemsProcessed++;
      } catch (error) {
        syncStatus.errors.push(`Failed to persist ${item.type}: ${error}`);
        logger.error('[BackendIntegration] Persist error:', error);
      }
    }

    // Clear processed items
    if (syncStatus.itemsProcessed > 0) {
      this.pendingData.set(sessionId, pendingItems.slice(syncStatus.itemsProcessed));
    }

    // Update session sync time
    session.lastSync = syncStatus.lastSync;
    
    return syncStatus;
  }

  // Data Persistence
  public async addPersistableData(data: PersistableData): Promise<void> {
    const session = this.activeSessions.get(data.sessionId);
    if (!session) {
      logger.warn(`[BackendIntegration] Session not found for data: ${data.sessionId}`);
      return;
    }

    // Add to pending data
    const sessionData = this.pendingData.get(data.sessionId) || [];
    sessionData.push(data);
    this.pendingData.set(data.sessionId, sessionData);

    // Add to sync queue for immediate processing if online
    if (this.isOnline && session.persistenceEnabled) {
      this.syncQueue.push(data);
    }

    logger.debug(`[BackendIntegration] Added persistable data: ${data.type} for session: ${data.sessionId}`);
  }

  private async persistData(data: PersistableData): Promise<void> {
    if (!this.isOnline) {
      throw new Error('Backend offline');
    }

    try {
      switch (data.type) {
        case 'course':
          await this.persistCourseData(data);
          break;
        case 'lesson':
          await this.persistLessonData(data);
          break;
        case 'assessment':
          await this.persistAssessmentData(data);
          break;
        case 'user_progress':
          await this.persistUserProgressData(data);
          break;
        case 'analytics':
          await this.persistAnalyticsData(data);
          break;
        case 'conversation':
          await this.persistConversationData(data);
          break;
        default:
          logger.warn(`[BackendIntegration] Unknown data type: ${data.type}`);
      }
    } catch (error) {
      logger.error(`[BackendIntegration] Failed to persist ${data.type}:`, error);
      throw error;
    }
  }

  private async persistCourseData(data: PersistableData): Promise<void> {
    // Store generated course in database
    const courseData = {
      ...data.data,
      generated_by: 'bmad',
      metadata: data.metadata
    };

    // This would call the backend API to store the course
    // For now, we'll log it as the backend courses endpoint needs implementation
    logger.info('[BackendIntegration] Course data ready for persistence:', JSON.stringify({
      sessionId: data.sessionId,
      userId: data.userId,
      courseTitle: courseData.title || 'Generated Course',
      confidence: data.metadata.confidence
    }));
    
    // TODO: Implement actual API call when backend course endpoints are ready
    // await apiClient.createCourse(courseData);
  }

  private async persistLessonData(data: PersistableData): Promise<void> {
    // Store lesson data
    logger.info('[BackendIntegration] Lesson data ready for persistence:', JSON.stringify({
      sessionId: data.sessionId,
      userId: data.userId,
      lessonTitle: data.data.title || 'Generated Lesson'
    }));
    
    // TODO: Implement lesson storage API
  }

  private async persistAssessmentData(data: PersistableData): Promise<void> {
    // Store assessment data
    logger.info('[BackendIntegration] Assessment data ready for persistence:', JSON.stringify({
      sessionId: data.sessionId,
      userId: data.userId,
      assessmentType: data.data.type || data.data.assessmentType
    }));
    
    // TODO: Implement assessment storage API
  }

  private async persistUserProgressData(data: PersistableData): Promise<void> {
    // Store user progress and analytics
    logger.info('[BackendIntegration] User progress ready for persistence:', JSON.stringify({
      sessionId: data.sessionId,
      userId: data.userId,
      progressType: data.data.progressType || 'general'
    }));
    
    // TODO: Implement user progress API
  }

  private async persistAnalyticsData(data: PersistableData): Promise<void> {
    // Store analytics data
    logger.info('[BackendIntegration] Analytics data ready for persistence:', JSON.stringify({
      sessionId: data.sessionId,
      userId: data.userId,
      analyticsType: data.data.type || 'interaction'
    }));
    
    // TODO: Implement analytics storage API
  }

  private async persistConversationData(data: PersistableData): Promise<void> {
    // Store conversation history
    logger.info('[BackendIntegration] Conversation data ready for persistence:', JSON.stringify({
      sessionId: data.sessionId,
      userId: data.userId,
      messageCount: Array.isArray(data.data.messages) ? data.data.messages.length : 1
    }));
    
    // TODO: Implement conversation storage API
  }

  // BMAD System Integration
  private setupBMADEventListeners(): void {
    const bmadSystem = getBMADSystem();
    const sessionManager = getSessionManager();
    
    if (!bmadSystem || !sessionManager) {
      logger.warn('[BackendIntegration] BMAD system not available for event listening');
      return;
    }

    // Listen for agent responses that should be persisted
    sessionManager.on('agentInteractionRecorded', async (event: any) => {
      const { sessionId, agentType, response, metadata } = event;
      const session = this.activeSessions.get(sessionId);
      
      if (session && response) {
        await this.addPersistableData({
          type: this.mapAgentTypeToDataType(agentType),
          sessionId,
          userId: session.userId,
          data: response,
          metadata: {
            agentType,
            confidence: metadata?.confidence || 0.8,
            timestamp: new Date(),
            source: 'bmad'
          }
        });
      }
    });

    // Listen for session creation
    sessionManager.on('sessionCreated', async (event: any) => {
      const { sessionId, userId, role } = event;
      if (!this.activeSessions.has(sessionId)) {
        await this.createUserSession(userId, role, { source: 'bmad' });
      }
    });

    logger.info('[BackendIntegration] BMAD event listeners set up successfully');
  }

  private mapAgentTypeToDataType(agentType: string): PersistableData['type'] {
    switch (agentType?.toLowerCase()) {
      case 'content':
        return 'lesson';
      case 'assessment':
        return 'assessment';
      case 'analysis':
        return 'analytics';
      case 'planning':
        return 'course';
      case 'conversation':
        return 'conversation';
      default:
        return 'conversation';
    }
  }

  // Sync Management
  private startSyncTimer(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    this.syncTimer = setInterval(async () => {
      if (this.syncQueue.length > 0 && this.isOnline) {
        const batch = this.syncQueue.splice(0, 10); // Process in batches of 10
        
        for (const item of batch) {
          try {
            await this.persistData(item);
          } catch (error) {
            logger.error('[BackendIntegration] Sync error:', error);
            // Put back in queue for retry
            this.syncQueue.unshift(item);
          }
        }
      }
    }, this.options.syncInterval);

    logger.info(`[BackendIntegration] Sync timer started with interval: ${this.options.syncInterval}ms`);
  }

  // Utility Methods
  public getStatus(): {
    isOnline: boolean;
    activeSessions: number;
    pendingDataItems: number;
    queueLength: number;
  } {
    return {
      isOnline: this.isOnline,
      activeSessions: this.activeSessions.size,
      pendingDataItems: Array.from(this.pendingData.values()).reduce((total, items) => total + items.length, 0),
      queueLength: this.syncQueue.length
    };
  }

  public async forceSync(): Promise<SyncStatus[]> {
    const results: SyncStatus[] = [];
    
    for (const sessionId of this.activeSessions.keys()) {
      try {
        const result = await this.syncSession(sessionId);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          itemsProcessed: 0,
          itemsSkipped: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          lastSync: new Date()
        });
      }
    }
    
    return results;
  }

  public shutdown(): void {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
    
    logger.info('[BackendIntegration] Service shut down');
  }
}

// Export singleton instance
export const backendIntegration = BackendIntegrationService.getInstance();

// Export convenience functions
export async function persistBMADResult(
  sessionId: string,
  agentType: string,
  result: any,
  metadata: Record<string, any> = {}
): Promise<void> {
  const session = backendIntegration.getSession(sessionId);
  if (!session) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  await backendIntegration.addPersistableData({
    type: mapAgentTypeToDataType(agentType),
    sessionId,
    userId: session.userId,
    data: result,
    metadata: {
      agentType,
      confidence: metadata.confidence || 0.8,
      timestamp: new Date(),
      source: 'bmad',
      ...metadata
    }
  });
}

export function mapAgentTypeToDataType(agentType: string): PersistableData['type'] {
  switch (agentType?.toLowerCase()) {
    case 'content':
      return 'lesson';
    case 'assessment':
      return 'assessment';
    case 'analysis':
      return 'analytics';
    case 'planning':
      return 'course';
    case 'conversation':
      return 'conversation';
    default:
      return 'conversation';
  }
}

export default backendIntegration;