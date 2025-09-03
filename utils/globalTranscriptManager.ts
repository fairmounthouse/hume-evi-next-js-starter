import { TranscriptEntry } from './feedbackTypes';
import TranscriptEvaluator from './transcriptEvaluator';
import { TranscriptStorageService } from './transcriptStorageService';
import { generateStableId, getInterimCache, updateInterimCache } from './stableIdGenerator';

/**
 * Global transcript manager that runs independently of React lifecycle
 * Handles message processing, storage, and deduplication across UI mounts
 */
export class GlobalTranscriptManager {
  private static instance: GlobalTranscriptManager;
  private evaluators: Map<string, TranscriptEvaluator> = new Map();
  private storageServices: Map<string, TranscriptStorageService> = new Map();
  private messageQueues: Map<string, any[]> = new Map();
  private processedIds: Map<string, Set<string>> = new Map();
  private processingTimers: Map<string, NodeJS.Timeout> = new Map();
  
  static getInstance(): GlobalTranscriptManager {
    if (!this.instance) {
      this.instance = new GlobalTranscriptManager();
    }
    return this.instance;
  }

  public getEvaluator(sessionId: string): TranscriptEvaluator {
    if (!this.evaluators.has(sessionId)) {
      const evaluator = new TranscriptEvaluator();
      evaluator.setSession(sessionId);
      this.evaluators.set(sessionId, evaluator);
    }
    return this.evaluators.get(sessionId)!;
  }

  public getStorageService(sessionId: string): TranscriptStorageService {
    if (!this.storageServices.has(sessionId)) {
      const service = new TranscriptStorageService(sessionId);
      this.storageServices.set(sessionId, service);
    }
    return this.storageServices.get(sessionId)!;
  }

  /**
   * Process messages independently of React lifecycle
   * Uses message queue with immediate processing and deduplication
   */
  public processMessages(sessionId: string, messages: any[]): TranscriptEntry[] {
    if (!messages || messages.length === 0) return [];
    
    // Initialize session data if needed
    if (!this.messageQueues.has(sessionId)) {
      this.messageQueues.set(sessionId, []);
      this.processedIds.set(sessionId, new Set());
    }
    
    const messageQueue = this.messageQueues.get(sessionId)!;
    const processedIds = this.processedIds.get(sessionId)!;
    
    // Queue new messages with stable ID deduplication
    let newMessagesAdded = false;
    messages.forEach(msg => {
      const msgId = generateStableId(msg);
      if (!processedIds.has(msgId)) {
        messageQueue.push({ ...msg, __stableId: msgId });
        processedIds.add(msgId);
        newMessagesAdded = true;
      }
    });
    
    // Process immediately if new messages were added
    if (newMessagesAdded) {
      return this.processQueuedMessages(sessionId);
    }
    
    return [];
  }

  /**
   * Process queued messages and return transcript entries
   */
  private processQueuedMessages(sessionId: string): TranscriptEntry[] {
    const messageQueue = this.messageQueues.get(sessionId);
    if (!messageQueue || messageQueue.length === 0) return [];
    
    // Process all queued messages
    const toProcess = [...messageQueue];
    this.messageQueues.set(sessionId, []); // Clear queue
    
    const transcript = this.buildTranscriptFromMessages(sessionId, toProcess);
    
    if (transcript.length > 0) {
      // Update evaluator
      const evaluator = this.getEvaluator(sessionId);
      evaluator.appendToMasterTranscript(transcript);
      
      // Update storage service
      const storageService = this.getStorageService(sessionId);
      storageService.append(transcript);
      
      console.log(`🔄 [GLOBAL MANAGER] Processed ${toProcess.length} messages → ${transcript.length} transcript entries`);
    }
    
    return transcript;
  }

  /**
   * Build transcript from messages with proper interim handling
   * Interim messages are processed for timestamp extraction but EXCLUDED from final transcript
   */
  private buildTranscriptFromMessages(sessionId: string, messages: any[]): TranscriptEntry[] {
    const transcript: TranscriptEntry[] = [];
    const interimCache = getInterimCache(sessionId);
    
    messages.forEach((msg, index) => {
      try {
        if (!msg.message?.content) return;
        
        const relativeSeconds = this.getRelativeTimestamp(msg);
        const absoluteTimestamp = msg.receivedAt?.getTime() || Date.now();
        const isInterim = msg.interim === true;
        
        // Process interim messages for timestamp extraction but don't include in final transcript
        if (isInterim) {
          console.log("📝 [GLOBAL MANAGER] Processing interim for timestamp extraction only:", msg.message.content.substring(0, 30) + "...");
          
          if (msg.type === "user_message") {
            // Cache the first interim timestamp
            const cachedFirst = interimCache[absoluteTimestamp];
            if (typeof cachedFirst !== 'number') {
              updateInterimCache(sessionId, absoluteTimestamp, relativeSeconds);
              console.log("📝 [GLOBAL MANAGER] Cached first interim timestamp:", relativeSeconds);
            }
          }
          return; // EXCLUDE from final transcript
        }
        
        // Handle final messages with interim timestamp lookup
        let actualTimestamp = relativeSeconds;
        let startSpeakingTimestamp = relativeSeconds;
        
        if (msg.type === "user_message") {
          // This is a final message - check for cached first interim
          const cachedFirst = interimCache[absoluteTimestamp];
          if (typeof cachedFirst === 'number') {
            startSpeakingTimestamp = cachedFirst;
            actualTimestamp = cachedFirst;
            console.log("📝 [GLOBAL MANAGER] Using cached interim timestamp for final message:", cachedFirst);
          }
        }
        
        const entry: TranscriptEntry & { [key: string]: any } = {
          id: msg.__stableId || generateStableId(msg, actualTimestamp),
          speaker: msg.type === "user_message" ? "user" : "assistant",
          text: msg.message.content,
          timestamp: actualTimestamp,
          startSpeakingTimestamp,
          emotions: msg.models?.prosody?.scores || undefined,
          confidence: msg.models?.language?.confidence || undefined,
          isInterim: false, // Final transcript entries are never interim
          _originalType: msg.type,
          _originalTimestamp: relativeSeconds,
          _absoluteTimestamp: absoluteTimestamp,
          _receivedAt: msg.receivedAt
        };
        
        transcript.push(entry);
        console.log("✅ [GLOBAL MANAGER] Added final message to transcript:", msg.message.content.substring(0, 30) + "...");
      } catch (error) {
        console.error('Error processing message:', error, msg);
      }
    });
    
    // Sort by timestamp to maintain chronological order
    transcript.sort((a, b) => a.timestamp - b.timestamp);
    
    return transcript;
  }

  /**
   * Get relative timestamp from message
   */
  private getRelativeTimestamp(msg: any): number {
    if (typeof window !== 'undefined' && (window as any).__getRelativeTime) {
      const getRelativeTime = (window as any).__getRelativeTime;
      const receivedAt = msg.receivedAt || new Date();
      return getRelativeTime(receivedAt.getTime()) || 0;
    }
    return 0;
  }

  /**
   * Get complete transcript for a session
   */
  public getCompleteTranscript(sessionId: string): TranscriptEntry[] {
    const evaluator = this.evaluators.get(sessionId);
    return evaluator ? evaluator.getMasterTranscript() : [];
  }

  /**
   * Emergency save for a session
   */
  public async emergencySave(sessionId: string): Promise<void> {
    const evaluator = this.evaluators.get(sessionId);
    const storageService = this.storageServices.get(sessionId);
    
    if (evaluator && storageService) {
      const transcript = evaluator.getMasterTranscript();
      await storageService.emergencySave(transcript);
    }
  }

  /**
   * Cleanup session resources
   */
  public cleanupSession(sessionId: string): void {
    console.log(`🧹 [GLOBAL MANAGER] Cleaning up session ${sessionId}`);
    
    // Clear processing timer
    const timer = this.processingTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.processingTimers.delete(sessionId);
    }
    
    // Destroy evaluator
    const evaluator = this.evaluators.get(sessionId);
    if (evaluator) {
      evaluator.destroy();
      this.evaluators.delete(sessionId);
    }
    
    // Destroy storage service
    const storageService = this.storageServices.get(sessionId);
    if (storageService) {
      storageService.destroy();
      this.storageServices.delete(sessionId);
    }
    
    // Clear session data
    this.messageQueues.delete(sessionId);
    this.processedIds.delete(sessionId);
  }

  /**
   * Force process any queued messages for a session
   */
  public flushSession(sessionId: string): TranscriptEntry[] {
    return this.processQueuedMessages(sessionId);
  }
}

// Initialize globally
if (typeof window !== 'undefined') {
  (window as any).transcriptManager = GlobalTranscriptManager.getInstance();
}
