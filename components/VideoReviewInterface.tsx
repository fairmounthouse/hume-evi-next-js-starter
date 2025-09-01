"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Clock, Crown } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { TranscriptEntry } from "@/utils/feedbackTypes";
// Removed FinalEvaluation import - no longer using old evaluation system
import { useRecordingAnchor } from "@/hooks/useRecordingAnchor";
import { cn } from "@/utils";

import Link from "next/link";

// Declare the Cloudflare Stream player element for TypeScript
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'stream-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        controls?: boolean;
        preload?: string;
        ref?: React.Ref<any>;
      };
    }
  }
}

interface VideoReviewInterfaceProps {
  videoUrl: string;
  transcript: TranscriptEntry[];
  className?: string;
}

export default function VideoReviewInterface({
  videoUrl,
  transcript,
  className = "",
}: VideoReviewInterfaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  
  // Simplified to only show transcript - evaluation moved to MBB Assessment component
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  
  // Check if this is a Cloudflare Stream URL
  const isCloudflareStream = videoUrl.includes('cloudflarestream.com');

  // Sync video time with transcript highlighting
  useEffect(() => {
    const video = videoRef.current;
    if (!video || transcript.length === 0) return;

    const setupVideoEvents = () => {
      if (!video) return;

      const handleTimeUpdate = () => {
        const currentTime = video.currentTime;
        setCurrentTime(currentTime);
        
        // Find the active transcript segment
        const activeSegment = transcript.find(segment => {
          const segmentTime = parseFloat(segment.timestamp.toString());
          const nextSegment = transcript[transcript.indexOf(segment) + 1];
          const nextTime = nextSegment ? parseFloat(nextSegment.timestamp.toString()) : Infinity;
          
          return currentTime >= segmentTime && currentTime < nextTime;
        });
        
        if (activeSegment && activeSegment.id !== activeSegmentId) {
          setActiveSegmentId(activeSegment.id);
          
          // Auto-scroll to active segment
          const segmentElement = document.getElementById(`segment-${activeSegment.id}`);
          if (segmentElement && transcriptRef.current) {
            segmentElement.scrollIntoView({
              behavior: "smooth",
              block: "center",
            });
          }
        }
      };

      const handleLoadedMetadata = () => {
        const duration = video.duration || 0;
        setDuration(duration);
      };

      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleVolumeChange = () => setIsMuted(video.muted);

      // Add event listeners
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      video.addEventListener('play', handlePlay);
      video.addEventListener('pause', handlePause);
      video.addEventListener('volumechange', handleVolumeChange);

      // Cleanup function
      return () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
        video.removeEventListener('play', handlePlay);
        video.removeEventListener('pause', handlePause);
        video.removeEventListener('volumechange', handleVolumeChange);
      };
    };

    // Small delay to ensure the stream player is ready
    const timeout = setTimeout(setupVideoEvents, 100);
    return () => clearTimeout(timeout);
  }, [transcript, activeSegmentId, isCloudflareStream]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleTimestampClick = (timestamp: string) => {
    const video = videoRef.current;
    if (!video) return;

    // Parse timestamp (format: MM:SS or HH:MM:SS)
    const parts = timestamp.split(':').map(Number);
    let totalSeconds = 0;
    
    if (parts.length === 2) {
      // MM:SS format
      totalSeconds = parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      // HH:MM:SS format
      totalSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    
    if (isCloudflareStream) {
      // For Cloudflare Stream, we need to use the stream player's API
      const streamPlayer = document.querySelector('stream-player') as any;
      if (streamPlayer && streamPlayer.currentTime !== undefined) {
        console.log(`🎬 Seeking to ${totalSeconds}s using Cloudflare Stream API`);
        streamPlayer.currentTime = totalSeconds;
        setCurrentTime(totalSeconds);
      }
    } else {
      // For regular HTML5 video
      console.log(`🎬 Seeking to ${totalSeconds}s using HTML5 video`);
      video.currentTime = totalSeconds;
      setCurrentTime(totalSeconds);
    }
    
    // Transcript is always shown now
  };

  const { formatRelativeTime } = useRecordingAnchor();
  // Use central timestamp formatting function
  const formatTime2 = formatRelativeTime;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Video Player */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        {isCloudflareStream ? (
          <stream-player
            src={videoUrl}
            controls={false}
            preload="metadata"
            ref={videoRef as any}
            className="w-full aspect-video"
          />
        ) : (
          <video
            ref={videoRef}
            src={videoUrl}
            controls={false}
            preload="metadata"
            className="w-full aspect-video"
          />
        )}
        
        {/* Custom Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayPause}
              className="text-white hover:bg-white/20"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMute}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </Button>
            
            <div className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
            
            <div className="ml-auto">
              <Link href="/premium-analytics" className="inline-flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-medium hover:from-yellow-600 hover:to-orange-600 transition-all">
                <Crown className="w-3 h-3" />
                Upgrade for Advanced Analytics
              </Link>
            </div>
          </div>
          
          {/* Progress Bar */}
          {duration > 0 && (
            <div className="mt-2 w-full bg-white/20 rounded-full h-1">
              <div 
                className="bg-white rounded-full h-1 transition-all duration-100"
                style={{ width: `${(currentTime / duration) * 100}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* Interactive Transcript */}
      <div className="space-y-4">
        <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
          <h3 className="text-lg font-semibold">Interactive Transcript</h3>
          <p className="text-sm text-muted-foreground">Click on any line to jump to that moment in the video</p>
        </div>

        <div className="h-96 lg:h-[500px] overflow-y-auto">
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border" ref={transcriptRef}>
                {transcript.map((segment) => (
                  <div
                    key={segment.id}
                    id={`segment-${segment.id}`}
                    className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-white border ${
                      activeSegmentId === segment.id 
                        ? 'bg-blue-100 border-blue-300 shadow-sm' 
                        : 'bg-white border-transparent'
                    }`}
                    onClick={() => handleTimestampClick(segment.timestamp.toString())}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <Badge variant="outline" className="text-xs">
                          {segment.timestamp.toString()}
                        </Badge>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "text-sm font-medium",
                            segment.speaker === 'user' 
                              ? 'text-blue-600' 
                              : 'text-green-600'
                          )}>
                            {segment.speaker === 'user' ? 'You' : 'AI Interviewer'}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">
                          {segment.text}
                        </p>
                        {segment.emotions && segment.emotions.length > 0 && (
                          <div className="flex gap-1 mt-2">
                            {segment.emotions.slice(0, 3).map((emotion: any, idx: number) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {emotion.name} {Math.round(emotion.score * 100)}%
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
            {transcript.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <p>No transcript data available</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}