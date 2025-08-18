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

    // Call the external API with 2-minute timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 minutes

    try {
      const response = await fetch('https://interviewer-backend-183309496023.us-central1.run.app/api/transcript/final_evaluation', {
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
          { error: "Failed to evaluate transcript" },
          { status: response.status }
        );
      }

      const result = await response.json();
      
      // Validate response structure
      if (!result.factors || !Array.isArray(result.factors) || !result.summary) {
        console.error('Invalid response structure from external API:', result);
        return NextResponse.json(
          { error: "Invalid response from evaluation service" },
          { status: 502 }
        );
      }

      // Return the detailed evaluation result
      return NextResponse.json({
        factors: result.factors,
        summary: result.summary,
        confidence: result.confidence || 0.5,
        timestamp: result.timestamp || Date.now()
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: "Request timeout - evaluation took too long" },
          { status: 408 }
        );
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error("Final transcript evaluation error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
