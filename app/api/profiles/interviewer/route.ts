import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase } from "@/utils/supabase-client";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    // Fetch interviewer profiles (default + user's custom profiles) from the consolidated view
    let query = supabase
      .from('interviewer_profiles_view')
      .select(`
        id,
        alias,
        name,
        user_id,
        active,
        company_display_name,
        company_name,
        seniority_display_name,
        difficulty_display_name,
        difficulty_level,
        company_prompt_content,
        seniority_prompt_content,
        difficulty_prompt_content
      `)
      .eq('active', true);

    // Include default profiles (user_id is null) and user-specific profiles if authenticated
    if (userId) {
      // Get user UUID from Clerk ID
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('clerk_id', userId)
        .single();
      
      if (userData) {
        query = query.or(`user_id.is.null,user_id.eq.${userData.id}`);
      } else {
        query = query.is('user_id', null); // Only defaults if user not found
      }
    } else {
      query = query.is('user_id', null); // Only default profiles for unauthenticated users
    }

    const { data: interviewerProfiles, error } = await query.order('user_id', { ascending: true }); // Defaults first (null values)

    if (error) {
      console.error('Error fetching interviewer profiles:', error);
      return NextResponse.json(
        { error: "Failed to fetch interviewer profiles" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profiles: interviewerProfiles || []
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1200',
        'CDN-Cache-Control': 'public, s-maxage=600',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=600'
      }
    });

  } catch (error) {
    console.error('Error in interviewer profiles API:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { name, alias, difficulty_profile_id, seniority_profile_id, company_profile_id } = await request.json();

    if (!name || !alias || !difficulty_profile_id || !seniority_profile_id || !company_profile_id) {
      return NextResponse.json(
        { error: "Missing required fields: name, alias, difficulty_profile_id, seniority_profile_id, company_profile_id" },
        { status: 400 }
      );
    }

    // Get user UUID from Clerk ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_id', userId)
      .single();

    if (userError || !userData) {
      console.error('Error finding user:', userError);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Create new interviewer profile (user_id = user UUID means it's custom, null means default)
    const { data: newProfile, error } = await supabase
      .from('interviewer_profiles_new')
      .insert({
        name,
        alias,
        difficulty_profile_id,
        seniority_profile_id,
        company_profile_id,
        user_id: userData.id // Custom profile belongs to this user (UUID)
      })
      .select(`
        id,
        alias,
        name,
        user_id,
        difficulty_profiles!difficulty_profile_id(id, display_name, level),
        seniority_profiles!seniority_profile_id(id, display_name, level),
        company_profiles!company_profile_id(id, display_name, name)
      `)
      .single();

    if (error) {
      console.error('Error creating interviewer profile:', error);
      return NextResponse.json(
        { error: "Failed to create interviewer profile" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: newProfile
    });

  } catch (error) {
    console.error('Error in create interviewer profile API:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
