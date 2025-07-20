// CEFR Level type
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// Assessment question types
export type QuestionType = 'multiple-choice' | 'fill-blank' | 'essay' | 'listening' | 'speaking' | 'ordering';

// Assessment session management
export interface AssessmentSession {
  id: string;
  assessmentId: string;
  userId: string;
  currentQuestionIndex: number;
  answers: Record<string, any>;
  startTime: string;
  startedAt: string; // ISO string - when session started
  endTime?: string;
  completedAt?: string; // ISO string - when session completed
  isCompleted: boolean;
  isPaused: boolean;
  timeRemaining?: number; // in seconds
  timeSpent: number; // total time spent in seconds
  status: 'in-progress' | 'completed' | 'abandoned' | 'paused';
  score?: number; // percentage score if completed
  adaptiveDifficultyHistory: number[];
  adaptiveState?: any; // adaptive state object
  sessionMetrics: {
    questionsAttempted: number;
    correctAnswers: number;
    averageTimePerQuestion: number;
    difficultyProgression: number[];
  };
}

export interface AssessmentQuestion {
  id: string;
  type: QuestionType;
  question: string;
  context?: string; // Business context for the question
  options?: string[]; // For multiple choice
  correctAnswer?: string | string[]; // Correct answer(s)
  explanation?: string;
  cefrLevel: CEFRLevel;
  skillArea: 'grammar' | 'vocabulary' | 'comprehension' | 'communication' | 'business-context';
  difficulty: 1 | 2 | 3 | 4 | 5; // 1 = easiest, 5 = hardest
  timeLimit?: number; // in seconds
  points: number;
  businessScenario?: string;
}

export interface Assessment {
  id: string;
  title: string;
  description: string;
  cefrLevel: CEFRLevel;
  duration: number; // in minutes
  totalPoints: number;
  questions: AssessmentQuestion[];
  createdAt: string;
  businessContext: string;
  learningObjectives: string[];
  passingScore: number; // percentage
  adaptiveDifficulty: boolean;
  // Optional properties used by components
  tags?: string[];
  popularity?: number;
  completionRate?: number;
  averageScore?: number;
  estimatedTime?: number;
}

export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  userId: string;
  startedAt: string;
  completedAt?: string;
  answers: Record<string, any>; // questionId -> answer
  score: number;
  percentage: number;
  passed: boolean;
  timeSpent: number; // in seconds
  feedback: AssessmentFeedback[];
  nextRecommendations?: string[];
}

export interface AssessmentFeedback {
  questionId: string;
  isCorrect: boolean;
  userAnswer: any;
  correctAnswer: any;
  explanation: string;
  skillAreaFeedback: string;
  improvementSuggestions: string[];
}

export interface AssessmentResults {
  id: string;
  attempt: AssessmentAttempt;
  skillBreakdown: Record<string, { correct: number; total: number; percentage: number; score: number }>;
  cefrLevelAnalysis: {
    currentLevel: CEFRLevel;
    demonstratedLevel: CEFRLevel;
    readinessForNext: number; // percentage
    skillLevels: Record<string, CEFRLevel>;
  };
  feedback: {
    overall: string;
    strengths: string[];
    improvements: string[];
    nextSteps: string[];
  };
  detailedFeedback: AssessmentFeedback[];
  studyRecommendations: string[];
  nextAssessmentSuggestion?: string;
  recommendations: {
    nextAssessment: string;
    studyAreas: string[];
    resources: string[];
  };
}

// Adaptive difficulty system interfaces
export interface AdaptiveDifficultyConfig {
  enabled: boolean;
  initialDifficulty: number; // 1-5 scale
  adjustmentSensitivity: number; // 0.1-1.0, how quickly to adjust
  maxDifficultyJump: number; // max change per adjustment
  performanceWindow: number; // number of recent questions to consider
  targetAccuracy: number; // target accuracy percentage (70-80%)
  minimumQuestions: number; // minimum questions before adjusting
}

export interface DifficultyAdjustment {
  fromDifficulty: number;
  toDifficulty: number;
  reason: string;
  confidence: number; // 0-1 confidence in the adjustment
  questionIndex: number;
  performanceData: {
    recentAccuracy: number;
    recentSpeed: number; // questions per minute
    streakCount: number;
    errorPattern: string[];
  };
}

export interface AdaptiveAssessmentState {
  currentDifficulty: number;
  difficultyHistory: DifficultyAdjustment[];
  performanceMetrics: {
    overallAccuracy: number;
    currentStreak: number;
    longestStreak: number;
    averageTimePerQuestion: number;
    difficultyStability: number; // how stable the difficulty has been
  };
  learningProfile: {
    preferredDifficulty: number;
    learningSpeed: 'slow' | 'medium' | 'fast';
    strengthAreas: string[];
    challengeAreas: string[];
    adaptationStyle: 'conservative' | 'moderate' | 'aggressive';
  };
}

// Assessment generation templates
export class AssessmentGenerator {
  private static businessScenarios = [
    'Client meeting preparation',
    'Email communication with international partners',
    'Presentation to stakeholders',
    'Negotiating contracts',
    'Project status updates',
    'Performance reviews',
    'Sales calls and follow-ups',
    'Cross-cultural team collaboration',
    'Budget planning discussions',
    'Crisis management communication'
  ];

  private static questionTemplates = {
    'multiple-choice': {
      grammar: [
        'In a business meeting, which sentence is most appropriate?',
        'When writing a formal email, which phrase should you use?',
        'For presenting quarterly results, the correct tense is:'
      ],
      vocabulary: [
        'What is the best business term for this situation?',
        'Which word has the most professional tone?',
        'In corporate communication, this phrase means:'
      ],
      communication: [
        'How would you respond to this client concern?',
        'What is the most diplomatic way to decline this request?',
        'Which approach shows best business etiquette?'
      ]
    },
    'fill-blank': {
      grammar: [
        'Complete this business email: "I would like to _______ a meeting."',
        'Fill in the gap: "The project _______ completed by Friday."',
        'Complete: "We _______ appreciate your prompt response."'
      ],
      vocabulary: [
        'Fill the blank with appropriate business vocabulary: "Please _______ the attached proposal."',
        'Complete with the right term: "Let\'s _______ this in our next meeting."',
        'Fill in: "I\'d like to _______ your attention to the budget changes."'
      ]
    },
    'essay': {
      communication: [
        'Write a brief response to this client complaint:',
        'Compose a follow-up email after a successful meeting:',
        'Explain how you would handle this workplace conflict:'
      ],
      'business-context': [
        'Describe your approach to leading a cross-cultural team:',
        'Explain how you would present budget cuts to your team:',
        'Write about your strategy for improving client relationships:'
      ]
    }
  };

  static generateAssessment(
    cefrLevel: CEFRLevel,
    businessContext: string,
    learningObjectives: string[],
    duration: number = 30,
    questionCount: number = 15
  ): Assessment {
    const questions: AssessmentQuestion[] = [];
    const difficultyMap: Record<CEFRLevel, (1 | 2 | 3 | 4 | 5)[]> = {
      'A1': [1, 2],
      'A2': [1, 2, 3],
      'B1': [2, 3],
      'B2': [2, 3, 4],
      'C1': [3, 4, 5],
      'C2': [4, 5]
    };

    const allowedDifficulties = difficultyMap[cefrLevel];
    let questionTypes: QuestionType[] = ['multiple-choice', 'fill-blank'];
    
    // Add question types based on CEFR level
    if (['A2', 'B1', 'B2', 'C1', 'C2'].includes(cefrLevel)) {
      questionTypes.push('ordering');
    }
    if (['B1', 'B2', 'C1', 'C2'].includes(cefrLevel)) {
      questionTypes.push('listening');
    }
    if (['B2', 'C1', 'C2'].includes(cefrLevel)) {
      questionTypes.push('essay', 'speaking');
    }

    for (let i = 0; i < questionCount; i++) {
      const questionType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
      const skillArea = this.getRandomSkillArea();
      const difficulty = allowedDifficulties[Math.floor(Math.random() * allowedDifficulties.length)];
      const scenario = this.businessScenarios[Math.floor(Math.random() * this.businessScenarios.length)];

      const question = this.generateQuestion(
        questionType,
        skillArea,
        cefrLevel,
        difficulty,
        scenario,
        businessContext
      );

      questions.push({
        ...question,
        id: `q${i + 1}`,
        points: difficulty * 2 // 2-10 points based on difficulty
      });
    }

    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

    return {
      id: `assessment_${Date.now()}`,
      title: `${cefrLevel} Level ${businessContext} Assessment`,
      description: `Comprehensive assessment covering ${learningObjectives.join(', ')} at CEFR ${cefrLevel} level`,
      cefrLevel,
      duration,
      totalPoints,
      questions,
      createdAt: new Date().toISOString(),
      businessContext,
      learningObjectives,
      passingScore: 70, // 70% to pass
      adaptiveDifficulty: true
    };
  }

  private static generateQuestion(
    type: QuestionType,
    skillArea: AssessmentQuestion['skillArea'],
    cefrLevel: CEFRLevel,
    difficulty: 1 | 2 | 3 | 4 | 5,
    scenario: string,
    businessContext: string
  ): Omit<AssessmentQuestion, 'id' | 'points'> {
    const base = {
      type,
      cefrLevel,
      skillArea,
      difficulty,
      businessScenario: scenario,
      timeLimit: type === 'essay' ? 300 : 60 // 5 minutes for essays, 1 minute for others
    };

    switch (type) {
      case 'multiple-choice':
        return {
          ...base,
          question: `${scenario}: ${this.getQuestionTemplate(type, skillArea)}`,
          options: this.generateMCOptions(skillArea, cefrLevel),
          correctAnswer: 'A', // Would be determined by the specific question
          explanation: `This choice demonstrates appropriate ${skillArea} for ${cefrLevel} level in ${scenario.toLowerCase()}.`,
          context: `Business scenario: ${scenario} in ${businessContext}`
        };

      case 'fill-blank':
        return {
          ...base,
          question: `${scenario}: ${this.getQuestionTemplate(type, skillArea)}`,
          correctAnswer: this.getCorrectFillBlank(skillArea, cefrLevel),
          explanation: `The correct answer shows proper ${skillArea} usage at ${cefrLevel} level.`,
          context: `Complete this ${businessContext} communication`
        };

      case 'essay':
        return {
          ...base,
          question: `${scenario}: ${this.getQuestionTemplate(type, skillArea)}`,
          explanation: `Your response should demonstrate clear ${skillArea} skills appropriate for ${cefrLevel} level.`,
          context: `Write 100-150 words addressing this ${businessContext} situation`
        };

      case 'listening':
        return {
          ...base,
          question: `Listen to this ${scenario.toLowerCase()} audio clip and answer: ${this.getQuestionTemplate('multiple-choice', skillArea)}`,
          options: this.generateMCOptions(skillArea, cefrLevel),
          correctAnswer: 'A',
          explanation: `This demonstrates listening comprehension for ${skillArea} at ${cefrLevel} level.`,
          context: `Audio-based question for ${businessContext}`,
          timeLimit: 120 // 2 minutes for listening questions
        };

      case 'speaking':
        return {
          ...base,
          question: `Record your response to this ${scenario.toLowerCase()}: ${this.getQuestionTemplate(type, skillArea)}`,
          explanation: `Your speaking response should show ${skillArea} proficiency at ${cefrLevel} level.`,
          context: `Record 60-90 seconds addressing this ${businessContext} situation`,
          timeLimit: 180 // 3 minutes prep + recording
        };

      case 'ordering':
        return {
          ...base,
          question: `Put these ${scenario.toLowerCase()} steps in the correct order:`,
          options: this.generateOrderingOptions(skillArea, scenario),
          correctAnswer: ['1', '2', '3', '4'], // Would be actual ordering
          explanation: `Correct sequencing shows understanding of ${skillArea} processes.`,
          context: `Arrange the steps for this ${businessContext} process`
        };

      default:
        throw new Error(`Unsupported question type: ${type}`);
    }
  }

  private static getRandomSkillArea(): AssessmentQuestion['skillArea'] {
    const areas: AssessmentQuestion['skillArea'][] = ['grammar', 'vocabulary', 'comprehension', 'communication', 'business-context'];
    return areas[Math.floor(Math.random() * areas.length)];
  }

  private static getQuestionTemplate(type: QuestionType, skillArea: AssessmentQuestion['skillArea']): string {
    const templates = this.questionTemplates[type]?.[skillArea];
    if (!templates) {
      return `Which option best demonstrates ${skillArea} skills in this business context?`;
    }
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private static generateMCOptions(skillArea: AssessmentQuestion['skillArea'], cefrLevel: CEFRLevel): string[] {
    // Generate contextually appropriate multiple choice options
    const baseOptions: Record<AssessmentQuestion['skillArea'], string[]> = {
      grammar: [
        'Option with correct grammar usage',
        'Option with common grammar mistake',
        'Option with formal business structure',
        'Option with informal structure'
      ],
      vocabulary: [
        'Professional business terminology',
        'Casual everyday language',
        'Technical jargon',
        'Appropriate level vocabulary'
      ],
      communication: [
        'Direct and diplomatic response',
        'Too aggressive approach',
        'Overly passive response',
        'Culturally sensitive approach'
      ],
      comprehension: [
        'Clear understanding demonstrated',
        'Misunderstanding evident',
        'Partial comprehension shown',
        'Complete comprehension displayed'
      ],
      'business-context': [
        'Appropriate business response',
        'Too informal for context',
        'Overly formal approach',
        'Context-sensitive solution'
      ]
    };

    return baseOptions[skillArea] || baseOptions.communication;
  }

  private static getCorrectFillBlank(skillArea: AssessmentQuestion['skillArea'], cefrLevel: CEFRLevel): string {
    const answers: Record<AssessmentQuestion['skillArea'], string[]> = {
      grammar: ['schedule', 'will be', 'would'],
      vocabulary: ['review', 'discuss', 'draw'],
      communication: ['propose', 'suggest', 'recommend'],
      comprehension: ['understand', 'analyze', 'interpret'],
      'business-context': ['negotiate', 'collaborate', 'facilitate']
    };

    return answers[skillArea]?.[0] || 'schedule';
  }

  private static generateOrderingOptions(skillArea: AssessmentQuestion['skillArea'], scenario: string): string[] {
    const orderingScenarios: Record<string, string[]> = {
      'Client meeting preparation': [
        'Review client background and previous interactions',
        'Prepare agenda and discussion points',
        'Gather relevant documents and materials',
        'Confirm meeting details and send reminders'
      ],
      'Email communication with international partners': [
        'Draft initial message with clear subject line',
        'Review cultural communication preferences',
        'Include all necessary attachments',
        'Proofread and send with follow-up plan'
      ],
      'Project status updates': [
        'Collect progress data from team members',
        'Analyze current status against milestones',
        'Prepare summary with key achievements and challenges',
        'Distribute update to stakeholders'
      ]
    };

    return orderingScenarios[scenario] || [
      'Step 1: Initial preparation',
      'Step 2: Main execution phase',
      'Step 3: Review and quality check',
      'Step 4: Final delivery and follow-up'
    ];
  }
}

// Assessment scoring and feedback system
export class AssessmentScorer {
  static scoreAssessment(assessment: Assessment, answers: Record<string, any>): AssessmentResults {
    const feedback: AssessmentFeedback[] = [];
    let totalCorrect = 0;
    let totalPoints = 0;
    let earnedPoints = 0;
    const skillBreakdown: Record<string, { correct: number; total: number; percentage: number }> = {};

    // Initialize skill breakdown
    const skillAreas = ['grammar', 'vocabulary', 'comprehension', 'communication', 'business-context'];
    skillAreas.forEach(skill => {
      skillBreakdown[skill] = { correct: 0, total: 0, percentage: 0 };
    });

    // Score each question
    assessment.questions.forEach(question => {
      const userAnswer = answers[question.id];
      const isCorrect = this.evaluateAnswer(question, userAnswer);
      
      totalPoints += question.points;
      if (isCorrect) {
        totalCorrect++;
        earnedPoints += question.points;
        skillBreakdown[question.skillArea].correct++;
      }
      skillBreakdown[question.skillArea].total++;

      feedback.push({
        questionId: question.id,
        isCorrect,
        userAnswer,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation || '',
        skillAreaFeedback: this.getSkillAreaFeedback(question.skillArea, isCorrect),
        improvementSuggestions: this.getImprovementSuggestions(question.skillArea, question.cefrLevel)
      });
    });

    // Calculate skill percentages
    Object.keys(skillBreakdown).forEach(skill => {
      const data = skillBreakdown[skill];
      if (data.total > 0) {
        data.percentage = Math.round((data.correct / data.total) * 100);
      }
    });

    const percentage = Math.round((earnedPoints / totalPoints) * 100);
    const cefrAnalysis = this.analyzeCEFRLevel(assessment.cefrLevel, percentage, skillBreakdown);

    const attempt: AssessmentAttempt = {
      id: `attempt_${Date.now()}`,
      assessmentId: assessment.id,
      userId: 'current_user', // Would come from auth context
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      answers,
      score: earnedPoints,
      percentage,
      timeSpent: 0, // Would be calculated from actual timing
      feedback
    };

    return {
      attempt,
      skillBreakdown,
      cefrLevelAnalysis: cefrAnalysis,
      detailedFeedback: feedback,
      studyRecommendations: this.generateStudyRecommendations(skillBreakdown, assessment.cefrLevel),
      nextAssessmentSuggestion: this.suggestNextAssessment(cefrAnalysis, assessment.cefrLevel)
    };
  }

  private static evaluateAnswer(question: AssessmentQuestion, userAnswer: any): boolean {
    if (!userAnswer) return false;

    switch (question.type) {
      case 'multiple-choice':
        return userAnswer === question.correctAnswer;
      
      case 'fill-blank':
        if (Array.isArray(question.correctAnswer)) {
          return question.correctAnswer.includes(userAnswer.toLowerCase());
        }
        return userAnswer.toLowerCase().trim() === question.correctAnswer?.toLowerCase();
      
      case 'essay':
        // For essays, we'd typically use AI scoring or manual review
        // For now, return a placeholder score based on length and keywords
        return this.scoreEssayAnswer(userAnswer, question);
      
      default:
        return false;
    }
  }

  private static scoreEssayAnswer(userAnswer: string, question: AssessmentQuestion): boolean {
    if (!userAnswer || userAnswer.trim().length < 50) return false;
    
    // Simple scoring based on length and business vocabulary
    const businessKeywords = ['project', 'team', 'client', 'meeting', 'proposal', 'deadline', 'budget'];
    const hasBusinessVocab = businessKeywords.some(keyword => 
      userAnswer.toLowerCase().includes(keyword)
    );
    
    return userAnswer.length >= 100 && hasBusinessVocab;
  }

  private static getSkillAreaFeedback(skillArea: string, isCorrect: boolean): string {
    const feedbackMap = {
      grammar: isCorrect ? 'Excellent grammar usage!' : 'Review grammar rules for business communication',
      vocabulary: isCorrect ? 'Great vocabulary choice!' : 'Focus on expanding business vocabulary',
      comprehension: isCorrect ? 'Good understanding!' : 'Practice reading comprehension skills',
      communication: isCorrect ? 'Effective communication!' : 'Work on communication strategies',
      'business-context': isCorrect ? 'Shows business awareness!' : 'Study business scenarios and contexts'
    };
    
    return feedbackMap[skillArea] || 'Keep practicing!';
  }

  private static getImprovementSuggestions(skillArea: string, cefrLevel: CEFRLevel): string[] {
    const suggestions = {
      grammar: [
        'Practice business email templates',
        'Review formal vs informal language rules',
        'Study conditional sentences for negotiations'
      ],
      vocabulary: [
        'Learn industry-specific terminology',
        'Practice phrasal verbs in business contexts',
        'Study collocations for professional settings'
      ],
      communication: [
        'Practice diplomatic language',
        'Study cultural communication differences',
        'Work on presentation skills'
      ]
    };

    return suggestions[skillArea] || ['Continue regular practice', 'Seek feedback from colleagues'];
  }

  private static analyzeCEFRLevel(
    currentLevel: CEFRLevel,
    percentage: number,
    skillBreakdown: Record<string, { correct: number; total: number; percentage: number }>
  ) {
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levels.indexOf(currentLevel);
    
    let demonstratedLevel = currentLevel;
    let readinessForNext = 0;

    if (percentage >= 85) {
      // Strong performance suggests readiness for next level
      demonstratedLevel = levels[Math.min(currentIndex + 1, levels.length - 1)];
      readinessForNext = 85;
    } else if (percentage >= 70) {
      // Solid at current level
      readinessForNext = percentage;
    } else {
      // May need to review previous level concepts
      if (currentIndex > 0) {
        demonstratedLevel = levels[currentIndex - 1];
      }
      readinessForNext = Math.max(0, percentage - 20);
    }

    return {
      currentLevel,
      demonstratedLevel,
      readinessForNext
    };
  }

  private static generateStudyRecommendations(
    skillBreakdown: Record<string, { correct: number; total: number; percentage: number }>,
    cefrLevel: CEFRLevel
  ): string[] {
    const recommendations: string[] = [];
    
    Object.entries(skillBreakdown).forEach(([skill, data]) => {
      if (data.total > 0 && data.percentage < 70) {
        recommendations.push(`Focus on ${skill}: ${data.percentage}% accuracy needs improvement`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push(`Excellent work! Continue practicing at ${cefrLevel} level`);
      recommendations.push('Consider challenging yourself with more complex business scenarios');
    }

    return recommendations;
  }

  private static suggestNextAssessment(
    cefrAnalysis: { demonstratedLevel: CEFRLevel; readinessForNext: number },
    currentLevel: CEFRLevel
  ): string {
    if (cefrAnalysis.readinessForNext >= 80) {
      return `Consider taking a ${cefrAnalysis.demonstratedLevel} level assessment`;
    } else if (cefrAnalysis.readinessForNext < 50) {
      return `Practice more ${currentLevel} level content before retaking`;
    } else {
      return `Continue with ${currentLevel} level practice assessments`;
    }
  }
}


// Assessment session management
export class AssessmentSessionManager {
  static createSession(
    assessmentId: string, 
    userId: string,
    adaptiveState?: AdaptiveAssessmentState
  ): AssessmentSession {
    return {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      assessmentId,
      userId,
      currentQuestionIndex: 0,
      answers: {},
      startTime: new Date().toISOString(),
      isCompleted: false,
      isPaused: false,
      adaptiveDifficultyHistory: adaptiveState?.difficultyHistory.map(h => h.toDifficulty) || [],
      sessionMetrics: {
        questionsAttempted: 0,
        correctAnswers: 0,
        averageTimePerQuestion: 0,
        difficultyProgression: adaptiveState ? [adaptiveState.currentDifficulty] : []
      }
    };
  }

  static saveAnswer(
    session: AssessmentSession, 
    questionId: string, 
    answer: any,
    isCorrect?: boolean,
    questionDifficulty?: number
  ): AssessmentSession {
    const updatedSession = { ...session };
    updatedSession.answers[questionId] = answer;
    updatedSession.sessionMetrics.questionsAttempted++;
    
    if (isCorrect !== undefined) {
      if (isCorrect) {
        updatedSession.sessionMetrics.correctAnswers++;
      }
    }
    
    if (questionDifficulty !== undefined) {
      updatedSession.sessionMetrics.difficultyProgression.push(questionDifficulty);
    }
    
    return updatedSession;
  }

  static nextQuestion(session: AssessmentSession): AssessmentSession {
    const updatedSession = { ...session };
    updatedSession.currentQuestionIndex++;
    return updatedSession;
  }

  static pauseSession(session: AssessmentSession): AssessmentSession {
    const updatedSession = { ...session };
    updatedSession.isPaused = true;
    return updatedSession;
  }

  static resumeSession(session: AssessmentSession): AssessmentSession {
    const updatedSession = { ...session };
    updatedSession.isPaused = false;
    return updatedSession;
  }

  static completeSession(session: AssessmentSession): AssessmentSession {
    const updatedSession = { ...session };
    updatedSession.isCompleted = true;
    updatedSession.endTime = new Date().toISOString();
    return updatedSession;
  }

  static calculateTimeSpent(session: AssessmentSession): number {
    if (!session.endTime) return 0;
    const start = new Date(session.startTime).getTime();
    const end = new Date(session.endTime).getTime();
    return Math.round((end - start) / 1000); // seconds
  }

  static getSessionProgress(session: AssessmentSession, totalQuestions: number): {
    percentage: number;
    current: number;
    total: number;
    questionsRemaining: number;
  } {
    const current = session.currentQuestionIndex + 1;
    const percentage = Math.round((current / totalQuestions) * 100);
    const questionsRemaining = totalQuestions - current;

    return {
      percentage: Math.min(percentage, 100),
      current: Math.min(current, totalQuestions),
      total: totalQuestions,
      questionsRemaining: Math.max(questionsRemaining, 0)
    };
  }

  // Adaptive difficulty methods
  static updateSessionWithDifficultyAdjustment(
    session: AssessmentSession,
    adjustment: DifficultyAdjustment
  ): AssessmentSession {
    const updatedSession = { ...session };
    
    // Add difficulty to history
    updatedSession.adaptiveDifficultyHistory.push(adjustment.toDifficulty);
    
    // Update progression
    updatedSession.sessionMetrics.difficultyProgression.push(adjustment.toDifficulty);
    
    return updatedSession;
  }

  static calculateSessionDifficultyMetrics(session: AssessmentSession): {
    averageDifficulty: number;
    difficultyRange: { min: number; max: number };
    adjustmentCount: number;
    stabilityScore: number;
  } {
    const progression = session.sessionMetrics.difficultyProgression;
    
    if (progression.length === 0) {
      return {
        averageDifficulty: 3,
        difficultyRange: { min: 3, max: 3 },
        adjustmentCount: 0,
        stabilityScore: 1.0
      };
    }

    const averageDifficulty = progression.reduce((sum, d) => sum + d, 0) / progression.length;
    const min = Math.min(...progression);
    const max = Math.max(...progression);
    
    // Count actual adjustments (changes in difficulty)
    let adjustmentCount = 0;
    for (let i = 1; i < progression.length; i++) {
      if (progression[i] !== progression[i - 1]) {
        adjustmentCount++;
      }
    }

    // Calculate stability (inverse of variance)
    const variance = progression.reduce((sum, d) => sum + Math.pow(d - averageDifficulty, 2), 0) / progression.length;
    const stabilityScore = Math.max(0, 1 - (variance / 4)); // Normalize by max possible variance

    return {
      averageDifficulty: Math.round(averageDifficulty * 10) / 10,
      difficultyRange: { min, max },
      adjustmentCount,
      stabilityScore: Math.round(stabilityScore * 100) / 100
    };
  }

  static getAdaptiveSessionSummary(session: AssessmentSession): {
    performance: {
      accuracy: number;
      questionsPerMinute: number;
      currentStreak: number;
    };
    difficulty: {
      current: number;
      average: number;
      adjustments: number;
      stability: number;
    };
    recommendations: string[];
  } {
    const accuracy = session.sessionMetrics.questionsAttempted > 0 
      ? (session.sessionMetrics.correctAnswers / session.sessionMetrics.questionsAttempted) * 100 
      : 0;

    const sessionDuration = Date.now() - new Date(session.startTime).getTime();
    const questionsPerMinute = session.sessionMetrics.questionsAttempted > 0 
      ? (session.sessionMetrics.questionsAttempted / (sessionDuration / 60000)) 
      : 0;

    const difficultyMetrics = this.calculateSessionDifficultyMetrics(session);
    const currentDifficulty = session.sessionMetrics.difficultyProgression.length > 0 
      ? session.sessionMetrics.difficultyProgression[session.sessionMetrics.difficultyProgression.length - 1] 
      : 3;

    // Generate recommendations based on performance
    const recommendations: string[] = [];
    
    if (accuracy > 85) {
      recommendations.push("Excellent accuracy! Consider moving to higher difficulty questions.");
    } else if (accuracy < 60) {
      recommendations.push("Focus on accuracy. Take your time with each question.");
    }

    if (questionsPerMinute > 2) {
      recommendations.push("Good pacing! You're answering questions efficiently.");
    } else if (questionsPerMinute < 0.5) {
      recommendations.push("Consider increasing your pace to complete the assessment on time.");
    }

    if (difficultyMetrics.adjustmentCount > 3) {
      recommendations.push("Your performance is helping us find your optimal difficulty level.");
    }

    if (difficultyMetrics.stabilityScore < 0.5) {
      recommendations.push("We're still calibrating the difficulty. Stay focused and answer to the best of your ability.");
    }

    return {
      performance: {
        accuracy: Math.round(accuracy),
        questionsPerMinute: Math.round(questionsPerMinute * 10) / 10,
        currentStreak: session.sessionMetrics.correctAnswers // Simplified for now
      },
      difficulty: {
        current: currentDifficulty,
        average: difficultyMetrics.averageDifficulty,
        adjustments: difficultyMetrics.adjustmentCount,
        stability: difficultyMetrics.stabilityScore
      },
      recommendations
    };
  }
}

// Assessment export utilities
export class AssessmentExporter {
  static exportResultsToJSON(results: AssessmentResults): string {
    const exportData = {
      exportDate: new Date().toISOString(),
      assessment: {
        id: results.attempt.assessmentId,
        completedAt: results.attempt.completedAt,
        score: results.attempt.score,
        percentage: results.attempt.percentage,
        timeSpent: results.attempt.timeSpent
      },
      skillBreakdown: results.skillBreakdown,
      cefrAnalysis: results.cefrLevelAnalysis,
      recommendations: results.studyRecommendations,
      detailedFeedback: results.detailedFeedback.map(f => ({
        questionId: f.questionId,
        isCorrect: f.isCorrect,
        feedback: f.skillAreaFeedback,
        suggestions: f.improvementSuggestions
      }))
    };

    return JSON.stringify(exportData, null, 2);
  }

  static exportResultsToCSV(results: AssessmentResults): string {
    const headers = [
      'Question ID',
      'Skill Area',
      'Correct',
      'User Answer',
      'Correct Answer',
      'Feedback'
    ];

    const rows = results.detailedFeedback.map(feedback => [
      feedback.questionId,
      'N/A', // Would need to get skill area from question
      feedback.isCorrect ? 'Yes' : 'No',
      String(feedback.userAnswer),
      String(feedback.correctAnswer),
      feedback.skillAreaFeedback
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    return csvContent;
  }

  static generatePDFReport(results: AssessmentResults): string {
    return `
# Assessment Results Report

**Date:** ${new Date(results.attempt.completedAt || '').toLocaleDateString()}
**Score:** ${results.attempt.score} points (${results.attempt.percentage}%)
**Time Spent:** ${Math.round(results.attempt.timeSpent / 60)} minutes

## CEFR Level Analysis
- **Current Level:** ${results.cefrLevelAnalysis.currentLevel}
- **Demonstrated Level:** ${results.cefrLevelAnalysis.demonstratedLevel}
- **Readiness for Next Level:** ${results.cefrLevelAnalysis.readinessForNext}%

## Skill Breakdown
${Object.entries(results.skillBreakdown)
  .filter(([_, data]) => data.total > 0)
  .map(([skill, data]) => `- **${skill}:** ${data.correct}/${data.total} (${data.percentage}%)`)
  .join('\n')}

## Study Recommendations
${results.studyRecommendations.map(rec => `- ${rec}`).join('\n')}

## Next Steps
${results.nextAssessmentSuggestion || 'Continue practicing at your current level.'}
    `.trim();
  }
}

// Adaptive Difficulty Engine
export class AdaptiveDifficultyEngine {
  private static readonly DEFAULT_CONFIG: AdaptiveDifficultyConfig = {
    enabled: true,
    initialDifficulty: 3,
    adjustmentSensitivity: 0.7,
    maxDifficultyJump: 1,
    performanceWindow: 5,
    targetAccuracy: 75,
    minimumQuestions: 3
  };

  static createAdaptiveState(
    userHistory?: AssessmentResults[],
    config: Partial<AdaptiveDifficultyConfig> = {}
  ): AdaptiveAssessmentState {
    const fullConfig = { ...this.DEFAULT_CONFIG, ...config };
    
    // Analyze user history to determine starting state
    const learningProfile = this.analyzeLearningProfile(userHistory || []);
    const preferredDifficulty = this.calculatePreferredDifficulty(userHistory || [], fullConfig);

    return {
      currentDifficulty: preferredDifficulty,
      difficultyHistory: [],
      performanceMetrics: {
        overallAccuracy: this.calculateHistoricalAccuracy(userHistory || []),
        currentStreak: 0,
        longestStreak: 0,
        averageTimePerQuestion: this.calculateAverageTime(userHistory || []),
        difficultyStability: 1.0
      },
      learningProfile
    };
  }

  static shouldAdjustDifficulty(
    session: AssessmentSession,
    state: AdaptiveAssessmentState,
    config: AdaptiveDifficultyConfig = this.DEFAULT_CONFIG
  ): boolean {
    // Must have minimum questions attempted
    if (session.sessionMetrics.questionsAttempted < config.minimumQuestions) {
      return false;
    }

    // Check if enough questions have passed since last adjustment
    const lastAdjustmentIndex = state.difficultyHistory.length > 0 
      ? state.difficultyHistory[state.difficultyHistory.length - 1].questionIndex 
      : -1;
    
    if (session.currentQuestionIndex - lastAdjustmentIndex < config.minimumQuestions) {
      return false;
    }

    return true;
  }

  static calculateNextDifficulty(
    session: AssessmentSession,
    state: AdaptiveAssessmentState,
    config: AdaptiveDifficultyConfig = this.DEFAULT_CONFIG
  ): DifficultyAdjustment | null {
    if (!this.shouldAdjustDifficulty(session, state, config)) {
      return null;
    }

    const recentPerformance = this.analyzeRecentPerformance(session, config);
    const difficultyDelta = this.calculateDifficultyDelta(recentPerformance, state, config);
    
    if (Math.abs(difficultyDelta) < 0.3) {
      return null; // Change too small to warrant adjustment
    }

    const newDifficulty = Math.max(1, Math.min(5, 
      state.currentDifficulty + Math.sign(difficultyDelta) * Math.min(config.maxDifficultyJump, Math.abs(difficultyDelta))
    ));

    if (newDifficulty === state.currentDifficulty) {
      return null; // No actual change
    }

    return {
      fromDifficulty: state.currentDifficulty,
      toDifficulty: newDifficulty,
      reason: this.generateAdjustmentReason(difficultyDelta, recentPerformance),
      confidence: this.calculateAdjustmentConfidence(recentPerformance, state),
      questionIndex: session.currentQuestionIndex,
      performanceData: recentPerformance
    };
  }

  static applyDifficultyAdjustment(
    state: AdaptiveAssessmentState,
    adjustment: DifficultyAdjustment
  ): AdaptiveAssessmentState {
    const newState = { ...state };
    
    // Update current difficulty
    newState.currentDifficulty = adjustment.toDifficulty;
    
    // Add to history
    newState.difficultyHistory = [...state.difficultyHistory, adjustment];
    
    // Update difficulty stability
    const recentAdjustments = newState.difficultyHistory.slice(-5);
    const difficultyVariance = this.calculateDifficultyVariance(recentAdjustments);
    newState.performanceMetrics.difficultyStability = Math.max(0, 1 - difficultyVariance / 2);
    
    return newState;
  }

  static selectAdaptiveQuestion(
    availableQuestions: AssessmentQuestion[],
    targetDifficulty: number,
    state: AdaptiveAssessmentState
  ): AssessmentQuestion | null {
    // Filter questions by target difficulty (±0.5 tolerance)
    const suitableQuestions = availableQuestions.filter(q => 
      Math.abs(q.difficulty - targetDifficulty) <= 0.5
    );

    if (suitableQuestions.length === 0) {
      // Fallback: find closest difficulty
      return availableQuestions.reduce((closest, current) => 
        Math.abs(current.difficulty - targetDifficulty) < Math.abs(closest.difficulty - targetDifficulty)
          ? current : closest
      );
    }

    // Prefer questions that target learning profile weaknesses
    const weakAreaQuestions = suitableQuestions.filter(q => 
      state.learningProfile.challengeAreas.includes(q.skillArea)
    );

    if (weakAreaQuestions.length > 0) {
      return this.selectRandomQuestion(weakAreaQuestions);
    }

    return this.selectRandomQuestion(suitableQuestions);
  }


  // Private helper methods
  private static analyzeLearningProfile(history: AssessmentResults[]): AdaptiveAssessmentState['learningProfile'] {
    if (history.length === 0) {
      return {
        preferredDifficulty: 3,
        learningSpeed: 'medium',
        strengthAreas: [],
        challengeAreas: [],
        adaptationStyle: 'moderate'
      };
    }

    // Analyze skill performance across history
    const skillPerformance: Record<string, number[]> = {};
    const completionTimes: number[] = [];

    history.forEach(result => {
      completionTimes.push(result.attempt.timeSpent);
      
      Object.entries(result.skillBreakdown).forEach(([skill, data]) => {
        if (!skillPerformance[skill]) {
          skillPerformance[skill] = [];
        }
        skillPerformance[skill].push(data.percentage);
      });
    });

    // Determine strength and challenge areas
    const strengthAreas: string[] = [];
    const challengeAreas: string[] = [];

    Object.entries(skillPerformance).forEach(([skill, scores]) => {
      const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      if (avgScore >= 80) {
        strengthAreas.push(skill);
      } else if (avgScore < 60) {
        challengeAreas.push(skill);
      }
    });

    // Determine learning speed based on completion times
    const avgTime = completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length;
    const learningSpeed = avgTime < 300 ? 'fast' : avgTime > 600 ? 'slow' : 'medium';

    // Determine adaptation style based on score variance
    const allScores = history.map(h => h.attempt.percentage);
    const scoreVariance = this.calculateVariance(allScores);
    const adaptationStyle = scoreVariance > 15 ? 'aggressive' : scoreVariance < 5 ? 'conservative' : 'moderate';

    return {
      preferredDifficulty: this.calculatePreferredDifficulty(history),
      learningSpeed,
      strengthAreas,
      challengeAreas,
      adaptationStyle
    };
  }

  private static calculatePreferredDifficulty(
    history: AssessmentResults[],
    config: AdaptiveDifficultyConfig = this.DEFAULT_CONFIG
  ): number {
    if (history.length === 0) {
      return config.initialDifficulty;
    }

    // Find difficulty level where user performs best (around target accuracy)
    const recentResults = history.slice(-5); // Last 5 assessments
    const avgAccuracy = recentResults.reduce((sum, r) => sum + r.attempt.percentage, 0) / recentResults.length;

    if (avgAccuracy > config.targetAccuracy + 10) {
      return Math.min(5, config.initialDifficulty + 1);
    } else if (avgAccuracy < config.targetAccuracy - 10) {
      return Math.max(1, config.initialDifficulty - 1);
    }

    return config.initialDifficulty;
  }

  private static analyzeRecentPerformance(
    session: AssessmentSession,
    config: AdaptiveDifficultyConfig
  ): DifficultyAdjustment['performanceData'] {
    const recentQuestions = Math.min(config.performanceWindow, session.sessionMetrics.questionsAttempted);
    const recentCorrect = Math.max(0, session.sessionMetrics.correctAnswers - 
      (session.sessionMetrics.questionsAttempted - recentQuestions));

    return {
      recentAccuracy: recentQuestions > 0 ? (recentCorrect / recentQuestions) * 100 : 0,
      recentSpeed: session.sessionMetrics.averageTimePerQuestion > 0 
        ? 60 / session.sessionMetrics.averageTimePerQuestion : 0,
      streakCount: session.sessionMetrics.correctAnswers, // Simplified for now
      errorPattern: [] // Would be populated with actual error analysis
    };
  }

  private static calculateDifficultyDelta(
    performance: DifficultyAdjustment['performanceData'],
    state: AdaptiveAssessmentState,
    config: AdaptiveDifficultyConfig
  ): number {
    const accuracyDelta = (performance.recentAccuracy - config.targetAccuracy) / 100;
    
    // Scale based on adaptation style
    const sensitivityMultiplier = state.learningProfile.adaptationStyle === 'aggressive' ? 1.5 :
                                 state.learningProfile.adaptationStyle === 'conservative' ? 0.5 : 1.0;

    return accuracyDelta * config.adjustmentSensitivity * sensitivityMultiplier;
  }

  private static generateAdjustmentReason(
    difficultyDelta: number,
    performance: DifficultyAdjustment['performanceData']
  ): string {
    if (difficultyDelta > 0) {
      return `Performance above target (${performance.recentAccuracy.toFixed(1)}% accuracy), increasing difficulty`;
    } else {
      return `Performance below target (${performance.recentAccuracy.toFixed(1)}% accuracy), decreasing difficulty`;
    }
  }

  private static calculateAdjustmentConfidence(
    performance: DifficultyAdjustment['performanceData'],
    state: AdaptiveAssessmentState
  ): number {
    // Higher confidence with more stable performance and sufficient data
    const stabilityFactor = state.performanceMetrics.difficultyStability;
    const dataFactor = Math.min(1, state.difficultyHistory.length / 10);
    const performanceFactor = Math.abs(performance.recentAccuracy - 75) / 25; // Distance from ideal
    
    return Math.max(0.3, Math.min(1.0, (stabilityFactor + dataFactor - performanceFactor) / 2));
  }

  private static calculateDifficultyVariance(adjustments: DifficultyAdjustment[]): number {
    if (adjustments.length < 2) return 0;
    
    const difficulties = adjustments.map(a => a.toDifficulty);
    return this.calculateVariance(difficulties);
  }

  private static calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  private static calculateHistoricalAccuracy(history: AssessmentResults[]): number {
    if (history.length === 0) return 0;
    
    const totalAccuracy = history.reduce((sum, result) => sum + result.attempt.percentage, 0);
    return totalAccuracy / history.length;
  }

  private static calculateAverageTime(history: AssessmentResults[]): number {
    if (history.length === 0) return 60; // Default 1 minute per question
    
    const totalQuestions = history.reduce((sum, result) => sum + result.detailedFeedback.length, 0);
    const totalTime = history.reduce((sum, result) => sum + result.attempt.timeSpent, 0);
    
    return totalQuestions > 0 ? totalTime / totalQuestions : 60;
  }

  private static selectRandomQuestion(questions: AssessmentQuestion[]): AssessmentQuestion {
    return questions[Math.floor(Math.random() * questions.length)];
  }

  private static generateQuestionPool(
    cefrLevel: CEFRLevel,
    businessContext: string,
    count: number
  ): AssessmentQuestion[] {
    // This would typically pull from a database or API
    // For now, generate varied difficulty questions
    const pool: AssessmentQuestion[] = [];
    
    for (let i = 0; i < count; i++) {
      const difficulty = Math.floor(Math.random() * 5) + 1;
      const skillAreas = ['grammar', 'vocabulary', 'comprehension', 'communication', 'business-context'] as const;
      const skillArea = skillAreas[Math.floor(Math.random() * skillAreas.length)];
      
      pool.push({
        id: `adaptive-q-${i}`,
        type: 'multiple-choice',
        question: `Adaptive ${businessContext} question (Level ${difficulty})`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'A',
        explanation: `This is an adaptive question at difficulty level ${difficulty}`,
        cefrLevel,
        skillArea,
        difficulty: difficulty as 1 | 2 | 3 | 4 | 5,
        timeLimit: 60 + (difficulty * 30),
        points: difficulty * 2,
        businessScenario: `${businessContext} scenario at ${cefrLevel} level`
      });
    }
    
    return pool;
  }

  static generateAdaptiveAssessment(
    baseAssessment: Assessment,
    userHistory: AssessmentResults[] = [],
    config: Partial<AdaptiveDifficultyConfig> = {}
  ): Assessment {
    const adaptiveState = this.createAdaptiveState(userHistory, config);
    
    // Create an adaptive version of the assessment
    const adaptiveAssessment: Assessment = {
      ...baseAssessment,
      id: `${baseAssessment.id}_adaptive_${Date.now()}`,
      title: `${baseAssessment.title} (Adaptive)`,
      adaptiveDifficulty: true
    };

    return adaptiveAssessment;
  }

  static updateSessionWithDifficultyAdjustment(
    session: AssessmentSession,
    adjustment: DifficultyAdjustment
  ): AssessmentSession {
    return {
      ...session,
      adaptiveDifficultyHistory: [...session.adaptiveDifficultyHistory, adjustment.toDifficulty]
    };
  }
}