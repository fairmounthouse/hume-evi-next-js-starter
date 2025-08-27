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

    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json(
        { error: "documentId is required" },
        { status: 400 }
      );
    }

    console.log("📅 Updating last_used_at for document:", { userId, documentId });

    // Update the last_used_at timestamp
    const { error } = await supabase
      .from('user_documents')
      .update({
        last_used_at: new Date().toISOString()
      })
      .eq('id', documentId)
      .eq('user_id', userId); // Security: ensure user owns the document

    if (error) {
      console.error('Error updating last_used_at:', error);
      return NextResponse.json(
        { error: "Failed to update document" },
        { status: 500 }
      );
    }

    console.log("✅ Updated last_used_at successfully");

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Error in update-last-used API:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
