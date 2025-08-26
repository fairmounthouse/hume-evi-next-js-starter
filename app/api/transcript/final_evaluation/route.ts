import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserPlan, getUserLimits } from "@/utils/plan-config";
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

    // 🎯 Check if user can use detailed analysis feature
    const userPlan = getUserPlan(has);
    const limits = getUserLimits(userPlan);
    
    if (!limits.canUseDetailedAnalysis) {
      return NextResponse.json(
        { 
          error: "Detailed analysis not available on your plan",
          planRequired: "starter",
          currentPlan: userPlan.name,
          upgradeUrl: "/pricing"
        },
        { status: 403 }
      );
    }

    // Check usage limits (unless unlimited)
    if (limits.detailedAnalysesPerMonth !== -1) {
      const usageCheck = await checkUsageLimit(userId, 'detailed_analysis_per_month', 1);
      
      if (!usageCheck.allowed) {
        return NextResponse.json(
          { 
            error: "Monthly detailed analysis limit reached",
            currentUsage: usageCheck.current_usage,
            limit: usageCheck.limit_value,
            upgradeUrl: "/pricing"
          },
          { status: 429 }
        );
      }
    }

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

      // 🎯 Track usage after successful analysis (unless unlimited)
      if (limits.detailedAnalysesPerMonth !== -1) {
        try {
          await trackUsage(userId, 'detailed_analysis_per_month', 1);
          console.log("✅ [BILLING] Detailed analysis usage tracked");
        } catch (trackingError) {
          console.error("⚠️ [BILLING] Failed to track detailed analysis usage (non-critical):", trackingError);
        }
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
