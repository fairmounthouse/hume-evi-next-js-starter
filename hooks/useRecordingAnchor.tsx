"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface RecordingAnchorContextType {
  recordingStartTime: number | null;
  setRecordingStartTime: (time: number | null) => void;
  getRelativeTime: (absoluteTimestamp: number) => number;
  formatRelativeTime: (seconds: number) => string;
}

const RecordingAnchorContext = createContext<RecordingAnchorContextType | undefined>(undefined);

export function RecordingAnchorProvider({ children }: { children: ReactNode }) {
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);

  const getRelativeTime = (absoluteTimestamp: number): number => {
    if (!recordingStartTime) {
      console.log("⚠️ [TIMESTAMP] No recording start time set, returning 0");
      return 0;
    }
    const relativeSeconds = Math.max(0, Math.floor((absoluteTimestamp - recordingStartTime) / 1000));
    console.log("🕐 [TIMESTAMP] Converting absolute to relative:", {
      absoluteTimestamp,
      recordingStartTime,
      relativeSeconds,
      readable: `${Math.floor(relativeSeconds / 60)}:${(relativeSeconds % 60).toString().padStart(2, '0')}`
    });
    return relativeSeconds;
  };

  // SINGLE SOURCE OF TRUTH for all timestamp formatting
  const formatRelativeTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <RecordingAnchorContext.Provider 
      value={{ 
        recordingStartTime, 
        setRecordingStartTime, 
        getRelativeTime, 
        formatRelativeTime 
      }}
    >
      {children}
    </RecordingAnchorContext.Provider>
  );
}

export function useRecordingAnchor() {
  const context = useContext(RecordingAnchorContext);
  if (context === undefined) {
    throw new Error('useRecordingAnchor must be used within a RecordingAnchorProvider');
  }
  return context;
}
