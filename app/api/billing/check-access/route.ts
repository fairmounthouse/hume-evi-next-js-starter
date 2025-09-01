import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkUsageLimit } from "@/utils/billing-client";
import { getUserPlanKey } from "@/utils/plan-config";

/**
 * 🎯 Clean Access Check API - Uses proper separation of responsibilities:
 * - Clerk: Plan detection via has()
 * - Our Config: Plan definitions & limits
 * - Supabase: Usage tracking only
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId, has } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { requiredPlan, usageType, usageAmount } = await request.json();

    // 🎯 Get user's current plan key from Clerk
    const planKey = getUserPlanKey(has);

    // Check plan-based access if required
    if (requiredPlan) {
      const planHierarchy = { 
        free: 0,
        starter: 1, 
        professional: 2, 
        premium: 3 
      };
      
      const userPlanLevel = planHierarchy[planKey as keyof typeof planHierarchy] || 0;
      const requiredLevel = planHierarchy[requiredPlan as keyof typeof planHierarchy];
      
      if (userPlanLevel < requiredLevel) {
        return NextResponse.json({
          hasAccess: false,
          reason: 'insufficient_plan',
          currentPlan: planKey,
          requiredPlan: requiredPlan,
        });
      }
    }

    // Check usage limits if required (Supabase handles usage tracking)
    if (usageType && usageAmount) {
      const usageCheck = await checkUsageLimit(userId, usageType, usageAmount);
      
      if (!usageCheck.allowed) {
        return NextResponse.json({
          hasAccess: false,
          reason: 'usage_limit_exceeded',
          usageCheck,
          currentPlan: planKey
        });
      }
    }

    // User has access
    return NextResponse.json({
      hasAccess: true,
      currentPlan: planKey
    });

  } catch (error) {
    console.error("Error checking access:", error);
    return NextResponse.json(
      { error: "Failed to check access" },
      { status: 500 }
    );
  }
}
