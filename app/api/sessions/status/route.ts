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
      .select('id, status, transcript_data, video_url, ended_at')
      .eq('id', sessionId)
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
      hasTranscript: !!session.transcript_data,
      hasVideo: !!session.video_url
    });

    return NextResponse.json({
      isCompleted,
      exists: true,
      transcript: session.transcript_data,
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
