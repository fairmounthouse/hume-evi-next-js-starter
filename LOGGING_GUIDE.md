# 🔍 **Complete Logging Guide for Interview Testing**

Big Daddy, here's your **COMPLETE** logging guide to test and verify everything works during interviews!

## 🏗️ **OLD SYSTEM APPROACH - CONFIRMED**

**Big Daddy, you were absolutely right!** The system now works exactly like the old system:

### **✅ CACHED ONCE (Static Data):**
- Interviewer identity content (from database)
- Interview case content (from database) 
- Difficulty prompts (from database)
- Case phases/metadata (from database)
- Coaching config (from database)

### **🔄 COMPUTED FRESH EVERY TIME (Dynamic Data):**
- `TOTAL_ELAPSED_TIME` - calculated from current time vs start time
- `now` - current timestamp in speech format
- Current phase detection - based on elapsed time vs phase durations
- Phase status text - generated fresh with current timing
- Phase nudges - computed fresh based on current timing vs phase limits
- Context injection - built fresh every send

### **⏰ 30-Second Timer Purpose:**
The timer only determines **WHEN** to send to Hume, but **ALL** time-sensitive values are computed fresh on every send - exactly like your old system!

## 🎯 **What to Watch For in Console**

### **1. Session Initialization (When clicking "Start Call")**

```
🟢 START CALL BUTTON CLICKED
📋 Interview configuration: {
  sessionId: "1737019234567",
  selectedCaseId: "uuid-case-123", 
  selectedInterviewerId: "uuid-interviewer-456",
  selectedDifficultyId: "uuid-difficulty-789",
  configId: "7fc27cfb-9846-4790-88d7-2fd0594d896b",
  hasAccessToken: true
}

💾 Creating session record in database...
📝 Session data to be created: {
  session_id: "1737019234567",
  case_id: "uuid-case-123",
  new_interviewer_profile_id: "uuid-interviewer-456", // Combined profile includes difficulty, seniority, company
  coach_mode_enabled: false,
  status: "in_progress"
}
✅ Session record created successfully

🔄 Initializing session settings cache...
📋 Session ID: 1737019234567
📊 Raw session data fetched: {
  hasData: true,
  error: undefined,
  coachMode: false,
  hasInterviewerProfile: true,
  hasInterviewCase: true, 
  hasDifficultyProfile: true,
  caseHasPhases: true,        ← VERIFY THIS IS TRUE
  phasesCount: 6,             ← VERIFY PHASE COUNT
  hasAdditionalMetadata: true
}

🎯 Processed case metadata: {
  hasCaseMetadata: true,
  phasesCount: 6,             ← VERIFY MATCHES DATABASE
  totalDuration: 35,          ← VERIFY CALCULATED CORRECTLY
  nudgeBuffer: 2,             ← VERIFY FROM additional_metadata
  phaseNames: [               ← VERIFY PHASE NAMES
    "Phase 1: Background and Setup",
    "Phase 2: Framework Development", 
    "Phase 3: Competitive Benchmarking",
    "Phase 4: Brainstorming",
    "Phase 5: Revenue Analysis",
    "Phase 6: Recommendation"
  ],
  phaseDurations: [6, 6, 5, 6, 8, 4]  ← VERIFY DURATIONS
}

💾 Cached data summary: {
  hasInterviewerIdentity: true,
  interviewerIdentityLength: 2847,    ← VERIFY CONTENT LENGTH
  hasCaseTemplate: true,
  caseTemplateLength: 4521,           ← VERIFY CONTENT LENGTH
  hasDifficultyPrompt: true,
  hasCaseMetadata: true,              ← CRITICAL: MUST BE TRUE
  hasCoachingConfig: true,
  cacheKey: "session_settings_1737019234567"
}
✅ Session settings cache initialized
```

### **2. Initial Session Settings Build**

```
🏗️ Building session settings: {
  sessionId: "1737019234567",
  elapsedMs: 0,
  elapsedMinutes: 0,
  hasStartTime: false,
  hasTemporaryContext: false,
  coachModeEnabled: undefined
}

📦 Using cached static data: {
  hasInterviewerIdentity: true,
  hasCaseTemplate: true,
  hasDifficultyPrompt: true,
  hasCaseMetadata: true,           ← CRITICAL: MUST BE TRUE
  hasCoachingConfig: true
}

⏰ Time calculations: {
  elapsedMs: 0,
  elapsedTime: "0 seconds",
  currentTime: "Tuesday, January 14, 2025 at 3:45 PM"
}

📅 Current phase info (FRESH - like old system): {
  hasCurrentPhase: true,           ← VERIFY TRUE
  phaseName: "Phase 1: Background and Setup",  ← VERIFY CORRECT PHASE
  phaseIndex: 0,                   ← VERIFY STARTS AT 0
  timeInPhase: 0.5,                ← COMPUTED FRESH FROM ELAPSED TIME
  totalElapsed: 0.5,               ← COMPUTED FRESH FROM ELAPSED TIME
  phaseDuration: 6,                ← VERIFY MATCHES DATABASE
  computedAt: 1737019264567        ← FRESH COMPUTATION TIMESTAMP
}

🚀 Initializing standard variable processors: {
  timeProcessors: 4,
  sessionProcessors: 3,
  contentProcessors: 3,
  patternProcessors: 2,
  totalProcessors: 12
}
✅ All standard variable processors initialized successfully

🔍 Detected X variables in template: {
  variables: ["TOTAL_ELAPSED_TIME", "CURRENT_PHASE", ...],
  templateLength: 4521,
  templatePreview: "..."
}

✅ Variable substituted successfully: {
  variable: "TOTAL_ELAPSED_TIME",
  processor: "TOTAL_ELAPSED_TIME", 
  valueLength: 9,
  valuePreview: "0 seconds",
  fromCache: false
}

📝 Final variables built: {
  INTERVIEWER_IDENTITY_length: 2847,
  INTERVIEW_CASE_length: 4521,
  COACHING_PROMPT_length: 1234,

  TOTAL_ELAPSED_TIME: "0 seconds",
  now: "Tuesday, January 14, 2025 at 3:45 PM"
}

📊 Added phase status to context: {
  phaseStatusLength: 456,
  currentPhaseName: "Phase 1: Background and Setup",
  phaseIndex: 0
}
✅ No phase nudge needed - on track

📤 Final context built: {
  contextPartsCount: 1,
  totalContextLength: 456,
  contextType: "temporary"
}

🎯 Final session settings ready: {
  type: "session_settings",
  hasVariables: true,
  variableCount: 6,
  hasTranscription: true,
  hasContext: true,
  settingsSize: 8934
}

📤 COMPLETE SESSION SETTINGS PAYLOAD TO HUME:
=====================================
{
  "type": "session_settings",
  "variables": {
    "INTERVIEWER_IDENTITY": "...",
    "INTERVIEW_CASE": "...",
    "COACHING_PROMPT": "...",

    "TOTAL_ELAPSED_TIME": "0 seconds",
    "now": "Tuesday, January 14, 2025 at 3:45 PM"
  },
  "transcription": { "verbose": true },
  "context": {
    "text": "INTERVIEW TIMING & PHASE STATUS...",
    "type": "temporary"
  }
}
=====================================
```

### **3. Connection to Hume**

```
🔌 Connecting to Hume with session settings...
📤 Session settings being sent to Hume: {
  auth: { type: "accessToken", hasValue: true },
  configId: "7fc27cfb-9846-4790-88d7-2fd0594d896b",
  sessionSettingsSize: 8934,
  sessionSettingsPreview: "..."
}

🔌 Hume connection status changed: {
  status: "connected",
  timestamp: "2025-01-14T20:45:30.123Z",
  sessionId: "1737019234567"
}

✅ CALL CONNECTED SUCCESSFULLY TO HUME

🚀 Connection established - initializing session settings
📍 Recording interview start time: 1737019234567
⏱️ Scheduling initial context update in 500ms...
🎬 Sending initial context update with phase status

⏰ Starting periodic context updates (every 30 seconds)
```

### **4. Periodic Updates (Every 30 seconds)**

```
🔔 30-second timer triggered - computing FRESH values for Hume
🔄 Starting context update: {
  hasTemporaryContext: false,
  temporaryContextLength: 0,
  forceUpdate: false,
  connectionStatus: "connected"
}

⏱️ Elapsed time calculation: {
  startTime: 1737019234567,
  currentTime: 1737019264567,
  elapsedMs: 30000,
  elapsedMinutes: 0.5
}

📊 Phase detection result: {
  hasCurrentPhase: true,
  phaseName: "Phase 1: Background and Setup",
  phaseIndex: 0,
  previousPhaseIndex: 0,
  phaseTransition: false          ← WATCH FOR TRUE WHEN PHASES CHANGE
}

📡 Sending session settings to Hume (attempt 1)...
✅ Context update sent successfully [Phase 1: Phase 1: Background and Setup]
📊 Update summary: {
  elapsedTime: "0.5 minutes",
  currentPhase: "Phase 1: Background and Setup",
  hasNudge: false,               ← WATCH FOR TRUE WHEN RUNNING OVER
  contextPartsCount: 1
}
```

### **5. Phase Transitions (Watch for these!)**

```
📊 Phase detection result: {
  hasCurrentPhase: true,
  phaseName: "Phase 2: Framework Development",
  phaseIndex: 1,
  previousPhaseIndex: 0,
  phaseTransition: true          ← PHASE CHANGE DETECTED!
}

🔄 PHASE TRANSITION DETECTED: 0 → 1 (Phase 2: Framework Development)
🚨 Forcing update due to phase transition

📊 Added phase status to context: {
  phaseStatusLength: 567,
  currentPhaseName: "Phase 2: Framework Development",
  phaseIndex: 1
}
```

### **6. Timing Nudges (When running over time)**

```
🚨 Added phase nudge to context: {
  nudgeLength: 234,
  nudgePreview: "TIMING NUDGE: According to the plan, you should be transitioning to \"Phase 3: Competitive..."
}

📤 Final context built: {
  contextPartsCount: 2,           ← 2 = Phase Status + Nudge
  totalContextLength: 801,
  contextType: "temporary"
}
```

### **7. Coaching Mode Changes (LOCAL ONLY - NO DATABASE)**

```
🎓 Coaching mode toggle initiated (LOCAL ONLY - no database update): {
  sessionId: "1737019234567",
  newState: true,           ← Toggle clicked ON
  previousState: false,     ← Was OFF before
  isConnected: true
}

🔄 Updating local coaching state (no database write)
✅ Local coaching state updated: { newCoachingMode: true }

🔌 Sending real-time coaching update to Hume...
⏱️ Interview elapsed time for coaching update: {
  elapsedMs: 450000,
  elapsedMinutes: 7.5
}

🎓 Simple coaching prompt selection: {
  coachModeEnabled: true,
  isCoachingOn: true,
  promptType: "ENABLED",      ← SENDS ENABLED PROMPT
  promptLength: 847
}

📝 Building session settings with coaching change: {
  temporaryContext: "Coaching mode manually enabled by user.",
  newCoachingMode: true
}

📤 Sending coaching update to Hume: {
  settingsSize: 9234,
  hasContext: true,
  contextIncludes: true
}
✅ Coaching mode updated in real-time with enhanced context
```

## 🚨 **Red Flags to Watch For**

### **❌ PROBLEMS:**
- `caseHasPhases: false` → Case has no phases data
- `phasesCount: 0` → Empty phases array
- `hasCaseMetadata: false` → Case metadata not processed
- `hasCurrentPhase: false` → Phase calculation failed
- `❌ Failed to fetch session context` → Database query failed
- `❌ Session not initialized` → Cache miss

### **✅ SUCCESS INDICATORS:**
- `phasesCount: 6` (or whatever your case has)
- `totalDuration: 35` (sum of all phase durations)
- `hasCurrentPhase: true`
- `phaseTransition: true` (when time advances to next phase)
- `hasNudge: true` (when running over time)
- `✅ Context update sent successfully`

## 🔧 **Testing Checklist**

### **Before Starting Interview:**
1. ✅ Check browser console is open
2. ✅ Verify case/interviewer/difficulty selected
3. ✅ Confirm case has phases in database

### **During Interview:**
1. ✅ Verify initial session settings sent with phases
2. ✅ Watch for 30-second periodic updates
3. ✅ Test coaching mode toggle
4. ✅ Wait for phase transitions (based on time)
5. ✅ Look for timing nudges when running over

### **Key Timestamps to Test:**
- **0-6 minutes**: Phase 1 (no nudges)
- **6-12 minutes**: Phase 2 transition
- **8+ minutes in Phase 1**: Should trigger nudge
- **12-17 minutes**: Phase 3 transition
- **20+ minutes in Phase 2**: Should trigger nudge

## 📊 **Sample Console Output Pattern**

```
🟢 START CALL → 💾 CREATE SESSION → 🔍 FETCH DATA → 🎯 PROCESS METADATA → 
💾 CACHE DATA → 🏗️ BUILD SETTINGS → 🔌 CONNECT HUME → ⏰ START TIMERS → 
🔔 PERIODIC UPDATES → 🔄 PHASE TRANSITIONS → 🚨 TIMING NUDGES
```

This logging will show you **EXACTLY** what data is being sent to Hume and when, Big Daddy!
