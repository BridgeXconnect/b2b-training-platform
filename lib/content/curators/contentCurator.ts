import { 
  ContentGenerationContext, 
  GeneratedContent, 
  ContentRecommendation,
  CurationCriteria,
  ContentType,
  ContentLibrary,
  ContentAnalytics
} from '../types';

// Intelligent content curation and recommendation system
export class ContentCurator {
  private static instance: ContentCurator;
  private contentLibrary: Map<string, GeneratedContent> = new Map();
  private userInteractions: Map<string, ContentAnalytics[]> = new Map();
  private learningPatterns: Map<string, LearningPattern> = new Map();

  public static getInstance(): ContentCurator {
    if (!ContentCurator.instance) {
      ContentCurator.instance = new ContentCurator();
    }
    return ContentCurator.instance;
  }

  // Main content recommendation method
  public async recommendContent(
    context: ContentGenerationContext,
    criteria: CurationCriteria,
    limit: number = 5
  ): Promise<ContentRecommendation[]> {
    // Analyze user learning patterns
    const learningPattern = await this.analyzeLearningPattern(context);
    
    // Get candidate content
    const candidates = await this.getCandidateContent(context, criteria);
    
    // Score and rank content
    const scoredContent = await this.scoreContent(candidates, context, criteria, learningPattern);
    
    // Generate recommendations with reasoning
    const recommendations = this.generateRecommendations(scoredContent, context, limit);
    
    return recommendations;
  }

  // Personalized content curation based on learning history
  public async curatePersonalizedContent(
    context: ContentGenerationContext,
    sessionGoals: string[],
    timeAvailable: number
  ): Promise<ContentRecommendation[]> {
    const criteria: CurationCriteria = {
      learningObjectives: sessionGoals,
      timeConstraints: timeAvailable,
      reinforceWeakAreas: true,
      challengeLevel: this.determineOptimalChallengeLevel(context)
    };

    const learningPattern = await this.analyzeLearningPattern(context);
    const adaptiveCriteria = this.adaptCriteriaToPattern(criteria, learningPattern);
    
    return this.recommendContent(context, adaptiveCriteria, 8);
  }

  // Content sequencing for learning paths
  public async sequenceContent(
    contents: GeneratedContent[],
    context: ContentGenerationContext,
    learningObjectives: string[]
  ): Promise<SequencedContent[]> {
    const sequencingStrategy = this.selectSequencingStrategy(context, learningObjectives);
    const prerequisites = await this.identifyPrerequisites(contents, context);
    const difficulty_progression = this.createDifficultyProgression(contents, context);
    
    return this.applySequencingStrategy(contents, sequencingStrategy, prerequisites, difficulty_progression);
  }

  // Smart content filtering based on multiple criteria
  public async filterContent(
    contents: GeneratedContent[],
    filters: ContentFilters
  ): Promise<GeneratedContent[]> {
    let filteredContent = [...contents];

    // Apply CEFR level filter
    if (filters.cefrLevel) {
      filteredContent = filteredContent.filter(content => 
        content.metadata.cefrLevel === filters.cefrLevel ||
        this.isAppropriateLevel(content.metadata.cefrLevel, filters.cefrLevel!)
      );
    }

    // Apply content type filter
    if (filters.contentTypes?.length) {
      filteredContent = filteredContent.filter(content => 
        filters.contentTypes!.includes(content.type)
      );
    }

    // Apply duration filter
    if (filters.maxDuration) {
      filteredContent = filteredContent.filter(content => 
        content.metadata.estimatedDuration <= filters.maxDuration!
      );
    }

    // Apply business relevance filter
    if (filters.minBusinessRelevance) {
      filteredContent = filteredContent.filter(content => 
        content.metadata.businessRelevance >= filters.minBusinessRelevance!
      );
    }

    // Apply quality filter
    if (filters.minQuality) {
      filteredContent = filteredContent.filter(content => 
        content.metadata.qualityScore >= filters.minQuality!
      );
    }

    // Apply topic filter
    if (filters.requiredTopics?.length) {
      filteredContent = filteredContent.filter(content => 
        filters.requiredTopics!.some(topic => 
          content.metadata.topics.includes(topic)
        )
      );
    }

    // Apply skill filter
    if (filters.targetSkills?.length) {
      filteredContent = filteredContent.filter(content => 
        filters.targetSkills!.some(skill => 
          content.metadata.skills.includes(skill)
        )
      );
    }

    return filteredContent;
  }

  // Adaptive content difficulty adjustment
  public async adaptContentDifficulty(
    content: GeneratedContent,
    context: ContentGenerationContext,
    targetDifficulty: 'easier' | 'harder' | 'maintain'
  ): Promise<GeneratedContent> {
    if (targetDifficulty === 'maintain') {
      return content;
    }

    const adaptationStrategy = this.selectAdaptationStrategy(content, targetDifficulty);
    const adaptedContent = await this.applyAdaptation(content, adaptationStrategy, context);
    
    // Update metadata
    adaptedContent.metadata.generationSource = 'adaptive';
    adaptedContent.version = this.incrementVersion(content.version);
    adaptedContent.generationTimestamp = new Date();
    
    return adaptedContent;
  }

  // Content gap analysis
  public async analyzeContentGaps(
    context: ContentGenerationContext,
    existingContent: GeneratedContent[],
    learningObjectives: string[]
  ): Promise<ContentGapAnalysis> {
    const coverage = this.analyzeCoverage(existingContent, learningObjectives);
    const difficultyGaps = this.identifyDifficultyGaps(existingContent, context);
    const skillGaps = this.identifySkillGaps(existingContent, context);
    const topicGaps = this.identifyTopicGaps(existingContent, learningObjectives);
    
    return {
      overallCoverage: coverage.overall,
      objectiveCoverage: coverage.byObjective,
      missingDifficulties: difficultyGaps,
      underrepresentedSkills: skillGaps,
      missingTopics: topicGaps,
      recommendations: this.generateGapRecommendations(coverage, difficultyGaps, skillGaps, topicGaps)
    };
  }

  // Content performance analytics
  public async analyzeContentPerformance(
    contentId: string,
    timeframe: 'week' | 'month' | 'quarter'
  ): Promise<ContentPerformanceAnalysis> {
    const analytics = await this.getContentAnalytics(contentId, timeframe);
    const performance = this.calculatePerformanceMetrics(analytics);
    const insights = this.generatePerformanceInsights(performance);
    
    return {
      contentId,
      timeframe,
      metrics: performance,
      insights,
      recommendations: this.generatePerformanceRecommendations(performance, insights)
    };
  }

  // Learning pattern analysis
  private async analyzeLearningPattern(context: ContentGenerationContext): Promise<LearningPattern> {
    const existingPattern = this.learningPatterns.get(context.userId);
    
    if (existingPattern && this.isPatternCurrent(existingPattern)) {
      return existingPattern;
    }

    const pattern: LearningPattern = {
      userId: context.userId,
      preferredContentTypes: this.analyzeContentTypePreferences(context),
      optimalSessionLength: this.analyzeSessionLengthPreference(context),
      difficultyProgression: this.analyzeDifficultyPreference(context),
      engagementFactors: this.analyzeEngagementFactors(context),
      weaknessPatterns: this.analyzeWeaknessPatterns(context),
      strengthAreas: context.strongAreas,
      learningStyle: this.inferLearningStyle(context),
      motivationFactors: this.analyzeMotivationFactors(context),
      lastUpdated: new Date()
    };

    this.learningPatterns.set(context.userId, pattern);
    return pattern;
  }

  // Get candidate content for recommendation
  private async getCandidateContent(
    context: ContentGenerationContext,
    criteria: CurationCriteria
  ): Promise<GeneratedContent[]> {
    let candidates: GeneratedContent[] = Array.from(this.contentLibrary.values());

    // Filter by basic criteria
    candidates = candidates.filter(content => {
      // CEFR level appropriateness
      if (!this.isAppropriateLevel(content.metadata.cefrLevel, context.cefrLevel)) {
        return false;
      }

      // Time constraints
      if (criteria.timeConstraints && content.metadata.estimatedDuration > criteria.timeConstraints) {
        return false;
      }

      // Preferred types
      if (criteria.preferredTypes?.length && !criteria.preferredTypes.includes(content.type)) {
        return false;
      }

      // Avoid topics
      if (criteria.avoidTopics?.length && 
          criteria.avoidTopics.some(topic => content.metadata.topics.includes(topic))) {
        return false;
      }

      return true;
    });

    // If reinforcing weak areas, prioritize relevant content
    if (criteria.reinforceWeakAreas) {
      candidates = candidates.filter(content => 
        context.weakAreas.some(weakness => 
          content.metadata.topics.includes(weakness) ||
          content.metadata.skills.includes(weakness)
        )
      );
    }

    return candidates;
  }

  // Score content based on multiple factors
  private async scoreContent(
    candidates: GeneratedContent[],
    context: ContentGenerationContext,
    criteria: CurationCriteria,
    pattern: LearningPattern
  ): Promise<ScoredContent[]> {
    const scoredContent: ScoredContent[] = [];

    for (const content of candidates) {
      const score = await this.calculateContentScore(content, context, criteria, pattern);
      scoredContent.push({
        content,
        score: score.total,
        scoreBreakdown: score.breakdown,
        reasoning: score.reasoning
      });
    }

    return scoredContent.sort((a, b) => b.score - a.score);
  }

  // Calculate comprehensive content score
  private async calculateContentScore(
    content: GeneratedContent,
    context: ContentGenerationContext,
    criteria: CurationCriteria,
    pattern: LearningPattern
  ): Promise<ContentScore> {
    const scores = {
      relevance: this.calculateRelevanceScore(content, context, criteria),
      difficulty: this.calculateDifficultyScore(content, context, criteria),
      engagement: this.calculateEngagementScore(content, pattern),
      quality: content.metadata.qualityScore,
      freshness: this.calculateFreshnessScore(content),
      personalization: this.calculatePersonalizationScore(content, pattern),
      businessRelevance: content.metadata.businessRelevance,
      completeness: this.calculateCompletenessScore(content, criteria)
    };

    const weights = {
      relevance: 0.25,
      difficulty: 0.20,
      engagement: 0.15,
      quality: 0.15,
      freshness: 0.05,
      personalization: 0.10,
      businessRelevance: 0.05,
      completeness: 0.05
    };

    const total = Object.entries(scores).reduce((sum, [key, score]) => {
      return sum + (score * weights[key as keyof typeof weights]);
    }, 0);

    return {
      total,
      breakdown: scores,
      reasoning: this.generateScoreReasoning(scores, weights)
    };
  }

  // Generate recommendations with detailed reasoning
  private generateRecommendations(
    scoredContent: ScoredContent[],
    context: ContentGenerationContext,
    limit: number
  ): ContentRecommendation[] {
    return scoredContent.slice(0, limit).map((scored, index) => ({
      content: scored.content,
      relevanceScore: scored.score,
      reasoning: this.generateRecommendationReasoning(scored, context, index + 1),
      adaptationSuggestions: this.generateAdaptationSuggestions(scored.content, context),
      nextRecommendations: this.generateNextStepSuggestions(scored.content, context)
    }));
  }

  // Helper methods for scoring
  private calculateRelevanceScore(
    content: GeneratedContent,
    context: ContentGenerationContext,
    criteria: CurationCriteria
  ): number {
    let score = 0;

    // Learning objectives alignment
    const objectiveAlignment = criteria.learningObjectives.filter(objective =>
      content.metadata.topics.some(topic => 
        topic.toLowerCase().includes(objective.toLowerCase()) ||
        objective.toLowerCase().includes(topic.toLowerCase())
      )
    ).length / criteria.learningObjectives.length;
    score += objectiveAlignment * 0.4;

    // Weak areas coverage
    const weakAreaCoverage = context.weakAreas.filter(area =>
      content.metadata.topics.includes(area) || content.metadata.skills.includes(area)
    ).length / Math.max(context.weakAreas.length, 1);
    score += weakAreaCoverage * 0.3;

    // Business domain relevance
    const domainRelevance = content.metadata.topics.some(topic =>
      topic.toLowerCase().includes(context.businessDomain.toLowerCase())
    ) ? 1 : 0.5;
    score += domainRelevance * 0.3;

    return Math.min(score, 1);
  }

  private calculateDifficultyScore(
    content: GeneratedContent,
    context: ContentGenerationContext,
    criteria: CurationCriteria
  ): number {
    const userLevel = this.mapCEFRToNumeric(context.cefrLevel);
    const contentLevel = this.mapCEFRToNumeric(content.metadata.cefrLevel);
    
    let targetLevel = userLevel;
    
    if (criteria.challengeLevel === 'increase') {
      targetLevel = Math.min(userLevel + 1, 6);
    } else if (criteria.challengeLevel === 'decrease') {
      targetLevel = Math.max(userLevel - 1, 1);
    }

    const difference = Math.abs(contentLevel - targetLevel);
    return Math.max(0, 1 - (difference * 0.3));
  }

  private calculateEngagementScore(content: GeneratedContent, pattern: LearningPattern): number {
    let score = content.metadata.engagementPrediction;

    // Preferred content types boost
    if (pattern.preferredContentTypes.includes(content.type)) {
      score += 0.2;
    }

    // Optimal duration alignment
    const durationDiff = Math.abs(content.metadata.estimatedDuration - pattern.optimalSessionLength);
    const durationScore = Math.max(0, 1 - (durationDiff / pattern.optimalSessionLength));
    score += durationScore * 0.1;

    return Math.min(score, 1);
  }

  private calculatePersonalizationScore(content: GeneratedContent, pattern: LearningPattern): number {
    let score = 0;

    // Learning style alignment
    if (this.alignsWithLearningStyle(content, pattern.learningStyle)) {
      score += 0.4;
    }

    // Motivation factors
    const motivationAlignment = pattern.motivationFactors.filter(factor =>
      this.contentSupportsMotivation(content, factor)
    ).length / pattern.motivationFactors.length;
    score += motivationAlignment * 0.3;

    // Strength area reinforcement
    const strengthAlignment = pattern.strengthAreas.filter(strength =>
      content.metadata.skills.includes(strength) || content.metadata.topics.includes(strength)
    ).length / Math.max(pattern.strengthAreas.length, 1);
    score += strengthAlignment * 0.3;

    return Math.min(score, 1);
  }

  private calculateFreshnessScore(content: GeneratedContent): number {
    const daysSinceGeneration = (Date.now() - content.generationTimestamp.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - (daysSinceGeneration / 30)); // Decay over 30 days
  }

  private calculateCompletenessScore(content: GeneratedContent, criteria: CurationCriteria): number {
    let score = 0;

    // Has sufficient content sections
    score += Math.min(content.content.length / 4, 1) * 0.3;

    // Has examples
    const hasExamples = content.content.some(section => section.examples?.length);
    score += hasExamples ? 0.2 : 0;

    // Has exercises
    const hasExercises = content.content.some(section => section.exercises?.length);
    score += hasExercises ? 0.3 : 0;

    // Has vocabulary
    const hasVocabulary = content.content.some(section => section.vocabularyItems?.length);
    score += hasVocabulary ? 0.2 : 0;

    return score;
  }

  // Content analysis helper methods
  private analyzeContentTypePreferences(context: ContentGenerationContext): ContentType[] {
    // Mock implementation - analyze user interaction history
    return ['lesson', 'quiz', 'vocabulary', 'dialogue'];
  }

  private analyzeSessionLengthPreference(context: ContentGenerationContext): number {
    // Mock implementation - analyze completion patterns
    return 25; // minutes
  }

  private analyzeDifficultyPreference(context: ContentGenerationContext): 'maintain' | 'increase' | 'decrease' {
    // Mock implementation - analyze performance trends
    return context.progressMetrics.averageScore > 0.8 ? 'increase' : 'maintain';
  }

  private analyzeEngagementFactors(context: ContentGenerationContext): string[] {
    return ['interactive-exercises', 'real-world-examples', 'business-scenarios'];
  }

  private analyzeWeaknessPatterns(context: ContentGenerationContext): string[] {
    return context.weakAreas;
  }

  private inferLearningStyle(context: ContentGenerationContext): string {
    // Mock implementation - would analyze user behavior patterns
    return 'mixed';
  }

  private analyzeMotivationFactors(context: ContentGenerationContext): string[] {
    return ['career-advancement', 'practical-application', 'skill-improvement'];
  }

  // Utility methods
  private isPatternCurrent(pattern: LearningPattern): boolean {
    const daysSinceUpdate = (Date.now() - pattern.lastUpdated.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate < 7; // Pattern valid for 7 days
  }

  private isAppropriateLevel(contentLevel: string, userLevel: string): boolean {
    const contentNum = this.mapCEFRToNumeric(contentLevel);
    const userNum = this.mapCEFRToNumeric(userLevel);
    return Math.abs(contentNum - userNum) <= 1; // Within one level
  }

  private mapCEFRToNumeric(level: string): number {
    const mapping = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6 };
    return mapping[level as keyof typeof mapping] || 3;
  }

  private determineOptimalChallengeLevel(context: ContentGenerationContext): 'maintain' | 'increase' | 'decrease' {
    if (context.progressMetrics.averageScore > 0.85) return 'increase';
    if (context.progressMetrics.averageScore < 0.65) return 'decrease';
    return 'maintain';
  }

  private adaptCriteriaToPattern(criteria: CurationCriteria, pattern: LearningPattern): CurationCriteria {
    return {
      ...criteria,
      preferredTypes: pattern.preferredContentTypes.slice(0, 3),
      timeConstraints: Math.min(criteria.timeConstraints || 60, pattern.optimalSessionLength + 10)
    };
  }

  private generateRecommendationReasoning(scored: ScoredContent, context: ContentGenerationContext, rank: number): string {
    const reasons = [];
    
    if (scored.scoreBreakdown.relevance > 0.8) {
      reasons.push(`highly relevant to your learning objectives`);
    }
    
    if (scored.scoreBreakdown.difficulty > 0.8) {
      reasons.push(`appropriate difficulty level for ${context.cefrLevel}`);
    }
    
    if (scored.scoreBreakdown.engagement > 0.8) {
      reasons.push(`matches your preferred learning style`);
    }
    
    if (scored.scoreBreakdown.businessRelevance > 0.8) {
      reasons.push(`directly applicable to ${context.businessDomain}`);
    }

    return `Recommended #${rank} because it is ${reasons.join(', ')}.`;
  }

  private generateAdaptationSuggestions(content: GeneratedContent, context: ContentGenerationContext): string[] {
    const suggestions = [];
    
    if (context.weakAreas.includes('speaking') && !content.metadata.skills.includes('speaking')) {
      suggestions.push('Add speaking practice exercises');
    }
    
    if (context.progressMetrics.averageScore > 0.85) {
      suggestions.push('Increase difficulty level for more challenge');
    }
    
    return suggestions;
  }

  private generateNextStepSuggestions(content: GeneratedContent, context: ContentGenerationContext): string[] {
    return [
      `Practice ${content.metadata.topics[0]} in real workplace situations`,
      `Take an assessment to measure progress`,
      `Explore advanced ${content.type} content`
    ];
  }

  private generateScoreReasoning(scores: any, weights: any): string {
    const topFactors = Object.entries(scores)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([factor, score]) => `${factor}: ${(score as number).toFixed(2)}`);
    
    return `Score based on: ${topFactors.join(', ')}`;
  }

  // Placeholder methods for complex operations
  private selectSequencingStrategy(context: ContentGenerationContext, objectives: string[]): string {
    return 'difficulty-progressive';
  }

  private async identifyPrerequisites(contents: GeneratedContent[], context: ContentGenerationContext): Promise<Map<string, string[]>> {
    return new Map();
  }

  private createDifficultyProgression(contents: GeneratedContent[], context: ContentGenerationContext): GeneratedContent[] {
    return contents.sort((a, b) => 
      this.mapCEFRToNumeric(a.metadata.cefrLevel) - this.mapCEFRToNumeric(b.metadata.cefrLevel)
    );
  }

  private applySequencingStrategy(
    contents: GeneratedContent[], 
    strategy: string, 
    prerequisites: Map<string, string[]>, 
    progression: GeneratedContent[]
  ): SequencedContent[] {
    return progression.map((content, index) => ({
      content,
      sequence: index + 1,
      prerequisites: prerequisites.get(content.id) || [],
      estimatedPosition: index + 1
    }));
  }

  private selectAdaptationStrategy(content: GeneratedContent, direction: 'easier' | 'harder'): string {
    return direction === 'easier' ? 'simplify-language' : 'add-complexity';
  }

  private async applyAdaptation(
    content: GeneratedContent, 
    strategy: string, 
    context: ContentGenerationContext
  ): Promise<GeneratedContent> {
    // Mock implementation - would apply actual adaptations
    return { ...content };
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    parts[parts.length - 1] = String(parseInt(parts[parts.length - 1]) + 1);
    return parts.join('.');
  }

  private analyzeCoverage(contents: GeneratedContent[], objectives: string[]): any {
    return {
      overall: contents.length / Math.max(objectives.length, 1),
      byObjective: objectives.map(obj => ({
        objective: obj,
        coverage: contents.filter(c => c.metadata.topics.includes(obj)).length
      }))
    };
  }

  private identifyDifficultyGaps(contents: GeneratedContent[], context: ContentGenerationContext): string[] {
    return [];
  }

  private identifySkillGaps(contents: GeneratedContent[], context: ContentGenerationContext): string[] {
    return [];
  }

  private identifyTopicGaps(contents: GeneratedContent[], objectives: string[]): string[] {
    return [];
  }

  private generateGapRecommendations(coverage: any, difficultyGaps: string[], skillGaps: string[], topicGaps: string[]): string[] {
    return ['Generate more content for identified gaps'];
  }

  private async getContentAnalytics(contentId: string, timeframe: string): Promise<ContentAnalytics[]> {
    return [];
  }

  private calculatePerformanceMetrics(analytics: ContentAnalytics[]): any {
    return {};
  }

  private generatePerformanceInsights(performance: any): string[] {
    return [];
  }

  private generatePerformanceRecommendations(performance: any, insights: string[]): string[] {
    return [];
  }

  private alignsWithLearningStyle(content: GeneratedContent, style: string): boolean {
    return true; // Mock implementation
  }

  private contentSupportsMotivation(content: GeneratedContent, factor: string): boolean {
    return true; // Mock implementation
  }
}

// Additional interfaces
interface LearningPattern {
  userId: string;
  preferredContentTypes: ContentType[];
  optimalSessionLength: number;
  difficultyProgression: 'maintain' | 'increase' | 'decrease';
  engagementFactors: string[];
  weaknessPatterns: string[];
  strengthAreas: string[];
  learningStyle: string;
  motivationFactors: string[];
  lastUpdated: Date;
}

interface ScoredContent {
  content: GeneratedContent;
  score: number;
  scoreBreakdown: any;
  reasoning: string;
}

interface ContentScore {
  total: number;
  breakdown: any;
  reasoning: string;
}

interface ContentFilters {
  cefrLevel?: string;
  contentTypes?: ContentType[];
  maxDuration?: number;
  minBusinessRelevance?: number;
  minQuality?: number;
  requiredTopics?: string[];
  targetSkills?: string[];
}

interface SequencedContent {
  content: GeneratedContent;
  sequence: number;
  prerequisites: string[];
  estimatedPosition: number;
}

interface ContentGapAnalysis {
  overallCoverage: number;
  objectiveCoverage: any[];
  missingDifficulties: string[];
  underrepresentedSkills: string[];
  missingTopics: string[];
  recommendations: string[];
}

interface ContentPerformanceAnalysis {
  contentId: string;
  timeframe: string;
  metrics: any;
  insights: string[];
  recommendations: string[];
}

// Export singleton instance
export const contentCurator = ContentCurator.getInstance();