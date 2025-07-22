'use client';

import React, { useState, useCallback } from 'react';
import { ContentType, MediaContent, InteractiveElement, GeneratedContent, AccessibilityFeatures } from '../../lib/content/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import MediaViewer from '../media/MediaViewer';
import DragDropExercise from '../interactive/DragDropExercise';
import MediaProcessor, { ProcessingOptions, UploadProgress } from '../../lib/media/mediaProcessor';
import { 
  Upload, 
  Video, 
  Headphones, 
  Image, 
  FileText, 
  Gamepad2,
  VolumeX,
  Play,
  Download,
  Settings,
  Accessibility,
  Monitor
} from 'lucide-react';

interface MultiModalPanelProps {
  userId: string;
  onContentCreated?: (content: GeneratedContent) => void;
  onContentSelected?: (content: GeneratedContent) => void;
  initialTab?: string;
  accessibility?: AccessibilityFeatures;
}

interface UploadState {
  files: File[];
  isUploading: boolean;
  progress: UploadProgress | null;
  results: MediaContent[];
  errors: string[];
}

const CONTENT_TYPES = {
  video: { icon: Video, label: 'Video Content', description: 'Interactive video lessons with captions' },
  audio: { icon: Headphones, label: 'Audio Content', description: 'Podcasts and audio exercises' },
  interactive: { icon: Gamepad2, label: 'Interactive Elements', description: 'Drag-drop and simulation exercises' },
  multimedia: { icon: Monitor, label: 'Multimedia Experiences', description: 'Combined audio-visual content' },
  simulation: { icon: Settings, label: 'Simulations', description: 'Business scenario simulations' }
};

export default function MultiModalPanel({ 
  userId, 
  onContentCreated, 
  onContentSelected,
  initialTab = 'upload',
  accessibility = {
    screenReader: false,
    keyboardNavigation: true,
    highContrast: false,
    audioDescriptions: false,
    closedCaptions: true,
    signLanguage: false,
    reducedMotion: false,
    fontSize: 'adjustable',
    colorBlindSupport: false,
    alternativeText: [],
    voiceOver: {
      enabled: false,
      language: 'en',
      speed: 'normal',
      voice: 'neutral',
      descriptions: []
    }
  }
}: MultiModalPanelProps) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [uploadState, setUploadState] = useState<UploadState>({
    files: [],
    isUploading: false,
    progress: null,
    results: [],
    errors: []
  });
  const [mediaLibrary, setMediaLibrary] = useState<MediaContent[]>([]);
  const [interactiveElements, setInteractiveElements] = useState<InteractiveElement[]>([]);
  const [selectedContent, setSelectedContent] = useState<MediaContent | null>(null);
  const [processingOptions, setProcessingOptions] = useState<ProcessingOptions>({
    generateThumbnail: true,
    generateCaptions: accessibility.closedCaptions,
    detectChapters: true,
    optimizeQuality: true,
    compressionLevel: 'medium',
    accessibility: {
      generateDescriptions: accessibility.audioDescriptions,
      createTranscriptions: true,
      addClosedCaptions: accessibility.closedCaptions,
      audioDescriptions: accessibility.audioDescriptions,
      highContrastThumbnails: accessibility.highContrast
    }
  });

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setUploadState(prev => ({
      ...prev,
      files: [...prev.files, ...files],
      errors: []
    }));
  }, []);

  const handleFileDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const files = Array.from(event.dataTransfer.files);
    setUploadState(prev => ({
      ...prev,
      files: [...prev.files, ...files],
      errors: []
    }));
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  }, []);

  const uploadFiles = async () => {
    if (uploadState.files.length === 0) return;

    setUploadState(prev => ({ ...prev, isUploading: true, errors: [] }));
    const processor = MediaProcessor.getInstance();
    const results: MediaContent[] = [];
    const errors: string[] = [];

    for (const file of uploadState.files) {
      try {
        const result = await processor.uploadMedia(
          file,
          processingOptions,
          (progress) => {
            setUploadState(prev => ({ ...prev, progress }));
            
            if (accessibility.screenReader) {
              // Announce progress to screen readers
              const announcement = `Upload ${progress.percentage}% complete`;
              // This would be handled by aria-live region
            }
          }
        );

        if (result.success && result.media) {
          results.push(result.media);
        } else {
          errors.push(result.error || 'Upload failed');
        }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown error');
      }
    }

    setUploadState({
      files: [],
      isUploading: false,
      progress: null,
      results,
      errors
    });

    setMediaLibrary(prev => [...prev, ...results]);

    // Generate content from uploaded media
    for (const media of results) {
      const content = createContentFromMedia(media);
      onContentCreated?.(content);
    }
  };

  const createContentFromMedia = (media: MediaContent): GeneratedContent => {
    // Map media types to content section types
    const mapMediaTypeToSectionType = (mediaType: MediaContent['type']): any => {
      switch (mediaType) {
        case 'video': return 'video';
        case 'audio': return 'audio';
        case 'image': return 'multimedia';
        case 'document': return 'text';
        case '3d-model': return 'ar-vr';
        case 'ar-scene': return 'ar-vr';
        case 'vr-scene': return 'ar-vr';
        default: return 'multimedia';
      }
    };

    return {
      id: `content_${media.id}`,
      type: media.type as ContentType,
      title: media.metadata.title,
      description: media.metadata.description || 'Multi-modal learning content',
      content: [{
        id: `section_${media.id}`,
        type: mapMediaTypeToSectionType(media.type),
        title: media.metadata.title,
        content: 'Interactive multimedia learning experience',
        mediaContent: media,
        accessibility
      }],
      metadata: {
        cefrLevel: media.metadata.cefrLevel,
        estimatedDuration: media.duration || 10,
        difficulty: media.metadata.difficulty,
        topics: media.metadata.tags,
        skills: media.metadata.skillsTargeted,
        businessRelevance: 0.8,
        sopIntegration: false,
        generationSource: 'ai-original',
        qualityScore: 0.9,
        engagementPrediction: 0.85
      },
      aiGenerated: true,
      generationTimestamp: new Date(),
      version: '1.0'
    };
  };

  const removeFile = (index: number) => {
    setUploadState(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  const createInteractiveElement = (type: string) => {
    const element: InteractiveElement = {
      id: `interactive_${Date.now()}`,
      type: type as any,
      title: `${type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())} Exercise`,
      description: `Interactive ${type} learning activity`,
      configuration: {
        elements: [],
        rules: [],
        layout: {
          type: 'grid',
          dimensions: { width: 800, height: 600 },
          responsive: true
        },
        assets: [],
        settings: {
          autoProgress: false,
          attempts: 3,
          hintSystem: true,
          progressSaving: true,
          multiUser: false
        }
      },
      objectives: ['Practice language skills', 'Improve comprehension'],
      feedback: {
        immediate: true,
        types: [
          { trigger: 'correct', message: 'Excellent!', style: 'success' },
          { trigger: 'incorrect', message: 'Try again', style: 'error' }
        ],
        customMessages: {
          success: 'Great job!',
          partial: 'Good progress!',
          retry: 'Keep trying!'
        },
        animations: true,
        audio: accessibility.audioDescriptions
      },
      accessibility
    };

    setInteractiveElements(prev => [...prev, element]);
    
    const content = createContentFromInteractive(element);
    onContentCreated?.(content);
  };

  const createContentFromInteractive = (element: InteractiveElement): GeneratedContent => {
    return {
      id: `content_${element.id}`,
      type: 'interactive' as ContentType,
      title: element.title,
      description: element.description,
      content: [{
        id: `section_${element.id}`,
        type: 'interactive',
        title: element.title,
        content: element.description,
        interactiveElements: [element],
        accessibility
      }],
      metadata: {
        cefrLevel: 'B1',
        estimatedDuration: 15,
        difficulty: 'intermediate',
        topics: ['interactive-learning'],
        skills: ['problem-solving', 'comprehension'],
        businessRelevance: 0.7,
        sopIntegration: false,
        generationSource: 'ai-original',
        qualityScore: 0.85,
        engagementPrediction: 0.9
      },
      aiGenerated: true,
      generationTimestamp: new Date(),
      version: '1.0'
    };
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Monitor className="h-6 w-6" />
            <span>Multi-Modal Learning Resources</span>
          </CardTitle>
          <p className="text-gray-600">
            Create and manage interactive, accessible learning content across multiple media types
          </p>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="upload" className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </TabsTrigger>
              <TabsTrigger value="interactive" className="flex items-center space-x-2">
                <Gamepad2 className="h-4 w-4" />
                <span className="hidden sm:inline">Interactive</span>
              </TabsTrigger>
              <TabsTrigger value="library" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span className="hidden sm:inline">Library</span>
              </TabsTrigger>
              <TabsTrigger value="viewer" className="flex items-center space-x-2">
                <Play className="h-4 w-4" />
                <span className="hidden sm:inline">Preview</span>
              </TabsTrigger>
              <TabsTrigger value="accessibility" className="flex items-center space-x-2">
                <Accessibility className="h-4 w-4" />
                <span className="hidden sm:inline">Accessibility</span>
              </TabsTrigger>
            </TabsList>

            {/* Upload Tab */}
            <TabsContent value="upload" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Media Files</CardTitle>
                  <p className="text-sm text-gray-600">
                    Support for video, audio, images, documents, and 3D models
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Drop Zone */}
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors"
                    onDrop={handleFileDrop}
                    onDragOver={handleDragOver}
                    role={accessibility.screenReader ? "button" : undefined}
                    aria-label={accessibility.screenReader ? "Drop files here to upload" : undefined}
                    tabIndex={accessibility.keyboardNavigation ? 0 : -1}
                  >
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg mb-2">Drop files here or click to browse</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Supports: MP4, WebM, MP3, WAV, JPG, PNG, PDF, GLTF (Max 500MB)
                    </p>
                    <input
                      type="file"
                      multiple
                      accept="video/*,audio/*,image/*,.pdf,.txt,.gltf,.glb"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button asChild>
                      <label htmlFor="file-upload" className="cursor-pointer">
                        Select Files
                      </label>
                    </Button>
                  </div>

                  {/* Selected Files */}
                  {uploadState.files.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-3">Selected Files ({uploadState.files.length})</h3>
                      <div className="space-y-2">
                        {uploadState.files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              {file.type.startsWith('video/') && <Video className="h-5 w-5 text-blue-500" />}
                              {file.type.startsWith('audio/') && <Headphones className="h-5 w-5 text-green-500" />}
                              {file.type.startsWith('image/') && <Image className="h-5 w-5 text-purple-500" />}
                              {!file.type.startsWith('video/') && !file.type.startsWith('audio/') && !file.type.startsWith('image/') && (
                                <FileText className="h-5 w-5 text-gray-500" />
                              )}
                              <div>
                                <p className="font-medium">{file.name}</p>
                                <p className="text-sm text-gray-500">
                                  {(file.size / 1024 / 1024).toFixed(1)} MB
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeFile(index)}
                              disabled={uploadState.isUploading}
                            >
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>

                      {/* Processing Options */}
                      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold mb-3">Processing Options</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={processingOptions.generateThumbnail}
                              onChange={(e) => setProcessingOptions(prev => ({
                                ...prev,
                                generateThumbnail: e.target.checked
                              }))}
                            />
                            <span>Generate thumbnails</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={processingOptions.generateCaptions}
                              onChange={(e) => setProcessingOptions(prev => ({
                                ...prev,
                                generateCaptions: e.target.checked
                              }))}
                            />
                            <span>Auto-generate captions</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={processingOptions.detectChapters}
                              onChange={(e) => setProcessingOptions(prev => ({
                                ...prev,
                                detectChapters: e.target.checked
                              }))}
                            />
                            <span>Detect chapters</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={processingOptions.optimizeQuality}
                              onChange={(e) => setProcessingOptions(prev => ({
                                ...prev,
                                optimizeQuality: e.target.checked
                              }))}
                            />
                            <span>Optimize quality</span>
                          </label>
                        </div>
                      </div>

                      {/* Upload Progress */}
                      {uploadState.isUploading && uploadState.progress && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">Uploading...</span>
                            <span className="text-sm text-gray-600">{uploadState.progress.percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadState.progress.percentage}%` }}
                            />
                          </div>
                          <p className="text-sm text-gray-600 mt-2">{uploadState.progress.message}</p>
                        </div>
                      )}

                      {/* Upload Button */}
                      <div className="flex justify-end mt-4">
                        <Button
                          onClick={uploadFiles}
                          disabled={uploadState.isUploading}
                          className="flex items-center space-x-2"
                        >
                          <Upload className="h-4 w-4" />
                          <span>{uploadState.isUploading ? 'Processing...' : 'Upload Files'}</span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Upload Results */}
                  {uploadState.results.length > 0 && (
                    <div className="mt-6">
                      <h3 className="font-semibold mb-3 text-green-600">Successfully Uploaded</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {uploadState.results.map((media) => (
                          <Card key={media.id} className="p-4">
                            <div className="flex items-center space-x-3">
                              {media.type === 'video' && <Video className="h-5 w-5 text-blue-500" />}
                              {media.type === 'audio' && <Headphones className="h-5 w-5 text-green-500" />}
                              {media.type === 'image' && <Image className="h-5 w-5 text-purple-500" />}
                              <div>
                                <p className="font-medium">{media.metadata.title}</p>
                                <p className="text-sm text-gray-500">
                                  {media.format.toUpperCase()} • {(media.fileSize / 1024 / 1024).toFixed(1)} MB
                                </p>
                              </div>
                            </div>
                            <div className="flex justify-end mt-3">
                              <Button
                                size="sm"
                                onClick={() => setSelectedContent(media)}
                              >
                                Preview
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Upload Errors */}
                  {uploadState.errors.length > 0 && (
                    <div className="mt-4 p-4 bg-red-50 rounded-lg">
                      <h4 className="font-semibold text-red-800 mb-2">Upload Errors</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {uploadState.errors.map((error, index) => (
                          <li key={index}>• {error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Interactive Tab */}
            <TabsContent value="interactive" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Create Interactive Elements</CardTitle>
                  <p className="text-sm text-gray-600">
                    Build engaging interactive learning experiences
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(CONTENT_TYPES).map(([key, config]) => {
                      const IconComponent = config.icon;
                      return (
                        <Card key={key} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="text-center space-y-3">
                            <IconComponent className="h-8 w-8 mx-auto text-blue-500" />
                            <h3 className="font-semibold">{config.label}</h3>
                            <p className="text-sm text-gray-600">{config.description}</p>
                            <Button
                              size="sm"
                              onClick={() => createInteractiveElement(key)}
                              className="w-full"
                            >
                              Create {config.label}
                            </Button>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Interactive Elements Library */}
              {interactiveElements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Your Interactive Elements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {interactiveElements.map((element) => (
                        <Card key={element.id} className="p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold">{element.title}</h3>
                            <Badge variant="outline">{element.type}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{element.description}</p>
                          <div className="flex justify-end">
                            <Button size="sm" variant="outline">
                              Edit
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Library Tab */}
            <TabsContent value="library" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Media Library</CardTitle>
                  <p className="text-sm text-gray-600">
                    Manage all your uploaded and generated content
                  </p>
                </CardHeader>
                <CardContent>
                  {mediaLibrary.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No media files uploaded yet</p>
                      <p className="text-sm">Upload files in the Upload tab to get started</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {mediaLibrary.map((media) => (
                        <Card key={media.id} className="overflow-hidden">
                          {media.thumbnailUrl && (
                            <div className="aspect-video bg-gray-100">
                              <img
                                src={media.thumbnailUrl}
                                alt={media.metadata.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div className="p-4">
                            <h3 className="font-semibold mb-1">{media.metadata.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">
                              {media.type.charAt(0).toUpperCase() + media.type.slice(1)} • {media.format.toUpperCase()}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline">{media.metadata.cefrLevel}</Badge>
                              <Button
                                size="sm"
                                onClick={() => setSelectedContent(media)}
                              >
                                View
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Viewer Tab */}
            <TabsContent value="viewer" className="space-y-6">
              {selectedContent ? (
                <MediaViewer
                  media={selectedContent}
                  showControls={true}
                  showTranscription={true}
                  accessibility={accessibility}
                  onComplete={() => {
                    // Handle completion
                    console.log('Media viewing completed');
                  }}
                />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Play className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Content Selected</h3>
                    <p className="text-gray-500 text-center max-w-md">
                      Select a media file from your library or upload new content to preview it here
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Accessibility Tab */}
            <TabsContent value="accessibility" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Accessibility Settings</CardTitle>
                  <p className="text-sm text-gray-600">
                    Configure accessibility features for all content
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-semibold">Visual Accessibility</h4>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked={accessibility.highContrast} />
                        <span>High contrast mode</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked={accessibility.colorBlindSupport} />
                        <span>Color blind support</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked={accessibility.reducedMotion} />
                        <span>Reduced motion</span>
                      </label>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-semibold">Audio Accessibility</h4>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked={accessibility.closedCaptions} />
                        <span>Closed captions</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked={accessibility.audioDescriptions} />
                        <span>Audio descriptions</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input type="checkbox" defaultChecked={accessibility.signLanguage} />
                        <span>Sign language</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold">Navigation Accessibility</h4>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked={accessibility.keyboardNavigation} />
                      <span>Keyboard navigation</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked={accessibility.screenReader} />
                      <span>Screen reader support</span>
                    </label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Screen reader announcements */}
          <div aria-live="polite" className="sr-only">
            {uploadState.isUploading && uploadState.progress && 
              `Upload progress: ${uploadState.progress.percentage}%`}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}