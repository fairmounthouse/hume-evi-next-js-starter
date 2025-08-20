// Test: Exact Old System Implementation
// Timer-based phase detection + nudging exactly like old system

console.log("🕐 Testing Exact Old System Implementation");

// Case metadata from your database
const caseMetadata = {
  phases: [
    { name: "Phase 1: Background and Setup", details: "Introduce problem, clarifying questions, and case context", duration: 6 },
    { name: "Phase 2: Framework Development", details: "Present framework covering market, revenue, cost, and hypothesis", duration: 6 },
    { name: "Phase 3: Competitive Benchmarking", details: "Analyze operating profit data and competitor performance", duration: 5 },
    { name: "Phase 4: Brainstorming", details: "Identify reasons for revenue decline across industry", duration: 6 },
    { name: "Phase 5: Revenue Analysis", details: "Calculate revenue per flight and analyze business impact", duration: 8 },
    { name: "Phase 6: Recommendation", details: "Present final recommendations to CEO", duration: 4 }
  ],
  totalDuration: 35,
  nudgeBuffer: 2
};

// Old system: Timer determines where you SHOULD be
function getCurrentPhase(elapsedMs, caseMetadata) {
  if (!caseMetadata || !caseMetadata.phases.length) return null;

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

// Old system: Phase status (exactly matching your old wording)
function getPhaseStatus(currentPhase, caseMetadata, elapsedTime) {
  if (!currentPhase) return null;
  
  const { phase, timeInPhase, index } = currentPhase;
  
  let statusText = `INTERVIEW TIMING & PHASE STATUS (sent every session update):\n\n`;
  statusText += `Total elapsed time: ${elapsedTime}\n`;
  statusText += `According to plan, you should currently be in: "${phase.name}"\n`;
  statusText += `Current phase description: ${phase.details}\n`;
  statusText += `Time spent in this phase: ${Math.round(timeInPhase * 10) / 10} minutes (planned duration: ${phase.duration} minute${phase.duration !== 1 ? 's' : ''})\n\n`;
  
  // Previous/Next phase context
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

// Old system: Phase nudge (exactly matching your old logic)
function getPhaseNudge(currentPhase, caseMetadata) {
  if (!currentPhase || !caseMetadata) return null;
  
  const { phase, timeInPhase, index } = currentPhase;
  const nudgeBuffer = caseMetadata.nudgeBuffer || 2;
  
  // Check if we're running over time in current phase (old system logic)
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

// Test scenarios
const testScenarios = [
  { name: "5 minutes - Phase 1, on track", elapsedMs: 5 * 60 * 1000 },
  { name: "8 minutes - Phase 2, on track", elapsedMs: 8 * 60 * 1000 },
  { name: "9 minutes - Phase 2, running over (should nudge to Phase 3)", elapsedMs: 9 * 60 * 1000 },
  { name: "15 minutes - Phase 3, on track", elapsedMs: 15 * 60 * 1000 },
  { name: "20 minutes - Phase 3, way over (should nudge to Phase 4)", elapsedMs: 20 * 60 * 1000 },
  { name: "37 minutes - Phase 6, over total duration", elapsedMs: 37 * 60 * 1000 }
];

testScenarios.forEach(scenario => {
  console.log(`\n📍 ${scenario.name}`);
  
  const currentPhase = getCurrentPhase(scenario.elapsedMs, caseMetadata);
  const elapsedTime = `${Math.floor(scenario.elapsedMs / 60000)} minutes ${Math.floor((scenario.elapsedMs % 60000) / 1000)} seconds`;
  
  const phaseStatus = getPhaseStatus(currentPhase, caseMetadata, elapsedTime);
  const phaseNudge = getPhaseNudge(currentPhase, caseMetadata);
  
  console.log("📊 Phase Status:");
  console.log(phaseStatus);
  
  if (phaseNudge) {
    console.log("\n🚨 Phase Nudge:");
    console.log(phaseNudge);
  } else {
    console.log("\n✅ No nudge needed - on track");
  }
  
  console.log("\n" + "=".repeat(80));
});

console.log("\n🎯 OLD SYSTEM LOGIC:");
console.log("✅ Timer determines where you SHOULD be (not where you actually are)");
console.log("✅ Hume is smart enough to know actual conversation state");
console.log("✅ We just provide timing guidance and phase expectations");
console.log("✅ Nudges trigger when spending too long in a phase");
