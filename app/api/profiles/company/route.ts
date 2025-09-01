import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase-client";

export async function GET(request: NextRequest) {
  try {
    // Fetch all active company profiles with prompt content
    const { data: companyProfiles, error } = await supabase
      .from('company_profiles')
      .select('id, name, display_name, description, prompt_id(prompt_content)')
      .eq('active', true)
      .order('display_name');

    if (error) {
      console.error('Error fetching company profiles:', error);
      return NextResponse.json(
        { error: "Failed to fetch company profiles" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profiles: companyProfiles || []
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
        'CDN-Cache-Control': 'public, s-maxage=3600',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=3600'
      }
    });

  } catch (error) {
    console.error('Error in company profiles API:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
