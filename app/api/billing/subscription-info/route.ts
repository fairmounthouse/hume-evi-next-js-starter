import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserPlanKey } from "@/utils/plan-config";

/**
 * 🎯 Compatibility API - Returns subscription info in the format expected by the original dashboard
 * Uses our clean separation but maintains the same interface
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, has } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's plan key from Clerk
    const planKey = getUserPlanKey(has);
    
    // Static plan data as fallback (matches your Supabase table)
    const planData = {
      'free': { name: 'Free', price_dollars: 0 },
      'free_user': { name: 'Free', price_dollars: 0 }, // Handle both variations
      'starter': { name: 'Starter', price_dollars: 30 },
      'professional': { name: 'Professional', price_dollars: 50 },
      'premium': { name: 'Premium', price_dollars: 99 }
    };
    
    const currentPlan = planData[planKey as keyof typeof planData] || planData.free;
    
    // Return subscription info with plan details
    const subscriptionInfo = {
      plan_key: planKey,
      plan_name: currentPlan.name,
      plan_price_cents: currentPlan.price_dollars * 100, // Convert dollars to cents
      subscription_status: "active",
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    };

    return NextResponse.json(subscriptionInfo);

  } catch (error) {
    console.error("Error getting subscription info:", error);
    return NextResponse.json(
      { error: "Failed to get subscription info" },
      { status: 500 }
    );
  }
}
