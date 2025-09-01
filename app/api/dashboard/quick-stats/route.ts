import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabase } from '@/utils/supabase-client';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Call the optimized Supabase RPC function to get quick stats from materialized view
    const { data, error } = await supabase
      .rpc('get_user_quick_stats', { p_clerk_id: userId });

    console.log('🔍 [QUICK-STATS] Debug data:', { userId, data, error });

    if (error) {
      console.error('Error fetching quick stats:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch quick stats' },
        { status: 500 }
      );
    }

    // Return the stats data without caching for testing
    return NextResponse.json({
      success: true,
      stats: data || {
        total_sessions: 0,
        monthly_sessions: 0,
        average_score: null,
        improvement_percentage: null
      }
    }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

  } catch (error) {
    console.error('Error in quick-stats API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
