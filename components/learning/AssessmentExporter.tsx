'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download,
  Share2,
  FileText,
  Image,
  Mail,
  Link,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Calendar,
  BarChart3,
  Trophy,
  Target,
  Clock,
  Globe,
  Copy,
  Printer
} from 'lucide-react';
import {
  Assessment,
  AssessmentResults,
  AssessmentSession
} from '@/lib/utils/assessment';
import { ProgressMetrics } from '@/lib/utils/progress';

interface AssessmentExporterProps {
  assessmentData?: {
    assessment: Assessment;
    session: AssessmentSession;
    results?: AssessmentResults;
  };
  progressData?: ProgressMetrics;
  userProfile?: {
    name: string;
    email: string;
    organization?: string;
  };
  onExportComplete?: (format: string, success: boolean) => void;
}

export default function AssessmentExporter({
  assessmentData,
  progressData,
  userProfile = { name: 'User', email: 'user@example.com' },
  onExportComplete
}: AssessmentExporterProps) {
  const [activeTab, setActiveTab] = useState('individual');
  const [exportFormat, setExportFormat] = useState<'json' | 'pdf' | 'csv' | 'markdown'>('json');
  const [includePersonalInfo, setIncludePersonalInfo] = useState(false);
  const [includeDetailedAnswers, setIncludeDetailedAnswers] = useState(false);
  const [includeAnalytics, setIncludeAnalytics] = useState(true);
  const [customNote, setCustomNote] = useState('');
  const [shareExpiry, setShareExpiry] = useState<'1h' | '24h' | '7d' | '30d' | 'never'>('7d');
  const [sharePassword, setSharePassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  // Generate comprehensive export data
  const generateExportData = () => {
    const timestamp = new Date().toISOString();
    
    const baseData = {
      exportMetadata: {
        exportDate: timestamp,
        exportFormat,
        exportedBy: userProfile.name,
        version: '1.0'
      },
      ...(includePersonalInfo && {
        userProfile: {
          name: userProfile.name,
          email: userProfile.email,
          organization: userProfile.organization
        }
      }),
      ...(customNote && { customNote })
    };

    if (activeTab === 'individual' && assessmentData) {
      return {
        ...baseData,
        type: 'individual_assessment',
        assessment: {
          metadata: assessmentData.assessment,
          session: {
            ...assessmentData.session,
            ...(includeDetailedAnswers ? { answers: assessmentData.session.answers } : {})
          },
          ...(assessmentData.results && includeAnalytics && {
            results: assessmentData.results
          })
        }
      };
    } else if (activeTab === 'progress' && progressData) {
      return {
        ...baseData,
        type: 'progress_summary',
        progress: progressData,
        summary: {
          totalStudyTime: progressData.totalStudyTime,
          completedLessons: progressData.completedLessons,
          currentStreak: progressData.currentStreak,
          cefrLevel: progressData.cefrProgress.current,
          assessmentSummary: {
            totalAssessments: progressData.assessments.totalAssessments,
            averageScore: progressData.assessments.averageScore,
            bestScore: progressData.assessments.bestScore
          }
        }
      };
    }

    return baseData;
  };

  // Export functions
  const exportAsJSON = (data: any) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    downloadFile(blob, `assessment-export-${Date.now()}.json`);
  };

  const exportAsMarkdown = (data: any) => {
    let markdown = `# Assessment Export Report\n\n`;
    markdown += `**Export Date:** ${new Date().toLocaleDateString()}\n`;
    markdown += `**Exported By:** ${userProfile.name}\n\n`;

    if (data.type === 'individual_assessment' && assessmentData) {
      markdown += `## Assessment: ${assessmentData.assessment.title}\n\n`;
      markdown += `- **CEFR Level:** ${assessmentData.assessment.cefrLevel}\n`;
      markdown += `- **Duration:** ${assessmentData.assessment.duration} minutes\n`;
      markdown += `- **Business Context:** ${assessmentData.assessment.businessContext}\n`;
      markdown += `- **Completed:** ${new Date(assessmentData.session.completedAt || '').toLocaleDateString()}\n`;
      
      if (assessmentData.session.score) {
        markdown += `- **Score:** ${assessmentData.session.score}%\n`;
      }

      if (assessmentData.results && includeAnalytics) {
        markdown += `\n## Results Analysis\n\n`;
        markdown += `### Skill Breakdown\n`;
        Object.entries(assessmentData.results.skillBreakdown).forEach(([skill, data]) => {
          markdown += `- **${skill.replace('-', ' ')}:** ${data.percentage}% (${data.score}/${data.total})\n`;
        });

        markdown += `\n### CEFR Analysis\n`;
        markdown += `- **Current Level:** ${assessmentData.results.cefrLevelAnalysis.currentLevel}\n`;
        markdown += `- **Demonstrated Level:** ${assessmentData.results.cefrLevelAnalysis.demonstratedLevel}\n`;
        markdown += `- **Readiness for Next:** ${assessmentData.results.cefrLevelAnalysis.readinessForNext}%\n`;

        markdown += `\n### Feedback\n`;
        markdown += `**Overall:** ${assessmentData.results.feedback.overall}\n\n`;
        markdown += `**Strengths:**\n`;
        assessmentData.results.feedback.strengths.forEach(strength => {
          markdown += `- ${strength}\n`;
        });
        markdown += `\n**Areas for Improvement:**\n`;
        assessmentData.results.feedback.improvements.forEach(improvement => {
          markdown += `- ${improvement}\n`;
        });
      }
    } else if (data.type === 'progress_summary' && progressData) {
      markdown += `## Learning Progress Summary\n\n`;
      markdown += `### Overall Stats\n`;
      markdown += `- **Total Study Time:** ${progressData.totalStudyTime} hours\n`;
      markdown += `- **Lessons Completed:** ${progressData.completedLessons}\n`;
      markdown += `- **Current Streak:** ${progressData.currentStreak} days\n`;
      markdown += `- **CEFR Level:** ${progressData.cefrProgress.current}\n`;

      markdown += `\n### Assessment Performance\n`;
      markdown += `- **Total Assessments:** ${progressData.assessments.totalAssessments}\n`;
      markdown += `- **Average Score:** ${progressData.assessments.averageScore}%\n`;
      markdown += `- **Best Score:** ${progressData.assessments.bestScore}%\n`;

      markdown += `\n### Skill Performance\n`;
      Object.entries(progressData.assessments.skillPerformance).forEach(([skill, performance]) => {
        markdown += `- **${skill.replace('-', ' ')}:** ${performance.averageScore}% average (${performance.assessmentCount} assessments)\n`;
      });
    }

    if (customNote) {
      markdown += `\n## Additional Notes\n${customNote}\n`;
    }

    const blob = new Blob([markdown], { type: 'text/markdown' });
    downloadFile(blob, `assessment-report-${Date.now()}.md`);
  };

  const exportAsCSV = (data: any) => {
    let csvContent = '';
    
    if (data.type === 'individual_assessment' && assessmentData && assessmentData.results) {
      csvContent = 'Skill,Score,Total,Percentage\n';
      Object.entries(assessmentData.results.skillBreakdown).forEach(([skill, skillData]) => {
        csvContent += `"${skill.replace('-', ' ')}",${skillData.score},${skillData.total},${skillData.percentage}\n`;
      });
    } else if (data.type === 'progress_summary' && progressData) {
      csvContent = 'Metric,Value\n';
      csvContent += `"Total Study Time","${progressData.totalStudyTime} hours"\n`;
      csvContent += `"Lessons Completed","${progressData.completedLessons}"\n`;
      csvContent += `"Current Streak","${progressData.currentStreak} days"\n`;
      csvContent += `"CEFR Level","${progressData.cefrProgress.current}"\n`;
      csvContent += `"Total Assessments","${progressData.assessments.totalAssessments}"\n`;
      csvContent += `"Average Score","${progressData.assessments.averageScore}%"\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv' });
    downloadFile(blob, `assessment-data-${Date.now()}.csv`);
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus({ type: null, message: '' });

    try {
      const data = generateExportData();

      switch (exportFormat) {
        case 'json':
          exportAsJSON(data);
          break;
        case 'markdown':
          exportAsMarkdown(data);
          break;
        case 'csv':
          exportAsCSV(data);
          break;
        case 'pdf':
          // PDF export would require a library like jsPDF
          setExportStatus({ type: 'error', message: 'PDF export not yet implemented' });
          onExportComplete?.(exportFormat, false);
          return;
        default:
          throw new Error('Unsupported export format');
      }

      setExportStatus({ type: 'success', message: `Successfully exported as ${exportFormat.toUpperCase()}` });
      onExportComplete?.(exportFormat, true);
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({ type: 'error', message: 'Export failed. Please try again.' });
      onExportComplete?.(exportFormat, false);
    } finally {
      setIsExporting(false);
    }
  };

  const generateShareableLink = () => {
    const data = generateExportData();
    const encodedData = btoa(JSON.stringify(data));
    
    // This would typically generate a secure shareable link via your backend
    const shareUrl = `${window.location.origin}/assessment/shared?data=${encodedData}&expires=${shareExpiry}`;
    
    navigator.clipboard.writeText(shareUrl);
    setExportStatus({ type: 'success', message: 'Shareable link copied to clipboard!' });
  };

  const shareViaEmail = () => {
    const subject = activeTab === 'individual' ? 
      `Assessment Results: ${assessmentData?.assessment.title}` :
      'Learning Progress Report';
    
    const body = activeTab === 'individual' && assessmentData?.session.score ?
      `I wanted to share my assessment results with you:\n\nAssessment: ${assessmentData.assessment.title}\nScore: ${assessmentData.session.score}%\nCEFR Level: ${assessmentData.assessment.cefrLevel}` :
      `Here's my learning progress summary:\n\nTotal Study Time: ${progressData?.totalStudyTime} hours\nLessons Completed: ${progressData?.completedLessons}\nCurrent Streak: ${progressData?.currentStreak} days`;

    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
  };

  const printReport = () => {
    const data = generateExportData();
    exportAsMarkdown(data);
    window.print();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Export & Share</h2>
        <p className="text-muted-foreground">
          Export your assessment data and share your progress
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="individual">Individual Assessment</TabsTrigger>
          <TabsTrigger value="progress">Progress Summary</TabsTrigger>
          <TabsTrigger value="share">Share & Collaborate</TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Individual Assessment Export
              </CardTitle>
              <CardDescription>
                Export specific assessment results and analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!assessmentData ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No assessment data available. Please select an assessment from your history.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">{assessmentData.assessment.title}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Level:</span>
                        <div className="font-medium">{assessmentData.assessment.cefrLevel}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Score:</span>
                        <div className="font-medium">{assessmentData.session.score || 'N/A'}%</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Status:</span>
                        <div className="font-medium capitalize">{assessmentData.session.status}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Date:</span>
                        <div className="font-medium">
                          {new Date(assessmentData.session.startedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Export Format</Label>
                      <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON (Raw Data)</SelectItem>
                          <SelectItem value="markdown">Markdown (Report)</SelectItem>
                          <SelectItem value="csv">CSV (Data Sheet)</SelectItem>
                          <SelectItem value="pdf">PDF (Professional)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Export Options</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="personal-info"
                            checked={includePersonalInfo}
                            onCheckedChange={setIncludePersonalInfo}
                          />
                          <Label htmlFor="personal-info" className="text-sm">Include personal information</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="detailed-answers"
                            checked={includeDetailedAnswers}
                            onCheckedChange={setIncludeDetailedAnswers}
                          />
                          <Label htmlFor="detailed-answers" className="text-sm">Include detailed answers</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="analytics"
                            checked={includeAnalytics}
                            onCheckedChange={setIncludeAnalytics}
                          />
                          <Label htmlFor="analytics" className="text-sm">Include analytics & insights</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Progress Summary Export
              </CardTitle>
              <CardDescription>
                Export comprehensive learning progress and achievements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!progressData ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No progress data available. Progress data will be loaded from your learning history.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <h4 className="font-medium mb-2">Progress Overview</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Study Time:</span>
                        <div className="font-medium">{progressData.totalStudyTime}h</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Lessons:</span>
                        <div className="font-medium">{progressData.completedLessons}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Streak:</span>
                        <div className="font-medium">{progressData.currentStreak} days</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">CEFR Level:</span>
                        <div className="font-medium">{progressData.cefrProgress.current}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Export Format</Label>
                      <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="json">JSON (Raw Data)</SelectItem>
                          <SelectItem value="markdown">Markdown (Report)</SelectItem>
                          <SelectItem value="csv">CSV (Data Sheet)</SelectItem>
                          <SelectItem value="pdf">PDF (Professional)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label>Export Options</Label>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="progress-personal-info"
                            checked={includePersonalInfo}
                            onCheckedChange={setIncludePersonalInfo}
                          />
                          <Label htmlFor="progress-personal-info" className="text-sm">Include personal information</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="progress-analytics"
                            checked={includeAnalytics}
                            onCheckedChange={setIncludeAnalytics}
                          />
                          <Label htmlFor="progress-analytics" className="text-sm">Include detailed analytics</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="share" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Share & Collaborate
              </CardTitle>
              <CardDescription>
                Share your progress with colleagues, mentors, or on social media
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Quick Share Options</h4>
                  
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start" onClick={shareViaEmail}>
                      <Mail className="h-4 w-4 mr-2" />
                      Share via Email
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-start" onClick={generateShareableLink}>
                      <Link className="h-4 w-4 mr-2" />
                      Generate Shareable Link
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-start" onClick={printReport}>
                      <Printer className="h-4 w-4 mr-2" />
                      Print Report
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Share Settings</h4>
                  
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Link Expiry</Label>
                      <Select value={shareExpiry} onValueChange={(value: any) => setShareExpiry(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1h">1 Hour</SelectItem>
                          <SelectItem value="24h">24 Hours</SelectItem>
                          <SelectItem value="7d">7 Days</SelectItem>
                          <SelectItem value="30d">30 Days</SelectItem>
                          <SelectItem value="never">Never</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Password Protection (Optional)</Label>
                      <Input
                        type="password"
                        placeholder="Enter password..."
                        value={sharePassword}
                        onChange={(e) => setSharePassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Custom Note */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Additional Notes</CardTitle>
          <CardDescription>
            Add a custom note or message to include with your export
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Add any additional notes or context..."
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            className="min-h-[100px]"
          />
        </CardContent>
      </Card>

      {/* Export Status */}
      {exportStatus.type && (
        <Alert className={exportStatus.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
          {exportStatus.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-600" />
          )}
          <AlertDescription className={exportStatus.type === 'success' ? 'text-green-800' : 'text-red-800'}>
            {exportStatus.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Export Button */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Export format: <Badge variant="outline">{exportFormat.toUpperCase()}</Badge>
        </div>
        
        <Button
          onClick={handleExport}
          disabled={isExporting || (!assessmentData && activeTab === 'individual') || (!progressData && activeTab === 'progress')}
          size="lg"
        >
          {isExporting ? (
            <>
              <Download className="h-4 w-4 mr-2 animate-pulse" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Export {exportFormat.toUpperCase()}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}