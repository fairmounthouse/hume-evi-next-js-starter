'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useClerkSync } from '@/hooks/useClerkSync';

export default function OnboardingPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  
  // Force sync on onboarding to ensure fresh data
  const { syncUser } = useClerkSync({
    onPageLoad: true,
    onUserChange: true,
    debug: true
  });

  useEffect(() => {
    if (!isLoaded || !user) return;

    const checkUserStatus = async () => {
      try {
        // Initialize user in billing system
        await fetch('/api/billing/init-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.emailAddresses[0]?.emailAddress,
            userData: user
          })
        });

        // Check if user has a subscription
        const subResponse = await fetch('/api/billing/subscription-info');
        if (subResponse.ok) {
          const subInfo = await subResponse.json();
          
          // If user has a plan, go to dashboard
          if (subInfo.plan_name) {
            router.push('/dashboard');
          } else {
            // New user without a plan, go to pricing
            router.push('/pricing');
          }
        } else {
          // If API fails, default to pricing for new users
          router.push('/pricing');
        }
      } catch (error) {
        console.error('Error during onboarding:', error);
        // Fallback to pricing
        router.push('/pricing');
      }
    };

    checkUserStatus();
  }, [isLoaded, user, router]);

  // Show loading spinner while checking
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Setting up your account...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Please wait while we prepare your interview coaching experience.
        </p>
      </div>
    </div>
  );
}
