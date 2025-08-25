import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserUsageSummary } from "@/utils/billing-client";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get user's usage summary
    const usageSummary = await getUserUsageSummary(userId);

    return NextResponse.json(usageSummary);

  } catch (error) {
    console.error("Error getting usage summary:", error);
    return NextResponse.json(
      { error: "Failed to get usage summary" },
      { status: 500 }
    );
  }
}
