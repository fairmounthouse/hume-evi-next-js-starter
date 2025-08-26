/**
 * Dynamic Plan Configuration
 * Add/remove plans here and the entire app will adapt automatically
 */

export interface PlanConfig {
  key: string;
  name: string;
  price: number; // in dollars
  isFree: boolean;
  features: string[]; // For display purposes only
  description?: string;
  popular?: boolean;
  // Usage limits (the actual enforcement mechanism)
  limits: {
    minutesPerMonth: number; // -1 = unlimited
    interviewsPerDay: number; // -1 = unlimited
    detailedAnalysesPerMonth: number; // -1 = unlimited
    videoReviewsPerMonth: number; // -1 = unlimited
  };
}

// 🎯 SINGLE SOURCE OF TRUTH for all plans
// Usage-based limits are the actual enforcement mechanism
export const PLAN_CONFIGS: PlanConfig[] = [
  {
    key: 'free',
    name: 'Free',
    price: 0,
    isFree: true,
    features: ['basic_interviews'], // Display only
    description: 'Get started with basic interview practice',
    limits: {
      minutesPerMonth: 2, // Very limited for testing
      interviewsPerDay: 1,
      detailedAnalysesPerMonth: 0,
      videoReviewsPerMonth: 0,
    }
  },
  {
    key: 'starter', 
    name: 'Starter',
    price: 30,
    isFree: false,
    features: ['detailed_analysis', 'video_review'], // Display only
    description: 'Perfect for regular practice',
    limits: {
      minutesPerMonth: 120, // 2 hours
      interviewsPerDay: 3,
      detailedAnalysesPerMonth: 5,
      videoReviewsPerMonth: 3,
    }
  },
  {
    key: 'professional',
    name: 'Professional', 
    price: 50,
    isFree: false,
    features: ['detailed_analysis', 'video_review', 'unlimited_sessions'], // Display only
    description: 'For serious interview preparation',
    popular: true,
    limits: {
      minutesPerMonth: 300, // 5 hours
      interviewsPerDay: 5,
      detailedAnalysesPerMonth: 15,
      videoReviewsPerMonth: 10,
    }
  },
  {
    key: 'premium',
    name: 'Premium',
    price: 99,
    isFree: false, 
    features: ['detailed_analysis', 'video_review', 'unlimited_sessions', 'advanced_analytics'], // Display only
    description: 'Complete interview mastery suite',
    limits: {
      minutesPerMonth: -1, // Unlimited
      interviewsPerDay: -1, // Unlimited
      detailedAnalysesPerMonth: -1, // Unlimited
      videoReviewsPerMonth: -1, // Unlimited
    }
  }
];

/**
 * Get user's current plan by checking Clerk has() method
 * Following Clerk's B2C SaaS documentation patterns
 */
export function getUserPlan(has: ((params: { plan: string }) => boolean) | undefined): PlanConfig {
  if (!has) {
    return PLAN_CONFIGS.find(p => p.isFree) || PLAN_CONFIGS[0];
  }

  // 🎯 Check each plan explicitly as recommended by Clerk docs
  // Example from docs: has({ plan: 'bronze' })
  
  // Check premium first (highest tier)
  if (has({ plan: 'premium' })) {
    return PLAN_CONFIGS.find(p => p.key === 'premium')!;
  }
  
  // Check professional 
  if (has({ plan: 'professional' })) {
    return PLAN_CONFIGS.find(p => p.key === 'professional')!;
  }
  
  // Check starter
  if (has({ plan: 'starter' })) {
    return PLAN_CONFIGS.find(p => p.key === 'starter')!;
  }
  
  // Default to free plan if no paid plan found
  return PLAN_CONFIGS.find(p => p.isFree) || PLAN_CONFIGS[0];
}

/**
 * Get detailed plan information with explicit Clerk checks
 * Returns both the plan and the raw boolean results from Clerk
 */
export function getUserPlanDetails(has: ((params: { plan: string }) => boolean) | undefined) {
  const planChecks = {
    hasPremium: has?.({ plan: 'premium' }) || false,
    hasProfessional: has?.({ plan: 'professional' }) || false,
    hasStarter: has?.({ plan: 'starter' }) || false,
  };
  
  const currentPlan = getUserPlan(has);
  
  return {
    plan: currentPlan,
    checks: planChecks,
    // Helper methods
    isPremium: planChecks.hasPremium,
    isProfessional: planChecks.hasProfessional,
    isStarter: planChecks.hasStarter,
    isFree: !planChecks.hasPremium && !planChecks.hasProfessional && !planChecks.hasStarter
  };
}

/**
 * Get plan config by key
 */
export function getPlanByKey(key: string): PlanConfig | undefined {
  return PLAN_CONFIGS.find(p => p.key === key);
}

/**
 * Check if user can use a feature based on their plan's usage limits
 * Since we use usage-based enforcement, we infer capabilities from plan limits
 */
export function canUseFeature(userPlan: PlanConfig, feature: string): boolean {
  switch (feature) {
    case 'detailed_analysis':
      return userPlan.limits.detailedAnalysesPerMonth !== 0;
    case 'video_review':
      return userPlan.limits.videoReviewsPerMonth !== 0;
    case 'unlimited_sessions':
      return userPlan.limits.interviewsPerDay === -1;
    case 'advanced_analytics':
      return userPlan.key === 'premium'; // Only premium has analytics
    default:
      return false;
  }
}

/**
 * Get user's usage limits based on their Clerk plan
 * This is the actual enforcement mechanism
 */
export function getUserLimits(userPlan: PlanConfig) {
  return {
    // Usage limits (actual enforcement)
    minutesPerMonth: userPlan.limits.minutesPerMonth,
    interviewsPerDay: userPlan.limits.interviewsPerDay,
    detailedAnalysesPerMonth: userPlan.limits.detailedAnalysesPerMonth,
    videoReviewsPerMonth: userPlan.limits.videoReviewsPerMonth,
    
    // Feature availability (inferred from limits)
    canUseDetailedAnalysis: canUseFeature(userPlan, 'detailed_analysis'),
    canUseVideoReview: canUseFeature(userPlan, 'video_review'),
    hasUnlimitedSessions: canUseFeature(userPlan, 'unlimited_sessions'),
    hasAdvancedAnalytics: canUseFeature(userPlan, 'advanced_analytics'),
    
    // Unlimited checks
    hasUnlimitedMinutes: userPlan.limits.minutesPerMonth === -1,
    hasUnlimitedInterviews: userPlan.limits.interviewsPerDay === -1,
    hasUnlimitedAnalyses: userPlan.limits.detailedAnalysesPerMonth === -1,
    hasUnlimitedVideoReviews: userPlan.limits.videoReviewsPerMonth === -1,
  };
}

/**
 * Get all available plans for display
 */
export function getAllPlans(): PlanConfig[] {
  return [...PLAN_CONFIGS];
}

/**
 * Format price for display
 */
export function formatPrice(plan: PlanConfig): string {
  if (plan.isFree) {
    return '$0.00';
  }
  return `$${plan.price.toFixed(2)}`;
}
