import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { transcript_text } = await request.json();

    if (!transcript_text || typeof transcript_text !== 'string') {
      return NextResponse.json(
        { error: "transcript_text is required and must be a string" },
        { status: 400 }
      );
    }
    
    // Call the external API
    const response = await fetch('https://interviewer-backend-183309496023.us-central1.run.app/api/transcript/evaluate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        transcript_text
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('External API error:', response.status, errorText);
      return NextResponse.json(
        { error: "Failed to evaluate transcript" },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    // Validate response structure
    if (!result.status || !result.feedback || typeof result.confidence !== 'number') {
      console.error('Invalid response structure from evaluation service');
      return NextResponse.json(
        { error: "Invalid response from evaluation service" },
        { status: 502 }
      );
    }

    const finalResponse = {
      status: result.status,
      feedback: result.feedback,
      confidence: result.confidence,
      timestamp: result.timestamp || Date.now()
    };

    // Return the evaluation result
    return NextResponse.json(finalResponse);

  } catch (error) {
    console.error("Transcript evaluation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
