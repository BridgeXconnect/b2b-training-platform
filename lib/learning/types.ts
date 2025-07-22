// Learning Path Optimization Types
// Story 5.3: Intelligent Learning Path Optimization

import { CEFRLevel, LearningStyle, LearningPace, ChallengeLevel } from '../types/user';
import { ContentType, DifficultyLevel, ContentGenerationContext } from '../content/types';
import { AssessmentResults } from '../utils/assessment';
import { LearningGoal } from '../utils/progress';

// Core learning path types
export interface LearningPathNode {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
  difficulty: DifficultyLevel;
  estimatedDuration: number; // minutes
  prerequisites: string[]; // node IDs
  skills: string[]; // skill areas covered
  businessRelevance: number; // 0-1 score
  cefrAlignment: CEFRLevel;
  metadata: {
    priority: 'low' | 'medium' | 'high' | 'critical';
    adaptiveWeight: number; // how much this affects path adaptation
    engagementScore: number; // predicted engagement 0-1
    completionRate: number; // historical completion rate
  };
}

export interface LearningPath {
  id: string;
  userId: string;
  title: string;
  description: string;
  goals: LearningGoal[];
  nodes: LearningPathNode[];
  connections: PathConnection[];
  metadata: {
    totalDuration: number;
    difficulty: DifficultyLevel;
    adaptationHistory: AdaptationEvent[];
    createdAt: Date;
    lastUpdated: Date;
    version: number;
  };
  progress: {
    currentNodeId: string | null;
    completedNodes: string[];
    timeSpent: number; // minutes
    startedAt: Date | null;
    estimatedCompletion: Date | null;
  };
}

export interface PathConnection {
  from: string; // node ID
  to: string; // node ID
  condition: 'always' | 'conditional' | 'assessment-based';
  requirements?: {
    minScore?: number;
    skillMastery?: Record<string, number>;
    timeSpent?: number;
  };
  adaptiveWeight: number; // how much this connection can be modified
}

// Learning analytics and adaptation
export interface LearningAnalytics {
  userId: string;
  learningPattern: {
    preferredContentTypes: ContentType[];
    optimalSessionLength: number; // minutes
    bestPerformanceTime: string; // time of day
    learningSpeed: LearningPace;
    retentionRate: number; // 0-1
    challengePreference: ChallengeLevel;
  };
  skillProfile: {
    strengths: SkillArea[];
    weaknesses: SkillArea[];
    rapidImprovement: SkillArea[];
    needsAttention: SkillArea[];
  };
  engagementMetrics: {
    averageSessionTime: number;
    completionRate: number;
    dropoffPoints: string[]; // content types where users typically stop
    motivationFactors: string[];
  };
  predictionModel: {
    successProbability: number; // 0-1 chance of completing path
    timeToCompletion: number; // days
    difficultyTolerance: number; // max difficulty user can handle
    burnoutRisk: number; // 0-1 risk of learning fatigue
  };
}

export interface SkillArea {
  name: string;
  category: 'grammar' | 'vocabulary' | 'comprehension' | 'communication' | 'business-context' | 'technical';
  level: number; // 0-100
  confidence: number; // 0-1 confidence in this assessment
  lastAssessed: Date;
  improvementRate: number; // points per week
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// Path optimization and adaptation
export interface AdaptationEvent {
  timestamp: Date;
  trigger: 'performance' | 'engagement' | 'time' | 'feedback' | 'manual';
  changes: {
    addedNodes: string[];
    removedNodes: string[];
    reorderedNodes: { nodeId: string; oldPosition: number; newPosition: number }[];
    modifiedConnections: string[];
  };
  reason: string;
  impact: {
    estimatedDurationChange: number; // minutes
    difficultyChange: number; // -1 to 1
    engagementImpact: number; // -1 to 1
  };
}

export interface PathOptimizationRequest {
  userId: string;
  currentPath?: LearningPath;
  learningGoals: LearningGoal[];
  constraints: {
    maxDuration?: number; // minutes
    availableTime?: number; // minutes per day
    deadline?: Date;
    difficulty: DifficultyLevel;
    focusAreas?: string[];
    businessPriorities?: string[];
  };
  preferences: {
    learningStyle: LearningStyle;
    contentTypes: ContentType[];
    challengeLevel: ChallengeLevel;
    pacePreference: LearningPace;
  };
  context: ContentGenerationContext;
}

export interface PathOptimizationResult {
  optimizedPath: LearningPath;
  recommendations: PathRecommendation[];
  alternatives: LearningPath[];
  rationale: {
    keyDecisions: string[];
    tradeoffs: string[];
    riskFactors: string[];
    successPredictions: Record<string, number>;
  };
}

export interface PathRecommendation {
  type: 'content' | 'pacing' | 'difficulty' | 'sequence' | 'focus';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  reasoning: string;
  impact: {
    learningEfficiency: number; // -1 to 1
    engagement: number; // -1 to 1
    timeToGoal: number; // -1 to 1 (negative = faster)
  };
  actionRequired: boolean;
}

// AI-driven path intelligence
export interface PathIntelligenceEngine {
  generateOptimalPath(request: PathOptimizationRequest): Promise<PathOptimizationResult>;
  adaptExistingPath(path: LearningPath, trigger: AdaptationEvent): Promise<LearningPath>;
  analyzeProgress(userId: string, pathId: string): Promise<LearningAnalytics>;
  predictOutcomes(path: LearningPath, userProfile: any): Promise<PathPrediction>;
  recommendNextContent(userId: string, currentContext: any): Promise<ContentRecommendation[]>;
}

export interface PathPrediction {
  completionProbability: number; // 0-1
  estimatedDuration: number; // days
  expectedChallenges: string[];
  riskFactors: string[];
  mitigationStrategies: string[];
  successMetrics: Record<string, number>;
}

export interface ContentRecommendation {
  content: any; // reference to generated content
  reason: string;
  confidence: number; // 0-1
  timing: 'immediate' | 'next-session' | 'this-week' | 'later';
  priority: 'low' | 'medium' | 'high' | 'critical';
}

// Integration with existing Epic 4 + 5 systems
export interface PathProgressEvent {
  type: 'node-started' | 'node-completed' | 'assessment-taken' | 'feedback-given' | 'difficulty-adjusted';
  nodeId: string;
  timestamp: Date;
  data: Record<string, any>;
  userId: string;
  pathId: string;
}