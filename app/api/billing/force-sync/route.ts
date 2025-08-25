import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { syncUserToSupabase, extractClerkUserData } from '@/utils/user-sync';

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user data from the request body
    const { userData } = await req.json();
    
    if (!userData) {
      return NextResponse.json({ error: 'User data required' }, { status: 400 });
    }

    // Extract and sync user data to Supabase
    const extractedData = extractClerkUserData(userData);
    
    if (extractedData.clerkId && extractedData.email) {
      const result = await syncUserToSupabase(extractedData as any);
      
      return NextResponse.json({ 
        success: true, 
        message: 'User plan synced successfully',
        userId: result
      });
    } else {
      return NextResponse.json({ error: 'Invalid user data' }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Force sync error:', error);
    return NextResponse.json({ 
      error: 'Failed to sync user plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
