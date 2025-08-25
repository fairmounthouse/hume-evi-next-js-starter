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
    try {
      const { data: updateResult, error: updateError } = await supabase
        .rpc('update_user_subscription', {
          p_clerk_id: clerkUserId,
          p_new_plan_key: newPlanKey,
          p_period_start: periodStart ? new Date(periodStart).toISOString() : null,
          p_period_end: periodEnd ? new Date(periodEnd).toISOString() : null
        });

      if (updateError) {
        console.error('❌ [WEBHOOK PLAN UPGRADE] Supabase RPC error:', updateError);
        
        // Fallback: Try direct subscription table update if RPC fails
        console.log('🔄 [WEBHOOK PLAN UPGRADE] Attempting direct subscription update...');
        
        // First, get the user's UUID and plan UUID
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('clerk_id', clerkUserId)
          .single();
          
        if (userError || !userData) {
          console.error('❌ [WEBHOOK PLAN UPGRADE] User not found:', userError);
          return NextResponse.json(
            { error: "User not found", details: userError?.message || 'No user data' },
            { status: 404 }
          );
        }
        
        const { data: planData, error: planError } = await supabase
          .from('plans')
          .select('id')
          .eq('plan_key', newPlanKey)
          .single();
          
        if (planError || !planData) {
          console.error('❌ [WEBHOOK PLAN UPGRADE] Plan not found:', planError);
          return NextResponse.json(
            { error: "Plan not found", details: planError?.message || 'No plan data' },
            { status: 404 }
          );
        }
        
        // Update or insert user subscription
        const { data: directUpdate, error: directError } = await supabase
          .from('user_subscriptions')
          .upsert({ 
            user_id: userData.id,
            plan_id: planData.id,
            status: 'active',
            current_period_start: periodStart ? new Date(periodStart).toISOString() : new Date().toISOString(),
            current_period_end: periodEnd ? new Date(periodEnd).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (directError) {
          console.error('❌ [WEBHOOK PLAN UPGRADE] Direct update also failed:', directError);
          return NextResponse.json(
            { error: "Failed to update plan", details: `RPC: ${updateError.message}, Direct: ${directError.message}` },
            { status: 500 }
          );
        }
        
        console.log('✅ [WEBHOOK PLAN UPGRADE] Direct table update succeeded');
      }
    } catch (error) {
      console.error('❌ [WEBHOOK PLAN UPGRADE] Unexpected error:', error);
      return NextResponse.json(
        { error: "Failed to update plan", details: error instanceof Error ? error.message : 'Unknown error' },
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
