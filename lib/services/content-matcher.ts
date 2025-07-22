// Content Similarity and Matching Algorithms
// Task 2: Build Intelligent Content Recommendation Engine

import {
  ContentItem,
  ContentSimilarityMatrix,
  ContentFeatures,
  MatchingAlgorithm,
  HybridRecommendationStrategy,
  RecommendationRule,
  RecommendationContext,
  RecommendationScore,
  RecommendationReasoning,
  PersonalizationFactors
} from './recommendation-engine';
import { ContentType, DifficultyLevel } from '../content/types';
import { CEFRLevel } from '../types/user';

export class ContentSimilarityEngine {
  private readonly FEATURE_WEIGHTS = {
    semantic: 0.3,
    difficulty: 0.2,
    skills: 0.25,
    businessRelevance: 0.15,
    engagement: 0.1
  };

  private readonly SIMILARITY_THRESHOLD = 0.3; // Minimum similarity for recommendations

  /**
   * Calculate similarity between two content items
   */
  async calculateContentSimilarity(content1: ContentItem, content2: ContentItem): Promise<number> {
    const features1 = await this.extractContentFeatures(content1);
    const features2 = await this.extractContentFeatures(content2);

    const semanticSim = this.calculateSemanticSimilarity(features1, features2);
    const difficultySim = this.calculateDifficultySimilarity(features1, features2);
    const skillsSim = this.calculateSkillsSimilarity(features1, features2);
    const businessSim = this.calculateBusinessSimilarity(features1, features2);
    const engagementSim = this.calculateEngagementSimilarity(features1, features2);

    const weightedSimilarity = 
      semanticSim * this.FEATURE_WEIGHTS.semantic +
      difficultySim * this.FEATURE_WEIGHTS.difficulty +
      skillsSim * this.FEATURE_WEIGHTS.skills +
      businessSim * this.FEATURE_WEIGHTS.businessRelevance +
      engagementSim * this.FEATURE_WEIGHTS.engagement;

    return Math.round(weightedSimilarity * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Build similarity matrix for a set of content items
   */
  async buildSimilarityMatrix(contents: ContentItem[]): Promise<ContentSimilarityMatrix> {
    const matrix: ContentSimilarityMatrix = {};

    for (let i = 0; i < contents.length; i++) {
      const content1 = contents[i];
      matrix[content1.id] = {};

      for (let j = 0; j < contents.length; j++) {
        const content2 = contents[j];
        
        if (i === j) {
          matrix[content1.id][content2.id] = 1.0; // Perfect similarity with self
        } else if (matrix[content2.id] && matrix[content2.id][content1.id] !== undefined) {
          // Use already calculated similarity (symmetric)
          matrix[content1.id][content2.id] = matrix[content2.id][content1.id];
        } else {
          matrix[content1.id][content2.id] = await this.calculateContentSimilarity(content1, content2);
        }
      }
    }

    return matrix;
  }

  /**
   * Extract comprehensive features from content item
   */
  async extractContentFeatures(content: ContentItem): Promise<ContentFeatures> {
    // Generate semantic vector from content title and topics
    const semanticVector = this.generateSemanticVector(content);
    
    // Extract difficulty features
    const difficultyFeatures = this.extractDifficultyFeatures(content);
    
    // Map skill coverage
    const skillCoverage = this.mapSkillCoverage(content);
    
    // Calculate business relevance score
    const businessRelevance = this.calculateBusinessRelevance(content);
    
    // Extract engagement factors
    const engagementFactors = this.extractEngagementFactors(content);
    
    // Extract learning objectives
    const learningObjectives = this.extractLearningObjectives(content);
    
    // Identify prerequisites
    const prerequisites = this.identifyPrerequisites(content);

    return {
      contentId: content.id,
      semanticVector,
      difficultyFeatures,
      skillCoverage,
      businessRelevance,
      engagementFactors,
      learningObjectives,
      prerequisites
    };
  }

  /**
   * Generate similar content recommendations
   */
  async findSimilarContent(
    targetContent: ContentItem,
    candidateContents: ContentItem[],
    maxRecommendations: number = 5
  ): Promise<Array<{ content: ContentItem; similarity: number }>> {
    const similarities: Array<{ content: ContentItem; similarity: number }> = [];

    for (const candidate of candidateContents) {
      if (candidate.id === targetContent.id) continue;

      const similarity = await this.calculateContentSimilarity(targetContent, candidate);
      if (similarity >= this.SIMILARITY_THRESHOLD) {
        similarities.push({ content: candidate, similarity });
      }
    }

    // Sort by similarity (descending) and return top recommendations
    return similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxRecommendations);
  }

  // Private helper methods for similarity calculations

  private generateSemanticVector(content: ContentItem): number[] {
    // This is a simplified semantic vector generation
    // In a real implementation, you would use embeddings from a language model
    const titleWords = content.title.toLowerCase().split(' ');
    const allTopics = content.topics.join(' ').toLowerCase().split(' ');
    const allWords = [...titleWords, ...allTopics];

    // Create a simple bag-of-words vector with predefined vocabulary
    const vocabulary = this.getSemanticVocabulary();
    const vector = new Array(vocabulary.length).fill(0);

    allWords.forEach(word => {
      const index = vocabulary.indexOf(word);
      if (index !== -1) {
        vector[index]++;
      }
    });

    // Normalize the vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return magnitude > 0 ? vector.map(val => val / magnitude) : vector;
  }

  private getSemanticVocabulary(): string[] {
    return [
      'business', 'communication', 'grammar', 'vocabulary', 'speaking', 'writing',
      'reading', 'listening', 'conversation', 'presentation', 'meeting', 'email',
      'negotiation', 'interview', 'report', 'management', 'leadership', 'teamwork',
      'customer', 'service', 'sales', 'marketing', 'finance', 'technology', 'project',
      'beginner', 'intermediate', 'advanced', 'professional', 'formal', 'informal',
      'practice', 'exercise', 'dialogue', 'roleplay', 'case', 'study', 'scenario'
    ];
  }

  private extractDifficultyFeatures(content: ContentItem): number[] {
    const difficultyMap: Record<DifficultyLevel, number> = {
      'beginner': 1,
      'elementary': 2,
      'intermediate': 3,
      'upper-intermediate': 4,
      'advanced': 5,
      'proficient': 6
    };

    const cefrMap: Record<CEFRLevel, number> = {
      'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6
    };

    return [
      difficultyMap[content.difficulty],
      cefrMap[content.cefrLevel],
      content.duration / 60, // Convert minutes to hours
      content.skills.length
    ];
  }

  private mapSkillCoverage(content: ContentItem): Record<string, number> {
    const skillMap: Record<string, number> = {};
    const allSkills = [
      'grammar', 'vocabulary', 'speaking', 'writing', 'reading', 'listening',
      'pronunciation', 'conversation', 'presentation', 'business-communication',
      'email-writing', 'report-writing', 'meeting-participation', 'negotiation',
      'customer-service', 'sales', 'marketing', 'finance', 'leadership'
    ];

    allSkills.forEach(skill => {
      skillMap[skill] = content.skills.includes(skill) ? 1.0 : 0.0;
    });

    return skillMap;
  }

  private calculateBusinessRelevance(content: ContentItem): number {
    const businessTopics = [
      'business', 'professional', 'corporate', 'management', 'leadership',
      'meeting', 'presentation', 'negotiation', 'sales', 'marketing',
      'finance', 'customer', 'service', 'project', 'team'
    ];

    const titleWords = content.title.toLowerCase().split(' ');
    const topicWords = content.topics.join(' ').toLowerCase().split(' ');
    const allWords = [...titleWords, ...topicWords];

    const businessWordCount = allWords.filter(word => 
      businessTopics.some(topic => word.includes(topic))
    ).length;

    const relevanceScore = Math.min(businessWordCount / 3, 1.0);
    return content.businessContext ? Math.min(relevanceScore + 0.3, 1.0) : relevanceScore;
  }

  private extractEngagementFactors(content: ContentItem): number[] {
    const metrics = content.engagementMetrics;
    
    if (!metrics) {
      // Default values if no metrics available
      return [0.7, 0.8, 30, 3.5]; // rating, completion, time, feedback
    }

    return [
      metrics.averageRating / 5, // Normalize to 0-1
      metrics.completionRate,
      Math.min(metrics.timeSpent / 60, 1), // Normalize time spent
      metrics.userFeedback / 5 // Normalize feedback
    ];
  }

  private extractLearningObjectives(content: ContentItem): string[] {
    // Extract learning objectives based on content type and skills
    const objectives: string[] = [];

    if (content.type === 'lesson') {
      objectives.push(`Master ${content.skills.join(', ')} concepts`);
    } else if (content.type === 'quiz') {
      objectives.push(`Assess ${content.skills.join(', ')} knowledge`);
    } else if (content.type === 'vocabulary') {
      objectives.push('Expand vocabulary knowledge');
    } else if (content.type === 'dialogue') {
      objectives.push('Improve conversational skills');
    } else if (content.type === 'business-case') {
      objectives.push('Apply business English in real scenarios');
    } else if (content.type === 'roleplay') {
      objectives.push('Practice interactive communication');
    }

    return objectives;
  }

  private identifyPrerequisites(content: ContentItem): string[] {
    const prerequisites: string[] = [];
    
    // Basic prerequisites based on difficulty and CEFR level
    const difficultyPrereqs: Record<DifficultyLevel, string[]> = {
      'beginner': [],
      'elementary': ['Basic vocabulary', 'Simple phrases'],
      'intermediate': ['Basic grammar understanding', 'Essential vocabulary'],
      'upper-intermediate': ['Intermediate grammar', 'Extended vocabulary'],
      'advanced': ['Advanced grammar structures', 'Complex vocabulary'],
      'proficient': ['Near-native comprehension', 'Advanced linguistic structures']
    };

    const cefrPrereqs: Record<CEFRLevel, string[]> = {
      'A1': [],
      'A2': ['A1 level completion'],
      'B1': ['A2 level completion', 'Basic conversational ability'],
      'B2': ['B1 level completion', 'Intermediate writing skills'],
      'C1': ['B2 level completion', 'Advanced comprehension'],
      'C2': ['C1 level completion', 'Near-native proficiency']
    };

    prerequisites.push(...difficultyPrereqs[content.difficulty]);
    prerequisites.push(...cefrPrereqs[content.cefrLevel]);

    return Array.from(new Set(prerequisites)); // Remove duplicates
  }

  // Similarity calculation methods

  private calculateSemanticSimilarity(features1: ContentFeatures, features2: ContentFeatures): number {
    return this.cosineSimilarity(features1.semanticVector, features2.semanticVector);
  }

  private calculateDifficultySimilarity(features1: ContentFeatures, features2: ContentFeatures): number {
    const diff1 = features1.difficultyFeatures;
    const diff2 = features2.difficultyFeatures;
    
    // Calculate normalized Euclidean distance and convert to similarity
    const distance = Math.sqrt(
      diff1.reduce((sum, val, idx) => sum + Math.pow(val - diff2[idx], 2), 0)
    );
    
    const maxDistance = Math.sqrt(diff1.length * Math.pow(6, 2)); // Max possible distance
    return Math.max(0, 1 - (distance / maxDistance));
  }

  private calculateSkillsSimilarity(features1: ContentFeatures, features2: ContentFeatures): number {
    return this.jaccardSimilarity(
      Object.keys(features1.skillCoverage).filter(skill => features1.skillCoverage[skill] > 0),
      Object.keys(features2.skillCoverage).filter(skill => features2.skillCoverage[skill] > 0)
    );
  }

  private calculateBusinessSimilarity(features1: ContentFeatures, features2: ContentFeatures): number {
    const diff = Math.abs(features1.businessRelevance - features2.businessRelevance);
    return 1 - diff; // Higher similarity if business relevance is close
  }

  private calculateEngagementSimilarity(features1: ContentFeatures, features2: ContentFeatures): number {
    return this.cosineSimilarity(features1.engagementFactors, features2.engagementFactors);
  }

  // Utility similarity functions

  private cosineSimilarity(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return 0;
    
    const dotProduct = vec1.reduce((sum, val, idx) => sum + val * vec2[idx], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitude1 === 0 || magnitude2 === 0) return 0;
    return dotProduct / (magnitude1 * magnitude2);
  }

  private jaccardSimilarity(set1: string[], set2: string[]): number {
    const intersection = set1.filter(item => set2.includes(item));
    const union = Array.from(new Set([...set1, ...set2]));
    
    if (union.length === 0) return 0;
    return intersection.length / union.length;
  }

  private euclideanDistance(vec1: number[], vec2: number[]): number {
    if (vec1.length !== vec2.length) return Infinity;
    
    return Math.sqrt(
      vec1.reduce((sum, val, idx) => sum + Math.pow(val - vec2[idx], 2), 0)
    );
  }
}

export class HybridRecommendationMatcher {
  private contentSimilarity: ContentSimilarityEngine;
  private strategy: HybridRecommendationStrategy;

  constructor(strategy: HybridRecommendationStrategy) {
    this.contentSimilarity = new ContentSimilarityEngine();
    this.strategy = strategy;
  }

  /**
   * Generate hybrid recommendations using multiple approaches
   */
  async generateHybridRecommendations(
    context: RecommendationContext,
    candidateContents: ContentItem[]
  ): Promise<RecommendationScore[]> {
    const scores: RecommendationScore[] = [];

    for (const content of candidateContents) {
      const collaborativeScore = await this.calculateCollaborativeScore(context, content);
      const contentBasedScore = await this.calculateContentBasedScore(context, content);
      const knowledgeBasedScore = this.calculateKnowledgeBasedScore(context, content);
      const popularityScore = this.calculatePopularityScore(content);

      const hybridScore = 
        collaborativeScore * this.strategy.collaborativeFiltering.weight +
        contentBasedScore * this.strategy.contentBasedFiltering.weight +
        knowledgeBasedScore * this.strategy.knowledgeBasedFiltering.weight +
        popularityScore * this.strategy.popularityBased.weight;

      const reasoning = this.generateReasoning(
        context, 
        content, 
        { collaborativeScore, contentBasedScore, knowledgeBasedScore, popularityScore }
      );

      const personalizationFactors = await this.calculatePersonalizationFactors(context, content);

      scores.push({
        contentId: content.id,
        score: Math.round(hybridScore * 100),
        confidence: this.calculateConfidence(hybridScore, personalizationFactors),
        reasoning,
        personalizedFactors: personalizationFactors
      });
    }

    return scores.sort((a, b) => b.score - a.score);
  }

  // Collaborative Filtering Implementation
  private async calculateCollaborativeScore(context: RecommendationContext, content: ContentItem): Promise<number> {
    // This is a simplified collaborative filtering implementation
    // In practice, you would use user-item interaction matrices and similarity calculations
    
    const { userProfile, learningAnalytics } = context;
    
    // Find similar users based on learning patterns and preferences
    const userSimilarity = this.findSimilarUsers(context);
    
    // Calculate score based on how similar users rated this content
    let collaborativeScore = 0.5; // Default neutral score
    
    // Boost score if similar users liked this content type
    if (learningAnalytics.learningPattern.preferredContentTypes.includes(content.type)) {
      collaborativeScore += 0.2;
    }
    
    // Adjust based on user's historical performance with similar content
    if (content.engagementMetrics && content.engagementMetrics.averageRating > 4) {
      collaborativeScore += 0.15;
    }
    
    return Math.min(collaborativeScore, 1.0);
  }

  // Content-Based Filtering Implementation
  private async calculateContentBasedScore(context: RecommendationContext, content: ContentItem): Promise<number> {
    const { assessmentHistory, learningAnalytics } = context;
    
    // Find content user has engaged with before
    const userContentHistory = this.getUserContentHistory(context);
    
    if (userContentHistory.length === 0) {
      return 0.5; // Neutral score for new users
    }
    
    // Calculate similarity with previously successful content
    let totalSimilarity = 0;
    let contentCount = 0;
    
    for (const historicalContent of userContentHistory) {
      const similarity = await this.contentSimilarity.calculateContentSimilarity(content, historicalContent);
      totalSimilarity += similarity;
      contentCount++;
    }
    
    return contentCount > 0 ? totalSimilarity / contentCount : 0.5;
  }

  // Knowledge-Based Filtering Implementation
  private calculateKnowledgeBasedScore(context: RecommendationContext, content: ContentItem): number {
    let score = 0.5; // Base score
    
    // Apply business rules
    for (const rule of this.strategy.knowledgeBasedFiltering.ruleEngine) {
      if (rule.condition(context, content)) {
        switch (rule.action) {
          case 'boost':
            score += rule.weight;
            break;
          case 'penalize':
            score -= rule.weight;
            break;
          case 'require':
            score = Math.max(score, 0.8);
            break;
          case 'exclude':
            score = 0;
            break;
        }
      }
    }
    
    return Math.max(0, Math.min(1, score));
  }

  // Popularity-Based Filtering Implementation
  private calculatePopularityScore(content: ContentItem): number {
    if (!content.engagementMetrics) {
      return 0.3; // Low score for content without metrics
    }
    
    const { averageRating, completionRate, userFeedback } = content.engagementMetrics;
    
    // Combine multiple popularity metrics
    const ratingScore = averageRating / 5;
    const completionScore = completionRate;
    const feedbackScore = userFeedback / 5;
    
    // Weighted combination
    return (ratingScore * 0.4 + completionScore * 0.4 + feedbackScore * 0.2);
  }

  // Personalization Factors Calculation
  private async calculatePersonalizationFactors(
    context: RecommendationContext, 
    content: ContentItem
  ): Promise<PersonalizationFactors> {
    const { recentProgress, userProfile, learningAnalytics } = context;
    
    // User performance alignment
    const userPerformance = this.calculateUserPerformanceAlignment(context, content);
    
    // Content similarity with user's preferences
    const contentSimilarity = await this.calculateContentPreferenceSimilarity(context, content);
    
    // Skill gap alignment
    const skillGapAlignment = this.calculateSkillGapAlignment(context, content);
    
    // Difficulty match
    const difficultyMatch = this.calculateDifficultyMatch(context, content);
    
    // Learning style fit
    const learningStyleFit = this.calculateLearningStyleFit(context, content);
    
    // Timing optimization
    const timingOptimization = this.calculateTimingOptimization(context, content);
    
    // Engagement prediction
    const engagementPrediction = this.calculateEngagementPrediction(context, content);
    
    // Business relevance
    const businessRelevance = this.calculateBusinessRelevanceScore(context, content);

    return {
      userPerformance,
      contentSimilarity,
      skillGapAlignment,
      difficultyMatch,
      learningStyleFit,
      timingOptimization,
      engagementPrediction,
      businessRelevance
    };
  }

  // Helper methods for personalization factors

  private calculateUserPerformanceAlignment(context: RecommendationContext, content: ContentItem): number {
    const { recentProgress } = context;
    const userLevel = this.getCEFRLevelValue(recentProgress.cefrProgress.current);
    const contentLevel = this.getCEFRLevelValue(content.cefrLevel);
    
    // Optimal alignment is when content is slightly above user's current level
    const levelDiff = contentLevel - userLevel;
    
    if (levelDiff === 1) return 1.0; // Perfect challenge level
    if (levelDiff === 0) return 0.8; // At current level
    if (levelDiff === 2) return 0.6; // Challenging but manageable
    if (levelDiff < 0) return Math.max(0.2, 0.8 + levelDiff * 0.2); // Too easy
    
    return Math.max(0.1, 0.6 - (levelDiff - 2) * 0.2); // Too hard
  }

  private async calculateContentPreferenceSimilarity(context: RecommendationContext, content: ContentItem): Promise<number> {
    const userPreferredTypes = context.learningAnalytics.learningPattern.preferredContentTypes;
    
    if (userPreferredTypes.includes(content.type)) {
      return 0.9;
    }
    
    // Check for compatible content types
    const compatibleTypes: Record<ContentType, ContentType[]> = {
      'lesson': ['quiz', 'vocabulary', 'exercise'],
      'exercise': ['lesson', 'quiz', 'interactive'],
      'quiz': ['lesson', 'vocabulary', 'exercise'],
      'vocabulary': ['lesson', 'quiz', 'reading'],
      'dialogue': ['roleplay', 'business-case', 'speaking'],
      'reading': ['vocabulary', 'lesson', 'writing'],
      'listening': ['audio', 'dialogue', 'speaking'],
      'writing': ['reading', 'lesson', 'grammar'],
      'speaking': ['dialogue', 'listening', 'roleplay'],
      'grammar': ['lesson', 'writing', 'exercise'],
      'business-case': ['dialogue', 'roleplay', 'simulation'],
      'roleplay': ['dialogue', 'business-case', 'speaking'],
      'video': ['multimedia', 'audio', 'lesson'],
      'audio': ['listening', 'video', 'dialogue'],
      'interactive': ['exercise', 'simulation', 'multimedia'],
      'simulation': ['business-case', 'interactive', 'roleplay'],
      'ar-vr': ['simulation', 'interactive', 'multimedia'],
      'multimedia': ['video', 'audio', 'interactive']
    };
    
    const compatible = compatibleTypes[content.type] || [];
    if (compatible.some(type => userPreferredTypes.includes(type))) {
      return 0.6;
    }
    
    return 0.3;
  }

  private calculateSkillGapAlignment(context: RecommendationContext, content: ContentItem): number {
    const { learningAnalytics } = context;
    const weakAreas = learningAnalytics.skillProfile.weaknesses.map(skill => skill.name);
    const needsAttention = learningAnalytics.skillProfile.needsAttention.map(skill => skill.name);
    
    const contentSkills = content.skills;
    
    // High alignment if content addresses weak areas
    const weakAreasOverlap = contentSkills.filter(skill => weakAreas.includes(skill)).length;
    const attentionOverlap = contentSkills.filter(skill => needsAttention.includes(skill)).length;
    
    const maxOverlap = Math.max(weakAreas.length, needsAttention.length, 1);
    return Math.min(1.0, (weakAreasOverlap * 0.7 + attentionOverlap * 0.5) / maxOverlap);
  }

  private calculateDifficultyMatch(context: RecommendationContext, content: ContentItem): number {
    const userPreferredDifficulty = context.userProfile.learningPreferences.challengeLevel;
    
    const difficultyMapping: Record<string, DifficultyLevel[]> = {
      'comfortable': ['beginner', 'elementary'],
      'challenging': ['elementary', 'intermediate', 'upper-intermediate'],
      'very-challenging': ['upper-intermediate', 'advanced', 'proficient']
    };
    
    const preferredDifficulties = difficultyMapping[userPreferredDifficulty];
    return preferredDifficulties.includes(content.difficulty) ? 1.0 : 0.3;
  }

  private calculateLearningStyleFit(context: RecommendationContext, content: ContentItem): number {
    const learningStyle = context.userProfile.learningPreferences.learningStyle;
    
    const styleContentMatch: Record<string, ContentType[]> = {
      'visual': ['lesson', 'vocabulary', 'quiz'],
      'auditory': ['dialogue', 'roleplay'],
      'kinesthetic': ['roleplay', 'business-case'],
      'mixed': ['lesson', 'quiz', 'dialogue', 'vocabulary', 'business-case', 'roleplay']
    };
    
    const matchingTypes = styleContentMatch[learningStyle] || [];
    return matchingTypes.includes(content.type) ? 1.0 : 0.5;
  }

  private calculateTimingOptimization(context: RecommendationContext, content: ContentItem): number {
    const optimalSessionLength = context.learningAnalytics.learningPattern.optimalSessionLength;
    const contentDuration = content.duration;
    
    // Optimal if content duration matches user's preferred session length
    const durationMatch = 1 - Math.abs(contentDuration - optimalSessionLength) / optimalSessionLength;
    return Math.max(0.2, durationMatch);
  }

  private calculateEngagementPrediction(context: RecommendationContext, content: ContentItem): number {
    const userEngagement = context.learningAnalytics.engagementMetrics.completionRate;
    const contentEngagement = content.engagementMetrics?.completionRate || 0.7;
    
    // Predict engagement based on historical patterns
    return (userEngagement + contentEngagement) / 2;
  }

  private calculateBusinessRelevanceScore(context: RecommendationContext, content: ContentItem): number {
    const userBusinessContext = context.userProfile.learningPreferences.businessContext;
    
    if (!userBusinessContext) {
      return content.businessContext ? 0.3 : 0.8; // Slight penalty for business content if user doesn't need it
    }
    
    // High relevance for business content when user has business context
    return content.businessContext ? 1.0 : 0.4;
  }

  // Utility methods

  private getCEFRLevelValue(level: CEFRLevel): number {
    const values: Record<CEFRLevel, number> = {
      'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6
    };
    return values[level];
  }

  private findSimilarUsers(context: RecommendationContext): string[] {
    // This would be implemented with actual user similarity algorithms
    // For now, return empty array
    return [];
  }

  private getUserContentHistory(context: RecommendationContext): ContentItem[] {
    // This would retrieve user's content interaction history
    // For now, return empty array
    return [];
  }

  private generateReasoning(
    context: RecommendationContext,
    content: ContentItem,
    scores: { collaborativeScore: number; contentBasedScore: number; knowledgeBasedScore: number; popularityScore: number }
  ): RecommendationReasoning {
    const primaryFactors: string[] = [];
    const secondaryFactors: string[] = [];
    const penalties: string[] = [];
    const boosts: string[] = [];

    // Analyze primary factors
    if (scores.contentBasedScore > 0.7) {
      primaryFactors.push('Similar to your previously successful content');
    }
    if (scores.knowledgeBasedScore > 0.7) {
      primaryFactors.push('Matches your learning goals and skill level');
    }
    if (scores.collaborativeScore > 0.7) {
      primaryFactors.push('Popular among learners with similar profiles');
    }

    // Analyze secondary factors
    if (content.skills.some(skill => context.learningAnalytics.skillProfile.weaknesses.map(w => w.name).includes(skill))) {
      secondaryFactors.push('Addresses identified weak areas');
    }
    if (content.type === context.learningAnalytics.learningPattern.preferredContentTypes[0]) {
      secondaryFactors.push('Matches your preferred content type');
    }

    // Analyze boosts and penalties
    if (content.businessContext && context.userProfile.learningPreferences.businessContext) {
      boosts.push('Business relevance match');
    }
    if (content.duration > context.learningAnalytics.learningPattern.optimalSessionLength * 1.5) {
      penalties.push('Longer than optimal session length');
    }

    const explanation = this.generateExplanation(primaryFactors, secondaryFactors, boosts, penalties);

    return {
      primaryFactors,
      secondaryFactors,
      penalties,
      boosts,
      explanation
    };
  }

  private generateExplanation(
    primaryFactors: string[],
    secondaryFactors: string[],
    boosts: string[],
    penalties: string[]
  ): string {
    let explanation = 'This content is recommended because ';
    
    if (primaryFactors.length > 0) {
      explanation += primaryFactors.join(' and ').toLowerCase();
    } else {
      explanation += 'it matches your learning profile';
    }
    
    if (boosts.length > 0) {
      explanation += `. Additional benefits include ${boosts.join(' and ').toLowerCase()}`;
    }
    
    if (penalties.length > 0) {
      explanation += `. Note that ${penalties.join(' and ').toLowerCase()}`;
    }
    
    return explanation + '.';
  }

  private calculateConfidence(hybridScore: number, factors: PersonalizationFactors): number {
    // Calculate confidence based on score and factor consistency
    const factorValues = Object.values(factors);
    const avgFactor = factorValues.reduce((sum, val) => sum + val, 0) / factorValues.length;
    const factorVariance = factorValues.reduce((sum, val) => sum + Math.pow(val - avgFactor, 2), 0) / factorValues.length;
    
    // Lower variance = higher confidence
    const consistencyScore = Math.max(0, 1 - factorVariance);
    
    // Combine score and consistency
    return (hybridScore + consistencyScore) / 2;
  }
}

// Default recommendation rules
export const defaultRecommendationRules: RecommendationRule[] = [
  {
    condition: (context, content) => {
      const userLevel = context.recentProgress.cefrProgress.current;
      const contentLevel = content.cefrLevel;
      const levelDiff = getLevelDifference(contentLevel, userLevel);
      return levelDiff > 2; // Content is too advanced
    },
    action: 'penalize',
    weight: 0.3,
    reason: 'Content difficulty too advanced for current level'
  },
  {
    condition: (context, content) => {
      return Boolean(context.userProfile.learningPreferences.businessContext && content.businessContext);
    },
    action: 'boost',
    weight: 0.2,
    reason: 'Business relevance matches user needs'
  },
  {
    condition: (context, content) => {
      const weakSkills = context.learningAnalytics.skillProfile.weaknesses.map(s => s.name);
      return content.skills.some(skill => weakSkills.includes(skill));
    },
    action: 'boost',
    weight: 0.25,
    reason: 'Content addresses identified weak areas'
  },
  {
    condition: (context, content) => {
      return content.duration > context.learningAnalytics.learningPattern.optimalSessionLength * 2;
    },
    action: 'penalize',
    weight: 0.15,
    reason: 'Content duration exceeds optimal session length'
  }
];

function getLevelDifference(level1: CEFRLevel, level2: CEFRLevel): number {
  const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  return Math.abs(levels.indexOf(level1) - levels.indexOf(level2));
}

// Default hybrid strategy configuration
export const defaultHybridStrategy: HybridRecommendationStrategy = {
  collaborativeFiltering: {
    weight: 0.25,
    userSimilarityThreshold: 0.7,
    minInteractions: 5
  },
  contentBasedFiltering: {
    weight: 0.35,
    similarityAlgorithm: 'cosine',
    featureWeights: {
      semantic: 0.3,
      skills: 0.25,
      difficulty: 0.2,
      business: 0.15,
      engagement: 0.1
    }
  },
  knowledgeBasedFiltering: {
    weight: 0.25,
    ruleEngine: defaultRecommendationRules,
    expertSystemRules: []
  },
  popularityBased: {
    weight: 0.15,
    timeDecay: 0.1,
    minRatings: 3
  }
};