import { 
  CopilotRuntime, 
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint 
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";
import { 
  createLessonAction,
  analyzeProgressAction,
  createAssessmentAction,
  createStudyPlanAction,
  generateContentAction,
  curateContentAction
} from "../../../lib/copilotkit/advancedActions";
import { BMADApiHandlers } from '@/lib/agents/api-integration';

// Dynamic service adapter selection
function getServiceAdapter(adapterName?: string) {
  const adapter = adapterName || process.env.COPILOT_ADAPTER || "openai";
  
  switch (adapter.toLowerCase()) {
    case "openai":
      return new OpenAIAdapter({
        model: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
      });
    default:
      console.warn(`Unknown adapter: ${adapter}, falling back to OpenAI`);
      return new OpenAIAdapter({
        model: "gpt-4-turbo-preview",
      });
  }
}

const serviceAdapter = getServiceAdapter();

// Initialize runtime with advanced actions
const runtime = new CopilotRuntime({
  actions: [
    createLessonAction,
    analyzeProgressAction,
    createAssessmentAction,
    createStudyPlanAction,
    generateContentAction,
    curateContentAction
  ]
});

export const POST = async (req: NextRequest) => {
  // Try BMAD system integration for enhanced CopilotKit actions
  try {
    // Check if this is a BMAD-compatible request
    const body = await req.clone().json().catch(() => ({}));
    if (body.action && ['createLesson', 'analyzeProgress', 'createAssessment', 'createStudyPlan', 'generateContent', 'curateContent'].includes(body.action)) {
      return await BMADApiHandlers.handleCopilotKitRequest(req);
    }
  } catch (bmadError) {
    console.warn('BMAD CopilotKit integration failed, using standard CopilotKit:', bmadError);
  }

  // Standard CopilotKit handling
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
}; 