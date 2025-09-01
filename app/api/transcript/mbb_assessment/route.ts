import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { transcript_text } = await request.json();

    // Validate transcript
    if (!transcript_text || typeof transcript_text !== 'string') {
      return NextResponse.json(
        { detail: "transcript_text is required and must be a string" },
        { status: 400 }
      );
    }

    if (transcript_text.trim().length < 50) {
      return NextResponse.json(
        { detail: "Transcript too short for MBB assessment (minimum 50 characters)" },
        { status: 400 }
      );
    }

    // Call external backend API for MBB assessment
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes

    try {
      const response = await fetch('https://interviewer-backend-183309496023.us-central1.run.app/api/transcript/mbb_assessment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript_text
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('External API error:', response.status, response.statusText);
        return NextResponse.json(
          { error: "Failed to generate MBB assessment" },
          { status: response.status }
        );
      }

      const result = await response.json();
      return NextResponse.json(result);

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: "MBB assessment timed out" },
          { status: 408 }
        );
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error("MBB assessment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}