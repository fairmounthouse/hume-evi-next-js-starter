import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserUsageSummaryFromSupabase } from "@/utils/billing-client";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId, has } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Determine user's plan key from Clerk
    let planKey = 'free'; // default
    if (has?.({ plan: 'premium' })) {
      planKey = 'premium';
    } else if (has?.({ plan: 'professional' })) {
      planKey = 'professional';
    } else if (has?.({ plan: 'starter' })) {
      planKey = 'starter';
    }

    // Get user's usage summary with plan from Supabase
    const usageSummary = await getUserUsageSummaryFromSupabase(userId, planKey);

    return NextResponse.json(usageSummary, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
        'CDN-Cache-Control': 'public, s-maxage=300',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=300'
      }
    });

  } catch (error) {
    console.error("Error getting usage summary:", error);
    return NextResponse.json(
      { error: "Failed to get usage summary" },
      { status: 500 }
    );
  }
}
