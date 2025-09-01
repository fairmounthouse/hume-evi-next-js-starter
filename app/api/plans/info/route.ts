import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserPlanKey } from "@/utils/plan-config";

export async function GET(request: NextRequest) {
  try {
    const { userId, has } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's current plan key from Clerk
    const planKey = getUserPlanKey(has);

    return NextResponse.json({
      success: true,
      planKey,
      message: "Plan details and limits are now stored in Supabase. Use getPlanDetails() and getUserUsageSummaryFromSupabase() functions.",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error getting plan info:", error);
    return NextResponse.json(
      { error: "Failed to get plan information" },
      { status: 500 }
    );
  }
}
