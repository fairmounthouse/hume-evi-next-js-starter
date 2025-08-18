"use client";

import InterviewSetup from "@/components/InterviewSetup";
import { useRouter } from "next/navigation";

export default function InterviewSetupPage() {
  const router = useRouter();

  const handleStartInterview = (selections: {
    caseId: string;
    interviewerId: string;
    difficultyId: string;
  }) => {
    // Generate a unique session ID
    const sessionId = Date.now().toString();

    // Store selections in sessionStorage or pass via URL params
    const params = new URLSearchParams({
      sessionId: sessionId,
      caseId: selections.caseId,
      interviewerId: selections.interviewerId,
      difficultyId: selections.difficultyId,
    });
    
    router.push(`/interview/session?${params.toString()}`);
  };

  return <InterviewSetup onStartInterview={handleStartInterview} />;
}
