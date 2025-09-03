import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase-client";

export async function GET(request: NextRequest) {
  try {
    // Fetch all active difficulty profiles with prompt content
    const { data: difficultyProfiles, error } = await supabase
      .from('difficulty_profiles')
      .select('id, level, display_name, description, prompts!prompt_id(prompt_content)')
      .eq('active', true)
      .order('display_name');

    if (error) {
      console.error('Error fetching difficulty profiles:', error);
      return NextResponse.json(
        { error: "Failed to fetch difficulty profiles" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profiles: difficultyProfiles || []
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'CDN-Cache-Control': 'public, s-maxage=3600',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=3600'
      }
    });

  } catch (error) {
    console.error('Error in difficulty profiles API:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
