import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [AUTH TEST] Testing Clerk authentication...');
    
    // Test auth() function
    const { userId } = await auth();
    console.log('🔍 [AUTH TEST] auth() userId:', userId);
    
    // Test currentUser() function
    const user = await currentUser();
    console.log('🔍 [AUTH TEST] currentUser():', user?.id, user?.emailAddresses?.[0]?.emailAddress);
    
    // Check environment variables
    const hasPublishableKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const hasSecretKey = !!process.env.CLERK_SECRET_KEY;
    
    console.log('🔍 [AUTH TEST] Environment check:', { hasPublishableKey, hasSecretKey });
    
    return NextResponse.json({
      success: true,
      userId,
      userEmail: user?.emailAddresses?.[0]?.emailAddress,
      hasPublishableKey,
      hasSecretKey,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [AUTH TEST] Error:', error);
    return NextResponse.json({
      error: 'Authentication test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Same test but for POST requests (like upgrade-plan)
  return GET(request);
}
