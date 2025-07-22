// User Performance Analysis Algorithms
// Task 2: Build Intelligent Content Recommendation Engine

import {
  PerformanceAnalysis,
  PerformanceMetrics,
  SkillPerformanceMap,
  LearningPatternAnalysis,
  PerformancePredictionModel,
  PerformanceRecommendations,
  RecommendationContext,
  UserPreferences,
  StrengthLevel,
  ChallengeResponse
} from './recommendation-engine';
import { ContentType, DifficultyLevel } from '../content/types';
import { CEFRLevel, LearningStyle, LearningPace, ChallengeLevel } from '../types/user';
import { AssessmentResults } from '../utils/assessment';
import { LearningGoal, ProgressMetrics, StudySession } from '../utils/progress';

export class UserPerformanceAnalyzer {
  private readonly SKILL_WEIGHTS = {
    accuracy: 0.3,
    speed: 0.2,
    consistency: 0.2,
    improvement: 0.15,
    retention: 0.15
  };

  private readonly PATTERN_ANALYSIS_WINDOW = {
    short: 7, // days
    medium: 30, // days
    long: 90 // days
  };

  /**
   * Comprehensive user performance analysis
   */
  async analyzeUserPerformance(context: RecommendationContext): Promise<PerformanceAnalysis> {
    const overallPerformance = this.calculateOverallPerformance(context);
    const skillAnalysis = this.analyzeSkillPerformance(context);
    const learningPatterns = this.analyzeLearningPatterns(context);
    const predictionModel = this.buildPredictionModel(context, overallPerformance, skillAnalysis);
    const recommendations = this.generatePerformanceRecommendations(
      overallPerformance,
      skillAnalysis,
      learningPatterns
    );

    return {
      overallPerformance,
      skillAnalysis,
      learningPatterns,
      predictionModel,
      recommendations
    };
  }

  /**
   * Calculate overall performance metrics
   */
  private calculateOverallPerformance(context: RecommendationContext): PerformanceMetrics {
    const { assessmentHistory, recentProgress } = context;
    
    // Accuracy trend from recent assessments
    const recentAssessments = assessmentHistory.slice(-10);
    const accuracyTrend = recentAssessments.map(a => a.attempt.percentage);
    
    // Speed trend (improvement in response time)
    const speedTrend = this.calculateSpeedTrend(recentAssessments);
    
    // Consistency score (lower variance = higher consistency)
    const consistencyScore = this.calculateConsistencyScore(accuracyTrend);
    
    // Improvement rate (learning velocity)
    const improvementRate = this.calculateImprovementRate(accuracyTrend);
    
    // Retention rate (performance on repeated topics)
    const retentionRate = this.calculateRetentionRate(assessmentHistory);
    
    // Engagement level (session completion rates)
    const engagementLevel = this.calculateEngagementLevel(context);

    return {
      accuracyTrend,
      speedTrend,
      consistencyScore,
      improvementRate,
      retentionRate,
      engagementLevel
    };
  }

  /**
   * Analyze performance by skill area
   */
  private analyzeSkillPerformance(context: RecommendationContext): SkillPerformanceMap {
    const { assessmentHistory } = context;
    const skillMap: SkillPerformanceMap = {};

    // Group assessments by skill
    const skillData: Record<string, AssessmentResults[]> = {};
    
    assessmentHistory.forEach(assessment => {
      Object.keys(assessment.skillBreakdown).forEach(skill => {
        if (!skillData[skill]) {
          skillData[skill] = [];
        }
        skillData[skill].push(assessment);
      });
    });

    // Analyze each skill
    Object.entries(skillData).forEach(([skill, assessments]) => {
      const skillScores = assessments.map(a => a.skillBreakdown[skill]?.percentage || 0);
      const recentScores = skillScores.slice(-5); // Last 5 assessments
      
      const currentLevel = this.calculateCurrentSkillLevel(skillScores);
      const improvementRate = this.calculateSkillImprovementRate(skillScores);
      const consistency = this.calculateConsistencyScore(skillScores);
      const strengthLevel = this.determineStrengthLevel(currentLevel, consistency);
      const priority = this.calculateSkillPriority(currentLevel, improvementRate, consistency);

      skillMap[skill] = {
        currentLevel,
        improvementRate,
        consistency,
        lastAssessed: new Date(assessments[assessments.length - 1].attempt.completedAt || assessments[assessments.length - 1].attempt.startedAt),
        assessmentCount: assessments.length,
        strengthLevel,
        priority
      };
    });

    return skillMap;
  }

  /**
   * Analyze learning patterns and preferences
   */
  private analyzeLearningPatterns(context: RecommendationContext): LearningPatternAnalysis {
    const { assessmentHistory, learningAnalytics, userProfile } = context;
    
    // Analyze preferred difficulty based on performance
    const preferredDifficulty = this.analyzePreferredDifficulty(assessmentHistory);
    
    // Optimal session length based on completion rates
    const optimalSessionLength = learningAnalytics.learningPattern.optimalSessionLength || 30;
    
    // Best performance time
    const bestPerformanceTime = learningAnalytics.learningPattern.bestPerformanceTime || 'morning';
    
    // Content type preferences based on engagement
    const contentTypePreferences = this.analyzeContentTypePreferences(context);
    
    // Learning speed assessment
    const learningSpeed = this.assessLearningSpeed(assessmentHistory);
    
    // Challenge response analysis
    const challengeResponse = this.analyzeChallengeResponse(assessmentHistory);
    
    // Motivation factors
    const motivationFactors = this.identifyMotivationFactors(context);
    
    // Dropoff triggers
    const dropoffTriggers = this.identifyDropoffTriggers(context);

    return {
      preferredDifficulty,
      optimalSessionLength,
      bestPerformanceTime,
      contentTypePreferences,
      learningSpeed,
      challengeResponse,
      motivationFactors,
      dropoffTriggers
    };
  }

  /**
   * Build performance prediction model
   */
  private buildPredictionModel(
    context: RecommendationContext,
    performance: PerformanceMetrics,
    skillAnalysis: SkillPerformanceMap
  ): PerformancePredictionModel {
    const { assessmentHistory, userProfile } = context;

    // Success probability for different content types
    const successProbability = this.predictContentTypeSuccess(assessmentHistory, performance);
    
    // Difficulty tolerance mapping
    const difficultyTolerance = this.assessDifficultyTolerance(assessmentHistory, performance);
    
    // Expected completion time predictions
    const expectedCompletionTime = this.predictCompletionTimes(context);
    
    // Engagement prediction by content type
    const engagementPrediction = this.predictEngagementByContentType(context);
    
    // Skill improvement potential
    const skillImprovementPotential = this.assessSkillImprovementPotential(skillAnalysis);

    return {
      successProbability,
      difficultyTolerance,
      expectedCompletionTime,
      engagementPrediction,
      skillImprovementPotential
    };
  }

  /**
   * Generate performance-based recommendations
   */
  private generatePerformanceRecommendations(
    performance: PerformanceMetrics,
    skillAnalysis: SkillPerformanceMap,
    patterns: LearningPatternAnalysis
  ): PerformanceRecommendations {
    // Identify strengths to leverage
    const strengthsToLeverage = Object.entries(skillAnalysis)
      .filter(([_, data]) => data.strengthLevel === 'advanced' || data.strengthLevel === 'proficient')
      .map(([skill, _]) => skill);

    // Identify weaknesses to address
    const weaknessesToAddress = Object.entries(skillAnalysis)
      .filter(([_, data]) => data.priority === 'high' && data.strengthLevel === 'weak')
      .map(([skill, _]) => skill);

    // Optimal learning strategy
    const optimalLearningStrategy = this.determineOptimalStrategy(performance, patterns);

    // Content mix suggestion
    const contentMixSuggestion = this.suggestContentMix(patterns, skillAnalysis);

    // Pacing recommendations
    const pacingRecommendations = this.generatePacingRecommendations(patterns, performance);

    // Motivation tactics
    const motivationTactics = this.suggestMotivationTactics(patterns);

    return {
      strengthsToLeverage,
      weaknessesToAddress,
      optimalLearningStrategy,
      contentMixSuggestion,
      pacingRecommendations,
      motivationTactics
    };
  }

  // Helper methods for calculations

  private calculateSpeedTrend(assessments: AssessmentResults[]): number[] {
    return assessments.map((assessment, index) => {
      if (index === 0) return 0;
      const prevTime = assessments[index - 1].attempt.timeSpent;
      const currentTime = assessment.attempt.timeSpent;
      return prevTime > 0 ? ((prevTime - currentTime) / prevTime) * 100 : 0;
    });
  }

  private calculateConsistencyScore(scores: number[]): number {
    if (scores.length < 2) return 1;
    
    const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Higher consistency = lower standard deviation
    // Normalize to 0-1 scale where 1 is perfect consistency
    return Math.max(0, 1 - (standardDeviation / 100));
  }

  private calculateImprovementRate(accuracyTrend: number[]): number {
    if (accuracyTrend.length < 2) return 0;
    
    // Calculate linear regression slope
    const n = accuracyTrend.length;
    const xSum = (n * (n - 1)) / 2;
    const ySum = accuracyTrend.reduce((sum, score) => sum + score, 0);
    const xySum = accuracyTrend.reduce((sum, score, index) => sum + (score * index), 0);
    const x2Sum = ((n - 1) * n * (2 * n - 1)) / 6;
    
    return (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);
  }

  private calculateRetentionRate(assessmentHistory: AssessmentResults[]): number {
    // Analyze performance on repeated skill areas
    const skillRetention: Record<string, number[]> = {};
    
    assessmentHistory.forEach(assessment => {
      Object.entries(assessment.skillBreakdown).forEach(([skill, data]) => {
        if (!skillRetention[skill]) {
          skillRetention[skill] = [];
        }
        skillRetention[skill].push(data.percentage);
      });
    });

    // Calculate retention score for skills with multiple assessments
    const retentionScores: number[] = [];
    Object.values(skillRetention).forEach(scores => {
      if (scores.length >= 3) {
        const firstScore = scores[0];
        const recentAverage = scores.slice(-3).reduce((sum, score) => sum + score, 0) / 3;
        const retention = Math.min(recentAverage / firstScore, 1);
        retentionScores.push(retention);
      }
    });

    return retentionScores.length > 0 
      ? retentionScores.reduce((sum, score) => sum + score, 0) / retentionScores.length 
      : 0.8; // Default assumption
  }

  private calculateEngagementLevel(context: RecommendationContext): number {
    const { learningAnalytics } = context;
    return learningAnalytics.engagementMetrics.completionRate;
  }

  private calculateCurrentSkillLevel(skillScores: number[]): number {
    if (skillScores.length === 0) return 0;
    
    // Weight recent scores more heavily
    const weights = skillScores.map((_, index) => Math.pow(1.2, index));
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
    
    return skillScores.reduce((sum, score, index) => {
      return sum + (score * weights[index]);
    }, 0) / weightSum;
  }

  private calculateSkillImprovementRate(skillScores: number[]): number {
    if (skillScores.length < 2) return 0;
    
    // Calculate improvement over time
    const timeSpan = skillScores.length - 1;
    const improvement = skillScores[skillScores.length - 1] - skillScores[0];
    
    return improvement / timeSpan; // Points per assessment
  }

  private determineStrengthLevel(currentLevel: number, consistency: number): StrengthLevel {
    if (currentLevel >= 85 && consistency >= 0.8) return 'advanced';
    if (currentLevel >= 70 && consistency >= 0.6) return 'proficient';
    if (currentLevel >= 50 && consistency >= 0.4) return 'developing';
    return 'weak';
  }

  private calculateSkillPriority(
    currentLevel: number, 
    improvementRate: number, 
    consistency: number
  ): 'high' | 'medium' | 'low' {
    // High priority: low level OR declining performance
    if (currentLevel < 60 || improvementRate < -2) return 'high';
    
    // Medium priority: average level with room for improvement
    if (currentLevel < 80 || consistency < 0.6) return 'medium';
    
    // Low priority: high level and consistent
    return 'low';
  }

  private analyzePreferredDifficulty(assessmentHistory: AssessmentResults[]): DifficultyLevel {
    // Analyze performance vs difficulty to find sweet spot
    const difficultyPerformance: Record<string, number[]> = {};
    
    // This would need to be enhanced with actual difficulty data from assessments
    // For now, use a heuristic based on CEFR levels
    const recentCEFR = assessmentHistory.slice(-5).map(a => a.cefrLevelAnalysis.currentLevel);
    const avgCEFR = this.getAverageCEFRLevel(recentCEFR);
    
    if (['A1', 'A2'].includes(avgCEFR)) return 'beginner';
    if (['B1', 'B2'].includes(avgCEFR)) return 'intermediate';
    return 'advanced';
  }

  private analyzeContentTypePreferences(context: RecommendationContext): ContentType[] {
    const { learningAnalytics } = context;
    return learningAnalytics.learningPattern.preferredContentTypes || ['lesson', 'quiz', 'vocabulary'];
  }

  private assessLearningSpeed(assessmentHistory: AssessmentResults[]): LearningPace {
    // Analyze improvement rate to determine learning speed
    const improvementRates = assessmentHistory.slice(-10).map((assessment, index, arr) => {
      if (index === 0) return 0;
      return assessment.attempt.percentage - arr[index - 1].attempt.percentage;
    }).filter(rate => rate !== 0);

    const avgImprovement = improvementRates.reduce((sum, rate) => sum + rate, 0) / improvementRates.length;
    
    if (avgImprovement > 5) return 'fast';
    if (avgImprovement > 2) return 'moderate';
    return 'slow';
  }

  private analyzeChallengeResponse(assessmentHistory: AssessmentResults[]): ChallengeResponse {
    // Analyze performance on challenging content
    const challengingAssessments = assessmentHistory.filter(a => a.attempt.percentage < 70);
    const challengePerformance = challengingAssessments.map(a => a.attempt.percentage);
    
    if (challengePerformance.length === 0) return 'thrives';
    
    const avgChallengePerformance = challengePerformance.reduce((sum, score) => sum + score, 0) / challengePerformance.length;
    
    if (avgChallengePerformance > 60) return 'thrives';
    if (avgChallengePerformance > 40) return 'manages';
    return 'struggles';
  }

  private identifyMotivationFactors(context: RecommendationContext): string[] {
    const factors: string[] = [];
    const { learningAnalytics, userProfile } = context;
    
    // Based on engagement patterns
    if (learningAnalytics.engagementMetrics.completionRate > 0.8) {
      factors.push('Goal completion');
    }
    
    if (learningAnalytics.engagementMetrics.averageSessionTime > 30) {
      factors.push('Deep learning sessions');
    }
    
    // Based on learning goals
    if (userProfile.learningPreferences.goals.includes('career')) {
      factors.push('Professional advancement');
    }
    
    if (userProfile.learningPreferences.businessContext) {
      factors.push('Business relevance');
    }
    
    return factors.length > 0 ? factors : ['Achievement', 'Progress tracking'];
  }

  private identifyDropoffTriggers(context: RecommendationContext): string[] {
    const { learningAnalytics } = context;
    return learningAnalytics.engagementMetrics.dropoffPoints || ['Difficult content', 'Long sessions'];
  }

  private predictContentTypeSuccess(
    assessmentHistory: AssessmentResults[],
    performance: PerformanceMetrics
  ): Record<ContentType, number> {
    // This is a simplified prediction - in practice, you'd use ML models
    const baseSuccess = performance.accuracyTrend.slice(-3).reduce((sum, score) => sum + score, 0) / 3;
    
    // Create a complete mapping for all ContentType values
    const successRates: Record<ContentType, number> = {
      'lesson': Math.min(baseSuccess + 10, 100) / 100,
      'exercise': Math.min(baseSuccess + 5, 100) / 100,
      'quiz': Math.min(baseSuccess, 100) / 100,
      'vocabulary': Math.min(baseSuccess + 5, 100) / 100,
      'dialogue': Math.min(baseSuccess - 5, 100) / 100,
      'reading': Math.min(baseSuccess + 3, 100) / 100,
      'listening': Math.min(baseSuccess - 2, 100) / 100,
      'writing': Math.min(baseSuccess - 8, 100) / 100,
      'speaking': Math.min(baseSuccess - 10, 100) / 100,
      'grammar': Math.min(baseSuccess + 2, 100) / 100,
      'business-case': Math.min(baseSuccess - 10, 100) / 100,
      'roleplay': Math.min(baseSuccess - 15, 100) / 100,
      'video': Math.min(baseSuccess + 8, 100) / 100,
      'audio': Math.min(baseSuccess - 3, 100) / 100,
      'interactive': Math.min(baseSuccess - 5, 100) / 100,
      'simulation': Math.min(baseSuccess - 20, 100) / 100,
      'ar-vr': Math.min(baseSuccess - 25, 100) / 100,
      'multimedia': Math.min(baseSuccess, 100) / 100
    };
    
    return successRates;
  }

  private assessDifficultyTolerance(
    assessmentHistory: AssessmentResults[],
    performance: PerformanceMetrics
  ): Record<DifficultyLevel, number> {
    const consistency = performance.consistencyScore;
    const avgScore = performance.accuracyTrend.slice(-5).reduce((sum, score) => sum + score, 0) / 5;
    
    return {
      'beginner': Math.min(avgScore + 20, 100) / 100,
      'elementary': Math.min(avgScore + 15, 100) / 100,
      'intermediate': avgScore / 100,
      'upper-intermediate': Math.max(avgScore - 5, 0) / 100,
      'advanced': Math.max(avgScore - 20, 0) / 100,
      'proficient': Math.max(avgScore - 30, 0) / 100
    };
  }

  private predictCompletionTimes(context: RecommendationContext): Record<ContentType, number> {
    const { learningAnalytics } = context;
    const baseTime = learningAnalytics.learningPattern.optimalSessionLength;
    
    return {
      'lesson': baseTime,
      'exercise': Math.round(baseTime * 0.7),
      'quiz': Math.round(baseTime * 0.6),
      'vocabulary': Math.round(baseTime * 0.4),
      'dialogue': Math.round(baseTime * 0.8),
      'reading': Math.round(baseTime * 0.9),
      'listening': Math.round(baseTime * 0.8),
      'writing': Math.round(baseTime * 1.3),
      'speaking': Math.round(baseTime * 0.9),
      'grammar': Math.round(baseTime * 0.8),
      'business-case': Math.round(baseTime * 1.2),
      'roleplay': Math.round(baseTime * 1.5),
      'video': Math.round(baseTime * 1.1),
      'audio': Math.round(baseTime * 0.7),
      'interactive': Math.round(baseTime * 1.4),
      'simulation': Math.round(baseTime * 2.0),
      'ar-vr': Math.round(baseTime * 2.5),
      'multimedia': Math.round(baseTime * 1.2)
    };
  }

  private predictEngagementByContentType(context: RecommendationContext): Record<ContentType, number> {
    const { learningAnalytics, userProfile } = context;
    const baseEngagement = learningAnalytics.engagementMetrics.completionRate;
    
    // Adjust based on learning style
    const adjustments: Record<ContentType, number> = {
      'lesson': userProfile.learningPreferences.learningStyle === 'visual' ? 0.1 : 0,
      'exercise': userProfile.learningPreferences.learningStyle === 'kinesthetic' ? 0.15 : 0,
      'quiz': userProfile.learningPreferences.learningStyle === 'kinesthetic' ? 0.1 : 0,
      'vocabulary': 0,
      'dialogue': userProfile.learningPreferences.learningStyle === 'auditory' ? 0.15 : 0,
      'reading': userProfile.learningPreferences.learningStyle === 'visual' ? 0.1 : 0,
      'listening': userProfile.learningPreferences.learningStyle === 'auditory' ? 0.2 : 0,
      'writing': userProfile.learningPreferences.learningStyle === 'kinesthetic' ? 0.05 : 0,
      'speaking': userProfile.learningPreferences.learningStyle === 'auditory' ? 0.15 : 0,
      'grammar': 0,
      'business-case': userProfile.learningPreferences.businessContext ? 0.2 : -0.1,
      'roleplay': userProfile.learningPreferences.learningStyle === 'kinesthetic' ? 0.2 : -0.1,
      'video': userProfile.learningPreferences.learningStyle === 'visual' ? 0.15 : 0.05,
      'audio': userProfile.learningPreferences.learningStyle === 'auditory' ? 0.2 : 0,
      'interactive': userProfile.learningPreferences.learningStyle === 'kinesthetic' ? 0.25 : 0.1,
      'simulation': userProfile.learningPreferences.learningStyle === 'kinesthetic' ? 0.3 : 0,
      'ar-vr': userProfile.learningPreferences.learningStyle === 'kinesthetic' ? 0.35 : -0.1,
      'multimedia': 0.1
    };

    const result: Record<ContentType, number> = {} as Record<ContentType, number>;
    Object.entries(adjustments).forEach(([type, adjustment]) => {
      result[type as ContentType] = Math.max(0, Math.min(1, baseEngagement + adjustment));
    });

    return result;
  }

  private assessSkillImprovementPotential(skillAnalysis: SkillPerformanceMap): Record<string, number> {
    const potential: Record<string, number> = {};
    
    Object.entries(skillAnalysis).forEach(([skill, data]) => {
      // Higher potential for skills that are weak but showing improvement
      let potentialScore = 0.5; // Base potential
      
      if (data.strengthLevel === 'weak' && data.improvementRate > 0) {
        potentialScore = 0.9;
      } else if (data.strengthLevel === 'developing' && data.improvementRate > 0) {
        potentialScore = 0.8;
      } else if (data.strengthLevel === 'proficient') {
        potentialScore = 0.6;
      } else if (data.strengthLevel === 'advanced') {
        potentialScore = 0.3;
      }
      
      potential[skill] = potentialScore;
    });

    return potential;
  }

  private determineOptimalStrategy(
    performance: PerformanceMetrics,
    patterns: LearningPatternAnalysis
  ): string {
    const strategies: string[] = [];
    
    if (performance.consistencyScore < 0.6) {
      strategies.push('Focus on building consistent practice habits');
    }
    
    if (performance.improvementRate < 0) {
      strategies.push('Return to foundational concepts');
    }
    
    if (patterns.challengeResponse === 'struggles') {
      strategies.push('Gradual difficulty progression with support');
    }
    
    if (patterns.learningSpeed === 'fast') {
      strategies.push('Accelerated learning with advanced challenges');
    }
    
    return strategies.length > 0 
      ? strategies.join(', ')
      : 'Balanced approach with regular assessment';
  }

  private suggestContentMix(
    patterns: LearningPatternAnalysis,
    skillAnalysis: SkillPerformanceMap
  ): Record<ContentType, number> {
    const mix: Record<ContentType, number> = {
      'lesson': 25,
      'exercise': 20,
      'quiz': 15,
      'vocabulary': 10,
      'dialogue': 10,
      'reading': 5,
      'listening': 5,
      'writing': 5,
      'speaking': 5,
      'grammar': 5,
      'business-case': 8,
      'roleplay': 3,
      'video': 4,
      'audio': 3,
      'interactive': 2,
      'simulation': 1,
      'ar-vr': 0,
      'multimedia': 2
    };

    // Adjust based on weak skills
    const weakSkills = Object.entries(skillAnalysis)
      .filter(([_, data]) => data.strengthLevel === 'weak')
      .map(([skill, _]) => skill);

    if (weakSkills.includes('vocabulary')) {
      mix.vocabulary += 10;
      mix.lesson -= 5;
      mix.quiz -= 5;
    }

    if (weakSkills.includes('speaking') || weakSkills.includes('conversation')) {
      mix.dialogue += 10;
      mix.roleplay += 5;
      mix.lesson -= 10;
      mix.vocabulary -= 5;
    }

    return mix;
  }

  private generatePacingRecommendations(
    patterns: LearningPatternAnalysis,
    performance: PerformanceMetrics
  ): string[] {
    const recommendations: string[] = [];
    
    if (patterns.learningSpeed === 'slow') {
      recommendations.push('Take extra time with each concept');
      recommendations.push('Review previous material regularly');
    }
    
    if (patterns.optimalSessionLength < 20) {
      recommendations.push('Keep sessions short and focused');
    } else if (patterns.optimalSessionLength > 45) {
      recommendations.push('Break longer sessions into focused segments');
    }
    
    if (performance.retentionRate < 0.7) {
      recommendations.push('Increase review frequency');
      recommendations.push('Use spaced repetition techniques');
    }
    
    return recommendations.length > 0 
      ? recommendations 
      : ['Maintain current pace', 'Regular practice sessions'];
  }

  private suggestMotivationTactics(patterns: LearningPatternAnalysis): string[] {
    const tactics: string[] = [];
    
    if (patterns.motivationFactors.includes('Achievement')) {
      tactics.push('Set clear milestones and celebrate progress');
    }
    
    if (patterns.motivationFactors.includes('Professional advancement')) {
      tactics.push('Focus on business-relevant scenarios');
      tactics.push('Track skill improvements relevant to career goals');
    }
    
    if (patterns.challengeResponse === 'thrives') {
      tactics.push('Include challenging content to maintain engagement');
    }
    
    return tactics.length > 0 
      ? tactics 
      : ['Varied content types', 'Progress tracking', 'Achievement recognition'];
  }

  private getAverageCEFRLevel(levels: CEFRLevel[]): CEFRLevel {
    const levelValues: Record<CEFRLevel, number> = {
      'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6
    };
    
    const valueToLevel: Record<number, CEFRLevel> = {
      1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2', 5: 'C1', 6: 'C2'
    };
    
    const avgValue = levels.reduce((sum, level) => sum + levelValues[level], 0) / levels.length;
    const roundedValue = Math.round(avgValue);
    
    return valueToLevel[roundedValue] || 'B1';
  }
}