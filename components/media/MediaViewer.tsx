'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MediaContent, Caption, Chapter, MediaInteraction, AccessibilityFeatures } from '../../lib/content/types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Settings, 
  Captions,
  BookOpen,
  MessageSquare,
  Bookmark,
  Download,
  Share
} from 'lucide-react';
import { mediaUtils } from '../../lib/media/mediaProcessor';

interface MediaViewerProps {
  media: MediaContent;
  autoPlay?: boolean;
  showControls?: boolean;
  showTranscription?: boolean;
  onInteraction?: (interaction: MediaInteraction) => void;
  onProgress?: (currentTime: number, duration: number) => void;
  onComplete?: () => void;
  accessibility?: AccessibilityFeatures;
}

export default function MediaViewer({ 
  media, 
  autoPlay = false,
  showControls = true,
  showTranscription = false,
  onInteraction,
  onProgress,
  onComplete,
  accessibility
}: MediaViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showCaptions, setShowCaptions] = useState(accessibility?.closedCaptions || false);
  const [showChapters, setShowChapters] = useState(false);
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null);
  const [activeCaptions, setActiveCaptions] = useState<Caption[]>([]);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const mediaRef = media.type === 'video' ? videoRef : audioRef;

  useEffect(() => {
    const mediaElement = mediaRef?.current;
    if (!mediaElement) return;

    const handleLoadedMetadata = () => {
      setDuration(mediaElement.duration);
      if (autoPlay) {
        mediaElement.play();
        setIsPlaying(true);
      }
    };

    const handleTimeUpdate = () => {
      const current = mediaElement.currentTime;
      setCurrentTime(current);
      
      // Update active captions
      if (media.captions && showCaptions) {
        const active = media.captions.filter(caption => 
          current >= caption.startTime && current <= caption.endTime
        );
        setActiveCaptions(active);
      }

      // Update current chapter
      if (media.chapters) {
        const chapter = media.chapters.find(ch => 
          current >= ch.startTime && current <= ch.endTime
        );
        if (chapter !== currentChapter) {
          setCurrentChapter(chapter || null);
        }
      }

      // Check for interactions
      if (media.interactions) {
        media.interactions.forEach(interaction => {
          if (Math.abs(current - interaction.timestamp) < 0.5 && onInteraction) {
            onInteraction(interaction);
          }
        });
      }

      onProgress?.(current, mediaElement.duration);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onComplete?.();
    };

    mediaElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    mediaElement.addEventListener('timeupdate', handleTimeUpdate);
    mediaElement.addEventListener('ended', handleEnded);

    return () => {
      mediaElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      mediaElement.removeEventListener('timeupdate', handleTimeUpdate);
      mediaElement.removeEventListener('ended', handleEnded);
    };
  }, [media, autoPlay, showCaptions, onInteraction, onProgress, onComplete]);

  const togglePlayPause = () => {
    const mediaElement = mediaRef?.current;
    if (!mediaElement) return;

    if (isPlaying) {
      mediaElement.pause();
    } else {
      mediaElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    const mediaElement = mediaRef?.current;
    if (!mediaElement) return;

    const newTime = value[0];
    mediaElement.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (value: number[]) => {
    const mediaElement = mediaRef?.current;
    if (!mediaElement) return;

    const newVolume = value[0];
    mediaElement.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const mediaElement = mediaRef?.current;
    if (!mediaElement) return;

    if (isMuted) {
      mediaElement.volume = volume;
      setIsMuted(false);
    } else {
      mediaElement.volume = 0;
      setIsMuted(true);
    }
  };

  const changePlaybackRate = (rate: number) => {
    const mediaElement = mediaRef?.current;
    if (!mediaElement) return;

    mediaElement.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const jumpToChapter = (chapter: Chapter) => {
    const mediaElement = mediaRef?.current;
    if (!mediaElement) return;

    mediaElement.currentTime = chapter.startTime;
    setCurrentTime(chapter.startTime);
  };

  const handleInteractionClick = (interaction: MediaInteraction) => {
    const mediaElement = mediaRef?.current;
    if (!mediaElement) return;

    mediaElement.currentTime = interaction.timestamp;
    onInteraction?.(interaction);
  };

  const renderMediaElement = () => {
    if (media.type === 'video') {
      return (
        <video
          ref={videoRef}
          className="w-full h-auto max-h-96"
          poster={media.thumbnailUrl}
          preload="metadata"
          crossOrigin="anonymous"
          aria-label={media.metadata.title}
        >
          <source src={media.url} type={`video/${media.format}`} />
          {media.captions?.map(caption => (
            <track
              key={caption.id}
              kind="captions"
              src={`data:text/vtt;charset=utf-8,${encodeURIComponent(
                `WEBVTT\n\n${caption.startTime} --> ${caption.endTime}\n${caption.text}`
              )}`}
              srcLang={caption.language}
              label={caption.type}
              default={showCaptions}
            />
          ))}
          Your browser does not support the video element.
        </video>
      );
    } else if (media.type === 'audio') {
      return (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-48 flex items-center justify-center text-white">
          <audio
            ref={audioRef}
            preload="metadata"
            crossOrigin="anonymous"
            aria-label={media.metadata.title}
          >
            <source src={media.url} type={`audio/${media.format}`} />
            Your browser does not support the audio element.
          </audio>
          <div className="text-center">
            <div className="text-2xl font-bold mb-2">{media.metadata.title}</div>
            <div className="text-lg opacity-90">{media.metadata.author}</div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto" ref={containerRef}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">{media.metadata.title}</h2>
            {media.metadata.description && (
              <p className="text-sm text-gray-600 mt-1">{media.metadata.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">{media.metadata.cefrLevel}</Badge>
            <Badge variant="secondary">{media.metadata.difficulty}</Badge>
            <Badge variant="outline">{mediaUtils.formatFileSize(media.fileSize)}</Badge>
          </div>
        </CardTitle>
        
        {/* Metadata */}
        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
          {media.duration && (
            <span>Duration: {mediaUtils.formatDuration(media.duration)}</span>
          )}
          {media.metadata.author && (
            <span>• Author: {media.metadata.author}</span>
          )}
          {media.metadata.language && (
            <span>• Language: {media.metadata.language}</span>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Media Element */}
        {renderMediaElement()}

        {/* Current Captions */}
        {showCaptions && activeCaptions.length > 0 && (
          <div className="bg-black/80 text-white p-3 rounded-lg text-center">
            {activeCaptions.map(caption => (
              <p key={caption.id} className="text-lg">
                {caption.text}
              </p>
            ))}
          </div>
        )}

        {/* Controls */}
        {showControls && (
          <div className="space-y-4">
            {/* Progress Bar */}
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="w-full"
                aria-label="Media progress"
              />
              <div className="flex justify-between text-sm text-gray-600">
                <span>{mediaUtils.formatDuration(currentTime)}</span>
                <span>{mediaUtils.formatDuration(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlayPause}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    aria-label={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Slider
                    value={[isMuted ? 0 : volume]}
                    max={1}
                    step={0.1}
                    onValueChange={handleVolumeChange}
                    className="w-20"
                    aria-label="Volume"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {/* Playback Speed */}
                <select
                  value={playbackRate}
                  onChange={(e) => changePlaybackRate(Number(e.target.value))}
                  className="px-2 py-1 rounded border text-sm"
                  aria-label="Playback speed"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>

                {/* Caption Toggle */}
                {media.captions && media.captions.length > 0 && (
                  <Button
                    variant={showCaptions ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowCaptions(!showCaptions)}
                    aria-label="Toggle captions"
                  >
                    <Captions className="h-4 w-4" />
                  </Button>
                )}

                {/* Chapter Toggle */}
                {media.chapters && media.chapters.length > 0 && (
                  <Button
                    variant={showChapters ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowChapters(!showChapters)}
                    aria-label="Toggle chapters"
                  >
                    <BookOpen className="h-4 w-4" />
                  </Button>
                )}

                {media.type === 'video' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleFullscreen}
                    aria-label="Fullscreen"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chapters */}
        {showChapters && media.chapters && media.chapters.length > 0 && (
          <div className="border rounded-lg p-4 space-y-2">
            <h3 className="font-semibold flex items-center">
              <BookOpen className="h-4 w-4 mr-2" />
              Chapters
            </h3>
            <div className="space-y-1">
              {media.chapters.map((chapter) => (
                <button
                  key={chapter.id}
                  onClick={() => jumpToChapter(chapter)}
                  className={`w-full text-left p-2 rounded hover:bg-gray-100 transition-colors ${
                    currentChapter?.id === chapter.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{chapter.title}</span>
                    <span className="text-sm text-gray-500">
                      {mediaUtils.formatDuration(chapter.startTime)}
                    </span>
                  </div>
                  {chapter.description && (
                    <p className="text-sm text-gray-600 mt-1">{chapter.description}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Elements */}
        {media.interactions && media.interactions.length > 0 && (
          <div className="border rounded-lg p-4 space-y-2">
            <h3 className="font-semibold flex items-center">
              <MessageSquare className="h-4 w-4 mr-2" />
              Interactive Elements
            </h3>
            <div className="space-y-1">
              {media.interactions.map((interaction) => (
                <button
                  key={interaction.id}
                  onClick={() => handleInteractionClick(interaction)}
                  className="w-full text-left p-2 rounded hover:bg-gray-100 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <span className="capitalize">{interaction.type}</span>
                    <span className="text-sm text-gray-500">
                      {mediaUtils.formatDuration(interaction.timestamp)}
                    </span>
                  </div>
                  {interaction.required && (
                    <Badge variant="destructive" className="mt-1">Required</Badge>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Transcription */}
        {showTranscription && media.transcription && (
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">Transcription</h3>
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
              {media.transcription}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <Bookmark className="h-4 w-4 mr-2" />
              Bookmark
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Accessibility Info */}
        {accessibility?.screenReader && (
          <div className="sr-only" aria-live="polite">
            {isPlaying ? 'Playing' : 'Paused'} {media.metadata.title}
            {currentChapter && ` - ${currentChapter.title}`}
            {activeCaptions.length > 0 && ` - ${activeCaptions[0].text}`}
          </div>
        )}
      </CardContent>
    </Card>
  );
}