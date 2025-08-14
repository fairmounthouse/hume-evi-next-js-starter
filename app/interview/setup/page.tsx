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
    // Store selections in sessionStorage or pass via URL params
    const params = new URLSearchParams({
      case: selections.caseId,
      interviewer: selections.interviewerId,
      difficulty: selections.difficultyId,
    });
    
    router.push(`/interview/session?${params.toString()}`);
  };

  return <InterviewSetup onStartInterview={handleStartInterview} />;
}
