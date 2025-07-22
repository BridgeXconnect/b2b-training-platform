'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="px-4 py-12 md:py-24 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            AI-Powered B2B English Training
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Transform your corporate English training with AI-driven, CEFR-aligned courses tailored to your business SOPs.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/learning">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Start Learning
              </Button>
            </Link>
            <Link href="/sales">
              <Button variant="outline" size="lg">
                Request Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Platform Features
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Everything you need for effective corporate English training
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="secondary">AI</Badge>
                  Adaptive Learning
                </CardTitle>
                <CardDescription>
                  Personalized learning paths that adapt to each learner's progress and CEFR level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our AI continuously analyzes performance and adjusts content difficulty, ensuring optimal learning outcomes.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="secondary">CEFR</Badge>
                  Standards Aligned
                </CardTitle>
                <CardDescription>
                  All content follows CEFR standards for international English proficiency
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  From A1 to C2, every lesson and assessment is mapped to CEFR levels for consistent progress tracking.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Badge variant="secondary">Business</Badge>
                  Context Integration
                </CardTitle>
                <CardDescription>
                  Custom content based on your company's SOPs and business scenarios
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Generate training materials that reflect your specific industry, processes, and communication needs.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Theme Test Section */}
      <section className="px-4 py-12 lg:px-8 bg-muted/50">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              TweakCN Theme Test
            </h2>
            <p className="mt-2 text-muted-foreground">
              Testing the new design system implementation
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Light Mode Colors</CardTitle>
                <CardDescription>Testing the new color palette</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-primary"></div>
                  <span className="text-sm">Primary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-secondary"></div>
                  <span className="text-sm">Secondary</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-accent"></div>
                  <span className="text-sm">Accent</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-destructive"></div>
                  <span className="text-sm">Destructive</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Typography</CardTitle>
                <CardDescription>Geist font family test</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <h1 className="text-2xl font-bold">Heading 1 - Bold</h1>
                <h2 className="text-xl font-semibold">Heading 2 - Semibold</h2>
                <h3 className="text-lg font-medium">Heading 3 - Medium</h3>
                <p className="text-base">Body text - Regular</p>
                <p className="text-sm text-muted-foreground">Small muted text</p>
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">Monospace font</code>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
