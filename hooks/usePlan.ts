import { useAuth } from '@clerk/nextjs';
import { getUserPlanDetails, getUserLimits, canUseFeature, type PlanConfig } from '@/utils/plan-config';

/**
 * Hook for usage-based plan management
 * Uses Clerk's has() to infer plan, then maps to usage limits
 * Following Clerk B2C SaaS documentation patterns
 */
export function usePlan() {
  const { has } = useAuth();
  
  // 🎯 Get plan from Clerk's has() method
  const planDetails = getUserPlanDetails(has);
  const userLimits = getUserLimits(planDetails.plan);
  
  // Helper function to check feature availability (based on usage limits)
  const checkFeature = (feature: string): boolean => {
    return canUseFeature(planDetails.plan, feature);
  };
  
  return {
    // Current plan info (from Clerk)
    plan: planDetails.plan,
    planName: planDetails.plan.name,
    planKey: planDetails.plan.key,
    planPrice: planDetails.plan.price,
    isFree: planDetails.plan.isFree,
    
    // Raw Clerk plan checks (following docs: has({ plan: 'premium' }))
    rawChecks: planDetails.checks,
    
    // 🎯 Usage limits (the actual enforcement mechanism)
    limits: {
      minutesPerMonth: userLimits.minutesPerMonth,
      interviewsPerDay: userLimits.interviewsPerDay,
      detailedAnalysesPerMonth: userLimits.detailedAnalysesPerMonth,
      videoReviewsPerMonth: userLimits.videoReviewsPerMonth,
    },
    
    // Feature availability (inferred from usage limits)
    features: {
      canUseDetailedAnalysis: userLimits.canUseDetailedAnalysis,
      canUseVideoReview: userLimits.canUseVideoReview,
      hasUnlimitedSessions: userLimits.hasUnlimitedSessions,
      hasAdvancedAnalytics: userLimits.hasAdvancedAnalytics,
    },
    
    // Unlimited checks
    unlimited: {
      minutes: userLimits.hasUnlimitedMinutes,
      interviews: userLimits.hasUnlimitedInterviews,
      analyses: userLimits.hasUnlimitedAnalyses,
      videoReviews: userLimits.hasUnlimitedVideoReviews,
    },
    
    // Convenience methods (based on Clerk checks)
    isPremium: planDetails.isPremium,
    isProfessional: planDetails.isProfessional,
    isStarter: planDetails.isStarter,
    
    // Helper functions
    canUseFeature: checkFeature,
    has, // Raw Clerk function
    
    // Debug info
    debug: {
      clerkPlanChecks: {
        premium: has?.({ plan: 'premium' }) || false,
        professional: has?.({ plan: 'professional' }) || false,
        starter: has?.({ plan: 'starter' }) || false,
      },
      inferredLimits: userLimits
    }
  };
}
