import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase-client";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sessionId = formData.get('sessionId') as string;
    const documentType = formData.get('documentType') as string;

    if (!file || !sessionId || !documentType) {
      return NextResponse.json(
        { error: "Missing required fields: file, sessionId, documentType" },
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

    console.log("📤 Uploading document to Supabase Storage:", {
      sessionId,
      documentType,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // Create file path
    const fileExtension = file.name.split('.').pop() || 'pdf';
    const fileName = `${documentType}.${fileExtension}`;
    const filePath = `${sessionId}/${fileName}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: 'max-age=3600',
        upsert: true
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

    console.log("✅ Document uploaded successfully:", {
      sessionId,
      documentType,
      filePath,
      publicUrl
    });

    return NextResponse.json({
      success: true,
      session_id: sessionId,
      document_type: documentType,
      file_path: filePath,
      file_url: publicUrl,
      original_filename: file.name,
      file_size: file.size
    });

  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
