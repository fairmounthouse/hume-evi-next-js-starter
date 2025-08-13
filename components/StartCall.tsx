import { useVoice } from "@humeai/voice-react";
import { AnimatePresence, motion } from "motion/react";
import { Button } from "./ui/button";
import { Phone } from "lucide-react";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";

export default function StartCall({
  configId,
  accessToken,
  sessionId,
  onCallStart,
}: {
  configId?: string;
  accessToken: string;
  sessionId: string;
  onCallStart?: () => void;
}) {
  const { status, connect, sendSessionSettings } = useVoice();

  // Track interview start time & phase locally
  const startTimeRef = useRef<number | null>(null);
  const [phaseStatus, setPhaseStatus] = useState<string>("intro");

  // Send context updates only when needed, not on a timer
  const sendContextUpdate = async (temporaryContext?: string) => {
    if (status.value !== "connected") return;

    try {
      const { buildSessionSettings } = await import("@/utils/session-context");

      const elapsed = startTimeRef.current
        ? Date.now() - startTimeRef.current
        : 0;

      const sessionSettings = await buildSessionSettings(
        sessionId,
        elapsed,
        phaseStatus,
        temporaryContext
      );

      // simple retry once on failure
      const attemptSend = async (retry = false) => {
        try {
          await sendSessionSettings(sessionSettings as any);
          console.log("✅ Context update sent successfully");
        } catch (e) {
          if (!retry) {
            console.warn("retrying sendSessionSettings once", e);
            setTimeout(() => attemptSend(true), 1000);
          } else {
            console.error("failed to sendSessionSettings", e);
          }
        }
      };

      attemptSend();
    } catch (err) {
      console.error("Failed to send context update", err);
    }
  };

  // Send updates every 2 minutes for elapsed time (much less frequent)
  useEffect(() => {
    if (status.value !== "connected") return;

    const interval = setInterval(() => {
      sendContextUpdate(); // Just update elapsed time
    }, 2 * 60 * 1000); // Every 2 minutes instead of 10 seconds

    return () => clearInterval(interval);
  }, [status.value, sessionId, phaseStatus, sendSessionSettings]);

  // Expose function to manually trigger updates (for phase changes, etc.)
  useEffect(() => {
    // You could add this to a global context or pass it up to parent
    (window as any).__sendContextUpdate = sendContextUpdate;
    return () => {
      delete (window as any).__sendContextUpdate;
    };
  }, [sendContextUpdate]);

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

                  // Start camera immediately
                  onCallStart?.();

                                try {
                // start timer
                startTimeRef.current = Date.now();

                // First: Get cached default profiles and create session record
                const { getCachedDefaultProfiles } = await import("@/utils/session-cache");
                const { upsertInterviewSession } = await import("@/utils/supabase-client");
                
                const defaultProfiles = await getCachedDefaultProfiles();
                await upsertInterviewSession({
                  session_id: sessionId,
                  started_at: new Date().toISOString(),
                  transcript_data: "",
                  coach_mode_enabled: false,
                  status: "in_progress",
                  ...defaultProfiles, // Use cached default IDs
                });

                console.log("✅ Session record created");

                // Initialize session settings cache (fetch once from Supabase)
                const { initializeSessionSettings, buildSessionSettings } = await import("@/utils/session-context");
                await initializeSessionSettings(sessionId);

                // Build initial session settings (uses cached data + current time)
                const sessionSettings = await buildSessionSettings(sessionId, 0, phaseStatus);

                    await connect({
                      auth: { type: "accessToken", value: accessToken },
                      configId,
                      sessionSettings,
                    });

                    console.log("✅ CALL CONNECTED SUCCESSFULLY");
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
