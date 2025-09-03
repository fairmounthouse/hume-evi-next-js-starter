"use client";
import { cn } from "@/utils";
import { useVoice } from "@humeai/voice-react";
import Expressions from "./Expressions";
import { AnimatePresence, motion } from "framer-motion";
import { ComponentRef, forwardRef } from "react";
import { useRecordingAnchor } from "@/hooks/useRecordingAnchor";

const Messages = forwardRef<
  ComponentRef<typeof motion.div>,
  Record<never, never>
>(function Messages(_, ref) {
  const { messages } = useVoice();
  const { getRelativeTime, formatRelativeTime } = useRecordingAnchor();

  return (
    <motion.div
      layoutScroll
      className={"p-4 pt-24"}
      ref={ref}
    >
      <motion.div
        className={"max-w-2xl mx-auto w-full flex flex-col gap-4 pb-24"}
      >
        <AnimatePresence mode={"popLayout"}>
          {messages.map((msg, index) => {
            if (
              msg.type === "user_message" ||
              msg.type === "assistant_message"
            ) {
              const isInterim = (msg as any).interim === true;
              const isUserMessage = msg.type === "user_message";
              
              // For user messages, try to get first interim timestamp from globals
              let displayTimestamp = msg.receivedAt?.getTime() || Date.now();
              if (isUserMessage && !isInterim) {
                // For final user messages, check if we have a cached first interim
                const interimCache: Record<number, number> = (window as any).__firstInterimByFinalMs || {};
                const cachedFirstInterim = interimCache[displayTimestamp];
                if (cachedFirstInterim !== undefined && (window as any).__recordingStartTime) {
                  // Use the cached first interim relative seconds, convert back to absolute
                  const recordingStart = (window as any).__recordingStartTime;
                  displayTimestamp = recordingStart + (cachedFirstInterim * 1000);
                }
              } else if (isUserMessage && isInterim) {
                // For interim messages, use the global first interim time if available
                const firstInterimAbs = (window as any).__currentUserStartTime as number | undefined;
                if (firstInterimAbs) {
                  displayTimestamp = firstInterimAbs;
                }
              }
              
              // Use a stable key for interim messages so they update in place
              const messageKey = isInterim ? `${msg.type}_interim_${msg.message?.content?.length || 0}` : `${msg.type}_${index}`;
              
              return (
                <motion.div
                  key={messageKey}
                  className={cn(
                    "w-[80%]",
                    "bg-card",
                    "border border-border rounded-xl",
                    msg.type === "user_message" ? "ml-auto" : "",
                    isInterim && "opacity-70 border-dashed"
                  )}
                  initial={{
                    opacity: 0,
                    y: 10,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  exit={{
                    opacity: 0,
                    y: 0,
                  }}
                >
                  <div className={"flex items-center justify-between pt-4 px-3"}>
                    <div
                      className={cn(
                        "text-xs capitalize font-medium leading-none opacity-50 tracking-tight"
                      )}
                    >
                      {msg.message.role}
                      {isInterim && " (speaking...)"}
                    </div>
                    <div
                      className={cn(
                        "text-xs capitalize font-medium leading-none opacity-50 tracking-tight"
                      )}
                    >
                      {(() => {
                        const relativeSeconds = getRelativeTime(displayTimestamp);
                        const formatted = formatRelativeTime(relativeSeconds || 0);
                        
                        // Debug logging for first few messages
                        if (index < 3) {
                          console.log(`🕐 [MESSAGES UI] Timestamp debug ${index}:`, {
                            displayTimestamp,
                            relativeSeconds,
                            formatted,
                            msgReceivedAt: msg.receivedAt?.getTime(),
                            recordingStartTime: (window as any).__recordingStartTime
                          });
                        }
                        
                        // Ensure we always return a properly formatted timestamp
                        return formatted || "00:00";
                      })()}
                    </div>
                  </div>
                  <div className={"pb-3 px-3"}>
                    {msg.message.content}
                  </div>
                  <Expressions values={{ ...msg.models.prosody?.scores }} />
                </motion.div>
              );
            }

            return null;
          })}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
});

export default Messages;

