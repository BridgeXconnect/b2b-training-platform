// Multi-modal media processing and upload system
import { MediaContent, MediaMetadata, Caption, Chapter, AccessibilityFeatures } from '../content/types';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
}

export interface ProcessingOptions {
  generateThumbnail?: boolean;
  extractAudio?: boolean;
  generateCaptions?: boolean;
  detectChapters?: boolean;
  optimizeQuality?: boolean;
  compressionLevel?: 'none' | 'low' | 'medium' | 'high';
  targetFormat?: string;
  resolution?: string;
  accessibility?: AccessibilityRequirements;
}

export interface AccessibilityRequirements {
  generateDescriptions?: boolean;
  createTranscriptions?: boolean;
  addClosedCaptions?: boolean;
  audioDescriptions?: boolean;
  highContrastThumbnails?: boolean;
}

export interface MediaProcessingResult {
  success: boolean;
  media?: MediaContent;
  error?: string;
  warnings?: string[];
  processingTime: number;
  qualityScore: number;
  accessibilityScore: number;
}

export class MediaProcessor {
  private static instance: MediaProcessor;
  private uploadQueue: Map<string, UploadProgress> = new Map();
  private processingQueue: Set<string> = new Set();

  private constructor() {}

  static getInstance(): MediaProcessor {
    if (!MediaProcessor.instance) {
      MediaProcessor.instance = new MediaProcessor();
    }
    return MediaProcessor.instance;
  }

  async uploadMedia(
    file: File,
    options: ProcessingOptions = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<MediaProcessingResult> {
    const uploadId = this.generateUploadId();
    const startTime = Date.now();

    try {
      // Initialize upload progress
      const progress: UploadProgress = {
        loaded: 0,
        total: file.size,
        percentage: 0,
        status: 'uploading',
        message: 'Starting upload...'
      };
      
      this.uploadQueue.set(uploadId, progress);
      onProgress?.(progress);

      // Validate file
      const validation = await this.validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Upload file with progress tracking
      const uploadResult = await this.performUpload(file, uploadId, onProgress);
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }

      // Process media
      progress.status = 'processing';
      progress.message = 'Processing media...';
      this.uploadQueue.set(uploadId, progress);
      onProgress?.(progress);

      const processedMedia = await this.processMedia(uploadResult.url || '', file, options);

      // Complete
      progress.status = 'complete';
      progress.percentage = 100;
      progress.message = 'Upload complete';
      this.uploadQueue.set(uploadId, progress);
      onProgress?.(progress);

      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        media: processedMedia,
        processingTime,
        qualityScore: await this.calculateQualityScore(processedMedia),
        accessibilityScore: await this.calculateAccessibilityScore(processedMedia)
      };

    } catch (error) {
      const progress = this.uploadQueue.get(uploadId);
      if (progress) {
        progress.status = 'error';
        progress.message = error instanceof Error ? error.message : 'Upload failed';
        this.uploadQueue.set(uploadId, progress);
        onProgress?.(progress);
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: Date.now() - startTime,
        qualityScore: 0,
        accessibilityScore: 0
      };
    } finally {
      this.uploadQueue.delete(uploadId);
      this.processingQueue.delete(uploadId);
    }
  }

  private generateUploadId(): string {
    return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async validateFile(file: File): Promise<{ valid: boolean; error?: string }> {
    // Check file size (max 500MB)
    const maxSize = 500 * 1024 * 1024;
    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 500MB limit' };
    }

    // Check file type
    const supportedTypes = [
      'video/mp4', 'video/webm', 'video/quicktime',
      'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/mp4',
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf', 'text/plain',
      'model/gltf+json', 'model/gltf-binary'
    ];

    if (!supportedTypes.includes(file.type)) {
      return { valid: false, error: `Unsupported file type: ${file.type}` };
    }

    // Additional validation for specific types
    if (file.type.startsWith('video/')) {
      return this.validateVideo(file);
    }
    
    if (file.type.startsWith('audio/')) {
      return this.validateAudio(file);
    }

    return { valid: true };
  }

  private async validateVideo(file: File): Promise<{ valid: boolean; error?: string }> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const url = URL.createObjectURL(file);
      
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        
        // Check duration (max 2 hours)
        if (video.duration > 7200) {
          resolve({ valid: false, error: 'Video duration exceeds 2 hours' });
          return;
        }

        // Check dimensions (max 4K)
        if (video.videoWidth > 3840 || video.videoHeight > 2160) {
          resolve({ valid: false, error: 'Video resolution exceeds 4K (3840x2160)' });
          return;
        }

        resolve({ valid: true });
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ valid: false, error: 'Invalid video file' });
      };

      video.src = url;
    });
  }

  private async validateAudio(file: File): Promise<{ valid: boolean; error?: string }> {
    return new Promise((resolve) => {
      const audio = document.createElement('audio');
      const url = URL.createObjectURL(file);
      
      audio.onloadedmetadata = () => {
        URL.revokeObjectURL(url);
        
        // Check duration (max 4 hours)
        if (audio.duration > 14400) {
          resolve({ valid: false, error: 'Audio duration exceeds 4 hours' });
          return;
        }

        resolve({ valid: true });
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ valid: false, error: 'Invalid audio file' });
      };

      audio.src = url;
    });
  }

  private async performUpload(
    file: File,
    uploadId: string,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<{ success: boolean; url?: string; error?: string }> {
    return new Promise((resolve) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('uploadId', uploadId);

      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = this.uploadQueue.get(uploadId);
          if (progress) {
            progress.loaded = event.loaded;
            progress.percentage = Math.round((event.loaded / event.total) * 100);
            progress.message = `Uploading... ${progress.percentage}%`;
            this.uploadQueue.set(uploadId, progress);
            onProgress?.(progress);
          }
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve({ success: true, url: response.url });
          } catch (error) {
            resolve({ success: false, error: 'Invalid response from server' });
          }
        } else {
          resolve({ success: false, error: `Upload failed with status ${xhr.status}` });
        }
      };

      xhr.onerror = () => {
        resolve({ success: false, error: 'Network error during upload' });
      };

      xhr.open('POST', '/api/media/upload');
      xhr.send(formData);
    });
  }

  private async processMedia(
    url: string,
    originalFile: File,
    options: ProcessingOptions
  ): Promise<MediaContent> {
    const mediaType = this.getMediaTypeFromFile(originalFile);
    const metadata = await this.generateMetadata(originalFile, url);

    const media: MediaContent = {
      id: this.generateMediaId(),
      type: mediaType,
      url,
      fileSize: originalFile.size,
      format: this.getFormatFromFile(originalFile),
      quality: 'medium',
      metadata,
      interactions: []
    };

    // Generate thumbnail if requested
    if (options.generateThumbnail && (mediaType === 'video' || mediaType === 'image')) {
      media.thumbnailUrl = await this.generateThumbnail(url, mediaType);
    }

    // Generate captions for video/audio
    if (options.generateCaptions && (mediaType === 'video' || mediaType === 'audio')) {
      media.captions = await this.generateCaptions(url);
    }

    // Detect chapters for video/audio
    if (options.detectChapters && (mediaType === 'video' || mediaType === 'audio')) {
      media.chapters = await this.detectChapters(url);
    }

    // Generate transcription for audio/video
    if (mediaType === 'video' || mediaType === 'audio') {
      media.transcription = await this.generateTranscription(url);
      media.duration = await this.getMediaDuration(url);
    }

    return media;
  }

  private getMediaTypeFromFile(file: File): MediaContent['type'] {
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    if (file.type.startsWith('image/')) return 'image';
    if (file.type === 'application/pdf' || file.type.startsWith('text/')) return 'document';
    if (file.type.includes('gltf')) return '3d-model';
    return 'document';
  }

  private getFormatFromFile(file: File): string {
    return file.name.split('.').pop()?.toLowerCase() || 'unknown';
  }

  private generateMediaId(): string {
    return `media_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async generateMetadata(file: File, url: string): Promise<MediaMetadata> {
    return {
      title: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
      description: `Uploaded ${file.type} content`,
      creationDate: new Date(),
      tags: [],
      cefrLevel: 'B1',
      skillsTargeted: [],
      language: 'en',
      difficulty: 'intermediate',
    };
  }

  private async generateThumbnail(url: string, mediaType: string): Promise<string> {
    if (mediaType === 'video') {
      return this.generateVideoThumbnail(url);
    }
    return url; // For images, use the original
  }

  private async generateVideoThumbnail(videoUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        video.currentTime = video.duration * 0.1; // 10% into the video
      };

      video.onseeked = () => {
        if (ctx) {
          ctx.drawImage(video, 0, 0);
          const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          resolve(thumbnailDataUrl);
        }
      };

      video.src = videoUrl;
    });
  }

  private async generateCaptions(url: string): Promise<Caption[]> {
    // This would integrate with a speech-to-text service
    // For now, return empty array as placeholder
    return [];
  }

  private async detectChapters(url: string): Promise<Chapter[]> {
    // This would use AI to detect chapter boundaries
    // For now, return empty array as placeholder
    return [];
  }

  private async generateTranscription(url: string): Promise<string> {
    // This would integrate with a speech-to-text service
    // For now, return placeholder
    return '';
  }

  private async getMediaDuration(url: string): Promise<number> {
    return new Promise((resolve) => {
      const media = document.createElement('video');
      media.onloadedmetadata = () => {
        resolve(media.duration);
      };
      media.onerror = () => resolve(0);
      media.src = url;
    });
  }

  private async calculateQualityScore(media: MediaContent): Promise<number> {
    let score = 0.7; // Base score

    // Higher score for better formats
    const highQualityFormats = ['mp4', 'webm', 'png', 'webp'];
    if (highQualityFormats.includes(media.format)) {
      score += 0.1;
    }

    // Higher score for accessibility features
    if (media.captions && media.captions.length > 0) {
      score += 0.1;
    }
    
    if (media.transcription && media.transcription.length > 0) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  private async calculateAccessibilityScore(media: MediaContent): Promise<number> {
    let score = 0.3; // Base score

    if (media.captions && media.captions.length > 0) {
      score += 0.3;
    }

    if (media.transcription && media.transcription.length > 0) {
      score += 0.2;
    }

    if (media.thumbnailUrl) {
      score += 0.1;
    }

    if (media.chapters && media.chapters.length > 0) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  // Public methods for getting upload progress
  getUploadProgress(uploadId: string): UploadProgress | null {
    return this.uploadQueue.get(uploadId) || null;
  }

  getAllActiveUploads(): UploadProgress[] {
    return Array.from(this.uploadQueue.values());
  }

  cancelUpload(uploadId: string): void {
    this.uploadQueue.delete(uploadId);
    this.processingQueue.delete(uploadId);
  }
}

// Utility functions for media handling
export const mediaUtils = {
  formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  },

  formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  },

  isMediaType(filename: string, type: 'video' | 'audio' | 'image'): boolean {
    const extension = filename.split('.').pop()?.toLowerCase();
    if (!extension) return false;

    const typeMap = {
      video: ['mp4', 'webm', 'mov', 'avi'],
      audio: ['mp3', 'wav', 'ogg', 'm4a'],
      image: ['jpg', 'jpeg', 'png', 'gif', 'webp']
    };

    return typeMap[type].includes(extension);
  },

  generateMediaPreview(file: File): Promise<string> {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve(''); // No preview for non-images
      }
    });
  }
};

export default MediaProcessor;