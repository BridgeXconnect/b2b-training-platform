/**
 * Adaptive Difficulty Engine
 * Task 4: Implement Smart Difficulty Adjustment (AC: 5, 6)
 * 
 * Real-time difficulty adjustment system integrated with assessment results,
 * user performance data, and CEFR level progression mapping.
 */

import { CEFRLevel, LearningPace, ChallengeLevel, UserProfile } from '../types/user';
import { AssessmentResults } from '../utils/assessment';
import { ProgressMetrics as BaseProgressMetrics, StudySession } from '../utils/progress';
import { RecommendationContext, PerformanceAnalysis } from './recommendation-engine';

// Extended ProgressMetrics for adaptive difficulty
export interface AdaptiveProgressMetrics extends BaseProgressMetrics {
  accuracy: number; // 0-1 recent accuracy
  consistency: number; // 0-1 performance consistency
  improvement: number; // Rate of learning improvement
  engagement: number; // 0-1 engagement level
  completionRate: number; // 0-1 session completion rate
}

// Core difficulty adjustment types
export interface DifficultyContext {
  userId: string;
  sessionId: string;
  userProfile: UserProfile;
  currentLevel: CEFRLevel;
  targetLevel: CEFRLevel;
  recentPerformance: AdaptiveProgressMetrics;
  assessmentHistory: AssessmentResults[];
  currentSession?: StudySession;
  realTimeMetrics?: RealTimePerformanceMetrics;
}

export interface RealTimePerformanceMetrics {
  correctAnswers: number;
  totalAttempts: number;
  averageResponseTime: number; // seconds
  strugglingIndicators: string[]; // What user is struggling with
  confidenceLevel: number; // 0-1
  engagementScore: number; // 0-1
  frustratedIndicators: boolean;
  boredIndicators: boolean;
  lastUpdated: Date;
}

export interface DifficultyAdjustment {
  currentDifficulty: DifficultyLevel;
  recommendedDifficulty: DifficultyLevel;
  adjustmentReason: DifficultyAdjustmentReason;
  confidence: number; // 0-1 confidence in recommendation
  gradualAdjustment: boolean; // Whether to adjust gradually
  timeframe: 'immediate' | 'next-question' | 'next-section' | 'next-session';
  specificAdjustments: SpecificAdjustment[];
}

export interface DifficultyLevel {
  overall: number; // 0-100 main difficulty score
  cognitive: number; // 0-100 thinking complexity
  linguistic: number; // 0-100 language complexity
  contextual: number; // 0-100 situational complexity
  timeConstraint: number; // 0-100 time pressure
  cefrAlignment: CEFRLevel;
  description: string;
}

export interface DifficultyAdjustmentReason {
  primaryFactors: string[];
  performanceIndicators: string[];
  learningVelocity: 'too-fast' | 'optimal' | 'too-slow';
  frustrationLevel: 'low' | 'medium' | 'high';
  boredLevel: 'low' | 'medium' | 'high';
  confidenceLevel: 'low' | 'medium' | 'high';
  explanation: string;
}

export interface SpecificAdjustment {
  aspect: 'vocabulary' | 'grammar' | 'context' | 'time' | 'support';
  currentValue: number;
  targetValue: number;
  reasoning: string;
}

// CEFR Level Progression System
export interface CEFRProgression {
  currentLevel: CEFRLevel;
  subLevel: number; // 0-100 progress within current level
  nextLevel: CEFRLevel;
  progressToNext: number; // 0-100 progress towards next level
  estimatedTimeToNext: number; // days
  strengthAreas: CEFRSkillArea[];
  developmentAreas: CEFRSkillArea[];
  readinessForNext: ReadinessAssessment;
}

export interface CEFRSkillArea {
  skill: 'listening' | 'reading' | 'speaking' | 'writing' | 'interaction';
  currentLevel: CEFRLevel;
  proficiency: number; // 0-100
  consistency: number; // 0-100
  recentTrend: 'improving' | 'stable' | 'declining';
  targetForNextLevel: number; // 0-100
}

export interface ReadinessAssessment {
  overallReadiness: number; // 0-100
  skillReadiness: Record<string, number>;
  recommendedFocus: string[];
  estimatedPreparationTime: number; // days
  confidenceLevel: 'low' | 'medium' | 'high';
}

// Performance-based difficulty calculation
export interface PerformanceBasedCalculation {
  accuracyTrend: number[]; // Last 10 assessments
  speedTrend: number[]; // Response time trends
  consistencyScore: number; // 0-100
  improvementVelocity: number; // Rate of learning
  plateauDetection: boolean; // Whether user has plateaued
  optimalDifficultyRange: [number, number]; // Min/max difficulty
  currentPerformanceLevel: number; // 0-100
}

export interface DifficultyCalculationResult {
  recommendedLevel: DifficultyLevel;
  confidence: number;
  reasoning: string;
  alternatives: DifficultyLevel[];
  validationMetrics: ValidationMetrics;
}

export interface ValidationMetrics {
  expectedAccuracy: number; // 0-1
  expectedEngagement: number; // 0-1
  expectedFrustration: number; // 0-1
  expectedCompletionTime: number; // minutes
  riskFactors: string[];
}

// Real-time adjustment engine
export interface RealTimeAdjustmentEngine {
  // Core adjustment methods
  calculateDifficulty(context: DifficultyContext): Promise<DifficultyCalculationResult>;
  adjustRealTime(
    currentLevel: DifficultyLevel,
    realtimeMetrics: RealTimePerformanceMetrics,
    context: DifficultyContext
  ): Promise<DifficultyAdjustment>;
  
  // CEFR progression
  assessCEFRProgression(userId: string): Promise<CEFRProgression>;
  updateCEFRProgress(
    userId: string,
    performanceData: PerformanceMetrics
  ): Promise<CEFRProgression>;
  
  // Performance analysis
  analyzePerformance(
    userId: string,
    timeframe: 'session' | 'week' | 'month'
  ): Promise<PerformanceBasedCalculation>;
  
  // Feedback integration
  processFeedback(
    userId: string,
    feedback: UserDifficultyFeedback
  ): Promise<void>;
  
  // Validation and monitoring
  validateAdjustment(
    adjustment: DifficultyAdjustment,
    context: DifficultyContext
  ): Promise<ValidationMetrics>;
}

export interface UserDifficultyFeedback {
  userId: string;
  sessionId: string;
  contentId: string;
  perceivedDifficulty: 'too-easy' | 'just-right' | 'too-hard';
  confidence: 'low' | 'medium' | 'high';
  enjoyment: number; // 1-5
  frustration: number; // 1-5
  comments?: string;
  timestamp: Date;
}

// Adaptive Difficulty Engine Implementation
export class AdaptiveDifficultyEngine implements RealTimeAdjustmentEngine {
  private performanceHistory: Map<string, PerformanceBasedCalculation> = new Map();
  private cefrProgressions: Map<string, CEFRProgression> = new Map();
  private difficultyCache: Map<string, DifficultyCalculationResult> = new Map();

  constructor() {
    this.initializeCEFRMappings();
  }

  /**
   * Calculate optimal difficulty level based on user context and performance
   */
  async calculateDifficulty(context: DifficultyContext): Promise<DifficultyCalculationResult> {
    const cacheKey = `${context.userId}-${context.sessionId}-${Date.now()}`;
    
    // Check cache for recent calculations
    if (this.difficultyCache.has(cacheKey)) {
      return this.difficultyCache.get(cacheKey)!;
    }

    // Analyze current performance
    const performanceAnalysis = await this.analyzePerformance(context.userId, 'session');
    const cefrProgression = await this.assessCEFRProgression(context.userId);
    
    // Calculate base difficulty from CEFR level
    const baseDifficulty = this.calculateBaseDifficultyFromCEFR(context.currentLevel);
    
    // Apply performance-based adjustments
    const performanceAdjustment = this.calculatePerformanceAdjustment(
      performanceAnalysis,
      context.recentPerformance
    );
    
    // Apply real-time metrics if available
    const realTimeAdjustment = context.realTimeMetrics 
      ? this.calculateRealTimeAdjustment(context.realTimeMetrics)
      : 0;
    
    // Calculate final difficulty level
    const adjustedDifficulty = this.combineAdjustments(
      baseDifficulty,
      performanceAdjustment,
      realTimeAdjustment,
      cefrProgression
    );
    
    // Generate alternatives and validation
    const alternatives = this.generateAlternatives(adjustedDifficulty, context);
    const validationMetrics = await this.validateAdjustment(
      { 
        currentDifficulty: baseDifficulty,
        recommendedDifficulty: adjustedDifficulty,
        adjustmentReason: this.generateAdjustmentReason(performanceAnalysis, context),
        confidence: this.calculateConfidence(performanceAnalysis, context),
        gradualAdjustment: this.shouldGraduallyAdjust(performanceAnalysis),
        timeframe: this.determineAdjustmentTimeframe(context),
        specificAdjustments: this.generateSpecificAdjustments(baseDifficulty, adjustedDifficulty)
      },
      context
    );

    const result: DifficultyCalculationResult = {
      recommendedLevel: adjustedDifficulty,
      confidence: this.calculateConfidence(performanceAnalysis, context),
      reasoning: this.generateReasoningExplanation(
        performanceAnalysis,
        cefrProgression,
        context
      ),
      alternatives,
      validationMetrics
    };

    // Cache result
    this.difficultyCache.set(cacheKey, result);
    
    return result;
  }

  /**
   * Perform real-time difficulty adjustment during active sessions
   */
  async adjustRealTime(
    currentLevel: DifficultyLevel,
    realtimeMetrics: RealTimePerformanceMetrics,
    context: DifficultyContext
  ): Promise<DifficultyAdjustment> {
    // Analyze real-time performance indicators
    const accuracyRate = realtimeMetrics.totalAttempts > 0 
      ? realtimeMetrics.correctAnswers / realtimeMetrics.totalAttempts 
      : 0.5;

    // Detect performance patterns
    const isStruggling = accuracyRate < 0.4 || realtimeMetrics.frustratedIndicators;
    const isBored = accuracyRate > 0.9 || realtimeMetrics.boredIndicators;
    const isOptimal = accuracyRate >= 0.6 && accuracyRate <= 0.8;

    let adjustmentDirection = 0; // -1: easier, 0: no change, 1: harder
    let adjustmentMagnitude = 0; // 0-1 how much to adjust

    if (isStruggling) {
      adjustmentDirection = -1;
      adjustmentMagnitude = this.calculateAdjustmentMagnitude(accuracyRate, 'struggling');
    } else if (isBored) {
      adjustmentDirection = 1;
      adjustmentMagnitude = this.calculateAdjustmentMagnitude(accuracyRate, 'bored');
    }

    // Calculate new difficulty level
    const recommendedDifficulty = this.applyRealTimeAdjustment(
      currentLevel,
      adjustmentDirection,
      adjustmentMagnitude
    );

    // Generate adjustment reasoning
    const adjustmentReason = this.generateRealTimeAdjustmentReason(
      realtimeMetrics,
      isStruggling,
      isBored,
      isOptimal
    );

    return {
      currentDifficulty: currentLevel,
      recommendedDifficulty,
      adjustmentReason,
      confidence: realtimeMetrics.confidenceLevel,
      gradualAdjustment: !isStruggling, // Immediate adjustment if struggling
      timeframe: isStruggling ? 'immediate' : 'next-question',
      specificAdjustments: this.generateSpecificAdjustments(currentLevel, recommendedDifficulty)
    };
  }

  /**
   * Assess CEFR progression and readiness for next level
   */
  async assessCEFRProgression(userId: string): Promise<CEFRProgression> {
    // Get or create progression record
    if (!this.cefrProgressions.has(userId)) {
      // Initialize default progression
      const defaultProgression: CEFRProgression = {
        currentLevel: 'A2', // Default starting level
        subLevel: 0,
        nextLevel: 'B1',
        progressToNext: 0,
        estimatedTimeToNext: 90, // days
        strengthAreas: [],
        developmentAreas: [],
        readinessForNext: {
          overallReadiness: 0,
          skillReadiness: {},
          recommendedFocus: [],
          estimatedPreparationTime: 90,
          confidenceLevel: 'low'
        }
      };
      this.cefrProgressions.set(userId, defaultProgression);
    }

    return this.cefrProgressions.get(userId)!;
  }

  /**
   * Update CEFR progression based on new performance data
   */
  async updateCEFRProgress(
    userId: string,
    performanceData: AdaptiveProgressMetrics
  ): Promise<CEFRProgression> {
    const currentProgression = await this.assessCEFRProgression(userId);
    
    // Calculate progression updates based on performance
    const subLevelIncrease = this.calculateSubLevelIncrease(performanceData);
    const newSubLevel = Math.min(100, currentProgression.subLevel + subLevelIncrease);
    
    // Check if ready for next CEFR level
    const readinessAssessment = this.assessReadinessForNextLevel(
      currentProgression,
      performanceData
    );

    // Update progression
    const updatedProgression: CEFRProgression = {
      ...currentProgression,
      subLevel: newSubLevel,
      progressToNext: this.calculateProgressToNext(newSubLevel, readinessAssessment),
      estimatedTimeToNext: this.estimateTimeToNextLevel(readinessAssessment, performanceData),
      readinessForNext: readinessAssessment
    };

    // Check for level promotion
    if (readinessAssessment.overallReadiness >= 80 && newSubLevel >= 90) {
      updatedProgression.currentLevel = this.getNextCEFRLevel(currentProgression.currentLevel);
      updatedProgression.nextLevel = this.getNextCEFRLevel(updatedProgression.currentLevel);
      updatedProgression.subLevel = 0;
      updatedProgression.progressToNext = 0;
    }

    this.cefrProgressions.set(userId, updatedProgression);
    return updatedProgression;
  }

  /**
   * Analyze user performance over specified timeframe
   */
  async analyzePerformance(
    userId: string,
    timeframe: 'session' | 'week' | 'month'
  ): Promise<PerformanceBasedCalculation> {
    // Get or create performance record
    if (!this.performanceHistory.has(userId)) {
      // Initialize with default values
      const defaultPerformance: PerformanceBasedCalculation = {
        accuracyTrend: [0.5, 0.5, 0.5, 0.5, 0.5],
        speedTrend: [30, 30, 30, 30, 30], // seconds
        consistencyScore: 50,
        improvementVelocity: 0,
        plateauDetection: false,
        optimalDifficultyRange: [30, 70],
        currentPerformanceLevel: 50
      };
      this.performanceHistory.set(userId, defaultPerformance);
    }

    return this.performanceHistory.get(userId)!;
  }

  /**
   * Process user feedback about difficulty perception
   */
  async processFeedback(
    userId: string,
    feedback: UserDifficultyFeedback
  ): Promise<void> {
    // Get current performance analysis
    const performance = await this.analyzePerformance(userId, 'session');
    
    // Adjust performance metrics based on feedback
    const feedbackAdjustment = this.calculateFeedbackAdjustment(feedback);
    
    // Update performance history
    const updatedPerformance = {
      ...performance,
      currentPerformanceLevel: Math.max(0, Math.min(100, 
        performance.currentPerformanceLevel + feedbackAdjustment
      ))
    };
    
    this.performanceHistory.set(userId, updatedPerformance);

    // Clear cache to force recalculation
    Array.from(this.difficultyCache.keys())
      .filter(key => key.startsWith(userId))
      .forEach(key => this.difficultyCache.delete(key));
  }

  /**
   * Validate difficulty adjustment
   */
  async validateAdjustment(
    adjustment: DifficultyAdjustment,
    context: DifficultyContext
  ): Promise<ValidationMetrics> {
    const difficultyDelta = adjustment.recommendedDifficulty.overall - 
                           adjustment.currentDifficulty.overall;
    
    return {
      expectedAccuracy: this.predictAccuracy(adjustment.recommendedDifficulty, context),
      expectedEngagement: this.predictEngagement(adjustment.recommendedDifficulty, context),
      expectedFrustration: this.predictFrustration(difficultyDelta, context),
      expectedCompletionTime: this.predictCompletionTime(adjustment.recommendedDifficulty, context),
      riskFactors: this.identifyRiskFactors(adjustment, context)
    };
  }

  // Private helper methods
  private initializeCEFRMappings(): void {
    // Initialize CEFR level mappings and difficulty curves
    // This would typically be loaded from configuration or database
  }

  private calculateBaseDifficultyFromCEFR(level: CEFRLevel): DifficultyLevel {
    const cefrDifficultyMap: Record<CEFRLevel, number> = {
      'A1': 20, 'A2': 35, 'B1': 50, 'B2': 65, 'C1': 80, 'C2': 95
    };

    const baseValue = cefrDifficultyMap[level] || 50;

    return {
      overall: baseValue,
      cognitive: baseValue,
      linguistic: baseValue,
      contextual: baseValue - 5,
      timeConstraint: baseValue - 10,
      cefrAlignment: level,
      description: `${level} level difficulty`
    };
  }

  private calculatePerformanceAdjustment(
    performanceAnalysis: PerformanceBasedCalculation,
    recentPerformance: AdaptiveProgressMetrics
  ): number {
    const accuracyFactor = performanceAnalysis.accuracyTrend.slice(-3).reduce((a, b) => a + b) / 3;
    const consistencyFactor = performanceAnalysis.consistencyScore / 100;
    const improvementFactor = performanceAnalysis.improvementVelocity;

    // Calculate adjustment (-20 to +20 points)
    let adjustment = 0;

    if (accuracyFactor > 0.8) adjustment += 10; // Increase difficulty
    else if (accuracyFactor < 0.5) adjustment -= 10; // Decrease difficulty

    if (consistencyFactor > 0.8) adjustment += 5; // Stable performance
    if (improvementFactor > 0.1) adjustment += 5; // Rapid improvement

    return Math.max(-20, Math.min(20, adjustment));
  }

  private calculateRealTimeAdjustment(metrics: RealTimePerformanceMetrics): number {
    const accuracy = metrics.totalAttempts > 0 
      ? metrics.correctAnswers / metrics.totalAttempts 
      : 0.5;

    let adjustment = 0;

    if (accuracy < 0.3) adjustment = -15; // Much easier
    else if (accuracy < 0.5) adjustment = -8; // Easier
    else if (accuracy > 0.9) adjustment = 10; // Harder
    else if (accuracy > 0.8) adjustment = 5; // Slightly harder

    // Apply engagement modifiers
    if (metrics.boredIndicators) adjustment += 5;
    if (metrics.frustratedIndicators) adjustment -= 8;

    return adjustment;
  }

  private combineAdjustments(
    baseDifficulty: DifficultyLevel,
    performanceAdjustment: number,
    realTimeAdjustment: number,
    cefrProgression: CEFRProgression
  ): DifficultyLevel {
    const totalAdjustment = performanceAdjustment + realTimeAdjustment;
    
    // Apply CEFR constraints
    const cefrConstraint = this.applyCEFRConstraints(
      baseDifficulty.overall + totalAdjustment,
      cefrProgression
    );

    return {
      overall: cefrConstraint,
      cognitive: Math.max(0, Math.min(100, baseDifficulty.cognitive + totalAdjustment)),
      linguistic: Math.max(0, Math.min(100, baseDifficulty.linguistic + totalAdjustment)),
      contextual: Math.max(0, Math.min(100, baseDifficulty.contextual + totalAdjustment)),
      timeConstraint: Math.max(0, Math.min(100, baseDifficulty.timeConstraint + totalAdjustment * 0.7)),
      cefrAlignment: baseDifficulty.cefrAlignment,
      description: `Adapted ${baseDifficulty.cefrAlignment} level (${totalAdjustment > 0 ? '+' : ''}${totalAdjustment})`
    };
  }

  private applyCEFRConstraints(suggestedDifficulty: number, progression: CEFRProgression): number {
    // Ensure difficulty stays within reasonable bounds for current CEFR level
    const cefrBounds = this.getCEFRDifficultyBounds(progression.currentLevel);
    
    return Math.max(cefrBounds.min, Math.min(cefrBounds.max, suggestedDifficulty));
  }

  private getCEFRDifficultyBounds(level: CEFRLevel): { min: number, max: number } {
    const bounds: Record<CEFRLevel, { min: number, max: number }> = {
      'A1': { min: 10, max: 40 },
      'A2': { min: 25, max: 55 },
      'B1': { min: 35, max: 70 },
      'B2': { min: 50, max: 85 },
      'C1': { min: 65, max: 95 },
      'C2': { min: 80, max: 100 }
    };
    
    return bounds[level] || { min: 30, max: 70 };
  }

  // Additional helper methods for completeness...
  private generateAlternatives(recommendedLevel: DifficultyLevel, context: DifficultyContext): DifficultyLevel[] {
    return [
      { ...recommendedLevel, overall: Math.max(0, recommendedLevel.overall - 10) },
      { ...recommendedLevel, overall: Math.min(100, recommendedLevel.overall + 10) }
    ];
  }

  private calculateConfidence(performance: PerformanceBasedCalculation, context: DifficultyContext): number {
    // Base confidence on data quality and consistency
    const dataPoints = performance.accuracyTrend.length;
    const consistency = performance.consistencyScore / 100;
    const hasRecentData = context.currentSession !== undefined;
    
    let confidence = 0.5; // Base confidence
    
    if (dataPoints >= 5) confidence += 0.2;
    if (consistency > 0.7) confidence += 0.2;
    if (hasRecentData) confidence += 0.1;
    
    return Math.min(1.0, confidence);
  }

  private generateAdjustmentReason(
    performance: PerformanceBasedCalculation, 
    context: DifficultyContext
  ): DifficultyAdjustmentReason {
    const recentAccuracy = performance.accuracyTrend.slice(-3).reduce((a, b) => a + b) / 3;
    
    let learningVelocity: 'too-fast' | 'optimal' | 'too-slow' = 'optimal';
    if (recentAccuracy > 0.85) learningVelocity = 'too-fast';
    else if (recentAccuracy < 0.5) learningVelocity = 'too-slow';
    
    return {
      primaryFactors: ['Performance analysis', 'CEFR alignment', 'Real-time metrics'],
      performanceIndicators: [`Accuracy: ${(recentAccuracy * 100).toFixed(1)}%`],
      learningVelocity,
      frustrationLevel: context.realTimeMetrics?.frustratedIndicators ? 'high' : 'low',
      boredLevel: context.realTimeMetrics?.boredIndicators ? 'high' : 'low',
      confidenceLevel: recentAccuracy > 0.7 ? 'high' : recentAccuracy > 0.5 ? 'medium' : 'low',
      explanation: `Difficulty adjusted based on recent performance trends and real-time indicators.`
    };
  }

  private shouldGraduallyAdjust(performance: PerformanceBasedCalculation): boolean {
    return performance.consistencyScore > 60; // Gradual if performance is consistent
  }

  private determineAdjustmentTimeframe(context: DifficultyContext): 'immediate' | 'next-question' | 'next-section' | 'next-session' {
    if (context.realTimeMetrics?.frustratedIndicators) return 'immediate';
    if (context.realTimeMetrics?.boredIndicators) return 'next-question';
    return 'next-section';
  }

  private generateSpecificAdjustments(current: DifficultyLevel, target: DifficultyLevel): SpecificAdjustment[] {
    const adjustments: SpecificAdjustment[] = [];
    
    // Check for significant differences in difficulty aspects
    if (Math.abs(current.cognitive - target.cognitive) > 5) {
      adjustments.push({
        aspect: 'vocabulary',
        currentValue: current.cognitive,
        targetValue: target.cognitive,
        reasoning: 'Cognitive complexity adjustment based on performance'
      });
    }
    
    if (Math.abs(current.linguistic - target.linguistic) > 5) {
      adjustments.push({
        aspect: 'grammar',
        currentValue: current.linguistic,
        targetValue: target.linguistic,
        reasoning: 'Linguistic complexity adjustment based on performance'
      });
    }
    
    return adjustments;
  }

  private generateReasoningExplanation(
    performance: PerformanceBasedCalculation,
    progression: CEFRProgression,
    context: DifficultyContext
  ): string {
    const accuracy = performance.accuracyTrend.slice(-3).reduce((a, b) => a + b) / 3;
    const trend = performance.improvementVelocity > 0 ? 'improving' : 
                  performance.improvementVelocity < 0 ? 'declining' : 'stable';
    
    return `Based on ${(accuracy * 100).toFixed(1)}% recent accuracy, ${trend} performance trend, ` +
           `and current ${progression.currentLevel} CEFR level with ${progression.progressToNext.toFixed(1)}% ` +
           `progress to next level.`;
  }

  private calculateAdjustmentMagnitude(accuracy: number, situation: 'struggling' | 'bored'): number {
    if (situation === 'struggling') {
      if (accuracy < 0.2) return 0.8; // Large adjustment
      if (accuracy < 0.3) return 0.6; // Medium adjustment
      return 0.4; // Small adjustment
    } else { // bored
      if (accuracy > 0.95) return 0.6; // Medium adjustment
      return 0.3; // Small adjustment
    }
  }

  private applyRealTimeAdjustment(
    currentLevel: DifficultyLevel,
    direction: number,
    magnitude: number
  ): DifficultyLevel {
    const adjustment = direction * magnitude * 20; // Scale to difficulty points
    
    return {
      ...currentLevel,
      overall: Math.max(0, Math.min(100, currentLevel.overall + adjustment)),
      cognitive: Math.max(0, Math.min(100, currentLevel.cognitive + adjustment)),
      linguistic: Math.max(0, Math.min(100, currentLevel.linguistic + adjustment)),
      description: `${currentLevel.description} (${adjustment > 0 ? '+' : ''}${adjustment.toFixed(0)})`
    };
  }

  private generateRealTimeAdjustmentReason(
    metrics: RealTimePerformanceMetrics,
    isStruggling: boolean,
    isBored: boolean,
    isOptimal: boolean
  ): DifficultyAdjustmentReason {
    const accuracy = metrics.totalAttempts > 0 ? metrics.correctAnswers / metrics.totalAttempts : 0.5;
    
    let explanation = '';
    let learningVelocity: 'too-fast' | 'optimal' | 'too-slow' = 'optimal';
    
    if (isStruggling) {
      explanation = `User showing signs of struggle with ${(accuracy * 100).toFixed(1)}% accuracy`;
      learningVelocity = 'too-slow';
    } else if (isBored) {
      explanation = `User demonstrating mastery with ${(accuracy * 100).toFixed(1)}% accuracy`;
      learningVelocity = 'too-fast';
    } else {
      explanation = `User performing optimally with ${(accuracy * 100).toFixed(1)}% accuracy`;
    }
    
    return {
      primaryFactors: ['Real-time accuracy', 'Engagement indicators', 'Response patterns'],
      performanceIndicators: [`${metrics.correctAnswers}/${metrics.totalAttempts} correct`],
      learningVelocity,
      frustrationLevel: metrics.frustratedIndicators ? 'high' : 'low',
      boredLevel: metrics.boredIndicators ? 'high' : 'low',
      confidenceLevel: metrics.confidenceLevel > 0.7 ? 'high' : 'medium',
      explanation
    };
  }

  private calculateSubLevelIncrease(performanceData: AdaptiveProgressMetrics): number {
    // Calculate sub-level increase based on performance (0-10 points)
    const baseIncrease = 2; // Base progression per session
    const accuracyBonus = (performanceData.accuracy - 0.5) * 10; // -5 to +5
    const consistencyBonus = performanceData.consistency > 0.8 ? 2 : 0;
    
    return Math.max(0, Math.min(10, baseIncrease + accuracyBonus + consistencyBonus));
  }

  private assessReadinessForNextLevel(
    progression: CEFRProgression,
    performanceData: AdaptiveProgressMetrics
  ): ReadinessAssessment {
    const overallReadiness = Math.min(100, (progression.subLevel * 0.7) + (performanceData.accuracy * 30));
    
    return {
      overallReadiness,
      skillReadiness: {
        'reading': overallReadiness,
        'writing': overallReadiness * 0.9,
        'listening': overallReadiness * 0.8,
        'speaking': overallReadiness * 0.7
      },
      recommendedFocus: overallReadiness < 80 ? ['grammar', 'vocabulary'] : ['fluency', 'complexity'],
      estimatedPreparationTime: Math.max(7, Math.round((100 - overallReadiness) * 0.7)),
      confidenceLevel: overallReadiness > 75 ? 'high' : overallReadiness > 50 ? 'medium' : 'low'
    };
  }

  private calculateProgressToNext(subLevel: number, readiness: ReadinessAssessment): number {
    return (subLevel * 0.6) + (readiness.overallReadiness * 0.4);
  }

  private estimateTimeToNextLevel(readiness: ReadinessAssessment, performance: AdaptiveProgressMetrics): number {
    const baseTime = readiness.estimatedPreparationTime;
    const performanceModifier = performance.accuracy > 0.7 ? 0.8 : performance.accuracy > 0.5 ? 1.0 : 1.3;
    
    return Math.round(baseTime * performanceModifier);
  }

  private getNextCEFRLevel(current: CEFRLevel): CEFRLevel {
    const progression: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = progression.indexOf(current);
    return progression[Math.min(currentIndex + 1, progression.length - 1)];
  }

  private calculateFeedbackAdjustment(feedback: UserDifficultyFeedback): number {
    let adjustment = 0;
    
    if (feedback.perceivedDifficulty === 'too-easy') adjustment = 5;
    else if (feedback.perceivedDifficulty === 'too-hard') adjustment = -5;
    
    if (feedback.frustration > 3) adjustment -= 3;
    if (feedback.enjoyment < 3) adjustment -= 2;
    
    return adjustment;
  }

  // Prediction methods
  private predictAccuracy(level: DifficultyLevel, context: DifficultyContext): number {
    // Simple prediction model - would be more sophisticated in practice
    const userLevel = this.estimateUserLevel(context);
    const difficultyDelta = level.overall - userLevel;
    
    if (difficultyDelta < -20) return 0.9; // Too easy
    if (difficultyDelta > 20) return 0.3; // Too hard
    
    return 0.7 - (difficultyDelta * 0.01); // Linear approximation
  }

  private predictEngagement(level: DifficultyLevel, context: DifficultyContext): number {
    const predictedAccuracy = this.predictAccuracy(level, context);
    
    // Optimal engagement around 70% accuracy
    const engagementCurve = 1 - Math.abs(predictedAccuracy - 0.7) * 2;
    return Math.max(0.2, Math.min(1.0, engagementCurve));
  }

  private predictFrustration(difficultyDelta: number, context: DifficultyContext): number {
    if (difficultyDelta > 15) return 0.8; // Significant increase
    if (difficultyDelta > 5) return 0.4; // Moderate increase
    if (difficultyDelta < -10) return 0.2; // Might be boring
    return 0.1; // Minimal frustration
  }

  private predictCompletionTime(level: DifficultyLevel, context: DifficultyContext): number {
    const baseTime = 15; // Base 15 minutes per session
    const difficultyModifier = level.overall / 50; // Scale with difficulty
    const userLevelModifier = context.currentLevel === 'A1' ? 1.5 : 
                             context.currentLevel === 'A2' ? 1.3 :
                             context.currentLevel === 'B1' ? 1.0 :
                             context.currentLevel === 'B2' ? 0.9 : 0.8;
    
    return Math.round(baseTime * difficultyModifier * userLevelModifier);
  }

  private identifyRiskFactors(adjustment: DifficultyAdjustment, context: DifficultyContext): string[] {
    const risks: string[] = [];
    
    const difficultyIncrease = adjustment.recommendedDifficulty.overall - adjustment.currentDifficulty.overall;
    
    if (difficultyIncrease > 20) risks.push('Large difficulty increase may cause frustration');
    if (adjustment.confidence < 0.5) risks.push('Low confidence in adjustment recommendation');
    if (context.realTimeMetrics?.frustratedIndicators) risks.push('User already showing frustration signs');
    if (adjustment.timeframe === 'immediate') risks.push('Immediate adjustment may be disruptive');
    
    return risks;
  }

  private estimateUserLevel(context: DifficultyContext): number {
    const cefrValues: Record<CEFRLevel, number> = {
      'A1': 20, 'A2': 35, 'B1': 50, 'B2': 65, 'C1': 80, 'C2': 95
    };
    
    return cefrValues[context.currentLevel] || 50;
  }
}

// Export default instance
export const adaptiveDifficultyEngine = new AdaptiveDifficultyEngine();

// Utility functions for component integration
export function createDifficultyContext(
  userId: string,
  sessionId: string,
  userProfile: UserProfile,
  recentPerformance: AdaptiveProgressMetrics,
  assessmentHistory: AssessmentResults[] = []
): DifficultyContext {
  return {
    userId,
    sessionId,
    userProfile,
    currentLevel: userProfile.cefrLevel,
    targetLevel: userProfile.targetCefrLevel || userProfile.cefrLevel,
    recentPerformance,
    assessmentHistory
  };
}

export function updateRealTimeMetrics(
  existingMetrics: RealTimePerformanceMetrics | undefined,
  newResponse: {
    isCorrect: boolean;
    responseTime: number;
    confidence?: number;
    engagement?: number;
    strugglingWith?: string[];
  }
): RealTimePerformanceMetrics {
  const metrics = existingMetrics || {
    correctAnswers: 0,
    totalAttempts: 0,
    averageResponseTime: 0,
    strugglingIndicators: [],
    confidenceLevel: 0.5,
    engagementScore: 0.5,
    frustratedIndicators: false,
    boredIndicators: false,
    lastUpdated: new Date()
  };

  return {
    ...metrics,
    correctAnswers: metrics.correctAnswers + (newResponse.isCorrect ? 1 : 0),
    totalAttempts: metrics.totalAttempts + 1,
    averageResponseTime: (metrics.averageResponseTime * metrics.totalAttempts + newResponse.responseTime) / (metrics.totalAttempts + 1),
    strugglingIndicators: newResponse.strugglingWith || metrics.strugglingIndicators,
    confidenceLevel: newResponse.confidence !== undefined ? newResponse.confidence : metrics.confidenceLevel,
    engagementScore: newResponse.engagement !== undefined ? newResponse.engagement : metrics.engagementScore,
    frustratedIndicators: newResponse.responseTime > 60 || (newResponse.confidence && newResponse.confidence < 0.3),
    boredIndicators: newResponse.responseTime < 3 || (newResponse.confidence && newResponse.confidence > 0.9),
    lastUpdated: new Date()
  };
}