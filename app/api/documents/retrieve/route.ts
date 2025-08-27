import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase-client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required" },
        { status: 400 }
      );
    }

    console.log("📋 Retrieving documents for session:", sessionId);

    // Get documents from user_documents table (our single source of truth)
    const { data: documents, error } = await supabase
      .from('user_documents')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_active', true)
      .order('uploaded_at', { ascending: true });

    if (error) {
      console.error('Error retrieving documents:', error);
      return NextResponse.json(
        { error: "Failed to retrieve documents" },
        { status: 500 }
      );
    }

    // Generate signed URLs for documents if they exist
    const documentsWithUrls = await Promise.all(
      (documents || []).map(async (doc) => {
        try {
          // Get signed URL for the document
          const { data: urlData, error: urlError } = await supabase.storage
            .from('documents')
            .createSignedUrl(doc.file_path, 3600); // 1 hour expiry

          if (urlError) {
            console.warn(`Failed to create signed URL for ${doc.file_path}:`, urlError);
            return {
              ...doc,
              signed_url: null
            };
          }

          return {
            ...doc,
            signed_url: urlData?.signedUrl || null
          };
        } catch (error) {
          console.warn(`Error processing document ${doc.id}:`, error);
          return {
            ...doc,
            signed_url: null
          };
        }
      })
    );

    console.log("✅ Retrieved documents:", {
      sessionId,
      documentCount: documentsWithUrls.length,
      documentTypes: documentsWithUrls.map(d => d.document_type)
    });

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      documents: documentsWithUrls
    });

  } catch (error) {
    console.error("Error in documents retrieve API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
