import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase-client';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { sessionId, entries, timestamp } = data;
    
    if (!sessionId || !entries || !Array.isArray(entries)) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    
    console.log(`💾 [BACKUP API] Received ${entries.length} entries for session ${sessionId}`);
    
    // Update existing interview_sessions table with live transcript data
    const { error: updateError } = await supabase
      .from('interview_sessions')
      .update({
        live_transcript_data: entries,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);
    
    if (updateError) {
      console.error('💾 [BACKUP API] Database error:', updateError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
    
    console.log(`✅ [BACKUP API] Successfully backed up ${entries.length} entries for session ${sessionId}`);
    
    return NextResponse.json({ 
      success: true, 
      entriesBackedUp: entries.length,
      sessionId,
      message: 'Transcript backed up to interview_sessions table'
    });
    
  } catch (error) {
    console.error('💾 [BACKUP API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
