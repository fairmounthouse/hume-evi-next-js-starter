import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserPlanKey } from "@/utils/plan-config";
import { checkUsageLimit, trackUsage } from "@/utils/billing-client";

export async function POST(request: NextRequest) {
  try {
    // Check authentication and plan access
    const { userId, has } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Get plan key for usage tracking
    const planKey = getUserPlanKey(has);
    
    // Check usage limits for detailed analysis (this is a premium feature)
    const usageCheck = await checkUsageLimit(userId, 'detailed_analysis_per_month', 1);
    
    if (!usageCheck.allowed) {
      return NextResponse.json(
        { 
          error: "Monthly detailed analysis limit reached",
          currentUsage: usageCheck.current_usage,
          limit: usageCheck.limit_value,
          currentPlan: planKey,
          upgradeUrl: "/pricing"
        },
        { status: 429 }
      );
    }

    const { transcript_text } = await request.json();

    if (!transcript_text || typeof transcript_text !== 'string') {
      return NextResponse.json(
        { error: "transcript_text is required and must be a string" },
        { status: 400 }
      );
    }

    if (transcript_text.length < 100) {
      return NextResponse.json(
        { error: "Transcript too short for MBB report (minimum 100 characters)" },
        { status: 400 }
      );
    }

    // Call the external API with 2-minute timeout for detailed analysis
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes

    try {
      const response = await fetch('https://interviewer-backend-183309496023.us-central1.run.app/api/transcript/mbb_report', {
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
          { error: "Failed to generate detailed MBB report" },
          { status: response.status }
        );
      }

      const result = await response.json();
      console.log('[MBB Report] Upstream service result:', result);
      
      // Validate response structure
      if (!result.verdict || typeof result.verdict !== 'string') {
        console.error('Invalid response structure from MBB report service - missing verdict');
        return NextResponse.json(
          { error: "Invalid response from MBB report service", raw: result },
          { status: 502 }
        );
      }

      // Validate unified_moments structure
      if (!result.unified_moments || !Array.isArray(result.unified_moments)) {
        console.error('Invalid response structure from MBB report service - missing or invalid unified_moments');
        return NextResponse.json(
          { error: "Invalid response from MBB report service - unified_moments required", raw: result },
          { status: 502 }
        );
      }

      // Track usage after successful analysis
      try {
        await trackUsage(userId, 'detailed_analysis_per_month', 1);
        console.log("✅ [BILLING] MBB detailed analysis usage tracked");
      } catch (trackingError) {
        console.error("⚠️ [BILLING] Failed to track MBB analysis usage (non-critical):", trackingError);
      }

      return NextResponse.json(result);

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        console.error('MBB report generation timed out');
        return NextResponse.json(
          { error: "MBB report generation timed out. Please try again." },
          { status: 408 }
        );
      }
      
      console.error('Error calling MBB report service:', error);
      return NextResponse.json(
        { error: "Failed to generate MBB report" },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error("Error in MBB report endpoint:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
