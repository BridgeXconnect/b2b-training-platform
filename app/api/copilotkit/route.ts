import { 
  CopilotRuntime, 
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint 
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";

// Configure OpenAI adapter with environment variables
const serviceAdapter = new OpenAIAdapter({
  model: "gpt-4-turbo-preview", // Use latest GPT-4 model
});

const runtime = new CopilotRuntime();

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotRuntimeNextJSAppRouterEndpoint({
    runtime,
    serviceAdapter,
    endpoint: "/api/copilotkit",
  });

  return handleRequest(req);
}; 