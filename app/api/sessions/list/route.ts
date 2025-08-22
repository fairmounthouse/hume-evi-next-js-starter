import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Fetch sessions with related data for meaningful metadata
    const { data: sessions, error } = await supabase
      .from('interview_sessions')
      .select(`
        *,
        interview_cases(title, type, industry, difficulty),
        interviewer_profiles(name, company, role),
        difficulty_profiles(display_name, level)
      `)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({
      success: true,
      sessions: (sessions || []).map(session => ({
        session_id: session.session_id,
        created_at: session.created_at,
        started_at: session.started_at,
        duration_seconds: session.duration_seconds,
        has_detailed_analysis: !!(session.detailed_analysis),
        has_video: !!(session.video_url),
        status: session.status,
        transcript_path: session.transcript_path,
        user_id: session.user_id,
        
        // Rich metadata for meaningful session identification
        case_title: session.interview_cases?.title || 'Unknown Case',
        case_type: session.interview_cases?.type || 'Unknown',
        case_industry: session.interview_cases?.industry || 'Unknown',
        case_difficulty: session.interview_cases?.difficulty || 'Unknown',
        
        interviewer_name: session.interviewer_profiles?.name || 'Unknown Interviewer',
        interviewer_company: session.interviewer_profiles?.company || 'Unknown Company',
        interviewer_role: session.interviewer_profiles?.role || 'Unknown Role',
        
        difficulty_level: session.difficulty_profiles?.display_name || 'Unknown',
        difficulty_code: session.difficulty_profiles?.level || 'unknown',
        
        // Extract overall score from detailed analysis (not feedback scores)
        overall_score: (() => {
          try {
            const analysis = typeof session.detailed_analysis === 'string' 
              ? JSON.parse(session.detailed_analysis)
              : session.detailed_analysis;
            return analysis?.summary?.total_score || null;
          } catch {
            return null;
          }
        })(),
        analysis_summary: session.detailed_analysis?.summary?.overall_performance || null,
        
        // Raw data for session viewer
        detailed_analysis: session.detailed_analysis,
        feedback_data: session.feedback_data
      }))
    });
  } catch (error) {
    console.error('Error listing sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list sessions' },
      { status: 500 }
    );
  }
}
