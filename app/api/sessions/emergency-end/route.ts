import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { sessionId, duration, reason = 'tab_close' } = data;
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }
    
    console.log(`🚨 [EMERGENCY END] Ending session ${sessionId}, duration: ${duration}s, reason: ${reason}`);
    
    // Update session status to completed with duration
    const updateData: any = {
      status: 'completed',
      ended_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Add duration if provided
    if (typeof duration === 'number' && duration > 0) {
      updateData.duration_seconds = duration;
    }
    
    const { error: updateError } = await supabase
      .from('interview_sessions')
      .update(updateData)
      .eq('session_id', sessionId);
    
    if (updateError) {
      console.error('🚨 [EMERGENCY END] Database error:', updateError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    console.log(`✅ [EMERGENCY END] Successfully ended session ${sessionId} with duration ${duration}s`);
    
    return NextResponse.json({ 
      success: true, 
      sessionId,
      duration,
      reason,
      message: 'Session ended successfully'
    });
    
  } catch (error) {
    console.error('🚨 [EMERGENCY END] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
