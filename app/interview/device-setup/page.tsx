"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import DeviceSetup from "@/components/DeviceSetup";
import UsageProtection from "@/components/UsageProtection";

function DeviceSetupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);

  // Get interview configuration from URL params
  const sessionId = searchParams.get('sessionId');
  const caseId = searchParams.get('caseId');
  const interviewerId = searchParams.get('interviewerId');
  const difficultyId = searchParams.get('difficultyId');

  useEffect(() => {
    // Redirect to setup if required parameters are missing
    if (!sessionId || !caseId || !interviewerId || !difficultyId) {
      router.replace('/interview/setup');
      return;
    }
    setIsReady(true);
  }, [sessionId, caseId, interviewerId, difficultyId, router]);

  const handleContinue = (devices: {
    cameraId: string;
    microphoneId: string;
    speakerId: string;
  }) => {
    console.log("🎥 Device setup completed:", devices);
    
    // Store device preferences in sessionStorage for the interview session
    sessionStorage.setItem('selectedDevices', JSON.stringify(devices));
    
    // Continue to interview session with all parameters
    const params = new URLSearchParams({
      sessionId: sessionId!,
      caseId: caseId!,
      interviewerId: interviewerId!,
      difficultyId: difficultyId!,
    });
    
    router.push(`/interview/session?${params.toString()}`);
  };

  const handleBack = () => {
    router.back();
  };

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading device setup...</p>
        </div>
      </div>
    );
  }

  return (
    <UsageProtection
      usageType="minutes_per_month"
      usageAmount={1}
      fallbackTitle="Monthly Minutes Exhausted"
      fallbackDescription="You've used all your monthly interview minutes. Upgrade your plan to continue practicing or wait until your next billing period."
    >
      <DeviceSetup 
        onContinue={handleContinue}
        onClose={handleBack}
      />
    </UsageProtection>
  );
}

export default function DeviceSetupPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading device setup...</p>
        </div>
      </div>
    }>
      <DeviceSetupContent />
    </Suspense>
  );
}
