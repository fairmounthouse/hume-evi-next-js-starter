import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase-client";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { references } = await request.json();

    if (!references || !Array.isArray(references)) {
      return NextResponse.json(
        { error: "references array is required" },
        { status: 400 }
      );
    }

    console.log("🔗 Linking existing documents to session:", {
      userId,
      referenceCount: references.length,
      references: references.map(r => ({ session_id: r.session_id, document_id: r.document_id }))
    });

    // Insert references (using upsert to handle duplicates)
    const { data: insertedRefs, error: insertError } = await supabase
      .from('session_document_references')
      .upsert(references, {
        onConflict: 'session_id,document_id',
        ignoreDuplicates: false
      })
      .select();

    if (insertError) {
      console.error('Error linking documents:', insertError);
      return NextResponse.json(
        { error: "Failed to link documents" },
        { status: 500 }
      );
    }

    console.log("✅ Successfully linked documents:", {
      linkedCount: insertedRefs?.length || 0,
      references: insertedRefs
    });

    return NextResponse.json({
      success: true,
      linkedCount: insertedRefs?.length || 0,
      references: insertedRefs
    });

  } catch (error) {
    console.error('Error in link-documents API:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
