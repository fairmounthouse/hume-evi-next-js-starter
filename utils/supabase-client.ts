import { createClient } from "@supabase/supabase-js";

export function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
    },
  });
}

export const supabase = createSupabaseClient();

export async function upsertInterviewSession(sessionData: any): Promise<boolean> {
  try {
    const jsonFields = [
      'emotion_summary', 
      'detailed_analysis', 
      'speech_rate_data',
      'engagement_metrics', 
      'evi_transcript_data'
    ];

    // Convert objects to JSON strings for specific fields
    for (const field of jsonFields) {
      if (sessionData[field] !== undefined && typeof sessionData[field] === 'object') {
        sessionData[field] = JSON.stringify(sessionData[field]);
      }
    }

    const { error } = await supabase
      .from('interview_sessions')
      .upsert(sessionData, {
        onConflict: 'session_id',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error upserting session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error upserting session:', error);
    return false;
  }
}
