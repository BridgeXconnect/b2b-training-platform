import { 
  ContentGenerationContext, 
  ContentGenerationRequest, 
  ContentGenerationResult, 
  GeneratedContent, 
  ContentSection,
  ContentType,
  AIGenerationConfig,
  QualityMetrics,
  ContentSpecs,
  StructuredAIResponse,
  CEFRDifficultyMapping
} from '../types';
import { OpenAIClientManager, aiConfig, CostEstimator } from '@/lib/ai-config';
import { UsageMonitor } from '@/lib/usage-monitor';
import { AIErrorHandler } from '@/lib/error-handler';
import { log } from '@/lib/logger';

// Core content generation engine
export class ContentGenerationEngine {
  private static instance: ContentGenerationEngine;
  private config: AIGenerationConfig;
  private templates: Map<ContentType, ContentSpecs> = new Map();

  constructor() {
    this.config = {
      model: aiConfig.openai.model.primary,
      temperature: aiConfig.openai.settings.temperature,
      maxTokens: aiConfig.openai.settings.maxTokens,
      presencePenalty: 0.1,
      frequencyPenalty: 0.1,
      systemPrompts: {
        base: `You are an expert English language learning content creator specializing in business English and CEFR-aligned materials. Create engaging, practical content that integrates company-specific contexts and real-world business scenarios.`,
        lessonGeneration: `Generate comprehensive English lessons that combine language learning with practical business applications. Focus on real-world scenarios, professional communication, and company-specific terminology.`,
        quizGeneration: `Create adaptive quizzes and exercises that test both language skills and practical business application. Include varied question types and provide detailed explanations.`,
        vocabularyGeneration: `Generate business-focused vocabulary lists with practical examples, pronunciation guides, and contextual usage in professional settings.`,
        businessContextIntegration: `Integrate company Standard Operating Procedures (SOPs) and business contexts into language learning content, making lessons immediately applicable to learners' work environments.`
      }
    };
  }

  public static getInstance(): ContentGenerationEngine {
    if (!ContentGenerationEngine.instance) {
      ContentGenerationEngine.instance = new ContentGenerationEngine();
    }
    return ContentGenerationEngine.instance;
  }

  // Main content generation method
  public async generateContent(request: ContentGenerationRequest): Promise<ContentGenerationResult> {
    const startTime = Date.now();
    
    try {
      // Validate request
      const validation = this.validateRequest(request);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          generationMetrics: {
            processingTime: Date.now() - startTime,
            tokensUsed: 0,
            qualityScore: 0,
            confidenceLevel: 0
          }
        };
      }

      // Generate content based on type
      const content = await this.generateByType(request);
      
      // Quality assessment
      const qualityMetrics = await this.assessQuality(content, request.context);
      
      // Finalize content
      const finalContent: GeneratedContent = {
        ...content,
        id: this.generateContentId(),
        aiGenerated: true,
        generationTimestamp: new Date(),
        version: '1.0'
      };

      return {
        success: true,
        content: finalContent,
        generationMetrics: {
          processingTime: Date.now() - startTime,
          tokensUsed: this.estimateTokensUsed(finalContent),
          qualityScore: qualityMetrics.overallQuality,
          confidenceLevel: this.calculateConfidenceLevel(request, qualityMetrics)
        }
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        generationMetrics: {
          processingTime: Date.now() - startTime,
          tokensUsed: 0,
          qualityScore: 0,
          confidenceLevel: 0
        }
      };
    }
  }

  // Generate content based on type
  private async generateByType(request: ContentGenerationRequest): Promise<Omit<GeneratedContent, 'id' | 'aiGenerated' | 'generationTimestamp' | 'version'>> {
    const { type, context, specifications } = request;

    switch (type) {
      case 'lesson':
        return await this.generateLesson(context, specifications);
      case 'quiz':
        return await this.generateQuiz(context, specifications);
      case 'exercise':
        return await this.generateExercise(context, specifications);
      case 'vocabulary':
        return await this.generateVocabulary(context, specifications);
      case 'dialogue':
        return await this.generateDialogue(context, specifications);
      case 'business-case':
        return await this.generateBusinessCase(context, specifications);
      case 'roleplay':
        return await this.generateRoleplay(context, specifications);
      default:
        throw new Error(`Unsupported content type: ${type}`);
    }
  }

  // Lesson generation
  private async generateLesson(context: ContentGenerationContext, specs: ContentSpecs): Promise<Omit<GeneratedContent, 'id' | 'aiGenerated' | 'generationTimestamp' | 'version'>> {
    const prompt = this.buildLessonPrompt(context, specs);
    const lessonContent = await this.callAI(prompt, 'lesson', context);
    
    return {
      type: 'lesson',
      title: lessonContent.title || `${context.businessDomain} English Lesson`,
      description: lessonContent.description || `CEFR ${context.cefrLevel} lesson focused on ${context.learningGoals.join(', ')}`,
      content: this.structureLessonContent(lessonContent, context),
      metadata: {
        cefrLevel: context.cefrLevel,
        estimatedDuration: specs.duration || 30,
        difficulty: this.mapCEFRToDifficulty(context.cefrLevel),
        topics: specs.topics || context.learningGoals,
        skills: ['reading', 'writing', 'speaking', 'listening'],
        businessRelevance: 0.9,
        sopIntegration: specs.includeSOPs || false,
        generationSource: 'ai-original',
        qualityScore: 0.85,
        engagementPrediction: 0.8
      }
    };
  }

  // Quiz generation
  private async generateQuiz(context: ContentGenerationContext, specs: ContentSpecs): Promise<Omit<GeneratedContent, 'id' | 'aiGenerated' | 'generationTimestamp' | 'version'>> {
    const prompt = this.buildQuizPrompt(context, specs);
    const quizContent = await this.callAI(prompt, 'quiz', context);
    
    return {
      type: 'quiz',
      title: quizContent.title || `${context.businessDomain} Assessment`,
      description: quizContent.description || `Adaptive quiz targeting ${context.weakAreas.join(', ')}`,
      content: this.structureQuizContent(quizContent, context),
      metadata: {
        cefrLevel: context.cefrLevel,
        estimatedDuration: specs.duration || 15,
        difficulty: this.mapCEFRToDifficulty(context.cefrLevel),
        topics: context.weakAreas,
        skills: ['reading', 'writing'],
        businessRelevance: 0.8,
        sopIntegration: false,
        generationSource: 'adaptive',
        qualityScore: 0.9,
        engagementPrediction: 0.85
      }
    };
  }

  // Exercise generation
  private async generateExercise(context: ContentGenerationContext, specs: ContentSpecs): Promise<Omit<GeneratedContent, 'id' | 'aiGenerated' | 'generationTimestamp' | 'version'>> {
    const prompt = this.buildExercisePrompt(context, specs);
    const exerciseContent = await this.callAI(prompt, 'exercise', context);
    
    return {
      type: 'exercise',
      title: exerciseContent.title || `${context.businessDomain} Practice Exercise`,
      description: exerciseContent.description || `Targeted practice for ${context.weakAreas[0] || 'general skills'}`,
      content: this.structureExerciseContent(exerciseContent, context),
      metadata: {
        cefrLevel: context.cefrLevel,
        estimatedDuration: specs.duration || 10,
        difficulty: this.mapCEFRToDifficulty(context.cefrLevel),
        topics: specs.topics || [context.weakAreas[0] || 'general'],
        skills: ['writing', 'reading'],
        businessRelevance: 0.7,
        sopIntegration: false,
        generationSource: 'ai-original',
        qualityScore: 0.8,
        engagementPrediction: 0.75
      }
    };
  }

  // Vocabulary generation
  private async generateVocabulary(context: ContentGenerationContext, specs: ContentSpecs): Promise<Omit<GeneratedContent, 'id' | 'aiGenerated' | 'generationTimestamp' | 'version'>> {
    const prompt = this.buildVocabularyPrompt(context, specs);
    const vocabContent = await this.callAI(prompt, 'vocabulary', context);
    
    return {
      type: 'vocabulary',
      title: vocabContent.title || `${context.businessDomain} Key Vocabulary`,
      description: vocabContent.description || `Essential business vocabulary for ${context.cefrLevel} level`,
      content: this.structureVocabularyContent(vocabContent, context),
      metadata: {
        cefrLevel: context.cefrLevel,
        estimatedDuration: specs.duration || 20,
        difficulty: this.mapCEFRToDifficulty(context.cefrLevel),
        topics: [context.businessDomain],
        skills: ['vocabulary', 'reading'],
        businessRelevance: 1.0,
        sopIntegration: specs.includeSOPs || false,
        generationSource: 'ai-original',
        qualityScore: 0.85,
        engagementPrediction: 0.8
      }
    };
  }

  // Dialogue generation
  private async generateDialogue(context: ContentGenerationContext, specs: ContentSpecs): Promise<Omit<GeneratedContent, 'id' | 'aiGenerated' | 'generationTimestamp' | 'version'>> {
    const prompt = this.buildDialoguePrompt(context, specs);
    const dialogueContent = await this.callAI(prompt, 'dialogue', context);
    
    return {
      type: 'dialogue',
      title: dialogueContent.title || `Professional ${context.businessDomain} Conversation`,
      description: dialogueContent.description || `Business dialogue practice for ${context.cefrLevel} level`,
      content: this.structureDialogueContent(dialogueContent, context),
      metadata: {
        cefrLevel: context.cefrLevel,
        estimatedDuration: specs.duration || 25,
        difficulty: this.mapCEFRToDifficulty(context.cefrLevel),
        topics: specs.topics || ['conversation', context.businessDomain],
        skills: ['speaking', 'listening', 'reading'],
        businessRelevance: 0.95,
        sopIntegration: specs.includeSOPs || false,
        generationSource: 'ai-original',
        qualityScore: 0.85,
        engagementPrediction: 0.9
      }
    };
  }

  // Business case generation
  private async generateBusinessCase(context: ContentGenerationContext, specs: ContentSpecs): Promise<Omit<GeneratedContent, 'id' | 'aiGenerated' | 'generationTimestamp' | 'version'>> {
    const prompt = this.buildBusinessCasePrompt(context, specs);
    const caseContent = await this.callAI(prompt, 'business-case', context);
    
    return {
      type: 'business-case',
      title: caseContent.title || `${context.businessDomain} Business Case Study`,
      description: caseContent.description || `Real-world business scenario for language practice`,
      content: this.structureBusinessCaseContent(caseContent, context),
      metadata: {
        cefrLevel: context.cefrLevel,
        estimatedDuration: specs.duration || 40,
        difficulty: this.mapCEFRToDifficulty(context.cefrLevel),
        topics: [context.businessDomain, 'case-study', 'problem-solving'],
        skills: ['reading', 'writing', 'speaking', 'critical-thinking'],
        businessRelevance: 1.0,
        sopIntegration: specs.includeSOPs || true,
        generationSource: 'sop-based',
        qualityScore: 0.9,
        engagementPrediction: 0.95
      }
    };
  }

  // Roleplay generation
  private async generateRoleplay(context: ContentGenerationContext, specs: ContentSpecs): Promise<Omit<GeneratedContent, 'id' | 'aiGenerated' | 'generationTimestamp' | 'version'>> {
    const prompt = this.buildRoleplayPrompt(context, specs);
    const roleplayContent = await this.callAI(prompt, 'roleplay', context);
    
    return {
      type: 'roleplay',
      title: roleplayContent.title || `${context.businessDomain} Professional Roleplay`,
      description: roleplayContent.description || `Interactive business scenario practice`,
      content: this.structureRoleplayContent(roleplayContent, context),
      metadata: {
        cefrLevel: context.cefrLevel,
        estimatedDuration: specs.duration || 35,
        difficulty: this.mapCEFRToDifficulty(context.cefrLevel),
        topics: specs.topics || ['roleplay', context.businessDomain, 'communication'],
        skills: ['speaking', 'listening', 'interaction'],
        businessRelevance: 0.95,
        sopIntegration: specs.includeSOPs || false,
        generationSource: 'ai-original',
        qualityScore: 0.85,
        engagementPrediction: 0.95
      }
    };
  }

  // Helper methods
  private validateRequest(request: ContentGenerationRequest): { valid: boolean; error?: string } {
    if (!request.context?.userId) {
      return { valid: false, error: 'User ID is required' };
    }
    if (!request.context?.cefrLevel) {
      return { valid: false, error: 'CEFR level is required' };
    }
    if (!request.type) {
      return { valid: false, error: 'Content type is required' };
    }
    return { valid: true };
  }

  private async callAI(
    prompt: string, 
    contentType: ContentType = 'lesson',
    context?: ContentGenerationContext
  ): Promise<any> {
    try {
      const openai = OpenAIClientManager.getInstance();
      
      // Check usage limits if context is provided
      if (context?.userId) {
        const usageCheck = UsageMonitor.canUserMakeRequest(context.userId);
        if (!usageCheck.allowed) {
          throw new Error(`Usage limit exceeded: ${usageCheck.reason}`);
        }

        // Check system budget
        const systemBudget = UsageMonitor.isSystemOverBudget();
        if (systemBudget.shouldBlock) {
          throw new Error('System over budget - content generation temporarily unavailable');
        }
      }

      // Build comprehensive system prompt for content type
      const systemPrompt = this.buildContentTypeSystemPrompt(contentType);
      
      // Estimate input tokens for cost tracking
      const inputText = systemPrompt + prompt;
      const estimatedInputTokens = CostEstimator.estimateTokenCount(inputText);

      log.aiRequest(`Generating ${contentType} for ${context?.cefrLevel || 'unknown'} level`, { contentType, cefrLevel: context?.cefrLevel });

      // Call OpenAI with proper configuration
      const completion = await openai.chat.completions.create({
        model: aiConfig.openai.model.primary,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user', 
            content: prompt
          }
        ],
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        presence_penalty: this.config.presencePenalty,
        frequency_penalty: this.config.frequencyPenalty
      });

      const generatedContent = completion.choices[0]?.message?.content;
      if (!generatedContent) {
        throw new Error('No content generated from OpenAI');
      }

      // Record usage for monitoring
      if (context?.userId) {
        await UsageMonitor.recordUsage(
          context.userId,
          `content_generation_${Date.now()}`,
          aiConfig.openai.model.primary,
          completion.usage?.prompt_tokens || estimatedInputTokens,
          completion.usage?.completion_tokens || 0,
          CostEstimator.estimateRequestCost(
            aiConfig.openai.model.primary,
            completion.usage?.prompt_tokens || estimatedInputTokens,
            completion.usage?.completion_tokens || 0
          ),
          'content_generation',
          {
            cefrLevel: context.cefrLevel,
            businessContext: `${contentType}_generation_${context.businessDomain}`
          }
        );
      }

      log.aiRequest(`Content generation success - ${completion.usage?.total_tokens || 0} tokens used`, { contentType, tokensUsed: completion.usage?.total_tokens });
      
      // Parse AI response based on content type
      return this.parseAIResponse(generatedContent, contentType);
      
    } catch (error) {
      log.error('AI content generation error', 'AI', { error: error.message, contentType });
      
      // Use AI Error Handler for graceful fallback
      const aiError = AIErrorHandler.classifyError(error);
      
      if (aiError.fallbackAvailable) {
        log.warn(`Using fallback for content generation`, 'AI', { contentType });
        return this.generateFallbackContent(contentType, context);
      }
      
      throw error;
    }
  }

  private parseAIResponse(aiContent: string, contentType: ContentType): StructuredAIResponse {
    try {
      // Try to parse as JSON first
      const parsed = JSON.parse(aiContent);
      return parsed;
    } catch {
      // If not JSON, structure the text response
      return this.structureTextResponse(aiContent, contentType);
    }
  }

  private structureTextResponse(content: string, contentType: ContentType): StructuredAIResponse {
    const lines = content.split('\n').filter(line => line.trim());
    const title = lines[0]?.replace(/^#+\s*/, '') || `Generated ${contentType}`;
    
    // Extract sections based on headers (## or **text**)
    const sections = [];
    let currentSection = null;
    
    for (const line of lines.slice(1)) {
      if (line.match(/^##\s+/) || line.match(/^\*\*.*\*\*$/)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.replace(/^##\s+/, '').replace(/^\*\*(.*)\*\*$/, '$1'),
          content: '',
          type: this.inferSectionType(line, contentType)
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }
    
    if (currentSection) {
      sections.push(currentSection);
    }

    return {
      title,
      description: `AI-generated ${contentType} content`,
      sections: sections.length > 0 ? sections : [{
        title: 'Content',
        content: content,
        type: 'text'
      }]
    };
  }

  private inferSectionType(header: string, contentType: ContentType): string {
    const lowerHeader = header.toLowerCase();
    
    if (lowerHeader.includes('exercise') || lowerHeader.includes('practice')) {
      return 'exercise';
    } else if (lowerHeader.includes('vocabulary') || lowerHeader.includes('terms')) {
      return 'vocabulary';
    } else if (lowerHeader.includes('dialogue') || lowerHeader.includes('conversation')) {
      return 'dialogue';
    } else if (lowerHeader.includes('question') || lowerHeader.includes('quiz')) {
      return 'question';
    }
    
    return 'text';
  }

  private generateFallbackContent(contentType: ContentType, context?: ContentGenerationContext): StructuredAIResponse {
    const fallbackContent = {
      lesson: {
        title: 'Business English Lesson',
        description: 'Professional communication skills development',
        sections: [
          {
            title: 'Learning Objectives',
            content: 'By the end of this lesson, you will be able to communicate effectively in professional business settings.',
            type: 'text'
          },
          {
            title: 'Key Vocabulary',
            content: 'Essential business terms and phrases for professional communication.',
            type: 'vocabulary'
          },
          {
            title: 'Practice Exercise',
            content: 'Apply your learning through practical business scenarios.',
            type: 'exercise'
          }
        ]
      },
      quiz: {
        title: 'Business English Assessment',
        description: 'Test your understanding of business communication concepts',
        sections: [
          {
            title: 'Multiple Choice Questions',
            content: 'Select the best answer for each business communication scenario.',
            type: 'question'
          }
        ]
      },
      vocabulary: {
        title: 'Business Vocabulary',
        description: 'Essential terms for professional communication',
        sections: [
          {
            title: 'Core Business Terms',
            content: 'Key vocabulary for business English proficiency.',
            type: 'vocabulary'
          }
        ]
      },
      exercise: {
        title: 'Business English Exercise',
        description: 'Practice exercise for professional skills',
        sections: [
          {
            title: 'Practice Activity',
            content: 'Complete this exercise to practice your business English skills.',
            type: 'exercise'
          }
        ]
      },
      dialogue: {
        title: 'Professional Dialogue',
        description: 'Business conversation practice',
        sections: [
          {
            title: 'Business Conversation',
            content: 'Practice professional dialogue in business settings.',
            type: 'dialogue'
          }
        ]
      },
      'business-case': {
        title: 'Business Case Study',
        description: 'Real-world business scenario analysis',
        sections: [
          {
            title: 'Case Analysis',
            content: 'Analyze this business case and provide recommendations.',
            type: 'text'
          }
        ]
      },
      roleplay: {
        title: 'Business Roleplay',
        description: 'Interactive professional scenario practice',
        sections: [
          {
            title: 'Roleplay Scenario',
            content: 'Practice your communication skills through this business roleplay.',
            type: 'dialogue'
          }
        ]
      },
      reading: {
        title: 'Business Reading Comprehension',
        description: 'Practice reading and understanding business documents',
        sections: [
          {
            title: 'Reading Passage',
            content: 'Read the following passage and answer the questions below.',
            type: 'text'
          }
        ]
      },
      listening: {
        title: 'Business Listening Comprehension',
        description: 'Practice listening to and understanding business audio',
        sections: [
          {
            title: 'Audio Clip',
            content: 'Listen to the following audio clip and answer the questions below.',
            type: 'audio'
          }
        ]
      },
      writing: {
        title: 'Business Writing Practice',
        description: 'Practice writing business documents and communications',
        sections: [
          {
            title: 'Writing Prompt',
            content: 'Write a business email based on the following scenario.',
            type: 'text'
          }
        ]
      },
      speaking: {
        title: 'Business Speaking Practice',
        description: 'Practice speaking in business contexts',
        sections: [
          {
            title: 'Speaking Prompt',
            content: 'Prepare a short presentation on the following topic.',
            type: 'text'
          }
        ]
      },
      grammar: {
        title: 'Business Grammar Focus',
        description: 'Focus on grammar rules relevant to business English',
        sections: [
          {
            title: 'Grammar Explanation',
            content: 'Review the rules for using the present perfect in business contexts.',
            type: 'text'
          }
        ]
      }
    };

    return fallbackContent[contentType] || fallbackContent.lesson;
  }

  // Build content-type specific system prompts
  private buildContentTypeSystemPrompt(contentType: ContentType): string {
    const basePrompt = this.config.systemPrompts.base;
    
    const contentPrompts = {
      lesson: `${basePrompt}

Generate comprehensive English lessons that combine language learning with practical business applications. Focus on real-world scenarios, professional communication, and company-specific terminology.

Response Format:
- Provide structured content with clear sections
- Include title, description, and organized content sections
- Use business scenarios and practical examples
- Ensure CEFR-appropriate language complexity
- Include interactive elements and assessment opportunities`,

      quiz: `${basePrompt}

Create adaptive quizzes and exercises that test both language skills and practical business application. Include varied question types and provide detailed explanations.

Response Format:
- Structure as sections with different question types
- Include detailed answer explanations
- Use realistic business scenarios
- Provide progressive difficulty levels
- Include scoring and feedback guidance`,

      vocabulary: `${basePrompt}

Generate business-focused vocabulary lists with practical examples, pronunciation guides, and contextual usage in professional settings.

Response Format:
- Organize vocabulary by business themes
- Include definitions, pronunciation, and examples
- Provide contextual usage in professional settings
- Include memory aids and practice exercises
- Focus on immediately applicable business terms`,

      exercise: `${basePrompt}

Create targeted practice exercises that focus on specific language skills in business contexts.

Response Format:
- Provide clear objectives and instructions
- Include step-by-step guidance
- Use authentic business scenarios
- Include success criteria and self-assessment
- Ensure immediate workplace applicability`,

      dialogue: `${basePrompt}

Create professional business dialogues that reflect authentic workplace interactions and cultural norms.

Response Format:
- Provide realistic business conversation scenarios
- Include character backgrounds and contexts
- Use natural, professional language
- Include cultural notes and business etiquette
- Provide follow-up questions and analysis`,

      'business-case': `${basePrompt}

Create realistic business case studies that combine business problem-solving with English language practice.

Response Format:
- Provide comprehensive business scenarios
- Include multiple stakeholder perspectives
- Create decision-making opportunities
- Include communication challenges
- Ensure practical business relevance`,

      roleplay: `${basePrompt}

Design interactive business roleplay scenarios that require active communication and problem-solving.

Response Format:
- Provide clear scenario background
- Define distinct roles with specific objectives
- Include communication challenges
- Provide step-by-step instructions
- Include success criteria and debrief guidance`,
      reading: `${basePrompt}

Create reading comprehension exercises based on authentic business documents.

Response Format:
- Use real-world business articles, reports, or emails
- Include a variety of question types (e.g., multiple choice, short answer, true/false)
- Test for main ideas, details, and inferences
- Provide detailed answer explanations`,
      listening: `${basePrompt}

Create listening comprehension exercises based on authentic business audio.

Response Format:
- Use real-world business audio clips, such as meetings, presentations, or phone calls
- Include a variety of question types (e.g., multiple choice, short answer, fill-in-the-blank)
- Test for main ideas, details, and speaker intent
- Provide transcripts and detailed answer explanations`,
      writing: `${basePrompt}

Create writing exercises that focus on business communication and professional documentation.

Response Format:
- Provide clear writing prompts based on business scenarios
- Include guidelines for tone, style, and format
- Offer examples of effective business writing
- Provide criteria for self-assessment and improvement`,
      speaking: `${basePrompt}

Design speaking practice scenarios that simulate real-world business interactions.

Response Format:
- Provide clear speaking prompts and role-play scenarios
- Include guidelines for pronunciation, intonation, and fluency
- Offer examples of effective spoken business English
- Provide criteria for self-assessment and peer feedback`,
      grammar: `${basePrompt}

Generate grammar exercises and explanations tailored to business English contexts.

Response Format:
- Focus on grammar points commonly used in business communication
- Provide clear explanations and examples
- Include practice exercises with answer keys
- Relate grammar concepts to real-world business situations`
    };

    return contentPrompts[contentType] || contentPrompts.lesson;
  }

  private mapCEFRToDifficulty(cefrLevel: string): CEFRDifficultyMapping {
    const mapping = {
      'A1': 'beginner',
      'A2': 'elementary', 
      'B1': 'intermediate',
      'B2': 'upper-intermediate',
      'C1': 'advanced',
      'C2': 'proficient'
    };
    return mapping[cefrLevel as keyof typeof mapping] || 'intermediate';
  }

  private generateContentId(): string {
    return `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private estimateTokensUsed(content: GeneratedContent): number {
    const textContent = JSON.stringify(content);
    return Math.ceil(textContent.length / 4); // Rough estimation: 4 chars per token
  }

  private calculateConfidenceLevel(request: ContentGenerationRequest, quality: QualityMetrics): number {
    return (quality.overallQuality + quality.relevanceScore + quality.difficultyAppropriate) / 3;
  }

  private async assessQuality(content: StructuredAIResponse, context: ContentGenerationContext): Promise<QualityMetrics> {
    try {
      const qualityPrompt = this.buildQualityAssessmentPrompt(content, context);
      const client = OpenAIClientManager.getInstance();
      
      const completion = await client.chat.completions.create({
        model: aiConfig.openai.model.fallback, // Use cheaper model for quality assessment
        messages: [{ role: 'user', content: qualityPrompt }],
        temperature: 0.3, // Lower temperature for consistent assessment
        max_tokens: 500
      });

      const assessment = completion.choices[0]?.message?.content;
      if (!assessment) {
        throw new Error('No quality assessment response');
      }

      // Parse the AI assessment response
      return this.parseQualityAssessment(assessment);
    } catch (error) {
      log.error('Quality assessment failed, using default metrics', 'AI', { error: error.message });
      
      // Fallback to basic heuristic assessment
      return this.calculateBasicQualityMetrics(content, context);
    }
  }

  private buildQualityAssessmentPrompt(content: StructuredAIResponse, context: ContentGenerationContext): string {
    return `
Assess the quality of this ${context.learningGoals[0] || 'business English'} learning content for CEFR level ${context.cefrLevel}.

Content to assess:
Title: ${content.title || 'N/A'}
Sections: ${content.sections?.length || 0}
Business Context: ${content.businessContext || context.businessDomain}

Rate each aspect from 0.0 to 1.0 and provide brief improvement suggestions:

1. Grammar Score: (accuracy and appropriateness of language)
2. Relevance Score: (how well it matches learning objectives)
3. Engagement Score: (how engaging and interactive the content is)
4. Difficulty Appropriate: (appropriate for ${context.cefrLevel} level)
5. SOP Integration: (how well it integrates business context)
6. Overall Quality: (general assessment)

Respond in JSON format:
{
  "grammarScore": 0.0-1.0,
  "relevanceScore": 0.0-1.0,
  "engagementScore": 0.0-1.0,
  "difficultyAppropriate": 0.0-1.0,
  "sopIntegration": 0.0-1.0,
  "overallQuality": 0.0-1.0,
  "improvements": ["suggestion1", "suggestion2"]
}`;
  }

  private parseQualityAssessment(assessment: string): QualityMetrics {
    try {
      // Extract JSON from the response
      const jsonMatch = assessment.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          grammarScore: Math.max(0, Math.min(1, parsed.grammarScore || 0.8)),
          relevanceScore: Math.max(0, Math.min(1, parsed.relevanceScore || 0.8)),
          engagementScore: Math.max(0, Math.min(1, parsed.engagementScore || 0.7)),
          difficultyAppropriate: Math.max(0, Math.min(1, parsed.difficultyAppropriate || 0.8)),
          sopIntegration: Math.max(0, Math.min(1, parsed.sopIntegration || 0.6)),
          overallQuality: Math.max(0, Math.min(1, parsed.overallQuality || 0.75)),
          improvements: Array.isArray(parsed.improvements) ? parsed.improvements : []
        };
      }
    } catch (error) {
      log.error('Failed to parse quality assessment', 'AI', { error: error.message, assessment });
    }
    
    // Fallback if parsing fails
    return this.calculateBasicQualityMetrics();
  }

  private calculateBasicQualityMetrics(content?: StructuredAIResponse, context?: ContentGenerationContext): QualityMetrics {
    // Basic heuristic assessment based on content structure
    const hasTitle = content?.title ? 0.2 : 0;
    const hasSections = content?.sections?.length ? Math.min(0.3, content.sections.length * 0.1) : 0;
    const hasBusinessContext = content?.businessContext ? 0.2 : 0;
    const hasMetadata = content?.metadata ? 0.2 : 0;
    const baseScore = 0.5 + hasTitle + hasSections + hasBusinessContext + hasMetadata;

    return {
      grammarScore: Math.min(1, baseScore + 0.1),
      relevanceScore: Math.min(1, baseScore),
      engagementScore: Math.min(1, baseScore - 0.1),
      difficultyAppropriate: Math.min(1, baseScore),
      sopIntegration: context?.companySOPs?.length ? Math.min(1, baseScore) : 0.5,
      overallQuality: Math.min(1, baseScore),
      improvements: [
        'Consider adding more interactive elements',
        'Enhance business context integration',
        'Add more practical examples'
      ]
    };
  }

  // Content structuring methods (simplified implementations)
  private structureLessonContent(content: StructuredAIResponse, context: ContentGenerationContext): ContentSection[] {
    return content.sections?.map((section, index: number) => ({
      id: `section_${index}`,
      type: section.type || 'text',
      title: section.title,
      content: section.content,
      instructions: section.instructions
    })) || [];
  }

  private structureQuizContent(content: StructuredAIResponse, context: ContentGenerationContext): ContentSection[] {
    return content.sections?.map((section, index: number) => ({
      id: `quiz_section_${index}`,
      type: 'question',
      content: section.content,
      exercises: section.exercises || []
    })) || [];
  }

  private structureExerciseContent(content: StructuredAIResponse, context: ContentGenerationContext): ContentSection[] {
    return content.sections?.map((section, index: number) => ({
      id: `exercise_section_${index}`,
      type: 'exercise',
      title: section.title,
      content: section.content,
      exercises: section.exercises || []
    })) || [];
  }

  private structureVocabularyContent(content: StructuredAIResponse, context: ContentGenerationContext): ContentSection[] {
    return content.sections?.map((section, index: number) => ({
      id: `vocab_section_${index}`,
      type: 'vocabulary',
      title: section.title,
      content: section.content,
      vocabularyItems: section.vocabularyItems || []
    })) || [];
  }

  private structureDialogueContent(content: StructuredAIResponse, context: ContentGenerationContext): ContentSection[] {
    return content.sections?.map((section, index: number) => ({
      id: `dialogue_section_${index}`,
      type: 'dialogue',
      title: section.title,
      content: section.content
    })) || [];
  }

  private structureBusinessCaseContent(content: StructuredAIResponse, context: ContentGenerationContext): ContentSection[] {
    return content.sections?.map((section, index: number) => ({
      id: `case_section_${index}`,
      type: section.type || 'text',
      title: section.title,
      content: section.content
    })) || [];
  }

  private structureRoleplayContent(content: StructuredAIResponse, context: ContentGenerationContext): ContentSection[] {
    return content.sections?.map((section, index: number) => ({
      id: `roleplay_section_${index}`,
      type: 'dialogue',
      title: section.title,
      content: section.content,
      instructions: section.instructions
    })) || [];
  }

  // Enhanced prompt building methods with sophisticated context awareness
  private buildLessonPrompt(context: ContentGenerationContext, specs: ContentSpecs): string {
    const sopContext = specs.includeSOPs ? 
      `\n- Integrate company Standard Operating Procedures (SOPs) and specific business processes
- Use company-specific terminology and procedures where relevant
- Create scenarios based on actual workplace situations` : '';

    const skillFocus = specs.focusSkills?.length ? 
      `\nSkill Focus: Emphasize ${specs.focusSkills.join(', ')} skills throughout the lesson` : '';

    const customObjectives = specs.customObjectives?.length ? 
      `\nCustom Learning Objectives: ${specs.customObjectives.join(', ')}` : '';

    return `Create a comprehensive ${context.cefrLevel} level business English lesson for professionals in ${context.businessDomain}.

**Learner Profile:**
- CEFR Level: ${context.cefrLevel}
- Industry: ${context.businessDomain}
- Learning Goals: ${context.learningGoals.join(', ')}
- Areas for Improvement: ${context.weakAreas.join(', ')}
- Strong Areas: ${context.strongAreas.join(', ')}
- Lesson Duration: ${specs.duration || 30} minutes
- Topic Focus: ${specs.topic}${skillFocus}${customObjectives}

**Content Requirements:**${sopContext}
- Create practical, immediately applicable content
- Include real business scenarios and examples
- Provide progressive difficulty within the ${context.cefrLevel} level
- Focus extra attention on weak areas: ${context.weakAreas.join(', ')}
- Build upon strong areas: ${context.strongAreas.join(', ')}
- Include interactive elements and engagement activities

**Structure Requirements:**
- Clear learning objectives (3-4 specific, measurable goals)
- Key vocabulary section (10-15 business terms with definitions and examples)
- Main content with business scenarios
- Practice activities (3-4 different exercise types)
- Real-world application task
- Assessment questions to check understanding

Please create content that professionals can immediately use in their work environment.`;
  }

  private buildQuizPrompt(context: ContentGenerationContext, specs: ContentSpecs): string {
    const questionCount = Math.ceil((specs.duration || 15) / 1.5); // ~1.5 minutes per question
    const focusAreas = specs.focusAreas || context.weakAreas;

    return `Create an adaptive business English assessment for a ${context.cefrLevel} level professional in ${context.businessDomain}.

**Assessment Parameters:**
- CEFR Level: ${context.cefrLevel}
- Industry Context: ${context.businessDomain}
- Duration: ${specs.duration || 15} minutes (approximately ${questionCount} questions)
- Primary Focus Areas: ${focusAreas.join(', ')}
- Assessment Type: ${specs.type || 'adaptive'}

**Question Distribution:**
- Multiple Choice: 40% (business scenarios, vocabulary, grammar in context)
- Fill-in-the-Blank: 25% (business communication, terminology)
- Short Answer: 20% (practical application, problem-solving)
- Matching/Ordering: 15% (procedures, communication flow)

**Content Requirements:**
- Use realistic business scenarios from ${context.businessDomain}
- Test practical application, not just theoretical knowledge
- Include progressive difficulty to assess exact level
- Focus heavily on: ${focusAreas.join(', ')}
- Provide detailed explanations for all answers
- Include business context and real-world relevance

**Question Examples Needed:**
- Workplace communication scenarios
- Business email and document comprehension
- Professional vocabulary in context
- Cross-cultural business communication
- Problem-solving in business situations

Please ensure each question tests skills that are immediately applicable in professional settings.`;
  }

  private buildExercisePrompt(context: ContentGenerationContext, specs: ContentSpecs): string {
    const exerciseCount = Math.ceil((specs.duration || 10) / 3); // ~3 minutes per exercise

    return `Create ${exerciseCount} targeted practice exercises for a ${context.cefrLevel} level professional in ${context.businessDomain}.

**Exercise Parameters:**
- CEFR Level: ${context.cefrLevel}
- Industry: ${context.businessDomain}
- Duration: ${specs.duration || 10} minutes total
- Primary Focus: ${context.weakAreas.join(', ')}
- Secondary Skills: ${context.strongAreas.join(', ')}

**Exercise Types Needed:**
1. **Communication Practice**: Real workplace scenarios requiring specific language skills
2. **Problem-Solving**: Business challenges that require language and critical thinking
3. **Role Application**: Practical tasks that simulate actual job responsibilities
4. **Skill Integration**: Activities that combine multiple language skills

**Content Requirements:**
- Use authentic ${context.businessDomain} scenarios
- Focus intensively on weak areas: ${context.weakAreas.join(', ')}
- Include clear instructions and success criteria
- Provide immediate feedback opportunities
- Make exercises directly applicable to workplace situations
- Include self-assessment elements

**Format for Each Exercise:**
- Clear objective and context
- Step-by-step instructions
- Expected outcomes
- Success criteria
- Follow-up reflection questions

Please ensure exercises can be completed independently and provide immediate value.`;
  }

  private buildVocabularyPrompt(context: ContentGenerationContext, specs: ContentSpecs): string {
    const termCount = Math.ceil((specs.duration || 20) / 1); // ~1 minute per term
    const sopContext = specs.includeSOPs ? 
      `\n- Include company-specific terminology and acronyms
- Add terms from Standard Operating Procedures (SOPs)
- Focus on workplace-specific language and jargon` : '';

    return `Create a comprehensive business vocabulary lesson for a ${context.cefrLevel} level professional in ${context.businessDomain}.

**Vocabulary Parameters:**
- CEFR Level: ${context.cefrLevel}
- Industry: ${context.businessDomain}
- Topic Focus: ${specs.topics?.join(', ') || 'General business communication'}
- Target Terms: ${termCount} essential vocabulary items
- Duration: ${specs.duration || 20} minutes

**Vocabulary Categories:**
1. **Core Business Terms**: Essential vocabulary for daily operations
2. **Communication Language**: Professional interaction and correspondence
3. **Industry-Specific Terms**: ${context.businessDomain} specialized vocabulary
4. **Process & Procedures**: Workflow and operational language${sopContext}

**For Each Vocabulary Item Include:**
- Clear, professional definition
- Pronunciation guide (IPA or simplified)
- 2-3 example sentences in business context
- Common collocations and phrases
- Formal vs. informal usage notes
- Industry-specific applications

**Learning Activities:**
- Vocabulary matching exercises
- Context gap-fill practice
- Professional scenario applications
- Memory techniques and mnemonics
- Real workplace usage examples

**Focus Areas:**
- Emphasize terms related to: ${context.weakAreas.join(', ')}
- Build upon existing knowledge in: ${context.strongAreas.join(', ')}
- Ensure immediate workplace applicability

Please create vocabulary that professionals can start using immediately in their work environment.`;
  }

  private buildDialoguePrompt(context: ContentGenerationContext, specs: ContentSpecs): string {
    const dialogueCount = Math.ceil((specs.duration || 25) / 8); // ~8 minutes per dialogue

    return `Create ${dialogueCount} professional business dialogues for a ${context.cefrLevel} level professional in ${context.businessDomain}.

**Dialogue Parameters:**
- CEFR Level: ${context.cefrLevel}
- Industry: ${context.businessDomain}
- Duration: ${specs.duration || 25} minutes total
- Topic Focus: ${specs.topics?.join(', ') || 'Professional communication'}
- Skill Development: ${context.weakAreas.join(', ')}

**Dialogue Scenarios:**
1. **Client Communication**: Customer service, sales, and relationship management
2. **Team Collaboration**: Meetings, project discussions, and coordination
3. **Management Interactions**: Performance reviews, delegation, and feedback
4. **Cross-Cultural Communication**: International business and cultural sensitivity

**Each Dialogue Should Include:**
- **Realistic Setting**: Authentic ${context.businessDomain} workplace situation
- **Clear Participants**: 2-3 characters with defined roles and objectives
- **Natural Flow**: Authentic conversation patterns and business communication styles
- **Skill Integration**: Focus on weak areas: ${context.weakAreas.join(', ')}
- **Cultural Context**: Professional etiquette and business norms
- **Practical Outcomes**: Concrete business results and solutions

**Learning Components:**
- Pre-dialogue context and objectives
- Character background and motivations
- Key phrases and expressions highlighted
- Cultural notes and business etiquette tips
- Post-dialogue analysis questions
- Role-play variations and adaptations

**Language Focus:**
- Professional vocabulary and expressions
- Appropriate formality levels
- Turn-taking and conversation management
- Problem-solving and negotiation language
- Active listening and clarification techniques

Please ensure dialogues reflect real professional interactions that learners encounter in ${context.businessDomain} workplaces.`;
  }

  private buildBusinessCasePrompt(context: ContentGenerationContext, specs: ContentSpecs): string {
    const sopIntegration = specs.includeSOPs !== false ? 
      `\n**SOP Integration Requirements:**
- Include realistic company procedures and protocols
- Reference standard operating procedures relevant to ${context.businessDomain}
- Use company-specific terminology and processes
- Create scenarios that require knowledge of workplace procedures` : '';

    return `Create a comprehensive business case study for a ${context.cefrLevel} level professional in ${context.businessDomain}.

**Case Study Parameters:**
- CEFR Level: ${context.cefrLevel}
- Industry: ${context.businessDomain}
- Duration: ${specs.duration || 40} minutes
- Topic Focus: ${specs.topics?.join(', ') || 'Business problem-solving'}
- Skill Development: ${context.weakAreas.join(', ')}${sopIntegration}

**Case Study Structure:**
1. **Company Background**: Realistic organization in ${context.businessDomain}
2. **Situation Analysis**: Clear business challenge or opportunity
3. **Stakeholder Perspectives**: Multiple viewpoints and interests
4. **Data & Information**: Relevant business metrics and context
5. **Decision Framework**: Options and evaluation criteria
6. **Implementation Considerations**: Practical challenges and solutions

**Business Challenge Types:**
- Market expansion and competitive positioning
- Operational efficiency and cost management
- Customer service and relationship management
- Technology adoption and digital transformation
- Team management and organizational change
- Cross-cultural business and international markets

**Language Learning Integration:**
- **Communication Skills**: Reports, presentations, and recommendations
- **Analysis Language**: Problem identification and solution evaluation
- **Negotiation & Persuasion**: Stakeholder management and consensus building
- **Critical Thinking**: Data interpretation and strategic reasoning
- **Professional Writing**: Executive summaries and action plans

**Learning Activities:**
- Case analysis and problem identification
- Stakeholder impact assessment
- Solution development and evaluation
- Presentation of recommendations
- Role-play negotiations and discussions
- Written business communication tasks

**Success Criteria:**
- Demonstrates understanding of business context
- Uses appropriate professional language
- Shows analytical and problem-solving skills
- Applies ${context.businessDomain} knowledge effectively
- Communicates recommendations clearly and persuasively

Please create a case that requires active use of business English skills while solving realistic professional challenges.`;
  }

  private buildRoleplayPrompt(context: ContentGenerationContext, specs: ContentSpecs): string {
    return `Create interactive business roleplay scenario for ${context.cefrLevel} level.
Industry: ${context.businessDomain}
Focus on professional communication and problem-solving.`;
  }
}

// Export singleton instance
export const contentGenerator = ContentGenerationEngine.getInstance();