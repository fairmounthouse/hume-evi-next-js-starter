import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { checkUsageLimit } from "@/utils/billing-client";

export async function POST(request: NextRequest) {
  try {
    // Check authentication and get plan info
    const { userId, has } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { usageType, amount = 1 } = await request.json();

    if (!usageType) {
      return NextResponse.json(
        { error: "usageType is required" },
        { status: 400 }
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

    // Check usage limit with plan key
    const usageCheck = await checkUsageLimit(userId, usageType, amount, planKey);

    return NextResponse.json(usageCheck);

  } catch (error) {
    console.error("Error checking usage limit:", error);
    return NextResponse.json(
      { error: "Failed to check usage limit" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Check authentication and get plan info
    const { userId, has } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const usageType = searchParams.get('usageType');
    const amount = parseInt(searchParams.get('amount') || '1');

    if (!usageType) {
      return NextResponse.json(
        { error: "usageType is required" },
        { status: 400 }
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

    // Check usage limit with plan key
    const usageCheck = await checkUsageLimit(userId, usageType, amount, planKey);

    return NextResponse.json(usageCheck);

  } catch (error) {
    console.error("Error checking usage limit:", error);
    return NextResponse.json(
      { error: "Failed to check usage limit" },
      { status: 500 }
    );
  }
}
