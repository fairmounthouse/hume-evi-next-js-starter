/**
 * Generates stable IDs for transcript entries based on content + timestamp
 * This prevents ID collisions when messages are reprocessed
 */

export interface MessageForId {
  type: string;
  message?: { content?: string };
  receivedAt?: Date;
  models?: any;
}

/**
 * Generate stable ID based on content + timestamp, not index
 * This ensures deduplication works even when messages are reprocessed
 */
export const generateStableId = (msg: MessageForId, relativeTimestamp?: number): string => {
  // Use receivedAt timestamp if available, otherwise use current time
  const timestamp = msg.receivedAt?.getTime() || Date.now();
  
  // Create content hash from first 20 chars of content (alphanumeric only)
  const content = msg.message?.content || '';
  const contentHash = content
    .slice(0, 20)
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase() || 'empty';
  
  // Use message type
  const type = msg.type || 'unknown';
  
  // Include relative timestamp if available for extra uniqueness
  const relativeStr = relativeTimestamp !== undefined ? `-${Math.floor(relativeTimestamp * 1000)}` : '';
  
  // Include model confidence/emotion data for extra uniqueness if available
  let modelHash = '';
  if (msg.models) {
    const confidence = msg.models.language?.confidence;
    const emotions = msg.models.prosody?.scores;
    
    if (confidence) {
      modelHash += `-c${Math.floor(confidence * 100)}`;
    }
    
    if (emotions) {
      const topEmotion = Object.entries(emotions)
        .sort(([,a], [,b]) => (b as number) - (a as number))[0];
      if (topEmotion) {
        modelHash += `-e${topEmotion[0].slice(0, 3)}`;
      }
    }
  }
  
  return `${timestamp}-${type}-${contentHash}${relativeStr}${modelHash}`;
};

/**
 * Get interim cache from localStorage instead of memory
 */
export const getInterimCache = (sessionId: string): Record<number, number> => {
  if (typeof window === 'undefined') return {};
  
  const key = `interim_cache_${sessionId}`;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    console.error('Failed to load interim cache:', e);
    return {};
  }
};

/**
 * Set interim cache to localStorage for persistence
 */
export const setInterimCache = (sessionId: string, cache: Record<number, number>): void => {
  if (typeof window === 'undefined') return;
  
  const key = `interim_cache_${sessionId}`;
  try {
    localStorage.setItem(key, JSON.stringify(cache));
  } catch (e) {
    console.error('Failed to persist interim cache:', e);
  }
};

/**
 * Update interim cache with new mapping
 */
export const updateInterimCache = (
  sessionId: string, 
  finalAbsoluteMs: number, 
  firstInterimRelativeSeconds: number
): void => {
  const cache = getInterimCache(sessionId);
  cache[finalAbsoluteMs] = firstInterimRelativeSeconds;
  setInterimCache(sessionId, cache);
};

/**
 * Clear interim cache for a session
 */
export const clearInterimCache = (sessionId: string): void => {
  if (typeof window === 'undefined') return;
  
  const key = `interim_cache_${sessionId}`;
  try {
    localStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to clear interim cache:', e);
  }
};
