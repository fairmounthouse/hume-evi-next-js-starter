'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface UsageSummary {
  usage_type: string;
  current_usage: number;
  limit_value: number;
  percentage_used: number;
  period_start: string;
  period_end: string;
}

interface SubscriptionInfo {
  plan_name: string;
  plan_key: string;
  plan_price_cents: number;
  subscription_status: string;
  current_period_end: string;
}

interface QuickStats {
  total_sessions: number;
  monthly_sessions: number;
  average_score: number | null;
  improvement_percentage: number | null;
}

interface Session {
  session_id: string;
  created_at: string;
  started_at: string;
  status: string;
  case_title?: string;
  interviewer_alias?: string;
  overall_score?: number;
}

interface AvailableMinutes {
  monthly_used: number;
  monthly_limit: number;
  monthly_remaining: number;
  topup_balance: number;
  total_available: number;
  topup_total_purchased: number;
  topup_used: number;
}

export function useDashboardData() {
  // Fetch all dashboard data with SWR
  const { data: usageData, error: usageError } = useSWR<UsageSummary[]>(
    '/api/billing/usage-summary',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 300000, // 5 minutes
      dedupingInterval: 60000, // 1 minute deduping
    }
  );

  const { data: subscriptionInfo, error: subscriptionError } = useSWR<SubscriptionInfo>(
    '/api/billing/subscription-info',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 300000, // 5 minutes
      dedupingInterval: 60000,
    }
  );

  const { data: sessionsData, error: sessionsError } = useSWR<{success: boolean, sessions: Session[]}>(
    '/api/sessions/list?limit=3',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 180000, // 3 minutes
      dedupingInterval: 30000,
    }
  );

  const { data: quickStatsData, error: quickStatsError } = useSWR<{success: boolean, stats: QuickStats}>(
    '/api/dashboard/quick-stats',
    fetcher,
    {
      revalidateOnFocus: true,  // Force refresh when page gets focus
      revalidateOnReconnect: true,
      refreshInterval: 10000, // 10 seconds for testing
      dedupingInterval: 1000,  // Reduced deduping for testing
    }
  );

  const { data: availableMinutesData, error: availableMinutesError } = useSWR<{success: boolean, data: AvailableMinutes}>(
    '/api/dashboard/available-minutes',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 300000, // 5 minutes
      dedupingInterval: 60000,
    }
  );

  // Derive loading state
  const isLoading = !usageData && !usageError && !subscriptionInfo && !subscriptionError && 
                   !sessionsData && !sessionsError && !quickStatsData && !quickStatsError &&
                   !availableMinutesData && !availableMinutesError;

  // Derive error state
  const hasError = usageError || subscriptionError || sessionsError || quickStatsError || availableMinutesError;



  return {
    // Data
    usageData: usageData || [],
    subscriptionInfo: subscriptionInfo || null,
    recentSessions: sessionsData?.sessions?.slice(0, 3) || [],
    quickStats: quickStatsData?.success ? quickStatsData.stats : null,
    availableMinutes: availableMinutesData?.success ? availableMinutesData.data : null,
    
    // States
    isLoading,
    hasError,
    
    // Individual errors for debugging
    errors: {
      usage: usageError,
      subscription: subscriptionError,
      sessions: sessionsError,
      quickStats: quickStatsError,
      availableMinutes: availableMinutesError,
    }
  };
}
