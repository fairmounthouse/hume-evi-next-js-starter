import { getHumeAccessToken } from "@/utils/getHumeAccessToken";
import { redirect } from "next/navigation";
import Chat from "@/components/Chat";
import UsageProtection from "@/components/UsageProtection";

export const dynamic = 'force-dynamic';

export default async function InterviewSessionPage({
  searchParams,
}: any) {
  const accessToken = await getHumeAccessToken();
  const params = await searchParams;
  const sessionId = params?.sessionId;
  const caseId = params?.caseId;
  const interviewerId = params?.interviewerId;
  const difficultyId = params?.difficultyId;

  if (!accessToken) {
    throw new Error('Unable to get access token');
  }

  // Redirect to setup if required parameters are missing
  if (!sessionId || !caseId || !interviewerId || !difficultyId) {
    redirect('/interview/setup');
  }

  return (
    // Only check minutes usage - no plan requirements
    <UsageProtection
      usageType="minutes_per_month"
      usageAmount={1}
      fallbackTitle="Monthly Minutes Exhausted"
      fallbackDescription="You've used all your monthly interview minutes. Upgrade for more time or wait until next month."
    >
      <div className={"grow flex flex-col h-full min-h-screen max-h-screen overflow-hidden"}>
        <Chat 
          accessToken={accessToken}
        />
      </div>
    </UsageProtection>
  );
}
