import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/utils/supabase-client";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      newPlanKey, 
      periodStart, 
      periodEnd
    } = body;

    if (!newPlanKey) {
      return NextResponse.json(
        { error: "Missing newPlanKey" },
        { status: 400 }
      );
    }

    console.log(`🔄 [PLAN UPGRADE] User ${userId} upgrading to ${newPlanKey} - preserving usage`);

    // Update subscription in Supabase (usage is preserved)
    const { data: upgradeResult, error: upgradeError } = await supabase.rpc(
      'update_user_subscription',
      {
        p_clerk_id: userId,
        p_new_plan_key: newPlanKey,
        p_period_start: periodStart || new Date().toISOString(),
        p_period_end: periodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    );

    if (upgradeError) {
      console.error("❌ [PLAN UPGRADE] Supabase error:", upgradeError);
      return NextResponse.json(
        { error: "Failed to update subscription", details: upgradeError.message },
        { status: 500 }
      );
    }

    if (!upgradeResult?.success) {
      console.error("❌ [PLAN UPGRADE] Update failed:", upgradeResult);
      return NextResponse.json(
        { error: upgradeResult?.error || "Unknown error" },
        { status: 500 }
      );
    }

    console.log(`✅ [PLAN UPGRADE] Successfully upgraded user ${userId} to ${newPlanKey} - usage preserved`);

    return NextResponse.json({
      success: true,
      upgrade: upgradeResult,
      message: `Successfully upgraded to ${newPlanKey} - your usage has been preserved`
    });

  } catch (error) {
    console.error("❌ [PLAN UPGRADE] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
