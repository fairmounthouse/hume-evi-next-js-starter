import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase-client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    console.log("🔍 Checking session status:", sessionId);

    // Check if session exists and has been completed
    const { data: session, error } = await supabase
      .from('interview_sessions')
      .select('id, status, transcript_path, live_transcript_data, video_url, ended_at')
      .eq('session_id', sessionId)  // Use session_id column, not id column
      .single();

    if (error) {
      console.log("📝 Session not found:", error.message);
      return NextResponse.json({
        isCompleted: false,
        exists: false
      });
    }

    const isCompleted = session.status === 'completed' || !!session.ended_at;
    
    console.log("✅ Session status checked:", {
      sessionId,
      isCompleted,
      hasTranscript: !!(session.transcript_path || session.live_transcript_data),
      hasVideo: !!session.video_url
    });

    return NextResponse.json({
      isCompleted,
      exists: true,
      transcript: session.live_transcript_data || null, // Use live transcript data
      transcriptPath: session.transcript_path || null,
      videoUrl: session.video_url,
      endedAt: session.ended_at
    });

  } catch (error) {
    console.error('Error checking session status:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
