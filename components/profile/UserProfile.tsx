'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { 
  User, 
  Settings, 
  Target, 
  Bell, 
  Shield, 
  CheckCircle, 
  AlertCircle,
  Upload,
  Save
} from 'lucide-react';
import {
  UserProfile as UserProfileType,
  PersonalInfo,
  ProfileFormData,
  ExtendedUser,
} from '../../lib/types/user';
import { 
  calculateProfileCompletion, 
  validateProfileData, 
  PROFILE_SECTIONS 
} from '../../lib/utils/profile';

// Validation schema for personal information
const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Please enter a valid email address'),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().optional(),
  timezone: z.string().min(1, 'Timezone is required'),
  phoneNumber: z.string().optional(),
});

type PersonalInfoFormData = z.infer<typeof personalInfoSchema>;

interface UserProfileProps {
  user: ExtendedUser;
  profile?: UserProfileType;
  onProfileUpdate: (section: string, data: any) => Promise<void>;
  onAvatarUpload: (file: File) => Promise<string>;
}

export default function UserProfile({ 
  user, 
  profile, 
  onProfileUpdate, 
  onAvatarUpload 
}: UserProfileProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [completionData, setCompletionData] = useState({
    score: 0,
    completedSections: [] as string[],
    recommendations: [] as string[],
  });

  // Form for personal information
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<PersonalInfoFormData>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      firstName: profile?.personalInfo.firstName || '',
      lastName: profile?.personalInfo.lastName || '',
      email: profile?.personalInfo.email || user.email,
      bio: profile?.personalInfo.bio || '',
      location: profile?.personalInfo.location || '',
      timezone: profile?.personalInfo.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      phoneNumber: profile?.personalInfo.phoneNumber || '',
    },
  });

  // Calculate profile completion on mount and when profile changes
  useEffect(() => {
    if (profile) {
      const completion = calculateProfileCompletion(profile);
      setCompletionData(completion);
    }
  }, [profile]);

  // Handle personal info form submission
  const onSubmitPersonalInfo = async (data: PersonalInfoFormData) => {
    setIsLoading(true);
    try {
      await onProfileUpdate('personalInfo', data);
    } catch (error) {
      console.error('Error updating personal info:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsLoading(true);
    try {
      const avatarUrl = await onAvatarUpload(file);
      await onProfileUpdate('personalInfo', { 
        ...watch(), 
        avatar: avatarUrl 
      });
    } catch (error) {
      console.error('Error uploading avatar:', error);
    } finally {
      setIsLoading(false);
      setSelectedFile(null);
    }
  };

  // Get section completion status
  const getSectionStatus = (sectionId: string) => {
    return completionData.completedSections.includes(sectionId);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Profile Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {profile?.personalInfo.avatar ? (
                    <img 
                      src={profile.personalInfo.avatar} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <label htmlFor="avatar-upload" className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1 cursor-pointer hover:bg-blue-700">
                  <Upload className="w-3 h-3" />
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {profile?.personalInfo.firstName && profile?.personalInfo.lastName
                    ? `${profile.personalInfo.firstName} ${profile.personalInfo.lastName}`
                    : user.name
                  }
                </CardTitle>
                <p className="text-gray-600">{user.email}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant={user.role === 'student' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                  {profile?.cefrTracking.currentLevel && (
                    <Badge variant="outline">
                      CEFR: {profile.cefrTracking.currentLevel}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-2">Profile Completion</div>
              <div className="flex items-center space-x-2">
                <Progress value={completionData.score} className="w-32" />
                <span className="text-sm font-medium">{completionData.score}%</span>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Profile Completion Recommendations */}
      {completionData.recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <span>Complete Your Profile</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completionData.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                  <span>{recommendation}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Section Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Sections</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PROFILE_SECTIONS.map((section) => {
              const isComplete = getSectionStatus(section.id);
              return (
                <div
                  key={section.id}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    isComplete
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 bg-gray-50 hover:border-blue-200'
                  }`}
                  onClick={() => setActiveTab(section.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{section.name}</h3>
                    {isComplete ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{section.description}</p>
                  <div className="mt-2">
                    <div className="text-xs text-gray-500">
                      Weight: {section.weight}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Profile Management Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Personal</span>
          </TabsTrigger>
          <TabsTrigger value="learning" className="flex items-center space-x-2">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Learning</span>
          </TabsTrigger>
          <TabsTrigger value="cefr" className="flex items-center space-x-2">
            <Badge className="w-4 h-4" />
            <span className="hidden sm:inline">CEFR</span>
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">Privacy</span>
          </TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <p className="text-sm text-gray-600">
                Update your personal details and contact information
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmitPersonalInfo)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      {...register('firstName')}
                      placeholder="Enter your first name"
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      {...register('lastName')}
                      placeholder="Enter your last name"
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      placeholder="Enter your email"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phoneNumber">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      {...register('phoneNumber')}
                      placeholder="Enter your phone number"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      {...register('location')}
                      placeholder="City, Country"
                    />
                  </div>

                  <div>
                    <Label htmlFor="timezone">Timezone *</Label>
                    <select
                      id="timezone"
                      {...register('timezone')}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="">Select timezone</option>
                      {/* Common timezones */}
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                      <option value="Europe/London">London</option>
                      <option value="Europe/Paris">Paris</option>
                      <option value="Asia/Tokyo">Tokyo</option>
                      <option value="Asia/Shanghai">Shanghai</option>
                      <option value="Australia/Sydney">Sydney</option>
                      {/* Add more as needed */}
                    </select>
                    {errors.timezone && (
                      <p className="text-red-500 text-sm mt-1">{errors.timezone.message}</p>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <textarea
                    id="bio"
                    {...register('bio')}
                    rows={4}
                    className="w-full p-2 border border-gray-300 rounded-md"
                    placeholder="Tell us about yourself..."
                  />
                  {errors.bio && (
                    <p className="text-red-500 text-sm mt-1">{errors.bio.message}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    {watch('bio')?.length || 0}/500 characters
                  </p>
                </div>

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={!isDirty || isLoading}
                    className="flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Placeholder tabs for other sections */}
        <TabsContent value="learning">
          <Card>
            <CardHeader>
              <CardTitle>Learning Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Learning preferences component will be implemented next.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cefr">
          <Card>
            <CardHeader>
              <CardTitle>CEFR Level Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">CEFR tracking component will be implemented next.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Communication & Accessibility</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Preferences components will be implemented next.</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Privacy settings component will be implemented next.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}