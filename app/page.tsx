import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { BookOpen, Brain, Target, Users } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16 pt-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <BookOpen className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">B2B English Training</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Upload your company SOPs. Claude reads them, finds the skill gaps, and builds a
            complete CEFR-aligned English course — specific to your industry and team.
          </p>
          <div className="mt-8">
            <Link href="/sales">
              <Button size="lg" className="px-8">Go to Sales Portal</Button>
            </Link>
            <Link href="/login" className="ml-4">
              <Button size="lg" variant="outline">Sign In</Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Brain className="h-8 w-8 text-blue-600 mb-2" />
              <CardTitle>Real AI. No smoke.</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-600 text-sm">
              Claude reads your SOPs, extracts terminology, identifies communication gaps, and
              writes lesson plans. Not a template. Not a mock. Actual Claude output, saved to
              your database.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Target className="h-8 w-8 text-green-600 mb-2" />
              <CardTitle>CEFR-aligned</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-600 text-sm">
              Every module is designed against the target CEFR level your team needs — A1 to
              C2. Learning objectives are specific and measurable, not generic filler.
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-purple-600 mb-2" />
              <CardTitle>Built for your business</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-600 text-sm">
              Activities reference your actual workflows, your industry vocabulary, and your
              team&apos;s real communication scenarios — not generic &ldquo;business English&rdquo; fluff.
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          Stack: Next.js · Express · Prisma · Supabase · Anthropic Claude · TypeScript
        </div>
      </div>
    </div>
  );
}
