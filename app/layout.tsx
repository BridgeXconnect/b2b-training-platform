import type { Metadata } from "next";
import "./globals.css";
import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { AuthProvider } from "../lib/contexts/AuthContext";
import { ChunkLoadErrorBoundary } from "../components/ui/ChunkLoadErrorBoundary";
import "@fontsource/geist-sans/400.css";
import "@fontsource/geist-sans/500.css";
import "@fontsource/geist-sans/600.css";
import "@fontsource/geist-sans/700.css";
import "@fontsource/geist-mono/400.css";
import "@fontsource/geist-mono/500.css";

export const metadata: Metadata = {
  title: "B2B English Training Platform",
  description: "AI-powered CEFR-aligned English course generation for corporate clients using SOPs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ChunkLoadErrorBoundary>
          <AuthProvider>
            <CopilotKit runtimeUrl="/api/copilotkit">
              <CopilotSidebar
                instructions="You are an AI assistant for the B2B English Training Platform. Help users with lesson creation, progress analysis, assessments, and personalized learning experiences. You can create content, analyze progress, and provide recommendations based on CEFR levels and learning goals."
                labels={{
                  title: "English Learning Assistant",
                  initial: "Hello! I'm here to help you with your English learning journey. I can create personalized lessons, analyze your progress, generate assessments, and provide study recommendations. What would you like to work on today?",
                }}
                defaultOpen={false}
                clickOutsideToClose={true}
              >
                {children}
              </CopilotSidebar>
            </CopilotKit>
          </AuthProvider>
        </ChunkLoadErrorBoundary>
      </body>
    </html>
  );
}
