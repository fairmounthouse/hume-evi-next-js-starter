import { NextRequest, NextResponse } from 'next/server';
import { syncUserToSupabase, extractClerkUserData } from '@/utils/user-sync';

export async function POST(req: NextRequest) {
  try {
    // Get the user data from the request body
    const { userData } = await req.json();
    
    if (!userData || !userData.id) {
      return NextResponse.json({ error: 'User data required' }, { status: 400 });
    }

    console.log(`🔄 [WEBHOOK FORCE SYNC] Force syncing user ${userData.id}`);

    // Extract and sync user data to Supabase
    const extractedData = extractClerkUserData(userData);
    
    if (extractedData.clerkId && extractedData.email) {
      try {
        const result = await syncUserToSupabase(extractedData as any);
        
        console.log(`✅ [WEBHOOK FORCE SYNC] Successfully synced user ${userData.id} using ${result}`);
        
        return NextResponse.json({
          success: true,
          message: 'User synced successfully',
          userId: userData.id,
          method: result
        });
      } catch (error) {
        console.error('❌ [WEBHOOK FORCE SYNC] Sync failed:', error);
        return NextResponse.json({ 
          error: 'Failed to sync user', 
          details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({ 
        error: 'Invalid user data - missing clerkId or email' 
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('❌ [WEBHOOK FORCE SYNC] Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
