import { useAuth } from '@clerk/nextjs';
import { getUserPlanKey, getUserPlanDetails } from '@/utils/plan-config';

/**
 * Hook for getting user's current plan information from Clerk
 * 
 * IMPORTANT: This hook only provides plan identification from Clerk.
 * For actual usage limits and enforcement, use Supabase-based functions:
 * - getUserUsageSummaryFromSupabase()
 * - checkUsageLimit() 
 * - getPlanDetails()
 */
export function usePlan() {
  const { has } = useAuth();
  
  // Get plan key and details using Clerk's has() method
  const planKey = getUserPlanKey(has);
  const planDetails = getUserPlanDetails(has);
  
  return {
    // Plan identification
    planKey,
    
    // Plan status checks
    isPremium: planDetails.isPremium,
    isProfessional: planDetails.isProfessional,
    isStarter: planDetails.isStarter,
    isFree: planDetails.isFree,
    
    // Raw Clerk checks
    clerkChecks: planDetails.checks,
    
    // Raw Clerk function for direct access
    has,
    
    // Helper for checking plan access
    hasAccess: (requiredPlan: string) => {
      switch (requiredPlan) {
        case 'premium':
          return planDetails.isPremium;
        case 'professional':
          return planDetails.isProfessional || planDetails.isPremium;
        case 'starter':
          return planDetails.isStarter || planDetails.isProfessional || planDetails.isPremium;
        default:
          return true; // Free tier
      }
    }
  };
}
