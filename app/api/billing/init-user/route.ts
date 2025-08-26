import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { ensureUserExists } from "@/utils/billing-client";

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

    console.log(`🔄 [USER INIT] Initializing user for usage tracking: ${userId}`);

    // Get user email from Clerk
    const user = await currentUser();
    if (!user) {
      return NextResponse.json(
        { error: "User not found in Clerk" },
        { status: 404 }
      );
    }

    const email = user.emailAddresses[0]?.emailAddress;
    if (!email) {
      return NextResponse.json(
        { error: "User email not found" },
        { status: 400 }
      );
    }

    // Simple user initialization - just create link for usage tracking
    const userUuid = await ensureUserExists(userId, email);

    console.log(`✅ [USER INIT] User initialized for usage tracking: ${userId}`);

    return NextResponse.json({ 
      success: true,
      userUuid: userUuid,
      message: "User initialized for usage tracking",
      timestamp: new Date().toISOString(),
      note: "User profile data managed by Clerk directly"
    });

  } catch (error) {
    console.error("Error initializing user:", error);
    return NextResponse.json(
      { error: "Failed to initialize user" },
      { status: 500 }
    );
  }
}