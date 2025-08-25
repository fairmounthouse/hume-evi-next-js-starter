'use client';

import { useEffect, useRef } from 'react';
import { useUser } from '@clerk/nextjs';

interface SyncOptions {
  onPageLoad?: boolean;
  onUserChange?: boolean;
  intervalMs?: number;
  debug?: boolean;
}

export function useClerkSync(options: SyncOptions = {}) {
  const { 
    onPageLoad = true, 
    onUserChange = true, 
    intervalMs = 60000, // 1 minute
    debug = false 
  } = options;
  
  const { user, isLoaded } = useUser();
  const lastSyncRef = useRef<number>(0);
  const userIdRef = useRef<string | null>(null);

  const syncUser = async (reason: string) => {
    if (!user?.id) return;

    const now = Date.now();
    
    // Prevent too frequent syncs (minimum 10 seconds apart)
    if (now - lastSyncRef.current < 10000) {
      if (debug) console.log(`🔄 [CLERK SYNC] Skipping sync (too recent): ${reason}`);
      return;
    }

    try {
      if (debug) console.log(`🔄 [CLERK SYNC] Starting sync: ${reason}`);
      
      const response = await fetch('/api/billing/init-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userData: user,
          forceRefresh: true,
          source: `client_hook_${reason}`,
          timestamp: now
        })
      });

      if (response.ok) {
        const result = await response.json();
        lastSyncRef.current = now;
        if (debug) console.log(`✅ [CLERK SYNC] Success: ${reason}`, result);
      } else {
        console.error(`❌ [CLERK SYNC] Failed: ${reason}`, response.status);
      }
    } catch (error) {
      console.error(`❌ [CLERK SYNC] Error during ${reason}:`, error);
    }
  };

  // Sync on page load
  useEffect(() => {
    if (isLoaded && user && onPageLoad) {
      syncUser('page_load');
    }
  }, [isLoaded, user?.id, onPageLoad]);

  // Sync when user changes
  useEffect(() => {
    if (isLoaded && user && onUserChange) {
      const currentUserId = user.id;
      const previousUserId = userIdRef.current;
      
      if (previousUserId && previousUserId !== currentUserId) {
        syncUser('user_change');
      }
      
      userIdRef.current = currentUserId;
    }
  }, [user?.id, user?.updatedAt, isLoaded, onUserChange]);

  // Periodic sync
  useEffect(() => {
    if (!intervalMs || intervalMs <= 0) return;

    const interval = setInterval(() => {
      if (user?.id) {
        syncUser('periodic');
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [user?.id, intervalMs]);

  return {
    syncUser: (reason: string) => syncUser(reason),
    lastSync: lastSyncRef.current,
    isUserLoaded: isLoaded && !!user
  };
}
