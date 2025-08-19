"use client";

import { VoiceProvider, useVoice } from "@humeai/voice-react";
import Messages from "./Messages";
import Controls from "./Controls";
import StartCall from "./StartCall";
import VideoInput, { VideoInputRef } from "./VideoInput";
import RecordingControls from "./RecordingControls";
import VideoTranscriptPlayer from "./VideoTranscriptPlayer";
import { ComponentRef, useRef, useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { AssistantAudioBus } from "@/utils/assistantAudio";
import { Button } from "./ui/button";
import { Toggle } from "./ui/toggle";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { GraduationCap, FileText, Download, User } from "lucide-react";
import { cn } from "@/utils";
import { useSearchParams } from "next/navigation";
import TranscriptEvaluator from "@/utils/transcriptEvaluator";
import FeedbackDisplay, { FeedbackDisplayRef } from "./FeedbackDisplay";
import FinalEvaluationReport from "./FinalEvaluationReport";

// Chat interface component with voice interaction capabilities
function ChatInterface({
  sessionId,
  isCallActive,
  setIsCallActive,
  shouldAutoRecord,
  setShouldAutoRecord,
  forceShowRecording,
  setForceShowRecording,
  videoStreamReady,
  setVideoStreamReady,
  showVideoReview,
  setShowVideoReview,
  finalVideoUrl,
  setFinalVideoUrl,
  transcript,
  setTranscript,
  handleVideoReady,
  videoRef,
  audioCtx,
  assistantBus,
  timeout,
  messagesRef,
  showEndScreen,
  setShowEndScreen,
}: any) {
  const { messages, sendSessionSettings, status } = useVoice();
  const [coachingMode, setCoachingMode] = useState(false);
  const [isUpdatingCoaching, setIsUpdatingCoaching] = useState(false);
  const [transcriptEvaluator] = useState(() => new TranscriptEvaluator());
  const [showFinalReport, setShowFinalReport] = useState(false);
  const [finalEvaluation, setFinalEvaluation] = useState<any>(null);
  const [isGeneratingFinalReport, setIsGeneratingFinalReport] = useState(false);
  const [evaluationCache, setEvaluationCache] = useState<Map<string, any>>(new Map());
  const feedbackDisplayRef = useRef<FeedbackDisplayRef>(null);
  const [storedTranscript, setStoredTranscript] = useState<any[]>([]);
  const currentMessagesRef = useRef<any[]>([]);

  // Build transcript from messages for evaluation
  const buildTranscriptFromMessages = (messages: any[]): any[] => {
    // Filter for actual conversation messages with content
    const conversationMessages = messages.filter(msg => {
      const hasContent = msg.message?.content && msg.message.content.trim().length > 0;
      const isConversation = msg.type === "user_message" || msg.type === "assistant_message";
      
      if (isConversation && hasContent) {
        console.log("✅ [CHAT] Valid message:", msg.type, msg.message.content.substring(0, 50) + "...");
      }
      
      return isConversation && hasContent;
    });
    
    const transcript = conversationMessages.map((msg, index) => ({
      id: `msg-${index}`,
      speaker: msg.type === "user_message" ? "user" : "assistant",
      text: msg.message?.content || "",
      timestamp: Math.floor((msg.receivedAt?.getTime() || Date.now()) / 1000),
      emotions: msg.models?.prosody?.scores || undefined,
      confidence: msg.models?.language?.confidence || undefined,
    }));
    
    console.log("📋 [CHAT] Built transcript from", messages.length, "total messages,", conversationMessages.length, "conversation messages,", transcript.length, "entries");
    
    if (transcript.length > 0) {
      console.log("📋 [CHAT] Sample transcript entry:", transcript[0]);
    }
    
    return transcript;
  };

  // Load initial coaching mode state
  useEffect(() => {
    const loadCoachingMode = async () => {
      try {
        const { supabase } = await import("@/utils/supabase-client");
        const { data, error } = await supabase
          .from("interview_sessions")
          .select("coach_mode_enabled")
          .eq("session_id", sessionId)
          .single();

        if (!error && data) {
          setCoachingMode(data.coach_mode_enabled || false);
        }
      } catch (error) {
        console.error("Failed to load coaching mode:", error);
      }
    };

    if (sessionId && isCallActive) {
      loadCoachingMode();
    }
  }, [sessionId, isCallActive]);

  // Update stored transcript whenever messages change
  useEffect(() => {
    // Always update the ref with current messages
    currentMessagesRef.current = messages;
    
    if (isCallActive && messages.length > 0) {
      const newTranscript = buildTranscriptFromMessages(messages);
      setStoredTranscript(newTranscript);
      console.log("💾 [CHAT] Updated stored transcript:", newTranscript.length, "entries");
    }
  }, [messages, isCallActive]);

  // Setup transcript evaluation when call starts (only once per call)
  useEffect(() => {
    if (isCallActive && transcriptEvaluator) {
      // Start the timer animation
      feedbackDisplayRef.current?.startTimer();
      
      // Setup evaluation callback
      transcriptEvaluator.onEvaluation((feedback) => {
        feedbackDisplayRef.current?.updateFeedback(feedback);
      });

      // Start periodic evaluation - use a ref to get latest transcript
      transcriptEvaluator.startPeriodicEvaluation(() => {
        const currentMessages = currentMessagesRef.current;
        const currentTranscript = buildTranscriptFromMessages(currentMessages);
        console.log("📋 [CHAT] Evaluator requesting transcript, current messages:", currentMessages.length, "entries:", currentTranscript.length);
        return currentTranscript;
      });

      return () => {
        feedbackDisplayRef.current?.stopTimer();
        transcriptEvaluator.stopPeriodicEvaluation();
      };
    } else {
      // Stop timer when call is not active
      feedbackDisplayRef.current?.stopTimer();
    }
  }, [isCallActive, transcriptEvaluator]); // Removed storedTranscript dependency

  // Listen for voice status changes to detect when call ends
  const [hasBeenConnected, setHasBeenConnected] = useState(false);
  
  useEffect(() => {
    // Track if we've ever been connected
    if (status.value === "connected") {
      setHasBeenConnected(true);
    }
    
    // Only trigger end interview if we were previously connected and now disconnected
    if (status.value === "disconnected" && isCallActive && hasBeenConnected) {
      console.log("🔚 Call disconnected after being connected, triggering end interview");
      console.log("🔚 Current stored transcript:", storedTranscript.length, "entries");
      console.log("🔚 Current messages:", messages.length, "messages");
      console.log("🔚 Current messagesRef:", currentMessagesRef.current.length, "messages");
      
      // Immediately preserve transcript data before anything gets cleared
      const preservedTranscript = storedTranscript.length > 0 
        ? storedTranscript 
        : currentMessagesRef.current.length > 0 
          ? buildTranscriptFromMessages(currentMessagesRef.current)
          : buildTranscriptFromMessages(messages);
      
      console.log("🔚 Preserved transcript:", preservedTranscript.length, "entries");
      
      // Use a slight delay to ensure all state is preserved, but pass the preserved data
      setTimeout(() => {
        handleEndInterviewWithData(preservedTranscript);
        setHasBeenConnected(false); // Reset for next interview
      }, 100);
    }
  }, [status.value, isCallActive, storedTranscript, hasBeenConnected]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transcriptEvaluator) {
        transcriptEvaluator.destroy();
      }
    };
  }, [transcriptEvaluator]);

  const handleCoachingToggle = async (enabled: boolean) => {
    if (isUpdatingCoaching) return;
    
    setIsUpdatingCoaching(true);
    
    try {
      // Update database
      const { supabase } = await import("@/utils/supabase-client");
      const { error } = await supabase
        .from("interview_sessions")
        .update({ coach_mode_enabled: enabled })
        .eq("session_id", sessionId);
      
      if (error) {
        toast.error("Failed to update coaching mode");
        return;
      }

      // Update local state
      setCoachingMode(enabled);
      
      // Send updated session settings to Hume immediately
      if (status.value === "connected") {
        const { buildSessionSettings } = await import("@/utils/session-context");
        const sessionSettings = await buildSessionSettings(
          sessionId,
          0, // elapsed time will be calculated properly
          "active", // current phase
          undefined, // no temporary context
          enabled // pass the new coaching mode
        );
        
        await sendSessionSettings(sessionSettings as any);
        console.log("✅ Coaching mode updated in real-time");
      }
      
      toast.success(enabled ? "Coaching mode enabled! 🎓" : "Coaching mode disabled");
    } catch (error) {
      console.error("Error updating coaching mode:", error);
      toast.error("Failed to update coaching mode");
    } finally {
      setIsUpdatingCoaching(false);
    }
  };

  const handleEndInterviewWithData = async (preservedTranscript: any[]) => {
    try {
      console.log("📋 [END] Using preserved transcript data:", preservedTranscript.length, "entries");
      setTranscript(preservedTranscript);
      setStoredTranscript(preservedTranscript); // Update stored transcript too

      // Stop transcript evaluation
      transcriptEvaluator.stopPeriodicEvaluation();

      // Save final session data to Supabase (only if we have data)
      if (preservedTranscript.length > 0) {
        try {
          const { upsertInterviewSession, uploadTranscriptToStorage } = await import("@/utils/supabase-client");
          
          // Upload transcript to Supabase Storage
          const transcriptPath = await uploadTranscriptToStorage(sessionId, preservedTranscript);
          
          // Save session metadata to database
          const sessionStartTime = preservedTranscript[0]?.timestamp 
            ? new Date(preservedTranscript[0].timestamp * 1000).toISOString()
            : new Date().toISOString();
          
          await upsertInterviewSession({
            session_id: sessionId,
            started_at: sessionStartTime, // Required field - use first message timestamp or current time
            status: "completed",
            ended_at: new Date().toISOString(),
            duration_seconds: Math.floor((Date.now() - (preservedTranscript[0]?.timestamp * 1000 || Date.now())) / 1000),
            ...(transcriptPath ? { transcript_path: transcriptPath } : {}), // Only include when present
            transcript_data: "", // Required field - we store actual transcript in storage
          });
          console.log("✅ [END] Session data and transcript saved to Supabase");
        } catch (supabaseError) {
          console.error("⚠️ [END] Supabase save failed (non-critical):", supabaseError);
        }
      }

      // End the call and show end screen
      console.log("🔚 [END] Setting states: isCallActive=false, forceShowRecording=false, showEndScreen=true");
      console.log("🔚 [END] Current finalVideoUrl:", finalVideoUrl);
      setIsCallActive(false);
      setForceShowRecording(false);
      setShowEndScreen(true);
      
      // Automatically generate detailed analysis (with caching)
      if (preservedTranscript.length > 0) {
        const transcriptHash = JSON.stringify(preservedTranscript.map(t => ({ speaker: t.speaker, text: t.text })));
        const cachedEvaluation = evaluationCache.get(transcriptHash);
        
        if (cachedEvaluation) {
          console.log("🔚 [END] Using cached detailed analysis");
          setFinalEvaluation(cachedEvaluation);
          setShowFinalReport(true);
        } else {
          console.log("🔚 [END] Auto-generating detailed analysis...");
          setIsGeneratingFinalReport(true);
          try {
            const transcriptData = preservedTranscript.length > 0 ? preservedTranscript : buildTranscriptFromMessages(messages);
            const evaluation = await transcriptEvaluator.getDetailedEvaluation(transcriptData);
            
            // Cache the evaluation
            const newCache = new Map(evaluationCache);
            newCache.set(transcriptHash, evaluation);
            setEvaluationCache(newCache);
            
            setFinalEvaluation(evaluation);
            setShowFinalReport(true);
            console.log("✅ [END] Auto-generated detailed analysis complete and cached");
          } catch (error) {
            console.error("Error auto-generating final report:", error);
            toast.error("Failed to generate detailed analysis");
          } finally {
            setIsGeneratingFinalReport(false);
          }
        }
      }
      
      toast.success("Interview ended! Review your session below.");
    } catch (error) {
      console.error("Error ending interview:", error);
      toast.error("Error ending interview");
    }
  };

  const handleEndInterview = async () => {
    // This is the fallback version - try to get current data
    const transcriptData = storedTranscript.length > 0 
      ? storedTranscript 
      : currentMessagesRef.current.length > 0 
        ? buildTranscriptFromMessages(currentMessagesRef.current)
        : buildTranscriptFromMessages(messages);
    
    await handleEndInterviewWithData(transcriptData);
  };

  const downloadTranscript = async (format: 'txt' | 'json' = 'txt') => {
    try {
      const { getTranscriptDownloadUrl } = await import("@/utils/supabase-client");
      
      // Try to get from Supabase Storage first
      const downloadUrl = await getTranscriptDownloadUrl(sessionId, format);
      
      if (downloadUrl) {
        // Download from Supabase Storage
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `interview-transcript-${sessionId}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        toast.success("Transcript downloaded from cloud storage!");
      } else {
        // Fallback to local download
        const transcriptData = storedTranscript.length > 0 ? storedTranscript : buildTranscriptFromMessages(messages);
        
        if (format === 'json') {
          const jsonData = {
            session_id: sessionId,
            created_at: new Date().toISOString(),
            entries: transcriptData,
            metadata: {
              total_entries: transcriptData.length,
              duration_seconds: transcriptData.length > 0 
                ? Math.floor((Date.now() - (transcriptData[0]?.timestamp * 1000 || Date.now())) / 1000)
                : 0,
            }
          };
          const blob = new Blob([JSON.stringify(jsonData, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `interview-transcript-${sessionId}.json`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        } else {
          const transcriptText = transcriptData.map(entry => {
            const timeStr = new Date(entry.timestamp * 1000).toLocaleTimeString();
            const speaker = entry.speaker === "user" ? "Interviewee" : "AI Interviewer";
            return `[${timeStr}] ${speaker}: ${entry.text}`;
          }).join('\n');
          
          const blob = new Blob([transcriptText], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `interview-transcript-${sessionId}.txt`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        
        toast.success("Transcript downloaded locally!");
      }
    } catch (error) {
      console.error("Error downloading transcript:", error);
      toast.error("Failed to download transcript");
    }
  };



  const handleGenerateFinalReport = async () => {
    try {
      setIsGeneratingFinalReport(true);
      const transcriptData = storedTranscript.length > 0 ? storedTranscript : buildTranscriptFromMessages(messages);
      
      const evaluation = await transcriptEvaluator.getDetailedEvaluation(transcriptData);
      setFinalEvaluation(evaluation);
      setShowFinalReport(true);
    } catch (error) {
      console.error("Error generating final report:", error);
      toast.error("Failed to generate final report");
    } finally {
      setIsGeneratingFinalReport(false);
    }
  };

  return (
    <>
      {showEndScreen ? (
        <div className="grow flex flex-col overflow-hidden p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Interview Complete</h2>
            <div className="flex gap-2">
              <div className="flex gap-1">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadTranscript('txt')}
                  disabled={storedTranscript.length === 0}
                >
                  <Download className="w-4 h-4 mr-1" />
                  TXT
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => downloadTranscript('json')}
                  disabled={storedTranscript.length === 0}
                >
                  <Download className="w-4 h-4 mr-1" />
                  JSON
                </Button>
              </div>
              <Button 
                variant="outline" 
                onClick={handleGenerateFinalReport}
                disabled={isGeneratingFinalReport}
              >
                <FileText className="w-4 h-4 mr-1" />
                {isGeneratingFinalReport ? "Generating..." : "Detailed Report"}
              </Button>
              {finalVideoUrl && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowEndScreen(false);
                    setShowVideoReview(true);
                  }}
                >
                  View Recording
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => {
                  // Navigate to setup page for new interview
                  window.location.href = "/interview/setup";
                }}
              >
                Start New Interview
              </Button>
            </div>
          </div>
          
          <div className="grow grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Preview */}
            <Card className="p-6 flex flex-col">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>🎥</span>
                Interview Recording
              </h3>
              <div className="flex-grow flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                {finalVideoUrl ? (
                  <div className="w-full">
                    {/* Use Cloudflare Stream iframe for proper playback */}
                    <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
                      <iframe
                        src={finalVideoUrl.replace('/watch', '/iframe')}
                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                        style={{ border: 'none' }}
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                        allowFullScreen
                        title="Interview Recording"
                      />
                    </div>
                    <div className="mt-3 space-y-2">
                      <Button 
                        className="w-full" 
                        onClick={() => {
                          setShowEndScreen(false);
                          setShowVideoReview(true);
                        }}
                      >
                        View Full Video
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-sm text-muted-foreground">Processing video...</p>
                  </div>
                )}
              </div>
            </Card>

            {/* Session Summary */}
            <Card className="p-6 flex flex-col">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Session Summary
              </h3>
              <div className="space-y-3 flex-grow">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Duration:</span>
                  <span className="text-sm font-medium">
                    {Math.floor((Date.now() - (storedTranscript[0]?.timestamp * 1000 || Date.now())) / 60000)} minutes
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Messages:</span>
                  <span className="text-sm font-medium">{storedTranscript.length} exchanges</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Recording:</span>
                  <span className="text-sm font-medium">{finalVideoUrl ? "✅ Available" : "⏳ Processing"}</span>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="mt-6 space-y-2">
                {isGeneratingFinalReport && (
                  <div className="w-full p-3 bg-blue-50 dark:bg-blue-950 rounded-lg text-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Generating detailed analysis...</p>
                  </div>
                )}
                <div className="flex gap-1">
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => downloadTranscript('txt')}
                    disabled={storedTranscript.length === 0}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    TXT
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1" 
                    onClick={() => downloadTranscript('json')}
                    disabled={storedTranscript.length === 0}
                  >
                    <Download className="w-4 h-4 mr-1" />
                    JSON
                  </Button>
                </div>
              </div>
            </Card>
            
            {/* Transcript Preview */}
            <Card className="p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Transcript Preview</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowEndScreen(false);
                    setShowVideoReview(true);
                  }}
                  disabled={!finalVideoUrl}
                >
                  View Full Video
                </Button>
              </div>
              <div className="flex-grow bg-gray-50 dark:bg-gray-800 rounded-lg p-4 overflow-y-auto max-h-[400px]">
                {storedTranscript.length > 0 ? (
                  <div className="space-y-3">
                    {storedTranscript.slice(-5).map((entry, index) => (
                      <div 
                        key={index} 
                        className={cn(
                          "text-sm p-3 rounded-lg transition-all",
                          finalVideoUrl 
                            ? "cursor-pointer hover:bg-white dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600" 
                            : "cursor-default"
                        )}
                        onClick={() => {
                          if (finalVideoUrl) {
                            // Store the timestamp to jump to
                            sessionStorage.setItem('jumpToTimestamp', entry.timestamp.toString());
                            setShowEndScreen(false);
                            setShowVideoReview(true);
                          }
                        }}
                        title={finalVideoUrl ? `Click to jump to ${new Date(entry.timestamp * 1000).toLocaleTimeString()} in video` : undefined}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={entry.speaker === "user" ? "default" : "secondary"} className="text-xs">
                            {entry.speaker === "user" ? "Interviewee" : "AI Interviewer"}
                          </Badge>
                          <span className="text-xs text-muted-foreground font-mono">
                            {new Date(entry.timestamp * 1000).toLocaleTimeString()}
                          </span>
                          {finalVideoUrl && (
                            <span className="text-xs text-blue-500">
                              📹 Click to jump
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground pl-2 border-l-2 border-gray-200 dark:border-gray-600">
                          {entry.text}
                        </p>
                      </div>
                    ))}
                    {storedTranscript.length > 5 && (
                      <div className="text-center pt-3 border-t border-gray-200 dark:border-gray-600">
                        <p className="text-xs text-muted-foreground mb-2">
                          ... and {storedTranscript.length - 5} more exchanges
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowEndScreen(false);
                            setShowVideoReview(true);
                          }}
                          disabled={!finalVideoUrl}
                        >
                          View Complete Transcript
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center">No transcript data available</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      ) : showVideoReview && finalVideoUrl ? (
        <div className="grow flex flex-col overflow-hidden p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Interview Recording</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowVideoReview(false);
                  setShowEndScreen(true);
                }}
              >
                Back to Summary
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowVideoReview(false);
                  setShowEndScreen(false);
                  setFinalVideoUrl(null);
                  setTranscript([]);
                  setStoredTranscript([]);
                }}
              >
                Start New Interview
              </Button>
            </div>
          </div>
          <VideoTranscriptPlayer
            videoUrl={finalVideoUrl}
            transcript={transcript}
            className="grow"
          />
        </div>
      ) : (
        <div className="grow flex flex-col md:flex-row gap-4 h-full min-h-0">
          <div className="grow flex flex-col min-h-0 h-full">
            <div className="grow overflow-y-auto min-h-0">
              <Messages ref={messagesRef} />
            </div>
            
            {/* Bottom Controls */}
            <div className="flex-shrink-0 flex gap-2 items-center p-4 border-t bg-white dark:bg-gray-900">
              <Controls />
              {isCallActive && storedTranscript.length > 0 && (
                <div className="ml-auto flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadTranscript('txt')}
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    TXT
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadTranscript('json')}
                    className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    JSON
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Minimal Recording Indicator */}
          {(isCallActive || forceShowRecording) && (
            <div className="fixed top-4 left-4 z-40 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium shadow-lg">
              🔴 REC
            </div>
          )}
          
          {/* Hidden Recording Controls - positioned off-screen but functional */}
          {(isCallActive || forceShowRecording) && (
            <div className="fixed -top-96 left-0 opacity-0 pointer-events-none">
              <RecordingControls
                videoStream={videoRef.current?.getStream() || null}
                audioCtx={audioCtx}
                audioStream={assistantBus.getStream()}
                isCallActive={isCallActive || forceShowRecording}
                autoStart={shouldAutoRecord}
                onRecordingComplete={async (videoId) => {
                  console.log("Recording complete, video ID:", videoId);
                  toast.success(`Recording saved! ID: ${videoId}`);
                  
                  // Check video status after a short delay
                  setTimeout(async () => {
                    try {
                      const response = await fetch(`/api/recording/video/${videoId}`);
                      const videoDetails = await response.json();
                      console.log("Video details from Cloudflare:", videoDetails);
                      
                      if (videoDetails.ready) {
                        toast.success("Video is ready to stream!");
                        console.log("Video playback URL:", videoDetails.playbackUrl);
                        handleVideoReady(videoId, videoDetails.playbackUrl);
                      } else {
                        toast.info("Video is processing...");
                        // Set a temporary URL so the button shows up
                        setFinalVideoUrl(`https://customer-sm0204x4lu04ck3x.cloudflarestream.com/${videoId}/watch`);
                        console.log("Video still processing, set temporary URL");
                        // Poll for video readiness
                        setTimeout(async () => {
                          try {
                            const retryResponse = await fetch(`/api/recording/video/${videoId}`);
                            const retryDetails = await retryResponse.json();
                            if (retryDetails.ready && retryDetails.playbackUrl) {
                              handleVideoReady(videoId, retryDetails.playbackUrl);
                            }
                          } catch (error) {
                            console.error("Failed to retry video details:", error);
                          }
                        }, 10000); // Check again after 10 seconds
                      }
                    } catch (error) {
                      console.error("Failed to fetch video details:", error);
                    }
                  }, 5000); // Check after 5 seconds
                }}
              />
            </div>
          )}
          
          <div className="w-full md:w-80 flex-shrink-0 p-4 pt-16 space-y-4 flex flex-col max-h-full overflow-hidden">
              {/* Video Input */}
              <div className="flex-shrink-0">
              <VideoInput ref={videoRef} autoStart={isCallActive} />
              </div>
            
              {/* Simple Coaching Toggle - Only show during active call */}
              {isCallActive && (
                <div className="flex-shrink-0 space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <span className={cn(
                      "font-medium transition-colors",
                      coachingMode ? "text-blue-600 dark:text-blue-400" : "text-muted-foreground"
                    )}>
                      Coaching
                    </span>
                    <Toggle
                      size="sm"
                      pressed={coachingMode}
                      disabled={isUpdatingCoaching}
                      onPressedChange={handleCoachingToggle}
                      className={cn(
                        "h-6 w-11 p-0 transition-all duration-200",
                        coachingMode 
                          ? "bg-blue-500 hover:bg-blue-600 data-[state=on]:bg-blue-500" 
                          : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                      )}
                    >
                      <GraduationCap className={cn(
                        "h-3 w-3 transition-colors",
                        coachingMode ? "text-white" : "text-gray-500 dark:text-gray-400"
                      )} />
                    </Toggle>
                    <span className={cn(
                      "text-xs font-medium transition-colors",
                      coachingMode 
                        ? "text-blue-600 dark:text-blue-400" 
                        : "text-muted-foreground"
                    )}>
                      {coachingMode ? "ON" : "OFF"}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Live Feedback Display - Integrated into sidebar */}
              <div className="flex-shrink-0">
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${isCallActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  Live Feedback
                </div>
                <FeedbackDisplay ref={feedbackDisplayRef} />
              </div>
          </div>
        </div>
      )}
      
      {/* Final Evaluation Report */}
      <FinalEvaluationReport
        evaluation={finalEvaluation}
        isLoading={isGeneratingFinalReport}
        onClose={() => {
          setShowFinalReport(false);
          setFinalEvaluation(null);
        }}
      />
    </>
  );
}

export default function ClientComponent({
  accessToken,
}: {
  accessToken: string;
}) {
  const searchParams = useSearchParams();
  const timeout = useRef<number | null>(null);
  const ref = useRef<ComponentRef<typeof Messages> | null>(null);
  const videoRef = useRef<VideoInputRef | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [shouldAutoRecord, setShouldAutoRecord] = useState(true);
  const [forceShowRecording, setForceShowRecording] = useState(false);
  const [videoStreamReady, setVideoStreamReady] = useState(false);
  const [showVideoReview, setShowVideoReview] = useState(false);
  const [finalVideoUrl, setFinalVideoUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<any[]>([]);
  const [showEndScreen, setShowEndScreen] = useState(false);
  
  // Get interview configuration from URL params
  const selectedCaseId = searchParams.get('caseId');
  const selectedInterviewerId = searchParams.get('interviewerId');
  const selectedDifficultyId = searchParams.get('difficultyId');
  
  // Create ONE AudioContext for the entire chat session
  const audioCtx = useMemo(() => new (window.AudioContext || (window as any).webkitAudioContext)(), []);
  // AssistantAudioBus re-uses the shared AudioContext so its stream is recordable
  const [assistantBus] = useState(() => new AssistantAudioBus(audioCtx));

  // optional: use configId from environment variable
  const configId = process.env['NEXT_PUBLIC_HUME_CONFIG_ID'];
  
  // Monitor video stream availability
  useEffect(() => {
    const checkVideoStream = () => {
      const stream = videoRef.current?.getStream();
      const hasVideoTracks = stream ? stream.getVideoTracks().length > 0 : false;
      const isReady = !!stream && hasVideoTracks;
      
      if (isReady !== videoStreamReady) {
        console.log("📹 Video stream status changed:", {
          hasStream: !!stream,
          videoTracks: stream?.getVideoTracks().length || 0,
          audioTracks: stream?.getAudioTracks().length || 0,
          isReady,
        });
        setVideoStreamReady(isReady);
      }
    };
    
    // Check frequently
    const interval = setInterval(checkVideoStream, 250);
    checkVideoStream(); // Check immediately
    
    return () => clearInterval(interval);
  }, [videoStreamReady]);

  useEffect(() => {
    return () => {
      try {
        assistantBus.close();
      } catch (error) {
        console.log("AudioContext already closed");
      }
    };
  }, [assistantBus]);
  
  // Get sessionId from URL params or generate one as fallback
  const [sessionId] = useState(() => {
    const urlSessionId = searchParams.get('sessionId');
    return urlSessionId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  });

  // store playbackUrl when ready
  const handleVideoReady = async (videoId: string, playbackUrl?: string) => {
    if (!playbackUrl) return;
    try {
      // persist to session_media table (proper structure)
      const { supabase } = await import("@/utils/supabase-client");
      await supabase
        .from("session_media")
        .upsert({
          session_id: sessionId,
          media_type: "video",
          file_url: playbackUrl,
          upload_status: "completed",
        }, {
          onConflict: 'session_id,media_type'
        });
      
      setFinalVideoUrl(playbackUrl);
      console.log("✅ [VIDEO] Video URL saved to session_media");
    } catch (e) {
      console.error("Failed saving video url", e);
    }
  };

  return (
    <div
      className={
        "relative grow flex flex-col mx-auto w-full h-screen overflow-hidden"
      }
    >
      <VoiceProvider
        onMessage={() => {
          if (timeout.current) {
            window.clearTimeout(timeout.current);
          }

          timeout.current = window.setTimeout(() => {
            if (ref.current) {
              const scrollHeight = ref.current.scrollHeight;

              ref.current.scrollTo({
                top: scrollHeight,
                behavior: "smooth",
              });
            }
          }, 200);
        }}
        onError={(error) => {
          toast.error(error.message);
        }}
        onAudioReceived={async (msg: any) => {
          console.log("🔊 Audio received from Hume:", {
            type: msg?.type,
            hasData: !!msg?.data,
            dataLength: msg?.data?.length || 0
          });
          
          // Per docs: audio_output carries base64-encoded WAV in msg.data
          if (msg?.type === "audio_output" && typeof msg.data === "string" && msg.data.length > 0) {
            try {
              assistantBus.resume();
              await assistantBus.pushBase64Wav(msg.data);
              console.log("🔊 Pushed audio to AssistantAudioBus");
            } catch (error) {
              console.error("🔊 Error pushing audio to AssistantAudioBus:", error);
            }
          }
        }}
        onAudioStart={() => assistantBus.resume()}
        onAudioEnd={(clipId) => {
          console.log("🔇 Audio finished playing:", clipId);
        }}

      >
        <ChatInterface
          sessionId={sessionId}
          isCallActive={isCallActive}
          setIsCallActive={setIsCallActive}
          shouldAutoRecord={shouldAutoRecord}
          setShouldAutoRecord={setShouldAutoRecord}
          forceShowRecording={forceShowRecording}
          setForceShowRecording={setForceShowRecording}
          videoStreamReady={videoStreamReady}
          setVideoStreamReady={setVideoStreamReady}
          showVideoReview={showVideoReview}
          setShowVideoReview={setShowVideoReview}
          finalVideoUrl={finalVideoUrl}
          setFinalVideoUrl={setFinalVideoUrl}
          transcript={transcript}
          setTranscript={setTranscript}
          handleVideoReady={handleVideoReady}
          showEndScreen={showEndScreen}
          setShowEndScreen={setShowEndScreen}

          videoRef={videoRef}
          audioCtx={audioCtx}
          assistantBus={assistantBus}
          timeout={timeout}
          messagesRef={ref}
        />
        {!showEndScreen && (
          <StartCall 
            configId={configId} 
            accessToken={accessToken}
            sessionId={sessionId}
            selectedCaseId={selectedCaseId}
            selectedInterviewerId={selectedInterviewerId}
            selectedDifficultyId={selectedDifficultyId}
            onCallStart={() => {
              console.log("📱 onCallStart callback - starting camera AND recording panel");
              // Start camera immediately
              videoRef.current?.startVideo();
              // Force show recording panel
              setForceShowRecording(true);
              // Also try to set call active
              setIsCallActive(true);
            }}
          />
        )}
      </VoiceProvider>
    </div>
  );
}
