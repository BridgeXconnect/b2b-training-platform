'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Sparkles, 
  Image, 
  Play, 
  Users, 
  MessageSquare,
  Brain,
  Target,
  TrendingUp,
  Award,
  CheckCircle,
  Calendar,
  BookOpen
} from 'lucide-react';

interface AdvancedChatCapabilityProps {
  sessionId?: string;
}

export function AdvancedChatCapability({ 
  sessionId 
}: AdvancedChatCapabilityProps) {
  const [activeCapability, setActiveCapability] = useState<string | null>(null);
  const [availableCapabilities, setAvailableCapabilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Simplified demo without BMAD system
  useEffect(() => {
    // Set demo capabilities (removed BMAD system integration)
    setAvailableCapabilities([
      {
        id: 'lesson-creation',
        name: 'AI Lesson Creation',
        description: 'Generate complete lessons with activities and assessments',
        type: 'content',
        icon: BookOpen,
        active: true
      },
      {
        id: 'conversation-practice',
        name: 'Conversation Practice',
        description: 'Interactive dialogue practice with AI feedback',
        type: 'conversation',
        icon: MessageSquare,
        active: true
      }
    ]);
  }, [sessionId]);

  const handleDemoCapability = async (capabilityId: string) => {
    setLoading(true);
    setActiveCapability(capabilityId);
    
    // Simulate API call (removed BMAD integration)
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {availableCapabilities.map((capability) => (
          <Card key={capability.id} className="cursor-pointer hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <capability.icon className="h-5 w-5 text-blue-600" />
                  <CardTitle className="text-sm">{capability.name}</CardTitle>
                </div>
                <Badge variant={capability.active ? "default" : "secondary"}>
                  {capability.active ? "Active" : "Demo"}
                </Badge>
              </div>
              <CardDescription className="text-xs">
                {capability.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={() => handleDemoCapability(capability.id)}
                disabled={loading}
                className="w-full"
                size="sm"
              >
                {loading && activeCapability === capability.id ? "Processing..." : "Try Demo"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeCapability && (
        <Alert>
          <Sparkles className="h-4 w-4" />
          <AlertDescription>
            Demo mode: BMAD system has been simplified for MVP. This would normally show advanced AI agent capabilities.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}