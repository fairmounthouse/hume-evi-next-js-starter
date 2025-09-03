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
import { GraduationCap, FileText, Download, User, Maximize2, X, Eye, EyeOff, Settings, Home, Mic, MicOff, Video as VideoIcon, VideoOff as VideoOffIcon } from "lucide-react";
import DeviceSetup from "./DeviceSetup";
import { cn } from "@/utils";
import { useSearchParams } from "next/navigation";
import TranscriptEvaluator from "@/utils/transcriptEvaluator";
import { GlobalTranscriptManager } from "@/utils/globalTranscriptManager";
import { generateStableId, getInterimCache, setInterimCache, updateInterimCache } from "@/utils/stableIdGenerator";
import FeedbackDisplay, { FeedbackDisplayRef } from "./FeedbackDisplay";
import MBBAssessment from "./MBBAssessment";
import InterviewEndScreen from "./InterviewEndScreen";
import TranscriptDrawer from "./TranscriptDrawer";
import ExhibitModal from "./ExhibitModal";
import { ExhibitManager, ExhibitManagerState, initializeGlobalExhibitManager } from "@/utils/exhibit-manager";
import { useSmartScroll } from "@/hooks/useSmartScroll";
import FeedbackForm from "./FeedbackForm";
import AnalysisFeedbackForm from "./AnalysisFeedbackForm";
import PostInterviewUsageWarning from "./PostInterviewUsageWarning";
import { submitSessionFeedback, submitAnalysisFeedback } from "@/utils/supabase-client";
import RecordingControls from "./RecordingControls";
import SessionDocuments from "./SessionDocuments";

// Simple interim tracking - just enhance existing system

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
  const { messages, sendSessionSettings, status, sendToolMessage, micFft, isMuted, mute, unmute } = useVoice();
  const { getRelativeTime, formatRelativeTime, recordingStartTime } = useRecordingAnchor();
  
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
    (window as any).__getRelativeTime = getRelativeTime;
    (window as any).__recordingStartTime = recordingStartTime;
    
    return () => {
      delete (window as any).__getCurrentCoachingMode;
      delete (window as any).__getRelativeTime;
      delete (window as any).__recordingStartTime;
    };
  }, [coachingMode, getRelativeTime, recordingStartTime]);


  // Use global transcript manager for UI-independent processing
  const globalManager = GlobalTranscriptManager.getInstance();
  const transcriptEvaluator = globalManager.getEvaluator(sessionId);
  const storageService = globalManager.getStorageService(sessionId);

  // Old evaluation system removed - now using MBB Assessment
  const feedbackDisplayRef = useRef<FeedbackDisplayRef>(null);
  
  // DUAL TRANSCRIPT SYSTEM:
  // 1. transcriptEvaluator.getCompleteTranscriptHistory() - NEVER TRUNCATED - Used for downloads and storage
  // 2. transcriptEvaluator rolling window (1 minute) - TRUNCATED - Used for real-time feedback only

  const pipRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [pipPos, setPipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasCustomPipPos, setHasCustomPipPos] = useState(false);
  const [isDraggingPip, setIsDraggingPip] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [assistantSpeaking, setAssistantSpeaking] = useState(false);
  const lastAssistantIndexRef = useRef<number>(-1);
  
  // Simple interim tracking - just store first interim until AI speaks
  const currentUserStartTime = useRef<number | null>(null);
  
  // Initialize persistent interim cache in localStorage
  useEffect(() => {
    // Ensure interim cache exists for this session
    const cache = getInterimCache(sessionId);
    console.log(`🗂️ [INTERIM CACHE] Initialized for session ${sessionId}, existing entries:`, Object.keys(cache).length);
  }, [sessionId]);
  
  // Simple instant detection – flash when audio is present
  const assistantLastTriggerMsRef = useRef<number>(0);
  
  // Check for first interim from global variable and convert to relative time
  useEffect(() => {
    if (!messages || messages.length === 0) return;
    
    // Check if we have a global first interim ABS timestamp to convert to REL seconds
    if ((window as any).__currentUserStartTime && currentUserStartTime.current === null) {
      const globalTimestamp = (window as any).__currentUserStartTime as number; // absolute ms
      const relativeTimestamp = getRelativeTime(globalTimestamp);
      currentUserStartTime.current = relativeTimestamp;
      console.log(`🔄 [GLOBAL->RELATIVE] Converted first interim: ${new Date(globalTimestamp).toISOString()} → ${relativeTimestamp}s`);
    }
    
    const latestMessage = messages[messages.length - 1];
    
    // Clear when AI speaks or session ends
    if (latestMessage?.type === "assistant_message" || latestMessage?.type === "assistant_end") {
      if (currentUserStartTime.current !== null) {
        console.log(`🤖 [AI SPOKE] Clearing user start time, ready for next speaking session`);
        currentUserStartTime.current = null;
        // Clear global tracker too
        delete (window as any).__currentUserStartTime;
        delete (window as any).__currentUserStartContent;
      }
    }
  }, [messages, getRelativeTime]);
  const sessionStorageKey = useMemo(
    () => `pipPos_${sessionId || urlSessionId || 'default'}`,
    [sessionId, urlSessionId]
  );

  // DUAL TRANSCRIPT SYSTEM:
  // 1. storedTranscript: Final transcript for storage/download (no interim messages)
  // 2. liveTranscript: Live UI transcript with interim messages for drawer display
  const [storedTranscript, setStoredTranscript] = useState<any[]>([]);
  const [liveTranscript, setLiveTranscript] = useState<any[]>([]);

  // Pre-calculate all transcript-related values (always, not conditionally)
  const endScreenDuration = useMemo(() => {
    // Use stored transcript for accurate duration
    if (storedTranscript.length === 0) return "0 seconds";
    const totalSeconds = storedTranscript[storedTranscript.length - 1]?.timestamp || 0;
    if (totalSeconds < 60) {
      return `${Math.floor(totalSeconds)} seconds`;
    } else {
      return `${Math.floor(totalSeconds / 60)} minutes`;
    }
  }, [storedTranscript]);

  const endScreenTranscript = useMemo(() => {
    // Use master transcript if available, fallback to stored
    const masterTranscript = transcriptEvaluator.getMasterTranscript();
    return masterTranscript.length > 0 ? masterTranscript : storedTranscript;
  }, [storedTranscript]);

  const endScreenTranscriptText = useMemo(() => {
    // Use master transcript for download functionality (always complete)
    const masterTranscript = transcriptEvaluator.getMasterTranscript();
    const transcriptToUse = masterTranscript.length > 0 ? masterTranscript : storedTranscript;
    return transcriptToUse.map(entry => {
      // Use centralized timestamp formatting (same as used during interview display)
      const timeStr = formatRelativeTime(entry.timestamp || 0);
      const speaker = entry.speaker.toUpperCase() === 'USER' ? 'YOU' : 'AI INTERVIEWER';
      return `[${timeStr}] ${speaker}: ${entry.text}`;
    }).join('\n');
  }, [storedTranscript, formatRelativeTime]);

  const transcriptDrawerData = useMemo(() => {
    // DRAWER USES LIVE TRANSCRIPT - Shows interim messages for real-time preview
    // Live transcript includes interim messages for UI display
    // Storage happens independently via storedTranscript (no interim) and transcriptEvaluator master transcript
    return liveTranscript.map(entry => ({
      id: entry.id || `${entry.timestamp}-${entry.speaker}`,
      speaker: entry.speaker,
      text: entry.text,
      timestamp: entry.timestamp,
      emotions: entry.emotions,
      confidence: entry.confidence,
      isInterim: entry.isInterim // This will show interim styling in drawer
    }));
  }, [liveTranscript]);
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
  
  // Track MBB analysis completion
  const [mbbReportCompleted, setMbbReportCompleted] = useState(false);
  const [mbbAssessmentCompleted, setMbbAssessmentCompleted] = useState(false);
  
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
        // Update both stored transcript and evaluator with cached data
        setStoredTranscript(cachedData.transcript);
        
        // Also update the master transcript with the cached data (filter out any interim)
        // This ensures the master transcript is complete when loading cached sessions
        if (cachedData.transcript && cachedData.transcript.length > 0) {
          const finalCachedTranscript = cachedData.transcript.filter(entry => !entry.isInterim);
          transcriptEvaluator.appendToMasterTranscript(finalCachedTranscript);
          console.log("📋 [CACHED SESSION] Updated master transcript with cached data:", finalCachedTranscript.length, "final entries");
        }
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
  // Build LIVE transcript with interim text updates (no box insertion/removal)
  const buildLiveTranscriptFromMessages = (messages: any[]): any[] => {
    console.log("📋 [LIVE TRANSCRIPT] Building live transcript from", messages.length, "total messages");
    
    // Group messages by speaker and approximate timestamp to merge interim/final
    const messageGroups: { [key: string]: any[] } = {};
    
    messages.forEach(msg => {
      if (!msg || !msg.message?.content) return;
      
      const hasContent = msg.message.content.trim().length > 0;
      const isConversation = msg.type === "user_message" || msg.type === "assistant_message";
      
      if (!isConversation || !hasContent) return;
      
      const absoluteTimestamp = msg.receivedAt?.getTime() || Date.now();
      const relativeSeconds = getRelativeTime(absoluteTimestamp);
      const isInterim = (msg as any).interim === true;
      
      // Create a group key based on speaker and rough timestamp (to group interim/final together)
      const groupKey = `${msg.type}-${Math.floor(relativeSeconds / 2)}`; // Group within 2-second windows
      
      if (!messageGroups[groupKey]) {
        messageGroups[groupKey] = [];
      }
      
      messageGroups[groupKey].push({
        ...msg,
        relativeSeconds,
        absoluteTimestamp,
        isInterim
      });
    });
    
    // Process each group to get the latest message (interim or final)
    const transcript: any[] = [];
    
    Object.values(messageGroups).forEach(group => {
      if (group.length === 0) return;
      
      // Sort by timestamp, final messages come after interim
      group.sort((a, b) => {
        if (a.absoluteTimestamp !== b.absoluteTimestamp) {
          return a.absoluteTimestamp - b.absoluteTimestamp;
        }
        // If same timestamp, final comes after interim
        return a.isInterim ? -1 : 1;
      });
      
      // Use the latest message (final if available, otherwise interim)
      const latestMsg = group[group.length - 1];
      
      // Handle interim timestamp logic for user messages
      let actualTimestamp = latestMsg.relativeSeconds;
      let startSpeakingTimestamp = latestMsg.relativeSeconds;
      
      if (latestMsg.type === "user_message") {
        if (latestMsg.isInterim) {
          // For interim messages, use current timestamp
          actualTimestamp = latestMsg.relativeSeconds;
        } else {
          // For final messages, check for cached first interim
          const interimCache = getInterimCache(sessionId);
          const cachedFirst = interimCache[latestMsg.absoluteTimestamp];
          
          if (typeof cachedFirst === 'number') {
            startSpeakingTimestamp = cachedFirst;
            actualTimestamp = cachedFirst;
          }
        }
      }
      
      const entry = {
        id: generateStableId(latestMsg, actualTimestamp),
        speaker: latestMsg.type === "user_message" ? "user" : "assistant",
        text: latestMsg.message?.content || "",
        timestamp: actualTimestamp,
        startSpeakingTimestamp,
        emotions: latestMsg.models?.prosody?.scores || undefined,
        confidence: latestMsg.models?.language?.confidence || undefined,
        isInterim: latestMsg.isInterim, // Keep interim flag for subtle styling
        _originalType: latestMsg.type,
        _originalTimestamp: latestMsg.receivedAt?.toISOString(),
        _absoluteTimestamp: Math.floor(latestMsg.absoluteTimestamp / 1000),
        _finalTimestamp: latestMsg.relativeSeconds,
        _receivedAt: latestMsg.receivedAt,
      };
      
      transcript.push(entry);
    });
    
    // Sort by timestamp
    transcript.sort((a, b) => a.timestamp - b.timestamp);
    
    console.log("📋 [LIVE TRANSCRIPT] Live transcript build complete:", {
      totalMessages: messages.length,
      messageGroups: Object.keys(messageGroups).length,
      transcriptEntries: transcript.length,
      interimEntries: transcript.filter(e => e.isInterim).length,
      finalEntries: transcript.filter(e => !e.isInterim).length,
    });
    
    return transcript;
  };

  // Build FINAL transcript excluding interim messages for storage/download
  // The transcript evaluator uses a separate 1-minute rolling window for real-time feedback,
  // but this master transcript contains the COMPLETE conversation history for download.
  const buildTranscriptFromMessages = (messages: any[]): any[] => {
    console.log("📋 [TRANSCRIPT] Building transcript from", messages.length, "total messages");
    
    // Filter for actual conversation messages with content - INCLUDE INTERIM MESSAGES FOR UI
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
      const isInterim = (msg as any).interim === true;
      
      // EXCLUDE interim messages from final transcript - they're only for timestamp extraction
      if (isInterim) {
        console.log("📝 [TRANSCRIPT] Excluding interim message from final transcript (used for timestamps only):", msg.type, msg.message?.content?.substring(0, 30) + "...");
        return false;
      }
      
      // Log all message types for debugging (but only first few to avoid spam)
      if (messages.indexOf(msg) < 5 || isConversation) {
        if (!isConversation) {
          console.log("🔍 [TRANSCRIPT] Skipping non-conversation message:", msg.type);
        } else if (!hasContent) {
          console.log("⚠️ [TRANSCRIPT] Skipping empty message:", msg.type, "content:", msg.message?.content);
        } else {
          console.log("✅ [TRANSCRIPT] Including FINAL message:", msg.type, msg.message.content.substring(0, 50) + "...");
        }
      }
      
      return isConversation && hasContent; // Now includes both interim and final
    });
    
    // Build transcript entries with enhanced metadata preservation and interim tracking
    const transcript = conversationMessages.map((msg, index) => {
      const absoluteTimestamp = msg.receivedAt?.getTime() || Date.now();
      const relativeSeconds = getRelativeTime(absoluteTimestamp);
      const isInterim = (msg as any).interim === true;
      
      // For user messages, check if we have an earlier interim timestamp
      let startSpeakingTimestamp: number | undefined = undefined;
      let actualTimestamp = relativeSeconds;
      
      if (msg.type === "user_message" && msg.message?.content) {
        const content = msg.message.content.trim();
        
        if (isInterim) {
          // For interim messages, use the global first interim time if available
          const firstInterimAbs = (window as any).__currentUserStartTime as number | undefined;
          if (firstInterimAbs && recordingStartTime) {
            actualTimestamp = Math.max(0, Math.floor((firstInterimAbs - recordingStartTime) / 1000));
            console.log('🎤 [INTERIM] Using first interim timestamp for interim message', {
              firstInterimAbs,
              actualTimestamp
            });
          }
        } else {
          // For final messages, check persistent cached first interim
          const interimCache = getInterimCache(sessionId);
          const cachedFirst = interimCache[absoluteTimestamp];
          
          if (typeof cachedFirst === 'number') {
            // Use persisted first-interim for this final message if present
            startSpeakingTimestamp = cachedFirst;
            actualTimestamp = cachedFirst;
            console.log('🔒 [INTERIM CACHE HIT] Using cached first interim for final user message', {
              absoluteMs: absoluteTimestamp,
              cachedFirst
            });
          } else if (currentUserStartTime.current !== null && currentUserStartTime.current < relativeSeconds) {
            // Use current first-interim and persist it for this final user message
            startSpeakingTimestamp = currentUserStartTime.current;
            actualTimestamp = currentUserStartTime.current; // Use the first interim timestamp as the main timestamp
            updateInterimCache(sessionId, absoluteTimestamp, currentUserStartTime.current);
            console.log('📝 [INTERIM CACHE SET] Stored first interim for final user message', {
              absoluteMs: absoluteTimestamp,
              firstInterim: currentUserStartTime.current
            });
            
            console.log(`🎤 [USING FIRST INTERIM] Final message uses first interim timestamp:`, {
              finalTimestamp: relativeSeconds,
              firstInterimTimestamp: currentUserStartTime.current,
              speakingDuration: (relativeSeconds - currentUserStartTime.current).toFixed(1) + 's',
              content: content.substring(0, 30) + "..."
            });
          }
        }
      } else if (msg.type === "assistant_message") {
        // Explicitly log that we do NOT apply interim-based adjustment to assistant
        if (index < 3) {
          console.log('⏭️ [INTERIM NOT APPLIED] Assistant message timestamp unchanged');
        }
      }
      
      // Debug logging for timestamp conversion (only first few messages to avoid spam)
      if (index < 3) {
        console.log(`🕐 [TIMESTAMP DEBUG] Message ${index}:`, {
          humeTimestamp: msg.receivedAt?.toISOString(),
          absoluteMs: absoluteTimestamp,
          currentTime: new Date().toISOString(),
          relativeSeconds,
          actualTimestamp,
          startSpeakingTimestamp,
          relativeFormatted: formatRelativeTime(actualTimestamp),
          messagePreview: msg.message?.content?.substring(0, 30) + "..."
        });
      }
      
      const entry = {
        id: generateStableId(msg, actualTimestamp),
        speaker: msg.type === "user_message" ? "user" : "assistant",
        text: msg.message?.content || "",
        timestamp: actualTimestamp, // Use interim timestamp for user messages when available
        startSpeakingTimestamp, // Store the interim timestamp separately for reference
        emotions: msg.models?.prosody?.scores || undefined,
        confidence: msg.models?.language?.confidence || undefined,
        isInterim, // NEW: Flag for UI styling
        // Preserve original message metadata for debugging
        _originalType: msg.type,
        _originalTimestamp: msg.receivedAt?.toISOString(),
        _absoluteTimestamp: Math.floor(absoluteTimestamp / 1000),
        _messageIndex: index,
        _finalTimestamp: relativeSeconds, // Keep the original final timestamp for debugging
        _receivedAt: msg.receivedAt, // Add for stable ID generation
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
      userMessagesWithInterim: transcript.filter(e => e.speaker === "user" && e.startSpeakingTimestamp).length,
      firstEntry: transcript[0]?.text?.substring(0, 30) + "..." || "none",
      lastEntry: transcript[transcript.length - 1]?.text?.substring(0, 30) + "..." || "none",
      // Timestamp debugging with interim tracking
      firstTimestamp: transcript[0]?.timestamp,
      lastTimestamp: transcript[transcript.length - 1]?.timestamp,
      timestampFormat: "relative_seconds_from_recording_start",
      interimTrackingStats: {
        currentUserStartTime: currentUserStartTime.current,
        userMessagesWithInterim: transcript.filter(e => e.speaker === "user" && e.startSpeakingTimestamp).length,
        avgSpeakingDuration: transcript
          .filter(e => e.speaker === "user" && e.startSpeakingTimestamp && e._finalTimestamp)
          .map(e => e._finalTimestamp - e.startSpeakingTimestamp!)
          .reduce((sum, duration, _, arr) => arr.length > 0 ? sum + duration / arr.length : 0, 0)
          .toFixed(1) + 's'
      }
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

  // Bind evaluator to session to enable local persistence and recovery
  useEffect(() => {
    if (sessionId) {
      transcriptEvaluator.setSession(sessionId);
    }
  }, [sessionId, transcriptEvaluator]);

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
    
    // Use global manager for message processing with immediate queue processing
    if (messages.length > 0) {
      const processedEntries = globalManager.processMessages(sessionId, messages);
      
      // Build FINAL transcript from messages for storage (no interim)
      const newStoredTranscript = buildTranscriptFromMessages(messages);
      
      // Build LIVE transcript from messages for UI display (includes interim)
      const newLiveTranscript = buildLiveTranscriptFromMessages(messages);
      
      // Update stored transcript if changed
      const prevStored = storedTranscript;
      const prevStoredLen = prevStored.length;
      const nextStoredLen = newStoredTranscript.length;
      const storedChanged = nextStoredLen !== prevStoredLen || (nextStoredLen > 0 && (prevStored[nextStoredLen - 1]?.id !== newStoredTranscript[nextStoredLen - 1]?.id));
      if (storedChanged) {
        setStoredTranscript(newStoredTranscript);
      }
      
      // Update live transcript if changed
      const prevLive = liveTranscript;
      const prevLiveLen = prevLive.length;
      const nextLiveLen = newLiveTranscript.length;
      const liveChanged = nextLiveLen !== prevLiveLen || (nextLiveLen > 0 && (prevLive[nextLiveLen - 1]?.id !== newLiveTranscript[nextLiveLen - 1]?.id));
      if (liveChanged) {
        setLiveTranscript(newLiveTranscript);
      }
      
      console.log("💾 Updated transcripts via global manager:", {
        messagesProcessed: messages.length,
        storedTranscriptEntries: newStoredTranscript.length,
        liveTranscriptEntries: newLiveTranscript.length,
        interimInLive: newLiveTranscript.filter(e => e.isInterim).length,
        processedEntries: processedEntries.length,
        masterTranscriptLength: transcriptEvaluator.getMasterTranscript().length,
        isCallActive,
        preservationMode: "DUAL_TRANSCRIPT_SYSTEM"
      });
      
      // Store final transcript in session storage as additional backup
      try {
        sessionStorage.setItem(`transcript_backup_${sessionId}` || 'transcript_backup_default', JSON.stringify(newStoredTranscript));
        console.log("💾 Backup transcript saved to session storage");
      } catch (error) {
        console.warn("Failed to backup transcript to session storage:", error);
      }
    }
  }, [messages, isCallActive, sessionId, storedTranscript, liveTranscript, globalManager]);

  // Periodic transcript backup during active interviews
  useEffect(() => {
    let backupInterval: NodeJS.Timeout;
    
    if (isCallActive && sessionId) {
      // Backup transcript every 30 seconds during active interview
      backupInterval = setInterval(async () => {
        // Always use the master transcript (append-only, always complete)
        const masterTranscript = transcriptEvaluator.getMasterTranscript();
        const fallbackTranscript = storedTranscript.length > 0 
          ? storedTranscript 
          : buildTranscriptFromMessages(currentMessagesRef.current);
        
        const currentTranscript = masterTranscript.length > 0 ? masterTranscript : fallbackTranscript;
        
        if (currentTranscript.length > 0) {
          try {
            const { upsertInterviewSession } = await import("@/utils/supabase-client");
            await upsertInterviewSession({
              session_id: sessionId,
              live_transcript_data: currentTranscript,
              updated_at: new Date().toISOString()
            });
            console.log("💾 Periodic transcript backup completed:", {
              transcriptEntries: currentTranscript.length,
              sourceType: masterTranscript.length > 0 ? "MASTER_TRANSCRIPT" : "FALLBACK_STORED"
            });
          } catch (error) {
            console.warn("Failed to backup transcript periodically:", error);
          }
        }
      }, 5000); // Every 5 seconds (was 30000)
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

      // Start periodic evaluation - evaluator uses its master transcript (append-only)
      transcriptEvaluator.startPeriodicEvaluation(() => {
        // The evaluator will use its internal master transcript (updated via appendToMasterTranscript)
        const masterTranscript = transcriptEvaluator.getMasterTranscript();
        console.log("📋 [CHAT] Evaluator using master transcript:", {
          masterLength: masterTranscript.length,
          sourceType: "MASTER_APPEND_ONLY"
        });
        return masterTranscript;
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
      
      // 🧹 SINGLE POINT MEDIA CLEANUP: Clean up all media streams when interview ends
      try {
        console.log("🧹 [END SCREEN] Starting comprehensive media cleanup...");
        
        // 1. Stop recording via existing system
        window.dispatchEvent(new CustomEvent("app:force-stop-recording"));
        
        // 2. Clean up video stream
        const videoStream = videoRef.current?.getStream();
        if (videoStream) {
          videoStream.getTracks().forEach((track: MediaStreamTrack) => {
            console.log("🎥 [END SCREEN] Stopping video track:", track.label);
            track.stop();
          });
        }
        
        // 3. Clean up assistant audio bus
        if (assistantBus) {
          console.log("🔊 [END SCREEN] Closing assistant audio bus");
          assistantBus.close();
        }
        
        // 4. Clean up audio context (suspend to free resources)
        if (audioCtx && audioCtx.state !== 'closed') {
          console.log("🎵 [END SCREEN] Suspending audio context");
          audioCtx.suspend();
        }
        
        // 5. Clear any global video functions
        if ((window as any).__toggleCamera) {
          delete (window as any).__toggleCamera;
        }
        if ((window as any).__isCameraOn) {
          delete (window as any).__isCameraOn;
        }
        
        console.log("✅ [END SCREEN] Media cleanup completed - browser indicator should disappear");
      } catch (cleanupError) {
        console.warn("⚠️ [END SCREEN] Media cleanup had minor issues:", cleanupError);
      }
      
      setIsCallActive(false);
      
      // Immediately close exhibit when call ends
      if (exhibitManager) {
        exhibitManager.closeExhibit();
        console.log("🔚 Closed exhibit immediately on call end");
      }
      
      // EMERGENCY SAVE - Immediate sync save before async processing
      console.log("🚨 [EMERGENCY SAVE] Starting emergency save on disconnect");
      try {
        // Force process any queued messages first
        const finalQueuedEntries = globalManager.flushSession(sessionId);
        console.log(`🚨 [EMERGENCY SAVE] Flushed ${finalQueuedEntries.length} queued entries`);
        
        // Get complete transcript from evaluator
        const emergencyTranscript = transcriptEvaluator.getMasterTranscript();
        
        // Immediate sync save to sessionStorage
        const emergencyData = {
          transcript: emergencyTranscript,
          timestamp: Date.now(),
          reason: 'disconnect'
        };
        sessionStorage.setItem(
          `emergency_disconnect_${sessionId}`,
          JSON.stringify(emergencyData)
        );
        
        // Emergency save via storage service
        globalManager.emergencySave(sessionId).catch(e => {
          console.error("🚨 [EMERGENCY SAVE] Async save failed:", e);
        });
        
        console.log(`🚨 [EMERGENCY SAVE] Completed sync save of ${emergencyTranscript.length} entries`);
      } catch (e) {
        console.error("🚨 [EMERGENCY SAVE] Failed:", e);
      }
      
      // Immediately preserve transcript data before anything gets cleared
      const preservedTranscript = storedTranscript.length > 0 
        ? storedTranscript 
        : currentMessagesRef.current.length > 0 
          ? buildTranscriptFromMessages(currentMessagesRef.current)
          : buildTranscriptFromMessages(messages);
      
      console.log("🔚 Preserved transcript:", preservedTranscript.length, "entries");
      console.log("🔚 Emergency save completed, proceeding with normal end flow");
      
      // Process end interview data immediately (no delay)
      handleEndInterviewWithData(preservedTranscript);
      setHasBeenConnected(false); // Reset for next interview
    }
  }, [status.value, isCallActive, storedTranscript, hasBeenConnected, exhibitManager, isEndingInterview]);

  // Add page unload handler for guaranteed save
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isCallActive) {
        console.log('🚨 [PAGE UNLOAD] Interview in progress, forcing emergency save');
        
        try {
          // Force synchronous save of any queued data
          globalManager.flushSession(sessionId);
          
          // Get complete transcript
          const transcript = transcriptEvaluator.getMasterTranscript();
          
          // Synchronous localStorage save via storage service
          storageService.emergencySave(transcript).catch(() => {
            // If async fails, do sync save to sessionStorage
            const emergencyData = {
              transcript,
              timestamp: Date.now(),
              reason: 'beforeunload'
            };
            sessionStorage.setItem(`emergency_unload_${sessionId}`, JSON.stringify(emergencyData));
          });
          
          // Use sendBeacon for guaranteed server delivery
          if (navigator.sendBeacon) {
            const transcriptBlob = new Blob([JSON.stringify({
              sessionId,
              entries: transcript,
              timestamp: Date.now(),
              reason: 'page_unload'
            })], {type: 'application/json'});
            
            navigator.sendBeacon('/api/transcript/emergency-save', transcriptBlob);
            
            // Also end the session in the database with duration
            const sessionDuration = transcript.length > 0 ? 
              Math.max(...transcript.map(e => e.timestamp)) : 0;
            
            const sessionBlob = new Blob([JSON.stringify({
              sessionId,
              duration: sessionDuration,
              reason: 'page_unload'
            })], {type: 'application/json'});
            
            navigator.sendBeacon('/api/sessions/emergency-end', sessionBlob);
          }
          
          console.log(`🚨 [PAGE UNLOAD] Emergency save completed for ${transcript.length} entries`);
        } catch (error) {
          console.error('🚨 [PAGE UNLOAD] Emergency save failed:', error);
        }
        
        e.preventDefault();
        e.returnValue = 'Interview in progress. Are you sure you want to leave?';
        return e.returnValue;
      }
    };
    
    const handlePageHide = () => {
      if (isCallActive) {
        console.log('🚨 [PAGE HIDE] Emergency save on page hide');
        try {
          globalManager.flushSession(sessionId);
          const transcript = transcriptEvaluator.getMasterTranscript();
          const emergencyData = {
            transcript,
            timestamp: Date.now(),
            reason: 'pagehide'
          };
          sessionStorage.setItem(`emergency_hide_${sessionId}`, JSON.stringify(emergencyData));
          
          // Also try to end the session
          const sessionDuration = transcript.length > 0 ? 
            Math.max(...transcript.map(e => e.timestamp)) : 0;
          
          if (navigator.sendBeacon) {
            const sessionBlob = new Blob([JSON.stringify({
              sessionId,
              duration: sessionDuration,
              reason: 'page_hide'
            })], {type: 'application/json'});
            
            navigator.sendBeacon('/api/sessions/emergency-end', sessionBlob);
          }
        } catch (error) {
          console.error('🚨 [PAGE HIDE] Emergency save failed:', error);
        }
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
    };
  }, [isCallActive, sessionId, globalManager, transcriptEvaluator, storageService]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup global manager session
      globalManager.cleanupSession(sessionId);
    };
  }, [sessionId, globalManager]);

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
          
          // Use the MASTER transcript (append-only, always complete)
          const masterTranscript = transcriptEvaluator.getMasterTranscript();
          console.log("💾 Using MASTER transcript for storage:", {
            storedTranscriptLength: storedTranscript.length,
            masterTranscriptLength: masterTranscript.length,
            usingMasterTranscript: true
          });
          
          const success = await storeEndScreenData(
            sessionId,
            masterTranscript, // Use MASTER transcript (append-only, always complete)
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

  // Set analysisCompletedAt when both MBB analyses are complete
  useEffect(() => {
    if (mbbReportCompleted && mbbAssessmentCompleted && !analysisCompletedAt) {
      const completionTime = Date.now();
      setAnalysisCompletedAt(completionTime);
      console.log("📊 [ANALYSIS] Both MBB analyses completed at:", new Date(completionTime).toISOString());
    }
  }, [mbbReportCompleted, mbbAssessmentCompleted, analysisCompletedAt]);

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

  // (moved to ClientComponent) Auto-open exhibits when AI tool calls create them

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
      
      // 🧹 SINGLE POINT MEDIA CLEANUP: Ensure cleanup happens here too (backup location)
      if (!showEndScreen) { // Only if not already cleaned up
        try {
          console.log("🧹 [END BACKUP] Additional media cleanup check...");
          
          // Clean up video stream if still active
          const videoStream = videoRef.current?.getStream();
          if (videoStream && videoStream.getTracks().some((track: MediaStreamTrack) => track.readyState === 'live')) {
            videoStream.getTracks().forEach((track: MediaStreamTrack) => {
              console.log("🎥 [END BACKUP] Stopping remaining video track:", track.label);
              track.stop();
            });
          }
          
          // Suspend audio context if still running
          if (audioCtx && audioCtx.state === 'running') {
            console.log("🎵 [END BACKUP] Suspending audio context");
            audioCtx.suspend();
          }
          
          console.log("✅ [END BACKUP] Additional cleanup completed");
        } catch (cleanupError) {
          console.warn("⚠️ [END BACKUP] Cleanup had minor issues:", cleanupError);
        }
      }
      
      setShowEndScreen(true); // Ensure it's set (may already be set)
      try {
        window.dispatchEvent(new CustomEvent("app:force-stop-recording"));
      } catch {}
      
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
            
            // Save to database for permanent storage
            fetch('/api/sessions/update-mbb-report', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: sessionId,
                mbbReportData: mbbReport
              })
            }).then(dbResponse => {
              if (dbResponse.ok) {
                console.log("✅ [DATABASE] MBB Report saved to database");
              } else {
                console.warn("⚠️ [DATABASE] Failed to save MBB Report to database");
              }
            }).catch(dbError => {
              console.warn("⚠️ [DATABASE] Error saving MBB Report:", dbError);
            });
            
            // Trigger custom event to notify InterviewEndScreen
            window.dispatchEvent(new CustomEvent('mbb-report-ready', { detail: { sessionId, data: mbbReport } }));
            
            // Mark MBB report as completed for feedback form timing
            setMbbReportCompleted(true);
            console.log("📊 [ANALYSIS] MBB Report completed successfully");
          } else {
            console.warn("⚠️ [BACKGROUND] MBB Report generation failed");
            // Still mark as completed even if failed, to avoid blocking feedback form
            setMbbReportCompleted(true);
          }
        }).catch(error => {
          console.warn("⚠️ [BACKGROUND] MBB Report error:", error);
          // Mark as completed even on error to avoid blocking feedback form
          setMbbReportCompleted(true);
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
            
            // Save to database
            const scores = [
              mbbAssessment.structure_problem_architecture?.score || 0,
              mbbAssessment.analytical_rigor_quantitative_fluency?.score || 0,
              mbbAssessment.insight_generation_business_acumen?.score || 0,
              mbbAssessment.communication_precision_dialogue_management?.score || 0,
              mbbAssessment.adaptive_thinking_intellectual_courage?.score || 0
            ];
            const overallScore = parseFloat((scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1));
            
            fetch('/api/sessions/update-mbb-assessment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                sessionId: sessionId,
                mbbAssessmentData: mbbAssessment,
                overallScore: overallScore
              })
            }).then(dbResponse => {
              if (dbResponse.ok) {
                console.log("✅ [DATABASE] MBB Assessment saved to database");
              } else {
                console.warn("⚠️ [DATABASE] Failed to save MBB Assessment to database");
              }
            }).catch(dbError => {
              console.warn("⚠️ [DATABASE] Error saving MBB Assessment:", dbError);
            });
            
            // Trigger custom event to notify InterviewEndScreen
            window.dispatchEvent(new CustomEvent('mbb-assessment-ready', { detail: { sessionId, data: mbbAssessment } }));
            
            // Mark MBB assessment as completed for feedback form timing
            setMbbAssessmentCompleted(true);
            console.log("📊 [ANALYSIS] MBB Assessment completed successfully");
          } else {
            console.warn("⚠️ [BACKGROUND] MBB Assessment generation failed");
            // Still mark as completed even if failed, to avoid blocking feedback form
            setMbbAssessmentCompleted(true);
          }
        }).catch(error => {
          console.warn("⚠️ [BACKGROUND] MBB Assessment error:", error);
          // Mark as completed even on error to avoid blocking feedback form
          setMbbAssessmentCompleted(true);
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

  // Expose a global toggle function for Controls' coach button
  useEffect(() => {
    (window as any).handleGlobalCoachingToggle = () => handleCoachingToggle(!coachingMode);
    return () => { delete (window as any).handleGlobalCoachingToggle };
  }, [coachingMode]);

  // Expose camera controls for bottom Controls bar (off-the-shelf style integration)
  useEffect(() => {
    (window as any).__toggleCamera = async () => {
      try {
        const stream = videoRef.current?.getStream();
        const hasTrack = !!stream && stream.getVideoTracks().length > 0;
        if (hasTrack) {
          videoRef.current?.stopVideo();
        } else {
          await videoRef.current?.startVideo();
        }
      } catch (e) {
        console.error("Camera toggle failed", e);
      }
    };
    (window as any).__isCameraOn = () => {
      try {
        const stream = videoRef.current?.getStream();
        if (!stream) return false;
        const track = stream.getVideoTracks()[0];
        return !!track && track.readyState === 'live' && track.enabled !== false;
      } catch {
        return false;
      }
    };
    return () => {
      delete (window as any).__toggleCamera;
      delete (window as any).__isCameraOn;
    };
  }, []);

  // Stop camera when interview ends or call becomes inactive
  useEffect(() => {
    if (showEndScreen || !isCallActive) {
      try {
        videoRef.current?.stopVideo();
      } catch (e) {
        console.warn("Camera stop failed (non-critical)", e);
      }
    }
  }, [showEndScreen, isCallActive]);

  // Belt-and-suspenders: force-stop recording when end screen appears
  useEffect(() => {
    if (showEndScreen) {
      try {
        window.dispatchEvent(new CustomEvent("app:force-stop-recording"));
      } catch {}
    }
  }, [showEndScreen]);

  // Initialize PiP position to bottom-right with safe margins
  useEffect(() => {
    const setInitial = () => {
      const stage = stageRef.current;
      const pip = pipRef.current;
      if (!stage || !pip) return;
      const stageRect = stage.getBoundingClientRect();
      const pipRect = pip.getBoundingClientRect();
      const safe = { left: 16, top: 16, right: 16, bottom: 120 };
      // Try restore from sessionStorage first
      try {
        const raw = sessionStorage.getItem(sessionStorageKey);
        if (raw) {
          const saved = JSON.parse(raw);
          const clampedX = Math.min(
            Math.max(safe.left, saved.x ?? 0),
            stageRect.width - pipRect.width - safe.right
          );
          const clampedY = Math.min(
            Math.max(safe.top, saved.y ?? 0),
            stageRect.height - pipRect.height - safe.bottom
          );
          setPipPos({ x: clampedX, y: clampedY });
          setHasCustomPipPos(true);
          return;
        }
      } catch {}
      // Default to bottom-right
      const x = stageRect.width - pipRect.width - safe.right;
      const y = stageRect.height - pipRect.height - safe.bottom;
      setPipPos({ x: Math.max(safe.left, x), y: Math.max(safe.top, y) });
    };
    setTimeout(setInitial, 0);
    window.addEventListener('resize', setInitial);
    return () => window.removeEventListener('resize', setInitial);
  }, [sessionStorageKey]);

  // Determine speaking state from mic FFT
  useEffect(() => {
    if (!micFft || micFft.length === 0 || isMuted) { setIsSpeaking(false); return; }
    const sample = micFft.slice(0, Math.min(16, micFft.length));
    const max = sample.reduce((m, v) => v > m ? v : m, 0);
    // Simple noise gate: require max above a slightly higher threshold and at least 2 bins above gate
    const gate = 0.3; // filter out little noises
    const countAbove = sample.filter(v => v > gate).length;
    setIsSpeaking(max > gate && countAbove >= 2);
  }, [micFft, isMuted]);

  // Assistant speaking indicator – glow the interviewer window on new assistant messages (throttled)
  useEffect(() => {
    try {
      const types = messages.map((m: any) => m.type);
      const idx = types.lastIndexOf("assistant_message");
      if (idx > lastAssistantIndexRef.current) {
        lastAssistantIndexRef.current = idx;
        const now = performance.now();
        // Avoid re-triggering too frequently on rapid message bursts
        if (now - assistantLastTriggerMsRef.current > 400) {
          assistantLastTriggerMsRef.current = now;
          setAssistantSpeaking(true);
          const t = setTimeout(() => setAssistantSpeaking(false), 900);
          return () => clearTimeout(t);
        }
      }
    } catch {}
    return undefined;
  }, [messages]);

  // PiP dragging with safe zones
  // Using react-draggable for off-the-shelf PiP dragging
  // No custom pip dragging; keep static bottom-right per simple conferencing UI

  return (
    <>
      {showEndScreen ? (
        <InterviewEndScreen
          sessionId={sessionId}
          duration={endScreenDuration}
          messageCount={storedTranscript.length}
          hasRecording={!!finalVideoUrl}
          hasTranscript={storedTranscript.length > 0}
          finalVideoUrl={finalVideoUrl}
          detailedEvaluation={undefined}
          transcript={endScreenTranscript}
          transcriptText={endScreenTranscriptText}
          onStartNewInterview={() => {
            window.location.href = "/interview/setup";
          }}
          onViewTranscript={() => downloadTranscript('txt')}
          onViewDashboard={() => {
            window.location.href = "/dashboard";
          }}
        />
      ) : showVideoReview ? (
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
        <div className={cn("relative grow h-full min-h-0", primaryExhibit ? "" : "flex items-center justify-center p-4")}>        
          {primaryExhibit ? (
            <>
              {/* Exhibit-first layout */}
              <div className="h-full w-full flex items-center justify-center p-4">
                {primaryExhibit?.image_url ? (
                  <div className="w-full max-w-[1400px] aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
                    <img
                      src={primaryExhibit.image_url}
                      alt={primaryExhibit.description || primaryExhibit.display_name || "Exhibit"}
                      className="w-full h-full object-contain bg-black"
                      loading="eager"
                    />
                  </div>
                ) : (
                  <div className="w-full max-w-[1400px] aspect-video bg-black rounded-xl overflow-hidden shadow-2xl flex items-center justify-center">
                    <span className="text-white/80 text-sm">Exhibit asset missing (no image_url)</span>
                  </div>
                )}
              </div>

              {/* Videos stack (top-right) */}
              <div className="absolute top-4 right-4 flex flex-col gap-3 z-20">
                {/* Interviewer tile */}
                <div ref={stageRef} className={cn(
                  "w-48 aspect-video bg-black rounded-xl overflow-hidden shadow-2xl",
                  assistantSpeaking ? "ring-4 ring-blue-400" : "ring-0"
                )}>
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-gray-700/60 text-white flex items-center justify-center">
                      <span>👤</span>
              </div>
                  </div>
              </div>
              
                {/* User tile */}
                <div ref={pipRef} className={cn(
                  "w-48 aspect-video bg-black rounded-xl overflow-hidden shadow-2xl",
                  !assistantSpeaking && isSpeaking ? "ring-4 ring-blue-400" : "ring-0"
                )}>
                  <VideoInput ref={videoRef} autoStart={isCallActive} preferredDeviceId={selectedDevices?.cameraId} />
                </div>
              </div>
            </>
          ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[1728px]">
          {/* Interviewer window */}
          <div ref={stageRef} className={cn(
            "relative bg-black rounded-xl overflow-hidden shadow-2xl aspect-video",
            assistantSpeaking ? "ring-4 ring-blue-400" : "ring-0"
          )}>
            {/* Stage label */}
            <div className="absolute top-3 left-3 z-10">
              <span className="px-2 py-1 text-[11px] font-medium rounded-full bg-white/80 backdrop-blur text-gray-900 border">Interviewer</span>
            </div>
            {/* Placeholder avatar (no effects) */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-24 w-24 rounded-full bg-gray-700/60 text-white flex items-center justify-center">
                <span className="text-2xl">👤</span>
              </div>
            </div>
          </div>

          {/* User window */}
          <div ref={pipRef} className={cn(
            "relative rounded-xl overflow-hidden shadow-2xl bg-black aspect-video",
            !assistantSpeaking && isSpeaking ? "ring-4 ring-blue-400" : "ring-0"
          )}>
            <VideoInput ref={videoRef} autoStart={isCallActive} preferredDeviceId={selectedDevices?.cameraId} />
            </div>

          {/* Collapsible sidebar trigger handled by top-right icon */}
          {/* Gear (devices) next to transcript button */}
          {/* Controls moved to page-level fixed container (see below) */}
          </div>
          )}
          {/* Page-level controls: Top-right of the page, not inside video window */}
          {!showEndScreen && (
            <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
              <button
                onClick={() => handleCoachingToggle(!coachingMode)}
                className={cn("p-2 rounded-full border shadow bg-white/90 backdrop-blur transition-colors hover:bg-white", coachingMode && "bg-blue-600 text-white hover:bg-blue-700")}
                title="Hints (Coach)"
              >
                <GraduationCap className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsTranscriptDrawerOpen(true)}
                className="p-2 rounded-full border shadow bg-white/90 backdrop-blur transition-colors hover:bg-white"
                title="View transcript"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                onClick={onOpenDeviceSetup}
                className="p-2 rounded-full border shadow bg-white/90 backdrop-blur transition-colors hover:bg-white"
                title="Device settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          )}

          <TranscriptDrawer
            isOpen={isTranscriptDrawerOpen}
            onClose={() => setIsTranscriptDrawerOpen(false)}
            transcript={transcriptDrawerData}
            onSeekVideo={(timestamp) => {
              console.log("🎯 [LIVE TRANSCRIPT] Seeking to timestamp:", timestamp);
              // Store timestamp for video component to pick up
              sessionStorage.setItem('seekToTimestamp', timestamp.toString());
              // Trigger custom event for video components to listen to
              window.dispatchEvent(new CustomEvent('seekToTimestamp', { 
                detail: { timestamp } 
              }));
            }}
            hintsContent={(
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Coaching</span>
                    <Toggle
                      size="sm"
                      pressed={coachingMode}
                      disabled={isUpdatingCoaching}
                      onPressedChange={handleCoachingToggle}
                    className={cn("h-5 w-9 p-0", coachingMode ? "bg-blue-500 data-[state=on]:bg-blue-500" : "bg-gray-200 dark:bg-gray-700")}
                  >
                    <GraduationCap className={cn("h-2.5 w-2.5", coachingMode ? "text-white" : "text-gray-500 dark:text-gray-400")} />
                    </Toggle>
                  </div>
                <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isCallActive && liveFeedbackEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  Live Hints
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{liveFeedbackEnabled ? 'On' : 'Off'}</span>
                    <Switch checked={liveFeedbackEnabled} onCheckedChange={setLiveFeedbackEnabled} />
                </div>
              </div>
              {liveFeedbackEnabled ? (
                <FeedbackDisplay ref={feedbackDisplayRef} />
              ) : (
                <div className="text-center py-3 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="text-xs text-gray-400 dark:text-gray-600">Hints disabled</div>
                </div>
              )}
            </div>
            )}
          />
        </div>
      )}

      {/* Voice Controls - Fixed at bottom */}
      {!showEndScreen && (
        <div className="relative">
          <Controls />
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
    const exhibit = unlockedExhibits.find(e => e.id === exhibitId || e.exhibit_id === exhibitId);
    if (exhibit) {
      console.log("🎬 Embedding exhibit from sidebar:", exhibit.display_name || exhibit.exhibit_name);
      setPrimaryExhibit(exhibit);
      setExpandedExhibit(null);
    } else {
      console.warn("Exhibit ID not found in unlocked list:", exhibitId);
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
  
  // Auto-embed newly unlocked exhibits (parent level)
  useEffect(() => {
    if (!unlockedExhibits || unlockedExhibits.length === 0) return;
    const newestAuto = unlockedExhibits.find((e: any) => e?.auto_displayed);
    if (newestAuto && (!primaryExhibit || primaryExhibit.id !== newestAuto.id)) {
      console.log("🎬 Embedding unlocked exhibit:", newestAuto.display_name || newestAuto.exhibit_name);
      setPrimaryExhibit({ ...newestAuto, auto_displayed: false });
    }
  }, [unlockedExhibits, primaryExhibit]);
  
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
            hasContent: !!msg?.message?.content,
            contentSnippet: msg?.message?.content?.substring?.(0, 30) || undefined,
            isInterim: msg?.interim,
            timestampIso: new Date().toISOString(),
            tag: "HUME_STREAM"
          });
          
          // CRITICAL: Capture the very first interim message here (before it gets to messages array)
          if (msg?.type === "user_message" && msg.interim === true && msg?.message?.content) {
            const content = msg.message.content.trim();
            console.log(`🎤 [ONMESSAGE INTERIM] Received interim: "${content.substring(0, 30)}..."`);
            
            // Store in a simple global variable for ChatInterface to pick up
            if (!(window as any).__currentUserStartTime) {
              const now = Date.now();
              (window as any).__currentUserStartTime = now;
              (window as any).__currentUserStartContent = content.substring(0, 10); // For debugging
              console.log(`🎤 [FIRST INTERIM CAPTURED] Very first interim at ${new Date(now).toISOString()}`);
            }
          }

          // 🏁 FINAL USER MESSAGE HANDLING
          if (msg?.type === "user_message" && msg.interim === false) {
            const finalAbs = Date.now();
            const firstAbs = (window as any).__currentUserStartTime as number | undefined;
            if (firstAbs) {
              // Convert first interim absolute time to relative seconds manually
              const currentRecordingStart = ((window as any).__getRelativeTime)?.(Date.now()) !== undefined ?
                Date.now() - (((window as any).__getRelativeTime)?.(Date.now()) * 1000) : null;
              const firstRel = currentRecordingStart ? 
                Math.max(0, Math.floor((firstAbs - currentRecordingStart) / 1000)) : 
                0;
              // Persist mapping of *this* final absolute ms → first interim relative seconds
              updateInterimCache(sessionId, finalAbs, firstRel);

              console.log("🗂️ [INTERIM→FINAL MAP STORED]", {
                tag: "HUME_STREAM",
                finalAbs,
                firstAbs,
                firstRel,
                contentSnippet: msg?.message?.content?.substring?.(0, 30) || undefined
              });

              // Clear globals for next turn
              delete (window as any).__currentUserStartTime;
              delete (window as any).__currentUserStartContent;
            } else {
              console.log("⚠️ [NO INTERIM FOUND BEFORE FINAL]", {
                tag: "HUME_STREAM",
                finalAbs,
                contentSnippet: msg?.message?.content?.substring?.(0, 30) || undefined
              });
            }
          }

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
