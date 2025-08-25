import { NextRequest, NextResponse } from "next/server";
import { syncUserToSupabase, extractClerkUserData } from "@/utils/user-sync";

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const body = await request.json().catch(() => ({}));
    const { userData, email } = body;

    if (!userData || !userData.id) {
      return NextResponse.json(
        { error: "Missing userData or user ID" },
        { status: 400 }
      );
    }

    console.log(`🔄 [WEBHOOK INIT USER] Initializing user ${userData.id}`);

    // Extract user data for Supabase
    const extractedData = extractClerkUserData(userData);
    
    // Fallback email from request body if extraction fails
    if (!extractedData.email && email) {
      extractedData.email = email;
    }
    
    if (!extractedData.clerkId || !extractedData.email) {
      console.error('❌ [WEBHOOK INIT USER] Invalid user data:', { 
        hasClerkId: !!extractedData.clerkId, 
        hasEmail: !!extractedData.email,
        userData: userData 
      });
      return NextResponse.json(
        { error: "Invalid user data - missing clerkId or email" },
        { status: 400 }
      );
    }

    // Sync user to Supabase
    try {
      const result = await syncUserToSupabase(extractedData);
      
      console.log(`✅ [WEBHOOK INIT USER] Successfully synced user ${userData.id} using ${result}`);

      return NextResponse.json({
        success: true,
        message: "User initialized successfully",
        userId: userData.id,
        method: result
      });
    } catch (error) {
      console.error('❌ [WEBHOOK INIT USER] Sync failed:', error);
      return NextResponse.json(
        { error: "Failed to sync user", details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('❌ [WEBHOOK INIT USER] Error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
