"use client";

import { VoiceProvider, useVoice } from "@humeai/voice-react";
import Messages from "./Messages";
import Controls from "./Controls";
import StartCall from "./StartCall";
import VideoInput, { VideoInputRef } from "./VideoInput";

import VideoReviewInterface from "./VideoReviewInterface";
import SessionSelector from "./SessionSelector";
import { ComponentRef, useRef, useState, useEffect, useMemo, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { AssistantAudioBus } from "@/utils/assistantAudio";
import { useRecordingAnchor } from "@/hooks/useRecordingAnchor";
import { Button } from "./ui/button";
import { Switch } from "./ui/switch";
import { Toggle } from "./ui/toggle";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { GraduationCap, FileText, Download, User, Maximize2, X, Eye, EyeOff, Settings, Home } from "lucide-react";
import DeviceSetup from "./DeviceSetup";
import { cn } from "@/utils";
import { useSearchParams } from "next/navigation";
import TranscriptEvaluator from "@/utils/transcriptEvaluator";
import FeedbackDisplay, { FeedbackDisplayRef } from "./FeedbackDisplay";
import MBBAssessment from "./MBBAssessment";
import InterviewEndScreen from "./InterviewEndScreen";
import TranscriptDrawer from "./TranscriptDrawer";
import FloatingTranscriptButton from "./FloatingTranscriptButton";
import ExhibitModal from "./ExhibitModal";
import { ExhibitManager, ExhibitManagerState, initializeGlobalExhibitManager } from "@/utils/exhibit-manager";
import { useSmartScroll } from "@/hooks/useSmartScroll";
import FeedbackForm from "./FeedbackForm";
import AnalysisFeedbackForm from "./AnalysisFeedbackForm";
import PostInterviewUsageWarning from "./PostInterviewUsageWarning";
import { submitSessionFeedback, submitAnalysisFeedback } from "@/utils/supabase-client";
import RecordingControls from "./RecordingControls";
import SessionDocuments from "./SessionDocuments";

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
  isEndingInterview,
  setIsEndingInterview,

  onToolCall,
  unlockedExhibits,
  primaryExhibit,
  expandedExhibit,
  onClosePrimaryExhibit,
  onShowExhibitFromSidebar,
  onExpandExhibit,
  onCloseModal,
  selectedDevices,
  onOpenDeviceSetup,
}: any) {
  const { messages, sendSessionSettings, status, sendToolMessage } = useVoice();
  const { getRelativeTime, formatRelativeTime } = useRecordingAnchor();
  
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
  const [liveFeedbackEnabled, setLiveFeedbackEnabled] = useState(true);
  const [isUpdatingCoaching, setIsUpdatingCoaching] = useState(false);
  const [completedInterviewDuration, setCompletedInterviewDuration] = useState<number>(0);
  const [showUsageWarning, setShowUsageWarning] = useState(false);
  
  // Expose coaching mode globally for other components (local state only)
  useEffect(() => {
    (window as any).__getCurrentCoachingMode = () => coachingMode;
    
    return () => {
      delete (window as any).__getCurrentCoachingMode;
    };
  }, [coachingMode]);


  const [transcriptEvaluator] = useState(() => new TranscriptEvaluator());

  // Old evaluation system removed - now using MBB Assessment
  const feedbackDisplayRef = useRef<FeedbackDisplayRef>(null);
  
  // DUAL TRANSCRIPT SYSTEM:
  // 1. transcriptEvaluator.getCompleteTranscriptHistory() - NEVER TRUNCATED - Used for downloads and storage
  // 2. transcriptEvaluator rolling window (1 minute) - TRUNCATED - Used for real-time feedback only
  // MASTER TRANSCRIPT - NEVER TRUNCATED - Contains complete conversation history
  const [storedTranscript, setStoredTranscript] = useState<any[]>([]);
  const currentMessagesRef = useRef<any[]>([]);

  const [endScreenDataStored, setEndScreenDataStored] = useState(false);
  const [isVideoProcessing, setIsVideoProcessing] = useState(false);
  const [videoCheckInterval, setVideoCheckInterval] = useState<NodeJS.Timeout | null>(null);
  const [isTranscriptDrawerOpen, setIsTranscriptDrawerOpen] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showAnalysisFeedbackForm, setShowAnalysisFeedbackForm] = useState(false);
  const [analysisFeedbackSubmitted, setAnalysisFeedbackSubmitted] = useState(false);
  const [firstSurveyCompletedAt, setFirstSurveyCompletedAt] = useState<number | null>(null);
  const [analysisCompletedAt, setAnalysisCompletedAt] = useState<number | null>(null);
  
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
        // Close any open exhibits when loading cached end screen
        console.log("🔚 [CACHED SESSION] Closing any open exhibits");
        onCloseModal(); // Close expanded exhibit modal
        onClosePrimaryExhibit(); // Close primary exhibit
        
        // Set all the state to rebuild the end screen
        setStoredTranscript(cachedData.transcript);
        setTranscript(cachedData.transcript);
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



  // Build transcript from messages for evaluation - ENHANCED for complete preservation
  // 
  // CRITICAL: This function builds the MASTER TRANSCRIPT that is NEVER truncated.
  // The transcript evaluator uses a separate 1-minute rolling window for real-time feedback,
  // but this master transcript contains the COMPLETE conversation history for download.
  const buildTranscriptFromMessages = (messages: any[]): any[] => {
    console.log("📋 [TRANSCRIPT] Building transcript from", messages.length, "total messages");
    
    // Filter for actual conversation messages with content - be more inclusive to avoid data loss
    const conversationMessages = messages.filter(msg => {
      // Safety checks for message structure
      if (!msg || typeof msg !== 'object') {
        console.log("🔍 [TRANSCRIPT] Skipping invalid message:", msg);
        return false;
      }

      const hasContent = msg.message?.content && 
                        typeof msg.message.content === 'string' && 
                        msg.message.content.trim().length > 0;
      const isConversation = msg.type === "user_message" || msg.type === "assistant_message";
      
      // Log all message types for debugging (but only first few to avoid spam)
      if (messages.indexOf(msg) < 5 || isConversation) {
        if (!isConversation) {
          console.log("🔍 [TRANSCRIPT] Skipping non-conversation message:", msg.type);
        } else if (!hasContent) {
          console.log("⚠️ [TRANSCRIPT] Skipping empty message:", msg.type, "content:", msg.message?.content);
        } else {
          console.log("✅ [TRANSCRIPT] Including message:", msg.type, msg.message.content.substring(0, 50) + "...");
        }
      }
      
      return isConversation && hasContent;
    });
    
    // Build transcript entries with enhanced metadata preservation
    const transcript = conversationMessages.map((msg, index) => {
      const absoluteTimestamp = msg.receivedAt?.getTime() || Date.now();
      const relativeSeconds = getRelativeTime(absoluteTimestamp);
      
      // Debug logging for timestamp conversion (only first few messages to avoid spam)
      if (index < 3) {
        console.log(`🕐 [TIMESTAMP DEBUG] Message ${index}:`, {
          humeTimestamp: msg.receivedAt?.toISOString(),
          absoluteMs: absoluteTimestamp,
          currentTime: new Date().toISOString(),
          relativeSeconds,
          relativeFormatted: formatRelativeTime(relativeSeconds),
          messagePreview: msg.message?.content?.substring(0, 30) + "..."
        });
      }
      
      const entry = {
        id: `msg-${index}`,
        speaker: msg.type === "user_message" ? "user" : "assistant",
        text: msg.message?.content || "",
        timestamp: relativeSeconds, // Now using relative seconds from recording start
        emotions: msg.models?.prosody?.scores || undefined,
        confidence: msg.models?.language?.confidence || undefined,
        // Preserve original message metadata for debugging
        _originalType: msg.type,
        _originalTimestamp: msg.receivedAt?.toISOString(),
        _absoluteTimestamp: Math.floor(absoluteTimestamp / 1000),
        _messageIndex: index
      };
      
      // Validate entry completeness
      if (!entry.text || entry.text.trim().length === 0) {
        console.warn("⚠️ [TRANSCRIPT] Empty text in entry:", entry);
      }
      
      return entry;
    });
    
    console.log("📋 [TRANSCRIPT] Transcript build complete:", {
      totalMessages: messages.length,
      conversationMessages: conversationMessages.length,
      transcriptEntries: transcript.length,
      userMessages: transcript.filter(e => e.speaker === "user").length,
      assistantMessages: transcript.filter(e => e.speaker === "assistant").length,
      firstEntry: transcript[0]?.text?.substring(0, 30) + "..." || "none",
      lastEntry: transcript[transcript.length - 1]?.text?.substring(0, 30) + "..." || "none",
      // Timestamp debugging
      firstTimestamp: transcript[0]?.timestamp,
      lastTimestamp: transcript[transcript.length - 1]?.timestamp,
      timestampFormat: "relative_seconds_from_recording_start"
    });
    
    // Additional validation - but don't alarm for normal startup messages
    if (transcript.length === 0 && messages.length > 0) {
      const conversationMessageCount = messages.filter(m => m.type === "user_message" || m.type === "assistant_message").length;
      const nonConversationTypes = [...new Set(messages.map(m => m.type))];
      
      if (conversationMessageCount > 0) {
        // Only show error if we actually have conversation messages that failed to process
        console.error("🚨 [TRANSCRIPT] CRITICAL: No transcript entries created from", conversationMessageCount, "conversation messages!");
        console.error("🚨 [TRANSCRIPT] Message types:", messages.map(m => m.type));
      } else {
        // Normal case - only connection/metadata messages at start
        console.log("📋 [TRANSCRIPT] No conversation messages yet, only connection messages:", nonConversationTypes.join(", "));
      }
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
          .select("status")
          .eq("session_id", sessionId)
          .single();

        if (!error && data) {
          // Note: coach_mode_enabled column removed - coaching is local toggle only
          setCoachingMode(false);
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
    // Always update the ref with current messages - CRITICAL for transcript preservation
    currentMessagesRef.current = messages;
    
    console.log("📨 Messages updated:", {
      messageCount: messages.length,
      isCallActive,
      messageTypes: messages.map(m => m.type),
      lastMessage: messages[messages.length - 1]?.type || "none"
    });
    
    // ALWAYS build and store transcript when we have messages, regardless of call state
    // This ensures we never lose transcript data even if the call ends unexpectedly
    if (messages.length > 0) {
      const newTranscript = buildTranscriptFromMessages(messages);
      setStoredTranscript(newTranscript);
      console.log("💾 Updated stored transcript:", {
        messagesProcessed: messages.length,
        transcriptEntries: newTranscript.length,
        isCallActive,
        preservationMode: "ALWAYS_PRESERVE"
      });
      
      // Store in session storage as additional backup
      try {
        sessionStorage.setItem(`transcript_backup_${sessionId}`, JSON.stringify(newTranscript));
        console.log("💾 Backup transcript saved to session storage");
      } catch (error) {
        console.warn("Failed to backup transcript to session storage:", error);
      }
    }
  }, [messages, isCallActive, sessionId]);

  // Periodic transcript backup during active interviews
  useEffect(() => {
    let backupInterval: NodeJS.Timeout;
    
    if (isCallActive && sessionId) {
      // Backup transcript every 30 seconds during active interview
      backupInterval = setInterval(async () => {
        const currentTranscript = storedTranscript.length > 0 
          ? storedTranscript 
          : buildTranscriptFromMessages(currentMessagesRef.current);
        
        if (currentTranscript.length > 0) {
          try {
            const { upsertInterviewSession } = await import("@/utils/supabase-client");
            await upsertInterviewSession({
              session_id: sessionId,
              live_transcript_data: currentTranscript,
              updated_at: new Date().toISOString()
            });
            console.log("💾 Periodic transcript backup completed:", currentTranscript.length, "entries");
          } catch (error) {
            console.warn("Failed to backup transcript periodically:", error);
          }
        }
      }, 30000); // Every 30 seconds
    }
    
    return () => {
      if (backupInterval) {
        clearInterval(backupInterval);
      }
    };
  }, [isCallActive, sessionId, storedTranscript]);

  // Setup transcript evaluation when call starts (only once per call)
  useEffect(() => {
    if (isCallActive && transcriptEvaluator && liveFeedbackEnabled) {
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
  }, [isCallActive, transcriptEvaluator, liveFeedbackEnabled]); // Removed storedTranscript dependency

  // Listen for voice status changes to detect when call ends
  const [hasBeenConnected, setHasBeenConnected] = useState(false);
  
  useEffect(() => {
    // Track if we've ever been connected
    if (status.value === "connected") {
      setHasBeenConnected(true);
    }
    
    // Only trigger end interview if we were previously connected and now disconnected
    if (status.value === "disconnected" && isCallActive && hasBeenConnected && !isEndingInterview) {
      console.log("🔚 Call disconnected after being connected, triggering end interview");
      console.log("🔚 Current stored transcript:", storedTranscript.length, "entries");
      console.log("🔚 Current messages:", messages.length, "messages");
      console.log("🔚 Current messagesRef:", currentMessagesRef.current.length, "messages");
      
      // Set ending state to prevent multiple triggers
      setIsEndingInterview(true);
      
      // IMMEDIATELY set end screen to prevent Start Call button from showing
      console.log("🔚 IMMEDIATELY setting showEndScreen=true to prevent UI flicker");
      setShowEndScreen(true);
      setIsCallActive(false);
      
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
      
      // Process end interview data immediately (no delay)
      handleEndInterviewWithData(preservedTranscript);
      setHasBeenConnected(false); // Reset for next interview
    }
  }, [status.value, isCallActive, storedTranscript, hasBeenConnected, exhibitManager, isEndingInterview]);

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
        storedTranscript.length > 0 && 
        !endScreenDataStored
      ) {
        try {
          console.log("💾 All end screen data ready, storing to Supabase...");
          const { storeEndScreenData } = await import("@/utils/supabase-client");
          
          const success = await storeEndScreenData(
            sessionId,
            storedTranscript,
            null, // No longer using old evaluation system
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
    }, [showEndScreen, finalVideoUrl, storedTranscript, endScreenDataStored, sessionId]);

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
              
              // Also update in interview_sessions table (streamlined)
              try {
                const { upsertInterviewSession } = await import("@/utils/supabase-client");
                await upsertInterviewSession({
                  session_id: sessionId,
                  video_url: videoDetails.playbackUrl,
                  updated_at: new Date().toISOString(),
                });
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
  
    // Note: Detailed analysis is now called immediately on interview end
    // No need for useEffect since we start it right away

  // Smart timing: Show analysis feedback 1 minute after BOTH survey completion AND analysis completion
  useEffect(() => {
    if (
      !analysisFeedbackSubmitted && 
      showEndScreen && 
      !showAnalysisFeedbackForm &&
      firstSurveyCompletedAt && 
      analysisCompletedAt
    ) {
      // Both are complete - wait 1 minute after whichever finished last
      const lastCompletionTime = Math.max(firstSurveyCompletedAt, analysisCompletedAt);
      const timeElapsed = Date.now() - lastCompletionTime;
      const waitTime = Math.max(0, 60000 - timeElapsed); // 1 minute minus elapsed time
      
      console.log("📊 [ANALYSIS FEEDBACK] Smart timing:", {
        surveyCompletedAt: new Date(firstSurveyCompletedAt).toISOString(),
        analysisCompletedAt: new Date(analysisCompletedAt).toISOString(),
        lastCompletionTime: new Date(lastCompletionTime).toISOString(),
        timeElapsedMs: timeElapsed,
        waitTimeMs: waitTime,
        willShowIn: `${Math.round(waitTime/1000)} seconds`
      });
      
      const timer = setTimeout(() => {
        console.log("📊 [ANALYSIS FEEDBACK] Smart timer elapsed, showing analysis feedback form");
        setShowAnalysisFeedbackForm(true);
      }, waitTime);
      
      return () => {
        console.log("📊 [ANALYSIS FEEDBACK] Cleaning up smart timer");
        clearTimeout(timer);
      };
    }
  }, [firstSurveyCompletedAt, analysisCompletedAt, analysisFeedbackSubmitted, showEndScreen, showAnalysisFeedbackForm]);

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
      
      // Close any open exhibits immediately when interview ends
      console.log("🔚 [END] Closing any open exhibits");
      onCloseModal(); // Close expanded exhibit modal
      onClosePrimaryExhibit(); // Close primary exhibit
      
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
          
          // Save session metadata to database - use relative timestamps
          const now = new Date();
          const totalDurationSeconds = preservedTranscript.length > 0 
            ? (preservedTranscript[preservedTranscript.length - 1]?.timestamp || 0)
            : 0;
          
          // Calculate actual start/end times based on current time and duration
          const sessionEndTime = now.toISOString();
          const sessionStartTime = new Date(now.getTime() - (totalDurationSeconds * 1000)).toISOString();
          
          console.log("🕐 [TIMESTAMP] Session timing (using relative timestamps):", {
            totalDurationSeconds,
            durationFormatted: formatRelativeTime(totalDurationSeconds),
            calculatedStartTime: sessionStartTime,
            calculatedEndTime: sessionEndTime,
            method: "relative_timestamps_from_transcript"
          });
          
          await upsertInterviewSession({
            session_id: sessionId,
            started_at: sessionStartTime,
            status: "completed" as const,
            ended_at: sessionEndTime,
            duration_seconds: totalDurationSeconds,
            transcript_path: transcriptPath || undefined,
            live_transcript_data: preservedTranscript,
          });
          console.log("✅ [END] Session data and transcript saved to Supabase");
          
          // Clean up session storage backup after successful save
          try {
            sessionStorage.removeItem(`transcript_backup_${sessionId}`);
            console.log("🧹 [END] Cleaned up session storage backup");
          } catch (error) {
            console.warn("Failed to clean up session storage backup:", error);
          }
          
          // Track usage for billing - use relative timestamp duration
          try {
            const durationMinutes = Math.floor(totalDurationSeconds / 60);
            console.log("💰 [BILLING] Tracking interview usage:", { durationMinutes, totalDurationSeconds });
            
            // Store duration for usage warning component
            setCompletedInterviewDuration(durationMinutes);
            
            const response = await fetch('/api/billing/track-usage', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                usageType: 'interview_session',
                durationMinutes: durationMinutes
              })
            });
            
            if (response.ok) {
              console.log("✅ [BILLING] Usage tracked successfully");
              // Show usage warning after a short delay
              setTimeout(() => {
                setShowUsageWarning(true);
              }, 2000);
            } else {
              console.error("⚠️ [BILLING] Failed to track usage:", await response.text());
            }
          } catch (billingError) {
            console.error("⚠️ [BILLING] Usage tracking failed (non-critical):", billingError);
          }
        } catch (supabaseError) {
          console.error("⚠️ [END] Supabase save failed (non-critical):", supabaseError);
        }
      }

      // End the call and show end screen (states may already be set for immediate transitions)
      console.log("🔚 [END] Ensuring final states: isCallActive=false, forceShowRecording=false, showEndScreen=true");
      console.log("🔚 [END] Current finalVideoUrl:", finalVideoUrl);
      setIsCallActive(false); // Ensure it's set (may already be set)
      setForceShowRecording(false);
      setShowEndScreen(true); // Ensure it's set (may already be set)
      
      // Reset ending state
      setIsEndingInterview(false);
      
      // Show feedback form if not already submitted for new sessions
      // Add a small delay to let the user see the end screen first
      console.log("📝 [FEEDBACK] Checking feedback conditions:", {
        feedbackSubmitted,
        urlSessionId,
        sessionId,
        shouldShow: !feedbackSubmitted
      });
      
      if (!feedbackSubmitted) {
        console.log("📝 [FEEDBACK] Showing feedback form for session in 2 seconds");
        setTimeout(() => {
          console.log("📝 [FEEDBACK] Timeout triggered - setting showFeedbackForm to true");
          setShowFeedbackForm(true);
        }, 2000); // 2 second delay
      } else {
        console.log("📝 [FEEDBACK] Skipping feedback form - already submitted for this session");
      }
      
      // Automatically trigger both MBB endpoints in the background
      console.log("🔚 [END] Interview ended - triggering both MBB Assessment and Report automatically");
      
      // Background API calls - don't await, let them run async and update UI when ready
      if (preservedTranscript.length > 0) {
        const transcriptText = preservedTranscript.map(entry => {
          const timestamp = entry.timestamp ? `[${Math.floor(entry.timestamp / 60).toString().padStart(2, '0')}:${(entry.timestamp % 60).toString().padStart(2, '0')}]` : '';
          const speaker = entry.speaker === 'user' ? 'YOU:' : 'AI INTERVIEWER:';
          return `${timestamp} ${speaker} ${entry.text}`;
        }).join('\n');

        // Fire both endpoints in parallel
        // 1. MBB Report (Detailed Analysis)
        fetch('/api/transcript/mbb_report', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript_text: transcriptText })
        }).then(async response => {
          if (response.ok) {
            const mbbReport = await response.json();
            console.log("✅ [BACKGROUND] MBB Report generated successfully");
            // Store in session storage for InterviewEndScreen to pick up
            sessionStorage.setItem(`mbb_report_${sessionId}`, JSON.stringify(mbbReport));
            // Trigger custom event to notify InterviewEndScreen
            window.dispatchEvent(new CustomEvent('mbb-report-ready', { detail: { sessionId, data: mbbReport } }));
          } else {
            console.warn("⚠️ [BACKGROUND] MBB Report generation failed");
          }
        }).catch(error => {
          console.warn("⚠️ [BACKGROUND] MBB Report error:", error);
        });

        // 2. MBB Assessment (Quick Scores)
        fetch('/api/transcript/mbb_assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ transcript_text: transcriptText })
        }).then(async response => {
          if (response.ok) {
            const mbbAssessment = await response.json();
            console.log("✅ [BACKGROUND] MBB Assessment generated successfully");
            // Store in session storage for InterviewEndScreen to pick up
            sessionStorage.setItem(`mbb_assessment_${sessionId}`, JSON.stringify(mbbAssessment));
            // Trigger custom event to notify InterviewEndScreen
            window.dispatchEvent(new CustomEvent('mbb-assessment-ready', { detail: { sessionId, data: mbbAssessment } }));
          } else {
            console.warn("⚠️ [BACKGROUND] MBB Assessment generation failed");
          }
        }).catch(error => {
          console.warn("⚠️ [BACKGROUND] MBB Assessment error:", error);
        });
      }
      
      toast.success("Interview ended! Review your session below.");
    } catch (error) {
      console.error("Error ending interview:", error);
      toast.error("Error ending interview");
    }
  };

  const handleEndInterview = async () => {
    // Enhanced fallback system to ensure we never lose transcript data
    console.log("🔚 [END] Starting interview end process with enhanced preservation");
    
    let transcriptData: any[] = [];
    
    // Try multiple sources in order of preference
    // PRIORITY 1: Current stored transcript (has correct timestamps from buildTranscriptFromMessages)
    if (storedTranscript.length > 0) {
      transcriptData = storedTranscript;
      console.log("✅ [END] Using stored transcript (with correct timestamps):", transcriptData.length, "entries");
    }
    // PRIORITY 2: Transcript evaluator's complete history (backup)
    else {
      try {
        const evaluatorHistory = transcriptEvaluator.getCompleteTranscriptHistory();
        if (evaluatorHistory.length > 0) {
          transcriptData = evaluatorHistory;
          console.log("✅ [END] Using transcript evaluator complete history:", transcriptData.length, "entries");
        }
      } catch (error) {
        console.warn("⚠️ [END] Failed to get evaluator history:", error);
      }
    }
    
    // FALLBACK: Try other sources if neither has data
    if (transcriptData.length === 0) {
      // 3. Build from current messages ref (real-time backup)
      if (currentMessagesRef.current.length > 0) {
        transcriptData = buildTranscriptFromMessages(currentMessagesRef.current);
        console.log("✅ [END] Built from messages ref:", transcriptData.length, "entries");
      }
      // 4. Build from messages state (fallback)
      else if (messages.length > 0) {
        transcriptData = buildTranscriptFromMessages(messages);
        console.log("✅ [END] Built from messages state:", transcriptData.length, "entries");
      }
      // 5. Try session storage backup
      else {
        try {
          const backupData = sessionStorage.getItem(`transcript_backup_${sessionId}`);
          if (backupData) {
            transcriptData = JSON.parse(backupData);
            console.log("✅ [END] Recovered from session storage backup:", transcriptData.length, "entries");
          }
        } catch (error) {
          console.warn("Failed to recover from session storage backup:", error);
        }
      }
    }
    
    // Final validation
    if (transcriptData.length === 0) {
      console.warn("⚠️ [END] No transcript data found - this should not happen!");
      // Still proceed but log the issue
    } else {
      console.log("✅ [END] Final transcript validation passed:", {
        totalEntries: transcriptData.length,
        userMessages: transcriptData.filter(e => e.speaker === "user").length,
        assistantMessages: transcriptData.filter(e => e.speaker === "assistant").length,
        firstEntry: transcriptData[0]?.text?.substring(0, 50) + "...",
        lastEntry: transcriptData[transcriptData.length - 1]?.text?.substring(0, 50) + "...",
        source: transcriptData.length > 0 ? "transcript_evaluator_complete_history" : "fallback_sources"
      });
    }
    
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
        // Enhanced fallback to local download with multiple data sources
        console.log("📥 [DOWNLOAD] Using local fallback with enhanced preservation");
        
        let transcriptData: any[] = [];
        
        // Try multiple sources in order of preference (same as handleEndInterview)
        // PRIORITY 1: Current stored transcript (has correct timestamps from buildTranscriptFromMessages)
        if (storedTranscript.length > 0) {
          transcriptData = storedTranscript;
          console.log("✅ [DOWNLOAD] Using stored transcript (with correct timestamps):", transcriptData.length, "entries");
        }
        // PRIORITY 2: Transcript evaluator's complete history (backup)
        else {
          try {
            const evaluatorHistory = transcriptEvaluator.getCompleteTranscriptHistory();
            if (evaluatorHistory.length > 0) {
              transcriptData = evaluatorHistory;
              console.log("✅ [DOWNLOAD] Using transcript evaluator complete history:", transcriptData.length, "entries");
            }
          } catch (error) {
            console.warn("⚠️ [DOWNLOAD] Failed to get evaluator history:", error);
          }
        }
        
        // FALLBACK: Try other sources if neither has data
        if (transcriptData.length === 0) {
          if (currentMessagesRef.current.length > 0) {
            transcriptData = buildTranscriptFromMessages(currentMessagesRef.current);
            console.log("✅ [DOWNLOAD] Built from messages ref:", transcriptData.length, "entries");
          } else if (messages.length > 0) {
            transcriptData = buildTranscriptFromMessages(messages);
            console.log("✅ [DOWNLOAD] Built from messages state:", transcriptData.length, "entries");
          } else {
            // Try session storage backup
            try {
              const backupData = sessionStorage.getItem(`transcript_backup_${sessionId}`);
              if (backupData) {
                transcriptData = JSON.parse(backupData);
                console.log("✅ [DOWNLOAD] Recovered from session storage backup:", transcriptData.length, "entries");
              }
            } catch (error) {
              console.warn("Failed to recover from session storage backup:", error);
            }
          }
        }
        
        if (format === 'json') {
          const jsonData = {
            session_id: sessionId,
            created_at: new Date().toISOString(),
            entries: transcriptData.map((entry, index) => ({
              ...entry,
              formatted_timestamp: formatRelativeTime(entry.timestamp || 0),
              _entry_index: index
            })),
            metadata: {
              total_entries: transcriptData.length,
              duration: transcriptData.length > 0 
                ? formatRelativeTime(transcriptData[transcriptData.length - 1]?.timestamp || 0)
                : "00:00",
              user_messages: transcriptData.filter(e => e.speaker === "user").length,
              assistant_messages: transcriptData.filter(e => e.speaker === "assistant").length,
              format: 'complete_transcript'
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
          const transcriptText = transcriptData.map((entry, index) => {
            // Use centralized timestamp formatting (same as used during interview display)
            const timeStr = formatRelativeTime(entry.timestamp || 0);
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





  const handleFeedbackSubmit = async (feedbackData: any) => {
    try {
      console.log("📝 Submitting complete feedback:", feedbackData);
      const success = await submitSessionFeedback(feedbackData);
      
      if (success) {
        setFeedbackSubmitted(true);
        setShowFeedbackForm(false); // Close the form
        setFirstSurveyCompletedAt(Date.now()); // Track completion time
        console.log("📝 [FEEDBACK] First survey completed at:", new Date().toISOString());
        toast.success("Thank you for your feedback!");
      } else {
        toast.error("Failed to submit feedback. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.");
    }
  };

  const handlePartialFeedbackSubmit = async (feedbackData: any) => {
    try {
      console.log(`📝 Saving partial feedback (closed at question ${feedbackData.lastQuestionIndex + 1}/${feedbackData.totalQuestions}):`, feedbackData);
      const success = await submitSessionFeedback(feedbackData);
      
      if (success) {
        setFeedbackSubmitted(true);
        setFirstSurveyCompletedAt(Date.now()); // Track completion time for partial too
        console.log("✅ Partial feedback saved for analytics at:", new Date().toISOString());
      } else {
        console.error("❌ Failed to save partial feedback");
      }
    } catch (error) {
      console.error("Error saving partial feedback:", error);
    }
  };

  const handleFeedbackClose = () => {
    setShowFeedbackForm(false);
  };

  const handleAnalysisFeedbackSubmit = async (feedbackData: any) => {
    try {
      console.log("📊 Submitting analysis feedback:", feedbackData);
      const success = await submitAnalysisFeedback(feedbackData);
      
      if (success) {
        setAnalysisFeedbackSubmitted(true);
        setShowAnalysisFeedbackForm(false);
        toast.success("Thank you for your feedback on the analysis!");
      } else {
        toast.error("Failed to submit analysis feedback. Please try again.");
      }
    } catch (error) {
      console.error("Error submitting analysis feedback:", error);
      toast.error("Failed to submit analysis feedback. Please try again.");
    }
  };

  const handlePartialAnalysisFeedbackSubmit = async (feedbackData: any) => {
    try {
      console.log(`📊 Saving partial analysis feedback (closed at question ${feedbackData.lastQuestionIndex + 1}/${feedbackData.totalQuestions}):`, feedbackData);
      const success = await submitAnalysisFeedback(feedbackData);
      
      if (success) {
        setAnalysisFeedbackSubmitted(true);
        console.log("✅ Partial analysis feedback saved for analytics");
      } else {
        console.error("❌ Failed to save partial analysis feedback");
      }
    } catch (error) {
      console.error("Error saving partial analysis feedback:", error);
    }
  };

  const handleAnalysisFeedbackClose = () => {
    setShowAnalysisFeedbackForm(false);
  };

  return (
    <>
      {showEndScreen ? (
        <InterviewEndScreen
          sessionId={sessionId}
          duration={(() => {
            if (storedTranscript.length === 0) return "0 seconds";
            const totalSeconds = storedTranscript[storedTranscript.length - 1]?.timestamp || 0;
            if (totalSeconds < 60) {
              return `${Math.floor(totalSeconds)} seconds`;
            } else {
              return `${Math.floor(totalSeconds / 60)} minutes`;
            }
          })()}
          messageCount={storedTranscript.length}
          hasRecording={!!finalVideoUrl}
          hasTranscript={storedTranscript.length > 0}
          finalVideoUrl={finalVideoUrl}
          detailedEvaluation={undefined}
          transcriptText={(() => {
            // Use storedTranscript as primary source (has correct timestamps from buildTranscriptFromMessages)
            const completeTranscript = storedTranscript;
            console.log("📄 [END_SCREEN] Using stored transcript (with correct timestamps):", completeTranscript.length, "entries");
            
            return completeTranscript.map(entry => {
              // Use centralized timestamp formatting (same as used during interview display)
              const timeStr = formatRelativeTime(entry.timestamp || 0);
              const speaker = entry.speaker.toUpperCase() === 'USER' ? 'YOU' : 'AI INTERVIEWER';
              return `[${timeStr}] ${speaker}: ${entry.text}`;
            }).join('\n');
          })()}
          onStartNewInterview={() => {
            window.location.href = "/interview/setup";
          }}
          onViewTranscript={() => downloadTranscript('txt')}
          onViewDashboard={() => {
            window.location.href = "/dashboard";
          }}
        />

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
              <VideoInput 
                ref={videoRef} 
                autoStart={isCallActive} 
                preferredDeviceId={selectedDevices?.cameraId}
              />
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
                        Transcript
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Live Feedback Display - Integrated into sidebar */}
            <div className="flex-shrink-0">
              <div className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isCallActive && liveFeedbackEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                Live Feedback
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{liveFeedbackEnabled ? 'On' : 'Off'}</span>
                  <Switch
                    checked={liveFeedbackEnabled}
                    onCheckedChange={setLiveFeedbackEnabled}
                  />
                </div>
              </div>
              {liveFeedbackEnabled ? (
                <FeedbackDisplay ref={feedbackDisplayRef} />
              ) : (
                <div className="text-center py-3 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="text-xs text-gray-400 dark:text-gray-600">Live feedback disabled</div>
                </div>
              )}
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
      {!showEndScreen && (
        <div className="relative">
          <Controls />
          {/* Device Setup Button - Floating */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenDeviceSetup}
            className="absolute -top-12 right-4 bg-white/90 backdrop-blur-sm border-gray-200 hover:bg-white shadow-sm"
          >
            <Settings className="w-4 h-4 mr-2" />
            Devices
          </Button>
        </div>
      )}

      {/* Hidden Recording System - No UI, just functionality */}
      {(isCallActive || forceShowRecording) && (
        <div style={{ display: 'none' }}>
          <RecordingControls
            videoStream={videoRef.current?.getStream() || null}
            audioCtx={audioCtx}
            audioStream={assistantBus.getStream()}
            isCallActive={isCallActive || forceShowRecording}
            autoStart={shouldAutoRecord}
            onRecordingComplete={async (videoId, recordingMetadata) => {
              console.log("🎥 Background recording complete:", {
                videoId,
                duration: recordingMetadata?.duration,
                fileSize: recordingMetadata?.fileSize
              });
              
              // Store video metadata immediately
              if (recordingMetadata) {
                const { upsertInterviewSession } = await import("@/utils/supabase-client");
                await upsertInterviewSession({
                  session_id: sessionId,
                  video_duration_seconds: recordingMetadata.duration,
                  video_file_size_bytes: recordingMetadata.fileSize,
                  updated_at: new Date().toISOString(),
                });
                console.log("📊 Video metadata stored:", recordingMetadata);
              }
              
              // Check video status after a short delay
              setTimeout(async () => {
                try {
                  const response = await fetch(`/api/recording/video/${videoId}?_t=${Date.now()}`, { 
                    cache: 'no-store' 
                  });
                  const videoDetails = await response.json();
                  
                  if (videoDetails.ready) {
                    const playbackUrl = videoDetails.playbackUrl || `https://customer-demo.cloudflarestream.com/${videoId}/watch`;
                    setFinalVideoUrl(playbackUrl);
                    console.log("✅ Video ready immediately:", playbackUrl);
                    
                    // Store in interview_sessions table (streamlined)
                    handleVideoReady(videoId, playbackUrl);
                  } else {
                    console.log("🔄 Video still processing, will check periodically");
                    const processingUrl = `https://customer-demo.cloudflarestream.com/${videoId}/watch`;
                    setFinalVideoUrl(processingUrl);
                    setIsVideoProcessing(true);
                    
                    // Store in interview_sessions table (streamlined)
                    handleVideoReady(videoId, processingUrl);
                  }
                } catch (error) {
                  console.error("Error checking video status:", error);
                  // Fallback: assume it will be ready and set URL
                  const fallbackUrl = `https://customer-demo.cloudflarestream.com/${videoId}/watch`;
                  setFinalVideoUrl(fallbackUrl);
                  handleVideoReady(videoId, fallbackUrl);
                }
              }, 2000);
            }}
          />
        </div>
      )}

      {/* Exhibit Modal - Only show during active interview, not on end screen */}
      {!showEndScreen && (
        <ExhibitModal
          exhibit={expandedExhibit}
          onClose={onCloseModal}
        />
      )}

      {/* Feedback Form - Show after interview ends */}
      {showFeedbackForm && (
        <>
          {(() => { console.log("📝 [FEEDBACK] Rendering FeedbackForm component now!"); return null; })()}
          <FeedbackForm
            onClose={handleFeedbackClose}
            onSubmit={handleFeedbackSubmit}
            onPartialSubmit={handlePartialFeedbackSubmit}
            sessionData={{ id: sessionId }}
          />
        </>
      )}

      {/* Analysis Feedback Form - Show 1 minute after analysis completes */}
      {showAnalysisFeedbackForm && (
        <>
          {(() => { console.log("📊 [ANALYSIS FEEDBACK] Rendering AnalysisFeedbackForm component now!"); return null; })()}
          <AnalysisFeedbackForm
            onClose={handleAnalysisFeedbackClose}
            onSubmit={handleAnalysisFeedbackSubmit}
            onPartialSubmit={handlePartialAnalysisFeedbackSubmit}
            sessionData={{ id: sessionId }}
          />
        </>
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
  const [isCheckingSessionState, setIsCheckingSessionState] = useState(true);
  const [isEndingInterview, setIsEndingInterview] = useState(false);

  // Device preferences from device setup
  const [selectedDevices, setSelectedDevices] = useState<{
    cameraId: string;
    microphoneId: string;
    speakerId: string;
  } | null>(null);
  const [showDeviceSetup, setShowDeviceSetup] = useState(false);

  // Exhibit state for ClientComponent level
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);
  const [unlockedExhibits, setUnlockedExhibits] = useState<any[]>([]);
  const [primaryExhibit, setPrimaryExhibit] = useState<any>(null);
  const [expandedExhibit, setExpandedExhibit] = useState<any>(null);
  
  // Function to close all exhibits
  const closeAllExhibits = () => {
    console.log("🔚 Closing all exhibits");
    setExpandedExhibit(null); // Close expanded exhibit modal
    setPrimaryExhibit(null); // Close primary exhibit
  };


  
  // Get interview configuration from URL params
  const selectedCaseId = searchParams.get('caseId');
  const selectedInterviewerId = searchParams.get('interviewerProfileId'); // Updated to match new system
  const urlSessionId = searchParams.get('sessionId');
  
  // Check if we have the required parameters for an interview session
  const hasRequiredParams = selectedCaseId && selectedInterviewerId && urlSessionId;
  
  // Create ONE AudioContext for the entire chat session
  const audioCtx = useMemo(() => new (window.AudioContext || (window as any).webkitAudioContext)(), []);
  // AssistantAudioBus re-uses the shared AudioContext so its stream is recordable
  const [assistantBus] = useState(() => new AssistantAudioBus(audioCtx));

  // optional: use configId from environment variable
  const configId = process.env['NEXT_PUBLIC_HUME_CONFIG_ID'];

  // Redirect to setup if required parameters are missing
  useEffect(() => {
    if (!hasRequiredParams && !showEndScreen) {
      console.log("❌ Missing required parameters, redirecting to setup:", {
        selectedCaseId,
        selectedInterviewerId,
        urlSessionId
      });
      window.location.href = '/interview/setup';
      return;
    }
  }, [hasRequiredParams, showEndScreen, selectedCaseId, selectedInterviewerId, urlSessionId]);

  // Check if session is already completed and should show end screen
  useEffect(() => {
    const checkSessionState = async () => {
      if (!urlSessionId) {
        setIsCheckingSessionState(false);
        return;
      }

      // Skip status check for brand new sessions (prevents race condition)
      // If session ID is a timestamp and it's less than 30 seconds old, it's definitely new
      const sessionTimestamp = parseInt(urlSessionId.split('-')[0]); // Handle both "123456789" and "123456789-abc123" formats
      const now = Date.now();
      const sessionAge = now - sessionTimestamp;
      
      if (!isNaN(sessionTimestamp) && sessionAge < 30000) { // Less than 30 seconds old
        console.log("🆕 Skipping status check for brand new session:", {
          sessionId: urlSessionId,
          sessionAge: Math.round(sessionAge / 1000) + 's',
          reason: 'too_recent_to_be_completed'
        });
        setIsCheckingSessionState(false);
        return;
      }

      try {
        console.log("🔍 Checking if session is already completed:", urlSessionId);
        const response = await fetch(`/api/sessions/status?sessionId=${urlSessionId}`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.isCompleted) {
            console.log("✅ Session is already completed, showing end screen");
            
            // Close any open exhibits when loading completed session
            closeAllExhibits();
            
            setShowEndScreen(true);
            
            // Load any existing transcript/video data
            if (data.transcript) {
              setTranscript(data.transcript);
            }
            if (data.videoUrl) {
              setFinalVideoUrl(data.videoUrl);
            }
          }
        } else {
          console.log("📝 Session not found or not completed, starting fresh");
        }
      } catch (error) {
        console.error("❌ Error checking session state:", error);
      } finally {
        setIsCheckingSessionState(false);
      }
    };

    checkSessionState();
  }, [urlSessionId]);

  // Load device preferences from sessionStorage
  useEffect(() => {
    const storedDevices = sessionStorage.getItem('selectedDevices');
    if (storedDevices) {
      try {
        const devices = JSON.parse(storedDevices);
        setSelectedDevices(devices);
        console.log("🎥 Loaded device preferences:", devices);
      } catch (error) {
        console.error("Failed to parse stored device preferences:", error);
      }
    }
  }, []);

  // Device setup handlers
  const handleDeviceSetupComplete = (devices: {
    cameraId: string;
    microphoneId: string;
    speakerId: string;
  }) => {
    setSelectedDevices(devices);
    sessionStorage.setItem('selectedDevices', JSON.stringify(devices));
    setShowDeviceSetup(false);
    console.log("🎥 Device preferences updated:", devices);
    toast.success("Device settings updated successfully!");
  };

  const handleOpenDeviceSetup = () => {
    setShowDeviceSetup(true);
  };

  const handleCloseDeviceSetup = () => {
    setShowDeviceSetup(false);
  };

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
      // Store video data directly in interview_sessions table (streamlined structure)
      const { upsertInterviewSession } = await import("@/utils/supabase-client");
      await upsertInterviewSession({
        session_id: sessionId,
        video_url: playbackUrl,
        updated_at: new Date().toISOString(),
      });
      
      setFinalVideoUrl(playbackUrl);
      console.log("✅ [VIDEO] Video URL saved to interview_sessions");
    } catch (e) {
      console.error("Failed saving video url", e);
    }
  };

  // Show loading state if parameters are missing and we're redirecting
  if (!hasRequiredParams && !showEndScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to interview setup...</p>
        </div>
      </div>
    );
  }

  // Show loading state while checking session state
  if (isCheckingSessionState) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading interview session...</p>
        </div>
      </div>
    );
  }

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
          isEndingInterview={isEndingInterview}
          setIsEndingInterview={setIsEndingInterview}

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
          selectedDevices={selectedDevices}
          onOpenDeviceSetup={handleOpenDeviceSetup}
        />
        {!showEndScreen && !isEndingInterview && (
          <StartCall 
            configId={configId} 
            accessToken={accessToken}
            sessionId={sessionId}
            selectedCaseId={selectedCaseId}
            selectedInterviewerId={selectedInterviewerId}
            autoStart={true}
            onCallStart={() => {
              console.log("📱 onCallStart callback - starting camera AND recording panel");
              videoRef.current?.startVideo();
              setForceShowRecording(true);
              setIsCallActive(true);
            }}
          />
        )}

        {/* Device Setup Modal */}
        {showDeviceSetup && (
          <DeviceSetup
            onContinue={handleDeviceSetupComplete}
            onClose={handleCloseDeviceSetup}
            isModal={true}
          />
        )}
      </VoiceProvider>
    </div>
  );
}
