import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId is required' },
        { status: 400 }
      );
    }

    // Fetch MBB assessment and report data from database
    const { data, error } = await supabase
      .from('interview_sessions')
      .select('mbb_assessment_data, mbb_report_data, overall_score')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching MBB assessment:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch MBB assessment' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // Return the MBB assessment and report data
    return NextResponse.json({
      success: true,
      mbbAssessment: data.mbb_assessment_data || null,
      mbbReport: data.mbb_report_data || null,
      overallScore: data.overall_score || null
    });

  } catch (error) {
    console.error('Error in get-mbb-assessment API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
