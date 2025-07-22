import { ChatMessage } from '@/lib/contexts/ChatContext';

// Chat Memory Types
export interface ChatMemory {
  vocabulary: {
    word: string;
    meaning: string;
    usage: string;
    mastery: number; // 0-1
    lastUsed: Date;
  }[];
  grammarPatterns: {
    pattern: string;
    examples: string[];
    mastery: number;
    lastPracticed: Date;
  }[];
  mistakes: {
    error: string;
    correction: string;
    frequency: number;
    lastOccurrence: Date;
  }[];
  successes: {
    phrase: string;
    context: string;
    confidence: number;
    timestamp: Date;
  }[];
  topics: {
    topic: string;
    coverage: number; // 0-1
    lastDiscussed: Date;
    keyPoints: string[];
  }[];
}

export interface ConversationContext {
  sessionId: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  businessContext: string;
  learningGoals: string[];
  cefrLevel: string;
  memory: ChatMemory;
  performanceMetrics: {
    accuracy: number;
    fluency: number;
    vocabulary: number;
    grammar: number;
    appropriateness: number;
  };
  adaptations: {
    difficultyLevel: number;
    supportLevel: number;
    challengeLevel: number;
  };
}

// Multi-turn Conversation Manager
export class MultiTurnConversationManager {
  private contexts: Map<string, ConversationContext> = new Map();
  private conversationHistories: Map<string, ChatMessage[]> = new Map();

  // Initialize a new conversation context
  createContext(
    sessionId: string,
    userId: string,
    businessContext: string,
    learningGoals: string[],
    cefrLevel: string
  ): ConversationContext {
    const context: ConversationContext = {
      sessionId,
      userId,
      startTime: new Date(),
      businessContext,
      learningGoals,
      cefrLevel,
      memory: {
        vocabulary: [],
        grammarPatterns: [],
        mistakes: [],
        successes: [],
        topics: []
      },
      performanceMetrics: {
        accuracy: 0.7,
        fluency: 0.6,
        vocabulary: 0.5,
        grammar: 0.6,
        appropriateness: 0.7
      },
      adaptations: {
        difficultyLevel: 5,
        supportLevel: 5,
        challengeLevel: 5
      }
    };

    this.contexts.set(sessionId, context);
    this.conversationHistories.set(sessionId, []);
    return context;
  }

  // Get conversation context
  getContext(sessionId: string): ConversationContext | null {
    return this.contexts.get(sessionId) || null;
  }

  // Add message to conversation history
  addMessage(sessionId: string, message: ChatMessage): void {
    const history = this.conversationHistories.get(sessionId) || [];
    history.push(message);
    this.conversationHistories.set(sessionId, history);

    // Analyze message for learning insights
    if (message.role === 'user') {
      this.analyzeUserMessage(sessionId, message);
    }
  }

  // Analyze user message for learning patterns
  private analyzeUserMessage(sessionId: string, message: ChatMessage): void {
    const context = this.getContext(sessionId);
    if (!context) return;

    const content = message.content.toLowerCase();

    // Extract potential vocabulary
    const words = content.split(/\s+/).filter(word => word.length > 3);
    words.forEach(word => {
      const cleanWord = word.replace(/[^a-z]/gi, '');
      if (cleanWord.length > 3) {
        this.updateVocabularyUsage(context, cleanWord);
      }
    });

    // Analyze grammar patterns
    this.analyzeGrammarPatterns(context, content);

    // Update performance metrics based on message analysis
    this.updatePerformanceMetrics(context, message);
  }

  // Update vocabulary usage tracking
  private updateVocabularyUsage(context: ConversationContext, word: string): void {
    const existing = context.memory.vocabulary.find(v => v.word === word);
    if (existing) {
      existing.lastUsed = new Date();
      existing.mastery = Math.min(1, existing.mastery + 0.1);
    } else {
      context.memory.vocabulary.push({
        word,
        meaning: '', // Would be filled by AI analysis
        usage: '', // Would be filled by AI analysis
        mastery: 0.1,
        lastUsed: new Date()
      });
    }
  }

  // Analyze grammar patterns in user messages
  private analyzeGrammarPatterns(context: ConversationContext, content: string): void {
    // Simple pattern detection - would be more sophisticated in production
    const patterns = [
      { pattern: 'present_perfect', regex: /have\s+\w+ed|has\s+\w+ed/i },
      { pattern: 'conditional', regex: /if\s+.*would|could\s+.*if/i },
      { pattern: 'passive_voice', regex: /is\s+\w+ed|was\s+\w+ed|been\s+\w+ed/i },
      { pattern: 'modal_verbs', regex: /\b(can|could|may|might|must|should|would|will)\s+/i }
    ];

    patterns.forEach(({ pattern, regex }) => {
      if (regex.test(content)) {
        this.updateGrammarPattern(context, pattern, content.match(regex)?.[0] || '');
      }
    });
  }

  // Update grammar pattern usage
  private updateGrammarPattern(context: ConversationContext, pattern: string, example: string): void {
    const existing = context.memory.grammarPatterns.find(g => g.pattern === pattern);
    if (existing) {
      existing.lastPracticed = new Date();
      existing.mastery = Math.min(1, existing.mastery + 0.05);
      if (!existing.examples.includes(example)) {
        existing.examples.push(example);
      }
    } else {
      context.memory.grammarPatterns.push({
        pattern,
        examples: [example],
        mastery: 0.1,
        lastPracticed: new Date()
      });
    }
  }

  // Update performance metrics based on message analysis
  private updatePerformanceMetrics(context: ConversationContext, message: ChatMessage): void {
    // Simple heuristics - would use more sophisticated NLP in production
    const content = message.content;
    const wordCount = content.split(/\s+/).length;
    const complexity = this.calculateComplexity(content);
    
    // Update fluency based on message length and complexity
    const fluencyScore = Math.min(1, (wordCount / 20) * complexity);
    context.performanceMetrics.fluency = 
      (context.performanceMetrics.fluency * 0.8) + (fluencyScore * 0.2);

    // Update vocabulary based on unique words used
    const uniqueWords = new Set(content.toLowerCase().split(/\s+/));
    const vocabularyScore = Math.min(1, uniqueWords.size / 15);
    context.performanceMetrics.vocabulary = 
      (context.performanceMetrics.vocabulary * 0.8) + (vocabularyScore * 0.2);

    // Update appropriateness based on business language usage
    const businessTerms = ['meeting', 'project', 'deadline', 'team', 'client', 'budget'];
    const businessScore = businessTerms.filter(term => 
      content.toLowerCase().includes(term)
    ).length / businessTerms.length;
    context.performanceMetrics.appropriateness = 
      (context.performanceMetrics.appropriateness * 0.8) + (businessScore * 0.2);
  }

  // Calculate message complexity
  private calculateComplexity(content: string): number {
    const factors = [
      content.length > 50 ? 0.3 : 0.1, // Length factor
      /[,;:]/.test(content) ? 0.2 : 0, // Punctuation complexity
      /\b(however|therefore|consequently|nevertheless)\b/i.test(content) ? 0.3 : 0, // Linking words
      /\b(if|when|although|because|since)\b/i.test(content) ? 0.2 : 0 // Subordination
    ];
    
    return Math.min(1, factors.reduce((sum, factor) => sum + factor, 0));
  }

  // Generate conversation summary
  generateSummary(sessionId: string): {
    duration: number;
    messageCount: number;
    topicsDiscussed: string[];
    vocabularyLearned: string[];
    grammarPracticed: string[];
    performanceHighlights: string[];
    improvementAreas: string[];
  } | null {
    const context = this.getContext(sessionId);
    const history = this.conversationHistories.get(sessionId);
    
    if (!context || !history) return null;

    const duration = context.endTime 
      ? context.endTime.getTime() - context.startTime.getTime()
      : Date.now() - context.startTime.getTime();

    const userMessages = history.filter(m => m.role === 'user');
    
    return {
      duration: Math.round(duration / 60000), // minutes
      messageCount: userMessages.length,
      topicsDiscussed: context.memory.topics.map(t => t.topic),
      vocabularyLearned: context.memory.vocabulary
        .filter(v => v.mastery > 0.3)
        .map(v => v.word)
        .slice(0, 10),
      grammarPracticed: context.memory.grammarPatterns
        .filter(g => g.mastery > 0.2)
        .map(g => g.pattern),
      performanceHighlights: this.generatePerformanceHighlights(context),
      improvementAreas: this.generateImprovementAreas(context)
    };
  }

  // Generate performance highlights
  private generatePerformanceHighlights(context: ConversationContext): string[] {
    const highlights = [];
    const metrics = context.performanceMetrics;

    if (metrics.fluency > 0.7) {
      highlights.push('Excellent conversation flow and fluency');
    }
    if (metrics.vocabulary > 0.6) {
      highlights.push('Good use of varied vocabulary');
    }
    if (metrics.grammar > 0.7) {
      highlights.push('Strong grammar accuracy');
    }
    if (metrics.appropriateness > 0.8) {
      highlights.push('Professional and appropriate language use');
    }
    if (context.memory.grammarPatterns.length > 3) {
      highlights.push('Practiced multiple grammar structures');
    }

    return highlights;
  }

  // Generate improvement areas
  private generateImprovementAreas(context: ConversationContext): string[] {
    const areas = [];
    const metrics = context.performanceMetrics;

    if (metrics.fluency < 0.5) {
      areas.push('Work on conversation fluency and response length');
    }
    if (metrics.vocabulary < 0.4) {
      areas.push('Expand business vocabulary usage');
    }
    if (metrics.grammar < 0.6) {
      areas.push('Focus on grammar accuracy');
    }
    if (metrics.appropriateness < 0.6) {
      areas.push('Practice more formal business language');
    }
    if (context.memory.mistakes.length > 0) {
      const commonMistakes = context.memory.mistakes
        .filter(m => m.frequency > 1)
        .map(m => m.error);
      if (commonMistakes.length > 0) {
        areas.push(`Address recurring errors: ${commonMistakes.join(', ')}`);
      }
    }

    return areas;
  }

  // Clean up ended conversations
  endConversation(sessionId: string): void {
    const context = this.getContext(sessionId);
    if (context) {
      context.endTime = new Date();
      // Keep context for a while for analysis, but could clean up later
    }
  }

  // Get conversation insights for AI to use
  getConversationInsights(sessionId: string): {
    recentTopics: string[];
    strugglingAreas: string[];
    masteredPatterns: string[];
    suggestedFocus: string;
    encouragementLevel: number;
  } | null {
    const context = this.getContext(sessionId);
    if (!context) return null;

    const recentTopics = context.memory.topics
      .sort((a, b) => b.lastDiscussed.getTime() - a.lastDiscussed.getTime())
      .slice(0, 3)
      .map(t => t.topic);

    const strugglingAreas = context.memory.grammarPatterns
      .filter(g => g.mastery < 0.3)
      .map(g => g.pattern)
      .slice(0, 3);

    const masteredPatterns = context.memory.grammarPatterns
      .filter(g => g.mastery > 0.7)
      .map(g => g.pattern);

    // Suggest focus based on performance metrics
    const metrics = context.performanceMetrics;
    let suggestedFocus = 'general conversation';
    
    if (metrics.vocabulary < 0.4) {
      suggestedFocus = 'vocabulary building';
    } else if (metrics.grammar < 0.5) {
      suggestedFocus = 'grammar practice';
    } else if (metrics.fluency < 0.5) {
      suggestedFocus = 'conversation fluency';
    } else if (metrics.appropriateness < 0.6) {
      suggestedFocus = 'business communication';
    }

    // Calculate encouragement level based on recent performance
    const avgPerformance = Object.values(metrics).reduce((a, b) => a + b, 0) / Object.values(metrics).length;
    const encouragementLevel = Math.ceil(avgPerformance * 5);

    return {
      recentTopics,
      strugglingAreas,
      masteredPatterns,
      suggestedFocus,
      encouragementLevel
    };
  }
}

// Export singleton instance
export const multiTurnManager = new MultiTurnConversationManager();