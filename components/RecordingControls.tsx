"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRecording } from "@/hooks/useRecording";
import { uploadToCloudflare, formatDuration } from "@/utils/cloudflareUpload";
import { Button } from "./ui/button";
import { Circle, Square, Pause, Play, Upload, Loader2, Volume2 } from "lucide-react";
import { cn } from "@/utils";
import { toast } from "sonner";
import { useVoice } from "@humeai/voice-react";

interface RecordingControlsProps {
  videoStream: MediaStream | null;
  audioStream: MediaStream | null; // assistant stream
  audioCtx: AudioContext;
  isCallActive?: boolean;
  autoStart?: boolean;
  onRecordingComplete?: (videoId: string) => void;
}

export default function RecordingControls({
  videoStream,
  audioStream,
  audioCtx,
  isCallActive = false,
  autoStart = false,
  onRecordingComplete,
}: RecordingControlsProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [combinedStream, setCombinedStream] = useState<MediaStream | null>(null);
  const wasRecordingRef = useRef(false);
  const autoStopTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { status: voiceStatus } = useVoice();
  const startedAtMsRef = useRef<number | null>(null);
  const startTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const autoStartedRef = useRef(false);
  const suppressAutoStartRef = useRef(false);

  // Keep audio capture/mix alive for the session
  const tabCaptureRef = useRef<MediaStream | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(audioCtx);
  const mixDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const micGainRef = useRef<GainNode | null>(null);
  const micCompressorRef = useRef<DynamicsCompressorNode | null>(null);
  const [micGainValue, setMicGainValue] = useState(1);

  // Update gain in real-time when slider changes
  const handleGainChange = useCallback((newGain: number) => {
    setMicGainValue(newGain);
    if (micGainRef.current) {
      micGainRef.current.gain.value = newGain;
    }
  }, []);
  
  // Removed spammy log
  
  const {
    isRecording,
    isPaused,
    duration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    switchStream,
    error,
  } = useRecording();

  // Combine video and audio streams when available - handles camera on/off switching
  useEffect(() => {
    const combineStreams = async () => {
      console.log("RecordingControls: Checking streams", {
        hasVideoStream: !!videoStream,
        videoTracks: videoStream?.getVideoTracks().length || 0,
        audioTracks: videoStream?.getAudioTracks().length || 0,
        hasAssistantStream: !!audioStream,
        assistantTracks: audioStream?.getAudioTracks().length || 0,
        isCurrentlyRecording: isRecording,
      });
      
      if (!videoStream) {
        console.log("⚠️ No video stream available - clearing combined stream");
        setCombinedStream(null);
        return;
      }

      const tracks: MediaStreamTrack[] = [];
      
      // Add video tracks (handles both real camera and fallback canvas streams)
      videoStream.getVideoTracks().forEach(track => {
        console.log("Adding video track:", track.label, track.readyState, "enabled:", track.enabled);
        tracks.push(track);
      });
      
      // Prepare audio mix: assistant (prop) + microphone
      try {
        const assistant = audioStream && audioStream.getAudioTracks().length > 0 ? audioStream : null;
        let mic: MediaStream | null = null;
        try {
          mic = await navigator.mediaDevices.getUserMedia({        audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
        },});
        } catch (e) {
          console.log("Mic capture not granted");
        }

        if (assistant || mic) {
          const audioContext = audioContextRef.current;
          if (!audioContext) return;
          try { await audioContext.resume(); } catch {}
          const destination = (mixDestinationRef.current ||= audioContext.createMediaStreamDestination());
          if (assistant) {
            const aSrc = audioContext.createMediaStreamSource(assistant);
            aSrc.connect(destination);
          }
          if (mic) {
            micStreamRef.current = mic;
            const mSrc = audioContext.createMediaStreamSource(mic);
            mSrc.connect(destination);
          }
          const mixedTrack = destination.stream.getAudioTracks()[0];
          if (mixedTrack) {
            console.log("Adding mixed audio track:", mixedTrack.label, mixedTrack.readyState, {
              assistantTracks: assistant?.getAudioTracks().length || 0,
              micTracks: mic?.getAudioTracks().length || 0,
            });
            tracks.push(mixedTrack);
          } else {
            console.log("No mixed audio track produced");
          }
        } else {
          console.log("No audio sources available for mix");
        }
      } catch (err) {
        console.error("Could not get audio:", err);
        toast.error("Could not access microphone/assistant audio. Recording video only.");
      }
      
      if (tracks.length > 0) {
        const combined = new MediaStream(tracks);
        console.log("✅ Created combined stream with", tracks.length, "tracks", 
          isRecording ? "(during recording - will update MediaRecorder)" : "(ready for recording)");
        
        // If we're currently recording and the stream changed, switch to the new stream
        if (isRecording && combinedStream) {
          console.log("🔄 Video stream changed during recording - switching stream seamlessly");
          switchStream(combined);
          toast.info("Camera switched - recording updated instantly!");
        }
        
        setCombinedStream(combined);
      } else {
        console.log("⚠️ No tracks available - clearing combined stream");
        setCombinedStream(null);
      }
    };

    combineStreams();
  }, [videoStream, audioStream, isRecording]);

  const handleStartRecording = useCallback(async () => {
    console.log("🎬 handleStartRecording called", {
      hasCombinedStream: !!combinedStream,
      hasVideoStream: !!videoStream,
      isRecording,
    });
    
    // Guard: only start when voice is connected
    if (voiceStatus.value !== "connected") {
      console.log("⏸️ Skip start: voice status is not connected (", voiceStatus.value, ")");
      return;
    }
    
    // If no combined stream, try to create one now
    if (!combinedStream && videoStream) {
      console.log("🔧 No combined stream, creating one now from video stream...");
      const tracks: MediaStreamTrack[] = [];
      
      // Add video tracks
      videoStream.getVideoTracks().forEach(track => {
        console.log("Adding video track:", track.label);
        tracks.push(track);
      });
      
      // Try to get audio
      try {
        // Mix assistant (prop) + mic
        const assistantTracks = audioStream ? audioStream.getAudioTracks() : [];
        console.log("🎤 Assistant audio stream:", {
          hasStream: !!audioStream,
          trackCount: assistantTracks.length,
          tracks: assistantTracks.map(t => ({ label: t.label, readyState: t.readyState, enabled: t.enabled }))
        });
        
        const assistant = assistantTracks.length > 0 ? audioStream : null;
        let mic: MediaStream | null = null;
        try { 
          mic = await navigator.mediaDevices.getUserMedia({audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
        },});
          console.log("🎤 Got microphone stream");
        } catch (err) {
          console.log("🎤 Could not get microphone:", err);
        }

        if (assistant || mic) {
          const audioContext = audioContextRef.current;
          if (!audioContext) return;
          try { await audioContext.resume(); } catch {}
          const destination = (mixDestinationRef.current ||= audioContext.createMediaStreamDestination());
          
          if (mic) {
            // Create professional audio processing chain: Source -> Manual Gain -> Compressor -> Destination
            // This puts manual gain AFTER WebRTC's autoGainControl but BEFORE final compression
            const micSource = audioContext.createMediaStreamSource(mic);
            
            // Add manual gain control after WebRTC's AGC processing
            const micGain = audioContext.createGain();
            micGain.gain.value = micGainValue; // controlled by slider
            micGainRef.current = micGain;
            
            // Add DynamicsCompressor after manual gain for final polish
            const micCompressor = audioContext.createDynamicsCompressor();
            // MDN best practices for voice compression
            micCompressor.threshold.setValueAtTime(-24, audioContext.currentTime); // Start compression at -24dB
            micCompressor.knee.setValueAtTime(30, audioContext.currentTime);       // Smooth compression curve
            micCompressor.ratio.setValueAtTime(12, audioContext.currentTime);      // 12:1 ratio for voice
            micCompressor.attack.setValueAtTime(0.003, audioContext.currentTime);  // Fast attack (3ms)
            micCompressor.release.setValueAtTime(0.25, audioContext.currentTime);  // Medium release (250ms)
            micCompressorRef.current = micCompressor;
            
            // Connect the chain: WebRTC AGC → Manual Gain → Compressor → Destination
            micSource.connect(micGain);
            micGain.connect(micCompressor);
            micCompressor.connect(destination);
            console.log("🎤 Connected microphone via professional audio chain (gain after AGC, then compressor)");
          }
          
          if (assistant) {
            const assistantSource = audioContext.createMediaStreamSource(assistant);
            assistantSource.connect(destination);
            console.log("🎤 Connected assistant audio to destination");
          }
          
          const mixedTrack = destination.stream.getAudioTracks()[0];
          if (mixedTrack) {
            console.log("✅ Adding mixed audio track (start):", {
              label: mixedTrack.label,
              readyState: mixedTrack.readyState,
              enabled: mixedTrack.enabled
            });
            tracks.push(mixedTrack);
          } else {
            console.log("❌ No mixed track available at start");
          }
        } else {
          console.log("⚠️ Could not get audio, recording video only");
        }
      } catch (e) {
        console.log("❌ Audio mix failed, recording video only:", e);
      }
      
      const newCombinedStream = new MediaStream(tracks);
      console.log("✅ Created combined stream with", tracks.length, "tracks");
      setCombinedStream(newCombinedStream);
      startRecording(newCombinedStream);
      startedAtMsRef.current = Date.now();
      toast.success("Recording started!");
      return;
    }
    
    if (!combinedStream) {
      console.error("❌ No stream available at all");
      toast.error("No media stream available. Please enable camera first.");
      return;
    }
    
    console.log("✅ Starting recording with existing combined stream");
    startRecording(combinedStream);
    startedAtMsRef.current = Date.now();
    toast.success("Recording started");
  }, [combinedStream, videoStream, isRecording, startRecording, voiceStatus.value]);

  const handleStopRecording = useCallback(async () => {
    console.log("🛑 handleStopRecording called");
    suppressAutoStartRef.current = true;

    const cleanupAudio = () => {
      try { tabCaptureRef.current?.getTracks().forEach(t => t.stop()); } catch {}
      try { micStreamRef.current?.getTracks().forEach(t => t.stop()); } catch {}
      try { audioContextRef.current?.close(); } catch {}
      tabCaptureRef.current = null;
      micStreamRef.current = null;
      audioContextRef.current = null;
      mixDestinationRef.current = null;
    };

    const blob = await stopRecording();
    startedAtMsRef.current = null;

    console.log("📦 Recording blob:", blob ? `${blob.size} bytes, type: ${blob.type}` : "null");
    
    if (!blob) {
      console.error("❌ No recording data available");
      toast.error("No recording data available");
      cleanupAudio();
      return;
    }

    // Automatically upload to Cloudflare
    console.log("☁️ Starting upload to Cloudflare...");
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const videoId = await uploadToCloudflare(
        blob,
        {
          name: `hume-recording-${new Date().toISOString()}.webm`,
        },
        {
          onProgress: (percentage) => {
            setUploadProgress(percentage);
          },
          onSuccess: (id) => {
            toast.success("Recording uploaded successfully!");
            onRecordingComplete?.(id);
            // Allow future auto-starts in next sessions
            suppressAutoStartRef.current = false;
          },
          onError: (error) => {
            toast.error(`Upload failed: ${error.message}`);
            // Allow re-arming after failure
            suppressAutoStartRef.current = false;
          },
        }
      );
      
      console.log("Video uploaded with ID:", videoId);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload recording");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      cleanupAudio();
    }
  }, [stopRecording, onRecordingComplete]);

  // Force-stop integration: allow external components to trigger upload reliably
  useEffect(() => {
    let fired = false;
    const onForceStop = () => {
      if (fired) return;
      fired = true;
      suppressAutoStartRef.current = true;
      // If we're uploading already, ignore; else stop
      if (!isUploading && (isRecording || wasRecordingRef.current)) {
        console.log("🛑 FORCE-STOP RECORDING EVENT RECEIVED");
        handleStopRecording();
      }
    };
    window.addEventListener("app:force-stop-recording", onForceStop);
    return () => window.removeEventListener("app:force-stop-recording", onForceStop);
  }, [isRecording, isUploading, handleStopRecording]);

  const handlePauseResume = () => {
    if (isPaused) {
      resumeRecording();
      toast.info("Recording resumed");
    } else {
      pauseRecording();
      toast.info("Recording paused");
    }
  };

  // Auto-start recording when call becomes active and stream is ready
  useEffect(() => {
    // Auto-start check (removed spammy log)
    
    const canAutoStart = autoStart && isCallActive && voiceStatus.value === "connected" && !!combinedStream && !isRecording && !isUploading && !suppressAutoStartRef.current;

    if (canAutoStart && !autoStartedRef.current) {
      console.log("🚀 CONDITIONS MET - AUTO-STARTING RECORDING IMMEDIATELY!");
      autoStartedRef.current = true;
      handleStartRecording();
    }

    if (!canAutoStart) {
      // Allow re-arming for the next connection/session
      autoStartedRef.current = false;
    }

    return undefined;
  }, [autoStart, isCallActive, combinedStream, isRecording, isUploading, handleStartRecording, voiceStatus.value]);

  // When voice truly disconnects, allow future auto-starts
  useEffect(() => {
    if (voiceStatus.value !== "connected") {
      suppressAutoStartRef.current = false;
    }
  }, [voiceStatus.value]);

  // Track recording state
  useEffect(() => {
    wasRecordingRef.current = isRecording;
  }, [isRecording]);

  // Auto-stop recording when call ends
  useEffect(() => {
    // Auto-stop check (removed spammy log)
    
    // Clear any existing timeout
    if (autoStopTimeoutRef.current) {
      clearTimeout(autoStopTimeoutRef.current);
      autoStopTimeoutRef.current = null;
    }
    
    // Check if call has ended using either isCallActive OR voice status
    const callEnded = !isCallActive || voiceStatus.value === "error" || voiceStatus.value === "disconnected";
    
    // If call has ended and we were/are recording, stop it
    if (autoStart && callEnded && (isRecording || wasRecordingRef.current) && !isUploading) {
      const startedAt = startedAtMsRef.current ?? Date.now();
      const elapsed = Date.now() - startedAt;
      const minDurationMs = 1500;
      const delay = Math.max(0, minDurationMs - elapsed);

      console.log("🛑 CALL ENDED - AUTO-STOPPING RECORDING NOW!", { elapsedMs: elapsed, enforcingDelayMs: delay });
      console.log("🛑 Trigger reason:", { isCallActive, voiceStatus: voiceStatus.value, isRecording, wasRecording: wasRecordingRef.current });
      toast.info("Call ended - stopping recording automatically");
      
      // Use timeout to ensure minimum duration and state updates
      autoStopTimeoutRef.current = setTimeout(() => {
        console.log("⏰ TIMEOUT AUTO-STOP EXECUTING");
        handleStopRecording();
        wasRecordingRef.current = false; // Reset the flag
      }, delay);
    }
    
    // Cleanup timeout on unmount
    return () => {
      if (autoStopTimeoutRef.current) {
        clearTimeout(autoStopTimeoutRef.current);
      }
    };
  }, [autoStart, isCallActive, isRecording, isUploading, handleStopRecording, voiceStatus.value]);

  // Show error if any
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  return (
    <div className="flex flex-col gap-3">
      {/* Recording Status Header */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "h-3 w-3 rounded-full",
          isRecording ? "bg-red-500 animate-pulse" : "bg-gray-400"
        )} />
        <span className="text-sm font-medium">
          {isRecording ? (isPaused ? "Recording Paused" : "Recording Active") : 
           isUploading ? "Uploading..." : 
           autoStart ? "Auto-Recording Enabled" : "Ready to Record"}
        </span>
      </div>
      
      {/* Mic Gain Control */}
      <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-md">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground min-w-[60px]">Mic Gain:</span>
        <input
          type="range"
          min="1"
          max="50"
          step="0.1"
          value={micGainValue}
          onChange={(e) => handleGainChange(parseFloat(e.target.value))}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
        />
        <span className="text-xs font-mono min-w-[30px] text-right">
          {micGainValue.toFixed(1)}x
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        {!autoStart && !isRecording && !isUploading && (
          <Button
            onClick={handleStartRecording}
            variant="default"
            size="sm"
            className="flex items-center gap-2"
            disabled={!combinedStream}
          >
            <Circle className="h-4 w-4 fill-red-500 text-red-500" />
            Start Recording
          </Button>
        )}

        {isRecording && (
          <>
            {autoStart ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Auto-recording active - will stop when call ends</span>
                <Button
                  onClick={handleStopRecording}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1 text-xs"
                >
                  <Square className="h-3 w-3" />
                  Stop Now
                </Button>
              </div>
            ) : (
              <>
                <Button
                  onClick={handleStopRecording}
                  variant="destructive"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Square className="h-4 w-4" />
                  Stop
                </Button>

                <Button
                  onClick={handlePauseResume}
                  variant="secondary"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  {isPaused ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                  {isPaused ? "Resume" : "Pause"}
                </Button>
              </>
            )}

            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono text-lg font-semibold">{formatDuration(duration)}</span>
            </div>
          </>
        )}

        {isUploading && (
          <div className="flex items-center gap-3">
            <Loader2 className="h-4 w-4 animate-spin" />
            <div className="flex flex-col">
              <span className="text-sm">Uploading...</span>
              <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{uploadProgress.toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}