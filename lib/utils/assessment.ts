import { CEFRLevel } from './progress';

// Assessment question types
export type QuestionType = 'multiple-choice' | 'fill-blank' | 'essay' | 'listening' | 'speaking' | 'ordering';

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
  attempt: AssessmentAttempt;
  skillBreakdown: Record<string, { correct: number; total: number; percentage: number }>;
  cefrLevelAnalysis: {
    currentLevel: CEFRLevel;
    demonstratedLevel: CEFRLevel;
    readinessForNext: number; // percentage
  };
  detailedFeedback: AssessmentFeedback[];
  studyRecommendations: string[];
  nextAssessmentSuggestion?: string;
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
    const difficultyMap: Record<CEFRLevel, number[]> = {
      'A1': [1, 2],
      'A2': [1, 2, 3],
      'B1': [2, 3],
      'B2': [2, 3, 4],
      'C1': [3, 4, 5],
      'C2': [4, 5]
    };

    const allowedDifficulties = difficultyMap[cefrLevel];
    const questionTypes: QuestionType[] = ['multiple-choice', 'fill-blank'];
    
    // Add essay questions for higher levels
    if (['B2', 'C1', 'C2'].includes(cefrLevel)) {
      questionTypes.push('essay');
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
    difficulty: number,
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

      default:
        throw new Error(`Unsupported question type: ${type}`);
    }
  }

  private static getRandomSkillArea(): AssessmentQuestion['skillArea'] {
    const areas: AssessmentQuestion['skillArea'][] = ['grammar', 'vocabulary', 'comprehension', 'communication', 'business-context'];
    return areas[Math.floor(Math.random() * areas.length)];
  }

  private static getQuestionTemplate(type: QuestionType, skillArea: string): string {
    const templates = this.questionTemplates[type]?.[skillArea];
    if (!templates) {
      return `Which option best demonstrates ${skillArea} skills in this business context?`;
    }
    return templates[Math.floor(Math.random() * templates.length)];
  }

  private static generateMCOptions(skillArea: string, cefrLevel: CEFRLevel): string[] {
    // Generate contextually appropriate multiple choice options
    const baseOptions = {
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
      ]
    };

    return baseOptions[skillArea] || baseOptions.communication;
  }

  private static getCorrectFillBlank(skillArea: string, cefrLevel: CEFRLevel): string {
    const answers = {
      grammar: ['schedule', 'will be', 'would'],
      vocabulary: ['review', 'discuss', 'draw'],
      communication: ['propose', 'suggest', 'recommend']
    };

    return answers[skillArea]?.[0] || 'schedule';
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

// Adaptive difficulty system
export class AdaptiveDifficultyEngine {
  static adjustDifficulty(
    currentLevel: CEFRLevel,
    recentPerformance: number[],
    skillWeaknesses: string[]
  ): {
    suggestedLevel: CEFRLevel;
    focusAreas: string[];
    difficultyAdjustment: number; // -2 to +2
  } {
    const avgPerformance = recentPerformance.reduce((a, b) => a + b, 0) / recentPerformance.length;
    const levels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    const currentIndex = levels.indexOf(currentLevel);
    
    let difficultyAdjustment = 0;
    let suggestedLevel = currentLevel;

    if (avgPerformance >= 85) {
      // Performing well, increase difficulty
      difficultyAdjustment = 1;
      if (currentIndex < levels.length - 1) {
        suggestedLevel = levels[currentIndex + 1];
      }
    } else if (avgPerformance < 60) {
      // Struggling, decrease difficulty
      difficultyAdjustment = -1;
      if (currentIndex > 0) {
        suggestedLevel = levels[currentIndex - 1];
      }
    }

    return {
      suggestedLevel,
      focusAreas: skillWeaknesses,
      difficultyAdjustment
    };
  }

  static generateAdaptiveQuestions(
    baseAssessment: Assessment,
    userWeaknesses: string[],
    performanceHistory: number[]
  ): AssessmentQuestion[] {
    const adaptedQuestions = [...baseAssessment.questions];
    
    // Focus more on weak areas
    userWeaknesses.forEach(weakness => {
      const weaknessQuestions = adaptedQuestions.filter(q => q.skillArea === weakness);
      if (weaknessQuestions.length < 3) {
        // Generate additional questions for weak areas
        const additionalQ = AssessmentGenerator.generateAssessment(
          baseAssessment.cefrLevel,
          baseAssessment.businessContext,
          [weakness],
          10,
          2
        );
        adaptedQuestions.push(...additionalQ.questions);
      }
    });

    return adaptedQuestions;
  }
}