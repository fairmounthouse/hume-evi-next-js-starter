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

    // If Supabase is not configured, skip silently with success to avoid client 500s
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) {
      console.warn("⚠️ [USER INIT] Supabase not configured. Skipping ensureUserExists.", {
        hasUrl: !!supabaseUrl,
        hasKey: !!supabaseKey,
      });
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "Supabase not configured",
        message: "Skipped usage tracking initialization",
        timestamp: new Date().toISOString(),
      });
    }

    // Simple user initialization - just create link for usage tracking
    let userUuid: string | undefined;
    try {
      userUuid = await ensureUserExists(userId, email);
      console.log(`✅ [USER INIT] User initialized for usage tracking: ${userId}`);
    } catch (e) {
      console.error("❌ [USER INIT] ensureUserExists failed. Proceeding without blocking UI.", e);
      // Return 200 so client doesn't error; include details for observability
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: "ensureUserExists_failed",
        message: (e as Error)?.message || "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }

    return NextResponse.json({
      success: true,
      userUuid,
      message: "User initialized for usage tracking",
      timestamp: new Date().toISOString(),
      note: "User profile data managed by Clerk directly",
    });

  } catch (error) {
    console.error("❌ [USER INIT] Unhandled error initializing user:", error);
    // Do not block UI – return OK with skip so client hook doesn't surface a 500
    return NextResponse.json({
      success: true,
      skipped: true,
      reason: "unhandled_error",
      message: (error as Error)?.message || "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
}