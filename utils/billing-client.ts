import { supabase } from './supabase-client';

export interface UsageCheck {
  allowed: boolean;
  current_usage: number;
  limit_value: number;
  remaining: number;
  is_unlimited: boolean;
  topup_balance?: number;  // NEW: top-up minutes balance
  total_available?: number; // NEW: total minutes available (monthly + top-up)
}

// SubscriptionInfo interface removed - use Clerk directly for plan info

export interface UsageSummary {
  usage_type: string;
  current_usage: number;
  limit_value: number;
  percentage_used: number;
  period_start: string;
  period_end: string;
}

/**
 * Ensure user exists in Supabase (minimal linking only)
 */
export async function ensureUserExists(clerkId: string, email: string): Promise<string> {
  console.log("🔍 Calling ensure_user_exists RPC:", { clerkId, email });
  
  const { data, error } = await supabase
    .rpc('ensure_user_exists', {
      p_clerk_id: clerkId,
      p_email: email
    });

  if (error) {
    console.error('❌ RPC ensure_user_exists failed - DETAILED ERROR:', {
      error,
      errorMessage: error.message,
      errorCode: error.code,
      errorDetails: error.details,
      errorHint: error.hint,
      clerkId,
      email
    });
    throw new Error(`Failed to create/find user: ${error.message}`);
  }

  console.log("✅ RPC ensure_user_exists succeeded:", {
    data,
    dataType: typeof data,
    clerkId
  });

  return data;
}

/**
 * Check if user can use a feature (usage tracking only - limits checked by Clerk)
 */
export async function checkUsageLimit(
  clerkId: string, 
  usageType: string, 
  amount: number = 1,
  planKey?: string
): Promise<UsageCheck> {
  const { data, error } = await supabase
    .rpc('check_usage_limit', {
      p_clerk_id: clerkId,
      p_usage_type: usageType,
      p_amount: amount,
      p_plan_key: planKey || 'free'
    });

  if (error) {
    console.error('Error checking usage limit:', error);
    throw new Error(`Failed to check usage limit: ${error.message}`);
  }

  // RPC returns an array for table functions, get the first element
  return (Array.isArray(data) ? data[0] : data) as UsageCheck;
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
  console.log('🔍 Calling get_user_usage_summary_with_plan RPC:', { clerkId, planKey });
  
  const { data, error } = await supabase
    .rpc('get_user_usage_summary_with_plan', {
      p_clerk_id: clerkId,
      p_plan_key: planKey
    });

  if (error) {
    console.error('❌ RPC get_user_usage_summary_with_plan failed - DETAILED ERROR:', {
      error,
      errorMessage: error.message,
      errorCode: error.code,
      errorDetails: error.details,
      errorHint: error.hint,
      clerkId,
      planKey
    });
    throw new Error(`Failed to get usage summary: ${error.message}`);
  }

  console.log("✅ RPC get_user_usage_summary_with_plan succeeded:", {
    data,
    dataType: typeof data,
    dataLength: Array.isArray(data) ? data.length : 'not array',
    clerkId,
    planKey
  });

  // Ensure we always return an array
  return Array.isArray(data) ? data : [];
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
// TOP-UP MINUTES FUNCTIONS
// =====================================================

/**
 * Get user's available minutes (monthly + top-up)
 */
export async function getUserAvailableMinutes(clerkId: string) {
  const { data, error } = await supabase
    .rpc('get_user_available_minutes', {
      p_clerk_id: clerkId
    });

  if (error) {
    console.error('Error getting available minutes:', error);
    throw new Error(`Failed to get available minutes: ${error.message}`);
  }

  // RPC returns an array for table functions
  return (Array.isArray(data) ? data[0] : data) as {
    monthly_used: number;
    monthly_limit: number;
    monthly_remaining: number;
    topup_balance: number;
    total_available: number;
    topup_total_purchased: number;
    topup_used: number;
  };
}

/**
 * Deduct minutes after session ends
 */
export async function deductSessionMinutes(sessionId: string) {
  const { data, error } = await supabase
    .rpc('deduct_session_minutes', {
      p_session_id: sessionId
    });

  if (error) {
    console.error('Error deducting session minutes:', error);
    throw new Error(`Failed to deduct minutes: ${error.message}`);
  }

  // RPC returns an array for table functions
  return (Array.isArray(data) ? data[0] : data) as {
    success: boolean;
    minutes_used: number;
    from_monthly: number;
    from_topup: number;
    topup_remaining: number;
  };
}

/**
 * Redeem a coupon code for top-up minutes
 */
export async function redeemCoupon(clerkId: string, code: string) {
  const { data, error } = await supabase
    .rpc('redeem_coupon', {
      p_clerk_id: clerkId,
      p_code: code.trim()
    });

  if (error) {
    console.error('Error redeeming coupon:', error);
    throw new Error(`Failed to redeem coupon: ${error.message}`);
  }

  // RPC returns an array for table functions
  return (Array.isArray(data) ? data[0] : data) as {
    success: boolean;
    minutes_added: number;
    message: string;
    new_balance: number;
  };
}

// =====================================================
// REMOVED FUNCTIONS (now handled by Clerk):
// - getUserSubscriptionInfo() - use Clerk has() method
// - createDefaultSubscription() - Clerk handles subscriptions
// =====================================================