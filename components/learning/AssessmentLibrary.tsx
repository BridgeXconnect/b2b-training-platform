'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Search,
  Filter,
  Grid3X3,
  List,
  BookOpen,
  Star,
  Clock,
  Users,
  Trophy,
  Target,
  Bookmark,
  Share2,
  Play,
  Eye,
  MoreHorizontal,
  Plus,
  SortAsc,
  SortDesc,
  Calendar,
  BarChart3,
  Tag,
  FolderOpen,
  Shuffle,
  TrendingUp,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  Assessment,
  CEFRLevel,
  AssessmentGenerator
} from '@/lib/utils/assessment';
import { cn } from '@/lib/utils';

interface AssessmentLibraryProps {
  onAssessmentSelect?: (assessment: Assessment) => void;
  onCreateAssessment?: () => void;
  userRole?: 'student' | 'teacher' | 'admin';
}

interface AssessmentCollection {
  id: string;
  name: string;
  description: string;
  assessments: Assessment[];
  tags: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
}

export default function AssessmentLibrary({
  onAssessmentSelect,
  onCreateAssessment,
  userRole = 'student'
}: AssessmentLibraryProps) {
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLevel, setFilterLevel] = useState<CEFRLevel | 'all'>('all');
  const [filterContext, setFilterContext] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<'all' | 'adaptive' | 'fixed'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'level' | 'date' | 'popularity' | 'duration'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Mock data - in real app, this would come from API
  const [assessments, setAssessments] = useState<Assessment[]>([
    {
      id: 'assessment-1',
      title: 'Business Communication Fundamentals',
      description: 'Essential skills for professional communication in business environments',
      cefrLevel: 'B2',
      duration: 45,
      totalPoints: 100,
      questions: [],
      createdAt: '2025-01-15T10:00:00Z',
      businessContext: 'B2B Sales',
      learningObjectives: ['Professional Communication', 'Email Writing', 'Meeting Participation'],
      passingScore: 70,
      adaptiveDifficulty: true,
      tags: ['communication', 'business', 'email', 'meetings'],
      popularity: 95,
      completionRate: 87,
      averageScore: 82,
      estimatedTime: 45
    },
    {
      id: 'assessment-2',
      title: 'Advanced Presentation Skills',
      description: 'Master the art of delivering compelling business presentations',
      cefrLevel: 'C1',
      duration: 60,
      totalPoints: 120,
      questions: [],
      createdAt: '2025-01-10T09:00:00Z',
      businessContext: 'Leadership',
      learningObjectives: ['Presentation Skills', 'Leadership Communication', 'Public Speaking'],
      passingScore: 75,
      adaptiveDifficulty: false,
      tags: ['presentation', 'leadership', 'public-speaking', 'advanced'],
      popularity: 78,
      completionRate: 73,
      averageScore: 79,
      estimatedTime: 60
    },
    {
      id: 'assessment-3',
      title: 'Customer Service Excellence',
      description: 'Develop exceptional customer service communication skills',
      cefrLevel: 'B1',
      duration: 30,
      totalPoints: 80,
      questions: [],
      createdAt: '2025-01-12T11:00:00Z',
      businessContext: 'Customer Service',
      learningObjectives: ['Customer Communication', 'Problem Solving', 'Empathy'],
      passingScore: 65,
      adaptiveDifficulty: true,
      tags: ['customer-service', 'communication', 'problem-solving'],
      popularity: 89,
      completionRate: 91,
      averageScore: 84,
      estimatedTime: 30
    },
    {
      id: 'assessment-4',
      title: 'Technical Writing Mastery',
      description: 'Learn to write clear, effective technical documentation',
      cefrLevel: 'B2',
      duration: 50,
      totalPoints: 110,
      questions: [],
      createdAt: '2025-01-08T14:00:00Z',
      businessContext: 'Operations',
      learningObjectives: ['Technical Writing', 'Documentation', 'Clarity'],
      passingScore: 70,
      adaptiveDifficulty: false,
      tags: ['writing', 'technical', 'documentation', 'operations'],
      popularity: 65,
      completionRate: 68,
      averageScore: 76,
      estimatedTime: 50
    },
    {
      id: 'assessment-5',
      title: 'Cross-Cultural Communication',
      description: 'Navigate communication across different cultures and contexts',
      cefrLevel: 'C1',
      duration: 40,
      totalPoints: 90,
      questions: [],
      createdAt: '2025-01-05T16:00:00Z',
      businessContext: 'HR & Recruitment',
      learningObjectives: ['Cultural Awareness', 'International Communication', 'Diversity'],
      passingScore: 75,
      adaptiveDifficulty: true,
      tags: ['culture', 'diversity', 'international', 'hr'],
      popularity: 71,
      completionRate: 79,
      averageScore: 81,
      estimatedTime: 40
    }
  ]);

  const [collections, setCollections] = useState<AssessmentCollection[]>([
    {
      id: 'collection-1',
      name: 'Business Essentials',
      description: 'Core business communication skills for professionals',
      assessments: assessments.filter(a => ['assessment-1', 'assessment-3'].includes(a.id)),
      tags: ['business', 'professional', 'communication'],
      isPublic: true,
      createdBy: 'system',
      createdAt: '2025-01-01T00:00:00Z'
    },
    {
      id: 'collection-2',
      name: 'Leadership Development',
      description: 'Advanced skills for emerging leaders',
      assessments: assessments.filter(a => ['assessment-2'].includes(a.id)), // assessment-5 doesn't exist
      tags: ['leadership', 'advanced', 'management'],
      isPublic: true,
      createdBy: 'system',
      createdAt: '2025-01-01T00:00:00Z'
    }
  ]);

  const [bookmarkedAssessments, setBookmarkedAssessments] = useState<Set<string>>(
    new Set(['assessment-1', 'assessment-3'])
  );

  const cefrLevels: (CEFRLevel | 'all')[] = ['all', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const businessContexts = [
    'all', 'B2B Sales', 'Marketing', 'Project Management', 'HR & Recruitment', 
    'Finance & Accounting', 'Customer Service', 'Operations', 'Leadership'
  ];

  // Get all unique tags from assessments
  const allTags = Array.from(new Set(assessments.flatMap(a => a.tags || [])));

  const filteredAndSortedAssessments = assessments
    .filter(assessment => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!assessment.title.toLowerCase().includes(query) &&
            !assessment.description.toLowerCase().includes(query) &&
            !assessment.businessContext.toLowerCase().includes(query) &&
            !(assessment.tags || []).some(tag => tag.toLowerCase().includes(query))) {
          return false;
        }
      }

      // CEFR level filter
      if (filterLevel !== 'all' && assessment.cefrLevel !== filterLevel) {
        return false;
      }

      // Business context filter
      if (filterContext !== 'all' && assessment.businessContext !== filterContext) {
        return false;
      }

      // Difficulty type filter
      if (filterDifficulty !== 'all') {
        if (filterDifficulty === 'adaptive' && !assessment.adaptiveDifficulty) return false;
        if (filterDifficulty === 'fixed' && assessment.adaptiveDifficulty) return false;
      }

      // Tags filter
      if (selectedTags.length > 0) {
        const assessmentTags = assessment.tags || [];
        if (!selectedTags.some(tag => assessmentTags.includes(tag))) {
          return false;
        }
      }

      // Tab filter
      if (activeTab === 'bookmarked' && !bookmarkedAssessments.has(assessment.id)) {
        return false;
      }
      if (activeTab === 'adaptive' && !assessment.adaptiveDifficulty) {
        return false;
      }
      if (activeTab === 'popular' && (assessment.popularity || 0) < 75) {
        return false;
      }

      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'level':
          const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
          comparison = levelOrder.indexOf(a.cefrLevel) - levelOrder.indexOf(b.cefrLevel);
          break;
        case 'date':
          comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          break;
        case 'popularity':
          comparison = (b.popularity || 0) - (a.popularity || 0);
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
      }

      return sortOrder === 'desc' ? comparison : -comparison;
    });

  const toggleBookmark = (assessmentId: string) => {
    setBookmarkedAssessments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assessmentId)) {
        newSet.delete(assessmentId);
      } else {
        newSet.add(assessmentId);
      }
      return newSet;
    });
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterLevel('all');
    setFilterContext('all');
    setFilterDifficulty('all');
    setSelectedTags([]);
  };

  const getDifficultyBadge = (assessment: Assessment) => {
    if (assessment.adaptiveDifficulty) {
      return <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">Adaptive</Badge>;
    }
    return <Badge variant="outline" className="text-xs">Fixed</Badge>;
  };

  const getPopularityColor = (popularity: number = 0) => {
    if (popularity >= 90) return 'text-green-600';
    if (popularity >= 75) return 'text-blue-600';
    if (popularity >= 60) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const AssessmentCard = ({ assessment }: { assessment: Assessment }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                {assessment.title}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBookmark(assessment.id);
                }}
                className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Bookmark
                  className={cn(
                    "h-4 w-4",
                    bookmarkedAssessments.has(assessment.id)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-400"
                  )}
                />
              </Button>
            </div>
            <CardDescription className="line-clamp-2">{assessment.description}</CardDescription>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline">{assessment.cefrLevel}</Badge>
          <Badge variant="secondary">{assessment.businessContext}</Badge>
          {getDifficultyBadge(assessment)}
          {(assessment.popularity || 0) >= 80 && (
            <Badge variant="default" className="bg-yellow-500">Popular</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span>{assessment.duration}m</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="h-3 w-3 text-muted-foreground" />
              <span>{assessment.passingScore}%</span>
            </div>
            <div className="flex items-center gap-1">
              <Trophy className={cn("h-3 w-3", getPopularityColor(assessment.popularity))} />
              <span>{assessment.popularity || 0}%</span>
            </div>
          </div>

          {assessment.tags && assessment.tags.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap">
              {assessment.tags.slice(0, 3).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {assessment.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{assessment.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <div className="text-xs text-muted-foreground">
              {assessment.completionRate}% completion rate
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  // View assessment details
                }}
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssessmentSelect?.(assessment);
                }}
              >
                <Play className="h-4 w-4 mr-1" />
                Start
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const AssessmentListItem = ({ assessment }: { assessment: Assessment }) => (
    <Card className="group hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-medium group-hover:text-blue-600 transition-colors">
                {assessment.title}
              </h3>
              <Badge variant="outline">{assessment.cefrLevel}</Badge>
              <Badge variant="secondary">{assessment.businessContext}</Badge>
              {getDifficultyBadge(assessment)}
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {assessment.description}
            </p>
          </div>
          
          <div className="flex items-center gap-4 ml-4">
            <div className="text-center">
              <div className="text-sm font-medium">{assessment.duration}m</div>
              <div className="text-xs text-muted-foreground">Duration</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">{assessment.popularity || 0}%</div>
              <div className="text-xs text-muted-foreground">Popular</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium">{assessment.completionRate}%</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleBookmark(assessment.id);
                }}
              >
                <Bookmark
                  className={cn(
                    "h-4 w-4",
                    bookmarkedAssessments.has(assessment.id)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-400"
                  )}
                />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onAssessmentSelect?.(assessment);
                }}
              >
                <Play className="h-4 w-4 mr-1" />
                Start
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Assessment Library</h2>
          <p className="text-muted-foreground">
            Discover and take assessments to improve your skills
          </p>
        </div>
        <div className="flex items-center gap-2">
          {userRole !== 'student' && (
            <Button onClick={onCreateAssessment}>
              <Plus className="h-4 w-4 mr-2" />
              Create Assessment
            </Button>
          )}
          <div className="flex items-center border rounded-lg">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assessments, topics, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap items-center gap-4">
              <Select value={filterLevel} onValueChange={(value: CEFRLevel | 'all') => setFilterLevel(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  {cefrLevels.map(level => (
                    <SelectItem key={level} value={level}>
                      {level === 'all' ? 'All Levels' : level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterContext} onValueChange={setFilterContext}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Context" />
                </SelectTrigger>
                <SelectContent>
                  {businessContexts.map(context => (
                    <SelectItem key={context} value={context}>
                      {context === 'all' ? 'All Contexts' : context}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterDifficulty} onValueChange={(value: any) => setFilterDifficulty(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="adaptive">Adaptive</SelectItem>
                  <SelectItem value="fixed">Fixed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  <SelectItem value="level">Level</SelectItem>
                  <SelectItem value="popularity">Popularity</SelectItem>
                  <SelectItem value="duration">Duration</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
              </Button>

              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>

            {/* Tags */}
            {allTags.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {allTags.map(tag => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({assessments.length})</TabsTrigger>
          <TabsTrigger value="bookmarked">Bookmarked ({bookmarkedAssessments.size})</TabsTrigger>
          <TabsTrigger value="adaptive">Adaptive ({assessments.filter(a => a.adaptiveDifficulty).length})</TabsTrigger>
          <TabsTrigger value="popular">Popular ({assessments.filter(a => (a.popularity || 0) >= 75).length})</TabsTrigger>
          <TabsTrigger value="collections">Collections ({collections.length})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {activeTab === 'collections' ? (
            <div className="space-y-4">
              {collections.map(collection => (
                <Card key={collection.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <FolderOpen className="h-5 w-5" />
                          {collection.name}
                        </CardTitle>
                        <CardDescription>{collection.description}</CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{collection.assessments.length} assessments</Badge>
                        {collection.isPublic && <Badge variant="secondary">Public</Badge>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      {collection.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {collection.assessments.slice(0, 2).map(assessment => {
                        return (
                          <div key={assessment.id} className="p-3 border rounded-lg">
                            <h4 className="font-medium mb-1">{assessment.title}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{assessment.description}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{assessment.cefrLevel}</Badge>
                              <Badge variant="outline" className="text-xs">{assessment.duration}m</Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {collection.assessments.length > 2 && (
                      <div className="mt-3 text-sm text-muted-foreground">
                        +{collection.assessments.length - 2} more assessments
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {filteredAndSortedAssessments.length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8">
                      <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">No assessments found</h3>
                      <p className="text-muted-foreground mb-4">
                        Try adjusting your search criteria or filters
                      </p>
                      <Button onClick={clearFilters} variant="outline">
                        Clear All Filters
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className={cn(
                  "gap-4",
                  viewMode === 'grid' 
                    ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                    : "space-y-4"
                )}>
                  {filteredAndSortedAssessments.map(assessment => 
                    viewMode === 'grid' 
                      ? <AssessmentCard key={assessment.id} assessment={assessment} />
                      : <AssessmentListItem key={assessment.id} assessment={assessment} />
                  )}
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}