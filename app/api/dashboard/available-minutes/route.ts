import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getUserAvailableMinutes } from "@/utils/billing-client";

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

    // Get available minutes
    const availableMinutes = await getUserAvailableMinutes(userId);

    return NextResponse.json({
      success: true,
      data: availableMinutes
    });

  } catch (error) {
    console.error("Error getting available minutes:", error);
    return NextResponse.json(
      { error: "Failed to get available minutes" },
      { status: 500 }
    );
  }
}
