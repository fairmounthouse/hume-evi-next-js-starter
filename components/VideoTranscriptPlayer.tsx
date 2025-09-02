"use client";

import { useState, useRef, useEffect, useCallback, useMemo, useImperativeHandle, forwardRef } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "./ui/button";
import { TranscriptEntry } from "@/utils/feedbackTypes";
import { useRecordingAnchor } from "@/hooks/useRecordingAnchor";

interface VideoTranscriptPlayerProps {
  videoUrl: string;
  transcript: TranscriptEntry[];
  className?: string;
}

export interface VideoPlayerRef {
  seekTo: (timestamp: number) => void;
  play: () => void;
  pause: () => void;
  getCurrentTime: () => number;
}

const VideoTranscriptPlayer = forwardRef<VideoPlayerRef, VideoTranscriptPlayerProps>(({
  videoUrl,
  transcript,
  className = "",
}, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [playerReady, setPlayerReady] = useState(false);

  // Update current time as video plays
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      
      // Find the active transcript segment based on current time
      const activeSegment = transcript.find((segment, index) => {
        const nextSegment = transcript[index + 1];
        return (
          segment.timestamp <= video.currentTime &&
          (!nextSegment || nextSegment.timestamp > video.currentTime)
        );
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
      setDuration(video.duration);
      
      // Check if there's a timestamp to jump to from sessionStorage
      const jumpTimestamp = sessionStorage.getItem('jumpToTimestamp');
      if (jumpTimestamp) {
        const timestamp = parseFloat(jumpTimestamp);
        video.currentTime = timestamp;
        setCurrentTime(timestamp);
        sessionStorage.removeItem('jumpToTimestamp'); // Clear after use
        console.log(`🎬 Jumped to timestamp: ${timestamp}s`);
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [transcript, activeSegmentId]);

  const togglePlayPause = () => {
    if (isPlaying) {
      pauseVideo();
    } else {
      playVideo();
    }
  };

  const toggleMute = () => {
    if (!isCloudflareStream) {
      const video = videoRef.current;
      if (video) {
        video.muted = !video.muted;
        setIsMuted(video.muted);
        logVideoOperation('HTML5_TOGGLE_MUTE', { wasMuted: isMuted, nowMuted: video.muted });
      }
    } else {
      logVideoOperation('CLOUDFLARE_MUTE_INFO', { message: 'Use built-in iframe controls for mute/unmute' });
    }
  };

  const { formatRelativeTime } = useRecordingAnchor();
  // Use central timestamp formatting function  
  const formatTime = formatRelativeTime;

  const getEmotionColor = (emotions?: Record<string, number>): string => {
    if (!emotions) return "text-gray-600";
    
    const maxEmotion = Object.entries(emotions).reduce((a, b) => 
      emotions[a[0]] > emotions[b[0]] ? a : b
    );

    const emotionColors: Record<string, string> = {
      joy: "text-yellow-600",
      sadness: "text-blue-600", 
      anger: "text-red-600",
      fear: "text-purple-600",
      surprise: "text-green-600",
      disgust: "text-orange-600",
      neutral: "text-gray-600",
    };

    return emotionColors[maxEmotion[0]] || "text-gray-600";
  };

  // Extract video ID from Cloudflare Stream URL - memoized for performance
  const { videoId, isCloudflareStream } = useMemo(() => {
    const getVideoIdFromUrl = (url: string): string | null => {
      // Handle different Cloudflare Stream URL formats
      // Format: https://customer-{code}.cloudflarestream.com/{videoId}/watch
      const match = url.match(/cloudflarestream\.com\/([^\/]+)\/watch/);
      return match ? match[1] : null;
    };

    const id = getVideoIdFromUrl(videoUrl);
    return {
      videoId: id,
      isCloudflareStream: !!id
    };
  }, [videoUrl]);

  // Memoized iframe src to prevent unnecessary reloads
  const iframeSrc = useMemo(() => {
    if (!isCloudflareStream || !videoId) return '';
    return `https://customer-sm0204x4lu04ck3x.cloudflarestream.com/${videoId}/iframe?preload=metadata&controls=true`;
  }, [videoId, isCloudflareStream]);

  // Enhanced logging utility
  const logVideoOperation = useCallback((operation: string, details: any) => {
    const timestamp = new Date().toISOString();
    console.log(`🎬 [VideoPlayer:${timestamp}] ${operation}:`, {
      videoId,
      isCloudflareStream,
      playerReady,
      currentTime,
      ...details
    });
  }, [videoId, isCloudflareStream, playerReady, currentTime]);

  // Note: We use the official startTime parameter instead of postMessage for seeking

  // Official Cloudflare Stream seeking using startTime parameter with 0.5s buffer
  const seekToTime = useCallback((timestamp: number) => {
    logVideoOperation('SEEK_REQUEST', { timestamp, targetTime: timestamp });
    
    if (isCloudflareStream && videoId && iframeRef.current) {
      // Add 0.5s AFTER the timestamp for better positioning
      const originalTimestamp = timestamp;
      const bufferedTimestamp = originalTimestamp + 2;
      const seekTime = Math.floor(bufferedTimestamp * 10) / 10; // Keep one decimal place
      
      // Use official Cloudflare Stream startTime parameter with autoplay and +0.5s offset
      const newSrc = `https://customer-sm0204x4lu04ck3x.cloudflarestream.com/${videoId}/iframe?preload=metadata&controls=true&startTime=${seekTime}&autoplay=true`;
      iframeRef.current.src = newSrc;
      setCurrentTime(originalTimestamp);
      logVideoOperation('CLOUDFLARE_STARTTIME_OFFSET_SUCCESS', { 
        originalTimestamp, 
        bufferedTimestamp, 
        seekTime, 
        newSrc 
      });
    } else if (!isCloudflareStream) {
      // HTML5 video fallback
      const video = videoRef.current;
      if (video) {
        video.currentTime = timestamp;
        setCurrentTime(timestamp);
        logVideoOperation('HTML5_SEEK_SUCCESS', { timestamp });
      } else {
        logVideoOperation('HTML5_SEEK_FAILED', { timestamp, reason: 'No video element' });
      }
    } else {
      logVideoOperation('SEEK_FAILED', { timestamp, reason: 'Missing videoId or iframe ref' });
    }
  }, [isCloudflareStream, videoId, logVideoOperation]);

  // Player control methods (Note: Cloudflare Stream iframe has built-in controls)
  const playVideo = useCallback(() => {
    if (!isCloudflareStream && videoRef.current) {
      videoRef.current.play();
      logVideoOperation('HTML5_PLAY_COMMAND', {});
    } else {
      logVideoOperation('CLOUDFLARE_PLAY_INFO', { message: 'Use built-in iframe controls for play/pause' });
    }
  }, [isCloudflareStream, logVideoOperation]);

  const pauseVideo = useCallback(() => {
    if (!isCloudflareStream && videoRef.current) {
      videoRef.current.pause();
      logVideoOperation('HTML5_PAUSE_COMMAND', {});
    } else {
      logVideoOperation('CLOUDFLARE_PAUSE_INFO', { message: 'Use built-in iframe controls for play/pause' });
    }
  }, [isCloudflareStream, logVideoOperation]);

  // Handle initial timestamp jump from sessionStorage
  useEffect(() => {
    const jumpTimestamp = sessionStorage.getItem('jumpToTimestamp');
    if (jumpTimestamp && isCloudflareStream) {
      const timestamp = parseFloat(jumpTimestamp);
      setTimeout(() => seekToTime(timestamp), 500); // Small delay for iframe load
      sessionStorage.removeItem('jumpToTimestamp');
      logVideoOperation('INITIAL_TIMESTAMP_JUMP', { timestamp });
    }
  }, [isCloudflareStream, seekToTime, logVideoOperation]);

  // Expose methods via imperative handle
  useImperativeHandle(ref, () => ({
    seekTo: seekToTime,
    play: playVideo,
    pause: pauseVideo,
    getCurrentTime: () => currentTime,
  }), [seekToTime, playVideo, pauseVideo, currentTime]);

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 h-full ${className}`}>
      {/* Video Player */}
      <div className="space-y-4">
        <div className="relative bg-black rounded-lg overflow-hidden">
          {isCloudflareStream ? (
            // Use Cloudflare Stream iframe with postMessage API - NO MORE RELOADS!
            <div className="relative w-full aspect-video">
              <iframe
                ref={iframeRef}
                src={iframeSrc}
                className="absolute inset-0 w-full h-full"
                style={{ border: "none" }}
                allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                allowFullScreen
                title="Interview Recording"
                onLoad={() => {
                  logVideoOperation('IFRAME_LOADED', { 
                    src: iframeSrc,
                    playerReady 
                  });
                }}
              />
              
              {/* Player status indicator for debugging */}
              {process.env.NODE_ENV === 'development' && (
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {playerReady ? '🟢 Ready' : '🟡 Loading...'}
                </div>
              )}
            </div>
          ) : (
            // Fallback to HTML5 video for non-Cloudflare URLs
            <>
              <video
                ref={videoRef}
                src={videoUrl}
                className="w-full aspect-video"
                preload="metadata"
              />
              
              {/* Video Controls Overlay - only for HTML5 video */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlayPause}
                    className="text-white hover:text-white hover:bg-white/20"
                  >
                    {isPlaying ? (
                      <Pause className="w-5 h-5" />
                    ) : (
                      <Play className="w-5 h-5" />
                    )}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleMute}
                    className="text-white hover:text-white hover:bg-white/20"
                  >
                    {isMuted ? (
                      <VolumeX className="w-5 h-5" />
                    ) : (
                      <Volume2 className="w-5 h-5" />
                    )}
                  </Button>

                  <div className="flex-1 mx-3">
                    <div className="relative">
                      <div className="w-full bg-white/30 rounded-full h-1">
                        <div
                          className="bg-white rounded-full h-1 transition-all"
                          style={{
                            width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
                          }}
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max={duration}
                        value={currentTime}
                        onChange={(e) => seekToTime(parseFloat(e.target.value))}
                        className="absolute inset-0 w-full h-1 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  <span className="text-white text-sm font-mono">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Transcript */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Interactive Transcript</h3>
        <div
          ref={transcriptRef}
          className="h-96 lg:h-[500px] overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg border"
        >
          {transcript.map((segment) => (
            <div
              key={segment.id}
              id={`segment-${segment.id}`}
              className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-white border ${
                activeSegmentId === segment.id
                  ? "bg-blue-100 border-blue-300 shadow-sm"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => {
                // Use unified seeking method - works for both Cloudflare and HTML5
                logVideoOperation('TRANSCRIPT_CLICK', { 
                  segmentId: segment.id, 
                  timestamp: segment.timestamp,
                  speaker: segment.speaker,
                  text: segment.text.substring(0, 50) + '...'
                });
                seekToTime(segment.timestamp);
              }}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {formatTime(segment.timestamp)}
                  </span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-sm font-medium ${
                        segment.speaker === "user" ? "text-blue-600" : "text-green-600"
                      }`}
                    >
                      {segment.speaker === "user" ? "You" : "AI Interviewer"}
                    </span>
                    
                    {segment.confidence && (
                      <span className="text-xs text-gray-400">
                        {Math.round(segment.confidence * 100)}% confidence
                      </span>
                    )}
                  </div>
                  
                  <p className={`text-sm leading-relaxed ${getEmotionColor(segment.emotions)}`}>
                    {segment.text}
                  </p>
                  
                  {segment.emotions && Object.keys(segment.emotions).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {Object.entries(segment.emotions)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .slice(0, 3)
                        .map(([emotion, score]) => (
                          <span
                            key={emotion}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                          >
                            {emotion}: {Math.round((score as number) * 100)}%
                          </span>
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
  );
});

VideoTranscriptPlayer.displayName = "VideoTranscriptPlayer";

export default VideoTranscriptPlayer;
