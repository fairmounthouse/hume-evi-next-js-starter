"use client";
import { useVoice } from "@humeai/voice-react";
import { Button } from "./ui/button";
import { Mic, MicOff, Phone, Volume2, VolumeX, GraduationCap, Settings } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Toggle } from "./ui/toggle";
import MicFFT from "./MicFFT";
import { cn } from "@/utils";

export default function Controls() {
  const { disconnect, status, isMuted, unmute, mute, micFft, isAudioMuted, muteAudio, unmuteAudio } = useVoice();
  
  // Audio status (removed spammy log)

  return (
    <div
      className={
        cn(
          "fixed bottom-0 left-0 w-full p-4 pb-6 flex items-center justify-center z-50",
          // Remove fade overlay and prevent container from blocking clicks behind it
          "pointer-events-none",
        )
      }
    >
      <AnimatePresence>
        {status.value === "connected" ? (
          <motion.div
            initial={{
              y: "100%",
              opacity: 0,
            }}
            animate={{
              y: 0,
              opacity: 1,
            }}
            exit={{
              y: "100%",
              opacity: 0,
            }}
            className={
              "p-4 bg-card border border-border/50 rounded-full flex items-center gap-4 pointer-events-auto"
            }
          >
            <Toggle
              className={"rounded-full"}
              pressed={!isMuted}
              onPressedChange={() => {
                if (isMuted) {
                  unmute();
                } else {
                  mute();
                }
              }}
            >
              {isMuted ? (
                <MicOff className={"size-4"} />
              ) : (
                <Mic className={"size-4"} />
              )}
            </Toggle>

            <Toggle
              className={"rounded-full"}
              pressed={!isAudioMuted}
              onPressedChange={() => {
                if (isAudioMuted) {
                  unmuteAudio();
                  console.log("🔊 Audio unmuted");
                } else {
                  muteAudio();
                  console.log("🔇 Audio muted");
                }
              }}
            >
              {isAudioMuted ? (
                <VolumeX className={"size-4"} />
              ) : (
                <Volume2 className={"size-4"} />
              )}
            </Toggle>

            {/* Camera toggle */}
            <Toggle
              className={"rounded-full"}
              pressed={(window as any).__isCameraOn ? (window as any).__isCameraOn() : false}
              onPressedChange={() => {
                try {
                  const fn = (window as any).__toggleCamera;
                  if (typeof fn === 'function') fn();
                } catch {}
              }}
              title={(window as any).__isCameraOn && (window as any).__isCameraOn() ? 'Turn camera off' : 'Turn camera on'}
            >
              {/* Simple camera glyph using mic icons is fine, but ideally a camera icon */}
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 8l5-3v14l-5-3v2H3V6h12v2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Toggle>

            <div className={"relative grid h-8 w-48 shrink grow-0"}>
              <MicFFT fft={micFft} className={"fill-current"} />
            </div>

            {/* Coach toggle next to End Call */}
            <Toggle
              className={"rounded-full bg-white transition-colors data-[state=on]:bg-blue-600 data-[state=on]:text-white"}
              pressed={(window as any).__getCurrentCoachingMode ? (window as any).__getCurrentCoachingMode() : false}
              onPressedChange={() => {
                try {
                  const toggle = (window as any).handleGlobalCoachingToggle;
                  if (typeof toggle === 'function') toggle();
                } catch {}
              }}
            >
              <GraduationCap className={"size-4"} />
            </Toggle>

            <Button
              className={"flex items-center gap-1 rounded-full"}
              onClick={async () => {
                console.log("🛑 END CALL BUTTON CLICKED - DISCONNECTING");
                // Proactively signal any recorders to stop & upload
                try {
                  window.dispatchEvent(new CustomEvent("app:force-stop-recording"));
                } catch {}
                // Disconnect (async per Hume SDK migration guide)
                try {
                  await disconnect();
                } catch (e) {
                  console.error("disconnect error", e);
                }
              }}
              variant={"destructive"}
            >
              <span>
                <Phone
                  className={"size-4 opacity-50 fill-current"}
                  strokeWidth={0}
                />
              </span>
              <span>End Call</span>
            </Button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
