"use client";

import { VoiceProvider } from "@humeai/voice-react";
import Messages from "./Messages";
import Controls from "./Controls";
import StartCall from "./StartCall";
import VideoInput, { VideoInputRef } from "./VideoInput";
import RecordingControls from "./RecordingControls";
import { ComponentRef, useRef, useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { AssistantAudioBus } from "@/utils/assistantAudio";

export default function ClientComponent({
  accessToken,
}: {
  accessToken: string;
}) {
  const timeout = useRef<number | null>(null);
  const ref = useRef<ComponentRef<typeof Messages> | null>(null);
  const videoRef = useRef<VideoInputRef | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [shouldAutoRecord, setShouldAutoRecord] = useState(true);
  const [forceShowRecording, setForceShowRecording] = useState(false);
  const [videoStreamReady, setVideoStreamReady] = useState(false);
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
  
  return (
    <div
      className={
        "relative grow flex flex-col mx-auto w-full overflow-hidden"
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
        <div className="grow flex flex-col md:flex-row gap-4 overflow-hidden relative">
          <div className="grow flex flex-col overflow-hidden">
            <Messages ref={ref} />
            <Controls />
            
            {/* Debug Panel - Remove this in production */}
            <div className="fixed bottom-4 right-4 z-50 bg-black/80 text-white p-2 rounded text-xs font-mono">
              <div>Call Active: {isCallActive ? "YES ✅" : "NO ❌"}</div>
              <div>Video Stream Ready: {videoStreamReady ? "YES ✅" : "NO ❌"}</div>
              <div>Video Ref: {videoRef.current ? "YES ✅" : "NO ❌"}</div>
              <div>Stream: {videoRef.current?.getStream() ? "YES ✅" : "NO ❌"}</div>
              <div>Auto Record: {shouldAutoRecord ? "YES ✅" : "NO ❌"}</div>
            </div>
            
            {(isCallActive || forceShowRecording) && (
              <div className="fixed top-4 left-4 z-50 bg-red-100 dark:bg-red-900 backdrop-blur-sm rounded-lg p-4 border-2 border-red-500 shadow-xl">
                <div className="mb-2 text-sm font-bold text-red-600 dark:text-red-400">🔴 RECORDING SESSION</div>
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
          </div>
          <div className="w-full md:w-80 flex-shrink-0 p-4 pt-4 md:pt-24">
            <VideoInput ref={videoRef} autoStart={isCallActive} />
          </div>
        </div>
        <StartCall 
          configId={configId} 
          accessToken={accessToken}
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
