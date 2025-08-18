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
import { GraduationCap, FileText, Download } from "lucide-react";
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
}: any) {
  const { messages, sendSessionSettings, status } = useVoice();
  const [coachingMode, setCoachingMode] = useState(false);
  const [isUpdatingCoaching, setIsUpdatingCoaching] = useState(false);
  const [transcriptEvaluator] = useState(() => new TranscriptEvaluator());
  const [showFinalReport, setShowFinalReport] = useState(false);
  const [finalEvaluation, setFinalEvaluation] = useState<any>(null);
  const [isGeneratingFinalReport, setIsGeneratingFinalReport] = useState(false);
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

  const handleEndInterview = async () => {
    try {
      // Use stored transcript (more complete) or build from current messages
      const transcriptData = storedTranscript.length > 0 ? storedTranscript : buildTranscriptFromMessages(messages);
      setTranscript(transcriptData);

      // Stop transcript evaluation
      transcriptEvaluator.stopPeriodicEvaluation();

      // Save final session data to Supabase
      const { upsertInterviewSession } = await import("@/utils/supabase-client");
      await upsertInterviewSession({
        session_id: sessionId,
        evi_transcript_data: transcriptData,
        session_status: "completed",
        end_time: new Date().toISOString(),
      });

      // End the call and show video review
      setIsCallActive(false);
      setForceShowRecording(false);
      setShowVideoReview(true);
      
      toast.success("Interview ended! Review your session below.");
    } catch (error) {
      console.error("Error ending interview:", error);
      toast.error("Error ending interview");
    }
  };

  const downloadTranscript = () => {
    const transcriptData = storedTranscript.length > 0 ? storedTranscript : buildTranscriptFromMessages(messages);
    const transcriptText = transcriptData.map(entry => {
      const timeStr = new Date(entry.timestamp * 1000).toLocaleTimeString();
      const speaker = entry.speaker === "user" ? "Candidate" : "Interviewer";
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
    
    toast.success("Transcript downloaded!");
  };

  const testEvaluation = async () => {
    console.log("🧪 [TEST] Manual evaluation triggered");
    const currentTranscript = buildTranscriptFromMessages(messages);
    if (currentTranscript.length > 0) {
      feedbackDisplayRef.current?.updateFeedback({
        status: "good",
        feedback: "Test feedback - evaluation system is working!",
        confidence: 0.85,
        timestamp: Date.now()
      });
    } else {
      toast.error("No transcript data available for evaluation");
    }
  };

  const handleGenerateFinalReport = async () => {
    try {
      setIsGeneratingFinalReport(true);
      const transcriptData = buildTranscriptFromMessages(messages);
      
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
      {showVideoReview && finalVideoUrl ? (
        <div className="grow flex flex-col overflow-hidden p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Interview Review</h2>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleGenerateFinalReport}
                disabled={isGeneratingFinalReport}
              >
                <FileText className="w-4 h-4 mr-1" />
                {isGeneratingFinalReport ? "Generating..." : "Final Report"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowVideoReview(false);
                  setFinalVideoUrl(null);
                  setTranscript([]);
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
            <div className="flex-shrink-0 flex gap-2 items-center p-4 border-t">
              <Controls />
              {isCallActive && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadTranscript}
                    disabled={storedTranscript.length === 0}
                    className="ml-2"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={testEvaluation}
                    className="ml-2"
                  >
                    Test Feedback
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleEndInterview}
                    className="ml-2"
                  >
                    End Interview
                  </Button>
                </>
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
  
  // Get interview configuration from URL params
  const selectedCaseId = searchParams.get('case');
  const selectedInterviewerId = searchParams.get('interviewer');
  const selectedDifficultyId = searchParams.get('difficulty');
  
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
    return () => assistantBus.close();
  }, [assistantBus]);
  
  // Generate simple sessionId on mount (could be timestamp + random)
  const [sessionId] = useState(() => {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  });

  // store playbackUrl when ready
  const handleVideoReady = async (videoId: string, playbackUrl?: string) => {
    if (!playbackUrl) return;
    try {
      // persist to Supabase
      const { supabase } = await import("@/utils/supabase-client");
      await supabase
        .from("interview_sessions")
        .update({ final_video_url: playbackUrl })
        .eq("session_id", sessionId);
      
      setFinalVideoUrl(playbackUrl);
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

          videoRef={videoRef}
          audioCtx={audioCtx}
          assistantBus={assistantBus}
          timeout={timeout}
          messagesRef={ref}
        />
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
      </VoiceProvider>
    </div>
  );
}
