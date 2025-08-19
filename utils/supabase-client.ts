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
  // Note: video_url and final_evaluation columns don't exist yet
  // They are stored inside detailed_analysis for now
}

export async function upsertInterviewSession(sessionData: Partial<InterviewSession>): Promise<boolean> {
  try {
    const jsonFields: Array<keyof Pick<InterviewSession, 'emotion_summary' | 'detailed_analysis' | 'speech_rate_data' | 'engagement_metrics'>> = [
      'emotion_summary',
      'detailed_analysis',
      'speech_rate_data',
      'engagement_metrics',
    ];

    // Convert objects to JSON strings for specific fields (excluding evi_transcript_data)
    for (const field of jsonFields) {
      const fieldKey = field as keyof InterviewSession;
      if (sessionData[fieldKey] !== undefined && typeof sessionData[fieldKey] === 'object') {
        (sessionData as any)[fieldKey] = JSON.stringify(sessionData[fieldKey]);
      }
    }

    // Remove evi_transcript_data if present - we'll store it in Supabase Storage instead
    const { evi_transcript_data, transcript_path, ...sessionDataWithoutTranscript } = sessionData;

    // Ensure required non-null columns always have a value
    if (sessionDataWithoutTranscript.transcript_data === undefined) {
      // We store the real transcript in Supabase Storage; this field just needs a non-null placeholder
      (sessionDataWithoutTranscript as any).transcript_data = '';
    }

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

// Store complete end screen data for caching
export async function storeEndScreenData(
  sessionId: string, 
  transcript: any[], 
  finalEvaluation: any, 
  videoUrl: string
): Promise<boolean> {
  try {
    console.log(`💾 Storing end screen data for session: ${sessionId}`);
    
    // Upload transcript to storage
    const transcriptPath = await uploadTranscriptToStorage(sessionId, transcript);
    
    // Store everything in the session record (only existing fields for now)
    const success = await upsertInterviewSession({
      session_id: sessionId,
      transcript_path: transcriptPath || undefined,
      detailed_analysis: finalEvaluation, // Store evaluation in existing field
      has_detailed_analysis: true,
      status: 'completed',
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Include started_at in case this is a new row (shouldn't happen, but prevents null constraint error)
      started_at: new Date().toISOString()
    });
    
    // TODO: Add video_url and final_evaluation columns to database
    // For now, we'll store video URL in detailed_analysis.video_url
    if (success && finalEvaluation) {
      const enhancedEvaluation = {
        ...finalEvaluation,
        video_url: videoUrl, // Store video URL inside the evaluation object
        cached_at: new Date().toISOString()
      };
      
      // Update with enhanced evaluation that includes video URL
      await upsertInterviewSession({
        session_id: sessionId,
        detailed_analysis: enhancedEvaluation
      });
    }
    
    if (success) {
      console.log(`✅ End screen data stored successfully for session: ${sessionId}`);
    } else {
      console.error(`❌ Failed to store end screen data for session: ${sessionId}`);
    }
    
    return success;
  } catch (error) {
    console.error('Error storing end screen data:', error);
    return false;
  }
}

// Retrieve complete end screen data from cache
export async function getEndScreenData(sessionId: string): Promise<{
  transcript: any[];
  finalEvaluation: any;
  videoUrl: string;
  sessionData: InterviewSession;
} | null> {
  try {
    console.log(`🔍 Fetching end screen data for session: ${sessionId}`);
    
    // Get session data
    const { data: sessionData, error: sessionError } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();
    
    if (sessionError || !sessionData) {
      console.error('Session not found:', sessionError);
      return null;
    }
    
    // Get transcript from storage
    let transcript: any[] = [];
    if (sessionData.transcript_path) {
      try {
        const transcriptUrl = await getTranscriptDownloadUrl(sessionId);
        if (transcriptUrl) {
          const response = await fetch(transcriptUrl);
          const transcriptData = await response.json();
          transcript = transcriptData.entries || [];
        }
      } catch (error) {
        console.error('Error fetching transcript from storage:', error);
        // Fallback to transcript_data if available
        if (sessionData.transcript_data) {
          // Parse if it's a JSON string, otherwise split by lines
          try {
            const parsed = JSON.parse(sessionData.transcript_data);
            transcript = parsed.entries || [];
          } catch {
            // Handle plain text format
            transcript = [];
          }
        }
      }
    }
    
    // Parse final evaluation and extract video URL
    let finalEvaluation = null;
    let videoUrl = '';
    
    if (sessionData.detailed_analysis) {
      try {
        const analysis = typeof sessionData.detailed_analysis === 'string' 
          ? JSON.parse(sessionData.detailed_analysis)
          : sessionData.detailed_analysis;
        
        // Check if this is actually an evaluation object (has factors and summary)
        if (analysis && analysis.factors && analysis.summary) {
          finalEvaluation = analysis;
          videoUrl = analysis.video_url || ''; // Extract video URL from evaluation
        }
      } catch (error) {
        console.error('Error parsing detailed analysis:', error);
      }
    }
    
    // Fallback to separate fields if they exist
    if (!finalEvaluation && sessionData.final_evaluation) {
      try {
        finalEvaluation = typeof sessionData.final_evaluation === 'string' 
          ? JSON.parse(sessionData.final_evaluation)
          : sessionData.final_evaluation;
      } catch (error) {
        console.error('Error parsing final evaluation:', error);
      }
    }
    
    if (!videoUrl && sessionData.video_url) {
      videoUrl = sessionData.video_url;
    }
    
    // Also check session_media table for video URL
    if (!videoUrl) {
      try {
        const { data: mediaData } = await supabase
          .from('session_media')
          .select('file_url')
          .eq('session_id', sessionId)
          .eq('media_type', 'video')
          .single();
          
        if (mediaData?.file_url) {
          videoUrl = mediaData.file_url;
          console.log('Found video URL in session_media table');
        }
      } catch (error) {
        console.log('No video found in session_media table');
      }
    }
    
    const result = {
      transcript,
      finalEvaluation,
      videoUrl,
      sessionData
    };
    
    console.log(`✅ Retrieved end screen data for session: ${sessionId}`, {
      transcriptEntries: transcript.length,
      hasEvaluation: !!finalEvaluation,
      hasVideoUrl: !!sessionData.video_url
    });
    
    return result;
  } catch (error) {
    console.error('Error getting end screen data:', error);
    return null;
  }
}

// List all completed sessions for debugging/testing
export async function listCompletedSessions(limit: number = 10): Promise<InterviewSession[]> {
  try {
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('*')
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      console.error('Error listing sessions:', error);
      return [];
    }
    
    return data || [];
  } catch (error) {
    console.error('Error listing completed sessions:', error);
    return [];
  }
}
