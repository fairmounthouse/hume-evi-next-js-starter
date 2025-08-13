import { supabase } from "./supabase-client";
import { sessionCache } from "./session-cache";

export interface SessionSettings {
  type: "session_settings";
  variables: Record<string, string>;
  transcription?: { verbose: boolean };
  context?: { text: string; type: "temporary" };
}

// Lightweight row subset returned by the composite query
interface RawSessionRow {
  coach_mode_enabled: boolean | null;
  interviewer_profiles: {
    prompt_id: { prompt_content: string } | null;
  } | null;
  interview_cases: {
    prompt_id: { prompt_content: string } | null;
  } | null;
  difficulty_profiles: {
    display_name: string | null;
    prompt_id: { prompt_content: string } | null;
  } | null;
}

/**
 * Build SessionSettings payload for Hume EVI based on stored data.
 */
// Fetch and cache session data once at session start - never refetch!
export async function initializeSessionSettings(sessionId: string): Promise<void> {
  const cacheKey = `session_settings_${sessionId}`;
  
  // Only fetch if not already cached
  if (sessionCache.get(cacheKey)) {
    console.log("✅ Session settings already cached");
    return;
  }

  console.log("🔍 Fetching session data from Supabase (one-time)");
  const { data, error } = await supabase
    .from("interview_sessions")
    .select(
      `coach_mode_enabled,
       interviewer_profiles(prompt_id(prompt_content)),
       interview_cases(prompt_id(prompt_content)),
       difficulty_profiles(display_name, prompt_id(prompt_content))`
    )
    .eq("session_id", sessionId)
    .single<RawSessionRow>();

  if (error || !data) {
    console.error("Failed to fetch session context", error);
    throw error ?? new Error("Session not found");
  }

  // Cache the static data for the entire session duration
  const staticData = {
    INTERVIEWER_IDENTITY: data.interviewer_profiles?.prompt_id?.prompt_content || "Default AI Interviewer",
    INTERVIEW_CASE: data.interview_cases?.prompt_id?.prompt_content || "General Interview Case",
    COACHING_PROMPT: data.coach_mode_enabled ? "Coaching mode ON" : "Coaching mode OFF",
    DIFFICULTY_PROMPT: data.difficulty_profiles?.prompt_id?.prompt_content || data.difficulty_profiles?.display_name || "Mid Level",
  };

  // Cache for the entire session (long TTL since this never changes)
  sessionCache.set(cacheKey, staticData, 60 * 60 * 1000); // 1 hour
  console.log("✅ Session settings cached");
}

// Build session settings with cached static data + dynamic values
export async function buildSessionSettings(
  sessionId: string,
  elapsedMs: number = 0,
  phaseStatus: string = "intro",
  temporaryContext?: string
): Promise<SessionSettings> {
  const cacheKey = `session_settings_${sessionId}`;
  const staticData = sessionCache.get<Record<string, string>>(cacheKey);

  if (!staticData) {
    throw new Error(`Session ${sessionId} not initialized. Call initializeSessionSettings first.`);
  }

  // Build settings with cached static data + current dynamic values
  const variables = {
    ...staticData, // All the static Supabase data
    TOTAL_ELAPSED_TIME: formatElapsedTime(elapsedMs), // Always fresh
    PHASE_STATUS: phaseStatus, // Current phase
    now: getCurrentTimeForSpeech(), // Current time
  };

  const settings: SessionSettings = {
    type: "session_settings",
    variables,
    transcription: { verbose: true },
  };

  if (temporaryContext) {
    settings.context = { text: temporaryContext, type: "temporary" };
  }

  return settings;
}

// Helper functions moved outside
function formatElapsedTime(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  if (minutes === 0) return `${seconds} seconds`;
  return `${minutes} minutes ${seconds} seconds`;
}

function getCurrentTimeForSpeech(): string {
  return new Date().toLocaleString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}


