"use client";

import InterviewSetup from "@/components/InterviewSetup";
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
    
    router.push(`/interview/session?${params.toString()}`);
  };

  return <InterviewSetup onStartInterview={handleStartInterview} />;
}
