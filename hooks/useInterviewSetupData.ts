'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface InterviewCase {
  id: string;
  title: string;
  format: string;
  type: string;
  difficulty: string;
  industry: string;
  stretch_area: string;
  total_time: string;
  overview: string;
  requires_documents: boolean;
  phases: Array<{
    name: string;
    details: string;
    duration: number;
  }>;
}

interface Profile {
  id: string;
  display_name: string;
  name?: string;
  level: string;
  description?: string;
}

interface CombinedInterviewerProfile {
  id: string;
  alias: string;
  name: string;
  user_id?: string | null;
  difficulty_profiles: Profile;
  seniority_profiles: Profile;
  company_profiles: Profile;
}

export function useInterviewSetupData() {
  // Fetch cases from Supabase directly (this could be moved to API route for consistency)
  const { data: casesData, error: casesError } = useSWR(
    'interview-cases',
    async () => {
      const { supabase } = await import("@/utils/supabase-client");
      const { data, error } = await supabase.from("interview_cases").select("*").eq("active", true);
      if (error) throw error;
      return data || [];
    },
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 600000, // 10 minutes - cases don't change often
      dedupingInterval: 300000, // 5 minutes deduping
    }
  );

  // Fetch all profile data in parallel
  const { data: combinedProfilesData, error: combinedProfilesError } = useSWR<{success: boolean, profiles: CombinedInterviewerProfile[]}>(
    '/api/profiles/interviewer',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 600000, // 10 minutes
      dedupingInterval: 300000,
    }
  );

  const { data: companyProfilesData, error: companyProfilesError } = useSWR<{success: boolean, profiles: Profile[]}>(
    '/api/profiles/company',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 3600000, // 1 hour - companies change rarely
      dedupingInterval: 1800000, // 30 minutes deduping
    }
  );

  const { data: seniorityProfilesData, error: seniorityProfilesError } = useSWR<{success: boolean, profiles: Profile[]}>(
    '/api/profiles/seniority',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 3600000, // 1 hour
      dedupingInterval: 1800000,
    }
  );

  const { data: difficultyProfilesData, error: difficultyProfilesError } = useSWR<{success: boolean, profiles: Profile[]}>(
    '/api/profiles/difficulty',
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 3600000, // 1 hour
      dedupingInterval: 1800000,
    }
  );

  // Derive loading state
  const isLoading = !casesData && !casesError && 
                   !combinedProfilesData && !combinedProfilesError &&
                   !companyProfilesData && !companyProfilesError &&
                   !seniorityProfilesData && !seniorityProfilesError &&
                   !difficultyProfilesData && !difficultyProfilesError;

  // Derive error state
  const hasError = casesError || combinedProfilesError || companyProfilesError || 
                   seniorityProfilesError || difficultyProfilesError;

  return {
    // Data
    cases: (casesData as InterviewCase[]) || [],
    combinedProfiles: combinedProfilesData?.success ? combinedProfilesData.profiles : [],
    companyProfiles: companyProfilesData?.success ? companyProfilesData.profiles : [],
    seniorityProfiles: seniorityProfilesData?.success ? seniorityProfilesData.profiles : [],
    difficultyProfiles: difficultyProfilesData?.success ? difficultyProfilesData.profiles : [],
    
    // States
    isLoading,
    hasError,
    
    // Individual errors for debugging
    errors: {
      cases: casesError,
      combinedProfiles: combinedProfilesError,
      companyProfiles: companyProfilesError,
      seniorityProfiles: seniorityProfilesError,
      difficultyProfiles: difficultyProfilesError,
    }
  };
}
