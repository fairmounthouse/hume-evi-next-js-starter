import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { sessionId, entries, timestamp, reason = 'emergency_save' } = data;
    
    if (!sessionId || !entries || !Array.isArray(entries)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    
    console.log(`🚨 [EMERGENCY SAVE API] Received ${entries.length} entries for session ${sessionId}, reason: ${reason}`);
    
    // Create emergency backup metadata to store with transcript
    const emergencyMetadata = {
      backup_reason: reason,
      backup_timestamp: new Date(timestamp).toISOString(),
      entry_count: entries.length,
      emergency_save: true
    };
    
    // Update existing interview_sessions table with emergency transcript data
    // Store both the transcript and emergency metadata
    const { error: updateError } = await supabase
      .from('interview_sessions')
      .update({
        live_transcript_data: entries,
        feedback_data: emergencyMetadata, // Store emergency metadata in feedback_data temporarily
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);
    
    if (updateError) {
      console.error('🚨 [EMERGENCY SAVE API] Database error:', updateError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    console.log(`✅ [EMERGENCY SAVE API] Successfully saved ${entries.length} entries for session ${sessionId}`);
    
    return NextResponse.json({ 
      success: true, 
      entriesSaved: entries.length,
      sessionId,
      reason,
      message: 'Emergency transcript saved to interview_sessions table'
    });
    
  } catch (error) {
    console.error('🚨 [EMERGENCY SAVE API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
