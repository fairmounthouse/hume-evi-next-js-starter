"use client";

import { useState, useRef, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Button } from "./ui/button";

interface TranscriptSegment {
  id: string;
  speaker: "user" | "assistant";
  text: string;
  timestamp: number; // in seconds
  emotions?: Record<string, number>;
  confidence?: number;
}

interface VideoTranscriptPlayerProps {
  videoUrl: string;
  transcript: TranscriptSegment[];
  className?: string;
}

export default function VideoTranscriptPlayer({
  videoUrl,
  transcript,
  className = "",
}: VideoTranscriptPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

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
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = timestamp;
    setCurrentTime(timestamp);
  };

  const formatTime = (seconds: number): string => {
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

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 h-full ${className}`}>
      {/* Video Player */}
      <div className="space-y-4">
        <div className="relative bg-black rounded-lg overflow-hidden">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full aspect-video"
            preload="metadata"
          />
          
          {/* Video Controls Overlay */}
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
              onClick={() => seekToTime(segment.timestamp)}
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
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 3)
                        .map(([emotion, score]) => (
                          <span
                            key={emotion}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full"
                          >
                            {emotion}: {Math.round(score * 100)}%
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
}
