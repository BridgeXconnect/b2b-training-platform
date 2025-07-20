'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Award,
  ArrowUp,
  CheckCircle,
  AlertCircle 
} from 'lucide-react';
import {
  CEFRTracking,
  CEFRLevel,
  CEFRProgressionEntry,
} from '../../lib/types/user';
import { 
  calculateCEFRProgression, 
  CEFR_LEVELS 
} from '../../lib/utils/profile';

interface CEFRTrackerProps {
  tracking: CEFRTracking;
  onLevelUpdate: (currentLevel: CEFRLevel, targetLevel: CEFRLevel) => Promise<void>;
}

const CEFR_DESCRIPTIONS: Record<CEFRLevel, { name: string; description: string; skills: string[] }> = {
  A1: {
    name: 'Beginner',
    description: 'Can understand and use familiar everyday expressions and very basic phrases',
    skills: ['Basic greetings', 'Simple personal information', 'Basic shopping', 'Simple directions']
  },
  A2: {
    name: 'Elementary',
    description: 'Can communicate in simple and routine tasks requiring direct exchange of information',
    skills: ['Family and work topics', 'Simple past experiences', 'Basic travel needs', 'Simple social exchanges']
  },
  B1: {
    name: 'Intermediate',
    description: 'Can deal with most situations likely to arise whilst travelling in an area where the language is spoken',
    skills: ['Work discussions', 'Travel situations', 'Personal experiences', 'Future plans']
  },
  B2: {
    name: 'Upper Intermediate',
    description: 'Can understand the main ideas of complex text and interact with native speakers with fluency',
    skills: ['Complex topics', 'Professional discussions', 'Abstract concepts', 'Detailed explanations']
  },
  C1: {
    name: 'Advanced',
    description: 'Can express ideas fluently and spontaneously without much obvious searching for expressions',
    skills: ['Professional communication', 'Academic discussions', 'Nuanced expression', 'Complex negotiations']
  },
  C2: {
    name: 'Proficient',
    description: 'Can understand virtually everything heard or read with ease and express themselves very fluently',
    skills: ['Native-like fluency', 'Subtle distinctions', 'Complex literature', 'Professional expertise']
  }
};

export default function CEFRTracker({ tracking, onLevelUpdate }: CEFRTrackerProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedCurrentLevel, setSelectedCurrentLevel] = useState<CEFRLevel>(tracking.currentLevel);
  const [selectedTargetLevel, setSelectedTargetLevel] = useState<CEFRLevel>(tracking.targetLevel);

  // Calculate progression data
  const progressionData = calculateCEFRProgression(tracking);

  // Handle level update
  const handleLevelUpdate = async () => {
    if (selectedCurrentLevel === tracking.currentLevel && selectedTargetLevel === tracking.targetLevel) {
      return;
    }

    setIsUpdating(true);
    try {
      await onLevelUpdate(selectedCurrentLevel, selectedTargetLevel);
    } catch (error) {
      console.error('Error updating CEFR levels:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // Get level color
  const getLevelColor = (level: CEFRLevel): string => {
    const colors: Record<CEFRLevel, string> = {
      A1: 'bg-red-100 text-red-800',
      A2: 'bg-orange-100 text-orange-800',
      B1: 'bg-yellow-100 text-yellow-800',
      B2: 'bg-blue-100 text-blue-800',
      C1: 'bg-purple-100 text-purple-800',
      C2: 'bg-green-100 text-green-800',
    };
    return colors[level];
  };

  // Format date
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="w-5 h-5" />
            <span>CEFR Level Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Current Level */}
            <div className="text-center">
              <div className="mb-4">
                <Badge className={`text-2xl px-4 py-2 ${getLevelColor(tracking.currentLevel)}`}>
                  {tracking.currentLevel}
                </Badge>
              </div>
              <h3 className="text-lg font-semibold mb-2">Current Level</h3>
              <p className="text-sm text-gray-600 mb-2">
                {CEFR_DESCRIPTIONS[tracking.currentLevel].name}
              </p>
              <p className="text-xs text-gray-500">
                {CEFR_DESCRIPTIONS[tracking.currentLevel].description}
              </p>
            </div>

            {/* Target Level */}
            <div className="text-center">
              <div className="mb-4">
                <Badge className={`text-2xl px-4 py-2 ${getLevelColor(tracking.targetLevel)}`} variant="outline">
                  {tracking.targetLevel}
                </Badge>
              </div>
              <h3 className="text-lg font-semibold mb-2">Target Level</h3>
              <p className="text-sm text-gray-600 mb-2">
                {CEFR_DESCRIPTIONS[tracking.targetLevel].name}
              </p>
              <div className="flex items-center justify-center space-x-2">
                <Progress value={progressionData.progressToNext} className="w-24" />
                <span className="text-sm text-gray-600">{progressionData.progressToNext}%</span>
              </div>
            </div>
          </div>

          {/* Progression Recommendation */}
          {progressionData.recommendation && (
            <div className={`mt-6 p-4 rounded-lg border ${
              progressionData.canAdvance 
                ? 'border-green-200 bg-green-50' 
                : 'border-blue-200 bg-blue-50'
            }`}>
              <div className="flex items-start space-x-2">
                {progressionData.canAdvance ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                )}
                <p className="text-sm">{progressionData.recommendation}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skill Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Skill Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(tracking.skillBreakdown).map(([skill, level]) => (
              <div key={skill} className="text-center">
                <Badge className={`mb-2 ${getLevelColor(level)}`}>
                  {level}
                </Badge>
                <p className="text-sm font-medium capitalize">{skill}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Assessments */}
      {tracking.assessmentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5" />
              <span>Recent Assessments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tracking.assessmentHistory
                .slice(0, 5)
                .map((assessment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge className={getLevelColor(assessment.level)}>
                        {assessment.level}
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">Score: {assessment.score}%</p>
                        <p className="text-xs text-gray-500">
                          {formatDate(assessment.completedAt)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {assessment.score >= 80 ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progression History */}
      {tracking.progressionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>Progression History</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {tracking.progressionHistory
                .slice()
                .reverse()
                .map((entry, index) => (
                  <div key={index} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <ArrowUp className="w-4 h-4 text-green-600" />
                    <Badge className={getLevelColor(entry.level)}>
                      {entry.level}
                    </Badge>
                    <div className="flex-1">
                      <p className="text-sm">
                        Advanced to {CEFR_DESCRIPTIONS[entry.level].name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDate(entry.achievedAt)} • {entry.method}
                        {entry.score && ` • Score: ${entry.score}%`}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Level Management */}
      <Card>
        <CardHeader>
          <CardTitle>Update CEFR Levels</CardTitle>
          <p className="text-sm text-gray-600">
            Manually adjust your current and target CEFR levels
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            
            {/* Current Level Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Current Level</label>
              <div className="grid grid-cols-3 gap-2">
                {CEFR_LEVELS.map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={selectedCurrentLevel === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCurrentLevel(level)}
                    className="justify-center"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            {/* Target Level Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Target Level</label>
              <div className="grid grid-cols-3 gap-2">
                {CEFR_LEVELS.map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={selectedTargetLevel === level ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedTargetLevel(level)}
                    className="justify-center"
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Selected Levels Info */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium">Current: {selectedCurrentLevel}</p>
                <p className="text-gray-600">{CEFR_DESCRIPTIONS[selectedCurrentLevel].name}</p>
              </div>
              <div>
                <p className="font-medium">Target: {selectedTargetLevel}</p>
                <p className="text-gray-600">{CEFR_DESCRIPTIONS[selectedTargetLevel].name}</p>
              </div>
            </div>
          </div>

          {/* Update Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleLevelUpdate}
              disabled={
                isUpdating || 
                (selectedCurrentLevel === tracking.currentLevel && selectedTargetLevel === tracking.targetLevel)
              }
              className="flex items-center space-x-2"
            >
              <Clock className="w-4 h-4" />
              <span>{isUpdating ? 'Updating...' : 'Update Levels'}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}