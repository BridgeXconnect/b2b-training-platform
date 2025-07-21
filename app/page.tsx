'use client';

import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Building, Users, BookOpen, Target, BarChart } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 pt-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            B2B English Training Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            AI-powered CEFR-aligned English course generation for corporate clients using their Standard Operating Procedures
          </p>
        </div>

        {/* Platform Features */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card className="text-center">
            <CardHeader>
              <Building className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Sales Portal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Collect client requirements, upload SOPs, and track course generation requests
              </p>
              <Link href="/sales">
                <Button className="w-full">Access Sales Portal</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Target className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Course Generation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                AI-powered course creation using client SOPs and CEFR alignment
              </p>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BookOpen className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Learning Portal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                AI-powered learning with smart actions, progress tracking, and adaptive assessments
              </p>
              <Link href="/learning">
                <Button className="w-full">Access Learning Portal</Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Course Manager</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Review, approve, and manage AI-generated course curricula
              </p>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <BookOpen className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <CardTitle>Trainer Portal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Access lesson plans, slides, and teaching materials
              </p>
              <Button variant="outline" className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Key Features */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">Platform Capabilities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
              <div>
                <h3 className="font-semibold mb-2">SOP Integration</h3>
                <p className="text-sm text-gray-600">Process company SOPs using RAG technology</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">CEFR Alignment</h3>
                <p className="text-sm text-gray-600">Automatically align content with CEFR levels</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">AI Course Generation</h3>
                <p className="text-sm text-gray-600">Generate complete curricula in minutes</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Multi-Role Support</h3>
                <p className="text-sm text-gray-600">Sales, managers, trainers, and students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Development Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-center">Development Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Sales Portal</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">✅ Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">SOP Upload System</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">✅ Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Learning Portal</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">✅ Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Course Generation Engine</span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">🔄 In Development</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Course Manager Dashboard</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">⏳ Planned</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Advanced AI Features</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">🚀 Story 5.1 Complete</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Trainer & Student Portals</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm">⏳ Planned</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
