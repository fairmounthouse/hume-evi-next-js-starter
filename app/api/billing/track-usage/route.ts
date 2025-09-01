import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { trackUsage, trackInterviewSession } from "@/utils/billing-client";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { usageType, amount, durationMinutes } = await request.json();

    // Validate usageType is provided
    if (!usageType) {
      return NextResponse.json(
        { error: "usageType is required" },
        { status: 400 }
      );
    }

    // Special case for interview sessions
    if (usageType === 'interview_session') {
      if (durationMinutes === undefined) {
        return NextResponse.json(
          { error: "durationMinutes is required for interview_session usageType" },
          { status: 400 }
        );
      }
      await trackInterviewSession(userId, durationMinutes);
      return NextResponse.json({ 
        success: true,
        message: "Interview session usage tracked successfully" 
      });
    }

    // Regular usage tracking
    if (amount === undefined) {
      return NextResponse.json(
        { error: "amount is required for non-interview_session usageType" },
        { status: 400 }
      );
    }

    await trackUsage(userId, usageType, amount);

    return NextResponse.json({ 
      success: true,
      message: "Usage tracked successfully" 
    });

  } catch (error) {
    console.error("Error tracking usage:", error);
    return NextResponse.json(
      { error: "Failed to track usage" },
      { status: 500 }
    );
  }
}
