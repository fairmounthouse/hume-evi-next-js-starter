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
      const status = response.status;
      const statusText = response.statusText;
      const contentType = response.headers.get('content-type') || '';
      let serviceBody = '';
      try { serviceBody = await response.text(); } catch { serviceBody = '[unreadable body]'; }
      console.error('External API error', { status, statusText, contentType, body: serviceBody?.slice(0, 2000) });
      return NextResponse.json(
        { error: "Upstream evaluation failed", service: { status, statusText, contentType, body: serviceBody } },
        { status }
      );
    }

    const result = await response.json();
    console.log('[Evaluate] Upstream service result:', result);
    
    // Validate response structure
    // Accept either feedback string or bullet_points array; confidence optional
    if (!result.status || typeof result.status !== 'string') {
      console.error('Invalid response structure from evaluation service - missing status');
      return NextResponse.json(
        { error: "Invalid response from evaluation service", raw: result },
        { status: 502 }
      );
    }

    const finalResponse: any = {
      status: result.status,
      timestamp: result.timestamp || Date.now()
    };
    if (Array.isArray(result.bullet_points)) {
      finalResponse.bullet_points = result.bullet_points;
    }
    if (typeof result.feedback === 'string') {
      finalResponse.feedback = result.feedback;
    }
    if (typeof result.confidence === 'number') {
      finalResponse.confidence = result.confidence;
    }

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
