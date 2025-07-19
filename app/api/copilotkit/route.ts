import { 
  CopilotRuntime, 
  OpenAIAdapter,
  copilotRuntimeNextJSAppRouterEndpoint 
} from "@copilotkit/runtime";
import { NextRequest } from "next/server";

// Configure OpenAI adapter with environment variables
const serviceAdapter = new OpenAIAdapter({
  openai: {
    apiKey: process.env.OPENAI_API_KEY || "",
    organization: process.env.OPENAI_ORG_ID || undefined, // Optional
  },
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