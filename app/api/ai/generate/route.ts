import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Content type specific prompt templates
const PROMPT_TEMPLATES = {
  lesson: {
    system: `You are an expert English language learning content creator specializing in business English and CEFR-aligned materials. Create comprehensive, engaging lessons that integrate company-specific contexts and real-world business scenarios.

Generate lessons with:
1. Clear learning objectives aligned with CEFR levels
2. Practical business vocabulary and phrases
3. Real-world scenarios and examples
4. Interactive exercises and activities
5. Cultural context and professional etiquette
6. Assessment opportunities

Format your response as structured content with clear sections.`,
    template: `Create a comprehensive English lesson with the following requirements:

{{CONTEXT}}

Please structure the lesson with:
- Title and learning objectives
- Key vocabulary (10-15 terms)
- Business scenarios or examples
- Practice exercises (3-4 activities)
- Real-world application tasks
- Assessment questions

Focus on practical business communication that learners can immediately apply in their workplace.`
  },

  quiz: {
    system: `You are an expert at creating adaptive, CEFR-aligned English language assessments for business professionals. Design quizzes that test both language skills and practical business application.

Create assessments with:
1. Multiple question types (multiple choice, fill-in-blank, short answer)
2. Business context and scenarios
3. CEFR-appropriate difficulty
4. Detailed explanations for answers
5. Real-world relevance
6. Progressive difficulty levels`,
    template: `Create an adaptive English quiz with the following specifications:

{{CONTEXT}}

Please include:
- 10-15 questions of varied types
- Business scenarios and context
- Clear instructions for each section
- Answer explanations
- Scoring rubric
- Difficulty progression

Ensure questions test practical business English skills that are immediately applicable.`
  },

  vocabulary: {
    system: `You are a business English vocabulary specialist. Create comprehensive vocabulary lists with practical examples, pronunciation guides, and contextual usage for professional settings.

Generate vocabulary content with:
1. Business-relevant terms and phrases
2. Contextual examples and usage
3. Professional communication focus
4. Industry-specific terminology
5. Practical application scenarios
6. Memory aids and learning tips`,
    template: `Create a business vocabulary lesson with:

{{CONTEXT}}

Please include:
- 20-30 key business terms
- Definitions and pronunciation
- Example sentences in business context
- Common collocations and phrases
- Practice exercises
- Real workplace applications

Focus on vocabulary that professionals use daily in business communication.`
  },

  dialogue: {
    system: `You are a professional communication expert specializing in business dialogue creation. Design realistic conversations that reflect actual workplace interactions and cultural norms.

Create dialogues with:
1. Authentic business scenarios
2. Natural, professional language
3. Cultural awareness and etiquette
4. Problem-solving elements
5. Multiple communication styles
6. Learning checkpoints`,
    template: `Create professional business dialogues for:

{{CONTEXT}}

Please include:
- 3-4 realistic business conversations
- Different workplace scenarios (meetings, negotiations, presentations)
- Natural language with appropriate formality
- Cultural context and business etiquette
- Follow-up questions and analysis
- Role-play instructions

Ensure dialogues reflect real professional interactions and communication challenges.`
  },

  'business-case': {
    system: `You are a business case study expert who creates realistic scenarios for language learning. Design cases that combine business problem-solving with English language practice.

Create business cases with:
1. Realistic company scenarios
2. Problem-solving elements
3. Multiple stakeholder perspectives
4. Decision-making opportunities
5. Communication challenges
6. Measurable outcomes`,
    template: `Create a comprehensive business case study for:

{{CONTEXT}}

Please include:
- Realistic company background
- Clear business challenge or opportunity
- Stakeholder analysis
- Communication requirements
- Decision points and options
- Language learning objectives
- Assessment criteria

Ensure the case requires practical business English skills to analyze and resolve.`
  },

  roleplay: {
    system: `You are a professional training specialist who designs interactive business roleplay scenarios. Create engaging situations that require active communication and problem-solving.

Design roleplay with:
1. Realistic business situations
2. Clear role definitions
3. Specific objectives for each participant
4. Communication challenges
5. Cultural considerations
6. Success metrics`,
    template: `Create an interactive business roleplay for:

{{CONTEXT}}

Please include:
- Scenario background and context
- 2-4 distinct roles with specific objectives
- Communication challenges and obstacles
- Step-by-step instructions
- Success criteria and evaluation
- Debrief questions and learning points

Ensure the roleplay requires active use of business English in realistic professional situations.`
  }
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, contentType = 'lesson', model = 'gpt-4-turbo-preview', temperature = 0.7, maxTokens = 4000 } = body;

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Get template for content type
    const template = PROMPT_TEMPLATES[contentType as keyof typeof PROMPT_TEMPLATES] || PROMPT_TEMPLATES.lesson;
    
    // Enhance prompt with context-specific template
    const enhancedPrompt = template.template.replace('{{CONTEXT}}', prompt);

    // Call OpenAI API
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: 'system',
          content: template.system
        },
        {
          role: 'user',
          content: enhancedPrompt
        }
      ],
      temperature: temperature,
      max_tokens: maxTokens,
      presence_penalty: 0.1,
      frequency_penalty: 0.1
    });

    const generatedContent = response.choices[0]?.message?.content;

    if (!generatedContent) {
      throw new Error('No content generated from AI');
    }

    // Track usage for cost monitoring
    const usage = response.usage;
    console.log(`AI Content Generation - Tokens used: ${usage?.total_tokens}, Model: ${model}, Type: ${contentType}`);

    return NextResponse.json({
      content: generatedContent,
      metadata: {
        model: model,
        contentType: contentType,
        tokensUsed: usage?.total_tokens || 0,
        promptTokens: usage?.prompt_tokens || 0,
        completionTokens: usage?.completion_tokens || 0
      }
    });

  } catch (error) {
    console.error('AI generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Rate limiting and cost control would be handled by middleware in middleware.ts
// For now, we rely on OpenAI's built-in rate limits and the usage monitoring system