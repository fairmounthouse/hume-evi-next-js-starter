import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkUsageLimit, getUserSubscriptionInfo } from "@/utils/billing-client";

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

    const { requiredPlan, usageType, usageAmount } = await request.json();

    // Initialize user in billing system
    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/billing/init-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        email: request.headers.get('user-email') 
      })
    });

    // Check subscription info
    const subscriptionInfo = await getUserSubscriptionInfo(userId);
    
    // Check plan-based access
    if (requiredPlan && subscriptionInfo) {
      const planHierarchy = { starter: 1, professional: 2, premium: 3 };
      const userPlanLevel = planHierarchy[subscriptionInfo.plan_name?.toLowerCase() as keyof typeof planHierarchy] || 1;
      const requiredLevel = planHierarchy[requiredPlan as keyof typeof planHierarchy];
      
      if (userPlanLevel < requiredLevel) {
        return NextResponse.json({
          hasAccess: false,
          reason: 'insufficient_plan',
          currentPlan: subscriptionInfo.plan_name,
          requiredPlan: requiredPlan,
          subscriptionInfo
        });
      }
    }

    // Check usage limits if required
    if (usageType && usageAmount) {
      const usageCheck = await checkUsageLimit(userId, usageType, usageAmount);
      
      if (!usageCheck.allowed) {
        return NextResponse.json({
          hasAccess: false,
          reason: 'usage_limit_exceeded',
          usageCheck,
          subscriptionInfo
        });
      }
    }

    // User has access
    return NextResponse.json({
      hasAccess: true,
      subscriptionInfo
    });

  } catch (error) {
    console.error("Error checking billing access:", error);
    return NextResponse.json(
      { error: "Failed to check access" },
      { status: 500 }
    );
  }
}
