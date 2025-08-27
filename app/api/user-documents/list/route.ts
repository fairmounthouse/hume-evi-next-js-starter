import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase-client";
import { auth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const documentType = searchParams.get('type'); // 'resume' or 'job_description' or null for all

    console.log("📋 Fetching user documents:", { userId, documentType });

    let query = supabase
      .from('user_documents')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (documentType && ['resume', 'job_description'].includes(documentType)) {
      query = query.eq('document_type', documentType);
    }

    const { data: documents, error } = await query;

    if (error) {
      console.error('Error fetching user documents:', error);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    // Generate signed URLs for documents
    const documentsWithUrls = await Promise.all(
      (documents || []).map(async (doc) => {
        try {
          const { data: urlData, error: urlError } = await supabase.storage
            .from('documents')
            .createSignedUrl(doc.file_path, 3600); // 1 hour expiry

          return {
            ...doc,
            signed_url: urlData?.signedUrl || null
          };
        } catch (error) {
          console.warn(`Error creating signed URL for document ${doc.id}:`, error);
          return {
            ...doc,
            signed_url: null
          };
        }
      })
    );

    console.log("✅ Retrieved user documents:", {
      userId,
      documentType,
      count: documentsWithUrls.length
    });

    return NextResponse.json({
      success: true,
      documents: documentsWithUrls
    });

  } catch (error) {
    console.error("Error in user documents list API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
