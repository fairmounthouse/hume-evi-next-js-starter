import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Note: For now, we're just adding user_id to sessions for basic user association
// The RLS policies are set up but we'll use the regular supabase client
// TODO: Implement full Clerk authentication later if needed

// Fallback client for non-authenticated operations (admin functions)
export function createSupabaseClient() {
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
      
      // Return complete Supabase URL instead of just internal path
      const { data: urlData } = await supabase.storage
        .from('interviews')
        .getPublicUrl(textPath);
      
      const completeUrl = urlData.publicUrl;
      console.log('📋 Complete transcript URL:', completeUrl);
      return completeUrl;
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
  // REQUIRED FIELDS (NOT NULL in database)
  id?: string; // uuid, auto-generated primary key
  session_id: string; // varchar(255), unique identifier
  started_at: string; // timestamp with time zone, interview start time
  
  // USER ASSOCIATION (for Clerk integration)
  user_id?: string; // Clerk user ID for RLS policies
  
  // TIMING & STATUS
  ended_at?: string; // timestamp with time zone, must be >= started_at if provided
  duration_seconds?: number; // numeric, must be >= 0 if provided
  status?: 'in_progress' | 'completed' | 'error' | 'cancelled'; // default 'in_progress'
  
  // FOREIGN KEY REFERENCES
  case_id?: string; // uuid, FK to interview_cases.id
  interviewer_profile_id?: string; // uuid, FK to interviewer_profiles.id
  difficulty_profile_id?: string; // uuid, FK to difficulty_profiles.id
  
  // MEDIA STORAGE (consolidated from session_media table)
  video_url?: string; // Cloudflare Stream URL
  video_duration_seconds?: number; // Video length in seconds
  video_file_size_bytes?: number; // Video file size in bytes
  transcript_path?: string; // Complete Supabase Storage URL to transcript file (TXT format)
  live_transcript_data?: any[]; // Live session transcript format (same as Chat component)
  
  // AI ANALYSIS RESULTS
  detailed_analysis?: Record<string, any>; // Complete AI evaluation with factors, summary, confidence
  
  // FEEDBACK SURVEYS
  feedback_data?: Record<string, any>; // Post-interview feedback (NPS, realism, etc.)
  analysis_feedback_data?: Record<string, any>; // Analysis quality feedback
  
  // METADATA
  created_at?: string; // timestamp with time zone, default now()
  updated_at?: string; // timestamp with time zone, default now()
}

// Validate and fix session data to ensure database compliance
function validateAndFixSessionData(data: Partial<InterviewSession>): Partial<InterviewSession> {
  const fixed = { ...data };
  
  // 1. Ensure required fields are present
  if (!fixed.session_id) {
    throw new Error("session_id is required but missing");
  }
  
  // 2. Add user_id for Clerk integration (will be set by calling code)
  if (!fixed.user_id) {
    console.log("📝 [VALIDATION] user_id not provided - will be set by authenticated client");
  }
  
  // Note: transcript_data column has been removed - we use transcript_path now
  
  // 3. Validate and fix timestamps
  if (fixed.started_at && fixed.ended_at) {
    const startTime = new Date(fixed.started_at);
    const endTime = new Date(fixed.ended_at);
    
    if (endTime < startTime) {
      console.warn("⚠️ [VALIDATION] ended_at before started_at, applying 10-second fallback");
      const fallbackEndTime = new Date(startTime.getTime() + 10000); // 10 second consistent fallback
      fixed.ended_at = fallbackEndTime.toISOString();
      
      console.log("🕐 [VALIDATION] Timestamp corrected:", {
        originalStarted: startTime.toISOString(),
        originalEnded: endTime.toISOString(),
        correctedEnded: fallbackEndTime.toISOString(),
        fallbackBufferMs: 10000
      });
    }
  }
  
  // 4. Validate duration_seconds
  if (fixed.duration_seconds !== null && fixed.duration_seconds !== undefined && fixed.duration_seconds < 0) {
    console.warn("⚠️ [VALIDATION] Negative duration detected, setting to 0");
    fixed.duration_seconds = 0;
  }
  
  // 5. Validate enum values
  const validStatuses = ['in_progress', 'completed', 'error', 'cancelled'];
  if (fixed.status && !validStatuses.includes(fixed.status)) {
    console.warn(`⚠️ [VALIDATION] Invalid status '${fixed.status}', setting to 'completed'`);
    fixed.status = 'completed' as any;
  }
  
  // Note: EVI columns have been removed from the schema
  
  return fixed;
}

export async function upsertInterviewSession(sessionData: Partial<InterviewSession>): Promise<boolean> {
  try {
    // Validate and fix data before database operation
    const validatedData = validateAndFixSessionData(sessionData);
    const jsonFields: Array<keyof Pick<InterviewSession, 'detailed_analysis' | 'feedback_data' | 'analysis_feedback_data' | 'live_transcript_data'>> = [
      'detailed_analysis',
      'feedback_data', 
      'analysis_feedback_data',
      'live_transcript_data',
    ];

    // Convert objects to JSON strings for specific fields, but NOT for live_transcript_data (keep as array)
    for (const field of jsonFields) {
      const fieldKey = field as keyof InterviewSession;
      if (validatedData[fieldKey] !== undefined && typeof validatedData[fieldKey] === 'object') {
        // Don't double-encode live_transcript_data - keep as array for Supabase
        if (fieldKey !== 'live_transcript_data') {
          (validatedData as any)[fieldKey] = JSON.stringify(validatedData[fieldKey]);
        }
      }
    }

    // Use all validated data (cleaned up schema - no need to remove fields)
    const sessionDataForUpsert = validatedData;

    // Handle started_at for existing sessions (REQUIRED - NOT NULL)
    if (!sessionDataForUpsert.started_at) {
      // Check if session already exists to preserve existing started_at
      const { data: existingSession } = await supabase
        .from('interview_sessions')
        .select('started_at, ended_at')
        .eq('session_id', sessionDataForUpsert.session_id)
        .single();
      
      if (existingSession?.started_at) {
        // Session exists, use existing started_at value to avoid overwriting
        (sessionDataForUpsert as any).started_at = existingSession.started_at;
        console.log("📝 Session exists, preserving existing started_at:", existingSession.started_at);
      } else {
        // New session, set started_at to current time
        (sessionDataForUpsert as any).started_at = new Date().toISOString();
        console.log("📝 New session, setting started_at to current time");
      }
    }

    const finalData = sessionDataForUpsert;
    
    // Note: Timestamp validation is now done in validateAndFixSessionData function

    console.log("📝 About to upsert session data:", {
      session_id: finalData.session_id,
      has_started_at: !!finalData.started_at,
      has_ended_at: !!finalData.ended_at,
      started_at: finalData.started_at,
      ended_at: finalData.ended_at,
      status: finalData.status,
      transcript_path: finalData.transcript_path
    });

    const { error } = await supabase
      .from('interview_sessions')
      .upsert(finalData, {
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
    
    // Use direct update instead of upsert to avoid overwriting required fields
    const { error } = await supabase
      .from('interview_sessions')
      .update({
        transcript_path: transcriptPath || undefined,
        detailed_analysis: finalEvaluation, // Store evaluation in existing field
        // Note: has_detailed_analysis column removed - check detailed_analysis IS NOT NULL instead
        status: 'completed' as const,
        updated_at: new Date().toISOString(),
      })
      .eq('session_id', sessionId);

    const success = !error;
    
    if (error) {
      console.error('Error updating session with end screen data:', error);
    }
    
    // TODO: Add video_url and final_evaluation columns to database
    // For now, we'll store video URL in detailed_analysis.video_url
    if (success && finalEvaluation) {
      const enhancedEvaluation = {
        ...finalEvaluation,
        video_url: videoUrl, // Store video URL inside the evaluation object
        cached_at: new Date().toISOString()
      };
      
      // Update with enhanced evaluation that includes video URL
      const { error: updateError } = await supabase
        .from('interview_sessions')
        .update({
          detailed_analysis: enhancedEvaluation,
          updated_at: new Date().toISOString()
        })
        .eq('session_id', sessionId);
      
      if (updateError) {
        console.error('Error updating session with enhanced evaluation:', updateError);
      }
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
        // Note: transcript_data column has been removed - we only use transcript_path now
        console.log("⚠️ Failed to load transcript from storage, no fallback available");
        transcript = [];
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
    
    // Video URL is now directly in interview_sessions table (streamlined structure)
    if (sessionData.video_url) {
      videoUrl = sessionData.video_url;
      console.log('✅ Found video URL in interview_sessions table:', videoUrl);
    } else {
      console.log('⚠️ No video URL found for this session');
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

// Get document analysis from cache for a session
export async function getDocumentAnalysis(sessionId: string): Promise<any | null> {
  try {
    const { sessionCache } = await import("./session-cache");
    const cacheKey = `document_analysis_${sessionId}`;
    const analysis = sessionCache.get(cacheKey);
    
    console.log("📋 Retrieved document analysis from cache:", {
      sessionId,
      hasAnalysis: !!analysis,
      cacheKey
    });
    
    return analysis || null;
  } catch (error) {
    console.error('Error getting document analysis:', error);
    return null;
  }
}

// Submit feedback for a session
export interface FeedbackData {
  sessionId: string;
  npsScore: number | null;
  realisticScore: number | null;
  challenges: string;
  motivation: string;
  features: string[];
  otherFeature: string;
  followUpInterest: string | null;
  submittedAt: string;
  // Tracking fields for analytics
  completed: boolean; // true if fully submitted, false if closed early
  lastQuestionIndex: number; // which question they were on when closed/submitted
  totalQuestions: number; // total questions in survey
  closeReason: 'completed' | 'closed_by_user' | 'skipped'; // how the survey ended
}

export async function submitSessionFeedback(feedbackData: FeedbackData): Promise<boolean> {
  try {
    console.log(`📝 Submitting feedback for session: ${feedbackData.sessionId}`);
    
    // Use direct update instead of upsert to avoid timestamp conflicts
    const { error } = await supabase
      .from('interview_sessions')
      .update({
        feedback_data: feedbackData,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', feedbackData.sessionId);

    const success = !error;
    
    if (success) {
      console.log(`✅ Feedback submitted successfully for session: ${feedbackData.sessionId}`);
    } else {
      console.error(`❌ Failed to submit feedback for session: ${feedbackData.sessionId}`);
    }
    
    return success;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return false;
  }
}

// Submit analysis feedback for a session
export interface AnalysisFeedbackData {
  sessionId: string;
  accuracyRating: number | null;
  helpfulnessAnswer: string | null;
  submittedAt: string;
  // Tracking fields for analytics
  completed: boolean;
  lastQuestionIndex: number;
  totalQuestions: number;
  closeReason: 'completed' | 'closed_by_user' | 'skipped';
}

export async function submitAnalysisFeedback(feedbackData: AnalysisFeedbackData): Promise<boolean> {
  try {
    console.log(`📊 Submitting analysis feedback for session: ${feedbackData.sessionId}`);
    
    // Use direct update instead of upsert to avoid timestamp conflicts
    const { error } = await supabase
      .from('interview_sessions')
      .update({
        analysis_feedback_data: feedbackData,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', feedbackData.sessionId);

    const success = !error;

    if (success) {
      console.log(`✅ Analysis feedback submitted successfully for session: ${feedbackData.sessionId}`);
    } else {
      console.error(`❌ Failed to submit analysis feedback for session: ${feedbackData.sessionId}`, error);
    }
    
    return success;
  } catch (error) {
    console.error('Error submitting analysis feedback:', error);
    return false;
  }
}

// Get complete session data for session viewer (reuse existing logic)
export async function getSessionData(sessionId: string) {
  try {
    console.log(`📋 Fetching complete session data for: ${sessionId}`);
    
    // Get session data with all related info
    const { data: sessionData, error } = await supabase
      .from('interview_sessions')
      .select(`
        *,
        interview_cases(title, type, industry, difficulty),
        interviewer_profiles(name, company, role),
        difficulty_profiles(display_name, level)
      `)
      .eq('session_id', sessionId)
      .single();
    
    if (error) {
      console.error('Error fetching session:', error);
      return null;
    }
    
    if (!sessionData) {
      console.log('Session not found');
      return null;
    }
    
    // Get transcript - prefer live format, fallback to storage
    let transcript: any[] = [];
    
    // First try live_transcript_data (handle double-encoded JSON)
    if (sessionData.live_transcript_data) {
      try {
        let transcriptData = sessionData.live_transcript_data;
        
        // Handle double-encoded JSON string
        if (typeof transcriptData === 'string') {
          transcriptData = JSON.parse(transcriptData);
        }
        
        // Handle if it's still a string (double-encoded)
        if (typeof transcriptData === 'string') {
          transcriptData = JSON.parse(transcriptData);
        }
        
        if (Array.isArray(transcriptData)) {
          transcript = transcriptData;
          console.log('✅ Using live transcript data format:', transcript.length, 'entries');
        }
      } catch (error) {
        console.error('Error parsing live_transcript_data:', error);
      }
    }
    
    // Fallback to storage format if live data failed
    if (transcript.length === 0 && sessionData.transcript_path) {
      // Fallback to storage format
      try {
        const response = await fetch(sessionData.transcript_path);
        if (response.ok) {
          const transcriptData = await response.json();
          transcript = transcriptData.entries || [];
        }
      } catch (error) {
        console.error('Error fetching transcript from storage:', error);
        transcript = [];
      }
    }
    
    // Extract final evaluation
    let finalEvaluation = null;
    if (sessionData.detailed_analysis) {
      try {
        finalEvaluation = typeof sessionData.detailed_analysis === 'string' 
          ? JSON.parse(sessionData.detailed_analysis)
          : sessionData.detailed_analysis;
      } catch (error) {
        console.error('Error parsing final evaluation:', error);
      }
    }
    
    // Get video URL
    const videoUrl = sessionData.video_url || null;
    
    // Enhance session data with joined info
    const enhancedSessionData = {
      ...sessionData,
      case_title: sessionData.interview_cases?.title || 'Unknown Case',
      case_type: sessionData.interview_cases?.type || 'Unknown',
      case_industry: sessionData.interview_cases?.industry || 'Unknown',
      case_difficulty: sessionData.interview_cases?.difficulty || 'Unknown',
      
      interviewer_name: sessionData.interviewer_profiles?.name || 'Unknown Interviewer',
      interviewer_company: sessionData.interviewer_profiles?.company || 'Unknown Company',
      interviewer_role: sessionData.interviewer_profiles?.role || 'Unknown Role',
      
      difficulty_level: sessionData.difficulty_profiles?.display_name || 'Unknown',
      
      // Extract overall score from detailed analysis
      overall_score: finalEvaluation?.summary?.total_score || null,
    };
    
    const result = {
      transcript,
      finalEvaluation,
      videoUrl,
      sessionData: enhancedSessionData,
    };
    
    console.log(`✅ Session data loaded successfully for: ${sessionId}`);
    return result;
    
  } catch (error) {
    console.error('Error in getSessionData:', error);
    return null;
  }
}
