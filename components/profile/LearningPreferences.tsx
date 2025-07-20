'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Plus, 
  Trash2, 
  Target, 
  Clock, 
  BookOpen, 
  TrendingUp,
  Save 
} from 'lucide-react';
import {
  LearningPreferences as LearningPreferencesType,
  LearningStyle,
  LearningPace,
  ChallengeLevel,
} from '../../lib/types/user';

// Validation schema for learning preferences
const learningPreferencesSchema = z.object({
  goals: z.array(z.object({ value: z.string().min(1, 'Goal cannot be empty') }))
    .min(1, 'At least one learning goal is required'),
  businessContext: z.string().min(1, 'Business context is required'),
  industry: z.string().min(1, 'Industry is required'),
  jobRole: z.string().min(1, 'Job role is required'),
  topics: z.array(z.object({ value: z.string().min(1, 'Topic cannot be empty') })),
  learningStyle: z.enum(['visual', 'auditory', 'kinesthetic', 'mixed']),
  pace: z.enum(['slow', 'moderate', 'fast']),
  challengeLevel: z.enum(['comfortable', 'challenging', 'very-challenging']),
  focusAreas: z.array(z.object({ value: z.string().min(1, 'Focus area cannot be empty') })),
  weakAreas: z.array(z.object({ value: z.string().min(1, 'Weak area cannot be empty') })),
  motivations: z.array(z.object({ value: z.string().min(1, 'Motivation cannot be empty') })),
  studySchedule: z.object({
    preferredDays: z.array(z.string()).min(1, 'Select at least one preferred day'),
    preferredTime: z.string().min(1, 'Preferred time is required'),
    sessionDuration: z.number().min(15, 'Session must be at least 15 minutes').max(240, 'Session cannot exceed 4 hours'),
    frequency: z.enum(['daily', 'weekly', 'bi-weekly']),
    timeZone: z.string().min(1, 'Timezone is required'),
  }),
});

type LearningPreferencesFormData = z.infer<typeof learningPreferencesSchema>;

interface LearningPreferencesProps {
  preferences?: LearningPreferencesType;
  onUpdate: (preferences: Partial<LearningPreferencesType>) => Promise<void>;
}

const DAYS_OF_WEEK = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

const LEARNING_STYLES: { value: LearningStyle; label: string; description: string }[] = [
  { value: 'visual', label: 'Visual', description: 'Learn best through images, diagrams, and written text' },
  { value: 'auditory', label: 'Auditory', description: 'Learn best through listening and speaking' },
  { value: 'kinesthetic', label: 'Kinesthetic', description: 'Learn best through hands-on practice and interaction' },
  { value: 'mixed', label: 'Mixed', description: 'Benefit from a combination of learning styles' },
];

const LEARNING_PACES: { value: LearningPace; label: string; description: string }[] = [
  { value: 'slow', label: 'Slow & Steady', description: 'Take time to master each concept thoroughly' },
  { value: 'moderate', label: 'Moderate', description: 'Balanced approach with steady progress' },
  { value: 'fast', label: 'Fast Track', description: 'Quick learner who prefers accelerated content' },
];

const CHALLENGE_LEVELS: { value: ChallengeLevel; label: string; description: string }[] = [
  { value: 'comfortable', label: 'Comfortable', description: 'Content at or below current level' },
  { value: 'challenging', label: 'Challenging', description: 'Content slightly above current level' },
  { value: 'very-challenging', label: 'Very Challenging', description: 'Content well above current level' },
];

export default function LearningPreferences({ preferences, onUpdate }: LearningPreferencesProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Transform preferences for form handling
  const transformPreferencesToForm = (prefs?: LearningPreferencesType): Partial<LearningPreferencesFormData> => {
    if (!prefs) return {};
    
    return {
      goals: prefs.goals?.map(goal => ({ value: goal })) || [],
      businessContext: prefs.businessContext || '',
      industry: prefs.industry || '',
      jobRole: prefs.jobRole || '',
      topics: prefs.topics?.map(topic => ({ value: topic })) || [],
      learningStyle: prefs.learningStyle || 'mixed',
      pace: prefs.pace || 'moderate',
      challengeLevel: prefs.challengeLevel || 'challenging',
      focusAreas: prefs.focusAreas?.map(area => ({ value: area })) || [],
      weakAreas: prefs.weakAreas?.map(area => ({ value: area })) || [],
      motivations: prefs.motivations?.map(motivation => ({ value: motivation })) || [],
      studySchedule: {
        preferredDays: prefs.studySchedule?.preferredDays || [],
        preferredTime: prefs.studySchedule?.preferredTime || '18:00',
        sessionDuration: prefs.studySchedule?.sessionDuration || 60,
        frequency: prefs.studySchedule?.frequency || 'weekly',
        timeZone: prefs.studySchedule?.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };
  };

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<LearningPreferencesFormData>({
    resolver: zodResolver(learningPreferencesSchema),
    defaultValues: transformPreferencesToForm(preferences),
  });

  // Field arrays for dynamic lists
  const { fields: goalFields, append: appendGoal, remove: removeGoal } = useFieldArray({
    control,
    name: 'goals',
  });

  const { fields: topicFields, append: appendTopic, remove: removeTopic } = useFieldArray({
    control,
    name: 'topics',
  });

  const { fields: focusFields, append: appendFocus, remove: removeFocus } = useFieldArray({
    control,
    name: 'focusAreas',
  });

  const { fields: weakFields, append: appendWeak, remove: removeWeak } = useFieldArray({
    control,
    name: 'weakAreas',
  });

  const { fields: motivationFields, append: appendMotivation, remove: removeMotivation } = useFieldArray({
    control,
    name: 'motivations',
  });

  // Handle form submission
  const onSubmit = async (data: LearningPreferencesFormData) => {
    setIsLoading(true);
    try {
      // Transform form data back to preferences format
      const transformedData: Partial<LearningPreferencesType> = {
        goals: data.goals.map(g => g.value),
        businessContext: data.businessContext,
        industry: data.industry,
        jobRole: data.jobRole,
        topics: data.topics.map(t => t.value),
        learningStyle: data.learningStyle,
        pace: data.pace,
        challengeLevel: data.challengeLevel,
        focusAreas: data.focusAreas.map(f => f.value),
        weakAreas: data.weakAreas.map(w => w.value),
        motivations: data.motivations.map(m => m.value),
        studySchedule: data.studySchedule,
      };

      await onUpdate(transformedData);
    } catch (error) {
      console.error('Error updating learning preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle day selection for study schedule
  const handleDayToggle = (day: string) => {
    const currentDays = watch('studySchedule.preferredDays') || [];
    const updatedDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day];
    setValue('studySchedule.preferredDays', updatedDays, { shouldDirty: true });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Learning Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="w-5 h-5" />
              <span>Learning Goals</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {goalFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    {...register(`goals.${index}.value` as const)}
                    placeholder="e.g., Improve business email communication"
                    className="flex-1"
                  />
                  {goalFields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeGoal(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => appendGoal({ value: '' })}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Goal
              </Button>
              {errors.goals && (
                <p className="text-red-500 text-sm">{errors.goals.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Business Context */}
        <Card>
          <CardHeader>
            <CardTitle>Professional Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="businessContext">Business Context *</Label>
              <Input
                id="businessContext"
                {...register('businessContext')}
                placeholder="e.g., International sales team, Customer service department"
              />
              {errors.businessContext && (
                <p className="text-red-500 text-sm mt-1">{errors.businessContext.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="industry">Industry *</Label>
                <Input
                  id="industry"
                  {...register('industry')}
                  placeholder="e.g., Technology, Healthcare, Finance"
                />
                {errors.industry && (
                  <p className="text-red-500 text-sm mt-1">{errors.industry.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="jobRole">Job Role *</Label>
                <Input
                  id="jobRole"
                  {...register('jobRole')}
                  placeholder="e.g., Sales Manager, Customer Service Rep"
                />
                {errors.jobRole && (
                  <p className="text-red-500 text-sm mt-1">{errors.jobRole.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Learning Style & Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Learning Style & Pace</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {/* Learning Style */}
            <div>
              <Label className="text-base font-medium">Learning Style</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                {LEARNING_STYLES.map((style) => (
                  <label
                    key={style.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      watch('learningStyle') === style.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      {...register('learningStyle')}
                      value={style.value}
                      className="hidden"
                    />
                    <div className="font-medium">{style.label}</div>
                    <div className="text-sm text-gray-600">{style.description}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* Learning Pace */}
            <div>
              <Label className="text-base font-medium">Learning Pace</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                {LEARNING_PACES.map((pace) => (
                  <label
                    key={pace.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      watch('pace') === pace.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      {...register('pace')}
                      value={pace.value}
                      className="hidden"
                    />
                    <div className="font-medium">{pace.label}</div>
                    <div className="text-sm text-gray-600">{pace.description}</div>
                  </label>
                ))}
              </div>
            </div>

            {/* Challenge Level */}
            <div>
              <Label className="text-base font-medium">Challenge Level</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                {CHALLENGE_LEVELS.map((level) => (
                  <label
                    key={level.value}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      watch('challengeLevel') === level.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      {...register('challengeLevel')}
                      value={level.value}
                      className="hidden"
                    />
                    <div className="font-medium">{level.label}</div>
                    <div className="text-sm text-gray-600">{level.description}</div>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Study Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Study Schedule</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            
            {/* Preferred Days */}
            <div>
              <Label className="text-base font-medium">Preferred Days</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DAYS_OF_WEEK.map((day) => {
                  const isSelected = watch('studySchedule.preferredDays')?.includes(day);
                  return (
                    <Button
                      key={day}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleDayToggle(day)}
                    >
                      {day.slice(0, 3)}
                    </Button>
                  );
                })}
              </div>
              {errors.studySchedule?.preferredDays && (
                <p className="text-red-500 text-sm mt-1">{errors.studySchedule.preferredDays.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="preferredTime">Preferred Time</Label>
                <Input
                  id="preferredTime"
                  type="time"
                  {...register('studySchedule.preferredTime')}
                />
                {errors.studySchedule?.preferredTime && (
                  <p className="text-red-500 text-sm mt-1">{errors.studySchedule.preferredTime.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="sessionDuration">Session Duration (minutes)</Label>
                <Input
                  id="sessionDuration"
                  type="number"
                  min="15"
                  max="240"
                  {...register('studySchedule.sessionDuration', { valueAsNumber: true })}
                />
                {errors.studySchedule?.sessionDuration && (
                  <p className="text-red-500 text-sm mt-1">{errors.studySchedule.sessionDuration.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <select
                  id="frequency"
                  {...register('studySchedule.frequency')}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button 
            type="submit" 
            disabled={!isDirty || isLoading}
            className="flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{isLoading ? 'Saving...' : 'Save Preferences'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}