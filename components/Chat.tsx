"use client";

import { VoiceProvider, useVoice } from "@humeai/voice-react";
import Messages from "./Messages";
import Controls from "./Controls";
import StartCall from "./StartCall";
import VideoInput, { VideoInputRef } from "./VideoInput";

import VideoReviewInterface from "./VideoReviewInterface";
import SessionSelector from "./SessionSelector";
import { ComponentRef, useRef, useState, useEffect, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { AssistantAudioBus } from "@/utils/assistantAudio";
import { Button } from "./ui/button";
import { Toggle } from "./ui/toggle";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { GraduationCap, FileText, Download, User, Maximize2, X, Eye, EyeOff } from "lucide-react";
import { cn } from "@/utils";
import { useSearchParams } from "next/navigation";
import TranscriptEvaluator from "@/utils/transcriptEvaluator";
import FeedbackDisplay, { FeedbackDisplayRef } from "./FeedbackDisplay";
import EnhancedDetailedAnalysis from "./EnhancedDetailedAnalysis";
import TranscriptDrawer from "./TranscriptDrawer";
import FloatingTranscriptButton from "./FloatingTranscriptButton";
import ExhibitModal from "./ExhibitModal";
import { ExhibitManager, ExhibitManagerState, initializeGlobalExhibitManager } from "@/utils/exhibit-manager";
import { useSmartScroll } from "@/hooks/useSmartScroll";

// Chat interface component with voice interaction capabilities
function ChatInterface({
  sessionId,
  urlSessionId,
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
  onToolCall,
  unlockedExhibits,
  primaryExhibit,
  expandedExhibit,
  onClosePrimaryExhibit,
  onShowExhibitFromSidebar,
  onExpandExhibit,
  onCloseModal,
}: any) {
  const { messages, sendSessionSettings, status, sendToolMessage } = useVoice();
  
  // Transcript scrolling refs and state
  const transcriptScrollRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  
  // Log status changes for debugging
  useEffect(() => {
    console.log("🔌 Hume connection status changed:", {
      status: status.value,
      timestamp: new Date().toISOString(),
      sessionId
    });
  }, [status.value, sessionId]);
  const [coachingMode, setCoachingMode] = useState(false);
  const [isUpdatingCoaching, setIsUpdatingCoaching] = useState(false);
  
  // Expose coaching mode globally for other components (local state only)
  useEffect(() => {
    (window as any).__getCurrentCoachingMode = () => coachingMode;
    
    return () => {
      delete (window as any).__getCurrentCoachingMode;
    };
  }, [coachingMode]);

  // Expose recording status globally for Nav component
  useEffect(() => {
    (window as any).__getRecordingStatus = () => isCallActive || forceShowRecording;
    
    return () => {
      delete (window as any).__getRecordingStatus;
    };
  }, [isCallActive, forceShowRecording]);
  const [transcriptEvaluator] = useState(() => new TranscriptEvaluator());

  const [finalEvaluation, setFinalEvaluation] = useState<any>(null);
  const [isGeneratingFinalReport, setIsGeneratingFinalReport] = useState(false);
  const [evaluationCache, setEvaluationCache] = useState<Map<string, any>>(new Map());
  const feedbackDisplayRef = useRef<FeedbackDisplayRef>(null);
  const [storedTranscript, setStoredTranscript] = useState<any[]>([]);
  const currentMessagesRef = useRef<any[]>([]);

  const [endScreenDataStored, setEndScreenDataStored] = useState(false);
  const [isVideoProcessing, setIsVideoProcessing] = useState(false);
  const [videoCheckInterval, setVideoCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [isTranscriptDrawerOpen, setIsTranscriptDrawerOpen] = useState(false);
  
  // Exhibit Manager state
  const [exhibitManagerState, setExhibitManagerState] = useState<ExhibitManagerState>({
    isActive: false,
    currentExhibit: null,
    currentZoom: 1,
    isTranscriptCollapsed: false,
    availableExhibits: []
  });
  const [exhibitManager, setExhibitManager] = useState<ExhibitManager | null>(null);

  // Function to load end screen data from cache
  const loadEndScreenFromCache = useCallback(async (targetSessionId: string) => {
    try {
      console.log(`🔄 Loading end screen data from cache for session: ${targetSessionId}`);
      const { getEndScreenData } = await import("@/utils/supabase-client");
      
      const cachedData = await getEndScreenData(targetSessionId);
      
      if (cachedData) {
        // Set all the state to rebuild the end screen
        setStoredTranscript(cachedData.transcript);
        setTranscript(cachedData.transcript);
        setFinalEvaluation(cachedData.finalEvaluation);
        setFinalVideoUrl(cachedData.videoUrl);
        setShowEndScreen(true);
        setShowVideoReview(false);
        setIsCallActive(false);
        setEndScreenDataStored(true);
        
        // Check if the cached video URL needs processing check
        const videoId = cachedData.videoUrl?.match(/cloudflarestream\.com\/([^\/]+)\/watch/)?.[1];
        if (videoId) {
          // Check if video is ready
          fetch(`/api/recording/video/${videoId}?_t=${Date.now()}`, { 
            cache: 'no-store',
            next: { 
              revalidate: 0,
              tags: [`video-${videoId}`] 
            } 
          })
            .then(res => res.json())
            .then(videoDetails => {
              // Video status is checked but no action needed here
            })
            .catch(err => console.error("Error checking cached video status:", err));
        }
        
        console.log(`✅ End screen rebuilt from cache for session: ${targetSessionId}`);
        toast.success(`Loaded interview session: ${targetSessionId}`);
        
        return true;
      } else {
        console.error(`❌ No cached data found for session: ${targetSessionId}`);
        toast.error(`No data found for session: ${targetSessionId}`);
        return false;
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
      toast.error('Failed to load session data');
      return false;
    }
  }, []);



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
    
    console.log("📨 Messages updated:", {
      messageCount: messages.length,
      isCallActive,
      messageTypes: messages.map(m => m.type),
      lastMessage: messages[messages.length - 1]?.type || "none"
    });
    
    if (isCallActive && messages.length > 0) {
      const newTranscript = buildTranscriptFromMessages(messages);
      setStoredTranscript(newTranscript);
      console.log("💾 Updated stored transcript:", {
        messagesProcessed: messages.length,
        transcriptEntries: newTranscript.length,
        isCallActive
      });
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
      
      // Immediately close exhibit when call ends
      if (exhibitManager) {
        exhibitManager.closeExhibit();
        console.log("🔚 Closed exhibit immediately on call end");
      }
      
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
  }, [status.value, isCallActive, storedTranscript, hasBeenConnected, exhibitManager]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (transcriptEvaluator) {
        transcriptEvaluator.destroy();
      }
    };
  }, [transcriptEvaluator]);

  // Store complete end screen data when all components are ready
  useEffect(() => {
    const storeCompleteEndScreenData = async () => {
      if (
        showEndScreen && 
        finalVideoUrl && 
        finalEvaluation && 
        storedTranscript.length > 0 && 
        !endScreenDataStored
      ) {
        try {
          console.log("💾 All end screen data ready, storing to Supabase...");
          const { storeEndScreenData } = await import("@/utils/supabase-client");
          
          const success = await storeEndScreenData(
            sessionId,
            storedTranscript,
            finalEvaluation,
            finalVideoUrl
          );
          
          if (success) {
            setEndScreenDataStored(true);
            toast.success("Session data cached for future access!");
          }
        } catch (error) {
          console.error("Error storing complete end screen data:", error);
        }
      }
    };

          storeCompleteEndScreenData();
    }, [showEndScreen, finalVideoUrl, finalEvaluation, storedTranscript, endScreenDataStored, sessionId]);

  // Poll for video readiness when we have a processing video
  useEffect(() => {
    if (finalVideoUrl && isVideoProcessing) {
      const videoId = finalVideoUrl.match(/cloudflarestream\.com\/([^\/]+)\/watch/)?.[1];
      if (!videoId) {
        setIsVideoProcessing(false);
        return;
      }

      console.log("🔄 Starting video readiness polling for:", videoId);
      
      const checkVideoReady = async () => {
        try {
          const response = await fetch(
            `/api/recording/video/${videoId}?_t=${Date.now()}`,
            { 
              cache: 'no-store',
              next: { 
                revalidate: 0,
                tags: [`video-${videoId}`] 
              } 
            }
          );
          const videoDetails = await response.json();
          
          // Check both readyToStream and state for more reliable detection
          if (videoDetails.ready && videoDetails.state === 'ready') {
            console.log("✅ Video is now ready!");
            setIsVideoProcessing(false);
            
            // Update with the proper playback URL
            if (videoDetails.playbackUrl) {
              setFinalVideoUrl(videoDetails.playbackUrl);
              
              // Also update in session_media
              try {
                const { supabase } = await import("@/utils/supabase-client");
                await supabase
                  .from("session_media")
                  .update({ file_url: videoDetails.playbackUrl })
                  .eq('session_id', sessionId)
                  .eq('media_type', 'video');
              } catch (e) {
                console.error("Failed to update video URL:", e);
              }
            }
            
            toast.success("Video processing complete! Ready to play.");
          } else if (videoDetails.state === 'error') {
            console.error("❌ Video processing failed:", videoDetails.errorReasonText || 'Unknown error');
            setIsVideoProcessing(false);
            toast.error(`Video processing failed: ${videoDetails.errorReasonText || 'Unknown error'}`);
          } else {
            console.log(`⏳ Video processing: ${videoDetails.state} (${videoDetails.pctComplete}% complete)`);
          }
        } catch (error) {
          console.error("Error checking video status:", error);
        }
      };

      // Check immediately
      checkVideoReady();
      
      // Then check every 3 seconds
      const interval = setInterval(checkVideoReady, 3000);
      setVideoCheckInterval(interval);
      
      // Cleanup on unmount or when processing is done
      return () => {
        if (interval) {
          clearInterval(interval);
          setVideoCheckInterval(null);
        }
      };
    } else {
      // Clear any existing interval when not processing
      if (videoCheckInterval) {
        clearInterval(videoCheckInterval);
        setVideoCheckInterval(null);
      }
    }
  }, [finalVideoUrl, isVideoProcessing, sessionId]); // Removed videoCheckInterval from deps to prevent re-runs
  
    // Add auto-generation of final report when interview ends
    useEffect(() => {
      const autoGenerateFinalReport = async () => {
        if (showEndScreen && storedTranscript.length > 0 && !finalEvaluation && !isGeneratingFinalReport) {
          console.log("🤖 Auto-generating final report...");
          try {
            setIsGeneratingFinalReport(true);
            const evaluation = await transcriptEvaluator.getDetailedEvaluation(storedTranscript);
            setFinalEvaluation(evaluation);
            toast.success("Analysis complete! Your session is fully cached.");
          } catch (error) {
            console.error("Error auto-generating final report:", error);
            toast.error("Failed to generate analysis - you can retry manually");
          } finally {
            setIsGeneratingFinalReport(false);
          }
        }
      };
  
      autoGenerateFinalReport();
    }, [showEndScreen, storedTranscript, finalEvaluation, isGeneratingFinalReport, transcriptEvaluator]);

  // Initialize Exhibit Manager - only during active interview, not on end screen
  useEffect(() => {
    if (showEndScreen) {
      // Clean up any existing exhibit manager when going to end screen
      const globalManager = (window as any).exhibitManager;
      if (globalManager) {
        globalManager.destroy();
        delete (window as any).exhibitManager;
      }
      return;
    }
    
    const manager = initializeGlobalExhibitManager((state: ExhibitManagerState) => {
      setExhibitManagerState(state);
    });
    setExhibitManager(manager);

    // Update available exhibits when unlocked exhibits change
    if (unlockedExhibits.length > 0) {
      manager.setExhibits(unlockedExhibits.map((exhibit: any) => ({
        id: exhibit.id,
        exhibit_name: exhibit.exhibit_name,
        display_name: exhibit.display_name || exhibit.exhibit_name,
        description: exhibit.description,
        image_url: exhibit.image_url,
        case_id: exhibit.case_id || '',
        unlocked_at: exhibit.unlocked_at,
        auto_displayed: exhibit.auto_displayed
      })));
    }

    return () => {
      manager.destroy();
    };
  }, [unlockedExhibits, showEndScreen]);

  // Auto-open exhibits when AI tool calls create them
  useEffect(() => {
    if (showEndScreen || !exhibitManager) return;

    // Find any newly unlocked exhibits that should be auto-displayed
    const autoDisplayExhibit = unlockedExhibits.find((exhibit: any) => 
      exhibit.auto_displayed && 
      Date.now() - exhibit.unlocked_at.getTime() < 2000 // Within last 2 seconds
    );

    if (autoDisplayExhibit && exhibitManager && !exhibitManagerState.isActive) {
      console.log("🤖 Auto-opening exhibit from AI tool call:", autoDisplayExhibit.display_name);
      exhibitManager.openExhibit(autoDisplayExhibit.id);
    }
  }, [unlockedExhibits, exhibitManager, showEndScreen, exhibitManagerState.isActive]);

  // Auto-scroll transcript when new messages arrive (only if at bottom)
  useEffect(() => {
    if (isAtBottom && transcriptScrollRef.current) {
      setTimeout(() => {
        if (transcriptScrollRef.current) {
          transcriptScrollRef.current.scrollTo({
            top: transcriptScrollRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
  }, [messages.length, isAtBottom]);

  // Handle transcript scroll to detect bottom position
  const handleTranscriptScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = element;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const atBottom = distanceFromBottom <= 50; // Within 50px of bottom
    
    setIsAtBottom(atBottom);
    setShowScrollButton(!atBottom && messages.length > 3);
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (transcriptScrollRef.current) {
      transcriptScrollRef.current.scrollTo({
        top: transcriptScrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
      setIsAtBottom(true);
      setShowScrollButton(false);
    }
  };

  // Clean up exhibit state when transitioning to end screen
  useEffect(() => {
    if (showEndScreen) {
      // Close any open exhibits
      if (exhibitManager) {
        exhibitManager.closeExhibit();
      }
      // Clear expanded exhibit modal (if the function is available)
      if (onCloseModal) {
        onCloseModal();
      }
      console.log("🧹 Cleaned up exhibit state for end screen");
    }
  }, [showEndScreen, exhibitManager, onCloseModal]);
  
    const handleCoachingToggle = async (enabled: boolean) => {
    if (isUpdatingCoaching) {
      console.log("⚠️ Coaching toggle already in progress, ignoring");
      return;
    }
    
    console.log("🎓 Coaching mode toggle initiated (LOCAL ONLY - no database update):", {
      sessionId,
      newState: enabled,
      previousState: coachingMode,
      isConnected: status.value === "connected"
    });
    
    setIsUpdatingCoaching(true);
    
    try {
      // NO DATABASE UPDATE - just local state change
      // Database is only for prompt lookup, not state storage
      console.log("🔄 Updating local coaching state (no database write)");
      setCoachingMode(enabled);
      console.log("✅ Local coaching state updated:", { newCoachingMode: enabled });
      
      // Send updated session settings to Hume immediately with enhanced context
      if (status.value === "connected") {
        console.log("🔌 Sending real-time coaching update to Hume...");
        const { buildSessionSettings, initializeSessionSettings } = await import("@/utils/session-context");
        
        // Ensure session is initialized
        await initializeSessionSettings(sessionId);
        
        // Calculate elapsed time from start of interview
        const elapsed = (window as any).__getInterviewElapsed ? (window as any).__getInterviewElapsed() : 0;
        console.log("⏱️ Interview elapsed time for coaching update:", {
          elapsedMs: elapsed,
          elapsedMinutes: Math.round(elapsed / 60000 * 10) / 10
        });
        
        const temporaryContext = `Coaching mode manually ${enabled ? 'enabled' : 'disabled'} by user.`;
        console.log("📝 Building session settings with coaching change:", {
          temporaryContext,
          newCoachingMode: enabled
        });
        
        const sessionSettings = await buildSessionSettings(
          sessionId,
          elapsed,
          undefined, // startTime will be calculated internally
          temporaryContext, // temporary context
          enabled // pass the new coaching mode
        );
        
        console.log("📤 Sending coaching update to Hume:", {
          settingsSize: JSON.stringify(sessionSettings).length,
          hasContext: !!sessionSettings.context,
          contextIncludes: sessionSettings.context?.text?.includes("Coaching mode manually") || false
        });
        
        await sendSessionSettings(sessionSettings as any);
        console.log("✅ Coaching mode updated in real-time with enhanced context");
      } else {
        console.log("⚠️ Not connected to Hume - coaching update will apply on next connection");
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
            transcript_path: transcriptPath || undefined, // Store the storage path, handle null case
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
        // Download from Supabase Storage - ensure it doesn't redirect
        try {
          const response = await fetch(downloadUrl);
          const blob = await response.blob();
          
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `interview-transcript-${sessionId}.${format}`;
          a.target = '_blank'; // Ensure it doesn't affect current tab
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          toast.success("Transcript downloaded from cloud storage!");
        } catch (fetchError) {
          console.error("Error fetching from storage, using fallback:", fetchError);
          // Fall through to local download
        }
      }
      
      if (!downloadUrl) {
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
          a.target = '_blank'; // Ensure it doesn't affect current tab
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
          a.target = '_blank'; // Ensure it doesn't affect current tab
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
        <div className="interview-end-screen grow flex flex-col overflow-hidden pt-14">
          {/* Top Navigation Bar - Fixed Height, accounting for fixed nav */}
          <div className="flex-shrink-0 bg-background border-b px-6 py-4">
            <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">Interview Complete</h2>
              <p className="text-sm text-muted-foreground">Session ID: {sessionId}</p>
            </div>
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

               {/* Only show session selector on main interview page, not when viewing a specific session */}
               {!urlSessionId && (
                 <SessionSelector 
                   onSelectSession={loadEndScreenFromCache}
                   currentSessionId={sessionId}
                 />
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
          </div>
          
          {/* Main Content Area - Scrollable */}
          <div className="flex-grow overflow-hidden p-6">
            <div 
              className={cn(
                "h-full grid gap-4 transition-all duration-300",
                isTranscriptDrawerOpen 
                  ? "grid-cols-1 lg:grid-cols-[25%_45%_30%]" 
                  : "grid-cols-1 lg:grid-cols-[30%_70%]"
              )}
            >
            {/* Video Preview with Direct Seeking */}
            <Card className="p-6 flex flex-col" style={{ minWidth: '280px' }}>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <span>🎥</span>
                Interview Recording
              </h3>
              <div className="flex-grow flex flex-col bg-gray-50 dark:bg-gray-800 rounded-lg">
                {finalVideoUrl ? (
                  <div className="w-full flex-grow flex flex-col">
                    {/* Video Player */}
                    <div className="relative bg-black rounded-lg overflow-hidden mb-3">
                      {isVideoProcessing ? (
                        <div className="w-full aspect-video flex items-center justify-center bg-gray-900">
                          <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                            <p className="text-white text-sm">Processing video...</p>
                            <p className="text-gray-400 text-xs mt-2">This usually takes 30-60 seconds</p>
                          </div>
                        </div>
                      ) : (
                        <iframe
                          src={finalVideoUrl.replace('/watch', '/iframe')}
                          className="w-full aspect-video"
                          style={{ border: "none" }}
                          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                          allowFullScreen
                          title="Interview Recording"
                        />
                      )}
                    </div>
                    
                    {/* Session Summary moved here */}
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-4 space-y-3">
                      <h4 className="font-semibold text-sm flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Session Summary
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Duration:</span>
                          <span className="font-medium">
                            {Math.floor((Date.now() - (storedTranscript[0]?.timestamp * 1000 || Date.now())) / 60000)} minutes
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Messages:</span>
                          <span className="font-medium">{storedTranscript.length} exchanges</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Recording:</span>
                          <span className="font-medium">✅ Available</span>
                        </div>
                      </div>
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

            {/* Enhanced Detailed Analysis */}
            {isGeneratingFinalReport ? (
              <Card className="p-6 flex flex-col">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Detailed Analysis
                </h3>
                <div className="flex-grow flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Generating detailed analysis...</p>
                  </div>
                </div>
              </Card>
            ) : finalEvaluation ? (
              <EnhancedDetailedAnalysis 
                evaluation={finalEvaluation} 
                confidence={finalEvaluation.confidence}
              />
            ) : (
              <Card className="p-6 flex flex-col">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Detailed Analysis
                </h3>
                <div className="flex-grow flex items-center justify-center">
                  <div className="text-center">
                    <Button 
                      onClick={handleGenerateFinalReport}
                      disabled={storedTranscript.length === 0}
                    >
                      <FileText className="w-4 h-4 mr-1" />
                      Generate Analysis
                    </Button>
                  </div>
                </div>
              </Card>
            )}
            </div>
          </div>
          
          {/* Floating Transcript Button */}
          <FloatingTranscriptButton onClick={() => setIsTranscriptDrawerOpen(true)} />
          
          {/* Transcript Drawer */}
          <TranscriptDrawer
            isOpen={isTranscriptDrawerOpen}
            onClose={() => setIsTranscriptDrawerOpen(false)}
            transcript={storedTranscript.map(entry => ({
              id: entry.id || `${entry.timestamp}-${entry.speaker}`,
              speaker: entry.speaker,
              text: entry.text,
              timestamp: entry.timestamp * 1000, // Convert to milliseconds
              emotions: entry.emotions,
              confidence: entry.confidence
            }))}
          />
        </div>
      ) : showVideoReview ? (
        <div className="grow flex flex-col overflow-hidden pt-14 p-6">
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
          
          {finalVideoUrl ? (
            <VideoReviewInterface
              videoUrl={finalVideoUrl}
              transcript={transcript}
              evaluation={finalEvaluation}
              className="grow"
            />
          ) : (
            <div className="grow flex items-center justify-center">
              <Card className="p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold mb-2">Processing Video</h3>
                <p className="text-sm text-muted-foreground">
                  Your interview recording is being processed. This usually takes 30-60 seconds.
                </p>
              </Card>
            </div>
          )}
        </div>
      ) : (
        <div 
          id="mainContainer" 
          className={cn(
            "main-container grow h-full min-h-0 pt-14",
            exhibitManagerState.isActive && "exhibit-active"
          )}
        >
          {/* Left Column - Transcript Section */}
          <div className={cn(
            "transcript-column",
            !exhibitManagerState.isActive && "flex-1" // Take full space when no exhibit
          )}>
            <div className="transcript-section">
              <div className="transcript-header relative">
                <h3>Transcript</h3>
                {/* Scroll to bottom button - always visible when not at bottom */}
                {showScrollButton && (
                  <button
                    onClick={scrollToBottom}
                    className="absolute top-0 right-0 w-8 h-8 bg-blue-500 hover:bg-blue-600 
                              text-white rounded-full shadow-lg flex items-center justify-center 
                              transition-all duration-200 z-10 text-sm"
                    title="Go to latest message"
                    aria-label="Scroll to latest message"
                  >
                    ↓
                  </button>
                )}
              </div>
              <div 
                ref={transcriptScrollRef}
                className="transcript-content flex-1 overflow-y-auto min-h-0"
                onScroll={handleTranscriptScroll}
              >
                <Messages ref={messagesRef} />
              </div>
              
              {/* Session Selector - Only show when needed */}
              {!urlSessionId && (
                <div className="flex-shrink-0 flex justify-end p-4 border-t bg-white dark:bg-gray-900">
                  <SessionSelector 
                    onSelectSession={loadEndScreenFromCache}
                    currentSessionId={sessionId}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Video and Feedback */}
          <div className="right-column w-full flex-shrink-0 p-4 pt-12 space-y-4 flex flex-col max-h-full overflow-y-auto">
            {/* Video Input */}
            <div className="flex-shrink-0">
              <VideoInput ref={videoRef} autoStart={isCallActive} />
            </div>
          
            {/* Coaching & Download Controls - Combined on one line */}
            {isCallActive && (
              <div className="flex-shrink-0">
                <div className="flex gap-2 items-center">
                  {/* Coaching Toggle */}
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-muted-foreground">Coaching</span>
                    <Toggle
                      size="sm"
                      pressed={coachingMode}
                      disabled={isUpdatingCoaching}
                      onPressedChange={handleCoachingToggle}
                      className={cn(
                        "h-5 w-9 p-0 transition-all duration-200",
                        coachingMode 
                          ? "bg-blue-500 hover:bg-blue-600 data-[state=on]:bg-blue-500" 
                          : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                      )}
                    >
                      <GraduationCap className={cn(
                        "h-2.5 w-2.5 transition-colors",
                        coachingMode ? "text-white" : "text-gray-500 dark:text-gray-400"
                      )} />
                    </Toggle>
                  </div>
                  
                  {/* Download Buttons */}
                  {storedTranscript.length > 0 && (
                    <>
                      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadTranscript('txt')}
                        className="text-xs px-2"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        TXT
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadTranscript('json')}
                        className="text-xs px-2"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        JSON
                      </Button>
                    </>
                  )}
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

            {/* Case Exhibits Panel - Only show during active interview */}
            {isCallActive && unlockedExhibits.length > 0 && (
              <div className="flex-shrink-0 mt-4">
                <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  Case Exhibits
                  <span className="ml-auto bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded text-xs">
                    {unlockedExhibits.length}
                  </span>
                </div>
                
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {unlockedExhibits.map((exhibit: any) => {
                    const isPrimary = exhibitManagerState.currentExhibit?.id === exhibit.id;
                    const isNewlyUnlocked = Date.now() - exhibit.unlocked_at.getTime() < 5000;
                    
                    return (
                      <div
                        key={exhibit.id}
                        className={cn(
                          "p-2 rounded-lg border cursor-pointer transition-all duration-200",
                          isPrimary 
                            ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 ring-1 ring-blue-200 dark:ring-blue-800" 
                            : "bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800",
                          isNewlyUnlocked && "ring-2 ring-green-400 animate-pulse"
                        )}
                        data-exhibit-trigger
                        data-exhibit-id={exhibit.id}
                        data-react-handled="true"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          
                          console.log('🖱️ Sidebar exhibit clicked:', {
                            exhibitId: exhibit.id,
                            displayName: exhibit.display_name,
                            isPrimary,
                            managerActive: exhibitManagerState.isActive,
                            currentExhibit: exhibitManagerState.currentExhibit?.id
                          });
                          
                          if (exhibitManager) {
                            if (isPrimary) {
                              // If clicking active exhibit, close it
                              console.log('🔄 Closing active exhibit from sidebar');
                              exhibitManager.closeExhibit();
                            } else {
                              // If clicking different exhibit, open it
                              console.log('🔄 Opening exhibit from sidebar:', exhibit.display_name);
                              
                              // Add a small delay to prevent conflicts
                              setTimeout(() => {
                                exhibitManager.openExhibit(exhibit.id);
                              }, 50);
                            }
                          }
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={exhibit.image_url}
                            alt={exhibit.display_name}
                            className="w-8 h-8 object-cover rounded flex-shrink-0"
                            loading="lazy"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-medium truncate">
                              {exhibit.display_name}
                            </h4>
                            <div className="flex items-center gap-1 mt-0.5">
                              {isPrimary ? (
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                  Active
                                </span>
                              ) : (
                                <span className="text-xs text-muted-foreground">
                                  Click to show
                                </span>
                              )}
                            </div>
                          </div>
                          
                          <div className={cn(
                            "w-1.5 h-1.5 rounded-full flex-shrink-0",
                            isPrimary ? "bg-blue-500" : "bg-gray-300"
                          )} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-muted-foreground text-center">
                    Exhibits unlocked by AI
                  </p>
                </div>
              </div>
            )}


          </div>
          

          


        </div>
      )}

      {/* Voice Controls - Fixed at bottom */}
      {!showEndScreen && <Controls />}

      {/* Exhibit Modal - Only show during active interview, not on end screen */}
      {!showEndScreen && (
        <ExhibitModal
          exhibit={expandedExhibit}
          onClose={onCloseModal}
        />
      )}



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

  // Exhibit state for ClientComponent level
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [unlockedExhibits, setUnlockedExhibits] = useState<any[]>([]);
  const [primaryExhibit, setPrimaryExhibit] = useState<any>(null);
  const [expandedExhibit, setExpandedExhibit] = useState<any>(null);
  
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

  // Tool call handler for exhibit display
  const handleToolCall = useCallback(async (toolCallMessage: any) => {
    console.log("🔧 Tool call received:", {
      name: toolCallMessage.name,
      toolCallId: toolCallMessage.tool_call_id || toolCallMessage.toolCallId,
      parameters: toolCallMessage.parameters
    });

    if (toolCallMessage.name === "show_exhibit") {
      try {
        const { exhibit_name } = JSON.parse(toolCallMessage.parameters);
        
        if (!selectedCaseId) {
          throw new Error("No case ID available for this session");
        }
        
        // Fetch exhibit from API
        const response = await fetch('/api/exhibits/show', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exhibit_name,
            case_id: selectedCaseId
          })
        });
        
        const result = await response.json();
        
        if (response.ok && result.exhibit) {
          const newExhibit = {
            ...result.exhibit,
            unlocked_at: new Date(),
            auto_displayed: true
          };
          
          // Add to unlocked exhibits if not already there
          setUnlockedExhibits(prev => {
            const exists = prev.find(e => e.exhibit_name === exhibit_name);
            if (exists) {
              // Update existing with new unlock time
              return prev.map(e => 
                e.exhibit_name === exhibit_name 
                  ? { ...e, unlocked_at: new Date(), auto_displayed: true }
                  : e
              );
            } else {
              return [...prev, newExhibit];
            }
          });
          
          // Trigger exhibit display via ExhibitManager (will be handled by useEffect below)
          
          console.log("✅ Exhibit unlocked and displayed:", newExhibit.display_name);
          toast.success(`📸 Exhibit displayed: ${newExhibit.display_name || newExhibit.exhibit_name}`);
          
          return {
            type: "tool_response" as const,
            toolCallId: toolCallMessage.tool_call_id || toolCallMessage.toolCallId,
            content: `Successfully displayed exhibit: ${newExhibit.display_name || newExhibit.exhibit_name}`
          };
        } else {
          throw new Error(result.error || "Exhibit not found");
        }
      } catch (error) {
        console.error("Error handling show_exhibit tool call:", error);
        
        const errorResponse = {
          type: "tool_error" as const,
          toolCallId: toolCallMessage.tool_call_id || toolCallMessage.toolCallId,
          error: "Exhibit display failed",
          content: `Failed to display exhibit: ${(error as Error).message}`
        };
        
        toast.error(`Failed to display exhibit: ${(error as Error).message}`);
        return errorResponse;
      }
    } else {
      // Handle unknown tool
      return {
        type: "tool_error" as const,
        toolCallId: toolCallMessage.tool_call_id || toolCallMessage.toolCallId,
        error: "Tool not found",
        content: `Tool "${toolCallMessage.name}" is not implemented`
      };
    }
  }, [selectedCaseId]);

  // Exhibit Control Functions
  const handleClosePrimaryExhibit = useCallback(() => {
    setPrimaryExhibit(null);
  }, []);

  const handleShowExhibitFromSidebar = useCallback((exhibitId: string) => {
    const exhibit = unlockedExhibits.find(e => e.id === exhibitId);
    if (exhibit) {
      setPrimaryExhibit({ ...exhibit, auto_displayed: false });
    }
  }, [unlockedExhibits]);

  const handleExpandExhibit = useCallback((exhibitId: string) => {
    const exhibit = unlockedExhibits.find(e => e.id === exhibitId);
    if (exhibit) {
      setExpandedExhibit(exhibit);
    }
  }, [unlockedExhibits]);

  const handleCloseModal = useCallback(() => {
    setExpandedExhibit(null);
  }, []);
  
  // Monitor video stream availability (less frequently to reduce spam)
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
    
    // Check less frequently to reduce log spam
    const interval = setInterval(checkVideoStream, 2000); // Every 2 seconds instead of 250ms
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
  const urlSessionId = searchParams.get('sessionId');
  const [sessionId] = useState(() => {
    return urlSessionId || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  });

  // Get case ID from session cache
  useEffect(() => {
    const getCaseIdFromCache = async () => {
      if (sessionId && !currentCaseId) {
        try {
          const { getCaseId } = await import("@/utils/session-context");
          const caseId = getCaseId(sessionId);
          
          if (caseId) {
            setCurrentCaseId(caseId);
            console.log("📋 Case ID found for exhibits:", caseId);
          }
        } catch (error) {
          console.error("Error getting case ID from cache:", error);
        }
      }
    };
    
    const interval = setInterval(getCaseIdFromCache, 1000);
    getCaseIdFromCache();
    
    return () => clearInterval(interval);
  }, [sessionId, currentCaseId]);





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
        onMessage={(msg: any) => {
          console.log("📨 Message received from Hume:", {
            type: msg?.type,
            hasContent: !!msg?.content,
            contentLength: msg?.content?.length || 0,
            timestamp: new Date().toISOString()
          });

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
        onToolCall={handleToolCall}
        onError={(error) => {
          console.error("❌ Hume VoiceProvider error:", {
            message: error.message,
            timestamp: new Date().toISOString(),
            errorDetails: error
          });
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
        onAudioStart={() => {
          console.log("🔊 Audio playback started from Hume");
          assistantBus.resume();
        }}
        onAudioEnd={(clipId) => {
          console.log("🔇 Audio finished playing:", {
            clipId,
            timestamp: new Date().toISOString()
          });
        }}

      >
        <ChatInterface
          sessionId={sessionId}
          urlSessionId={urlSessionId}
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
          onToolCall={handleToolCall}
          unlockedExhibits={unlockedExhibits}
          primaryExhibit={primaryExhibit}
          expandedExhibit={expandedExhibit}
          onClosePrimaryExhibit={handleClosePrimaryExhibit}
          onShowExhibitFromSidebar={handleShowExhibitFromSidebar}
          onExpandExhibit={handleExpandExhibit}
          onCloseModal={handleCloseModal}

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
