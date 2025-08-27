import { useVoice } from "@humeai/voice-react";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "./ui/button";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { getCurrentPhaseInfo, getCaseMetadata } from "@/utils/session-context";
import { useUser } from "@clerk/nextjs";

export default function StartCall({
  configId,
  accessToken,
  sessionId,
  selectedCaseId,
  selectedInterviewerId,
  selectedDifficultyId,
  onCallStart,
}: {
  configId?: string;
  accessToken: string;
  sessionId: string;
  selectedCaseId?: string | null;
  selectedInterviewerId?: string | null;
  selectedDifficultyId?: string | null;
  onCallStart?: () => void;
}) {
  const { status, connect, sendSessionSettings } = useVoice();
  const { user } = useUser(); // Get current Clerk user

  // Track interview start time & phase with enhanced management
  const startTimeRef = useRef<number | null>(null);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0);
  const [lastPhaseUpdate, setLastPhaseUpdate] = useState<number>(0);

  // Enhanced context update with real-time phase detection
  const sendContextUpdate = async (temporaryContext?: string, forceUpdate = false) => {
    if (status.value !== "connected") {
      console.log("⚠️ Skipping context update - not connected to Hume");
      return;
    }

    console.log("🔄 Starting context update:", {
      hasTemporaryContext: !!temporaryContext,
      temporaryContextLength: temporaryContext?.length || 0,
      forceUpdate,
      connectionStatus: status.value
    });

    try {
      const { buildSessionSettings, initializeSessionSettings } = await import("@/utils/session-context");

      // Ensure session is initialized
      await initializeSessionSettings(sessionId);

      const elapsed = startTimeRef.current
        ? Date.now() - startTimeRef.current
        : 0;

      console.log("⏱️ Elapsed time calculation:", {
        startTime: startTimeRef.current,
        currentTime: Date.now(),
        elapsedMs: elapsed,
        elapsedMinutes: Math.round(elapsed / 60000 * 10) / 10
      });

      // Get current phase info for dynamic phase tracking
      const currentPhase = getCurrentPhaseInfo(sessionId, elapsed);
      
      console.log("📊 Phase detection result:", {
        hasCurrentPhase: !!currentPhase,
        phaseName: currentPhase?.phase?.name,
        phaseIndex: currentPhase?.index,
        previousPhaseIndex: currentPhaseIndex,
        phaseTransition: currentPhase?.index !== currentPhaseIndex
      });
      
      // Update local phase state if phase changed
      if (currentPhase && currentPhase.index !== currentPhaseIndex) {
        console.log(`🔄 PHASE TRANSITION DETECTED: ${currentPhaseIndex} → ${currentPhase.index} (${currentPhase.phase.name})`);
        setCurrentPhaseIndex(currentPhase.index);
        setLastPhaseUpdate(Date.now());
        forceUpdate = true; // Force update on phase transition
        console.log("🚨 Forcing update due to phase transition");
      }

      // Get current coaching state from Chat component (local state only)
      const currentCoachingMode = (window as any).__getCurrentCoachingMode ? (window as any).__getCurrentCoachingMode() : false;
      
      const sessionSettings = await buildSessionSettings(
        sessionId,
        elapsed,
        startTimeRef.current ? new Date(startTimeRef.current) : undefined,
        temporaryContext,
        currentCoachingMode // Use local coaching state (not database)
      );
      
      console.log("🎓 Using local coaching state for update:", {
        currentCoachingMode,
        source: "LOCAL_TOGGLE_STATE"
      });

      console.log("📤 About to send session settings to Hume:", {
        settingsSize: JSON.stringify(sessionSettings).length,
        hasVariables: !!sessionSettings.variables,
        hasContext: !!sessionSettings.context,
        contextLength: sessionSettings.context?.text?.length || 0
      });

      // Enhanced retry logic with better error handling
      const attemptSend = async (retry = false) => {
        try {
          console.log(`📡 Sending session settings to Hume (attempt ${retry ? 2 : 1})...`);
          await sendSessionSettings(sessionSettings as any);
          const phaseInfo = currentPhase ? ` [Phase ${currentPhase.index + 1}: ${currentPhase.phase.name}]` : '';
          console.log(`✅ Context update sent successfully${phaseInfo}`);
          console.log("📊 Update summary:", {
            elapsedTime: Math.round(elapsed / 60000 * 10) / 10 + " minutes",
            currentPhase: currentPhase?.phase?.name || "No phase",
            hasNudge: sessionSettings.context?.text?.includes("TIMING NUDGE") || false,
            contextPartsCount: sessionSettings.context?.text?.split('\n\n').length || 0
          });
        } catch (e) {
          if (!retry) {
            console.warn("⚠️ First attempt failed, retrying sendSessionSettings once", e);
            setTimeout(() => attemptSend(true), 1000);
          } else {
            console.error("❌ Failed to sendSessionSettings after retry", e);
          }
        }
      };

      attemptSend();
    } catch (err) {
      console.error("❌ Failed to send context update", err);
    }
  };

  // OLD SYSTEM APPROACH: 30-second timer triggers WHEN to send, but ALL values computed FRESH
  // - Static data (interviewer, case content) cached from database
  // - Dynamic data (time, phase, nudges) computed fresh every send
  // - This matches old system: timer = trigger, functions = fresh computation
  useEffect(() => {
    if (status.value !== "connected") {
      console.log("⏸️ Not starting periodic updates - not connected");
      return;
    }

    console.log("⏰ Starting periodic context updates (every 30 seconds - OLD SYSTEM PATTERN)");
    console.log("📋 ARCHITECTURE: Timer triggers WHEN to send, functions compute FRESH values");
    
    const interval = setInterval(() => {
      console.log("🔔 30-second timer triggered - computing FRESH values for Hume");
      sendContextUpdate(); // ALL time-sensitive values computed fresh (like old system)
    }, 30 * 1000); // Every 30 seconds (matching old system frequency)

    return () => {
      console.log("🛑 Stopping periodic context updates");
      clearInterval(interval);
    };
  }, [status.value, sessionId, sendSessionSettings]);

  // Initialize session settings when connection is established
  useEffect(() => {
    if (status.value === "connected" && !startTimeRef.current) {
      console.log("🚀 Connection established - initializing session settings");
      console.log("📍 Recording interview start time:", Date.now());
      startTimeRef.current = Date.now();
      
      // Send initial session settings immediately
      console.log("⏱️ Scheduling initial context update in 500ms...");
      setTimeout(() => {
        console.log("🎬 Sending initial context update with phase status");
        sendContextUpdate(); // Initial context with phase status
      }, 500); // Small delay to ensure connection is stable
    }
  }, [status.value]);

  // Expose functions globally for other components
  useEffect(() => {
    (window as any).__sendContextUpdate = sendContextUpdate;
    (window as any).__getInterviewElapsed = () => {
      return startTimeRef.current ? Date.now() - startTimeRef.current : 0;
    };
    (window as any).__getCurrentPhase = () => {
      const elapsed = startTimeRef.current ? Date.now() - startTimeRef.current : 0;
      return getCurrentPhaseInfo(sessionId, elapsed);
    };
    
    return () => {
      delete (window as any).__sendContextUpdate;
      delete (window as any).__getInterviewElapsed;
      delete (window as any).__getCurrentPhase;
    };
  }, [sendContextUpdate, sessionId]);

  return (
    <AnimatePresence>
      {status.value !== "connected" ? (
        <motion.div
          className={"fixed inset-0 p-4 flex items-center justify-center bg-background"}
          initial="initial"
          animate="enter"
          exit="exit"
          variants={{
            initial: { opacity: 0 },
            enter: { opacity: 1 },
            exit: { opacity: 0 },
          }}
        >
          <AnimatePresence>
            <motion.div
              variants={{
                initial: { scale: 0.5 },
                enter: { scale: 1 },
                exit: { scale: 0.5 },
              }}
            >
              <Button
                className={"z-50 flex items-center gap-1.5 rounded-full"}
                onClick={async () => {
                  console.log("🟢 START CALL BUTTON CLICKED");
                  console.log("📋 Interview configuration:", {
                    sessionId,
                    selectedCaseId,
                    selectedInterviewerId, 
                    selectedDifficultyId,
                    configId,
                    hasAccessToken: !!accessToken
                  });
                  
                  // Check if user has selected all required options
                  if (!selectedCaseId || !selectedInterviewerId || !selectedDifficultyId) {
                    console.error("❌ Missing required selections:", {
                      hasCaseId: !!selectedCaseId,
                      hasInterviewerId: !!selectedInterviewerId,
                      hasDifficultyId: !!selectedDifficultyId
                    });
                    toast.error("Please complete interview setup first");
                    window.location.href = "/interview/setup";
                    return;
                  }

                  // Start camera immediately
                  onCallStart?.();

                                try {
                // start timer
                startTimeRef.current = Date.now();

                // First: Create session record with selected interview configuration
                console.log("💾 Creating session record in database...");
                const { createSessionWithBilling } = await import("@/utils/supabase-client");
                
                // Get current user ID and email from Clerk
                const userId = user?.id || undefined;
                const userEmail = user?.emailAddresses?.[0]?.emailAddress || undefined;
                console.log("👤 Current user ID:", userId);
                
                const sessionData = {
                  session_id: sessionId,
                  started_at: new Date().toISOString(),
                  status: "in_progress" as const,
                  // Use selected configuration from setup screen
                  case_id: selectedCaseId || undefined,
                  interviewer_profile_id: selectedInterviewerId || undefined,
                  difficulty_profile_id: selectedDifficultyId || undefined,
                };

                console.log("📝 Session data to be created:", sessionData);
                
                const sessionCreated = await createSessionWithBilling(
                  sessionData, 
                  userId, 
                  userEmail
                );
                
                if (!sessionCreated) {
                  throw new Error("Failed to create session record");
                }

                console.log("✅ Session record created successfully");
                console.log("📋 Documents are already linked via session_id - no additional linking needed!");

                // Initialize session settings cache (fetch once from Supabase)
                console.log("🔄 Initializing session settings cache...");
                const { initializeSessionSettings, buildSessionSettings } = await import("@/utils/session-context");
                await initializeSessionSettings(sessionId);
                console.log("✅ Session settings cache initialized");

                // Build initial session settings (uses cached data + current time)
                // Coaching starts as disabled by default (local state only)
                console.log("🏗️ Building initial session settings...");
                const sessionSettings = await buildSessionSettings(
                  sessionId, 
                  0, 
                  undefined, 
                  undefined, 
                  false // Start with coaching disabled (local state)
                );
                console.log("✅ Initial session settings built:", {
                  hasVariables: !!sessionSettings.variables,
                  variableCount: Object.keys(sessionSettings.variables || {}).length,
                  hasContext: !!sessionSettings.context,
                  hasTranscription: !!sessionSettings.transcription,
                  initialCoachingMode: false
                });

                    console.log("🔌 Connecting to Hume with session settings...");
                    console.log("📤 Session settings being sent to Hume:", {
                      auth: { type: "accessToken", hasValue: !!accessToken },
                      configId,
                      sessionSettingsSize: JSON.stringify(sessionSettings).length,
                      sessionSettingsPreview: JSON.stringify(sessionSettings, null, 2).substring(0, 500) + "..."
                    });

                    await connect({
                      auth: { type: "accessToken", value: accessToken },
                      configId,
                      sessionSettings,
                    });

                    console.log("✅ CALL CONNECTED SUCCESSFULLY TO HUME");
                  } catch (err) {
                    console.error("❌ CALL FAILED:", err);
                    toast.error("Unable to start call");
                  }
                }}
              >
                <span>
                  <Phone
                    className={"size-4 opacity-50 fill-current"}
                    strokeWidth={0}
                  />
                </span>
                <span>Start Call</span>
              </Button>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
