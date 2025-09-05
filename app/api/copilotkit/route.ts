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
// Removed BMAD system - using standard CopilotKit actions

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
  // Standard CopilotKit handling (BMAD system removed for MVP simplification)
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
}; 