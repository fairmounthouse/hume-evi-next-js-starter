// FINAL EXAMPLE: Complete Session Settings with Phase Nudging
console.log("📨 COMPLETE SESSION SETTINGS EXAMPLE");

// Real case metadata
const caseMetadata = {
  phases: [
    { name: "Phase 1: Background and Setup", details: "Introduce problem, clarifying questions, and case context", duration: 6 },
    { name: "Phase 2: Framework Development", details: "Present framework covering market, revenue, cost, and hypothesis", duration: 6 },
    { name: "Phase 3: Competitive Benchmarking", details: "Analyze operating profit data and competitor performance", duration: 5 }
  ],
  totalDuration: 17,
  nudgeBuffer: 2
};

// Old system functions
function getCurrentPhase(elapsedMs, caseMetadata) {
  const elapsedMinutes = elapsedMs / 60000;
  let cumulativeTime = 0;
  
  for (let i = 0; i < caseMetadata.phases.length; i++) {
    const phase = caseMetadata.phases[i];
    if (elapsedMinutes >= cumulativeTime && elapsedMinutes < cumulativeTime + phase.duration) {
      return {
        phase,
        timeInPhase: elapsedMinutes - cumulativeTime,
        index: i,
        totalElapsed: elapsedMinutes
      };
    }
    cumulativeTime += phase.duration;
  }
  
  const lastPhase = caseMetadata.phases[caseMetadata.phases.length - 1];
  return {
    phase: lastPhase,
    timeInPhase: elapsedMinutes - (caseMetadata.totalDuration - lastPhase.duration),
    index: caseMetadata.phases.length - 1,
    totalElapsed: elapsedMinutes
  };
}

function getPhaseStatus(currentPhase, caseMetadata, elapsedTime) {
  if (!currentPhase) return null;
  
  const { phase, timeInPhase, index } = currentPhase;
  
  let statusText = `INTERVIEW TIMING & PHASE STATUS (sent every session update):\n\n`;
  statusText += `Total elapsed time: ${elapsedTime}\n`;
  statusText += `According to plan, you should currently be in: "${phase.name}"\n`;
  statusText += `Current phase description: ${phase.details}\n`;
  statusText += `Time spent in this phase: ${Math.round(timeInPhase * 10) / 10} minutes (planned duration: ${phase.duration} minute${phase.duration !== 1 ? 's' : ''})\n\n`;
  
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

function getPhaseNudge(currentPhase, caseMetadata) {
  if (!currentPhase || !caseMetadata) return null;
  
  const { phase, timeInPhase, index } = currentPhase;
  const nudgeBuffer = caseMetadata.nudgeBuffer || 2;
  
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

// Test with 10 minutes elapsed (should trigger nudge in Phase 1)
const elapsedMs = 10 * 60 * 1000; // 10 minutes
const elapsedTime = "10 minutes 0 seconds";

const currentPhase = getCurrentPhase(elapsedMs, caseMetadata);
const phaseStatus = getPhaseStatus(currentPhase, caseMetadata, elapsedTime);
const phaseNudge = getPhaseNudge(currentPhase, caseMetadata);

console.log("\n🎯 EXAMPLE: 10 minutes elapsed (Phase 1 duration = 6 min, buffer = 2 min)");
console.log("Expected: Should trigger nudge since 10 > 6 + 2 = 8 minutes");

console.log("\n📊 PHASE STATUS:");
console.log(phaseStatus);

if (phaseNudge) {
  console.log("\n🚨 TIMING NUDGE:");
  console.log(phaseNudge);
} else {
  console.log("\n✅ No nudge triggered");
}

// Final session_settings example
const sessionSettings = {
  type: "session_settings",
  variables: {
    INTERVIEWER_IDENTITY: "Bill Hwang, Senior Partner at McKinsey",
    INTERVIEW_CASE: "Case 7: Race to the Bottom - Airlines profitability case",
    COACHING_PROMPT: "COACHING_MODE: enabled - Provide feedback and guidance",
    DIFFICULTY_PROMPT: "DIFFICULTY_LEVEL: mid - Balance guidance with independence", 
    TOTAL_ELAPSED_TIME: elapsedTime
  },
  context: {
    text: [phaseStatus, phaseNudge].filter(Boolean).join('\n\n'),
    type: "temporary"
  },
  transcription: { verbose: true }
};

console.log("\n📤 FINAL SESSION_SETTINGS TO HUME:");
console.log(JSON.stringify(sessionSettings, null, 2));
