"use client";

// Simple in-memory cache to reduce Supabase queries
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // time to live in ms 1
}

class SessionCache {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  set<T>(key: string, data: T, ttl = this.DEFAULT_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Cache keys
  static keys = {
    sessionSettings: (sessionId: string) => `session_settings_${sessionId}`,
    defaultProfiles: () => 'default_profiles',
    prompts: (promptId: string) => `prompt_${promptId}`,
  };
}

export const sessionCache = new SessionCache();

// Cached fetch for default profile IDs (rarely changes)
export async function getCachedDefaultProfiles() {
  const cacheKey = SessionCache.keys.defaultProfiles();
  let profiles = sessionCache.get(cacheKey);
  
  if (!profiles) {
    const { supabase } = await import("./supabase-client");
    
    const [interviewerRes, caseRes] = await Promise.all([
      supabase.from("interviewer_profiles_new").select("id").eq("active", true).is("user_id", null).limit(1).single(),
      supabase.from("interview_cases").select("id").eq("active", true).limit(1).single(),
    ]);

    profiles = {
      new_interviewer_profile_id: interviewerRes.data?.id || null,
      case_id: caseRes.data?.id || null,
    };

    // Cache for 30 minutes since profiles rarely change
    sessionCache.set(cacheKey, profiles, 30 * 60 * 1000);
  }

  return profiles;
}
