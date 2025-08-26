import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserPlan } from "@/utils/plan-config";

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

    // Get user's plan from Clerk using our clean separation
    const userPlan = getUserPlan(has);
    
    // Return in the format expected by the original dashboard
    const subscriptionInfo = {
      plan_name: userPlan.name,
      plan_key: userPlan.key,
      plan_price_cents: userPlan.price * 100, // Convert to cents
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
