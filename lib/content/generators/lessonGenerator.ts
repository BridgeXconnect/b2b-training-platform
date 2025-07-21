import { 
  ContentGenerationContext, 
  GeneratedContent, 
  ContentSection, 
  Exercise,
  VocabularyItem,
  DifficultyLevel 
} from '../types';

// Specialized lesson content generator
export class LessonGenerator {
  private static instance: LessonGenerator;
  
  public static getInstance(): LessonGenerator {
    if (!LessonGenerator.instance) {
      LessonGenerator.instance = new LessonGenerator();
    }
    return LessonGenerator.instance;
  }

  // Generate comprehensive business English lesson
  public async generateBusinessLesson(
    context: ContentGenerationContext,
    specifications: {
      topic: string;
      duration: number;
      includeSOPs?: boolean;
      focusSkills?: string[];
      customObjectives?: string[];
    }
  ): Promise<GeneratedContent> {
    const lessonStructure = this.createLessonStructure(context, specifications);
    const content = await this.generateLessonSections(lessonStructure, context, specifications);
    
    return {
      id: this.generateId(),
      type: 'lesson',
      title: `${specifications.topic} - ${context.businessDomain} English`,
      description: `Comprehensive ${context.cefrLevel} level lesson focusing on ${specifications.topic} in ${context.businessDomain} context`,
      content,
      metadata: {
        cefrLevel: context.cefrLevel,
        estimatedDuration: specifications.duration,
        difficulty: this.mapCEFRToDifficulty(context.cefrLevel),
        topics: [specifications.topic, context.businessDomain],
        skills: specifications.focusSkills || ['reading', 'writing', 'speaking', 'listening'],
        businessRelevance: 0.95,
        sopIntegration: specifications.includeSOPs || false,
        generationSource: specifications.includeSOPs ? 'sop-based' : 'ai-original',
        qualityScore: 0.9,
        engagementPrediction: 0.85
      },
      aiGenerated: true,
      generationTimestamp: new Date(),
      version: '1.0'
    };
  }

  // Create lesson structure based on context and specifications
  private createLessonStructure(
    context: ContentGenerationContext, 
    specs: any
  ): LessonStructureTemplate {
    const baseStructure: LessonStructureTemplate = {
      warmUp: { duration: Math.ceil(specs.duration * 0.1), required: true },
      introduction: { duration: Math.ceil(specs.duration * 0.15), required: true },
      mainContent: { duration: Math.ceil(specs.duration * 0.4), required: true },
      practice: { duration: Math.ceil(specs.duration * 0.2), required: true },
      application: { duration: Math.ceil(specs.duration * 0.1), required: false },
      wrap: { duration: Math.ceil(specs.duration * 0.05), required: true }
    };

    // Adjust structure based on CEFR level
    if (context.cefrLevel === 'A1' || context.cefrLevel === 'A2') {
      baseStructure.practice.duration += baseStructure.application.duration;
      baseStructure.application.required = false;
    }

    return baseStructure;
  }

  // Generate all lesson sections
  private async generateLessonSections(
    structure: LessonStructureTemplate,
    context: ContentGenerationContext,
    specs: any
  ): Promise<ContentSection[]> {
    const sections: ContentSection[] = [];

    // Warm-up section
    if (structure.warmUp.required) {
      sections.push(await this.generateWarmUpSection(context, specs, structure.warmUp.duration));
    }

    // Introduction section
    sections.push(await this.generateIntroductionSection(context, specs, structure.introduction.duration));

    // Main content section
    sections.push(await this.generateMainContentSection(context, specs, structure.mainContent.duration));

    // Practice section
    sections.push(await this.generatePracticeSection(context, specs, structure.practice.duration));

    // Application section (if required)
    if (structure.application.required) {
      sections.push(await this.generateApplicationSection(context, specs, structure.application.duration));
    }

    // Wrap-up section
    sections.push(await this.generateWrapUpSection(context, specs, structure.wrap.duration));

    return sections;
  }

  // Generate warm-up section
  private async generateWarmUpSection(
    context: ContentGenerationContext, 
    specs: any, 
    duration: number
  ): Promise<ContentSection> {
    const warmUpActivities = this.selectWarmUpActivities(context, duration);
    
    return {
      id: 'warmup',
      type: 'text',
      title: 'Warm-Up Activity',
      content: `Welcome to today's ${specs.topic} lesson! Let's start with a quick warm-up to activate your existing knowledge.`,
      instructions: warmUpActivities.instructions,
      examples: warmUpActivities.examples,
      exercises: warmUpActivities.exercises
    };
  }

  // Generate introduction section
  private async generateIntroductionSection(
    context: ContentGenerationContext, 
    specs: any, 
    duration: number
  ): Promise<ContentSection> {
    const objectives = this.generateLearningObjectives(context, specs);
    const businessContext = this.createBusinessContext(context, specs.topic);
    
    return {
      id: 'introduction',
      type: 'text',
      title: 'Lesson Introduction',
      content: `
**Today's Focus: ${specs.topic} in ${context.businessDomain}**

${businessContext}

**Learning Objectives:**
By the end of this lesson, you will be able to:
${objectives.map(obj => `• ${obj}`).join('\n')}

**Real-World Application:**
This lesson prepares you for actual workplace situations where you'll need to use English for ${specs.topic.toLowerCase()} in ${context.businessDomain} contexts.
      `,
      instructions: `Take a moment to review the objectives and think about how this topic relates to your current work responsibilities.`
    };
  }

  // Generate main content section
  private async generateMainContentSection(
    context: ContentGenerationContext, 
    specs: any, 
    duration: number
  ): Promise<ContentSection> {
    const keyContent = this.generateKeyContent(context, specs);
    const vocabulary = this.generateLessonVocabulary(context, specs);
    const examples = this.generateBusinessExamples(context, specs);
    
    return {
      id: 'main-content',
      type: 'text',
      title: `${specs.topic} - Core Content`,
      content: `
**Key Concepts:**
${keyContent}

**Essential Vocabulary:**
${vocabulary.map(item => `• **${item.word}**: ${item.definition}\n  *Example*: ${item.examples[0]}`).join('\n')}

**Business Examples:**
${examples.map((example, index) => `**${index + 1}. ${example.scenario}**\n${example.content}\n`).join('\n')}
      `,
      vocabularyItems: vocabulary,
      examples: examples.map(ex => ex.content)
    };
  }

  // Generate practice section
  private async generatePracticeSection(
    context: ContentGenerationContext, 
    specs: any, 
    duration: number
  ): Promise<ContentSection> {
    const exercises = this.generatePracticeExercises(context, specs, duration);
    
    return {
      id: 'practice',
      type: 'exercise',
      title: 'Practice Exercises',
      content: `Now let's practice what we've learned. Complete the following exercises to reinforce your understanding of ${specs.topic}.`,
      instructions: 'Work through each exercise carefully. Focus on applying the vocabulary and concepts from the main content.',
      exercises
    };
  }

  // Generate application section
  private async generateApplicationSection(
    context: ContentGenerationContext, 
    specs: any, 
    duration: number
  ): Promise<ContentSection> {
    const realWorldTask = this.generateRealWorldTask(context, specs);
    
    return {
      id: 'application',
      type: 'text',
      title: 'Real-World Application',
      content: `
**Apply Your Learning:**
${realWorldTask.description}

**Task Instructions:**
${realWorldTask.instructions}

**Success Criteria:**
${realWorldTask.criteria.map((criterion: string) => `• ${criterion}`).join('\n')}
      `,
      instructions: realWorldTask.instructions
    };
  }

  // Generate wrap-up section
  private async generateWrapUpSection(
    context: ContentGenerationContext, 
    specs: any, 
    duration: number
  ): Promise<ContentSection> {
    const keyTakeaways = this.generateKeyTakeaways(context, specs);
    const nextSteps = this.generateNextSteps(context, specs);
    
    return {
      id: 'wrap-up',
      type: 'text',
      title: 'Lesson Summary',
      content: `
**Key Takeaways:**
${keyTakeaways.map(takeaway => `• ${takeaway}`).join('\n')}

**Next Steps:**
${nextSteps.map(step => `• ${step}`).join('\n')}

**Reflection Questions:**
1. How will you apply what you learned in your daily work?
2. Which aspect of ${specs.topic} do you want to practice more?
3. What questions do you still have about this topic?
      `,
      instructions: 'Take a few minutes to reflect on your learning and identify areas for continued practice.'
    };
  }

  // Helper methods for content generation
  private selectWarmUpActivities(context: ContentGenerationContext, duration: number): any {
    const activities = {
      discussion: `Think about a recent situation at work where you needed to use English for ${context.businessDomain} communication. What went well? What was challenging?`,
      vocabulary: `Brainstorm words and phrases you already know related to today's topic. Write them down and be ready to share.`,
      quickQuestion: `Answer this question in 1-2 sentences: What do you hope to learn from today's lesson?`
    };

    const selectedActivity = duration > 8 ? 'discussion' : duration > 5 ? 'vocabulary' : 'quickQuestion';
    
    return {
      instructions: activities[selectedActivity as keyof typeof activities],
      examples: [`Example response for ${selectedActivity} activity`],
      exercises: []
    };
  }

  private generateLearningObjectives(context: ContentGenerationContext, specs: any): string[] {
    const baseObjectives = [
      `Use key ${specs.topic} vocabulary in professional contexts`,
      `Understand ${specs.topic} concepts relevant to ${context.businessDomain}`,
      `Apply ${specs.topic} language skills in workplace scenarios`
    ];

    // Add CEFR-specific objectives
    if (['C1', 'C2'].includes(context.cefrLevel)) {
      baseObjectives.push(`Analyze complex ${specs.topic} situations and provide sophisticated responses`);
    } else if (['B1', 'B2'].includes(context.cefrLevel)) {
      baseObjectives.push(`Communicate effectively about ${specs.topic} in familiar business situations`);
    } else {
      baseObjectives.push(`Use basic ${specs.topic} expressions in simple workplace interactions`);
    }

    // Add skill-specific objectives based on weak areas
    context.weakAreas.forEach(area => {
      if (area === 'speaking') {
        baseObjectives.push(`Improve speaking confidence when discussing ${specs.topic}`);
      } else if (area === 'writing') {
        baseObjectives.push(`Write clear, professional texts about ${specs.topic}`);
      }
    });

    return baseObjectives;
  }

  private createBusinessContext(context: ContentGenerationContext, topic: string): string {
    const contextTemplates = {
      'Corporate Training': `In today's globalized business environment, effective ${topic} skills are essential for success in ${context.businessDomain}. This lesson focuses on practical applications you'll encounter in your daily work.`,
      'Customer Service': `Excellent ${topic} abilities are crucial for providing outstanding customer service in ${context.businessDomain}. We'll explore real scenarios you might face with international clients.`,
      'Project Management': `${topic} is a fundamental skill for successful project management in ${context.businessDomain}. This lesson prepares you for leading international teams and stakeholder communication.`,
      'Sales': `Mastering ${topic} techniques in English can significantly impact your success in ${context.businessDomain} sales. We'll practice with realistic client scenarios.`
    };

    return contextTemplates[context.businessDomain as keyof typeof contextTemplates] || 
           `This lesson focuses on ${topic} in the context of ${context.businessDomain}, providing practical skills for your professional environment.`;
  }

  private generateKeyContent(context: ContentGenerationContext, specs: any): string {
    // Generate topic-specific key content based on business domain and CEFR level
    const complexity = ['A1', 'A2'].includes(context.cefrLevel) ? 'basic' : 
                      ['B1', 'B2'].includes(context.cefrLevel) ? 'intermediate' : 'advanced';
    
    return `This section would contain ${complexity} level content about ${specs.topic} specifically tailored for ${context.businessDomain} professionals at ${context.cefrLevel} level.`;
  }

  private generateLessonVocabulary(context: ContentGenerationContext, specs: any): VocabularyItem[] {
    // Generate vocabulary items based on topic and business domain
    const vocabularyCount = ['A1', 'A2'].includes(context.cefrLevel) ? 8 : 
                           ['B1', 'B2'].includes(context.cefrLevel) ? 12 : 15;
    
    const vocabulary: VocabularyItem[] = [];
    
    for (let i = 0; i < vocabularyCount; i++) {
      vocabulary.push({
        word: `${specs.topic.toLowerCase()}-term-${i + 1}`,
        definition: `Professional definition for ${specs.topic} term ${i + 1} in ${context.businessDomain}`,
        examples: [
          `Example sentence using this term in ${context.businessDomain} context`,
          `Another professional example for ${context.cefrLevel} level`
        ],
        businessContext: `Specifically used in ${context.businessDomain} when discussing ${specs.topic}`,
        difficulty: this.mapCEFRToDifficulty(context.cefrLevel),
        frequency: i < 4 ? 'high' : i < 8 ? 'medium' : 'low',
        relatedWords: [`related-term-${i}`, `synonym-${i}`]
      });
    }
    
    return vocabulary;
  }

  private generateBusinessExamples(context: ContentGenerationContext, specs: any): any[] {
    const exampleCount = ['A1', 'A2'].includes(context.cefrLevel) ? 2 : 3;
    const examples = [];
    
    for (let i = 0; i < exampleCount; i++) {
      examples.push({
        scenario: `${context.businessDomain} Scenario ${i + 1}`,
        content: `Detailed example showing how ${specs.topic} applies in ${context.businessDomain} context, appropriate for ${context.cefrLevel} level learners.`
      });
    }
    
    return examples;
  }

  private generatePracticeExercises(context: ContentGenerationContext, specs: any, duration: number): Exercise[] {
    const exerciseCount = Math.ceil(duration / 3); // Approximately 3 minutes per exercise
    const exercises: Exercise[] = [];
    
    const exerciseTypes = ['multiple-choice', 'fill-blank', 'matching', 'short-answer'];
    
    for (let i = 0; i < exerciseCount; i++) {
      const type = exerciseTypes[i % exerciseTypes.length] as Exercise['type'];
      exercises.push({
        id: `exercise-${i + 1}`,
        type,
        question: `${type} question about ${specs.topic} in ${context.businessDomain} context`,
        options: type === 'multiple-choice' ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined,
        correctAnswer: type === 'multiple-choice' ? 'Option A' : 'Correct answer for this exercise',
        explanation: `Explanation of why this is the correct answer, with reference to ${specs.topic} principles`,
        hints: [`Hint about ${specs.topic}`, `Consider the ${context.businessDomain} context`],
        points: 10,
        difficulty: this.mapCEFRToDifficulty(context.cefrLevel)
      });
    }
    
    return exercises;
  }

  private generateRealWorldTask(context: ContentGenerationContext, specs: any): any {
    return {
      description: `Create a realistic ${specs.topic} scenario that you might encounter in your ${context.businessDomain} work environment.`,
      instructions: `Using the vocabulary and concepts from this lesson, complete the following task...`,
      criteria: [
        `Use at least 5 key vocabulary items from the lesson`,
        `Demonstrate understanding of ${specs.topic} principles`,
        `Apply appropriate ${context.cefrLevel} level language`,
        `Show relevance to ${context.businessDomain} context`
      ]
    };
  }

  private generateKeyTakeaways(context: ContentGenerationContext, specs: any): string[] {
    return [
      `Understanding of ${specs.topic} in ${context.businessDomain} context`,
      `Practical vocabulary for professional communication`,
      `Confidence in applying ${specs.topic} skills at work`,
      `Strategies for continued improvement in ${context.weakAreas.join(' and ')}`
    ];
  }

  private generateNextSteps(context: ContentGenerationContext, specs: any): string[] {
    return [
      `Practice using today's vocabulary in real work situations`,
      `Review and reinforce ${context.weakAreas.join(' and ')} skills`,
      `Seek opportunities to apply ${specs.topic} knowledge in ${context.businessDomain}`,
      `Continue to next lesson or assessment when ready`
    ];
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
    return `lesson_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Lesson structure template interface
interface LessonStructureTemplate {
  warmUp: { duration: number; required: boolean };
  introduction: { duration: number; required: boolean };
  mainContent: { duration: number; required: boolean };
  practice: { duration: number; required: boolean };
  application: { duration: number; required: boolean };
  wrap: { duration: number; required: boolean };
}

// Export singleton instance
export const lessonGenerator = LessonGenerator.getInstance();