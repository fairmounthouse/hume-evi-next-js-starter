import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const { sessionId, mbbReportData } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId is required' },
        { status: 400 }
      );
    }

    if (!mbbReportData) {
      return NextResponse.json(
        { success: false, error: 'mbbReportData is required' },
        { status: 400 }
      );
    }

    // Update the interview session with MBB report data
    const { data, error } = await supabase
      .from('interview_sessions')
      .update({
        mbb_report_data: mbbReportData,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId)
      .select();

    if (error) {
      console.error('Error updating MBB report:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update MBB report' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    console.log(`✅ MBB report saved to database for session: ${sessionId}`);

    return NextResponse.json({
      success: true,
      message: 'MBB report saved successfully'
    });

  } catch (error) {
    console.error('Error in update-mbb-report API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
