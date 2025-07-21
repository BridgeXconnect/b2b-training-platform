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
  curateContentAction,
  actionRegistry
} from "../../../lib/copilotkit/advancedActions";

// Configure OpenAI adapter with environment variables
const serviceAdapter = new OpenAIAdapter({
  model: "gpt-4-turbo-preview", // Use latest GPT-4 model
});

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
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
}; 