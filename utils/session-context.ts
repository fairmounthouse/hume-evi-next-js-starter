import { supabase } from "./supabase-client";
import { sessionCache } from "./session-cache";
import { substituteVariables as globalSubstituteVariables, SubstitutionContext } from "./variable-substitution";
import { initializeStandardProcessors } from "./variable-processors";

// Hume-compliant SessionSettings interface
export interface SessionSettings {
  type: "session_settings";
  variables?: Record<string, string | number | boolean>; // Hume accepts strings, numbers, booleans
  transcription?: { verbose: boolean };
  context?: { 
    text: string; 
    type: "temporary" | "persistent"; // Hume supports both types
  }; // Remove null option to match Hume's interface
}

export interface PhaseInfo {
  name: string;
  details: string;
  duration: number;
}

export interface CaseMetadata {
  phases: PhaseInfo[];
  totalDuration: number;
  nudgeBuffer?: number;
}

export interface CurrentPhase {
  phase: PhaseInfo;
  timeInPhase: number;
  index: number;
  totalElapsed: number;
}

// Enhanced row subset with case metadata and coaching config
// NO coach_mode_enabled - coaching is local toggle only, database is for prompt lookup
interface RawSessionRow {
  interviewer_profiles: {
    prompt_id: { prompt_content: string } | null;
  } | null;
  interview_cases: {
    phases: PhaseInfo[] | null;
    additional_metadata: any | null;
    prompt_id: { prompt_content: string } | null;
  } | null;
  difficulty_profiles: {
    display_name: string | null;
    prompt_id: { prompt_content: string } | null;
  } | null;
}

interface CoachingConfig {
  enabled_content: string;
  disabled_content: string;
}

/**
 * Build SessionSettings payload for Hume EVI based on stored data.
 */
// OLD SYSTEM APPROACH: Cache STATIC data once, compute DYNAMIC data fresh every time
// CACHED (from database): interviewer identity, case content, difficulty prompts, case phases/metadata
// FRESH (computed): elapsed time, current time, current phase, phase status, nudges
export async function initializeSessionSettings(sessionId: string): Promise<void> {
  const cacheKey = `session_settings_${sessionId}`;
  const coachingCacheKey = `coaching_config`;
  
  // Only fetch if not already cached
  if (sessionCache.get(cacheKey)) {
    console.log("✅ Session settings already cached");
    return;
  }

  console.log("🔍 Fetching session data from Supabase (one-time)");
  console.log("📋 Session ID:", sessionId);
  
  // Fetch session data with enhanced case metadata (NO coach_mode_enabled - local only)
  const { data, error } = await supabase
    .from("interview_sessions")
    .select(
      `interviewer_profiles(prompt_id(prompt_content)),
       interview_cases(phases, additional_metadata, prompt_id(prompt_content)),
       difficulty_profiles(display_name, prompt_id(prompt_content))`
    )
    .eq("session_id", sessionId)
    .single<RawSessionRow>();

  console.log("📊 Raw session data fetched (prompts for lookup only):", {
    hasData: !!data,
    error: error?.message,
    hasInterviewerProfile: !!data?.interviewer_profiles,
    hasInterviewCase: !!data?.interview_cases,
    hasDifficultyProfile: !!data?.difficulty_profiles,
    caseHasPhases: !!data?.interview_cases?.phases,
    phasesCount: data?.interview_cases?.phases?.length || 0,
    hasAdditionalMetadata: !!data?.interview_cases?.additional_metadata,
    note: "NO coach_mode_enabled - coaching is local toggle only"
  });

  if (error || !data) {
    console.error("❌ Failed to fetch session context", error);
    throw error ?? new Error("Session not found");
  }

  // Fetch coaching configuration (cache globally since it's shared)
  let coachingConfig = sessionCache.get<CoachingConfig>(coachingCacheKey);
  if (!coachingConfig) {
    console.log("🔍 Fetching coaching config from Supabase");
    const { data: coachingData, error: coachingError } = await supabase
      .from("coaching_config")
      .select(`
        enabled_prompt_id,
        disabled_prompt_id
      `)
      .single();

    if (coachingError || !coachingData) {
      console.warn("Failed to fetch coaching config, using fallback");
      coachingConfig = {
        enabled_content: "COACHING_MODE: enabled\n\n- Provide explicit feedback on candidate's approach\n- Offer specific suggestions for improvement",
        disabled_content: "COACHING_MODE: disabled\n\n- Maintain professional interview distance\n- Ask probing questions without giving away answers"
      };
    } else {
      // Fetch the actual prompt content
      const [enabledPrompt, disabledPrompt] = await Promise.all([
        supabase.from("prompts").select("prompt_content").eq("id", coachingData.enabled_prompt_id).single(),
        supabase.from("prompts").select("prompt_content").eq("id", coachingData.disabled_prompt_id).single()
      ]);
      
      coachingConfig = {
        enabled_content: enabledPrompt.data?.prompt_content || "Coaching mode ON",
        disabled_content: disabledPrompt.data?.prompt_content || "Coaching mode OFF"
      };
    }
    
    // Cache coaching config globally (1 hour TTL)
    sessionCache.set(coachingCacheKey, coachingConfig, 60 * 60 * 1000);
  }

  // Process case metadata and phases
  const caseMetadata: CaseMetadata | null = data.interview_cases?.phases ? {
    phases: data.interview_cases.phases,
    totalDuration: data.interview_cases.phases.reduce((sum, phase) => sum + phase.duration, 0),
    nudgeBuffer: data.interview_cases?.additional_metadata?.nudgeBuffer || 2 // 2 minute buffer
  } : null;

  console.log("🎯 Processed case metadata:", {
    hasCaseMetadata: !!caseMetadata,
    phasesCount: caseMetadata?.phases?.length || 0,
    totalDuration: caseMetadata?.totalDuration,
    nudgeBuffer: caseMetadata?.nudgeBuffer,
    phaseNames: caseMetadata?.phases?.map(p => p.name) || [],
    phaseDurations: caseMetadata?.phases?.map(p => p.duration) || []
  });

  // Extract data with clear logging of what's missing
  const interviewerIdentity = data.interviewer_profiles?.prompt_id?.prompt_content;
  const caseTemplate = data.interview_cases?.prompt_id?.prompt_content;
  const difficultyPrompt = data.difficulty_profiles?.prompt_id?.prompt_content || data.difficulty_profiles?.display_name;
  
  // Log missing data clearly
  if (!interviewerIdentity) {
    console.log("⚠️ No interviewer identity found in database - will use professional fallback");
  }
  if (!caseTemplate) {
    console.log("⚠️ No case template found in database - will use general interview fallback");
  }
  if (!difficultyPrompt) {
    console.log("⚠️ No difficulty prompt found in database - will use professional level fallback");
  }
  if (!caseMetadata) {
    console.log("⚠️ No phase metadata found in database - will run as free-form interview");
  }
  if (!coachingConfig) {
    console.log("⚠️ No coaching config found in database - will use professional approach fallback");
  }

  // Cache the static data for the entire session duration
  const staticData = {
    INTERVIEWER_IDENTITY: interviewerIdentity,
    INTERVIEW_CASE_TEMPLATE: caseTemplate,
    DIFFICULTY_PROMPT: difficultyPrompt,
    caseMetadata,
    coachingConfig
  };

  // Cache for the entire session (long TTL since this never changes)
  sessionCache.set(cacheKey, staticData, 60 * 60 * 1000); // 1 hour
  
  console.log("✅ Session settings cached with graceful fallback handling");
  console.log("💾 Data source summary:", {
    interviewer: interviewerIdentity ? "database" : "will_use_fallback",
    case: caseTemplate ? "database" : "will_use_fallback", 
    difficulty: difficultyPrompt ? "database" : "will_use_fallback",
    phases: caseMetadata ? "database" : "will_use_fallback",
    coaching: coachingConfig ? "database" : "will_use_fallback",
    cacheKey
  });
}

// OLD SYSTEM APPROACH: Use cached static data + compute ALL dynamic values fresh
// This function is called every 30 seconds and recomputes all time-sensitive values
export async function buildSessionSettings(
  sessionId: string,
  elapsedMs: number = 0,
  startTime?: Date,
  temporaryContext?: string,
  coachModeEnabled?: boolean
): Promise<SessionSettings> {
  console.log("🏗️ Building session settings:", {
    sessionId,
    elapsedMs,
    elapsedMinutes: Math.round(elapsedMs / 60000 * 10) / 10,
    hasStartTime: !!startTime,
    hasTemporaryContext: !!temporaryContext,
    temporaryContextLength: temporaryContext?.length || 0,
    coachModeEnabled
  });

  const cacheKey = `session_settings_${sessionId}`;
  const staticData = sessionCache.get<any>(cacheKey);

  if (!staticData) {
    console.error("❌ Session not initialized - no cached data found");
    throw new Error(`Session ${sessionId} not initialized. Call initializeSessionSettings first.`);
  }

  console.log("📦 Using cached static data:", {
    hasInterviewerIdentity: !!staticData.INTERVIEWER_IDENTITY,
    hasCaseTemplate: !!staticData.INTERVIEW_CASE_TEMPLATE,
    hasDifficultyPrompt: !!staticData.DIFFICULTY_PROMPT,
    hasCaseMetadata: !!staticData.caseMetadata,
    hasCoachingConfig: !!staticData.coachingConfig,
    cacheKey
  });

  // OLD SYSTEM APPROACH: Always compute fresh values (no caching for time-sensitive data)
  const elapsedTime = formatElapsedTime(elapsedMs);
  const currentTime = getCurrentTimeForSpeech();
  
  console.log("⏰ Time calculations (FRESH - like old system):", {
    elapsedMs,
    elapsedTime,
    currentTime,
    computedAt: Date.now()
  });
  
  // Ensure processors are initialized
  ensureProcessorsInitialized();
  
  // OLD SYSTEM APPROACH: Always compute current phase fresh (no caching)
  const currentPhase = getCurrentPhase(elapsedMs, staticData.caseMetadata);
  
  console.log("📅 Current phase info (FRESH - like old system):", {
    hasCurrentPhase: !!currentPhase,
    phaseName: currentPhase?.phase?.name,
    phaseIndex: currentPhase?.index,
    timeInPhase: Math.round((currentPhase?.timeInPhase || 0) * 10) / 10,
    totalElapsed: Math.round((currentPhase?.totalElapsed || 0) * 10) / 10,
    phaseDuration: currentPhase?.phase?.duration,
    computedAt: Date.now()
  });
  
  // Build substitution context for global system
  const substitutionContext: SubstitutionContext = {
    sessionId,
    elapsedMs,
    startTime,
    metadata: {
      currentPhase,
      caseMetadata: staticData.caseMetadata
    }
  };
  
  console.log("🔧 Substitution context built:", {
    sessionId: substitutionContext.sessionId,
    elapsedMs: substitutionContext.elapsedMs,
    hasStartTime: !!substitutionContext.startTime,
    hasMetadata: !!substitutionContext.metadata,
    hasCurrentPhaseInMetadata: !!substitutionContext.metadata?.currentPhase,
    hasCaseMetadataInMetadata: !!substitutionContext.metadata?.caseMetadata
  });
  
  // Apply global variable substitution to ALL content (following Hume guidelines)
  const allSubstitutions: any[] = [];
  const allWarnings: any[] = [];
  
  // Process interviewer identity with elegant fallback
  const interviewerContent = staticData.INTERVIEWER_IDENTITY || "You are a professional AI interviewer conducting this interview.";
  const hasInterviewerData = !!staticData.INTERVIEWER_IDENTITY;
  console.log("👤 Interviewer identity:", {
    hasCustomIdentity: hasInterviewerData,
    contentLength: interviewerContent.length,
    usingFallback: !hasInterviewerData
  });
  
  const interviewerResult = await globalSubstituteVariables(interviewerContent, substitutionContext);
  allSubstitutions.push(...interviewerResult.substitutions);
  allWarnings.push(...interviewerResult.warnings);
  
  // Process interview case with elegant fallback + document analysis
  let caseContent = staticData.INTERVIEW_CASE_TEMPLATE || "Conduct a general interview appropriate for the selected difficulty level.";
  const hasCaseData = !!staticData.INTERVIEW_CASE_TEMPLATE;
  
  // Check if we have document analysis to append
  let documentAnalysis = "";
  try {
    const { supabase } = await import("./supabase-client");
    const analysisPath = `${sessionId}/document_analysis.txt`;
    
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('documents')
      .download(analysisPath);
    
    if (!downloadError && fileData) {
      const fileText = await fileData.text();
      const analysisData = JSON.parse(fileText);
      const analysis = analysisData.analysis;
      
      if (analysis) {
        console.log("📋 Found document analysis - appending to case prompt");
        documentAnalysis = "\n\nDOCUMENT ANALYSIS:\n";
        
        if (analysis.resume_markdown) {
          documentAnalysis += `CANDIDATE RESUME:\n${analysis.resume_markdown}\n\n`;
        }
        
        if (analysis.job_description_markdown) {
          documentAnalysis += `JOB DESCRIPTION:\n${analysis.job_description_markdown}\n\n`;
        }
        
        if (analysis.interview_questions && analysis.interview_questions.length > 0) {
          documentAnalysis += `SUGGESTED PERSONALIZED QUESTIONS:\n`;
          analysis.interview_questions.forEach((question: string, index: number) => {
            documentAnalysis += `${index + 1}. ${question}\n`;
          });
        }
      }
    }
  } catch (error) {
    console.log("📋 No document analysis available for this session");
  }
  
  // Append document analysis to case content if available
  const finalCaseContent = caseContent + documentAnalysis;
  
  console.log("📋 Interview case:", {
    hasCustomCase: hasCaseData,
    originalContentLength: caseContent.length,
    hasDocumentAnalysis: !!documentAnalysis,
    documentAnalysisLength: documentAnalysis.length,
    finalContentLength: finalCaseContent.length,
    usingFallback: !hasCaseData
  });
  
  const caseResult = await globalSubstituteVariables(finalCaseContent, substitutionContext);
  allSubstitutions.push(...caseResult.substitutions);
  allWarnings.push(...caseResult.warnings);
  
  // Process coaching prompt with elegant fallback
  let rawCoachingPrompt = "Maintain a professional interview approach appropriate for the difficulty level."; // elegant fallback
  let hasCoachingConfig = false;
  
  if (staticData.coachingConfig) {
    hasCoachingConfig = true;
    const isCoachingOn = coachModeEnabled === true;
    rawCoachingPrompt = isCoachingOn 
      ? staticData.coachingConfig.enabled_content   // Coaching ON
      : staticData.coachingConfig.disabled_content; // Coaching OFF
    
    console.log("🎓 Coaching prompt selection:", {
      hasCoachingConfig: true,
      coachModeEnabled,
      isCoachingOn,
      promptType: isCoachingOn ? "ENABLED" : "DISABLED",
      promptLength: rawCoachingPrompt.length
    });
  } else {
    console.log("🎓 Coaching configuration:", {
      hasCoachingConfig: false,
      usingFallback: true,
      fallbackPrompt: "Professional interview approach"
    });
  }
  
  const coachingResult = await globalSubstituteVariables(rawCoachingPrompt, substitutionContext);
  allSubstitutions.push(...coachingResult.substitutions);
  allWarnings.push(...coachingResult.warnings);
  
  // Process difficulty prompt with elegant fallback
  const difficultyContent = staticData.DIFFICULTY_PROMPT || "Conduct an interview at an appropriate professional level.";
  const hasDifficultyData = !!staticData.DIFFICULTY_PROMPT;
  console.log("⚡ Difficulty prompt:", {
    hasCustomDifficulty: hasDifficultyData,
    contentLength: difficultyContent.length,
    usingFallback: !hasDifficultyData
  });
  
  const difficultyResult = await globalSubstituteVariables(difficultyContent, substitutionContext);
  allSubstitutions.push(...difficultyResult.substitutions);
  allWarnings.push(...difficultyResult.warnings);

  // Log all substitution results
  if (allWarnings.length > 0) {
    console.warn("⚠️ Variable substitution warnings (following Hume W0106 pattern):", allWarnings);
  }
  
  if (allSubstitutions.length > 0) {
    console.log("✅ Variable substitutions applied to ALL content:", allSubstitutions.map(s => 
      `${s.variable} → ${s.value.substring(0, 30)}${s.value.length > 30 ? '...' : ''} (${s.processor}${s.cached ? ', cached' : ''})`
    ));
  }

  // Build variables with our processed content (Hume will handle {{}} in the main prompt)
  // Our job: Process the CONTENT of these variables, then send to Hume
  const variables: Record<string, string | number | boolean> = {
    INTERVIEWER_IDENTITY: interviewerResult.processedText,
    INTERVIEW_CASE: caseResult.processedText,
    COACHING_PROMPT: coachingResult.processedText,
    DIFFICULTY_PROMPT: difficultyResult.processedText,
    TOTAL_ELAPSED_TIME: elapsedTime,
    now: currentTime, // We can override Hume's built-in 'now' with our format
  };

  // Enhanced logging showing data source quality
  console.log("📝 Final variables built with data sources:", {
    INTERVIEWER_IDENTITY: {
      length: variables.INTERVIEWER_IDENTITY?.toString().length || 0,
      source: hasInterviewerData ? "database" : "fallback"
    },
    INTERVIEW_CASE: {
      length: variables.INTERVIEW_CASE?.toString().length || 0,
      source: hasCaseData ? "database" : "fallback"
    },
    COACHING_PROMPT: {
      length: variables.COACHING_PROMPT?.toString().length || 0,
      source: hasCoachingConfig ? "database" : "fallback"
    },
    DIFFICULTY_PROMPT: {
      length: variables.DIFFICULTY_PROMPT?.toString().length || 0,
      source: hasDifficultyData ? "database" : "fallback"
    },
    TOTAL_ELAPSED_TIME: variables.TOTAL_ELAPSED_TIME,
    now: variables.now
  });

  // Check for undefined variables across ALL content and generate W0106 warnings
  const allProcessedContent = [
    interviewerResult, caseResult, coachingResult, difficultyResult
  ];
  
  const allUndefinedVars = new Set<string>();
  allProcessedContent.forEach(result => {
    result.unprocessedVariables?.forEach(v => allUndefinedVars.add(v));
  });
  
  if (allUndefinedVars.size > 0) {
    const undefinedList = Array.from(allUndefinedVars);
    console.warn(`⚠️ W0106: No values have been specified for the variables [${undefinedList.join(', ')}], which can lead to incorrect text formatting. Please assign them values.`);
  }

  // OLD SYSTEM APPROACH: Build dynamic context fresh every time (no caching)
  const contextParts: string[] = [];
  
  // 1. CONDITIONALLY ADD: Phase status ONLY if phases exist (computed fresh)
  if (currentPhase && staticData.caseMetadata) {
    const phaseStatus = getPhaseStatus(currentPhase, staticData.caseMetadata, elapsedTime);
    contextParts.push(phaseStatus);
    console.log("📊 Added FRESH phase status to context:", {
      phaseStatusLength: phaseStatus.length,
      currentPhaseName: currentPhase.phase.name,
      phaseIndex: currentPhase.index,
      computedAt: Date.now()
    });
  } else {
    console.log("✅ No phases configured for this case - skipping phase context entirely for cleaner session");
  }
  
  // 2. CONDITIONALLY ADD: Phase timing nudges (computed fresh)
  const phaseNudge = getPhaseNudge(currentPhase, staticData.caseMetadata);
  if (phaseNudge) {
    contextParts.push(phaseNudge);
    console.log("🚨 Added FRESH phase nudge to context:", {
      nudgeLength: phaseNudge.length,
      nudgePreview: phaseNudge.substring(0, 100) + "...",
      computedAt: Date.now()
    });
  } else {
    console.log("✅ No phase nudge needed - on track (computed fresh)");
  }
  
  // 3. CONDITIONALLY ADD: Manual temporary context
  if (temporaryContext) {
    contextParts.push(temporaryContext);
    console.log("📝 Added temporary context:", {
      temporaryContextLength: temporaryContext.length,
      temporaryContextPreview: temporaryContext.substring(0, 100) + "..."
    });
  }

  // Build Hume-compliant session settings
  const settings: SessionSettings = {
    type: "session_settings",
    variables, // Custom variables only (Hume handles 'now' automatically)
    transcription: { verbose: true },
  };

  // Add context following Hume's context injection pattern
  if (contextParts.length > 0) {
    settings.context = { 
      text: contextParts.join('\n\n'), 
      type: "temporary" // Applies only to next user message (Hume standard)
    };
    console.log("📤 Final context built:", {
      contextPartsCount: contextParts.length,
      totalContextLength: settings.context.text.length,
      contextType: settings.context.type
    });
  } else {
    console.log("📤 No context parts - sending variables only");
  }

  // Summary of data quality and session configuration
  const dataQualitySummary = {
    customData: {
      interviewer: hasInterviewerData,
      case: hasCaseData, 
      coaching: hasCoachingConfig,
      difficulty: hasDifficultyData,
      phases: !!(currentPhase && staticData.caseMetadata)
    },
    fallbacksUsed: {
      interviewer: !hasInterviewerData,
      case: !hasCaseData,
      coaching: !hasCoachingConfig, 
      difficulty: !hasDifficultyData,
      phases: !(currentPhase && staticData.caseMetadata)
    }
  };
  
  console.log("🎯 Session data quality summary:", dataQualitySummary);
  console.log("🎯 Final session settings ready:", {
    type: settings.type,
    hasVariables: !!settings.variables,
    variableCount: Object.keys(settings.variables || {}).length,
    hasTranscription: !!settings.transcription,
    hasContext: !!settings.context,
    settingsSize: JSON.stringify(settings).length,
    contextType: settings.context ? "phase_timing" : "variables_only"
  });

  // Log the complete payload that will be sent to Hume (for debugging)
  console.log("📤 COMPLETE SESSION SETTINGS PAYLOAD TO HUME:");
  console.log("=====================================");
  console.log(JSON.stringify(settings, null, 2));
  console.log("=====================================");

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

// Initialize standard processors on first import
let processorsInitialized = false;
function ensureProcessorsInitialized() {
  if (!processorsInitialized) {
    initializeStandardProcessors();
    processorsInitialized = true;
  }
}

// Get current phase based on elapsed time and case metadata
function getCurrentPhase(elapsedMs: number, caseMetadata: CaseMetadata | null): CurrentPhase | null {
  if (!caseMetadata || !caseMetadata.phases.length) {
    return null;
  }

  const elapsedMinutes = elapsedMs / 60000;
  let cumulativeTime = 0;
  
  for (let i = 0; i < caseMetadata.phases.length; i++) {
    const phase = caseMetadata.phases[i];
    const phaseStart = cumulativeTime;
    const phaseEnd = cumulativeTime + phase.duration;
    
    if (elapsedMinutes >= phaseStart && elapsedMinutes < phaseEnd) {
      return {
        phase,
        timeInPhase: elapsedMinutes - phaseStart,
        index: i,
        totalElapsed: elapsedMinutes
      };
    }
    
    cumulativeTime += phase.duration;
  }
  
  // If past all phases, return the last phase
  const lastPhase = caseMetadata.phases[caseMetadata.phases.length - 1];
  return {
    phase: lastPhase,
    timeInPhase: elapsedMinutes - (caseMetadata.totalDuration - lastPhase.duration),
    index: caseMetadata.phases.length - 1,
    totalElapsed: elapsedMinutes
  };
}

// Generate detailed phase status context (exactly like old system)
function getPhaseStatus(currentPhase: CurrentPhase | null, caseMetadata: CaseMetadata | null, elapsedTime: string): string {
  // This function should only be called when phases exist
  // If no phases, the caller should not call this function at all
  if (!currentPhase || !caseMetadata) {
    console.warn("⚠️ getPhaseStatus called without valid phase data - this should not happen");
    return `INTERVIEW TIMING & PHASE STATUS (sent every session update):\n\nTotal elapsed time: ${elapsedTime}\nNo phase information available.`;
  }

  const { phase, timeInPhase, index } = currentPhase;
  
  let statusText = `INTERVIEW TIMING & PHASE STATUS (sent every session update):\n\n`;
  statusText += `Total elapsed time: ${elapsedTime}\n`;
  statusText += `According to plan, you should currently be in: "${phase.name}"\n`;
  statusText += `Current phase description: ${phase.details}\n`;
  statusText += `Time spent in this phase: ${Math.round(timeInPhase * 10) / 10} minutes (planned duration: ${phase.duration} minute${phase.duration !== 1 ? 's' : ''})\n\n`;
  
  // Previous/Next phase context (exactly like old system)
  if (index > 0) {
    const prevPhase = caseMetadata.phases[index - 1];
    statusText += `Previous phase was: "${prevPhase.name}" - ${prevPhase.details}\n`;
  }
  
  const nextPhaseIndex = index + 1;
  if (nextPhaseIndex < caseMetadata.phases.length) {
    const nextPhase = caseMetadata.phases[nextPhaseIndex];
    statusText += `Next phase will be: "${nextPhase.name}" - ${nextPhase.details}\n`;
  } else {
    statusText += `This is the final phase - wrap up after covering main points.\n`;
  }
  
  return statusText;
}

// Generate timing nudges (exactly like old system)
function getPhaseNudge(currentPhase: CurrentPhase | null, caseMetadata: CaseMetadata | null): string | null {
  if (!currentPhase || !caseMetadata) return null;
  
  const { phase, timeInPhase, index, totalElapsed } = currentPhase;
  const nudgeBuffer = caseMetadata.nudgeBuffer || 2; // Default 2 minute buffer
  
  // Check if we're running over time in current phase (like old system)
  if (timeInPhase > phase.duration + nudgeBuffer) {
    const nextPhaseIndex = index + 1;
    if (nextPhaseIndex < caseMetadata.phases.length) {
      const nextPhase = caseMetadata.phases[nextPhaseIndex];
      return `TIMING NUDGE: According to the plan, you should be transitioning to "${nextPhase.name}" (${nextPhase.details}). If you're still in an earlier phase, consider moving forward.`;
    } else {
      return `TIMING NUDGE: You're in the final phase and running over time. Consider wrapping up the interview with key recommendations.`;
    }
  }
  
  return null;
}

// Export helper function to get current phase for external components
export function getCurrentPhaseInfo(sessionId: string, elapsedMs: number): CurrentPhase | null {
  const cacheKey = `session_settings_${sessionId}`;
  const staticData = sessionCache.get<any>(cacheKey);
  
  if (!staticData?.caseMetadata) {
    return null;
  }
  
  return getCurrentPhase(elapsedMs, staticData.caseMetadata);
}

// Export helper to get case metadata
export function getCaseMetadata(sessionId: string): CaseMetadata | null {
  const cacheKey = `session_settings_${sessionId}`;
  const staticData = sessionCache.get<any>(cacheKey);
  
  return staticData?.caseMetadata || null;
}

// Export global variable substitution for external use
export async function processVariableSubstitution(
  template: string,
  sessionId?: string,
  elapsedMs?: number,
  startTime?: Date,
  additionalMetadata?: any
): Promise<{ processedText: string; warnings: any[]; success: boolean }> {
  ensureProcessorsInitialized();
  
  const context: SubstitutionContext = {
    sessionId,
    elapsedMs,
    startTime,
    metadata: additionalMetadata
  };
  
  const result = await globalSubstituteVariables(template, context);
  
  return {
    processedText: result.processedText,
    warnings: result.warnings,
    success: result.success
  };
}

// Export function to get variable registry status
export function getVariableRegistryStatus() {
  ensureProcessorsInitialized();
  const { variableRegistry } = require("./variable-substitution");
  return variableRegistry.getStatus();
}

// Helper function to clear context (following Hume's pattern)
export async function clearSessionContext(sessionId: string): Promise<SessionSettings> {
  const cacheKey = `session_settings_${sessionId}`;
  const staticData = sessionCache.get<any>(cacheKey);

  if (!staticData) {
    throw new Error(`Session ${sessionId} not initialized. Call initializeSessionSettings first.`);
  }

  // Return session settings without context to clear it
  return {
    type: "session_settings"
    // No context property = clears any previously injected context
  };
}

// Helper function to send persistent context (stays active for entire session)
export async function setPersistentContext(
  sessionId: string,
  contextText: string,
  elapsedMs: number = 0,
  startTime?: Date
): Promise<SessionSettings> {
  ensureProcessorsInitialized();
  
  const substitutionContext: SubstitutionContext = {
    sessionId,
    elapsedMs,
    startTime,
    metadata: {}
  };
  
  // Process context text for variables too
  const contextResult = await globalSubstituteVariables(contextText, substitutionContext);
  
  if (contextResult.warnings.length > 0) {
    console.warn("⚠️ Context variable warnings:", contextResult.warnings);
  }

  return {
    type: "session_settings",
    context: {
      text: contextResult.processedText,
      type: "persistent" // Applies to all subsequent messages
    }
  };
}



