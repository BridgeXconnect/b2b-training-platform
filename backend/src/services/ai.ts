import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';

const anthropic = new Anthropic();

// ─── Zod schemas ─────────────────────────────────────────────────────────────

const SOPAnalysisSchema = z.object({
  keyResponsibilities: z.array(z.string()),
  communicationNeeds: z.array(z.string()),
  industryTerminology: z.array(z.string()),
  skillsGaps: z.array(z.string()),
  trainingFocus: z.array(z.string()),
  recommendedCEFRLevel: z.string(),
  rationale: z.string(),
});

const CourseActivitySchema = z.object({
  type: z.enum(['reading', 'speaking', 'writing', 'vocabulary', 'grammar', 'listening']),
  title: z.string(),
  description: z.string(),
  sopIntegrated: z.boolean(),
  estimatedMinutes: z.number(),
});

const CourseLessonSchema = z.object({
  title: z.string(),
  duration: z.number(),
  cefrFocus: z.string(),
  skillsFocus: z.array(z.string()),
  activities: z.array(CourseActivitySchema),
});

const CourseModuleSchema = z.object({
  title: z.string(),
  description: z.string(),
  learningObjectives: z.array(z.string()),
  lessons: z.array(CourseLessonSchema),
  assessment: z.object({
    title: z.string(),
    type: z.enum(['quiz', 'presentation', 'assignment']),
    description: z.string(),
    passingScore: z.number(),
  }),
});

const GeneratedCourseDataSchema = z.object({
  title: z.string(),
  description: z.string(),
  modules: z.array(CourseModuleSchema),
});

// ─── Exported types ───────────────────────────────────────────────────────────

export type SOPAnalysis = z.infer<typeof SOPAnalysisSchema>;
export type CourseActivity = z.infer<typeof CourseActivitySchema>;
export type CourseLesson = z.infer<typeof CourseLessonSchema>;
export type CourseModule = z.infer<typeof CourseModuleSchema>;
export type GeneratedCourseData = z.infer<typeof GeneratedCourseDataSchema>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractJSON(text: string): unknown {
  const codeBlock = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) return JSON.parse(codeBlock[1].trim());

  const raw = text.match(/(\{[\s\S]*\})/);
  if (raw) return JSON.parse(raw[1]);

  throw new Error('Could not parse JSON from AI response');
}

// ─── AI functions ─────────────────────────────────────────────────────────────

export async function analyzeSOPDocument(
  text: string,
  context: { companyName: string; industry: string; currentLevel: string; targetLevel: string }
): Promise<SOPAnalysis> {
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    system:
      'You are an expert EFL/ESL curriculum designer specializing in corporate training needs analysis. Respond with valid JSON only — no prose, no markdown.',
    messages: [
      {
        role: 'user',
        content: `Analyze this SOP document to identify English training needs for a B2B program.

Company: ${context.companyName}
Industry: ${context.industry}
Training progression: CEFR ${context.currentLevel} → ${context.targetLevel}

SOP Document:
${text.slice(0, 10000)}

Return a JSON object with exactly these keys:
{
  "keyResponsibilities": ["up to 5 job responsibilities that require strong English"],
  "communicationNeeds": ["up to 5 specific workplace communication scenarios"],
  "industryTerminology": ["up to 10 technical/domain terms from the SOP that learners must master"],
  "skillsGaps": ["up to 5 English skill gaps suggested by this SOP's complexity and context"],
  "trainingFocus": ["up to 4 recommended priority areas for the English course"],
  "recommendedCEFRLevel": "e.g. B2",
  "rationale": "2–3 sentences explaining the analysis and level recommendation"
}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude');
  return SOPAnalysisSchema.parse(extractJSON(content.text));
}

export async function generateCourse(params: {
  companyName: string;
  industry: string;
  currentLevel: string;
  targetLevel: string;
  participantCount: number;
  departments: string[];
  goals: string[];
  painPoints: string[];
  totalHours: number;
  lessonsPerModule: number;
  deliveryMethod: string;
  sopAnalysis: Record<string, unknown> | null;
}): Promise<GeneratedCourseData> {
  const moduleCount = Math.min(Math.ceil(params.totalHours / 8), 6);

  const sopSection = params.sopAnalysis
    ? `SOP Analysis (use this to make content company-specific):
- Key Responsibilities: ${(params.sopAnalysis.keyResponsibilities as string[]).join(', ')}
- Communication Needs: ${(params.sopAnalysis.communicationNeeds as string[]).join(', ')}
- Industry Terminology to integrate: ${(params.sopAnalysis.industryTerminology as string[]).join(', ')}
- Skills Gaps to address: ${(params.sopAnalysis.skillsGaps as string[]).join(', ')}
- Recommended Training Focus: ${(params.sopAnalysis.trainingFocus as string[]).join(', ')}`
    : 'No SOP provided — base content on industry best practices for the sector.';

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 4096,
    system:
      'You are a world-class EFL/ESL curriculum designer for corporate clients. Your courses are specific, practical, and measurable. Respond with valid JSON only — no prose, no markdown.',
    messages: [
      {
        role: 'user',
        content: `Design a complete B2B English training course with exactly ${moduleCount} modules.

CLIENT PROFILE:
- Company: ${params.companyName}
- Industry: ${params.industry}
- Audience: ${params.participantCount} staff from ${params.departments.join(', ')}
- CEFR Progression: ${params.currentLevel} → ${params.targetLevel}
- Total Duration: ${params.totalHours} hours (${params.lessonsPerModule} lessons per module, each 90 min)
- Delivery: ${params.deliveryMethod}

TRAINING OBJECTIVES:
${params.goals.map((g) => `- ${g}`).join('\n')}

PAIN POINTS:
${params.painPoints.map((p) => `- ${p}`).join('\n')}

${sopSection}

REQUIREMENTS:
- Generate exactly ${moduleCount} modules
- Each module has exactly ${params.lessonsPerModule} lessons
- Make titles, activities and examples specific to ${params.companyName} and the ${params.industry} sector
- Every activity description must reference real workplace scenarios, not generic filler
- Where SOP terminology was provided, weave it into activities naturally

Return a JSON object:
{
  "title": "Descriptive course title specific to the company and CEFR target",
  "description": "2–3 sentences describing what participants will achieve",
  "modules": [
    {
      "title": "Module title referencing specific skill or topic",
      "description": "What this module covers and why it matters for this company",
      "learningObjectives": ["3–4 specific, measurable, action-verb objectives"],
      "lessons": [
        {
          "title": "Specific lesson title",
          "duration": 90,
          "cefrFocus": "${params.targetLevel}",
          "skillsFocus": ["reading", "writing"],
          "activities": [
            {
              "type": "reading|speaking|writing|vocabulary|grammar|listening",
              "title": "Activity title",
              "description": "Detailed description with company/industry context",
              "sopIntegrated": true,
              "estimatedMinutes": 25
            }
          ]
        }
      ],
      "assessment": {
        "title": "Assessment title",
        "type": "quiz|presentation|assignment",
        "description": "What participants must demonstrate to pass",
        "passingScore": 75
      }
    }
  ]
}`,
      },
    ],
  });

  const content = response.content[0];
  if (content.type !== 'text') throw new Error('Unexpected response type from Claude');
  return GeneratedCourseDataSchema.parse(extractJSON(content.text));
}
