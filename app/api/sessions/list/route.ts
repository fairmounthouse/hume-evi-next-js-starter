import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Fetch sessions with new combined profile system
    const { data: sessions, error } = await supabase
      .from('interview_sessions')
      .select(`
        *,
        interview_cases(title, type, industry, difficulty),
        interviewer_profiles_new!new_interviewer_profile_id(
          alias,
          difficulty_profiles!difficulty_profile_id(display_name, level),
          seniority_profiles!seniority_profile_id(display_name, level),
          company_profiles!company_profile_id(display_name, name)
        )
      `)
      .eq('status', 'completed')
      .not('new_interviewer_profile_id', 'is', null)  // ONLY sessions with new interviewer profiles
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
        
        interviewer_alias: session.interviewer_profiles_new?.alias || 'Unknown Profile',
        interviewer_company: session.interviewer_profiles_new?.company_profiles?.display_name || 'Unknown Company',
        interviewer_seniority: session.interviewer_profiles_new?.seniority_profiles?.display_name || 'Unknown Seniority',
        
        difficulty_level: session.interviewer_profiles_new?.difficulty_profiles?.display_name || 'Unknown',
        difficulty_code: session.interviewer_profiles_new?.difficulty_profiles?.level || 'unknown',
        
        // Use MBB overall_score (5-point scale) with fallback to old system (converted to 5-point)
        overall_score: (() => {
          // Prefer new MBB overall_score (5-point scale)
          if (session.overall_score !== null && session.overall_score !== undefined) {
            return session.overall_score;
          }
          
          // Fallback to old detailed_analysis score (convert from 10-point to 5-point)
          try {
            const analysis = typeof session.detailed_analysis === 'string' 
              ? JSON.parse(session.detailed_analysis)
              : session.detailed_analysis;
            const oldScore = analysis?.summary?.total_score;
            return oldScore ? parseFloat((oldScore / 2.0).toFixed(1)) : null;
          } catch {
            return null;
          }
        })(),
        analysis_summary: session.detailed_analysis?.summary?.overall_performance || null,
        
        // Raw data for session viewer
        detailed_analysis: session.detailed_analysis,
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
