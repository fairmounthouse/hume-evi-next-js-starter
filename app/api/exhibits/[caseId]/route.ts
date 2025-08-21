import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase-client";

// GET /api/exhibits/[caseId] - Get all exhibits for a case
export async function GET(
  request: NextRequest,
  { params }: { params: { caseId: string } }
) {
  try {
    const { data, error } = await supabase
      .from("case_exhibits")
      .select(`
        id,
        exhibit_name,
        display_name,
        description,
        storage_path,
        file_type,
        display_order,
        metadata
      `)
      .eq("case_id", params.caseId)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("Error fetching case exhibits:", error);
      return NextResponse.json(
        { error: "Failed to fetch exhibits" },
        { status: 500 }
      );
    }

    // Generate signed URLs for each exhibit
    const exhibitsWithUrls = await Promise.all(
      (data || []).map(async (exhibit) => {
        const { data: urlData } = await supabase.storage
          .from("case-exhibits")
          .createSignedUrl(exhibit.storage_path, 3600); // 1 hour expiry

        return {
          ...exhibit,
          image_url: urlData?.signedUrl || null
        };
      })
    );

    return NextResponse.json({
      exhibits: exhibitsWithUrls,
      count: exhibitsWithUrls.length
    });
  } catch (error) {
    console.error("Error in exhibits API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
