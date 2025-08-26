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

    const { planKey } = await request.json();
    
    if (!planKey) {
      return NextResponse.json(
        { error: "Plan key required" },
        { status: 400 }
      );
    }

    console.log(`🔄 [MANUAL SYNC] Syncing user ${userId} to plan ${planKey}`);

    // Use the same RPC function that webhooks use
    const { data: result, error } = await supabase
      .rpc('update_user_subscription', {
        p_clerk_id: userId,
        p_new_plan_key: planKey,
        p_period_start: new Date().toISOString(),
        p_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

    if (error) {
      console.error('❌ [MANUAL SYNC] Failed:', error);
      return NextResponse.json(
        { error: "Failed to sync plan", details: error.message },
        { status: 500 }
      );
    }

    if (!result?.success) {
      return NextResponse.json(
        { error: result?.error || "Unknown error" },
        { status: 500 }
      );
    }

    console.log(`✅ [MANUAL SYNC] Successfully synced user ${userId} to ${planKey}`);

    return NextResponse.json({
      success: true,
      message: `Successfully synced to ${planKey} plan`,
      result
    });

  } catch (error) {
    console.error('❌ [MANUAL SYNC] Error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
