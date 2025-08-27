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

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('documentType') as string;
    const title = formData.get('title') as string;

    if (!file || !documentType || !title) {
      return NextResponse.json(
        { error: "Missing required fields: file, documentType, title" },
        { status: 400 }
      );
    }

    if (!['resume', 'job_description'].includes(documentType)) {
      return NextResponse.json(
        { error: "documentType must be 'resume' or 'job_description'" },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload PDF, DOC, DOCX, or TXT files." },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    console.log("📤 Saving user document:", {
      userId,
      documentType,
      title,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // Create file path for user documents
    const fileExtension = file.name.split('.').pop() || 'pdf';
    const timestamp = Date.now();
    const fileName = `${documentType}_${timestamp}.${fileExtension}`;
    const filePath = `user-documents/${userId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: 'max-age=3600',
        upsert: false // Don't overwrite, create unique files
      });

    if (uploadError) {
      console.error('Supabase Storage upload error:', uploadError);
      return NextResponse.json(
        { error: "Failed to upload file to storage" },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    const publicUrl = urlData.publicUrl;

    // Extract text content for text files
    let extractedText = null;
    if (file.type === 'text/plain') {
      try {
        extractedText = await file.text();
      } catch (error) {
        console.warn('Failed to extract text content:', error);
      }
    }

    // Store document metadata in user_documents table
    const { data: document, error: dbError } = await supabase
      .from('user_documents')
      .insert({
        user_id: userId,
        document_type: documentType,
        title: title,
        original_filename: file.name,
        file_size_bytes: file.size,
        mime_type: file.type,
        file_path: filePath,
        file_url: publicUrl,
        extracted_text: extractedText
      })
      .select()
      .single();

    if (dbError) {
      console.error('Error storing document metadata:', dbError);
      // Try to clean up uploaded file
      await supabase.storage.from('documents').remove([filePath]);
      return NextResponse.json(
        { error: "Failed to save document metadata" },
        { status: 500 }
      );
    }

    console.log("✅ User document saved successfully:", {
      userId,
      documentId: document.id,
      documentType,
      title,
      filePath,
      publicUrl
    });

    return NextResponse.json({
      success: true,
      document: document
    });

  } catch (error) {
    console.error("Error in user documents save API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
