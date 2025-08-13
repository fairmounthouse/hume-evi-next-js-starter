"use client";

import { useCallback, useRef, useState } from "react";

export interface RecordingOptions {
  mimeType?: string;
  videoBitsPerSecond?: number;
  audioBitsPerSecond?: number;
}

export interface UseRecordingReturn {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  startRecording: (stream: MediaStream) => void;
  stopRecording: () => Promise<Blob | null>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  error: string | null;
}

const DEFAULT_OPTIONS: RecordingOptions = {
  mimeType: "video/webm;codecs=vp8,opus",
  videoBitsPerSecond: 2500000,
  audioBitsPerSecond: 128000,
};

export function useRecording(options: RecordingOptions = {}): UseRecordingReturn {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const recordingOptions = { ...DEFAULT_OPTIONS, ...options };

  // Check if the browser supports the requested mime type
  const getSupportedMimeType = useCallback(() => {
    const types = [
      // Prefer VP8 for broader transcoder compatibility (e.g., Cloudflare Stream)
      "video/webm;codecs=vp8,opus",
      "video/webm;codecs=vp8",
      "video/webm;codecs=vp9,opus",
      "video/webm",
      "video/mp4",
    ];

    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "";
  }, []);

  const startRecording = useCallback(
    (stream: MediaStream) => {
      console.log("📹 useRecording.startRecording called with stream:", {
        streamId: stream.id,
        tracks: stream.getTracks().map(t => ({ kind: t.kind, label: t.label, readyState: t.readyState })),
      });
      
      try {
        setError(null);
        chunksRef.current = [];

        const mimeType = recordingOptions.mimeType || getSupportedMimeType();
        console.log("📹 Selected mimeType:", mimeType);
        
        if (!mimeType) {
          console.error("❌ No supported video format found");
          setError("No supported video format found in this browser");
          return;
        }

        const recorder = new MediaRecorder(stream, {
          ...recordingOptions,
          mimeType,
        });
        
        console.log("📹 MediaRecorder created, state:", recorder.state);

        recorder.ondataavailable = (event) => {
          console.log("📹 Data available:", event.data.size, "bytes");
          if (event.data.size > 0) {
            chunksRef.current.push(event.data);
          }
        };

        recorder.onerror = (event) => {
          console.error("MediaRecorder error:", event);
          setError("Recording error occurred");
          setIsRecording(false);
        };

        recorder.onstart = () => {
          console.log("✅ MediaRecorder STARTED!");
          startTimeRef.current = Date.now();
          setIsRecording(true);
          setIsPaused(false);

          // Update duration every 100ms
          durationIntervalRef.current = setInterval(() => {
            setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
          }, 100);
        };

        recorder.onstop = () => {
          console.log("🛑 MediaRecorder STOPPED");
          setIsRecording(false);
          setIsPaused(false);
          if (durationIntervalRef.current) {
            clearInterval(durationIntervalRef.current);
            durationIntervalRef.current = null;
          }
        };

        mediaRecorderRef.current = recorder;
        console.log("📹 Starting MediaRecorder...");
        // Start without a timeslice so the browser writes a single, finalized WebM
        recorder.start();
        console.log("📹 MediaRecorder.start() called, state is now:", recorder.state);
      } catch (err) {
        console.error("Failed to start recording:", err);
        setError(err instanceof Error ? err.message : "Failed to start recording");
      }
    },
    [recordingOptions, getSupportedMimeType]
  );

  const stopRecording = useCallback((): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        resolve(null);
        return;
      }

      // Ask the recorder to flush any buffered data before stopping
      try {
        recorder.requestData();
      } catch {}

      recorder.onstop = () => {
        setIsRecording(false);
        setIsPaused(false);
        setDuration(0);
        
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }

        // Small timeout to ensure the final dataavailable has fired
        setTimeout(() => {
          if (chunksRef.current.length === 0) {
            resolve(null);
            return;
          }

          const mimeType = recorder.mimeType || "video/webm";
          const blob = new Blob(chunksRef.current, { type: mimeType });
          chunksRef.current = [];
          resolve(blob);
        }, 0);
      };

      recorder.stop();
      
      // Stop all tracks in the stream
      if (recorder.stream) {
        recorder.stream.getTracks().forEach(track => track.stop());
      }
    });
  }, []);

  const pauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "recording") {
      recorder.pause();
      setIsPaused(true);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
    }
  }, []);

  const resumeRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state === "paused") {
      recorder.resume();
      setIsPaused(false);
      
      // Resume duration updates
      durationIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 100);
    }
  }, []);

  return {
    isRecording,
    isPaused,
    duration,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    error,
  };
}