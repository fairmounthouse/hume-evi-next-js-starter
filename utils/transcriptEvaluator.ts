import { 
  TranscriptEntry, 
  InInterviewFeedback, 
  FinalEvaluation 
} from './feedbackTypes';

export class TranscriptEvaluator {
  private masterTranscript: TranscriptEntry[] = []; // MASTER append-only transcript - NEVER truncated
  private evaluationInterval: NodeJS.Timeout | null = null;
  private onEvaluationCallback: ((feedback: InInterviewFeedback) => void) | null = null;
  private readonly ROLLING_WINDOW_MS = 3 * 60 * 1000; // 3 minutes - ONLY for real-time feedback
  private readonly EVALUATION_INTERVAL_MS = 20 * 1000; // 20 seconds
  private isEvaluating = false;
  private sessionId: string | null = null; // Used for local persistence

  constructor() {}

  /**
   * Start periodic evaluation every 20 seconds
   */
  startPeriodicEvaluation(getTranscriptEntries: () => TranscriptEntry[]): void {
    if (this.evaluationInterval) {
      return;
    }

    this.evaluationInterval = setInterval(async () => {
      if (this.isEvaluating) {
        console.log("⏳ [EVALUATOR] Already evaluating, skipping...");
        return;
      }

      try {
        this.isEvaluating = true;
        const entries = getTranscriptEntries();
        
        console.log("🔄 [EVALUATOR] Periodic evaluation triggered, entries:", entries.length);
        
        if (entries.length === 0) {
          console.log("⚠️ [EVALUATOR] No entries to evaluate");
          return;
        }

        // Update internal history
        this.updateTranscriptHistory(entries);
        
        // Get rolling window of last 1 minute
        const rollingWindow = this.getRollingWindow();
        
        console.log("📊 [EVALUATOR] Rolling window entries:", rollingWindow.length);
        
        if (rollingWindow.length === 0) {
          console.log("⚠️ [EVALUATOR] No entries in rolling window");
          return;
        }

        // Perform evaluation
        const feedback = await this.evaluateTranscript(rollingWindow);
        
        if (feedback && this.onEvaluationCallback) {
          console.log("✅ [EVALUATOR] Calling feedback callback with:", feedback);
          this.onEvaluationCallback(feedback);
        } else {
          console.log("⚠️ [EVALUATOR] No feedback received or no callback set");
        }
      } catch (error) {
        console.error("❌ [EVALUATOR] Periodic evaluation error:", error);
      } finally {
        this.isEvaluating = false;
      }
    }, this.EVALUATION_INTERVAL_MS);
  }

  /**
   * Stop periodic evaluation
   */
  stopPeriodicEvaluation(): void {
    if (this.evaluationInterval) {
      clearInterval(this.evaluationInterval);
      this.evaluationInterval = null;
    }
  }

  /**
   * Set callback for evaluation results
   */
  onEvaluation(callback: (feedback: InInterviewFeedback) => void): void {
    this.onEvaluationCallback = callback;
  }

  /**
   * Get detailed evaluation for end of interview
   */
  async getDetailedEvaluation(entries: TranscriptEntry[]): Promise<FinalEvaluation> {
    console.log("📊 Getting detailed evaluation for", entries.length, "entries");
    
    const transcriptText = this.formatTranscriptForAPI(entries);
    
    try {
      const response = await fetch('/api/transcript/final_evaluation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript_text: transcriptText
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to get detailed evaluation: ${response.status}`);
      }

      const result = await response.json();
      console.log("📊 Received detailed evaluation:", result);
      
      return result;
    } catch (error) {
      console.error("📊 Error getting detailed evaluation:", error);
      throw error;
    }
  }

  /**
   * APPEND new entries to master transcript (append-only, never replace)
   * This is the authoritative source for complete conversation history
   */
  public appendToMasterTranscript(newEntries: TranscriptEntry[]): void {
    // Only append entries that don't already exist (by ID)
    const existingIds = new Set(this.masterTranscript.map(e => e.id));
    const uniqueNewEntries = newEntries.filter(entry => !existingIds.has(entry.id));
    
    if (uniqueNewEntries.length > 0) {
      this.masterTranscript.push(...uniqueNewEntries);
      console.log(`📚 [MASTER TRANSCRIPT] Appended ${uniqueNewEntries.length} new entries. Total: ${this.masterTranscript.length} (NEVER truncated)`);

      // Persist to localStorage for resilience across UI mounts (not dependent on any drawer)
      this.persistToLocalStorage();
    }
  }

  /**
   * DEPRECATED: Use appendToMasterTranscript instead
   */
  public updateTranscriptHistory(entries: TranscriptEntry[]): void {
    console.log(`⚠️ [DEPRECATED] updateTranscriptHistory called - use appendToMasterTranscript instead`);
    // For backward compatibility, replace the master transcript
    this.masterTranscript = [...entries];
  }

  /**
   * Get entries within the 1-minute rolling window
   * 
   * IMPORTANT: This rolling window is ONLY used for real-time feedback evaluation
   * to improve performance and focus on recent conversation context.
   * 
   * The master transcript is NEVER truncated and contains the complete conversation history.
   */
  private getRollingWindow(): TranscriptEntry[] {
    // Since timestamps are now relative seconds from recording start, 
    // we need to filter based on relative time, not absolute time
    const rollingWindowSeconds = this.ROLLING_WINDOW_MS / 1000; // Convert to seconds (180 seconds = 3 minutes)
    const latestTimestamp = this.masterTranscript.length > 0 
      ? Math.max(...this.masterTranscript.map(e => e.timestamp))
      : 0;
    const cutoffTimestamp = Math.max(0, latestTimestamp - rollingWindowSeconds);
    
    const rollingEntries = this.masterTranscript.filter(
      entry => entry.timestamp >= cutoffTimestamp
    );
    
    console.log(`🕐 [ROLLING WINDOW] ${rollingEntries.length}/${this.masterTranscript.length} entries (last 3 minutes for feedback only)`);
    console.log(`📚 [MASTER TRANSCRIPT] ${this.masterTranscript.length} total entries (COMPLETE, never truncated)`);
    
    return rollingEntries;
  }

  /**
   * Evaluate transcript using the in-interview API
   */
  private async evaluateTranscript(entries: TranscriptEntry[]): Promise<InInterviewFeedback | null> {
    const transcriptText = this.formatTranscriptForAPI(entries);
    
    console.log("🔍 [EVALUATOR] Starting evaluation with", entries.length, "entries");
    console.log("🔍 [EVALUATOR] Transcript text:", transcriptText.substring(0, 200) + "...");
    
    try {
      const response = await fetch('/api/transcript/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript_text: transcriptText
        }),
      });

      console.log("🔍 [EVALUATOR] API response status:", response.status);

      if (!response.ok) {
        const status = response.status;
        const statusText = response.statusText;
        const contentType = response.headers.get('content-type') || '';
        let rawBody = '';
        try {
          rawBody = await response.text();
        } catch (e) {
          rawBody = '[unreadable body]';
        }
        let parsedJson: any = null;
        if (contentType.includes('application/json')) {
          try { parsedJson = JSON.parse(rawBody); } catch {}
        }
        const trimmedBody = rawBody.length > 2000 ? rawBody.slice(0, 2000) + '…[truncated]' : rawBody;
        console.error("❌ [EVALUATOR] API failed", {
          status,
          statusText,
          contentType,
          body: parsedJson ?? trimmedBody
        });
        return null;
      }

      const result = await response.json();
      console.log("✅ [EVALUATOR] API success:", result);
      return result;
    } catch (error) {
      console.error("❌ [EVALUATOR] Error:", error);
      return null;
    }
  }

  /**
   * Format transcript entries for API - USES ROLLING WINDOW (TRUNCATED for feedback only)
   * NOTE: This is intentionally truncated for real-time feedback performance.
   * The master transcript is preserved separately and never truncated.
   */
  private formatTranscriptForAPI(entries: TranscriptEntry[]): string {
    if (entries.length === 0) {
      return 'No transcript data available yet.';
    }

    console.log(`📝 [EVALUATOR] Formatting ${entries.length} entries for feedback API (rolling window - last 3 minutes only)`);
    console.log(`📝 [EVALUATOR] NOTE: Master transcript is preserved separately and not truncated`);

    return entries.map(entry => {
      // entry.timestamp is now relative seconds from recording start
      const mins = Math.floor(entry.timestamp / 60);
      const secs = Math.floor(entry.timestamp % 60);
      const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
      const speaker = entry.speaker === "user" ? "Candidate" : "Interviewer";
      
      // Add emotion data if available
      let emotionInfo = "";
      if (entry.emotions && Object.keys(entry.emotions).length > 0) {
        const topEmotions = Object.entries(entry.emotions)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 3)
          .map(([emotion, score]) => `${emotion}:${(score as number).toFixed(2)}`)
          .join(", ");
        emotionInfo = ` [Emotions: ${topEmotions}]`;
      }
      
      // Add confidence if available
      let confidenceInfo = "";
      if (entry.confidence) {
        confidenceInfo = ` [Confidence: ${entry.confidence.toFixed(2)}]`;
      }
      
      return `[${timeStr}] ${speaker}: ${entry.text}${emotionInfo}${confidenceInfo}`;
    }).join('\n');
  }

  /**
   * Get the complete master transcript (never truncated)
   * This is the authoritative source for downloads and storage
   */
  getMasterTranscript(): TranscriptEntry[] {
    console.log(`📚 [MASTER TRANSCRIPT] Returning complete transcript: ${this.masterTranscript.length} entries (NEVER truncated)`);
    return [...this.masterTranscript];
  }

  /**
   * DEPRECATED: Use getMasterTranscript instead
   */
  getCompleteTranscriptHistory(): TranscriptEntry[] {
    console.log(`⚠️ [DEPRECATED] getCompleteTranscriptHistory called - use getMasterTranscript instead`);
    return this.getMasterTranscript();
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopPeriodicEvaluation();
    this.onEvaluationCallback = null;
    this.masterTranscript = [];
  }

  /**
   * Bind to a session and attempt to recover any locally persisted master transcript.
   * Does not depend on any UI component; safe to call on Chat mount.
   */
  setSession(sessionId: string): void {
    if (!sessionId) return;
    if (this.sessionId === sessionId) return;
    this.sessionId = sessionId;

    try {
      // Try to load from chunked storage first
      const chunkedEntries = this.loadFromLocalStorageChunks();
      if (chunkedEntries.length > 0) {
        // Deduplicate by id while preserving existing entries
        const existingIds = new Set(this.masterTranscript.map(e => e.id));
        const newOnes = chunkedEntries.filter(e => !existingIds.has(e.id));
        if (newOnes.length > 0) {
          this.masterTranscript.push(...newOnes);
          console.log(`♻️  [MASTER TRANSCRIPT] Recovered ${newOnes.length}/${chunkedEntries.length} entries from chunked localStorage for session ${sessionId}`);
        }
        return;
      }

      // Fallback to old single-key format for backward compatibility
      const key = `master_transcript_${sessionId}`;
      const raw = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      if (raw) {
        const parsed: TranscriptEntry[] = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Deduplicate by id while preserving existing entries
          const existingIds = new Set(this.masterTranscript.map(e => e.id));
          const newOnes = parsed.filter(e => !existingIds.has(e.id));
          if (newOnes.length > 0) {
            this.masterTranscript.push(...newOnes);
            console.log(`♻️  [MASTER TRANSCRIPT] Recovered ${newOnes.length}/${parsed.length} entries from legacy localStorage for session ${sessionId}`);
            
            // Migrate to chunked format and remove old key
            this.persistToLocalStorage();
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem(key);
            }
          }
        }
      }
    } catch (e) {
      console.warn('[MASTER TRANSCRIPT] Failed to recover from localStorage', e);
    }
  }

  private loadFromLocalStorageChunks(): TranscriptEntry[] {
    if (!this.sessionId || typeof window === 'undefined') return [];
    
    try {
      const chunkCountStr = localStorage.getItem(`master_transcript_${this.sessionId}_chunks`);
      if (!chunkCountStr) return [];
      
      const chunkCount = parseInt(chunkCountStr, 10);
      if (isNaN(chunkCount) || chunkCount <= 0) return [];
      
      const allEntries: TranscriptEntry[] = [];
      
      for (let i = 0; i < chunkCount; i++) {
        const key = `master_transcript_${this.sessionId}_chunk_${i}`;
        const chunkData = localStorage.getItem(key);
        
        if (chunkData) {
          try {
            const chunk: TranscriptEntry[] = JSON.parse(chunkData);
            allEntries.push(...chunk);
          } catch (e) {
            console.error(`Failed to parse chunk ${i}:`, e);
          }
        }
      }
      
      return allEntries;
    } catch (e) {
      console.error('Failed to load from localStorage chunks:', e);
      return [];
    }
  }

  private persistToLocalStorage(): void {
    if (!this.sessionId) return;
    try {
      // Use chunking to avoid localStorage limits
      const CHUNK_SIZE = 100;
      const chunks = [];
      
      for (let i = 0; i < this.masterTranscript.length; i += CHUNK_SIZE) {
        chunks.push(this.masterTranscript.slice(i, i + CHUNK_SIZE));
      }
      
      if (typeof window !== 'undefined') {
        // Clear old chunks first
        this.clearLocalStorageChunks();
        
        // Store chunks separately to avoid localStorage limits
        chunks.forEach((chunk, index) => {
          const key = `master_transcript_${this.sessionId}_chunk_${index}`;
          try {
            localStorage.setItem(key, JSON.stringify(chunk));
          } catch (e) {
            console.error(`Failed to save chunk ${index}:`, e);
          }
        });
        
        // Store chunk count
        localStorage.setItem(
          `master_transcript_${this.sessionId}_chunks`,
          chunks.length.toString()
        );
        
        console.log(`💾 [MASTER TRANSCRIPT] Persisted ${chunks.length} chunks (${this.masterTranscript.length} entries) to localStorage`);
      }
    } catch (e) {
      console.warn('[MASTER TRANSCRIPT] Failed to persist to localStorage', e);
    }
  }

  private clearLocalStorageChunks(): void {
    if (!this.sessionId || typeof window === 'undefined') return;
    
    try {
      const chunkCountStr = localStorage.getItem(`master_transcript_${this.sessionId}_chunks`);
      if (chunkCountStr) {
        const chunkCount = parseInt(chunkCountStr, 10);
        if (!isNaN(chunkCount) && chunkCount > 0) {
          for (let i = 0; i < chunkCount; i++) {
            const key = `master_transcript_${this.sessionId}_chunk_${i}`;
            localStorage.removeItem(key);
          }
        }
      }
      localStorage.removeItem(`master_transcript_${this.sessionId}_chunks`);
    } catch (e) {
      console.error('Failed to clear localStorage chunks:', e);
    }
  }
}

export default TranscriptEvaluator;
