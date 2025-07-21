import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CopilotKit } from "@copilotkit/react-core";
import { AuthProvider } from "../lib/contexts/AuthContext";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

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
      <body
        className={`${inter.variable} antialiased`}
      >
        <AuthProvider>
          <CopilotKit runtimeUrl="/api/copilotkit">{children}</CopilotKit>
        </AuthProvider>
      </body>
    </html>
  );
}
