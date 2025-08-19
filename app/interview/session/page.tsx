import { getHumeAccessToken } from "@/utils/getHumeAccessToken";
import dynamic from "next/dynamic";
import { redirect } from "next/navigation";

const Chat = dynamic(() => import("@/components/Chat"), {
  ssr: false,
});

export default async function InterviewSessionPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const accessToken = await getHumeAccessToken();
  const sessionId = searchParams.sessionId;
  const caseId = searchParams.caseId;
  const interviewerId = searchParams.interviewerId;
  const difficultyId = searchParams.difficultyId;

  if (!accessToken) {
    throw new Error('Unable to get access token');
  }

  // Redirect to setup if required parameters are missing
  if (!sessionId || !caseId || !interviewerId || !difficultyId) {
    redirect('/interview/setup');
  }

  return (
    <div className={"grow flex flex-col h-full min-h-screen max-h-screen overflow-hidden"}>
      <Chat 
        accessToken={accessToken}
      />
    </div>
  );
}
