"use client";

import InterviewSetup from "@/components/InterviewSetup";
import UsageProtection from "@/components/UsageProtection";
import { useRouter } from "next/navigation";

export default function InterviewSetupPage() {
  const router = useRouter();

  const handleStartInterview = (selections: {
    caseId: string;
    interviewerId: string;
    difficultyId: string;
    sessionId?: string; // NEW: Accept session ID from document upload
  }) => {
    // Use provided session ID or generate a new one
    const finalSessionId = selections.sessionId || Date.now().toString();

    console.log("🚀 Starting interview with session ID:", {
      providedSessionId: selections.sessionId,
      finalSessionId: finalSessionId,
      hasDocumentSession: !!selections.sessionId
    });

    // Store selections in sessionStorage or pass via URL params
    const params = new URLSearchParams({
      sessionId: finalSessionId,
      caseId: selections.caseId,
      interviewerId: selections.interviewerId,
      difficultyId: selections.difficultyId,
    });
    
    router.push(`/interview/device-setup?${params.toString()}`);
  };

  return (
    // Block users who have exceeded their monthly minute limits
    <UsageProtection
      usageType="minutes_per_month"
      usageAmount={1}
      fallbackTitle="Monthly Minutes Exhausted"
      fallbackDescription="You've used all your monthly interview minutes. Upgrade your plan to continue practicing or wait until your next billing period."
    >
      <InterviewSetup onStartInterview={handleStartInterview} />
    </UsageProtection>
  );
}
