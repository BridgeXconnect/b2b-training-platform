import { 
  ContentGenerationContext, 
  GeneratedContent, 
  ContentSection, 
  Exercise,
  DifficultyLevel 
} from '../types';

// Specialized quiz and assessment generator
export class QuizGenerator {
  private static instance: QuizGenerator;
  
  public static getInstance(): QuizGenerator {
    if (!QuizGenerator.instance) {
      QuizGenerator.instance = new QuizGenerator();
    }
    return QuizGenerator.instance;
  }

  // Generate adaptive quiz based on user weaknesses
  public async generateAdaptiveQuiz(
    context: ContentGenerationContext,
    specifications: {
      topic: string;
      questionCount: number;
      timeLimit?: number;
      difficulty?: DifficultyLevel;
      focusAreas?: string[];
      includeExplanations?: boolean;
    }
  ): Promise<GeneratedContent> {
    const quizStructure = this.createQuizStructure(context, specifications);
    const content = await this.generateQuizSections(quizStructure, context, specifications);
    
    return {
      id: this.generateId(),
      type: 'quiz',
      title: `${specifications.topic} Assessment - ${context.businessDomain}`,
      description: `Adaptive ${context.cefrLevel} level quiz focusing on ${specifications.topic} with emphasis on ${context.weakAreas.join(', ')}`,
      content,
      metadata: {
        cefrLevel: context.cefrLevel,
        estimatedDuration: specifications.timeLimit || (specifications.questionCount * 2),
        difficulty: specifications.difficulty || this.mapCEFRToDifficulty(context.cefrLevel),
        topics: [specifications.topic, ...context.weakAreas],
        skills: this.identifyTestingSkills(context, specifications),
        businessRelevance: 0.9,
        sopIntegration: false,
        generationSource: 'adaptive',
        qualityScore: 0.9,
        engagementPrediction: 0.85
      },
      aiGenerated: true,
      generationTimestamp: new Date(),
      version: '1.0'
    };
  }

  // Generate diagnostic assessment to identify learning gaps
  public async generateDiagnosticAssessment(
    context: ContentGenerationContext,
    specifications: {
      scope: 'full' | 'targeted' | 'quick';
      skillAreas: string[];
      maxQuestions: number;
    }
  ): Promise<GeneratedContent> {
    const diagnosticStructure = this.createDiagnosticStructure(context, specifications);
    const content = await this.generateDiagnosticSections(diagnosticStructure, context, specifications);
    
    return {
      id: this.generateId(),
      type: 'quiz',
      title: `Diagnostic Assessment - ${context.businessDomain} English`,
      description: `Comprehensive diagnostic to identify strengths and areas for improvement in ${context.businessDomain} English`,
      content,
      metadata: {
        cefrLevel: context.cefrLevel,
        estimatedDuration: specifications.maxQuestions * 1.5,
        difficulty: 'intermediate',
        topics: specifications.skillAreas,
        skills: specifications.skillAreas,
        businessRelevance: 1.0,
        sopIntegration: false,
        generationSource: 'adaptive',
        qualityScore: 0.95,
        engagementPrediction: 0.8
      },
      aiGenerated: true,
      generationTimestamp: new Date(),
      version: '1.0'
    };
  }

  // Generate progress check quiz
  public async generateProgressQuiz(
    context: ContentGenerationContext,
    specifications: {
      previousTopics: string[];
      timeframe: 'weekly' | 'monthly' | 'unit';
      focusWeakAreas: boolean;
    }
  ): Promise<GeneratedContent> {
    const progressStructure = this.createProgressStructure(context, specifications);
    const content = await this.generateProgressSections(progressStructure, context, specifications);
    
    return {
      id: this.generateId(),
      type: 'quiz',
      title: `Progress Check - ${specifications.timeframe.charAt(0).toUpperCase() + specifications.timeframe.slice(1)}`,
      description: `Review and assessment of progress covering ${specifications.previousTopics.join(', ')}`,
      content,
      metadata: {
        cefrLevel: context.cefrLevel,
        estimatedDuration: 20,
        difficulty: this.mapCEFRToDifficulty(context.cefrLevel),
        topics: specifications.previousTopics,
        skills: ['reading', 'writing', 'vocabulary', 'grammar'],
        businessRelevance: 0.85,
        sopIntegration: false,
        generationSource: 'adaptive',
        qualityScore: 0.9,
        engagementPrediction: 0.8
      },
      aiGenerated: true,
      generationTimestamp: new Date(),
      version: '1.0'
    };
  }

  // Create quiz structure based on specifications
  private createQuizStructure(context: ContentGenerationContext, specs: any): QuizStructureTemplate {
    const questionTypes = this.selectQuestionTypes(context, specs);
    const difficultyProgression = this.createDifficultyProgression(context, specs);
    
    return {
      introduction: { required: true, estimatedTime: 2 },
      questionSections: this.organizeQuestionSections(questionTypes, difficultyProgression, specs),
      conclusion: { required: true, estimatedTime: 3 }
    };
  }

  // Generate quiz sections
  private async generateQuizSections(
    structure: QuizStructureTemplate,
    context: ContentGenerationContext,
    specs: any
  ): Promise<ContentSection[]> {
    const sections: ContentSection[] = [];

    // Introduction section
    sections.push(this.generateQuizIntroduction(context, specs));

    // Question sections
    for (const section of structure.questionSections) {
      sections.push(await this.generateQuestionSection(section, context, specs));
    }

    // Conclusion section
    sections.push(this.generateQuizConclusion(context, specs));

    return sections;
  }

  // Generate quiz introduction
  private generateQuizIntroduction(context: ContentGenerationContext, specs: any): ContentSection {
    const instructions = this.createQuizInstructions(context, specs);
    
    return {
      id: 'quiz-introduction',
      type: 'text',
      title: 'Assessment Instructions',
      content: `
**Welcome to your ${specs.topic} assessment!**

This quiz is designed to evaluate your understanding of ${specs.topic} in ${context.businessDomain} contexts.

**Instructions:**
${instructions.join('\n')}

**Assessment Details:**
• **Questions**: ${specs.questionCount}
• **Time Limit**: ${specs.timeLimit || (specs.questionCount * 2)} minutes
• **Difficulty Level**: ${context.cefrLevel}
• **Focus Areas**: ${context.weakAreas.join(', ')}

Take your time and do your best. Remember, this assessment helps identify areas for continued learning.
      `,
      instructions: 'Read all instructions carefully before beginning the assessment.'
    };
  }

  // Generate question section
  private async generateQuestionSection(
    section: QuestionSectionTemplate,
    context: ContentGenerationContext,
    specs: any
  ): Promise<ContentSection> {
    const exercises = await this.generateQuestions(section, context, specs);
    
    return {
      id: `questions-${section.type}`,
      type: 'question',
      title: `${section.title}`,
      content: section.instructions || `Complete the following ${section.type} questions.`,
      instructions: section.instructions,
      exercises
    };
  }

  // Generate questions for a section
  private async generateQuestions(
    section: QuestionSectionTemplate,
    context: ContentGenerationContext,
    specs: any
  ): Promise<Exercise[]> {
    const exercises: Exercise[] = [];
    
    for (let i = 0; i < section.questionCount; i++) {
      const difficulty = section.difficulties[i % section.difficulties.length];
      const exercise = await this.generateSingleQuestion(
        section.type,
        difficulty,
        context,
        specs,
        i + 1
      );
      exercises.push(exercise);
    }
    
    return exercises;
  }

  // Generate single question
  private async generateSingleQuestion(
    type: Exercise['type'],
    difficulty: DifficultyLevel,
    context: ContentGenerationContext,
    specs: any,
    questionNumber: number
  ): Promise<Exercise> {
    const questionData = this.createQuestionData(type, difficulty, context, specs, questionNumber);
    
    return {
      id: `question-${questionNumber}`,
      type,
      question: questionData.question,
      options: questionData.options,
      correctAnswer: questionData.correctAnswer,
      explanation: questionData.explanation,
      hints: questionData.hints,
      points: this.calculatePoints(difficulty, type),
      difficulty
    };
  }

  // Create question data based on type and context
  private createQuestionData(
    type: Exercise['type'],
    difficulty: DifficultyLevel,
    context: ContentGenerationContext,
    specs: any,
    questionNumber: number
  ): any {
    switch (type) {
      case 'multiple-choice':
        return this.createMultipleChoiceQuestion(difficulty, context, specs, questionNumber);
      case 'fill-blank':
        return this.createFillBlankQuestion(difficulty, context, specs, questionNumber);
      case 'matching':
        return this.createMatchingQuestion(difficulty, context, specs, questionNumber);
      case 'true-false':
        return this.createTrueFalseQuestion(difficulty, context, specs, questionNumber);
      case 'short-answer':
        return this.createShortAnswerQuestion(difficulty, context, specs, questionNumber);
      case 'ordering':
        return this.createOrderingQuestion(difficulty, context, specs, questionNumber);
      default:
        return this.createMultipleChoiceQuestion(difficulty, context, specs, questionNumber);
    }
  }

  // Question type generators
  private createMultipleChoiceQuestion(difficulty: DifficultyLevel, context: ContentGenerationContext, specs: any, num: number): any {
    const complexityLevel = this.getComplexityLevel(difficulty);
    
    return {
      question: `In ${context.businessDomain}, when discussing ${specs.topic}, which of the following ${complexityLevel} approaches would be most appropriate?`,
      options: [
        `Option A: ${complexityLevel} approach for ${context.businessDomain}`,
        `Option B: Alternative ${complexityLevel} method`,
        `Option C: Different ${complexityLevel} strategy`,
        `Option D: Another ${complexityLevel} option`
      ],
      correctAnswer: 'Option A',
      explanation: `Option A is correct because it demonstrates proper ${specs.topic} understanding at ${difficulty} level in ${context.businessDomain} context.`,
      hints: [`Consider the ${context.businessDomain} context`, `Think about ${specs.topic} best practices`]
    };
  }

  private createFillBlankQuestion(difficulty: DifficultyLevel, context: ContentGenerationContext, specs: any, num: number): any {
    return {
      question: `In ${context.businessDomain}, when implementing ${specs.topic}, you should always _____ before proceeding with the main task.`,
      correctAnswer: 'prepare thoroughly',
      explanation: `Preparation is essential in ${specs.topic} within ${context.businessDomain} to ensure successful outcomes.`,
      hints: [`Think about preparation steps`, `Consider ${context.businessDomain} requirements`]
    };
  }

  private createMatchingQuestion(difficulty: DifficultyLevel, context: ContentGenerationContext, specs: any, num: number): any {
    return {
      question: `Match the ${specs.topic} terms with their correct definitions in ${context.businessDomain} context:`,
      options: [
        'Term A | Definition 1',
        'Term B | Definition 2', 
        'Term C | Definition 3',
        'Term D | Definition 4'
      ],
      correctAnswer: 'Term A-Definition 1, Term B-Definition 2, Term C-Definition 3, Term D-Definition 4',
      explanation: `These matches correctly represent ${specs.topic} terminology used in ${context.businessDomain}.`,
      hints: [`Consider how terms are used in ${context.businessDomain}`, `Think about context clues`]
    };
  }

  private createTrueFalseQuestion(difficulty: DifficultyLevel, context: ContentGenerationContext, specs: any, num: number): any {
    return {
      question: `True or False: In ${context.businessDomain}, ${specs.topic} always requires formal documentation before implementation.`,
      correctAnswer: 'True',
      explanation: `This is true because ${context.businessDomain} typically requires formal documentation for ${specs.topic} processes.`,
      hints: [`Consider industry standards`, `Think about ${context.businessDomain} protocols`]
    };
  }

  private createShortAnswerQuestion(difficulty: DifficultyLevel, context: ContentGenerationContext, specs: any, num: number): any {
    return {
      question: `Briefly explain how ${specs.topic} principles apply in ${context.businessDomain}. Provide a specific example.`,
      correctAnswer: `${specs.topic} in ${context.businessDomain} involves [key principles] as demonstrated by [specific example].`,
      explanation: `A complete answer should include key principles and a relevant ${context.businessDomain} example.`,
      hints: [`Include both principles and examples`, `Make it specific to ${context.businessDomain}`]
    };
  }

  private createOrderingQuestion(difficulty: DifficultyLevel, context: ContentGenerationContext, specs: any, num: number): any {
    return {
      question: `Place the following ${specs.topic} steps in the correct order for ${context.businessDomain} implementation:`,
      options: [
        'Step A: Initial planning',
        'Step B: Implementation',
        'Step C: Assessment',
        'Step D: Follow-up'
      ],
      correctAnswer: 'A, C, B, D',
      explanation: `The correct sequence ensures proper ${specs.topic} implementation in ${context.businessDomain} contexts.`,
      hints: [`Think about logical progression`, `Consider ${context.businessDomain} best practices`]
    };
  }

  // Generate quiz conclusion
  private generateQuizConclusion(context: ContentGenerationContext, specs: any): ContentSection {
    return {
      id: 'quiz-conclusion',
      type: 'text',
      title: 'Assessment Complete',
      content: `
**Congratulations on completing your ${specs.topic} assessment!**

**What happens next:**
• Your responses will be analyzed to identify strengths and areas for improvement
• Personalized feedback will be provided for each question
• Recommendations for continued learning will be generated based on your performance
• Progress tracking will be updated to reflect your current skill level

**Remember:**
This assessment is designed to help you learn and grow. Use the feedback to guide your continued studies in ${context.businessDomain} English.

**Next Steps:**
• Review detailed feedback for each question
• Focus additional practice on identified weak areas  
• Consider retaking the assessment after additional study
• Proceed to recommended learning materials
      `,
      instructions: 'Take time to review your results and plan your next learning steps.'
    };
  }

  // Diagnostic and progress-specific methods
  private createDiagnosticStructure(context: ContentGenerationContext, specs: any): QuizStructureTemplate {
    const skillSections = specs.skillAreas.map((skill: string) => ({
      type: this.selectDiagnosticQuestionType(skill),
      title: `${skill.charAt(0).toUpperCase() + skill.slice(1)} Assessment`,
      questionCount: Math.ceil(specs.maxQuestions / specs.skillAreas.length),
      difficulties: this.createDiagnosticDifficulties(context)
    }));

    return {
      introduction: { required: true, estimatedTime: 3 },
      questionSections: skillSections,
      conclusion: { required: true, estimatedTime: 5 }
    };
  }

  private createProgressStructure(context: ContentGenerationContext, specs: any): QuizStructureTemplate {
    const topicSections = specs.previousTopics.map((topic: string) => ({
      type: 'multiple-choice' as Exercise['type'],
      title: `${topic} Review`,
      questionCount: Math.ceil(15 / specs.previousTopics.length),
      difficulties: [this.mapCEFRToDifficulty(context.cefrLevel)]
    }));

    return {
      introduction: { required: true, estimatedTime: 2 },
      questionSections: topicSections,
      conclusion: { required: true, estimatedTime: 3 }
    };
  }

  private async generateDiagnosticSections(structure: QuizStructureTemplate, context: ContentGenerationContext, specs: any): Promise<ContentSection[]> {
    // Similar to generateQuizSections but with diagnostic-specific content
    return this.generateQuizSections(structure, context, specs);
  }

  private async generateProgressSections(structure: QuizStructureTemplate, context: ContentGenerationContext, specs: any): Promise<ContentSection[]> {
    // Similar to generateQuizSections but with progress-specific content
    return this.generateQuizSections(structure, context, specs);
  }

  // Helper methods
  private selectQuestionTypes(context: ContentGenerationContext, specs: any): Exercise['type'][] {
    const baseTypes: Exercise['type'][] = ['multiple-choice', 'fill-blank', 'true-false'];
    
    if (['B2', 'C1', 'C2'].includes(context.cefrLevel)) {
      baseTypes.push('short-answer', 'matching');
    }
    
    if (['C1', 'C2'].includes(context.cefrLevel)) {
      baseTypes.push('ordering');
    }
    
    return baseTypes;
  }

  private createDifficultyProgression(context: ContentGenerationContext, specs: any): DifficultyLevel[] {
    const baseDifficulty = this.mapCEFRToDifficulty(context.cefrLevel);
    const progression: DifficultyLevel[] = [];
    
    for (let i = 0; i < specs.questionCount; i++) {
      if (i < specs.questionCount * 0.3) {
        progression.push(baseDifficulty);
      } else if (i < specs.questionCount * 0.7) {
        progression.push(baseDifficulty);
      } else {
        progression.push(baseDifficulty);
      }
    }
    
    return progression;
  }

  private organizeQuestionSections(types: Exercise['type'][], difficulties: DifficultyLevel[], specs: any): QuestionSectionTemplate[] {
    const sectionsPerType = Math.ceil(specs.questionCount / types.length);
    
    return types.map((type, index) => ({
      type,
      title: this.formatQuestionTypeTitle(type),
      questionCount: sectionsPerType,
      difficulties: difficulties.slice(index * sectionsPerType, (index + 1) * sectionsPerType),
      instructions: this.getQuestionTypeInstructions(type)
    }));
  }

  private createQuizInstructions(context: ContentGenerationContext, specs: any): string[] {
    return [
      '• Read each question carefully before selecting your answer',
      '• Choose the best answer from the available options',
      '• You can review and change your answers before submitting',
      `• This assessment focuses on ${specs.topic} in ${context.businessDomain} contexts`,
      '• Detailed explanations will be provided after completion'
    ];
  }

  private identifyTestingSkills(context: ContentGenerationContext, specs: any): string[] {
    const skills = ['reading', 'vocabulary'];
    
    if (specs.focusAreas?.includes('grammar')) skills.push('grammar');
    if (specs.focusAreas?.includes('writing')) skills.push('writing');
    if (context.weakAreas.includes('listening')) skills.push('listening');
    
    return skills;
  }

  private calculatePoints(difficulty: DifficultyLevel, type: Exercise['type']): number {
    const basePoints = {
      'multiple-choice': 10,
      'fill-blank': 12,
      'matching': 15,
      'true-false': 8,
      'short-answer': 20,
      'ordering': 15,
      'essay': 25
    };
    
    const difficultyMultiplier = {
      'beginner': 0.8,
      'elementary': 0.9,
      'intermediate': 1.0,
      'upper-intermediate': 1.2,
      'advanced': 1.4,
      'proficient': 1.6
    };
    
    return Math.round(basePoints[type] * difficultyMultiplier[difficulty]);
  }

  private getComplexityLevel(difficulty: DifficultyLevel): string {
    const mapping = {
      'beginner': 'basic',
      'elementary': 'simple', 
      'intermediate': 'standard',
      'upper-intermediate': 'detailed',
      'advanced': 'complex',
      'proficient': 'sophisticated'
    };
    return mapping[difficulty];
  }

  private selectDiagnosticQuestionType(skill: string): Exercise['type'] {
    const mapping: Record<string, Exercise['type']> = {
      'grammar': 'fill-blank',
      'vocabulary': 'multiple-choice',
      'reading': 'multiple-choice',
      'writing': 'short-answer',
      'listening': 'multiple-choice'
    };
    return mapping[skill] || 'multiple-choice';
  }

  private createDiagnosticDifficulties(context: ContentGenerationContext): DifficultyLevel[] {
    // Create a range of difficulties for diagnostic assessment
    return ['beginner', 'intermediate', 'advanced'] as DifficultyLevel[];
  }

  private formatQuestionTypeTitle(type: Exercise['type']): string {
    const titles = {
      'multiple-choice': 'Multiple Choice Questions',
      'fill-blank': 'Fill in the Blanks',
      'matching': 'Matching Exercise',
      'true-false': 'True or False',
      'short-answer': 'Short Answer Questions',
      'ordering': 'Sequence Ordering',
      'essay': 'Essay Questions'
    };
    return titles[type] || 'Questions';
  }

  private getQuestionTypeInstructions(type: Exercise['type']): string {
    const instructions = {
      'multiple-choice': 'Select the best answer from the four options provided.',
      'fill-blank': 'Type the correct word or phrase to complete each sentence.',
      'matching': 'Match each item on the left with the correct item on the right.',
      'true-false': 'Determine whether each statement is true or false.',
      'short-answer': 'Provide a brief written response to each question.',
      'ordering': 'Arrange the items in the correct sequence.',
      'essay': 'Provide a detailed written response addressing all aspects of the question.'
    };
    return instructions[type] || 'Follow the specific instructions for each question.';
  }

  // Utility methods
  private mapCEFRToDifficulty(cefrLevel: string): DifficultyLevel {
    const mapping = {
      'A1': 'beginner' as DifficultyLevel,
      'A2': 'elementary' as DifficultyLevel,
      'B1': 'intermediate' as DifficultyLevel,
      'B2': 'upper-intermediate' as DifficultyLevel,
      'C1': 'advanced' as DifficultyLevel,
      'C2': 'proficient' as DifficultyLevel
    };
    return mapping[cefrLevel as keyof typeof mapping] || 'intermediate';
  }

  private generateId(): string {
    return `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Quiz structure interfaces
interface QuizStructureTemplate {
  introduction: { required: boolean; estimatedTime: number };
  questionSections: QuestionSectionTemplate[];
  conclusion: { required: boolean; estimatedTime: number };
}

interface QuestionSectionTemplate {
  type: Exercise['type'];
  title: string;
  questionCount: number;
  difficulties: DifficultyLevel[];
  instructions?: string;
}

// Export singleton instance
export const quizGenerator = QuizGenerator.getInstance();