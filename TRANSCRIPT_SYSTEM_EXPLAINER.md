# Transcript System Architecture - Complete Technical Explainer

## Executive Summary

The transcript system implements a **dual-layer architecture** with an **append-only master transcript** for permanent storage and a **rolling window** for real-time feedback. The system prioritizes data preservation while maintaining performance for live features.

---

## Core Architecture

### 1. Dual Transcript System

The system maintains two distinct transcript views:

#### Master Transcript (Permanent)
- **Location**: `TranscriptEvaluator.masterTranscript`
- **Type**: Append-only array
- **Persistence**: LocalStorage + Supabase
- **Truncation**: NEVER truncated
- **Usage**: Downloads, storage, end screen, recovery

#### Rolling Window (Temporary)
- **Location**: `TranscriptEvaluator.getRollingWindow()`
- **Duration**: Last 3 minutes only
- **Truncation**: Automatically truncated
- **Usage**: Real-time feedback API only

```typescript
// Master Transcript - Complete conversation
private masterTranscript: TranscriptEntry[] = []; // NEVER truncated

// Rolling Window - Recent context for performance
private getRollingWindow(): TranscriptEntry[] {
  // Returns last 3 minutes only for feedback evaluation
}
```

---

## Data Flow Pipeline

### Message Processing Flow

```
1. Hume Voice SDK sends messages
   ↓
2. Chat.tsx receives messages via useVoice() hook
   ↓
3. buildTranscriptFromMessages() processes messages
   - Filters for user/assistant messages
   - Converts timestamps to relative seconds
   - Applies "first interim" timestamp logic
   - Marks interim messages
   ↓
4. setStoredTranscript() updates React state
   ↓
5. appendToMasterTranscript() adds to permanent record
   - Deduplicates by message ID
   - Persists to LocalStorage
   - Never replaces existing data
```

### Detailed Message Processing Implementation

**File: `components/Chat.tsx` (Lines 322-502)**

```typescript
const buildTranscriptFromMessages = (messages: any[]): any[] => {
  console.log("📋 [TRANSCRIPT] Building transcript from", messages.length, "total messages");
  
  // Step 1: Filter for actual conversation messages
  const conversationMessages = messages.filter(msg => {
    if (!msg || typeof msg !== 'object') {
      console.log("🔍 [TRANSCRIPT] Skipping invalid message:", msg);
      return false;
    }

    const hasContent = msg.message?.content && 
                      typeof msg.message.content === 'string' && 
                      msg.message.content.trim().length > 0;
    const isConversation = msg.type === "user_message" || 
                          msg.type === "assistant_message";
    const isInterim = (msg as any).interim === true;
    
    // CRITICAL: Include interim messages for live UI
    if (isInterim) {
      console.log("📝 [TRANSCRIPT] Including interim message for live UI:", 
                  msg.type, msg.message?.content?.substring(0, 30) + "...");
      return true;
    }
    
    return isConversation && hasContent;
  });
  
  // Step 2: Build transcript entries with metadata
  const transcript = conversationMessages.map((msg, index) => {
    const absoluteTimestamp = msg.receivedAt?.getTime() || Date.now();
    const relativeSeconds = getRelativeTime(absoluteTimestamp);
    const isInterim = (msg as any).interim === true;
    
    // CRITICAL TIMING LOGIC: Handle first interim timestamp
    let startSpeakingTimestamp: number | undefined = undefined;
    let actualTimestamp = relativeSeconds;
    
    if (msg.type === "user_message" && msg.message?.content) {
      const content = msg.message.content.trim();
      
      if (isInterim) {
        // Use global first interim time if available
        const firstInterimAbs = (window as any).__currentUserStartTime;
        if (firstInterimAbs && recordingStartTime) {
          actualTimestamp = Math.max(0, 
            Math.floor((firstInterimAbs - recordingStartTime) / 1000));
        }
      } else {
        // For final messages, check cached first interim
        const interimCache: Record<number, number> = 
          (window as any).__firstInterimByFinalMs || {};
        const cachedFirst = interimCache[absoluteTimestamp];
        
        if (typeof cachedFirst === 'number') {
          startSpeakingTimestamp = cachedFirst;
          actualTimestamp = cachedFirst;
        } else if (currentUserStartTime.current !== null && 
                   currentUserStartTime.current < relativeSeconds) {
          // Use and persist current first-interim
          startSpeakingTimestamp = currentUserStartTime.current;
          actualTimestamp = currentUserStartTime.current;
          (window as any).__firstInterimByFinalMs = {
            ...interimCache,
            [absoluteTimestamp]: currentUserStartTime.current,
          };
        }
      }
    }
    
    return {
      id: `msg-${index}`,
      speaker: msg.type === "user_message" ? "user" : "assistant",
      text: msg.message?.content || "",
      timestamp: actualTimestamp,
      startSpeakingTimestamp,
      emotions: msg.models?.prosody?.scores || undefined,
      confidence: msg.models?.language?.confidence || undefined,
      isInterim,
      _originalType: msg.type,
      _originalTimestamp: msg.receivedAt?.toISOString(),
      _absoluteTimestamp: Math.floor(absoluteTimestamp / 1000),
      _messageIndex: index,
      _finalTimestamp: relativeSeconds,
    };
  });
  
  return transcript;
};
```

### Timestamp Processing

#### Relative Time System Implementation

**File: `hooks/useRecordingAnchor.tsx` (Complete implementation)**

```typescript
export function useRecordingAnchor() {
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(null);
  
  // Set anchor when recording starts
  const startRecording = useCallback(() => {
    const now = Date.now();
    setRecordingStartTime(now);
    // Store globally for cross-component access
    (window as any).__recordingStartTime = now;
    console.log("⏱️ [ANCHOR] Recording started at:", new Date(now).toISOString());
  }, []);
  
  // Convert absolute timestamp to relative seconds
  const getRelativeTime = useCallback((absoluteMs: number): number => {
    if (!recordingStartTime) {
      // Fallback to global if local not set
      const globalStart = (window as any).__recordingStartTime;
      if (globalStart) {
        return Math.max(0, Math.floor((absoluteMs - globalStart) / 1000));
      }
      return 0;
    }
    return Math.max(0, Math.floor((absoluteMs - recordingStartTime) / 1000));
  }, [recordingStartTime]);
  
  // SINGLE SOURCE OF TRUTH for timestamp formatting
  const formatRelativeTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);
  
  return {
    recordingStartTime,
    startRecording,
    getRelativeTime,
    formatRelativeTime
  };
}
```

#### Global Timestamp Cache Management

**File: `components/Chat.tsx` (Lines 143-173)**

```typescript
// Initialize cache to persist first-interim per FINAL user message
useEffect(() => {
  if (!(window as any).__firstInterimByFinalMs) {
    (window as any).__firstInterimByFinalMs = {} as Record<number, number>;
  }
}, []);

// Check for first interim from global variable and convert to relative time
useEffect(() => {
  if (!messages || messages.length === 0) return;
  
  // Check if we have a global first interim ABS timestamp to convert
  if ((window as any).__currentUserStartTime && 
      currentUserStartTime.current === null) {
    const globalTimestamp = (window as any).__currentUserStartTime as number;
    const relativeTimestamp = getRelativeTime(globalTimestamp);
    currentUserStartTime.current = relativeTimestamp;
    console.log(`🔄 [GLOBAL->RELATIVE] Converted first interim: 
                ${new Date(globalTimestamp).toISOString()} → ${relativeTimestamp}s`);
  }
  
  const latestMessage = messages[messages.length - 1];
  
  // Clear when AI speaks or session ends
  if (latestMessage?.type === "assistant_message" || 
      latestMessage?.type === "assistant_end") {
    if (currentUserStartTime.current !== null) {
      console.log(`🤖 [AI SPOKE] Clearing user start time`);
      currentUserStartTime.current = null;
      delete (window as any).__currentUserStartTime;
      delete (window as any).__currentUserStartContent;
    }
  }
}, [messages, getRelativeTime]);
```

#### First Interim Timestamp Feature
The system tracks when users **start speaking** (interim message) vs when they **finish speaking** (final message):

```typescript
// When user starts speaking, capture timestamp
if (msg.interim && !currentUserStartTime.current) {
  currentUserStartTime.current = getRelativeTime(now);
}

// When final message arrives, use the earlier "started speaking" timestamp
if (!msg.interim && currentUserStartTime.current) {
  entry.timestamp = currentUserStartTime.current; // Use when they started
  entry._finalTimestamp = currentTimestamp; // Keep when they finished
}
```

This ensures transcript timestamps reflect when users began speaking, not when they finished.

---

## Storage & Persistence

### Multi-Level Backup Strategy

1. **Primary**: Master transcript in TranscriptEvaluator
2. **LocalStorage**: Per-session backup (`master_transcript_${sessionId}`)
3. **SessionStorage**: Temporary backup (`transcript_backup_${sessionId}`)
4. **Supabase Database**: `live_transcript_data` column
5. **Supabase Storage**: TXT and JSON files in bucket

### Detailed Storage Implementation

#### Master Transcript Management

**File: `utils/transcriptEvaluator.ts` (Lines 127-149)**

```typescript
export class TranscriptEvaluator {
  private masterTranscript: TranscriptEntry[] = []; // NEVER truncated
  private sessionId: string | null = null;
  
  /**
   * APPEND new entries to master transcript (append-only, never replace)
   * This is the authoritative source for complete conversation history
   */
  public appendToMasterTranscript(newEntries: TranscriptEntry[]): void {
    // Only append entries that don't already exist (by ID)
    const existingIds = new Set(this.masterTranscript.map(e => e.id));
    const uniqueNewEntries = newEntries.filter(entry => 
      !existingIds.has(entry.id)
    );
    
    if (uniqueNewEntries.length > 0) {
      this.masterTranscript.push(...uniqueNewEntries);
      console.log(`📚 [MASTER TRANSCRIPT] Appended ${uniqueNewEntries.length} 
                   new entries. Total: ${this.masterTranscript.length}`);
      
      // Persist to localStorage for resilience
      this.persistToLocalStorage();
    }
  }
  
  private persistToLocalStorage(): void {
    if (!this.sessionId) return;
    try {
      const key = `master_transcript_${this.sessionId}`;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, 
          JSON.stringify(this.masterTranscript));
      }
    } catch (e) {
      console.warn('[MASTER TRANSCRIPT] Failed to persist to localStorage', e);
    }
  }
  
  /**
   * Bind to session and recover persisted transcript
   */
  setSession(sessionId: string): void {
    if (!sessionId || this.sessionId === sessionId) return;
    this.sessionId = sessionId;
    
    try {
      const key = `master_transcript_${sessionId}`;
      const raw = typeof window !== 'undefined' ? 
                  window.localStorage.getItem(key) : null;
      if (raw) {
        const parsed: TranscriptEntry[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Deduplicate while preserving existing
          const existingIds = new Set(this.masterTranscript.map(e => e.id));
          const newOnes = parsed.filter(e => !existingIds.has(e.id));
          if (newOnes.length > 0) {
            this.masterTranscript.push(...newOnes);
            console.log(`♻️ [MASTER TRANSCRIPT] Recovered ${newOnes.length} 
                         entries from localStorage`);
          }
        }
      }
    } catch (e) {
      console.warn('[MASTER TRANSCRIPT] Failed to recover from localStorage', e);
    }
  }
}
```

#### React State Management

**File: `components/Chat.tsx` (Lines 536-581)**

```typescript
// Update stored transcript whenever messages change
useEffect(() => {
  // CRITICAL: Always update ref with current messages
  currentMessagesRef.current = messages;
  
  console.log("📨 Messages updated:", {
    messageCount: messages.length,
    isCallActive,
    messageTypes: messages.map(m => m.type),
    lastMessage: messages[messages.length - 1]?.type || "none"
  });
  
  // ALWAYS build and store transcript when we have messages
  if (messages.length > 0) {
    const newTranscript = buildTranscriptFromMessages(messages);
    
    // Only update state if reference actually differs (avoid re-renders)
    const prev = storedTranscript;
    const prevLen = prev.length;
    const nextLen = newTranscript.length;
    const changed = nextLen !== prevLen || 
                   (nextLen > 0 && 
                    (prev[nextLen - 1]?.id !== newTranscript[nextLen - 1]?.id));
    
    if (changed) {
      setStoredTranscript(newTranscript);
    }
    
    // APPEND-ONLY: Add new entries to master transcript
    // Filter out interim messages for storage
    const finalTranscriptOnly = newTranscript.filter(entry => !entry.isInterim);
    transcriptEvaluator.appendToMasterTranscript(finalTranscriptOnly);
    
    console.log("💾 Updated stored transcript and appended to master:", {
      messagesProcessed: messages.length,
      transcriptEntries: newTranscript.length,
      masterTranscriptLength: transcriptEvaluator.getMasterTranscript().length,
      isCallActive,
      preservationMode: "APPEND_ONLY"
    });
    
    // Store in session storage as additional backup
    try {
      sessionStorage.setItem(
        `transcript_backup_${sessionId}` || 'transcript_backup_default', 
        JSON.stringify(newTranscript)
      );
      console.log("💾 Backup transcript saved to session storage");
    } catch (error) {
      console.warn("Failed to backup transcript to session storage:", error);
    }
  }
}, [messages, isCallActive, sessionId, storedTranscript, transcriptEvaluator]);
```

### Periodic Backups

**File: `components/Chat.tsx` (Lines 584-619)**

```typescript
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
      
      const currentTranscript = masterTranscript.length > 0 ? 
                               masterTranscript : fallbackTranscript;
      
      if (currentTranscript.length > 0) {
        try {
          const { upsertInterviewSession } = 
            await import("@/utils/supabase-client");
          
          await upsertInterviewSession({
            session_id: sessionId,
            live_transcript_data: currentTranscript,
            updated_at: new Date().toISOString()
          });
          
          console.log("💾 Periodic transcript backup completed:", {
            transcriptEntries: currentTranscript.length,
            sourceType: masterTranscript.length > 0 ? 
                       "MASTER_TRANSCRIPT" : "FALLBACK_STORED"
          });
        } catch (error) {
          console.warn("Failed to backup transcript periodically:", error);
        }
      }
    }, 30000); // Every 30 seconds
  }
  
  return () => {
    if (backupInterval) clearInterval(backupInterval);
  };
}, [isCallActive, sessionId, storedTranscript, transcriptEvaluator]);
```

### End Interview Processing

**File: `components/Chat.tsx` (Lines 1278-1345)**

```typescript
const handleEndInterview = async () => {
  console.log("🔚 [END] Starting interview end process with enhanced preservation");
  
  let transcriptData: any[] = [];
  
  // Try multiple sources in order of preference
  // PRIORITY 1: Current stored transcript (has correct timestamps)
  if (storedTranscript.length > 0) {
    transcriptData = storedTranscript;
    console.log("✅ [END] Using stored transcript:", 
                transcriptData.length, "entries");
  }
  // PRIORITY 2: Transcript evaluator's complete history
  else {
    try {
      const evaluatorHistory = transcriptEvaluator.getCompleteTranscriptHistory();
      if (evaluatorHistory.length > 0) {
        transcriptData = evaluatorHistory;
        console.log("✅ [END] Using transcript evaluator complete history:", 
                    transcriptData.length, "entries");
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
      console.log("✅ [END] Built from messages ref:", 
                  transcriptData.length, "entries");
    }
    // 4. Build from messages state (fallback)
    else if (messages.length > 0) {
      transcriptData = buildTranscriptFromMessages(messages);
      console.log("✅ [END] Built from messages state:", 
                  transcriptData.length, "entries");
    }
    // 5. Try session storage backup
    else {
      try {
        const backupData = sessionStorage.getItem(
          `transcript_backup_${sessionId}`
        );
        if (backupData) {
          transcriptData = JSON.parse(backupData);
          console.log("✅ [END] Recovered from session storage backup:", 
                      transcriptData.length, "entries");
        }
      } catch (error) {
        console.warn("Failed to recover from session storage backup:", error);
      }
    }
  }
  
  // Final validation
  if (transcriptData.length === 0) {
    console.warn("⚠️ [END] No transcript data found - this should not happen!");
  } else {
    console.log("✅ [END] Final transcript validation passed:", {
      totalEntries: transcriptData.length,
      userMessages: transcriptData.filter(e => e.speaker === "user").length,
      assistantMessages: transcriptData.filter(e => 
        e.speaker === "assistant").length,
      firstEntry: transcriptData[0]?.text?.substring(0, 50) + "...",
      lastEntry: transcriptData[transcriptData.length - 1]?.text?
                   .substring(0, 50) + "..."
    });
  }
  
  await handleEndInterviewWithData(transcriptData);
};
```

**File: `components/Chat.tsx` (Lines 1042-1141)**

```typescript
const handleEndInterviewWithData = async (preservedTranscript: any[]) => {
  try {
    console.log("📋 [END] Using preserved transcript data:", 
                preservedTranscript.length, "entries");
    
    setTranscript(preservedTranscript);
    setStoredTranscript(preservedTranscript);
    
    // Stop transcript evaluation
    transcriptEvaluator.stopPeriodicEvaluation();
    
    // Save final session data to Supabase
    if (preservedTranscript.length > 0) {
      try {
        const { upsertInterviewSession, uploadTranscriptToStorage } = 
          await import("@/utils/supabase-client");
        
        // Upload transcript to Supabase Storage
        const transcriptPath = await uploadTranscriptToStorage(
          sessionId, preservedTranscript
        );
        
        // Calculate timing using relative timestamps
        const now = new Date();
        const totalDurationSeconds = preservedTranscript.length > 0 
          ? (preservedTranscript[preservedTranscript.length - 1]?.timestamp || 0)
          : 0;
        
        const sessionEndTime = now.toISOString();
        const sessionStartTime = new Date(
          now.getTime() - (totalDurationSeconds * 1000)
        ).toISOString();
        
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
      } catch (supabaseError) {
        console.error("⚠️ [END] Supabase save failed (non-critical):", 
                      supabaseError);
      }
    }
    
    // End the call and show end screen
    setIsCallActive(false);
    setForceShowRecording(false);
    setShowEndScreen(true);
  } catch (error) {
    console.error("❌ [END] Error in handleEndInterviewWithData:", error);
  }
};
```

---

## State Management Flow Diagram

### Complete Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         HUME VOICE SDK                           │
│                    (WebSocket Connection)                        │
└────────────────────────────┬────────────────────────────────────┘
                             │ messages
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Chat.tsx Component                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ const { messages } = useVoice()                          │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                          │
│                       ▼                                          │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ buildTranscriptFromMessages(messages)                    │   │
│  │ - Filter user/assistant messages                         │   │
│  │ - Convert to relative timestamps                         │   │
│  │ - Apply first interim logic                             │   │
│  │ - Mark interim messages                                  │   │
│  └────────────────────┬─────────────────────────────────────┘   │
│                       │                                          │
│           ┌───────────┴──────────┬─────────────┐                │
│           ▼                      ▼             ▼                │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ storedTranscript│  │currentMessages│  │ sessionStorage│      │
│  │ (React State)   │  │     Ref       │  │   Backup     │      │
│  └─────────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────┬───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    TranscriptEvaluator                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ appendToMasterTranscript(finalTranscriptOnly)            │   │
│  │ - Deduplicate by ID                                      │   │
│  │ - Append to master array                                 │   │
│  │ - Persist to localStorage                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ masterTranscript[] (NEVER TRUNCATED)                     │   │
│  └──────────────┬───────────────────────────────────────────┘   │
│                 │                                                │
│      ┌──────────┴──────────┬──────────────┐                    │
│      ▼                     ▼               ▼                    │
│  ┌─────────┐        ┌──────────┐   ┌──────────────┐           │
│  │Downloads│        │ Storage  │   │Rolling Window│           │
│  │         │        │          │   │ (3 minutes)  │           │
│  └─────────┘        └──────────┘   └──────────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Supabase Backend                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Database: live_transcript_data column                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Storage Bucket: TXT and JSON files                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Message Processing State Machine

```
                    ┌──────────────┐
                    │   INITIAL    │
                    └──────┬───────┘
                           │
                           ▼
                    ┌──────────────┐
                    │  RECEIVING   │◄─────────┐
                    │   MESSAGES   │          │
                    └──────┬───────┘          │
                           │                  │
                    ┌──────▼───────┐          │
                    │   INTERIM    │          │
                    │   MESSAGE    │          │
                    └──────┬───────┘          │
                           │                  │
                    ┌──────▼───────┐          │
                    │    FINAL     │          │
                    │   MESSAGE    │──────────┘
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  PROCESSED   │
                    │  & STORED    │
                    └──────────────┘
```

### Storage Hierarchy

```
Priority Order for Data Recovery:

1. storedTranscript (React State)
   └─> Most current, includes correct timestamps

2. masterTranscript (TranscriptEvaluator)
   └─> Append-only, never truncated

3. currentMessagesRef.current
   └─> Real-time backup of messages

4. messages (React State)
   └─> Fallback if ref not updated

5. sessionStorage backup
   └─> Emergency backup, last resort

6. localStorage master_transcript_${sessionId}
   └─> Persistent across page refreshes

7. Supabase live_transcript_data
   └─> Cloud backup, periodic saves

8. Supabase Storage (TXT/JSON)
   └─> Final archive format
```

---

## Potential Issues & Flaws

### 1. Race Conditions During Rapid State Changes

**Issue**: If the interview ends while messages are still being processed, the transcript might be incomplete.

**Current Mitigation**: 
- Multiple fallback sources
- Append-only prevents data loss
- Periodic backups every 30 seconds

**Potential Flaw**: The 30-second backup interval means up to 30 seconds of conversation could be lost in a crash.

### 2. Interim Message Handling

**Issue**: Interim messages (user speaking but not finished) are included in UI but filtered from storage.

**Current Implementation**:
```typescript
// UI includes interim for live feedback
const transcriptForUI = newTranscript; // Includes interim

// Storage filters out interim
const finalTranscriptOnly = newTranscript.filter(entry => !entry.isInterim);
transcriptEvaluator.appendToMasterTranscript(finalTranscriptOnly);
```

**Potential Flaw**: If the final message never arrives (connection loss), the interim content could be lost.

### 3. Memory Growth

**Issue**: The master transcript grows indefinitely during long interviews.

**Impact**: 
- LocalStorage has ~5-10MB limit
- Large arrays can impact performance

**Current State**: No cleanup or pagination implemented.

### 4. Timestamp Cache Persistence

**Issue**: First interim timestamps are cached in a global variable:

**File: `components/Chat.tsx` (Lines 384-407)**

```typescript
// For final messages, check cached first interim
const interimCache: Record<number, number> = 
  (window as any).__firstInterimByFinalMs || {};
const cachedFirst = interimCache[absoluteTimestamp];

if (typeof cachedFirst === 'number') {
  // Use persisted first-interim for this final message if present
  startSpeakingTimestamp = cachedFirst;
  actualTimestamp = cachedFirst;
  console.log('🔒 [INTERIM CACHE HIT] Using cached first interim', {
    absoluteMs: absoluteTimestamp,
    cachedFirst
  });
} else if (currentUserStartTime.current !== null && 
           currentUserStartTime.current < relativeSeconds) {
  // Use current first-interim and persist it
  startSpeakingTimestamp = currentUserStartTime.current;
  actualTimestamp = currentUserStartTime.current;
  
  // CACHE IN MEMORY - LOST ON REFRESH!
  (window as any).__firstInterimByFinalMs = {
    ...interimCache,
    [absoluteTimestamp]: currentUserStartTime.current,
  } as Record<number, number>;
  
  console.log('📝 [INTERIM CACHE SET] Stored first interim', {
    absoluteMs: absoluteTimestamp,
    firstInterim: currentUserStartTime.current
  });
}
```

**Potential Flaw**: This cache is lost on page refresh, meaning historical transcripts loaded from storage won't have the first interim timestamps.

**Proposed Fix**:
```typescript
// Store in localStorage instead of memory
const cacheKey = `interim_cache_${sessionId}`;
const existingCache = localStorage.getItem(cacheKey);
const interimCache = existingCache ? JSON.parse(existingCache) : {};

// When setting cache
interimCache[absoluteTimestamp] = currentUserStartTime.current;
localStorage.setItem(cacheKey, JSON.stringify(interimCache));
```

### 5. Connection Loss Handling

**Issue**: When Hume connection drops unexpectedly:

**File: `components/Chat.tsx` (Lines 690-707)**

```typescript
// Handle disconnection with transcript preservation
useEffect(() => {
  if (status.value === "disconnected" && hasBeenConnected) {
    console.log("⚠️ [DISCONNECT] Connection lost, preserving transcript");
    
    // CRITICAL: Build fresh transcript from all available sources
    let preservedTranscript = storedTranscript;
    
    // If stored is empty, try to build from messages
    if (preservedTranscript.length === 0 && 
        currentMessagesRef.current.length > 0) {
      preservedTranscript = buildTranscriptFromMessages(
        currentMessagesRef.current
      );
      console.log("📋 [DISCONNECT] Built transcript from messages ref:", 
                  preservedTranscript.length, "entries");
    }
    
    // Also try master transcript as fallback
    if (preservedTranscript.length === 0) {
      preservedTranscript = transcriptEvaluator.getMasterTranscript();
      console.log("📋 [DISCONNECT] Using master transcript:", 
                  preservedTranscript.length, "entries");
    }
    
    // Process end interview data immediately (no delay)
    handleEndInterviewWithData(preservedTranscript);
    setHasBeenConnected(false);
  }
}, [status.value, hasBeenConnected, storedTranscript]);
```

**Potential Flaw**: The `preservedTranscript` might not include the very last messages if they haven't been processed yet.

**Root Cause**: Messages are processed asynchronously, and the disconnect handler might fire before the last message update completes.

**Proposed Fix**:
```typescript
// Add a message queue for unprocessed messages
const messageQueueRef = useRef<any[]>([]);

// Queue messages immediately on receipt
useEffect(() => {
  if (messages.length > messageQueueRef.current.length) {
    const newMessages = messages.slice(messageQueueRef.current.length);
    messageQueueRef.current.push(...newMessages);
    processMessageQueue();
  }
}, [messages]);

// Process queue with debouncing
const processMessageQueue = useMemo(() => 
  debounce(() => {
    const transcript = buildTranscriptFromMessages(messageQueueRef.current);
    setStoredTranscript(transcript);
    transcriptEvaluator.appendToMasterTranscript(transcript);
  }, 100),
  []
);
```

### 6. Duplicate Prevention Logic

**Issue**: Deduplication relies on message IDs:

**File: `utils/transcriptEvaluator.ts` (Lines 128-133)**

```typescript
public appendToMasterTranscript(newEntries: TranscriptEntry[]): void {
  // Only append entries that don't already exist (by ID)
  const existingIds = new Set(this.masterTranscript.map(e => e.id));
  const uniqueNewEntries = newEntries.filter(entry => 
    !existingIds.has(entry.id)
  );
  
  if (uniqueNewEntries.length > 0) {
    this.masterTranscript.push(...uniqueNewEntries);
    // ...
  }
}
```

**Current ID Generation** (`components/Chat.tsx` Line 437):
```typescript
const entry = {
  id: `msg-${index}`, // PROBLEM: Index-based IDs!
  speaker: msg.type === "user_message" ? "user" : "assistant",
  text: msg.message?.content || "",
  // ...
};
```

**Potential Flaw**: 
- IDs are index-based (`msg-0`, `msg-1`, etc.)
- If messages are reprocessed, indices might change
- Could cause duplicates or lost messages

**Proposed Fix**:
```typescript
// Generate stable IDs based on content + timestamp
const generateStableId = (msg: any, index: number): string => {
  const timestamp = msg.receivedAt?.getTime() || Date.now();
  const contentHash = msg.message?.content ? 
    btoa(msg.message.content.slice(0, 50)) : '';
  return `msg-${timestamp}-${contentHash}-${index}`;
};

const entry = {
  id: generateStableId(msg, index),
  // ... rest of entry
};
```

---

## Critical Files & Components

### Core Implementation Files

1. **`components/Chat.tsx`** (Lines 317-615)
   - `buildTranscriptFromMessages()` - Main processing logic
   - `useEffect` for message updates - Append-only updates
   - `handleEndInterview()` - End session data preservation

2. **`utils/transcriptEvaluator.ts`**
   - `appendToMasterTranscript()` - Append-only storage
   - `getMasterTranscript()` - Complete data retrieval
   - `getRollingWindow()` - Performance-optimized subset

3. **`components/TranscriptDrawer.tsx`**
   - Display component for transcript UI
   - Download functionality (TXT/JSON)
   - Real-time updates with interim messages

4. **`hooks/useRecordingAnchor.tsx`**
   - Central timestamp formatting
   - Recording start time anchor
   - Relative time calculations

5. **`utils/supabase-client.ts`**
   - `uploadTranscriptToStorage()` - Cloud backup
   - `upsertInterviewSession()` - Database persistence

---

## Why Transcripts Could Be Cut Off

### Most Likely Causes

1. **Early Interview Termination**
   - User refreshes page before backup completes
   - Connection drops before 30-second backup triggers
   - Interview ends before all messages are processed

2. **Processing Delays**
   - Messages stuck in processing when interview ends
   - Async operations not completing before state cleanup

3. **Storage Failures**
   - LocalStorage quota exceeded
   - Supabase upload failures not retried
   - Network issues during final save

### Recommended Improvements with Implementation Details

#### 1. Reduce Backup Interval
```typescript
// Change from 30 seconds to 10 seconds
// File: components/Chat.tsx Line 614
backupInterval = setInterval(async () => {
  // ... backup logic
}, 10000); // Was 30000
```

#### 2. Add Message Queue
```typescript
// New implementation for message queuing
const messageQueueRef = useRef<any[]>([]);
const processingRef = useRef<boolean>(false);

const queueMessage = useCallback((msg: any) => {
  messageQueueRef.current.push(msg);
  processQueue();
}, []);

const processQueue = useCallback(async () => {
  if (processingRef.current || messageQueueRef.current.length === 0) return;
  
  processingRef.current = true;
  const batch = messageQueueRef.current.splice(0, 10); // Process 10 at a time
  
  try {
    const transcript = buildTranscriptFromMessages(batch);
    transcriptEvaluator.appendToMasterTranscript(transcript);
  } finally {
    processingRef.current = false;
    if (messageQueueRef.current.length > 0) {
      setTimeout(processQueue, 100); // Process next batch
    }
  }
}, []);
```

#### 3. Implement Retry Logic
```typescript
const retryWithBackoff = async (
  fn: () => Promise<any>, 
  maxRetries = 3
): Promise<any> => {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      const delay = Math.min(1000 * Math.pow(2, i), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw lastError;
};

// Use in storage operations
await retryWithBackoff(async () => {
  await uploadTranscriptToStorage(sessionId, transcript);
});
```

#### 4. Add Page Unload Handler
```typescript
// Add to Chat.tsx
useEffect(() => {
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    if (isCallActive && storedTranscript.length > 0) {
      // Try synchronous save to sessionStorage
      try {
        sessionStorage.setItem(
          `emergency_backup_${sessionId}`,
          JSON.stringify({
            transcript: storedTranscript,
            timestamp: Date.now(),
            wasActive: true
          })
        );
      } catch (error) {
        console.error("Emergency backup failed:", error);
      }
      
      // Show warning if transcript hasn't been saved
      e.preventDefault();
      e.returnValue = 'Interview in progress. Are you sure you want to leave?';
    }
  };
  
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [isCallActive, storedTranscript, sessionId]);
```

#### 5. Include Interim Messages in Storage
```typescript
// Modify appendToMasterTranscript to keep interim as backup
public appendToMasterTranscript(newEntries: TranscriptEntry[]): void {
  const existingIds = new Set(this.masterTranscript.map(e => e.id));
  const uniqueNewEntries = newEntries.filter(entry => 
    !existingIds.has(entry.id)
  );
  
  if (uniqueNewEntries.length > 0) {
    // Keep interim messages but mark them clearly
    const processedEntries = uniqueNewEntries.map(entry => ({
      ...entry,
      _wasInterim: entry.isInterim,
      _storedAt: Date.now()
    }));
    
    this.masterTranscript.push(...processedEntries);
    this.persistToLocalStorage();
  }
}
```

#### 6. Add Sequence Numbers
```typescript
interface TranscriptEntry {
  id: string;
  sequenceNumber: number; // Add global sequence counter
  speaker: "user" | "assistant";
  text: string;
  timestamp: number;
  // ...
}

let globalSequenceCounter = 0;

const buildTranscriptFromMessages = (messages: any[]): any[] => {
  return messages.map((msg, index) => ({
    id: generateStableId(msg, index),
    sequenceNumber: ++globalSequenceCounter,
    // ... rest of entry
  }));
};
```

#### 7. Implement Chunking for Large Transcripts
```typescript
const uploadLargeTranscript = async (
  sessionId: string, 
  transcript: any[]
): Promise<string[]> => {
  const CHUNK_SIZE = 100; // 100 entries per chunk
  const chunks = [];
  
  for (let i = 0; i < transcript.length; i += CHUNK_SIZE) {
    chunks.push(transcript.slice(i, i + CHUNK_SIZE));
  }
  
  const uploadPromises = chunks.map((chunk, index) => 
    uploadTranscriptChunk(sessionId, chunk, index)
  );
  
  return Promise.all(uploadPromises);
};
```

#### 8. Add Recovery Mode
```typescript
const reconstructTranscript = async (
  sessionId: string
): Promise<TranscriptEntry[]> => {
  const sources = [
    // Try localStorage
    () => {
      const data = localStorage.getItem(`master_transcript_${sessionId}`);
      return data ? JSON.parse(data) : null;
    },
    // Try sessionStorage
    () => {
      const data = sessionStorage.getItem(`transcript_backup_${sessionId}`);
      return data ? JSON.parse(data) : null;
    },
    // Try emergency backup
    () => {
      const data = sessionStorage.getItem(`emergency_backup_${sessionId}`);
      return data ? JSON.parse(data).transcript : null;
    },
    // Try Supabase
    async () => {
      const { data } = await supabase
        .from('interview_sessions')
        .select('live_transcript_data')
        .eq('session_id', sessionId)
        .single();
      return data?.live_transcript_data;
    }
  ];
  
  for (const source of sources) {
    try {
      const data = await source();
      if (data && data.length > 0) {
        console.log("✅ Recovered transcript from source");
        return data;
      }
    } catch (error) {
      console.warn("Recovery source failed:", error);
    }
  }
  
  return [];
};
```

---

## Summary

The transcript system is robust with multiple redundancies, but vulnerable to:
- **30-second backup interval** creating vulnerability windows
- **Async processing delays** during connection loss
- **Index-based message IDs** causing potential duplicates
- **Memory-only interim cache** lost on refresh
- **No message queuing** for unprocessed messages

The append-only master transcript design prevents most data loss, but timing issues during interview termination remain the primary risk for truncated transcripts.

## Quick Reference: File Locations

| Component | File | Key Lines |
|-----------|------|-----------|
| Message Processing | `components/Chat.tsx` | 322-502 |
| Master Transcript | `utils/transcriptEvaluator.ts` | 127-149 |
| Periodic Backup | `components/Chat.tsx` | 584-619 |
| End Interview | `components/Chat.tsx` | 1278-1345 |
| Storage Upload | `utils/supabase-client.ts` | 107-283 |
| Timestamp System | `hooks/useRecordingAnchor.tsx` | All |
| Transcript Display | `components/TranscriptDrawer.tsx` | All |

## Testing Scenarios for Edge Cases

1. **Rapid Disconnect**: Start interview, speak for 20 seconds, kill network
2. **Page Refresh**: Mid-interview page refresh with unsaved messages
3. **Long Interview**: 30+ minute interview to test memory limits
4. **Rapid Speaking**: Multiple interim messages before final arrives
5. **Network Flakiness**: Intermittent connection during backup attempts