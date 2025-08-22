import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase-client";

// POST /api/exhibits/show - Get specific exhibit by name for current case
export async function POST(request: NextRequest) {
  try {
    const { exhibit_name, case_id } = await request.json();

    if (!exhibit_name || !case_id) {
      return NextResponse.json(
        { error: "exhibit_name and case_id are required" },
        { status: 400 }
      );
    }

    console.log("🖼️ Looking for exhibit:", { exhibit_name, case_id });

    // Get case with exhibits JSON (simple key-value)
    const { data: caseData, error } = await supabase
      .from("interview_cases")
      .select("exhibits")
      .eq("id", case_id)
      .single();

    if (error || !caseData) {
      console.log("❌ Case not found:", { case_id, error: error?.message });
      return NextResponse.json(
        { error: "Case not found" },
        { status: 404 }
      );
    }

    // Get exhibit URL from simple key-value JSON
    const exhibits = caseData.exhibits || {};
    const exhibit_url = exhibits[exhibit_name];

    if (!exhibit_url) {
      console.log("❌ Exhibit not found:", { exhibit_name, case_id });
      
      // Return available exhibits for this case
      const availableExhibits = Object.keys(exhibits);

      return NextResponse.json(
        { 
          error: "Exhibit not found",
          available_exhibits: availableExhibits
        },
        { status: 404 }
      );
    }

    console.log("✅ Exhibit found:", {
      exhibit_name,
      exhibit_url,
      case_id
    });

    return NextResponse.json({
      exhibit: {
        id: `${case_id}-${exhibit_name}`,
        exhibit_name,
        display_name: exhibit_name.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
        description: `Case exhibit: ${exhibit_name}`,
        image_url: exhibit_url,
        file_type: "image/png"
      }
    });

  } catch (error) {
    console.error("Error in show exhibit API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
