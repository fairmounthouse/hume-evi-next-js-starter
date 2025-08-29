"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Clock, Crown } from "lucide-react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { TranscriptEntry } from "@/utils/feedbackTypes";
import { FinalEvaluation } from "@/utils/feedbackTypes";
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
  evaluation?: FinalEvaluation | null;
  className?: string;
}

export default function VideoReviewInterface({
  videoUrl,
  transcript,
  evaluation,
  className = "",
}: VideoReviewInterfaceProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState<"transcript" | "evaluation">("transcript");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);
  const [expandedFactor, setExpandedFactor] = useState<string | null>(null);

  // Extract video ID from Cloudflare Stream URL
  const getVideoIdFromUrl = (url: string): string | null => {
    const match = url.match(/cloudflarestream\.com\/([^\/]+)\/watch/);
    return match ? match[1] : null;
  };

  const videoId = getVideoIdFromUrl(videoUrl);
  const isCloudflareStream = !!videoId;
  
  // Reference to the Cloudflare Stream player
  const streamPlayerRef = useRef<any>(null);

  // Update current time as video plays
  useEffect(() => {
    const setupVideoEvents = () => {
      const video = isCloudflareStream ? streamPlayerRef.current : videoRef.current;
      if (!video) return;

      const handleTimeUpdate = () => {
        const currentTime = video.currentTime || 0;
        setCurrentTime(currentTime);
        
        // Find the active transcript segment based on current time
        const activeSegment = transcript.find((segment, index) => {
          const nextSegment = transcript[index + 1];
          return (
            segment.timestamp <= currentTime &&
            (!nextSegment || nextSegment.timestamp > currentTime)
          );
        });
        
        if (activeSegment && activeSegment.id !== activeSegmentId) {
          setActiveSegmentId(activeSegment.id);
          
          // Auto-scroll to active segment (only if transcript tab is active)
          if (activeTab === "transcript") {
            const segmentElement = document.getElementById(`segment-${activeSegment.id}`);
            if (segmentElement && transcriptRef.current) {
              segmentElement.scrollIntoView({
                behavior: "smooth",
                block: "center",
              });
            }
          }
        }
      };

      const handleLoadedMetadata = () => {
        const duration = video.duration || 0;
        setDuration(duration);
        
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

      // Add event listeners
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
    };

    // Small delay to ensure the stream player is ready
    const timeout = setTimeout(setupVideoEvents, 100);
    return () => clearTimeout(timeout);
  }, [transcript, activeSegmentId, activeTab, isCloudflareStream]);

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

  const seekToTime = (timestamp: number) => {
    if (isCloudflareStream && streamPlayerRef.current) {
      // Use Cloudflare Stream player API
      console.log(`🎬 Seeking to ${timestamp}s using Cloudflare Stream API`);
      streamPlayerRef.current.currentTime = timestamp;
    } else {
      // Use HTML5 video
      const video = videoRef.current;
      if (!video) return;
      console.log(`🎬 Seeking to ${timestamp}s using HTML5 video`);
      video.currentTime = timestamp;
      setCurrentTime(timestamp);
    }
    
    // Switch to transcript tab when seeking from evaluation
    if (activeTab === "evaluation") {
      setActiveTab("transcript");
    }
  };

  const formatTime = (seconds: number): string => {
    // Handle both video time and transcript timestamps consistently  
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900";
    if (score >= 6) return "text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900";
    return "text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900";
  };

  // Parse timestamp from evaluation examples (format like "12:34" or "1:23:45")
  const parseTimestamp = (timestampStr: string): number | null => {
    const parts = timestampStr.split(':').map(p => parseInt(p));
    if (parts.length === 2) {
      return parts[0] * 60 + parts[1]; // MM:SS
    } else if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
    }
    return null;
  };

  const handleTimestampClick = (timestampStr: string) => {
    const timestamp = parseTimestamp(timestampStr);
    if (timestamp !== null) {
      console.log(`🎬 Seeking to timestamp: ${timestamp}s`);
      seekToTime(timestamp);
      
      // Switch to transcript tab to show the video
      setActiveTab("transcript");
    }
  };

  return (
    // Video review available to everyone - only limited by usage minutes
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 h-full ${className}`}>
      {/* Video Player */}
      <div className="space-y-4">
        <div className="relative bg-black rounded-lg overflow-hidden">
          {isCloudflareStream ? (
            <div 
              className="relative w-full aspect-video"
              style={{
                background: '#000',
              }}
            >
              <stream-player
                ref={streamPlayerRef}
                src={videoId}
                controls
                preload="metadata"
                className="w-full h-full"
                style={{ width: '100%', height: '100%' }}
              />
            </div>
          ) : (
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full aspect-video"
              preload="metadata"
              controls
              crossOrigin="anonymous"
            />
          )}
        </div>
      </div>

      {/* Tabs and Content */}
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            <button
              onClick={() => setActiveTab("transcript")}
              className={cn(
                "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                activeTab === "transcript"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              Interactive Transcript
            </button>
            {evaluation && (
              <button
                onClick={() => setActiveTab("evaluation")}
                className={cn(
                  "px-6 py-3 text-sm font-medium border-b-2 transition-colors",
                  activeTab === "evaluation"
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                Detailed Evaluation
              </button>
            )}
          </div>
        </div>

        {/* Tab Content */}
        <div className="h-96 lg:h-[500px] overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === "transcript" && (
              <motion.div
                key="transcript"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-3 p-4 bg-gray-50 rounded-lg border"
                ref={transcriptRef}
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
                      console.log(`🎬 Transcript click: seeking to ${segment.timestamp}s`);
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
              </motion.div>
            )}

            {activeTab === "evaluation" && evaluation && (
              <motion.div
                key="evaluation"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 p-4"
              >
                {evaluation.factors.map((factor, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      onClick={() => setExpandedFactor(
                        expandedFactor === factor.factor_name ? null : factor.factor_name
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge className={getScoreColor(factor.score)}>
                            {factor.score}/10
                          </Badge>
                          <h3 className="font-semibold">{factor.factor_name}</h3>
                        </div>
                        <motion.div
                          animate={{ rotate: expandedFactor === factor.factor_name ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </motion.div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedFactor === factor.factor_name && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="border-t border-gray-200 dark:border-gray-700"
                        >
                          <div className="p-4 space-y-4">
                            {/* Strength */}
                            <div>
                              <h4 className="font-medium text-green-600 mb-1">Strength</h4>
                              <p className="text-sm text-muted-foreground">{factor.strength}</p>
                            </div>

                            {/* Weaknesses */}
                            {factor.weakness.length > 0 && (
                              <div>
                                <h4 className="font-medium text-red-600 mb-1">Weaknesses</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                  {factor.weakness.map((weakness, i) => (
                                    <li key={i}>• {weakness}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Feedback */}
                            {factor.feedback.length > 0 && (
                              <div>
                                <h4 className="font-medium text-blue-600 mb-1">Feedback</h4>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                  {factor.feedback.map((feedback, i) => (
                                    <li key={i}>• {feedback}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Specific Examples with Clickable Timestamps */}
                            {factor.specific_example.length > 0 && (
                              <div>
                                <h4 className="font-medium text-purple-600 mb-2">Specific Examples</h4>
                                <div className="space-y-3">
                                  {factor.specific_example.map((example, i) => (
                                    <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-3 h-3 text-muted-foreground" />
                                        <button
                                          onClick={() => handleTimestampClick(example.timestamp)}
                                          className="text-xs text-blue-600 hover:text-blue-800 underline cursor-pointer transition-colors"
                                          title="Click to jump to this moment in the video"
                                        >
                                          {example.timestamp}
                                        </button>
                                      </div>
                                      <blockquote className="text-sm italic mb-2 pl-3 border-l-2 border-gray-300 dark:border-gray-600">
                                        "{example.quote}"
                                      </blockquote>
                                      <div className="text-xs space-y-1">
                                        <div><span className="font-medium text-red-600">Issue:</span> {example.issue}</div>
                                        <div><span className="font-medium text-green-600">Better approach:</span> {example.better_approach}</div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
