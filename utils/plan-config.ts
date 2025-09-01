/**
 * Clerk Plan Integration Utilities
 * 
 * IMPORTANT: Plan limits are now stored in Supabase database tables:
 * - plans: Contains plan info (name, price, plan_key)
 * - plan_limits: Contains actual usage limits per plan
 * 
 * This file only provides Clerk integration helpers and plan key mapping.
 * Do NOT use this for actual limit enforcement - use Supabase functions instead.
 */

/**
 * Plan keys that match Clerk subscription plan names
 * These must match exactly what you configure in Clerk dashboard
 */
export const PLAN_KEYS = {
  FREE: 'free_user',
  STARTER: 'starter', 
  PROFESSIONAL: 'professional',
  PREMIUM: 'premium'
} as const;

export type PlanKey = typeof PLAN_KEYS[keyof typeof PLAN_KEYS];

/**
 * Get user's current plan key by checking Clerk has() method
 * Returns the plan key that matches your Supabase database
 */
export function getUserPlanKey(has: ((params: { plan: string }) => boolean) | undefined): PlanKey {
  if (!has) {
    return PLAN_KEYS.FREE;
  }

  // Check premium first (highest tier)
  if (has({ plan: PLAN_KEYS.PREMIUM })) {
    return PLAN_KEYS.PREMIUM;
  }
  
  // Check professional 
  if (has({ plan: PLAN_KEYS.PROFESSIONAL })) {
    return PLAN_KEYS.PROFESSIONAL;
  }
  
  // Check starter
  if (has({ plan: PLAN_KEYS.STARTER })) {
    return PLAN_KEYS.STARTER;
  }
  
  // Default to free plan
  return PLAN_KEYS.FREE;
}

/**
 * Get detailed plan information with explicit Clerk checks
 */
export function getUserPlanDetails(has: ((params: { plan: string }) => boolean) | undefined) {
  const planChecks = {
    hasPremium: has?.({ plan: PLAN_KEYS.PREMIUM }) || false,
    hasProfessional: has?.({ plan: PLAN_KEYS.PROFESSIONAL }) || false,
    hasStarter: has?.({ plan: PLAN_KEYS.STARTER }) || false,
  };
  
  const currentPlanKey = getUserPlanKey(has);
  
  return {
    planKey: currentPlanKey,
    checks: planChecks,
    // Helper methods
    isPremium: planChecks.hasPremium,
    isProfessional: planChecks.hasProfessional,
    isStarter: planChecks.hasStarter,
    isFree: currentPlanKey === PLAN_KEYS.FREE
  };
}
