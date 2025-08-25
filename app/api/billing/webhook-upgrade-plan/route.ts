import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase-client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      clerkUserId,
      newPlanKey, 
      subscriptionId,
      periodStart, 
      periodEnd,
      isScheduled = false
    } = body;

    if (!clerkUserId || !newPlanKey) {
      return NextResponse.json(
        { error: "Missing clerkUserId or newPlanKey" },
        { status: 400 }
      );
    }

    const actionType = isScheduled ? 'scheduling change to' : 'upgrading to';
    console.log(`🔄 [WEBHOOK PLAN UPGRADE] User ${clerkUserId} ${actionType} ${newPlanKey}`);

    // Update user's plan in Supabase
    const { data: updateResult, error: updateError } = await supabase
      .rpc('ensure_user_exists', {
        p_clerk_id: clerkUserId,
        p_plan_key: newPlanKey,
        p_subscription_id: subscriptionId,
        p_period_start: periodStart ? new Date(periodStart).toISOString() : null,
        p_period_end: periodEnd ? new Date(periodEnd).toISOString() : null
      });

    if (updateError) {
      console.error('❌ [WEBHOOK PLAN UPGRADE] Supabase error:', updateError);
      return NextResponse.json(
        { error: "Failed to update plan", details: updateError.message },
        { status: 500 }
      );
    }

    const successMessage = isScheduled ? 
      `Successfully scheduled ${clerkUserId} plan change to ${newPlanKey}` :
      `Successfully updated ${clerkUserId} to ${newPlanKey}`;
    console.log(`✅ [WEBHOOK PLAN UPGRADE] ${successMessage}`);

    return NextResponse.json({ 
      success: true, 
      message: `Plan updated to ${newPlanKey}`,
      userId: clerkUserId,
      planKey: newPlanKey
    });

  } catch (error) {
    console.error('❌ [WEBHOOK PLAN UPGRADE] Error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
