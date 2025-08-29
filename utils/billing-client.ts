import { supabase } from './supabase-client';

export interface UsageCheck {
  allowed: boolean;
  current_usage: number;
  limit_value: number;
  remaining: number;
  is_unlimited: boolean;
}

// SubscriptionInfo interface removed - use Clerk directly for plan info

export interface UsageSummary {
  limit_type: string;
  limit_value: number;
  current_usage: number;
  remaining: number;
  percentage_used: number;
}

/**
 * Ensure user exists in Supabase (minimal linking only)
 */
export async function ensureUserExists(clerkId: string, email: string): Promise<string> {
  const { data, error } = await supabase
    .rpc('ensure_user_exists', {
      p_clerk_id: clerkId,
      p_email: email
    });

  if (error) {
    console.error('Error ensuring user exists:', error);
    throw new Error(`Failed to create/find user: ${error.message}`);
  }

  return data;
}

/**
 * Check if user can use a feature (usage tracking only - limits checked by Clerk)
 */
export async function checkUsageLimit(
  clerkId: string, 
  usageType: string, 
  amount: number = 1
): Promise<UsageCheck> {
  const { data, error } = await supabase
    .rpc('check_usage_limit', {
      p_clerk_id: clerkId,
      p_usage_type: usageType,
      p_amount: amount
    });

  if (error) {
    console.error('Error checking usage limit:', error);
    throw new Error(`Failed to check usage limit: ${error.message}`);
  }

  return data as UsageCheck;
}

/**
 * Track usage for a user
 */
export async function trackUsage(
  clerkId: string, 
  usageType: string, 
  amount: number
): Promise<void> {
  const { error } = await supabase
    .rpc('track_usage', {
      p_clerk_id: clerkId,
      p_usage_type: usageType,
      p_amount: amount
    });

  if (error) {
    console.error('Error tracking usage:', error);
    throw new Error(`Failed to track usage: ${error.message}`);
  }
}

/**
 * Track interview session usage (minutes + interview count)
 */
export async function trackInterviewSession(
  clerkId: string, 
  durationMinutes: number
): Promise<void> {
  const { error } = await supabase
    .rpc('track_interview_session', {
      p_clerk_id: clerkId,
      p_duration_minutes: durationMinutes
    });

  if (error) {
    console.error('Error tracking interview session:', error);
    throw new Error(`Failed to track interview session: ${error.message}`);
  }
}

/**
 * Get user's usage summary (usage tracking only)
 */
export async function getUserUsageSummary(clerkId: string, monthlyMinuteLimit: number = 300): Promise<UsageSummary[]> {
  const { data, error } = await supabase
    .rpc('get_user_usage_summary', {
      p_clerk_id: clerkId,
      p_monthly_minute_limit: monthlyMinuteLimit
    });

  if (error) {
    console.error('Error getting usage summary:', error);
    throw new Error(`Failed to get usage summary: ${error.message}`);
  }

  return data as UsageSummary[];
}

/**
 * Get user's usage summary with plan limits from Supabase
 * This uses the new Supabase-based plan configuration
 */
export async function getUserUsageSummaryFromSupabase(clerkId: string, planKey: string = 'free'): Promise<UsageSummary[]> {
  const { data, error } = await supabase
    .rpc('get_user_usage_summary_with_plan', {
      p_clerk_id: clerkId,
      p_plan_key: planKey
    });

  if (error) {
    console.error('Error getting usage summary from Supabase:', error);
    throw new Error(`Failed to get usage summary: ${error.message}`);
  }

  return data as UsageSummary[];
}

/**
 * Get plan details from Supabase
 */
export async function getPlanDetails(planKey: string) {
  const { data, error } = await supabase
    .rpc('get_plan_limits', {
      p_plan_key: planKey
    });

  if (error) {
    console.error('Error getting plan details:', error);
    throw new Error(`Failed to get plan details: ${error.message}`);
  }

  return data?.[0] || null;
}

/**
 * Get per-session usage breakdown
 */
export async function getSessionBreakdown(clerkId: string, limit: number = 20) {
  const { data, error } = await supabase
    .rpc('get_user_session_breakdown', {
      p_clerk_id: clerkId,
      p_limit: limit
    });

  if (error) {
    console.error('Error getting session breakdown:', error);
    throw new Error(`Failed to get session breakdown: ${error.message}`);
  }

  return data || [];
}

/**
 * Initialize user in system (minimal setup)
 */
export async function initializeUserBilling(clerkId: string, email: string): Promise<void> {
  try {
    // Just ensure user exists for usage tracking
    await ensureUserExists(clerkId, email);
    
    console.log(`✅ User initialized for usage tracking: ${clerkId}`);
  } catch (error) {
    console.error('Error initializing user:', error);
    throw error;
  }
}

// =====================================================
// REMOVED FUNCTIONS (now handled by Clerk):
// - getUserSubscriptionInfo() - use Clerk has() method
// - createDefaultSubscription() - Clerk handles subscriptions
// =====================================================