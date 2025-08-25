"use client";
import { useVoice } from "@humeai/voice-react";
import { Button } from "./ui/button";
import { Mic, MicOff, Phone, Volume2, VolumeX } from "lucide-react";
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
          "bg-gradient-to-t from-card via-card/90 to-card/0",
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
              "p-4 bg-card border border-border/50 rounded-full flex items-center gap-4"
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

            <div className={"relative grid h-8 w-48 shrink grow-0"}>
              <MicFFT fft={micFft} className={"fill-current"} />
            </div>

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
