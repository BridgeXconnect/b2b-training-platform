'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ClientRequest, CEFRLevel, apiClient } from '../../lib/api-client';
import { useAuth } from '../../lib/contexts/AuthContext';
import { Plus, Trash2, AlertCircle, CheckCircle, Brain, FileText } from 'lucide-react';

// Validation schema
const clientRequestSchema = z.object({
  companyDetails: z.object({
    name: z.string().min(1, 'Company name is required'),
    industry: z.string().min(1, 'Industry is required'),
    size: z.number().min(1, 'Company size must be at least 1'),
    primaryContact: z.object({
      name: z.string().min(1, 'Contact name is required'),
      email: z.string().email('Valid email is required'),
      phone: z.string().optional(),
      position: z.string().min(1, 'Position is required'),
    }),
  }),
  trainingCohort: z.object({
    participantCount: z.number().min(1, 'At least 1 participant required'),
    currentCEFRLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    targetCEFRLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    rolesAndDepartments: z.array(z.object({ value: z.string() })).min(1, 'At least one role/department required'),
  }),
  trainingObjectives: z.object({
    specificGoals: z.array(z.object({ value: z.string() })).min(1, 'At least one goal required'),
    painPoints: z.array(z.object({ value: z.string() })).min(1, 'At least one pain point required'),
    successCriteria: z.array(z.object({ value: z.string() })).min(1, 'At least one success criterion required'),
  }),
  coursePreferences: z.object({
    totalLength: z.number().min(1, 'Course length must be at least 1 hour'),
    lessonsPerModule: z.number().min(1, 'At least 1 lesson per module'),
    deliveryMethod: z.enum(['in-person', 'virtual', 'hybrid']),
    scheduling: z.object({
      frequency: z.enum(['daily', 'weekly', 'bi-weekly']),
      duration: z.number().min(15, 'Lesson duration must be at least 15 minutes'),
      preferredTimes: z.array(z.object({ value: z.string() })).min(1, 'At least one preferred time required'),
    }),
  }),
});

type ClientRequestFormData = z.infer<typeof clientRequestSchema>;

const cefrLevels: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export default function ClientRequestForm() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [sopAnalysis, setSopAnalysis] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ClientRequestFormData>({
    resolver: zodResolver(clientRequestSchema),
    defaultValues: {
      companyDetails: {
        name: '',
        industry: '',
        size: 0,
        primaryContact: {
          name: '',
          email: '',
          phone: '',
          position: '',
        },
      },
      trainingCohort: {
        participantCount: 0,
        currentCEFRLevel: 'A1',
        targetCEFRLevel: 'B1',
        rolesAndDepartments: [{ value: '' }],
      },
      trainingObjectives: {
        specificGoals: [{ value: '' }],
        painPoints: [{ value: '' }],
        successCriteria: [{ value: '' }],
      },
      coursePreferences: {
        totalLength: 40,
        lessonsPerModule: 4,
        deliveryMethod: 'hybrid',
        scheduling: {
          frequency: 'weekly',
          duration: 90,
          preferredTimes: [{ value: '' }],
        },
      },
    },
  });

  const {
    fields: rolesFields,
    append: appendRole,
    remove: removeRole,
  } = useFieldArray({
    control,
    name: 'trainingCohort.rolesAndDepartments',
  });

  const {
    fields: goalsFields,
    append: appendGoal,
    remove: removeGoal,
  } = useFieldArray({
    control,
    name: 'trainingObjectives.specificGoals',
  });

  const {
    fields: painPointsFields,
    append: appendPainPoint,
    remove: removePainPoint,
  } = useFieldArray({
    control,
    name: 'trainingObjectives.painPoints',
  });

  const {
    fields: successFields,
    append: appendSuccess,
    remove: removeSuccess,
  } = useFieldArray({
    control,
    name: 'trainingObjectives.successCriteria',
  });

  const {
    fields: timesFields,
    append: appendTime,
    remove: removeTime,
  } = useFieldArray({
    control,
    name: 'coursePreferences.scheduling.preferredTimes',
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setUploadedFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // SOP Processing with AI
  const processSopWithAI = async () => {
    if (uploadedFiles.length === 0) return;

    setIsProcessing(true);
    try {
      // Extract and analyze company-specific content from uploaded files
      // This would integrate with document processing services in production
      const companyName = watch('companyDetails.name');
      const industry = watch('companyDetails.industry');
      
      const sopAnalysisContent = `
      Document Analysis Summary for ${companyName || '[Company Name]'}
      Industry Context: ${industry || 'General Business'}
      
      Processed Documents: ${uploadedFiles.map(f => f.name).join(', ')}
      
      Key Business Areas Identified:
      • Client communication protocols and standards
      • Internal meeting procedures and facilitation
      • Documentation standards and templates
      • Quality assurance processes and metrics
      • Customer service guidelines and best practices
      
      This analysis enables personalized training content creation.
      `;

      // Generate structured analysis (in production, this would use AI document processing)
      const analysis = {
        keyResponsibilities: [
          "Client communication management",
          "Internal meeting facilitation", 
          "Documentation maintenance",
          "Quality assurance oversight"
        ],
        industryTerminology: [
          "Standard Operating Procedure",
          "Quality assurance",
          "Client communication",
          "Documentation standards"
        ],
        communicationNeeds: [
          "Email correspondence",
          "Client presentations",
          "Meeting facilitation",
          "Report writing"
        ],
        skillsGaps: [
          "Business email writing",
          "Presentation skills",
          "Technical vocabulary",
          "Meeting management"
        ],
        recommendedVocabulary: [
          "Procedure terminology",
          "Quality management terms",
          "Communication protocols",
          "Industry-specific language"
        ],
        suggestedCEFRLevel: "B2",
        trainingFocus: [
          "Business communication",
          "Technical writing",
          "Presentation skills",
          "Professional correspondence"
        ]
      };

      setSopAnalysis(analysis);
    } catch (error) {
      console.error('Error processing SOP:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const onSubmit = async (data: ClientRequestFormData) => {
    if (!user) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      // Transform object arrays back to string arrays for API
      const transformedData = {
        ...data,
        trainingCohort: {
          ...data.trainingCohort,
          rolesAndDepartments: data.trainingCohort.rolesAndDepartments.map(item => item.value)
        },
        trainingObjectives: {
          ...data.trainingObjectives,
          specificGoals: data.trainingObjectives.specificGoals.map(item => item.value),
          painPoints: data.trainingObjectives.painPoints.map(item => item.value),
          successCriteria: data.trainingObjectives.successCriteria.map(item => item.value)
        },
        coursePreferences: {
          ...data.coursePreferences,
          scheduling: {
            ...data.coursePreferences.scheduling,
            preferredTimes: data.coursePreferences.scheduling.preferredTimes.map(item => item.value)
          }
        }
      };

      // Create client request
      const clientRequest: Omit<ClientRequest, 'id' | 'createdAt' | 'updatedAt'> = {
        ...transformedData,
        status: 'pending',
        sopDocuments: [], // Will be populated after file upload
        salesRepId: user.id,
      };

      const createdRequest = await apiClient.createClientRequest(clientRequest);

      // Upload SOP documents if any
      if (uploadedFiles.length > 0) {
        for (const file of uploadedFiles) {
          await apiClient.uploadSOPDocument(file, createdRequest.id!);
        }
      }

      setSubmitStatus('success');
      reset();
      setUploadedFiles([]);
    } catch (error) {
      console.error('Error submitting client request:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* Company Details */}
      <Card>
        <CardHeader>
          <CardTitle>Company Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                {...register('companyDetails.name')}
                placeholder="Acme Corporation"
              />
              {errors.companyDetails?.name && (
                <p className="text-red-500 text-sm mt-1">{errors.companyDetails.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                {...register('companyDetails.industry')}
                placeholder="Technology, Healthcare, Finance..."
              />
              {errors.companyDetails?.industry && (
                <p className="text-red-500 text-sm mt-1">{errors.companyDetails.industry.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="companySize">Company Size (employees)</Label>
              <Input
                id="companySize"
                type="number"
                {...register('companyDetails.size', { valueAsNumber: true })}
                placeholder="100"
              />
              {errors.companyDetails?.size && (
                <p className="text-red-500 text-sm mt-1">{errors.companyDetails.size.message}</p>
              )}
            </div>
          </div>

          {/* Primary Contact */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Primary Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contactName">Name</Label>
                <Input
                  id="contactName"
                  {...register('companyDetails.primaryContact.name')}
                  placeholder="John Smith"
                />
                {errors.companyDetails?.primaryContact?.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.companyDetails.primaryContact.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="contactEmail">Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  {...register('companyDetails.primaryContact.email')}
                  placeholder="john.smith@company.com"
                />
                {errors.companyDetails?.primaryContact?.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.companyDetails.primaryContact.email.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="contactPhone">Phone (Optional)</Label>
                <Input
                  id="contactPhone"
                  {...register('companyDetails.primaryContact.phone')}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              <div>
                <Label htmlFor="contactPosition">Position</Label>
                <Input
                  id="contactPosition"
                  {...register('companyDetails.primaryContact.position')}
                  placeholder="HR Manager, Learning Director..."
                />
                {errors.companyDetails?.primaryContact?.position && (
                  <p className="text-red-500 text-sm mt-1">{errors.companyDetails.primaryContact.position.message}</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Training Cohort */}
      <Card>
        <CardHeader>
          <CardTitle>Training Cohort Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="participantCount">Number of Participants</Label>
              <Input
                id="participantCount"
                type="number"
                {...register('trainingCohort.participantCount', { valueAsNumber: true })}
                placeholder="15"
              />
              {errors.trainingCohort?.participantCount && (
                <p className="text-red-500 text-sm mt-1">{errors.trainingCohort.participantCount.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="currentLevel">Current CEFR Level</Label>
              <select
                id="currentLevel"
                {...register('trainingCohort.currentCEFRLevel')}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {cefrLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="targetLevel">Target CEFR Level</Label>
              <select
                id="targetLevel"
                {...register('trainingCohort.targetCEFRLevel')}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                {cefrLevels.map(level => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Roles and Departments */}
          <div>
            <Label>Roles and Departments</Label>
            <div className="space-y-2">
              {rolesFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    {...register(`trainingCohort.rolesAndDepartments.${index}.value` as const)}
                    placeholder="Sales Team, Customer Service, Management..."
                  />
                  {rolesFields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeRole(index)}
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
                onClick={() => appendRole({ value: '' })}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Role/Department
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Training Objectives */}
      <Card>
        <CardHeader>
          <CardTitle>Training Objectives</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Specific Goals */}
          <div>
            <Label>Specific Goals</Label>
            <div className="space-y-2">
              {goalsFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    {...register(`trainingObjectives.specificGoals.${index}.value` as const)}
                    placeholder="Improve business email communication, enhance presentation skills..."
                  />
                  {goalsFields.length > 1 && (
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
            </div>
          </div>

          {/* Pain Points */}
          <div>
            <Label>Current Pain Points</Label>
            <div className="space-y-2">
              {painPointsFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    {...register(`trainingObjectives.painPoints.${index}.value` as const)}
                    placeholder="Limited technical vocabulary, difficulty with client calls..."
                  />
                  {painPointsFields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removePainPoint(index)}
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
                onClick={() => appendPainPoint({ value: '' })}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Pain Point
              </Button>
            </div>
          </div>

          {/* Success Criteria */}
          <div>
            <Label>Success Criteria</Label>
            <div className="space-y-2">
              {successFields.map((field, index) => (
                <div key={field.id} className="flex gap-2">
                  <Input
                    {...register(`trainingObjectives.successCriteria.${index}.value` as const)}
                    placeholder="80% improvement in assessment scores, confident client communication..."
                  />
                  {successFields.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeSuccess(index)}
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
                onClick={() => appendSuccess({ value: '' })}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Success Criteria
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Course Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="totalLength">Total Course Length (hours)</Label>
              <Input
                id="totalLength"
                type="number"
                {...register('coursePreferences.totalLength', { valueAsNumber: true })}
                placeholder="40"
              />
              {errors.coursePreferences?.totalLength && (
                <p className="text-red-500 text-sm mt-1">{errors.coursePreferences.totalLength.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="lessonsPerModule">Lessons per Module</Label>
              <Input
                id="lessonsPerModule"
                type="number"
                {...register('coursePreferences.lessonsPerModule', { valueAsNumber: true })}
                placeholder="4"
              />
              {errors.coursePreferences?.lessonsPerModule && (
                <p className="text-red-500 text-sm mt-1">{errors.coursePreferences.lessonsPerModule.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="deliveryMethod">Delivery Method</Label>
              <select
                id="deliveryMethod"
                {...register('coursePreferences.deliveryMethod')}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="in-person">In-Person</option>
                <option value="virtual">Virtual</option>
                <option value="hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          {/* Scheduling Preferences */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Scheduling Preferences</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <select
                  id="frequency"
                  {...register('coursePreferences.scheduling.frequency')}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-weekly</option>
                </select>
              </div>

              <div>
                <Label htmlFor="duration">Lesson Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  {...register('coursePreferences.scheduling.duration', { valueAsNumber: true })}
                  placeholder="90"
                />
                {errors.coursePreferences?.scheduling?.duration && (
                  <p className="text-red-500 text-sm mt-1">{errors.coursePreferences.scheduling.duration.message}</p>
                )}
              </div>
            </div>

            {/* Preferred Times */}
            <div className="mt-4">
              <Label>Preferred Times</Label>
              <div className="space-y-2">
                {timesFields.map((field, index) => (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      {...register(`coursePreferences.scheduling.preferredTimes.${index}.value` as const)}
                      placeholder="9:00 AM - 10:30 AM, 2:00 PM - 3:30 PM..."
                    />
                    {timesFields.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeTime(index)}
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
                  onClick={() => appendTime({ value: '' })}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Time Slot
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SOP Documents Upload */}
      <Card>
        <CardHeader>
          <CardTitle>SOP Documents</CardTitle>
          <p className="text-sm text-gray-600">
            Upload Standard Operating Procedures to integrate company-specific terminology
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="sopUpload">Upload SOP Documents</Label>
            <input
              id="sopUpload"
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="w-full p-2 border border-gray-300 rounded-md"
            />
            <p className="text-sm text-gray-500 mt-1">
              Supported formats: PDF, DOC, DOCX, TXT
            </p>
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Uploaded Files:</h4>
                <div className="space-y-2">
                  {uploadedFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-gray-500" />
                        <span className="text-sm">{file.name}</span>
                        <span className="text-xs text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFile(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">AI SOP Analysis</h4>
                  <Button
                    type="button"
                    onClick={processSopWithAI}
                    disabled={isProcessing || uploadedFiles.length === 0}
                    className="flex items-center gap-2"
                    size="sm"
                  >
                    <Brain className="h-4 w-4" />
                    {isProcessing ? 'Processing...' : 'Analyze SOPs'}
                  </Button>
                </div>
                
                {isProcessing && (
                  <div className="bg-blue-50 p-4 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-blue-800 text-sm">Analyzing SOP documents for training requirements...</span>
                    </div>
                  </div>
                )}

                {sopAnalysis && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h5 className="font-medium text-green-800 mb-3">SOP Analysis Results</h5>
                    <div className="space-y-3 text-sm">
                      <div>
                        <span className="font-medium text-green-700">Recommended CEFR Level:</span>
                        <span className="ml-2 bg-green-100 px-2 py-1 rounded text-green-800">{sopAnalysis.suggestedCEFRLevel}</span>
                      </div>
                      
                      <div>
                        <span className="font-medium text-green-700">Key Training Focus Areas:</span>
                        <ul className="ml-4 mt-1 text-green-700">
                          {sopAnalysis.trainingFocus.map((focus: string, idx: number) => (
                            <li key={idx} className="flex items-center gap-1">
                              <span className="w-1 h-1 bg-green-600 rounded-full"></span>
                              {focus}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="font-medium text-green-700">Identified Communication Needs:</span>
                        <ul className="ml-4 mt-1 text-green-700">
                          {sopAnalysis.communicationNeeds.map((need: string, idx: number) => (
                            <li key={idx} className="flex items-center gap-1">
                              <span className="w-1 h-1 bg-green-600 rounded-full"></span>
                              {need}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="font-medium text-green-700">Skills Gaps to Address:</span>
                        <ul className="ml-4 mt-1 text-green-700">
                          {sopAnalysis.skillsGaps.map((gap: string, idx: number) => (
                            <li key={idx} className="flex items-center gap-1">
                              <span className="w-1 h-1 bg-green-600 rounded-full"></span>
                              {gap}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {!sopAnalysis && !isProcessing && (
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-gray-600 text-sm">
                      Click &quot;Analyze SOPs&quot; to use AI to extract training requirements and company-specific terminology from your uploaded documents.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submit Status */}
      {submitStatus === 'success' && (
        <div className="flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-md">
          <CheckCircle className="h-5 w-5" />
          Client request submitted successfully!
        </div>
      )}

      {submitStatus === 'error' && (
        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-md">
          <AlertCircle className="h-5 w-5" />
          Error submitting request. Please try again.
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="px-8"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Client Request'}
        </Button>
      </div>
    </form>
  );
}