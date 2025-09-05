import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase-client';
import { auth } from '@clerk/nextjs/server';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and get current user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Fetch sessions with new combined profile system (use consolidated interviewer_profiles_view)
    // IMPORTANT: Filter by user_id to only show current user's sessions
    const { data: sessions, error } = await supabase
      .from('interview_sessions')
      .select(`
        *,
        interview_cases(title, type, industry, difficulty),
        interviewer_profiles_view!new_interviewer_profile_id (
          alias,
          name,
          company_display_name,
          company_name,
          seniority_display_name,
          difficulty_display_name,
          difficulty_level,
          company_prompt_content,
          seniority_prompt_content,
          difficulty_prompt_content
        )
      `)
      .eq('user_id', userId)  // SECURITY FIX: Only show current user's sessions
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
        has_detailed_analysis: !!(session.mbb_assessment_data) || !!(session.mbb_report_data),
        has_video: !!(session.video_url),
        status: session.status,
        transcript_path: session.transcript_path,
        user_id: session.user_id,
        
        // Rich metadata for meaningful session identification
        case_title: session.interview_cases?.title || 'Unknown Case',
        case_type: session.interview_cases?.type || 'Unknown',
        case_industry: session.interview_cases?.industry || 'Unknown',
        case_difficulty: session.interview_cases?.difficulty || 'Unknown',
        
        interviewer_alias: session.interviewer_profiles_view?.alias || 'Unknown Profile',
        interviewer_company: session.interviewer_profiles_view?.company_display_name || 'Unknown Company',
        interviewer_seniority: session.interviewer_profiles_view?.seniority_display_name || 'Unknown Seniority',
        
        difficulty_level: session.interviewer_profiles_view?.difficulty_display_name || 'Unknown',
        difficulty_code: session.interviewer_profiles_view?.difficulty_level || 'unknown',
        
        // Use MBB overall_score (5-point scale)
        overall_score: session.overall_score,
        analysis_summary: null, // Removed - using MBB system now
        
        // Raw data for session viewer
        feedback_data: session.feedback_data
      }))
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=180, stale-while-revalidate=300',
        'CDN-Cache-Control': 'public, s-maxage=180',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=180'
      }
    });
  } catch (error) {
    console.error('Error listing sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to list sessions' },
      { status: 500 }
    );
  }
}
