/**
 * Standard Variable Processors for Interview System
 * Each processor handles a specific type of variable substitution
 */

import { VariableProcessor, SubstitutionContext } from "./variable-substitution";
import { sessionCache } from "./session-cache";

// Time-based variable processors
export const timeProcessors: VariableProcessor[] = [
  {
    name: "TOTAL_ELAPSED_TIME",
    description: "Formats elapsed time since interview start",
    pattern: /^TOTAL_ELAPSED_TIME$/,
    processor: (context?: SubstitutionContext) => {
      if (!context?.elapsedMs) return "0 seconds";
      
      const minutes = Math.floor(context.elapsedMs / 60000);
      const seconds = Math.floor((context.elapsedMs % 60000) / 1000);
      
      if (minutes === 0) return `${seconds} seconds`;
      if (seconds === 0) return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
      return `${minutes} minute${minutes !== 1 ? 's' : ''} and ${seconds} second${seconds !== 1 ? 's' : ''}`;
    },
    fallbackValue: "unknown time",
    cacheTtl: 0 // Never cache - always fresh
  },
  
  {
    name: "now",
    description: "Current timestamp in our custom speech-friendly format (overrides Hume's UTC format) - ALWAYS FRESH",
    pattern: /^now$/,
    processor: () => {
      return new Date().toLocaleString(undefined, {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        weekday: "long",
        month: "long",
        day: "numeric",
      });
    },
    fallbackValue: "current time",
    cacheTtl: 0 // NEVER cache - always fresh like old system
  },

  {
    name: "CURRENT_TIME_UTC",
    description: "Current UTC time in ISO format - ALWAYS FRESH",
    pattern: /^CURRENT_TIME_UTC$/,
    processor: () => new Date().toISOString(),
    fallbackValue: new Date().toISOString(),
    cacheTtl: 0 // NEVER cache - always fresh like old system
  },

  {
    name: "ELAPSED_MINUTES",
    description: "Elapsed time in minutes only",
    pattern: /^ELAPSED_MINUTES$/,
    processor: (context?: SubstitutionContext) => {
      if (!context?.elapsedMs) return "0";
      return Math.floor(context.elapsedMs / 60000).toString();
    },
    fallbackValue: "0",
    cacheTtl: 0
  }
];

// Session-based variable processors
export const sessionProcessors: VariableProcessor[] = [
  {
    name: "SESSION_ID",
    description: "Current session identifier",
    pattern: /^SESSION_ID$/,
    processor: (context?: SubstitutionContext) => context?.sessionId || "unknown-session",
    fallbackValue: "unknown-session",
    cacheTtl: 3600000 // Cache for 1 hour
  },

  {
    name: "CURRENT_PHASE",
    description: "Current interview phase name - ALWAYS FRESH",
    pattern: /^CURRENT_PHASE$/,
    processor: async (context?: SubstitutionContext) => {
      if (!context?.sessionId || !context?.elapsedMs) return "Unknown Phase";
      
      try {
        const { getCurrentPhaseInfo } = await import("./session-context");
        const currentPhase = getCurrentPhaseInfo(context.sessionId, context.elapsedMs);
        return currentPhase?.phase.name || "Unknown Phase";
      } catch (error) {
        console.error("Error getting current phase:", error);
        return "Unknown Phase";
      }
    },
    fallbackValue: "Unknown Phase",
    cacheTtl: 0 // NEVER cache - always fresh like old system
  },

  {
    name: "PHASE_DURATION",
    description: "Current phase planned duration - ALWAYS FRESH",
    pattern: /^PHASE_DURATION$/,
    processor: async (context?: SubstitutionContext) => {
      if (!context?.sessionId || !context?.elapsedMs) return "unknown";
      
      try {
        const { getCurrentPhaseInfo } = await import("./session-context");
        const currentPhase = getCurrentPhaseInfo(context.sessionId, context.elapsedMs);
        return currentPhase ? `${currentPhase.phase.duration} minutes` : "unknown";
      } catch (error) {
        return "unknown";
      }
    },
    fallbackValue: "unknown",
    cacheTtl: 0 // NEVER cache - always fresh like old system
  }
];

// Dynamic content processors
export const contentProcessors: VariableProcessor[] = [
  {
    name: "RANDOM_UUID",
    description: "Generates a random UUID",
    pattern: /^RANDOM_UUID$/,
    processor: () => crypto.randomUUID(),
    fallbackValue: "00000000-0000-0000-0000-000000000000",
    cacheTtl: 0 // Never cache - always generate new
  },

  {
    name: "TIMESTAMP_MS",
    description: "Current timestamp in milliseconds",
    pattern: /^TIMESTAMP_MS$/,
    processor: () => Date.now().toString(),
    fallbackValue: "0",
    cacheTtl: 0
  },

  {
    name: "USER_AGENT",
    description: "Browser user agent string",
    pattern: /^USER_AGENT$/,
    processor: () => {
      if (typeof navigator !== 'undefined') {
        return navigator.userAgent;
      }
      return "Unknown Browser";
    },
    fallbackValue: "Unknown Browser",
    cacheTtl: 3600000 // Cache for 1 hour
  }
];

// Pattern-based processors (more flexible)
export const patternProcessors: VariableProcessor[] = [
  {
    name: "ELAPSED_TIME_FORMAT",
    description: "Elapsed time with custom format (e.g., ELAPSED_TIME_FORMAT_HOURS)",
    pattern: /^ELAPSED_TIME_FORMAT_(.+)$/,
    processor: (context?: SubstitutionContext) => {
      if (!context?.elapsedMs) return "0";
      
      // Extract format from the variable name in context
      const variableName = context.metadata?.currentVariable;
      const match = variableName?.match(/^ELAPSED_TIME_FORMAT_(.+)$/);
      const format = match?.[1]?.toLowerCase() || "default";
      
      const totalSeconds = Math.floor(context.elapsedMs / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      switch (format) {
        case "hours":
          return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${minutes}m`;
        case "seconds":
          return `${totalSeconds}s`;
        case "hms":
          return hours > 0 ? `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}` : `${minutes}:${seconds.toString().padStart(2, '0')}`;
        default:
          return `${minutes} minutes ${seconds} seconds`;
      }
    },
    fallbackValue: "0",
    cacheTtl: 0
  },

  {
    name: "CACHE_VALUE",
    description: "Retrieves cached session values (e.g., CACHE_VALUE_user_name)",
    pattern: /^CACHE_VALUE_(.+)$/,
    processor: (context?: SubstitutionContext) => {
      const variableName = context?.metadata?.currentVariable;
      const match = variableName?.match(/^CACHE_VALUE_(.+)$/);
      const cacheKey = match?.[1];
      
      if (!cacheKey) return "unknown";
      
      const cachedValue = sessionCache.get(cacheKey);
      return cachedValue ? String(cachedValue) : "not_found";
    },
    fallbackValue: "cache_error",
    cacheTtl: 0 // Don't double-cache
  }
];

/**
 * Initialize all standard processors
 */
export function initializeStandardProcessors(): void {
  const { variableRegistry } = require("./variable-substitution");
  
  const allProcessors = [...timeProcessors, ...sessionProcessors, ...contentProcessors, ...patternProcessors];
  
  console.log("🚀 Initializing standard variable processors:", {
    timeProcessors: timeProcessors.length,
    sessionProcessors: sessionProcessors.length,
    contentProcessors: contentProcessors.length,
    patternProcessors: patternProcessors.length,
    totalProcessors: allProcessors.length
  });
  
  // Register all processor categories
  allProcessors.forEach(processor => variableRegistry.register(processor));
  
  console.log("✅ All standard variable processors initialized successfully");
}

/**
 * Register a custom processor at runtime
 */
export function registerCustomProcessor(processor: VariableProcessor): void {
  const { variableRegistry } = require("./variable-substitution");
  variableRegistry.register(processor);
}

/**
 * Get status of all registered processors
 */
export function getProcessorStatus() {
  const { variableRegistry } = require("./variable-substitution");
  return variableRegistry.getStatus();
}
