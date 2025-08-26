import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserPlan, getAllPlans, canUseFeature, getUserLimits } from "@/utils/plan-config";

export async function GET(request: NextRequest) {
  try {
    const { userId, has } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's current plan and limits
    const userPlan = getUserPlan(has);
    const userLimits = getUserLimits(userPlan);
    
    // Get all available plans
    const allPlans = getAllPlans();
    
    // Get user's features (inferred from usage limits)
    const features = {
      advanced_analytics: canUseFeature(userPlan, 'advanced_analytics'),
      video_review: canUseFeature(userPlan, 'video_review'),
      unlimited_sessions: canUseFeature(userPlan, 'unlimited_sessions'),
      detailed_analysis: canUseFeature(userPlan, 'detailed_analysis'),
    };

    return NextResponse.json({
      success: true,
      userPlan,
      limits: userLimits,
      features,
      allPlans,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error getting plan info:", error);
    return NextResponse.json(
      { error: "Failed to get plan information" },
      { status: 500 }
    );
  }
}
