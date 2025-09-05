"use strict";
/**
 * Session Management and Context System for BMAD Agents
 * Handles persistent sessions, context sharing, and state management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedSessionManager = exports.ContextSharingSystem = void 0;
const events_1 = require("events");
// Context Sharing System
class ContextSharingSystem extends events_1.EventEmitter {
    constructor() {
        super();
        this.sharedContexts = new Map();
        this.contextSubscribers = new Map();
        this.contextUpdates = new Map();
    }
    createSharedContext(sessionId, scope) {
        const sharedContext = {
            id: `${sessionId}_${Date.now()}`,
            scope,
            sessionId,
            data: new Map(),
            metadata: {
                createdAt: new Date(),
                updatedAt: new Date(),
                version: 1,
                subscribers: 0
            },
            accessControl: {
                readPermissions: ['all'],
                writePermissions: [sessionId],
                adminPermissions: [sessionId]
            }
        };
        this.sharedContexts.set(sharedContext.id, sharedContext);
        return sharedContext;
    }
    subscribeToContext(contextId, subscriberId) {
        if (!this.sharedContexts.has(contextId)) {
            return false;
        }
        if (!this.contextSubscribers.has(contextId)) {
            this.contextSubscribers.set(contextId, new Set());
        }
        this.contextSubscribers.get(contextId).add(subscriberId);
        const context = this.sharedContexts.get(contextId);
        context.metadata.subscribers = this.contextSubscribers.get(contextId).size;
        this.emit('contextSubscribed', { contextId, subscriberId });
        return true;
    }
    updateSharedContext(contextId, key, value, updaterId) {
        const context = this.sharedContexts.get(contextId);
        if (!context) {
            return false;
        }
        // Check write permissions
        if (!this.hasWritePermission(context, updaterId)) {
            return false;
        }
        const oldValue = context.data.get(key);
        context.data.set(key, value);
        context.metadata.updatedAt = new Date();
        context.metadata.version++;
        // Record update
        const update = {
            timestamp: new Date(),
            key,
            oldValue,
            newValue: value,
            updaterId,
            updateType: oldValue === undefined ? 'create' : 'update'
        };
        if (!this.contextUpdates.has(contextId)) {
            this.contextUpdates.set(contextId, []);
        }
        this.contextUpdates.get(contextId).push(update);
        // Notify subscribers
        const subscribers = this.contextSubscribers.get(contextId);
        if (subscribers) {
            subscribers.forEach(subscriberId => {
                if (subscriberId !== updaterId) {
                    this.emit('contextUpdated', {
                        contextId,
                        key,
                        value,
                        subscriberId,
                        updaterId
                    });
                }
            });
        }
        return true;
    }
    getSharedContext(contextId, requesterId) {
        const context = this.sharedContexts.get(contextId);
        if (!context) {
            return null;
        }
        if (!this.hasReadPermission(context, requesterId)) {
            return null;
        }
        return {
            id: context.id,
            scope: context.scope,
            data: Object.fromEntries(context.data),
            metadata: context.metadata
        };
    }
    hasReadPermission(context, userId) {
        return context.accessControl.readPermissions.includes('all') ||
            context.accessControl.readPermissions.includes(userId);
    }
    hasWritePermission(context, userId) {
        return context.accessControl.writePermissions.includes(userId) ||
            context.accessControl.adminPermissions.includes(userId);
    }
    cleanup(maxAge = 24 * 60 * 60 * 1000) {
        const cutoff = new Date(Date.now() - maxAge);
        for (const [contextId, context] of this.sharedContexts.entries()) {
            if (context.metadata.updatedAt < cutoff) {
                this.sharedContexts.delete(contextId);
                this.contextSubscribers.delete(contextId);
                this.contextUpdates.delete(contextId);
            }
        }
    }
}
exports.ContextSharingSystem = ContextSharingSystem;
// Advanced Session Manager
class AdvancedSessionManager extends events_1.EventEmitter {
    constructor(persistenceAdapter) {
        super();
        this.sessions = new Map();
        this.contextSharing = new ContextSharingSystem();
        this.persistenceAdapter = persistenceAdapter || new MemoryPersistenceAdapter();
        this.sessionMetrics = new SessionMetricsCollector();
        // Set up cleanup intervals
        setInterval(() => {
            this.cleanupInactiveSessions();
        }, 15 * 60 * 1000); // Every 15 minutes
        setInterval(() => {
            this.contextSharing.cleanup();
        }, 60 * 60 * 1000); // Every hour
    }
    async createSession(userId, userRole, metadata = {}) {
        const sessionId = this.generateSessionId();
        // Load existing persistent data
        const persistentData = await this.persistenceAdapter.loadUserData(userId) || this.createDefaultPersistentData();
        const session = {
            id: sessionId,
            userId,
            userRole,
            startTime: new Date(),
            lastActivity: new Date(),
            isActive: true,
            context: {
                sessionId,
                userId,
                userRole,
                conversationHistory: [],
                learningProgress: persistentData.learningProgress,
                preferences: persistentData.userPreferences,
                timestamp: new Date()
            },
            metadata: {
                platform: 'web',
                deviceType: 'desktop',
                sessionQuality: 'good',
                performanceMetrics: {
                    avgResponseTime: 0,
                    totalInteractions: 0,
                    successRate: 1.0,
                    errorCount: 0,
                    timeoutCount: 0
                },
                ...metadata
            },
            persistentData
        };
        this.sessions.set(sessionId, session);
        // Create shared context for this session
        this.contextSharing.createSharedContext(sessionId, 'session');
        this.emit('sessionCreated', { sessionId, userId, userRole });
        return sessionId;
    }
    async getSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        // Update last activity
        session.lastActivity = new Date();
        return session;
    }
    async updateSessionContext(sessionId, updates) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }
        // Update context
        Object.assign(session.context, updates);
        session.context.timestamp = new Date();
        session.lastActivity = new Date();
        // Update shared context
        if (updates.learningProgress) {
            this.contextSharing.updateSharedContext(`${sessionId}_session`, 'learningProgress', updates.learningProgress, sessionId);
        }
        this.emit('sessionContextUpdated', { sessionId, updates });
        return true;
    }
    async recordAgentInteraction(sessionId, agentType, request, response, userFeedback) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return;
        }
        // Update conversation history
        if (request.message) {
            session.context.conversationHistory.push({
                id: this.generateConversationId(),
                content: request.message,
                role: 'user',
                timestamp: new Date()
            });
        }
        if (response.data && typeof response.data === 'object' && response.data.response) {
            session.context.conversationHistory.push({
                id: this.generateConversationId(),
                content: response.data.response,
                role: 'assistant',
                timestamp: new Date(),
                metadata: {
                    agentType,
                    confidence: response.metadata.confidence
                }
            });
        }
        // Update persistent conversation memory
        const conversationEntry = {
            id: this.generateConversationId(),
            timestamp: new Date(),
            userMessage: request.message || '',
            agentResponse: response.data?.response || 'No response',
            agentType,
            sentiment: this.analyzeSentiment(request.message, response.success),
            importance: this.calculateImportance(request, response, userFeedback),
            tags: this.extractTags(request, response)
        };
        session.persistentData.conversationMemory.shortTerm.push(conversationEntry);
        // Update agent interaction history
        this.updateAgentUsageStats(session, agentType, response, userFeedback);
        // Update session metrics
        this.sessionMetrics.recordInteraction(sessionId, {
            agentType,
            responseTime: response.processingTime,
            success: response.success,
            userFeedback: userFeedback?.rating
        });
        session.lastActivity = new Date();
        // Trim conversation history if too long
        if (session.context.conversationHistory.length > 50) {
            session.context.conversationHistory = session.context.conversationHistory.slice(-30);
        }
        // Manage short-term memory
        if (session.persistentData.conversationMemory.shortTerm.length > 100) {
            await this.consolidateMemory(session);
        }
        this.emit('agentInteractionRecorded', {
            sessionId,
            agentType,
            response: response.success,
            processingTime: response.processingTime
        });
    }
    async updateLearningProgress(sessionId, progressUpdate) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }
        const currentProgress = session.persistentData.learningProgress;
        Object.assign(currentProgress, progressUpdate);
        // Update context as well
        session.context.learningProgress = currentProgress;
        // Save to persistence
        await this.persistenceAdapter.saveUserData(session.userId, session.persistentData);
        this.emit('learningProgressUpdated', { sessionId, progressUpdate });
        return true;
    }
    async updateUserPreferences(sessionId, preferencesUpdate) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }
        const currentPreferences = session.persistentData.userPreferences;
        Object.assign(currentPreferences, preferencesUpdate);
        // Update context as well
        session.context.preferences = currentPreferences;
        // Save to persistence
        await this.persistenceAdapter.saveUserData(session.userId, session.persistentData);
        this.emit('userPreferencesUpdated', { sessionId, preferencesUpdate });
        return true;
    }
    async addAchievement(sessionId, achievement) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }
        const newAchievement = {
            ...achievement,
            earnedDate: new Date()
        };
        session.persistentData.achievements.push(newAchievement);
        // Save to persistence
        await this.persistenceAdapter.saveUserData(session.userId, session.persistentData);
        this.emit('achievementEarned', { sessionId, achievement: newAchievement });
        return true;
    }
    async endSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return false;
        }
        session.isActive = false;
        // Save final state to persistence
        await this.persistenceAdapter.saveUserData(session.userId, session.persistentData);
        // Create session summary
        const summary = await this.createSessionSummary(session);
        session.persistentData.conversationMemory.longTerm.push(summary);
        this.emit('sessionEnded', { sessionId, duration: Date.now() - session.startTime.getTime() });
        // Keep session in memory for a short while for analytics
        setTimeout(() => {
            this.sessions.delete(sessionId);
        }, 60000); // 1 minute
        return true;
    }
    getSessionMetrics(sessionId) {
        return this.sessionMetrics.getSessionMetrics(sessionId);
    }
    getAllActiveSessionIds() {
        return Array.from(this.sessions.keys()).filter(sessionId => {
            const session = this.sessions.get(sessionId);
            return session?.isActive;
        });
    }
    async exportSessionData(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            return null;
        }
        return {
            session: {
                id: session.id,
                userId: session.userId,
                userRole: session.userRole,
                startTime: session.startTime,
                lastActivity: session.lastActivity,
                isActive: session.isActive,
                metadata: session.metadata
            },
            context: session.context,
            persistentData: session.persistentData,
            metrics: this.sessionMetrics.getSessionMetrics(sessionId)
        };
    }
    // Private helper methods
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateConversationId() {
        return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    createDefaultPersistentData() {
        return {
            learningProgress: {
                currentLevel: 'beginner',
                completedTopics: [],
                inProgressTopics: [],
                strengths: [],
                improvementAreas: [],
                lastAssessmentScore: 0,
                totalStudyTime: 0,
                streakDays: 0,
                milestones: []
            },
            userPreferences: {
                learningStyle: 'mixed',
                difficulty: 'intermediate',
                pace: 'normal',
                contentTypes: ['text', 'interactive'],
                schedulingPreferences: {
                    preferredStudyTimes: ['09:00', '14:00'],
                    sessionDuration: 30,
                    breakFrequency: 25,
                    weeklyGoal: 5
                },
                notificationSettings: {
                    studyReminders: true,
                    achievementNotifications: true,
                    progressUpdates: true,
                    email: false,
                    push: true
                }
            },
            conversationMemory: {
                shortTerm: [],
                longTerm: [],
                topicHistory: [],
                importantMoments: []
            },
            agentInteractions: {
                agentUsage: new Map(),
                preferredAgents: [],
                agentEffectiveness: new Map(),
                collaborationPatterns: []
            },
            achievements: [],
            customData: {}
        };
    }
    analyzeSentiment(message, success) {
        // Simple sentiment analysis
        if (!success)
            return 'negative';
        const positiveWords = ['good', 'great', 'excellent', 'perfect', 'amazing', 'love', 'helpful'];
        const negativeWords = ['bad', 'terrible', 'awful', 'hate', 'confused', 'difficult', 'hard'];
        const lowerMessage = message.toLowerCase();
        const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length;
        const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length;
        if (positiveCount > negativeCount)
            return 'positive';
        if (negativeCount > positiveCount)
            return 'negative';
        return 'neutral';
    }
    calculateImportance(request, response, feedback) {
        let importance = 0.5; // Base importance
        // Higher importance for successful interactions
        if (response.success)
            importance += 0.2;
        // Higher importance for high confidence responses
        if (response.metadata.confidence > 0.8)
            importance += 0.2;
        // Higher importance if user provided positive feedback
        if (feedback?.rating > 4)
            importance += 0.3;
        // Higher importance for learning-critical interactions
        if (request.type === 'assessment' || request.type === 'explanation')
            importance += 0.2;
        return Math.min(importance, 1.0);
    }
    extractTags(request, response) {
        const tags = [];
        // Add agent type
        tags.push(response.agentType);
        // Add request type if available
        if (request.type)
            tags.push(request.type);
        // Add success/failure
        tags.push(response.success ? 'success' : 'failure');
        // Add confidence level
        if (response.metadata.confidence > 0.8)
            tags.push('high-confidence');
        else if (response.metadata.confidence < 0.5)
            tags.push('low-confidence');
        return tags;
    }
    updateAgentUsageStats(session, agentType, response, feedback) {
        const agentUsage = session.persistentData.agentInteractions.agentUsage;
        if (!agentUsage.has(agentType)) {
            agentUsage.set(agentType, {
                totalInteractions: 0,
                averageRating: 0,
                successRate: 0,
                avgResponseTime: 0,
                lastUsed: new Date(),
                preferredUseCase: []
            });
        }
        const stats = agentUsage.get(agentType);
        stats.totalInteractions++;
        stats.successRate = ((stats.successRate * (stats.totalInteractions - 1)) + (response.success ? 1 : 0)) / stats.totalInteractions;
        stats.avgResponseTime = ((stats.avgResponseTime * (stats.totalInteractions - 1)) + response.processingTime) / stats.totalInteractions;
        stats.lastUsed = new Date();
        if (feedback?.rating) {
            stats.averageRating = ((stats.averageRating * (stats.totalInteractions - 1)) + feedback.rating) / stats.totalInteractions;
        }
    }
    async consolidateMemory(session) {
        const memory = session.persistentData.conversationMemory;
        const oldEntries = memory.shortTerm.splice(0, 50); // Take oldest 50 entries
        // Group by day and topic
        const dailyGroups = new Map();
        oldEntries.forEach(entry => {
            const dateKey = entry.timestamp.toDateString();
            if (!dailyGroups.has(dateKey)) {
                dailyGroups.set(dateKey, []);
            }
            dailyGroups.get(dateKey).push(entry);
        });
        // Create summaries for each day
        for (const [date, entries] of dailyGroups.entries()) {
            const summary = {
                date: new Date(date),
                mainTopics: this.extractMainTopics(entries),
                keyInsights: this.extractKeyInsights(entries),
                userQuestions: this.extractUserQuestions(entries),
                resolutionStatus: this.determineResolutionStatus(entries),
                followUpNeeded: this.needsFollowUp(entries)
            };
            memory.longTerm.push(summary);
        }
        // Update topic history
        this.updateTopicHistory(session, oldEntries);
        // Identify important moments
        this.identifyImportantMoments(session, oldEntries);
    }
    extractMainTopics(entries) {
        // Simple topic extraction - in production, use NLP
        const topics = new Set();
        entries.forEach(entry => {
            entry.tags.forEach(tag => {
                if (!['success', 'failure', 'high-confidence', 'low-confidence'].includes(tag)) {
                    topics.add(tag);
                }
            });
        });
        return Array.from(topics);
    }
    extractKeyInsights(entries) {
        return entries
            .filter(entry => entry.importance > 0.7)
            .map(entry => `Key insight from ${entry.agentType} interaction`)
            .slice(0, 5);
    }
    extractUserQuestions(entries) {
        return entries
            .map(entry => entry.userMessage)
            .filter(message => message.includes('?'))
            .slice(0, 10);
    }
    determineResolutionStatus(entries) {
        const successRate = entries.filter(e => e.sentiment !== 'negative').length / entries.length;
        if (successRate > 0.8)
            return 'resolved';
        if (successRate > 0.5)
            return 'partial';
        return 'unresolved';
    }
    needsFollowUp(entries) {
        // Check if last few entries indicate ongoing confusion or unresolved issues
        const recentEntries = entries.slice(-3);
        return recentEntries.some(entry => entry.sentiment === 'negative' || entry.importance > 0.8);
    }
    updateTopicHistory(session, entries) {
        const topicHistory = session.persistentData.conversationMemory.topicHistory;
        const topicMap = new Map();
        // Group entries by topic
        entries.forEach(entry => {
            entry.tags.forEach(tag => {
                if (!topicMap.has(tag)) {
                    topicMap.set(tag, []);
                }
                topicMap.get(tag).push(entry);
            });
        });
        // Update or create topic history entries
        for (const [topic, topicEntries] of topicMap.entries()) {
            let topicRecord = topicHistory.find(t => t.topic === topic);
            if (!topicRecord) {
                topicRecord = {
                    topic,
                    firstEncounter: topicEntries[0].timestamp,
                    lastDiscussion: topicEntries[topicEntries.length - 1].timestamp,
                    masteryLevel: 0,
                    questionsAsked: 0,
                    misconceptions: [],
                    breakthroughMoments: []
                };
                topicHistory.push(topicRecord);
            }
            topicRecord.lastDiscussion = topicEntries[topicEntries.length - 1].timestamp;
            topicRecord.questionsAsked += topicEntries.filter(e => e.userMessage.includes('?')).length;
            // Update mastery level based on success rate
            const successRate = topicEntries.filter(e => e.sentiment !== 'negative').length / topicEntries.length;
            topicRecord.masteryLevel = Math.min(topicRecord.masteryLevel + (successRate * 0.1), 1.0);
            // Identify breakthrough moments
            const breakthroughs = topicEntries.filter(e => e.importance > 0.8 && e.sentiment === 'positive');
            topicRecord.breakthroughMoments.push(...breakthroughs.map(e => e.timestamp));
        }
    }
    identifyImportantMoments(session, entries) {
        const importantMoments = session.persistentData.conversationMemory.importantMoments;
        entries.forEach(entry => {
            if (entry.importance > 0.8) {
                let type = 'milestone';
                if (entry.sentiment === 'positive' && entry.importance > 0.9) {
                    type = 'breakthrough';
                }
                else if (entry.sentiment === 'negative') {
                    type = 'struggle';
                }
                else if (entry.tags.includes('assessment') && entry.sentiment === 'positive') {
                    type = 'achievement';
                }
                importantMoments.push({
                    timestamp: entry.timestamp,
                    type,
                    description: `Important ${type} in ${entry.agentType} interaction`,
                    context: {
                        agentType: entry.agentType,
                        userMessage: entry.userMessage,
                        tags: entry.tags
                    },
                    impact: entry.importance > 0.9 ? 'high' : 'medium'
                });
            }
        });
    }
    async createSessionSummary(session) {
        const recentEntries = session.persistentData.conversationMemory.shortTerm.slice(-20);
        return {
            date: new Date(),
            mainTopics: this.extractMainTopics(recentEntries),
            keyInsights: this.extractKeyInsights(recentEntries),
            userQuestions: this.extractUserQuestions(recentEntries),
            resolutionStatus: this.determineResolutionStatus(recentEntries),
            followUpNeeded: this.needsFollowUp(recentEntries)
        };
    }
    cleanupInactiveSessions() {
        const now = new Date();
        const inactivityThreshold = 60 * 60 * 1000; // 1 hour
        for (const [sessionId, session] of this.sessions.entries()) {
            if (!session.isActive && (now.getTime() - session.lastActivity.getTime()) > inactivityThreshold) {
                this.sessions.delete(sessionId);
                this.emit('sessionCleaned', { sessionId });
            }
        }
    }
}
exports.AdvancedSessionManager = AdvancedSessionManager;
// Memory-based persistence (for development/testing)
class MemoryPersistenceAdapter {
    constructor() {
        this.userData = new Map();
        this.sessionSnapshots = new Map();
    }
    async saveUserData(userId, data) {
        // Deep clone to avoid reference issues
        this.userData.set(userId, JSON.parse(JSON.stringify(data)));
    }
    async loadUserData(userId) {
        const data = this.userData.get(userId);
        return data ? JSON.parse(JSON.stringify(data)) : null;
    }
    async saveSessionSnapshot(sessionId, session) {
        this.sessionSnapshots.set(sessionId, JSON.parse(JSON.stringify(session)));
    }
    async loadSessionSnapshot(sessionId) {
        const session = this.sessionSnapshots.get(sessionId);
        return session ? JSON.parse(JSON.stringify(session)) : null;
    }
}
// Session Metrics Collector
class SessionMetricsCollector {
    constructor() {
        this.metrics = new Map();
    }
    recordInteraction(sessionId, interaction) {
        if (!this.metrics.has(sessionId)) {
            this.metrics.set(sessionId, {
                interactions: [],
                startTime: new Date(),
                totalInteractions: 0,
                successfulInteractions: 0,
                avgResponseTime: 0,
                agentUsage: new Map()
            });
        }
        const sessionMetrics = this.metrics.get(sessionId);
        sessionMetrics.interactions.push(interaction);
        sessionMetrics.totalInteractions++;
        if (interaction.success) {
            sessionMetrics.successfulInteractions++;
        }
        sessionMetrics.avgResponseTime =
            ((sessionMetrics.avgResponseTime * (sessionMetrics.totalInteractions - 1)) + interaction.responseTime) /
                sessionMetrics.totalInteractions;
        // Track agent usage
        const agentType = interaction.agentType;
        if (!sessionMetrics.agentUsage.has(agentType)) {
            sessionMetrics.agentUsage.set(agentType, 0);
        }
        sessionMetrics.agentUsage.set(agentType, sessionMetrics.agentUsage.get(agentType) + 1);
    }
    getSessionMetrics(sessionId) {
        return this.metrics.get(sessionId) || null;
    }
}
