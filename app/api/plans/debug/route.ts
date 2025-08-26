import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserPlanDetails, getUserLimits, getAllPlans } from "@/utils/plan-config";

/**
 * Debug endpoint to show exactly how we fetch plan data from Clerk
 * Following Clerk B2C SaaS documentation patterns
 */
export async function GET(request: NextRequest) {
  try {
    const { userId, has } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 🎯 Step 1: Get raw Clerk plan checks (following docs exactly)
    const rawClerkChecks = {
      // Direct Clerk has() calls as shown in documentation
      hasPremium: has({ plan: 'premium' }),
      hasProfessional: has({ plan: 'professional' }),
      hasStarter: has({ plan: 'starter' }),
      // No check for 'free' - it's the default when no paid plan is found
    };

    // 🎯 Step 2: Get usage limits based on inferred plan (our approach)
    const planDetails = getUserPlanDetails(has);
    const userLimits = getUserLimits(planDetails.plan);
    const allPlans = getAllPlans();

    // 🎯 Step 4: Show the logical flow
    const logicalFlow = {
      step1: "Check Clerk has({ plan: 'premium' })",
      step1Result: rawClerkChecks.hasPremium,
      step2: rawClerkChecks.hasPremium ? "User has Premium" : "Check has({ plan: 'professional' })",
      step2Result: rawClerkChecks.hasPremium ? "Premium detected" : rawClerkChecks.hasProfessional,
      step3: rawClerkChecks.hasPremium || rawClerkChecks.hasProfessional ? "Plan found" : "Check has({ plan: 'starter' })",
      step3Result: rawClerkChecks.hasPremium || rawClerkChecks.hasProfessional ? "Plan found" : rawClerkChecks.hasStarter,
      finalResult: planDetails.plan.name
    };

    return NextResponse.json({
      success: true,
      userId,
      
      // Raw Clerk API results
      rawClerkChecks,
      
      // Our usage-based approach
      currentPlan: planDetails.plan,
      usageLimits: userLimits,
      
      // Show how we map Clerk plans to usage limits
      mappingExample: {
        clerkResult: `has({ plan: '${planDetails.plan.key}' }) = true`,
        mappedLimits: {
          minutesPerMonth: userLimits.minutesPerMonth,
          interviewsPerDay: userLimits.interviewsPerDay,
          detailedAnalysesPerMonth: userLimits.detailedAnalysesPerMonth,
          videoReviewsPerMonth: userLimits.videoReviewsPerMonth,
        },
        enforcement: "Usage limits are checked in Supabase, not feature flags"
      },
      
      // All available plans with their limits
      allPlans: allPlans.map(plan => ({
        ...plan,
        limits: plan.limits
      })),
      
      // Show the logical decision flow
      logicalFlow,
      
      // Our approach explanation
      approach: {
        step1: "Use Clerk has() to determine user's plan",
        step2: "Map plan to usage limits in our config",
        step3: "Enforce limits via Supabase usage tracking",
        step4: "Features are inferred from usage limits, not feature flags",
        documentationUrl: "https://clerk.com/docs/nextjs/billing/b2c-saas"
      },
      
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error in plan debug:", error);
    return NextResponse.json(
      { error: "Failed to debug plan information" },
      { status: 500 }
    );
  }
}
