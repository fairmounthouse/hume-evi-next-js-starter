import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { syncServerUserToSupabase, syncUserToSupabase, extractClientUserData } from "@/utils/user-sync";
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

    // Get request body
    const body = await request.json().catch(() => ({}));
    const { userData, forceRefresh = true, clerkId } = body;

    // Use provided clerkId or current userId
    const targetClerkId = clerkId || userId;

    let userUuid: string;
    let syncMethod = 'unknown';

    console.log(`🔄 [CLERK SYNC] Starting sync for user: ${targetClerkId}, forceRefresh: ${forceRefresh}`);

    try {
      // Always get fresh data from Clerk for maximum accuracy
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

      // Always sync comprehensive user data to Supabase
      userUuid = await syncServerUserToSupabase(user);
      syncMethod = 'server_comprehensive';

      console.log(`✅ [CLERK SYNC] Successfully synced user ${user.id} using ${syncMethod}`);

      return NextResponse.json({ 
        success: true,
        userUuid: userUuid,
        syncMethod: syncMethod,
        message: "User synced with latest Clerk data",
        timestamp: new Date().toISOString(),
        userData: {
          id: user.id,
          email: email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          username: user.username,
          imageUrl: user.imageUrl,
          hasImage: user.hasImage,
          twoFactorEnabled: user.twoFactorEnabled,
          lastSignInAt: user.lastSignInAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }
      });

    } catch (syncError) {
      console.warn("🔄 [CLERK SYNC] Full user sync failed, attempting fallback:", syncError);
      
      // Fallback: try with client data or basic creation
      if (userData) {
        const extractedData = extractClientUserData(userData);
        if (extractedData.clerkId && extractedData.email) {
          userUuid = await syncUserToSupabase(extractedData as any);
        } else {
          userUuid = await ensureUserExists(userId, userData.email || '');
        }
      } else {
        // Last resort: basic user creation with minimal data
        const user = await currentUser();
        const email = user?.emailAddresses[0]?.emailAddress || '';
        userUuid = await ensureUserExists(userId, email);
      }

      return NextResponse.json({ 
        success: true,
        userUuid: userUuid,
        message: "User initialized with fallback method" 
      });
    }

  } catch (error) {
    console.error("Error initializing user:", error);
    return NextResponse.json(
      { error: "Failed to initialize user" },
      { status: 500 }
    );
  }
}
