import { LearningContext } from './advancedActions';

// Context providers for different data sources
export interface ContextProvider {
  id: string;
  name: string;
  getContext(userId: string): Promise<Partial<LearningContext>>;
  isAvailable(): boolean;
}

// Progress data provider
export class ProgressContextProvider implements ContextProvider {
  id = 'progress';
  name = 'Progress Data Provider';

  async getContext(userId: string): Promise<Partial<LearningContext>> {
    // In a real implementation, this would fetch from your progress tracking system
    return {
      progressData: {
        completedLessons: this.getCompletedLessons(userId),
        totalLessons: this.getTotalLessons(userId),
        weeklyGoal: this.getWeeklyGoal(userId),
        currentStreak: this.getCurrentStreak(userId)
      }
    };
  }

  isAvailable(): boolean {
    return true; // Check if progress tracking system is available
  }

  private getCompletedLessons(userId: string): number {
    // Mock implementation - replace with actual data fetching
    return Math.floor(Math.random() * 50) + 10;
  }

  private getTotalLessons(userId: string): number {
    // Mock implementation
    return 100;
  }

  private getWeeklyGoal(userId: string): number {
    // Mock implementation
    return 5;
  }

  private getCurrentStreak(userId: string): number {
    // Mock implementation
    return Math.floor(Math.random() * 14);
  }
}

// Assessment data provider
export class AssessmentContextProvider implements ContextProvider {
  id = 'assessment';
  name = 'Assessment Data Provider';

  async getContext(userId: string): Promise<Partial<LearningContext>> {
    return {
      assessmentHistory: {
        averageScore: this.getAverageScore(userId),
        weakAreas: this.getWeakAreas(userId),
        strongAreas: this.getStrongAreas(userId),
        lastAssessment: this.getLastAssessmentDate(userId)
      }
    };
  }

  isAvailable(): boolean {
    return true; // Check if assessment system is available
  }

  private getAverageScore(userId: string): number {
    // Mock implementation - replace with actual data fetching
    return Math.random() * 0.4 + 0.6; // 60-100%
  }

  private getWeakAreas(userId: string): string[] {
    const allAreas = ['grammar', 'vocabulary', 'pronunciation', 'listening', 'writing', 'reading'];
    const weakCount = Math.floor(Math.random() * 3) + 1;
    return allAreas.slice(0, weakCount);
  }

  private getStrongAreas(userId: string): string[] {
    const allAreas = ['grammar', 'vocabulary', 'pronunciation', 'listening', 'writing', 'reading'];
    const strongCount = Math.floor(Math.random() * 3) + 2;
    return allAreas.slice(-strongCount);
  }

  private getLastAssessmentDate(userId: string): Date {
    // Return date within last 14 days
    const daysAgo = Math.floor(Math.random() * 14);
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  }
}

// User preferences provider
export class PreferencesContextProvider implements ContextProvider {
  id = 'preferences';
  name = 'User Preferences Provider';

  async getContext(userId: string): Promise<Partial<LearningContext>> {
    return {
      preferences: {
        learningStyle: this.getLearningStyle(userId),
        studyTime: this.getPreferredStudyTime(userId),
        difficulty: this.getPreferredDifficulty(userId)
      }
    };
  }

  isAvailable(): boolean {
    return true; // Check if user preferences system is available
  }

  private getLearningStyle(userId: string): 'visual' | 'auditory' | 'kinesthetic' | 'mixed' {
    const styles: ('visual' | 'auditory' | 'kinesthetic' | 'mixed')[] = ['visual', 'auditory', 'kinesthetic', 'mixed'];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  private getPreferredStudyTime(userId: string): 'morning' | 'afternoon' | 'evening' | 'flexible' {
    const times: ('morning' | 'afternoon' | 'evening' | 'flexible')[] = ['morning', 'afternoon', 'evening', 'flexible'];
    return times[Math.floor(Math.random() * times.length)];
  }

  private getPreferredDifficulty(userId: string): 'adaptive' | 'challenging' | 'comfortable' {
    const difficulties: ('adaptive' | 'challenging' | 'comfortable')[] = ['adaptive', 'challenging', 'comfortable'];
    return difficulties[Math.floor(Math.random() * difficulties.length)];
  }
}

// Session tracking provider
export class SessionContextProvider implements ContextProvider {
  id = 'session';
  name = 'Current Session Provider';

  private sessionData: Map<string, any> = new Map();

  async getContext(userId: string): Promise<Partial<LearningContext>> {
    const sessionKey = `session_${userId}`;
    const session = this.sessionData.get(sessionKey) || this.initializeSession();
    
    return {
      currentSession: {
        timeSpent: session.timeSpent,
        topicsStudied: session.topicsStudied,
        actionsPerformed: session.actionsPerformed
      }
    };
  }

  isAvailable(): boolean {
    return true;
  }

  // Track user action in current session
  public trackAction(userId: string, action: string): void {
    const sessionKey = `session_${userId}`;
    const session = this.sessionData.get(sessionKey) || this.initializeSession();
    
    session.actionsPerformed.push(action);
    session.lastActivity = new Date();
    
    this.sessionData.set(sessionKey, session);
  }

  // Track time spent in session
  public trackTime(userId: string, minutes: number): void {
    const sessionKey = `session_${userId}`;
    const session = this.sessionData.get(sessionKey) || this.initializeSession();
    
    session.timeSpent += minutes;
    this.sessionData.set(sessionKey, session);
  }

  // Track topics studied
  public trackTopic(userId: string, topic: string): void {
    const sessionKey = `session_${userId}`;
    const session = this.sessionData.get(sessionKey) || this.initializeSession();
    
    if (!session.topicsStudied.includes(topic)) {
      session.topicsStudied.push(topic);
    }
    
    this.sessionData.set(sessionKey, session);
  }

  private initializeSession() {
    return {
      startTime: new Date(),
      timeSpent: 0,
      topicsStudied: [],
      actionsPerformed: [],
      lastActivity: new Date()
    };
  }
}

// Context aggregator and manager
export class ContextManager {
  private static instance: ContextManager;
  private providers: Map<string, ContextProvider> = new Map();
  private contextCache: Map<string, { context: LearningContext; timestamp: number }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  public static getInstance(): ContextManager {
    if (!ContextManager.instance) {
      ContextManager.instance = new ContextManager();
    }
    return ContextManager.instance;
  }

  // Register a context provider
  public registerProvider(provider: ContextProvider): void {
    this.providers.set(provider.id, provider);
  }

  // Get complete learning context for a user
  public async getContext(userId: string): Promise<LearningContext> {
    const cacheKey = `context_${userId}`;
    const cached = this.contextCache.get(cacheKey);
    
    // Return cached context if still valid
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.context;
    }

    // Build context from all available providers
    const context: Partial<LearningContext> = {
      userId,
      currentCEFRLevel: await this.getCurrentCEFRLevel(userId)
    };

    // Aggregate data from all providers
    for (const provider of Array.from(this.providers.values())) {
      if (provider.isAvailable()) {
        try {
          const providerContext = await provider.getContext(userId);
          Object.assign(context, providerContext);
        } catch (error) {
          console.warn(`Failed to get context from provider ${provider.id}:`, error);
        }
      }
    }

    // Ensure required fields have defaults
    const fullContext = this.ensureRequiredFields(context as LearningContext);

    // Cache the context
    this.contextCache.set(cacheKey, {
      context: fullContext,
      timestamp: Date.now()
    });

    return fullContext;
  }

  // Invalidate cached context for a user
  public invalidateContext(userId: string): void {
    const cacheKey = `context_${userId}`;
    this.contextCache.delete(cacheKey);
  }

  // Get context for specific aspects only
  public async getPartialContext(
    userId: string, 
    aspects: string[]
  ): Promise<Partial<LearningContext>> {
    const context: Partial<LearningContext> = { userId };

    for (const aspect of aspects) {
      const provider = this.providers.get(aspect);
      if (provider && provider.isAvailable()) {
        try {
          const providerContext = await provider.getContext(userId);
          Object.assign(context, providerContext);
        } catch (error) {
          console.warn(`Failed to get ${aspect} context:`, error);
        }
      }
    }

    return context;
  }

  // Update context with new data
  public async updateContext(
    userId: string, 
    updates: Partial<LearningContext>
  ): Promise<void> {
    // Update specific providers based on the update type
    if (updates.currentSession) {
      const sessionProvider = this.providers.get('session') as SessionContextProvider;
      if (sessionProvider) {
        // Update session data
        Object.entries(updates.currentSession).forEach(([key, value]) => {
          if (key === 'actionsPerformed' && Array.isArray(value)) {
            value.forEach(action => sessionProvider.trackAction(userId, action));
          }
        });
      }
    }

    // Invalidate cache to force refresh
    this.invalidateContext(userId);
  }

  // Real-time context monitoring
  public onContextChange(
    userId: string,
    callback: (context: LearningContext) => void
  ): () => void {
    // Set up real-time monitoring
    const interval = setInterval(async () => {
      try {
        const context = await this.getContext(userId);
        callback(context);
      } catch (error) {
        console.warn('Error in context monitoring:', error);
      }
    }, 30000); // Check every 30 seconds

    // Return cleanup function
    return () => clearInterval(interval);
  }

  private async getCurrentCEFRLevel(userId: string): Promise<string> {
    // Mock implementation - replace with actual data fetching
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    return levels[Math.floor(Math.random() * levels.length)];
  }

  private ensureRequiredFields(context: LearningContext): LearningContext {
    return {
      userId: context.userId,
      currentCEFRLevel: context.currentCEFRLevel || 'B1',
      progressData: context.progressData || {
        completedLessons: 0,
        totalLessons: 100,
        weeklyGoal: 5,
        currentStreak: 0
      },
      assessmentHistory: context.assessmentHistory || {
        averageScore: 0.75,
        weakAreas: [],
        strongAreas: [],
        lastAssessment: new Date()
      },
      preferences: context.preferences || {
        learningStyle: 'mixed',
        studyTime: 'flexible',
        difficulty: 'adaptive'
      },
      currentSession: context.currentSession || {
        timeSpent: 0,
        topicsStudied: [],
        actionsPerformed: []
      }
    };
  }
}

// Context-aware action filters
export class ContextFilters {
  // Filter for beginner-appropriate actions
  static beginnerFilter = (context: LearningContext): boolean => {
    return ['A1', 'A2'].includes(context.currentCEFRLevel);
  };

  // Filter for advanced learners
  static advancedFilter = (context: LearningContext): boolean => {
    return ['B2', 'C1', 'C2'].includes(context.currentCEFRLevel);
  };

  // Filter for users who need motivation
  static motivationFilter = (context: LearningContext): boolean => {
    return context.progressData.currentStreak === 0 || 
           context.assessmentHistory.averageScore < 0.6;
  };

  // Filter for high-performing users
  static highPerformerFilter = (context: LearningContext): boolean => {
    return context.assessmentHistory.averageScore > 0.85 && 
           context.progressData.currentStreak > 7;
  };

  // Filter for users with specific learning style
  static visualLearnerFilter = (context: LearningContext): boolean => {
    return context.preferences.learningStyle === 'visual';
  };

  // Filter for users in intensive study mode
  static intensiveStudyFilter = (context: LearningContext): boolean => {
    return context.currentSession.timeSpent > 45 ||
           context.currentSession.topicsStudied.length > 3;
  };

  // Filter for users with skill gaps
  static skillGapFilter = (context: LearningContext): boolean => {
    return context.assessmentHistory.weakAreas.length >= 2;
  };
}

// Export context manager instance and setup
export const contextManager = ContextManager.getInstance();

// Register default providers
contextManager.registerProvider(new ProgressContextProvider());
contextManager.registerProvider(new AssessmentContextProvider());
contextManager.registerProvider(new PreferencesContextProvider());
contextManager.registerProvider(new SessionContextProvider());

// Export session provider for direct access
export const sessionProvider = new SessionContextProvider();