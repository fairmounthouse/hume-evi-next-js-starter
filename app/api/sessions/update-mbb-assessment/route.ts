import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, mbbAssessmentData, overallScore } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId is required' },
        { status: 400 }
      );
    }

    if (!mbbAssessmentData || !overallScore) {
      return NextResponse.json(
        { success: false, error: 'mbbAssessmentData and overallScore are required' },
        { status: 400 }
      );
    }

    // Update the interview session with MBB assessment data
    const { data, error } = await supabase
      .from('interview_sessions')
      .update({
        mbb_assessment_data: mbbAssessmentData,
        overall_score: overallScore,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select();

    if (error) {
      console.error('Error updating MBB assessment:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update MBB assessment' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    console.log(`✅ MBB assessment saved for session: ${sessionId}, overall score: ${overallScore}`);

    return NextResponse.json({
      success: true,
      message: 'MBB assessment saved successfully',
      overallScore: overallScore
    });

  } catch (error) {
    console.error('Error in update-mbb-assessment API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
