import { NextRequest, NextResponse } from 'next/server';
import { listCompletedSessions } from '@/utils/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    const sessions = await listCompletedSessions(limit);
    
    return NextResponse.json({
      success: true,
      sessions: sessions.map(session => ({
        session_id: session.session_id,
        created_at: session.created_at,
        started_at: session.started_at,
        duration_seconds: session.duration_seconds,
        has_detailed_analysis: session.has_detailed_analysis,
        has_video: !!(session.detailed_analysis && typeof session.detailed_analysis === 'object' && (session.detailed_analysis as any).video_url),
        status: session.status,
        transcript_path: session.transcript_path
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
