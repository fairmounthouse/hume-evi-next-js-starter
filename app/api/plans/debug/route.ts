import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserPlanKey, getUserPlanDetails } from "@/utils/plan-config";

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

    // 🎯 Step 2: Get plan details using updated system
    const planKey = getUserPlanKey(has);
    const planDetails = getUserPlanDetails(has);

    return NextResponse.json({
      success: true,
      userId,
      
      // Raw Clerk API results
      rawClerkChecks,
      
      // Current plan information
      currentPlanKey: planKey,
      planDetails,
      
      // Updated approach explanation
      approach: {
        step1: "Use Clerk has() to determine user's plan",
        step2: "Get plan key that matches Supabase database",
        step3: "Use Supabase functions to get actual limits and usage",
        step4: "All plan data now comes from database, not static config",
        note: "Use getUserUsageSummaryFromSupabase() and getPlanDetails() for actual limits"
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
