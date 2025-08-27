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

    console.log("📋 Fetching session documents (hybrid approach):", sessionId);

    // Get documents in two ways:
    // 1. Direct session documents (uploaded during this session)
    // 2. Referenced documents (existing documents linked to this session)
    
    const [directDocs, referencedDocs] = await Promise.all([
      // Direct documents uploaded for this session
      supabase
        .from('user_documents')
        .select('*')
        .eq('session_id', sessionId)
        .eq('is_active', true),
      
      // Referenced documents (existing documents linked to this session)
      supabase
        .from('session_document_references')
        .select(`
          document_id,
          user_documents (*)
        `)
        .eq('session_id', sessionId)
    ]);

    if (directDocs.error) {
      console.error('Error fetching direct session documents:', directDocs.error);
      return NextResponse.json(
        { error: "Failed to fetch documents" },
        { status: 500 }
      );
    }

    if (referencedDocs.error) {
      console.error('Error fetching referenced documents:', referencedDocs.error);
      // Don't fail completely, just log the error
      console.warn('Continuing without referenced documents');
    }

    // Combine both types of documents
    const allDocuments = [
      ...(directDocs.data || []),
      ...(referencedDocs.data || []).map(ref => ({
        ...ref.user_documents,
        source: 'referenced' // Mark as referenced document
      }))
    ];

    // Remove duplicates (in case a document is both direct and referenced)
    const uniqueDocuments = allDocuments.reduce((acc: any[], doc) => {
      const existing = acc.find((d: any) => d.id === doc.id);
      if (!existing) {
        acc.push(doc);
      }
      return acc;
    }, [] as any[]);

    // Sort by document type and upload date
    const documents = uniqueDocuments.sort((a, b) => {
      if (a.document_type !== b.document_type) {
        return a.document_type === 'resume' ? -1 : 1;
      }
      return new Date(a.uploaded_at || a.created_at).getTime() - new Date(b.uploaded_at || b.created_at).getTime();
    });

    // Add signed URLs for documents
    const documentsWithUrls = await Promise.all(
      (documents || []).map(async (doc) => {
        try {
          const { data: urlData, error: urlError } = await supabase.storage
            .from('documents')
            .createSignedUrl(doc.file_path, 3600); // 1 hour expiry

          return {
            ...doc,
            signed_url: urlError ? null : urlData?.signedUrl
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

    console.log("✅ Retrieved session documents:", {
      sessionId,
      totalDocuments: documentsWithUrls.length,
      resumeCount: documentsWithUrls.filter(d => d.document_type === 'resume').length,
      jobDescCount: documentsWithUrls.filter(d => d.document_type === 'job_description').length
    });

    return NextResponse.json({
      success: true,
      sessionId,
      documents: documentsWithUrls
    });

  } catch (error) {
    console.error('Error in sessions/documents API:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
