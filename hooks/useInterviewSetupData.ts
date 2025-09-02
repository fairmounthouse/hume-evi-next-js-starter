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

// Shape returned by /api/profiles/interviewer (rows from interviewer_profiles_view)
interface InterviewerProfilesViewRow {
  id: string;
  alias: string;
  name: string;
  user_id?: string | null;
  active?: boolean;
  company_display_name?: string;
  company_name?: string;
  company_description?: string | null;
  seniority_display_name?: string;
  senority_description?: string | null; // Note: field name as provided by the view
  difficulty_display_name?: string;
  difficulty_level?: string;
  company_prompt_content?: string | null;
  seniority_prompt_content?: string | null;
  difficulty_prompt_content?: string | null;
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

  // Normalize combined profiles into the nested shape expected by the UI
  const rawCombined: InterviewerProfilesViewRow[] = (combinedProfilesData?.success ? (combinedProfilesData.profiles as unknown as InterviewerProfilesViewRow[]) : []) || [];

  const normalizedCombinedProfiles: CombinedInterviewerProfile[] = rawCombined.map((row) => {
    const companyMatch = (companyProfilesData?.success ? companyProfilesData.profiles : []).find((c) =>
      c.display_name === row.company_display_name || (c.name || '') === (row.company_name || '')
    );

    const seniorityMatch = (seniorityProfilesData?.success ? seniorityProfilesData.profiles : []).find((s) =>
      s.display_name === row.seniority_display_name || (s.level || '') === (row.seniority_display_name || '')
    );

    const difficultyMatch = (difficultyProfilesData?.success ? difficultyProfilesData.profiles : []).find((d) =>
      d.display_name === row.difficulty_display_name || (d.level || '') === (row.difficulty_level || '')
    );

    const company_profiles: Profile = {
      id: companyMatch?.id || '',
      display_name: row.company_display_name || companyMatch?.display_name || '',
      name: companyMatch?.name || row.company_name,
      level: companyMatch?.level || '',
      description: companyMatch?.description || row.company_description || undefined,
    };

    const seniority_profiles: Profile = {
      id: seniorityMatch?.id || '',
      display_name: row.seniority_display_name || seniorityMatch?.display_name || '',
      level: seniorityMatch?.level || '',
      description: seniorityMatch?.description || row.senority_description || undefined,
    };

    const difficulty_profiles: Profile = {
      id: difficultyMatch?.id || '',
      display_name: row.difficulty_display_name || difficultyMatch?.display_name || '',
      level: row.difficulty_level || difficultyMatch?.level || '',
      description: difficultyMatch?.description || undefined,
    };

    return {
      id: row.id,
      alias: row.alias,
      name: row.name,
      user_id: row.user_id,
      difficulty_profiles,
      seniority_profiles,
      company_profiles,
    };
  });

  return {
    // Data
    cases: (casesData as InterviewCase[]) || [],
    combinedProfiles: normalizedCombinedProfiles,
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
