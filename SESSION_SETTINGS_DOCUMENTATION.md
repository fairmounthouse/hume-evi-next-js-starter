# Session Settings Variables - Quick Reference for Prompt Builders

## Main Session Variables

These variables are available in all prompts and automatically populated:

### 1. INTERVIEWER_IDENTITY
**Structure:**
```xml
<interviewer_identity>
<name>[interviewer_profiles_new.name]</name>
<alias>[interviewer_profiles_new.alias]</alias>
<difficulty_level>
[difficulty_profiles.prompt_id.prompt_content]
</difficulty_level>
<seniority_level>
[seniority_profiles.prompt_id.prompt_content]
</seniority_level>
<company_context>
[company_profiles.prompt_id.prompt_content]
</company_context>
</interviewer_identity>
```

**Fallback:** `You are a professional AI interviewer conducting this interview.`

### 2. INTERVIEW_CASE
**Structure:**
```
[interview_cases.prompt_id.prompt_content]

DOCUMENT ANALYSIS: (if candidate uploaded resume/job description)
CANDIDATE RESUME:
[resume_markdown from session document analysis]

JOB DESCRIPTION:
[job_description_markdown from session document analysis]

SUGGESTED PERSONALIZED QUESTIONS:
[interview_questions array from session document analysis]
```

**Fallback:** `Conduct a general interview appropriate for the selected difficulty level.`

### 3. COACHING_PROMPT
**When coaching enabled:**
```
[coaching_config.enabled_prompt_id.prompt_content]
```

**When coaching disabled:**
```
[coaching_config.disabled_prompt_id.prompt_content]
```

### 4. TOTAL_ELAPSED_TIME
**Examples:** `"5 minutes 30 seconds"`, `"12 minutes 0 seconds"`, `"0 seconds"`

### 5. now
**Format:** `"Tuesday, January 14, 2025 at 3:45 PM"`

### 6. AVAILABLE_EXHIBITS
**Structure:** `[comma-separated list of interview_cases.exhibits keys]`
**Fallback:** `"None available for this case"`

## Dynamic Context (Sent every 30 seconds)

### Phase Status Example
```
INTERVIEW TIMING & PHASE STATUS (sent every session update):

Total elapsed time: [computed from session start]
According to plan, you should currently be in: "[interview_cases.phases[current].name]"
Current phase description: [interview_cases.phases[current].details]
Time spent in this phase: [computed] (planned duration: [interview_cases.phases[current].duration] minutes)

Previous phase was: "[interview_cases.phases[previous].name]" - [interview_cases.phases[previous].details]
Next phase will be: "[interview_cases.phases[next].name]" - [interview_cases.phases[next].details]
```

### Timing Nudge Example
```
TIMING NUDGE: According to the plan, you should be transitioning to "[interview_cases.phases[next].name]" ([interview_cases.phases[next].details]). If you're still in an earlier phase, consider moving forward.
```

## Available Built-in Variables for Substitution

You can use these in your prompts with `{{VARIABLE_NAME}}` syntax:

### Time Variables
- `{{TOTAL_ELAPSED_TIME}}` → "10 minutes 30 seconds"
- `{{now}}` → "Tuesday, January 14, 2025 at 3:45 PM"
- `{{ELAPSED_MINUTES}}` → "10"
- `{{ELAPSED_TIME_FORMAT_HOURS}}` → "10m" or "1h 10m"

### Session Variables
- `{{SESSION_ID}}` → Current session ID
- `{{CURRENT_PHASE}}` → "Phase 2: Framework Development"
- `{{PHASE_DURATION}}` → "6 minutes"

### Custom Variables
- `{{CACHE_VALUE_anything}}` → Retrieves cached values
- `{{RANDOM_UUID}}` → Generates unique ID

## Complete Example Session Settings

This is what gets sent to Hume EVI:

```json
{
  "type": "session_settings",
  "variables": {
    "INTERVIEWER_IDENTITY": "[combined XML structure from database profiles]",
    "INTERVIEW_CASE": "[interview_cases.prompt_content + optional document analysis]",
    "COACHING_PROMPT": "[coaching_config prompt based on mode]",
    "TOTAL_ELAPSED_TIME": "[computed elapsed time string]",
    "now": "[current timestamp in speech format]",
    "AVAILABLE_EXHIBITS": "[comma-separated exhibit names from database]"
  },
  "context": {
    "text": "[phase status + timing nudges if applicable]",
    "type": "temporary"
  },
  "transcription": { "verbose": true }
}
```

## For Prompt Writers

1. **Use these variables directly** - they're automatically populated
2. **Add `{{variable_name}}`** in your prompts for dynamic content
3. **INTERVIEWER_IDENTITY** combines name, difficulty, seniority, and company
4. **INTERVIEW_CASE** includes document analysis when available
5. **Context section** has phase timing and nudges (updates every 30s)
