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

export async function uploadTranscriptToStorage(sessionId: string, transcript: any[]): Promise<string | null> {
  try {
    // Create transcript text content
    const transcriptText = transcript.map(entry => {
      const timeStr = new Date(entry.timestamp * 1000).toLocaleTimeString();
      const speaker = entry.speaker === "user" ? "Interviewee" : "AI Interviewer";
      return `[${timeStr}] ${speaker}: ${entry.text}`;
    }).join('\n');

    // Create transcript JSON with metadata
    const transcriptData = {
      session_id: sessionId,
      created_at: new Date().toISOString(),
      entries: transcript,
      metadata: {
        total_entries: transcript.length,
        duration_seconds: transcript.length > 0 
          ? Math.floor((Date.now() - (transcript[0]?.timestamp * 1000 || Date.now())) / 1000)
          : 0,
        speakers: {
          user_messages: transcript.filter(e => e.speaker === "user").length,
          assistant_messages: transcript.filter(e => e.speaker === "assistant").length,
        }
      }
    };

    // Upload both text and JSON versions
    const textBlob = new Blob([transcriptText], { type: 'text/plain' });
    const jsonBlob = new Blob([JSON.stringify(transcriptData, null, 2)], { type: 'application/json' });

    const textPath = `${sessionId}/transcript.txt`;
    const jsonPath = `${sessionId}/transcript-complete.json`;

    // Upload text version
    const { error: textError } = await supabase.storage
      .from('interviews')
      .upload(textPath, textBlob, {
        cacheControl: 'max-age=3600',
        upsert: true
      });

    if (textError) {
      console.error('Error uploading text transcript:', textError);
    }

    // Upload JSON version
    const { error: jsonError } = await supabase.storage
      .from('interviews')
      .upload(jsonPath, jsonBlob, {
        cacheControl: 'max-age=3600',
        upsert: true
      });

    if (jsonError) {
      console.error('Error uploading JSON transcript:', jsonError);
    }

    if (!textError && !jsonError) {
      console.log('✅ Transcript uploaded to Supabase Storage');
      return textPath;
    }

    return null;
  } catch (error) {
    console.error('Error uploading transcript to storage:', error);
    return null;
  }
}

export async function getTranscriptDownloadUrl(sessionId: string, format: 'txt' | 'json' = 'txt'): Promise<string | null> {
  try {
    const fileName = format === 'json' ? 'transcript-complete.json' : 'transcript.txt';
    const path = `${sessionId}/${fileName}`;
    const { data } = await supabase.storage
      .from('interviews')
      .createSignedUrl(path, 3600); // 1 hour expiry

    return data?.signedUrl || null;
  } catch (error) {
    console.error('Error getting transcript download URL:', error);
    return null;
  }
}

export interface InterviewSession {
  id?: string; // uuid, auto-generated
  session_id: string; // varchar(255), required
  started_at: string; // timestamp with time zone, required
  ended_at?: string; // timestamp with time zone
  duration_seconds?: number; // numeric
  coach_mode_enabled?: boolean; // boolean, default false
  transcript_data: string; // text, required
  emotion_summary?: Record<string, any>; // jsonb
  detailed_analysis?: Record<string, any>; // jsonb
  speech_rate_data?: Record<string, any>; // jsonb
  engagement_metrics?: Record<string, any>; // jsonb
  status?: string; // varchar(50), default 'in_progress'
  has_detailed_analysis?: boolean; // boolean, default false
  created_at?: string; // timestamp with time zone, default now()
  updated_at?: string; // timestamp with time zone, default now()
  case_id?: string; // uuid
  evi_chat_id?: string; // varchar(255)
  evi_chat_status?: string; // varchar(50), default 'pending'
  evi_transcript_data?: Record<string, any>; // jsonb
  evi_sync_offset_ms?: number; // numeric
  evi_sync_status?: string; // varchar(50), default 'not_synced'
  interviewer_profile_id?: string; // uuid
  difficulty_profile_id?: string; // uuid
  case_metadata?: Record<string, any>; // jsonb
  transcript_path?: string; // text
}

export async function upsertInterviewSession(sessionData: Partial<InterviewSession>): Promise<boolean> {
  try {
    const jsonFields = [
      'emotion_summary', 
      'detailed_analysis', 
      'speech_rate_data',
      'engagement_metrics'
    ];

    // Convert objects to JSON strings for specific fields (excluding evi_transcript_data)
    for (const field of jsonFields) {
      if (sessionData[field] !== undefined && typeof sessionData[field] === 'object') {
        sessionData[field] = JSON.stringify(sessionData[field]);
      }
    }

    // Remove evi_transcript_data if present - we'll store it in Supabase Storage instead
    const { evi_transcript_data, transcript_path, ...sessionDataWithoutTranscript } = sessionData;

    const { error } = await supabase
      .from('interview_sessions')
      .upsert({
        ...sessionDataWithoutTranscript,
        // Only include transcript_path if it's provided
        ...(transcript_path ? { transcript_path } : {})
      }, {
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
