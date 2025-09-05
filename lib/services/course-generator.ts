/**
 * Simple Course Generator Service
 * Replaces the complex BMAD multi-agent system with direct OpenAI integration
 */

import { OpenAI } from 'openai';

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY environment variable is not set');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CourseRequest {
  clientNeeds: string;
  industry: string;
  cefrLevel: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
  duration: string; // e.g., "4 weeks", "2 months"
  participants: number;
  specificGoals?: string[];
}

export interface CurriculumOutline {
  courseTitle: string;
  duration: string;
  cefrLevel: string;
  learningObjectives: string[];
  modules: Module[];
  assessmentStrategy: string;
  estimatedHours: number;
}

export interface Module {
  moduleNumber: number;
  title: string;
  duration: string;
  objectives: string[];
  topics: string[];
  activities: string[];
  keyVocabulary: string[];
}

export interface FullCourse {
  curriculum: CurriculumOutline;
  lessonPlans: LessonPlan[];
  trainerGuides: TrainerGuide[];
  studentMaterials: StudentMaterial[];
  assessments: Assessment[];
}

export interface LessonPlan {
  moduleNumber: number;
  lessonNumber: number;
  title: string;
  duration: number; // minutes
  objectives: string[];
  materials: string[];
  procedures: ProcedureStep[];
  assessment: string;
}

export interface ProcedureStep {
  step: number;
  activity: string;
  duration: number;
  materials: string[];
  instructions: string;
}

export interface TrainerGuide {
  moduleNumber: number;
  title: string;
  overview: string;
  preparation: string[];
  tips: string[];
  commonChallenges: string[];
  extensions: string[];
}

export interface StudentMaterial {
  moduleNumber: number;
  type: 'worksheet' | 'reading' | 'vocabulary' | 'practice';
  title: string;
  content: string;
  instructions: string;
}

export interface Assessment {
  moduleNumber: number;
  type: 'formative' | 'summative';
  title: string;
  instructions: string;
  questions: Question[];
  rubric: string;
}

export interface Question {
  questionNumber: number;
  type: 'multiple-choice' | 'short-answer' | 'essay' | 'speaking' | 'listening';
  question: string;
  options?: string[]; // for multiple choice
  expectedAnswer?: string;
  points: number;
}

export class CourseGeneratorService {
  /**
   * Generate curriculum outline from client requirements
   */
  static async generateCurriculum(request: CourseRequest): Promise<CurriculumOutline> {
    const prompt = `Create a detailed English curriculum outline for:

Client Industry: ${request.industry}
Client Needs: ${request.clientNeeds}
CEFR Level: ${request.cefrLevel}
Duration: ${request.duration}
Number of Participants: ${request.participants}
${request.specificGoals ? `Specific Goals: ${request.specificGoals.join(', ')}` : ''}

Create a comprehensive curriculum outline with:
1. Course title that reflects the business context
2. Clear learning objectives aligned with CEFR ${request.cefrLevel}
3. 4-6 modules with specific topics and activities
4. Assessment strategy
5. Estimated total hours

Respond with a structured JSON format matching the CurriculumOutline interface.`;

    try {
      console.log('🤖 Generating curriculum with OpenAI...');
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Use more affordable and reliable model
        messages: [
          {
            role: 'system',
            content: 'You are an expert English language curriculum designer specializing in business English. Create detailed, CEFR-aligned curricula for corporate clients. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.7,
      });

      const content = completion.choices[0]?.message?.content;
      if (!content) {
        throw new Error('No content received from OpenAI');
      }

      // Parse JSON response
      const curriculum = JSON.parse(content) as CurriculumOutline;
      
      // Validate required fields
      if (!curriculum.courseTitle || !curriculum.modules || curriculum.modules.length === 0) {
        throw new Error('Invalid curriculum structure received');
      }

      return curriculum;
    } catch (error) {
      console.error('OpenAI API Error:', error);
      
      // Check if it's a quota/billing error and provide demo fallback
      if (error instanceof Error && error.message.includes('quota')) {
        console.log('🎯 OpenAI quota exceeded, using demo curriculum...');
        return this.generateDemoCurriculum(request);
      }
      
      throw new Error('Failed to generate curriculum. Please try again.');
    }
  }

  /**
   * Generate demo curriculum for testing when OpenAI API is unavailable
   */
  static async generateDemoCurriculum(request: CourseRequest): Promise<CurriculumOutline> {
    console.log('🎭 Generating demo curriculum for:', request.industry);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return {
      courseTitle: `Business English for ${request.industry} Professionals`,
      duration: request.duration,
      cefrLevel: request.cefrLevel,
      learningObjectives: [
        `Communicate effectively in ${request.industry} contexts at ${request.cefrLevel} level`,
        "Master industry-specific vocabulary and terminology",
        "Develop professional presentation and meeting skills",
        "Improve written communication for business correspondence"
      ],
      modules: [
        {
          moduleNumber: 1,
          title: "Professional Communication Foundations",
          duration: "1 week",
          objectives: [
            "Establish professional rapport",
            "Master basic business vocabulary",
            "Practice formal introductions"
          ],
          topics: [
            "Business greetings and introductions",
            "Professional email etiquette",
            "Company culture and hierarchy"
          ],
          activities: [
            "Role-play networking scenarios",
            "Email writing workshop",
            "Company presentation practice"
          ],
          keyVocabulary: ["colleague", "department", "responsibility", "schedule", "deadline"]
        },
        {
          moduleNumber: 2,
          title: `${request.industry} Industry Focus`,
          duration: "1 week",
          objectives: [
            "Use industry-specific terminology",
            "Discuss industry trends and challenges",
            "Present solutions professionally"
          ],
          topics: [
            `Key ${request.industry} terminology`,
            "Industry best practices",
            "Problem-solving discussions"
          ],
          activities: [
            "Industry case study analysis",
            "Technical presentation practice",
            "Problem-solution role plays"
          ],
          keyVocabulary: ["analysis", "solution", "implement", "efficiency", "optimization"]
        },
        {
          moduleNumber: 3,
          title: "Meeting and Presentation Skills",
          duration: "1 week",
          objectives: [
            "Lead and participate in meetings effectively",
            "Deliver clear, structured presentations",
            "Handle questions and feedback professionally"
          ],
          topics: [
            "Meeting agenda and facilitation",
            "Presentation structure and delivery",
            "Q&A handling techniques"
          ],
          activities: [
            "Mock meeting facilitation",
            "Presentation delivery practice",
            "Feedback and discussion sessions"
          ],
          keyVocabulary: ["agenda", "facilitate", "presentation", "feedback", "conclusion"]
        },
        {
          moduleNumber: 4,
          title: "Advanced Business Writing",
          duration: "1 week",
          objectives: [
            "Write professional reports and proposals",
            "Master persuasive writing techniques",
            "Adapt tone for different audiences"
          ],
          topics: [
            "Report writing structure",
            "Proposal development",
            "Professional correspondence"
          ],
          activities: [
            "Report writing workshop",
            "Proposal development project",
            "Peer review sessions"
          ],
          keyVocabulary: ["proposal", "recommendation", "analysis", "strategy", "implementation"]
        }
      ],
      assessmentStrategy: "Continuous assessment through practical tasks, peer evaluation, and final project presentation",
      estimatedHours: 32
    };
  }

  /**
   * Generate full course materials from approved curriculum
   */
  static async generateFullCourse(curriculum: CurriculumOutline): Promise<FullCourse> {
    try {
      // Generate lesson plans for each module
      const lessonPlans: LessonPlan[] = [];
      const trainerGuides: TrainerGuide[] = [];
      const studentMaterials: StudentMaterial[] = [];
      const assessments: Assessment[] = [];

      for (const module of curriculum.modules) {
        // Generate lesson plans for this module
        const moduleLessonPlans = await this.generateLessonPlans(module, curriculum.cefrLevel);
        lessonPlans.push(...moduleLessonPlans);

        // Generate trainer guide
        const trainerGuide = await this.generateTrainerGuide(module, curriculum.cefrLevel);
        trainerGuides.push(trainerGuide);

        // Generate student materials
        const materials = await this.generateStudentMaterials(module, curriculum.cefrLevel);
        studentMaterials.push(...materials);

        // Generate assessments
        const moduleAssessments = await this.generateAssessments(module, curriculum.cefrLevel);
        assessments.push(...moduleAssessments);
      }

      return {
        curriculum,
        lessonPlans,
        trainerGuides,
        studentMaterials,
        assessments
      };
    } catch (error) {
      console.error('Error generating full course:', error);
      throw new Error('Failed to generate full course materials. Please try again.');
    }
  }

  private static async generateLessonPlans(module: Module, cefrLevel: string): Promise<LessonPlan[]> {
    const prompt = `Create detailed lesson plans for this module:

Module: ${module.title}
CEFR Level: ${cefrLevel}
Duration: ${module.duration}
Objectives: ${module.objectives.join(', ')}
Topics: ${module.topics.join(', ')}
Activities: ${module.activities.join(', ')}

Create 2-3 lesson plans for this module. Each lesson should be 60-90 minutes.
Include step-by-step procedures with timing, materials, and clear instructions.

Respond with valid JSON array matching the LessonPlan interface.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert English language teacher creating detailed lesson plans. Focus on practical, engaging activities aligned with CEFR levels. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1500,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No content received');

    return JSON.parse(content) as LessonPlan[];
  }

  private static async generateTrainerGuide(module: Module, cefrLevel: string): Promise<TrainerGuide> {
    const prompt = `Create a trainer guide for this module:

Module: ${module.title}
CEFR Level: ${cefrLevel}
Objectives: ${module.objectives.join(', ')}

Include:
- Module overview
- Preparation checklist
- Teaching tips
- Common student challenges and solutions
- Extension activities

Respond with valid JSON matching the TrainerGuide interface.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert English language trainer creating comprehensive trainer guides. Focus on practical teaching advice and solutions. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No content received');

    return JSON.parse(content) as TrainerGuide;
  }

  private static async generateStudentMaterials(module: Module, cefrLevel: string): Promise<StudentMaterial[]> {
    const prompt = `Create student materials for this module:

Module: ${module.title}
CEFR Level: ${cefrLevel}
Key Vocabulary: ${module.keyVocabulary?.join(', ') || 'Business English vocabulary'}

Create 2-3 different materials:
1. Vocabulary worksheet
2. Reading/dialogue material
3. Practice exercises

Respond with valid JSON array matching the StudentMaterial interface.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert creating engaging student materials for business English. Materials should be practical and CEFR-appropriate. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1200,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No content received');

    return JSON.parse(content) as StudentMaterial[];
  }

  private static async generateAssessments(module: Module, cefrLevel: string): Promise<Assessment[]> {
    const prompt = `Create assessments for this module:

Module: ${module.title}
CEFR Level: ${cefrLevel}
Objectives: ${module.objectives.join(', ')}

Create:
1. One formative assessment (progress check)
2. One summative assessment (module completion)

Include varied question types appropriate for ${cefrLevel} level.

Respond with valid JSON array matching the Assessment interface.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert creating CEFR-aligned assessments for business English. Include varied question types and clear rubrics. Always respond with valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 1200,
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) throw new Error('No content received');

    return JSON.parse(content) as Assessment[];
  }
}