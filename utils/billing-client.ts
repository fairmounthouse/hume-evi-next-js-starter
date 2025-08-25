import { supabase } from './supabase-client';

export interface UsageCheck {
  allowed: boolean;
  current_usage: number;
  limit_value: number;
  remaining: number;
  is_unlimited: boolean;
}

export interface SubscriptionInfo {
  user_id: string;
  clerk_id: string;
  email: string;
  plan_name: string;
  plan_key: string;
  plan_price_cents: number;
  subscription_status: string;
  current_period_start: string;
  current_period_end: string;
}

export interface UsageSummary {
  limit_type: string;
  limit_value: number;
  current_usage: number;
  remaining: number;
  percentage_used: number;
}

/**
 * Ensure user exists in the billing system with comprehensive data
 */
export async function ensureUserExists(clerkId: string, email: string, userData?: any): Promise<string> {
  // If comprehensive user data is provided, use it
  if (userData) {
    const { syncUserToSupabase, extractClientUserData } = await import('./user-sync');
    const extractedData = extractClientUserData(userData);
    
    if (extractedData.clerkId && extractedData.email) {
      return await syncUserToSupabase(extractedData as any);
    }
  }

  // Fallback to basic user creation - now uses the fixed function with defaults
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
 * Create default subscription for new user
 */
export async function createDefaultSubscription(clerkId: string): Promise<void> {
  const { error } = await supabase
    .rpc('create_default_subscription', {
      p_clerk_id: clerkId
    });

  if (error) {
    console.error('Error creating default subscription:', error);
    throw new Error(`Failed to create default subscription: ${error.message}`);
  }
}

/**
 * Check if user can use a feature (with usage amount)
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
 * Get user's subscription information
 */
export async function getUserSubscriptionInfo(clerkId: string): Promise<SubscriptionInfo | null> {
  const { data, error } = await supabase
    .rpc('get_user_subscription_info', {
      p_clerk_id: clerkId
    });

  if (error) {
    console.error('Error getting subscription info:', error);
    throw new Error(`Failed to get subscription info: ${error.message}`);
  }

  if (data?.error) {
    return null;
  }

  return data as SubscriptionInfo;
}

/**
 * Get user's usage summary
 */
export async function getUserUsageSummary(clerkId: string): Promise<UsageSummary[]> {
  const { data, error } = await supabase
    .rpc('get_user_usage_summary', {
      p_clerk_id: clerkId
    });

  if (error) {
    console.error('Error getting usage summary:', error);
    throw new Error(`Failed to get usage summary: ${error.message}`);
  }

  return data as UsageSummary[];
}

/**
 * Initialize user in billing system (call on first login)
 */
export async function initializeUserBilling(clerkId: string, email: string): Promise<void> {
  try {
    // Ensure user exists
    await ensureUserExists(clerkId, email);
    
    // Create default subscription if needed
    await createDefaultSubscription(clerkId);
    
    console.log(`✅ User billing initialized for ${clerkId}`);
  } catch (error) {
    console.error('Error initializing user billing:', error);
    throw error;
  }
}