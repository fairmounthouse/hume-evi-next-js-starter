"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, FileText, Download, User } from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { cn } from "@/utils";
import { useRecordingAnchor } from "@/hooks/useRecordingAnchor";

interface TranscriptEntry {
  id: string;
  speaker: "user" | "assistant";
  text: string;
  timestamp: number;
  emotions?: any;
  confidence?: number;
  isInterim?: boolean; // NEW: Flag for interim messages
}

interface TranscriptDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transcript: TranscriptEntry[];
  className?: string;
  // Optional content shown under a "Hints" tab (e.g., live feedback)
  hintsContent?: React.ReactNode;
  // Video seeking callback
  onSeekVideo?: (timestamp: number) => void;
}

export default function TranscriptDrawer({ 
  isOpen, 
  onClose, 
  transcript,
  className = "",
  hintsContent,
  onSeekVideo,
}: TranscriptDrawerProps) {
  const { formatRelativeTime } = useRecordingAnchor();
  // Close drawer when clicking backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  const formatTimestamp = (timestamp: number) => {
    // timestamp is now relative seconds from recording start
    return formatRelativeTime(timestamp);
  };

  const downloadTranscript = () => {
    console.log("📥 [DRAWER] Downloading transcript with", transcript.length, "entries");
    
    // Enhanced transcript formatting with metadata preservation
    const transcriptText = transcript.map((entry, index) => {
      const timeStr = formatTimestamp(entry.timestamp);
      const speaker = entry.speaker === 'user' ? 'Interviewee' : 'AI Interviewer';
      
      // Include emotions and confidence if available
      let metadata = "";
      if (entry.emotions && Object.keys(entry.emotions).length > 0) {
        const topEmotions = Object.entries(entry.emotions)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 2)
          .map(([emotion, score]) => `${emotion}:${(score as number).toFixed(2)}`)
          .join(", ");
        metadata += ` [Emotions: ${topEmotions}]`;
      }
      if (entry.confidence) {
        metadata += ` [Confidence: ${entry.confidence.toFixed(2)}]`;
      }
      
      return `[${timeStr}] ${speaker}: ${entry.text}${metadata}`;
    }).join('\n');
    
    // Add header with metadata
    const header = `Interview Transcript
Generated: ${new Date().toISOString()}
Total Entries: ${transcript.length}
User Messages: ${transcript.filter(e => e.speaker === 'user').length}
Assistant Messages: ${transcript.filter(e => e.speaker === 'assistant').length}
Duration: ${transcript.length > 0 ? formatRelativeTime(transcript[transcript.length - 1]?.timestamp || 0) : "00:00"} (${transcript.length > 0 ? Math.floor(transcript[transcript.length - 1]?.timestamp || 0) : 0} seconds)

--- TRANSCRIPT ---

`;
    
    const fullContent = header + transcriptText;
    
    const blob = new Blob([fullContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-transcript-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log("✅ [DRAWER] Transcript download completed");
  };

  const downloadJSON = () => {
    console.log("📥 [DRAWER] Downloading JSON transcript with", transcript.length, "entries");
    
    // Enhanced JSON format with comprehensive metadata - aligned with TXT format
    const jsonData = {
      generated_at: new Date().toISOString(),
      session_metadata: {
        total_entries: transcript.length,
        user_messages: transcript.filter(e => e.speaker === 'user').length,
        assistant_messages: transcript.filter(e => e.speaker === 'assistant').length,
        duration: transcript.length > 0 ? formatRelativeTime(transcript[transcript.length - 1]?.timestamp || 0) : "00:00",
        has_emotions: transcript.some(e => e.emotions && Object.keys(e.emotions).length > 0),
        has_confidence: transcript.some(e => e.confidence),
        first_message_timestamp: transcript[0]?.timestamp,
        last_message_timestamp: transcript[transcript.length - 1]?.timestamp,
        timestamp_format: "relative_seconds_from_recording_start",
        preservation_mode: "COMPLETE_TRANSCRIPT_DRAWER"
      },
      entries: transcript.map(entry => ({
        id: entry.id,
        speaker: entry.speaker,
        text: entry.text,
        timestamp: formatTimestamp(entry.timestamp), // Use MM:SS format just like TXT
        emotions: entry.emotions,
        confidence: entry.confidence
      }))
    };
    
    const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `interview-transcript-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log("✅ [DRAWER] JSON transcript download completed");
  };

  const [activeTab, setActiveTab] = useState<"transcript" | "hints">("transcript");

  useEffect(() => {
    // Reset to transcript when opening
    if (isOpen) setActiveTab("transcript");
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            onClick={handleBackdropClick}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className={cn(
              "fixed top-0 right-0 h-full bg-white dark:bg-gray-900 shadow-2xl z-50 flex flex-col",
              "w-[520px] lg:w-[560px] md:w-[60vw] sm:w-[92vw]",
              className
            )}
            style={{ boxShadow: '-2px 0 8px rgba(0,0,0,0.15)' }}
          >
            {/* Header */}
            <div className="border-b border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Conversation Panel</h2>
              </div>
              <div className="flex items-center gap-2">
                {(!hintsContent || activeTab === "transcript") && (
                  <>
                    <Button variant="outline" size="sm" onClick={downloadTranscript}>
                      <Download className="w-4 h-4 mr-1" />
                      TXT
                    </Button>
                    <Button variant="outline" size="sm" onClick={downloadJSON}>
                      <Download className="w-4 h-4 mr-1" />
                      JSON
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Optional Tabs */}
            {hintsContent && (
              <div className="px-4 pt-3 border-b border-gray-200 dark:border-gray-700 flex gap-2">
                <button
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md",
                    activeTab === "transcript"
                      ? "bg-blue-600 text-white"
                      : "text-muted-foreground hover:bg-muted/40"
                  )}
                  onClick={() => setActiveTab("transcript")}
                >
                  Transcript
                </button>
                <button
                  className={cn(
                    "px-3 py-1.5 text-sm rounded-md",
                    activeTab === "hints"
                      ? "bg-blue-600 text-white"
                      : "text-muted-foreground hover:bg-muted/40"
                  )}
                  onClick={() => setActiveTab("hints")}
                >
                  Hints
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {hintsContent && activeTab === "hints" ? (
                <div className="space-y-3">
                  {hintsContent}
                </div>
              ) : (
                <>
                  {transcript.length === 0 ? (
                    <div className="text-center text-muted-foreground mt-8">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No transcript available yet.</p>
                      <p className="text-sm mt-2">Start an interview to see the conversation here.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {transcript.map((entry, index) => (
                        <motion.div
                          key={entry.id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={cn(
                            "p-3 rounded-lg border",
                            entry.speaker === "user" 
                              ? "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 ml-4"
                              : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 mr-4",
                            entry.isInterim && "opacity-75 border-dashed bg-gradient-to-r from-blue-50/50 to-transparent dark:from-blue-950/50"
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className={cn(
                              "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                              entry.speaker === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-gray-600 text-white"
                            )}>
                              {entry.speaker === "user" ? <User className="w-3 h-3" /> : "AI"}
                            </div>
                            <span className={cn(
                              "text-sm font-medium",
                              entry.speaker === "user" 
                                ? "text-blue-700 dark:text-blue-300"
                                : "text-gray-700 dark:text-gray-300"
                            )}>
                              {entry.speaker === "user" ? "Interviewee" : "AI Interviewer"}
                              {entry.isInterim && " (speaking...)"}
                            </span>
                            <span 
                              className={cn(
                                "text-xs text-muted-foreground ml-auto",
                                onSeekVideo && !entry.isInterim && "cursor-pointer hover:text-blue-600 hover:underline"
                              )}
                              onClick={onSeekVideo && !entry.isInterim ? () => {
                                const originalTimestamp = entry.timestamp;
                                const isFirstMessage = originalTimestamp === 0;
                                const isUserMessage = entry.speaker === 'user';
                                
                                // Apply speaker-based buffer logic
                                let bufferedTimestamp;
                                let bufferMessage;
                                
                                if (isFirstMessage) {
                                  bufferedTimestamp = originalTimestamp; // No buffer for first message
                                  bufferMessage = 'no buffer (first message)';
                                } else if (isUserMessage) {
                                  bufferedTimestamp = Math.max(0, originalTimestamp - 1); // Go back 1s for user context
                                  bufferMessage = '-1s buffer (user message)';
                                } else {
                                  bufferedTimestamp = originalTimestamp + 2; // Go forward 2s for AI messages
                                  bufferMessage = '+2s buffer (AI message)';
                                }
                                
                                console.log("🎯 [TRANSCRIPT CLICK] Seeking video:", {originalTimestamp, bufferedTimestamp, bufferMessage, speaker: entry.speaker});
                                onSeekVideo(bufferedTimestamp);
                              } : undefined}
                              title={onSeekVideo && !entry.isInterim ? "Click to jump to this moment in video" : undefined}
                            >
                              {formatTimestamp(entry.timestamp)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                            {entry.text}
                            {entry.isInterim && <span className="ml-1 text-blue-500 font-mono">●</span>}
                          </p>
                          
                          {entry.confidence && (
                            <div className="mt-2">
                              <Badge variant="outline" className="text-xs">
                                {Math.round(entry.confidence * 100)}% confidence
                              </Badge>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
