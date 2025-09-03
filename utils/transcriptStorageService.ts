import { TranscriptEntry } from './feedbackTypes';

/**
 * Independent storage service that doesn't depend on React lifecycle
 * Handles multiple storage layers with chunking support for large transcripts
 */
export class TranscriptStorageService {
  private sessionId: string;
  private saveQueue: TranscriptEntry[] = [];
  private saveTimer: NodeJS.Timeout | null = null;
  private readonly CHUNK_SIZE = 100;
  private readonly SAVE_INTERVAL = 3000; // 3 seconds
  private readonly MAX_QUEUE_SIZE = 50; // Immediate save threshold
  
  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.startAutoSave();
    
    // Bind to page unload for emergency saves
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleBeforeUnload.bind(this));
      window.addEventListener('pagehide', this.handleBeforeUnload.bind(this));
    }
  }

  private startAutoSave() {
    // Save every 3 seconds if there's data
    this.saveTimer = setInterval(() => {
      if (this.saveQueue.length > 0) {
        this.flush();
      }
    }, this.SAVE_INTERVAL);
  }

  public append(entries: TranscriptEntry[]) {
    this.saveQueue.push(...entries);
    
    // Immediate save if queue is large
    if (this.saveQueue.length >= this.MAX_QUEUE_SIZE) {
      this.flush();
    }
  }

  private async flush() {
    if (this.saveQueue.length === 0) return;
    
    const toSave = [...this.saveQueue];
    this.saveQueue = [];
    
    try {
      // Save to multiple locations in parallel for redundancy
      await Promise.allSettled([
        this.saveToLocalStorage(toSave),
        this.saveToSessionStorage(toSave),
        this.sendToSupabase(toSave)
      ]);
    } catch (e) {
      console.error('Failed to flush transcript data:', e);
      // Re-queue on failure
      this.saveQueue.unshift(...toSave);
    }
  }

  private async saveToLocalStorage(entries: TranscriptEntry[]) {
    if (typeof window === 'undefined') return;
    
    try {
      // Get existing entries from localStorage chunks
      const existingEntries = this.loadFromLocalStorageChunks();
      
      // Merge with new entries (deduplicate by ID)
      const existingIds = new Set(existingEntries.map(e => e.id));
      const uniqueNewEntries = entries.filter(entry => !existingIds.has(entry.id));
      const allEntries = [...existingEntries, ...uniqueNewEntries];
      
      // Save in chunks to avoid localStorage limits
      this.saveToLocalStorageChunks(allEntries);
      
      console.log(`💾 [STORAGE] Saved ${uniqueNewEntries.length} new entries to localStorage (${allEntries.length} total)`);
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
      throw e;
    }
  }

  private saveToLocalStorageChunks(entries: TranscriptEntry[]) {
    // Clear old chunks first
    this.clearLocalStorageChunks();
    
    // Split into chunks
    const chunks = [];
    for (let i = 0; i < entries.length; i += this.CHUNK_SIZE) {
      chunks.push(entries.slice(i, i + this.CHUNK_SIZE));
    }
    
    // Store chunks separately
    chunks.forEach((chunk, index) => {
      const key = `master_transcript_${this.sessionId}_chunk_${index}`;
      try {
        localStorage.setItem(key, JSON.stringify(chunk));
      } catch (e) {
        console.error(`Failed to save chunk ${index}:`, e);
        throw e;
      }
    });
    
    // Store chunk count
    localStorage.setItem(
      `master_transcript_${this.sessionId}_chunks`,
      chunks.length.toString()
    );
  }

  private loadFromLocalStorageChunks(): TranscriptEntry[] {
    if (typeof window === 'undefined') return [];
    
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

  private clearLocalStorageChunks() {
    if (typeof window === 'undefined') return;
    
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

  private async saveToSessionStorage(entries: TranscriptEntry[]) {
    if (typeof window === 'undefined') return;
    
    try {
      const key = `emergency_transcript_${this.sessionId}`;
      const data = {
        transcript: entries,
        timestamp: Date.now(),
        reason: 'periodic_backup'
      };
      
      sessionStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save to sessionStorage:', e);
      throw e;
    }
  }

  private async sendToSupabase(entries: TranscriptEntry[]) {
    try {
      // Send to backup endpoint
      const response = await fetch('/api/transcript/backup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.sessionId,
          entries: entries,
          timestamp: Date.now()
        }),
      });

      if (!response.ok) {
        console.warn(`⚠️ [STORAGE] Backup to server failed: ${response.status}. Continuing with localStorage backup.`);
        return; // Don't throw - localStorage is primary backup
      }
      
      console.log(`✅ [STORAGE] Successfully backed up ${entries.length} entries to server`);
    } catch (e) {
      console.warn('⚠️ [STORAGE] Failed to backup to Supabase, continuing with localStorage:', e instanceof Error ? e.message : e);
      // Don't throw - localStorage is primary backup
    }
  }

  private handleBeforeUnload(e: BeforeUnloadEvent | PageTransitionEvent) {
    console.log('🚨 [EMERGENCY SAVE] Page unloading, forcing transcript save');
    
    try {
      // Force synchronous save of any queued data
      if (this.saveQueue.length > 0) {
        const toSave = [...this.saveQueue];
        this.saveQueue = [];
        
        // Synchronous localStorage save
        const existingEntries = this.loadFromLocalStorageChunks();
        const existingIds = new Set(existingEntries.map(e => e.id));
        const uniqueNewEntries = toSave.filter(entry => !existingIds.has(entry.id));
        const allEntries = [...existingEntries, ...uniqueNewEntries];
        
        this.saveToLocalStorageChunks(allEntries);
        
        // Emergency sessionStorage save
        const key = `emergency_disconnect_${this.sessionId}`;
        const data = {
          transcript: allEntries,
          timestamp: Date.now(),
          reason: 'beforeunload'
        };
        sessionStorage.setItem(key, JSON.stringify(data));
        
        // Try to use sendBeacon for server backup
        if (navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify({
            sessionId: this.sessionId,
            entries: uniqueNewEntries,
            timestamp: Date.now(),
            reason: 'emergency_save'
          })], {type: 'application/json'});
          
          navigator.sendBeacon('/api/transcript/emergency-save', blob);
        }
        
        console.log(`🚨 [EMERGENCY SAVE] Saved ${uniqueNewEntries.length} entries during page unload`);
      }
    } catch (error) {
      console.error('🚨 [EMERGENCY SAVE] Failed:', error);
    }
  }

  public async emergencySave(transcript: TranscriptEntry[]) {
    console.log('🚨 [EMERGENCY SAVE] Manual emergency save triggered');
    
    try {
      // Immediate sync save to multiple locations
      const saves = [
        this.saveToLocalStorage(transcript),
        this.saveToSessionStorage(transcript)
      ];
      
      await Promise.allSettled(saves);
      
      // Try async server save
      this.sendToSupabase(transcript).catch(e => {
        console.error('Emergency server save failed:', e);
      });
      
      console.log(`🚨 [EMERGENCY SAVE] Completed for ${transcript.length} entries`);
    } catch (error) {
      console.error('🚨 [EMERGENCY SAVE] Failed:', error);
      throw error;
    }
  }

  public destroy() {
    console.log('🧹 [STORAGE] Destroying transcript storage service');
    
    // Final flush
    if (this.saveQueue.length > 0) {
      this.flush();
    }
    
    // Clear timer
    if (this.saveTimer) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
    
    // Remove event listeners
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handleBeforeUnload.bind(this));
      window.removeEventListener('pagehide', this.handleBeforeUnload.bind(this));
    }
  }

  public getStoredTranscript(): TranscriptEntry[] {
    return this.loadFromLocalStorageChunks();
  }
}
