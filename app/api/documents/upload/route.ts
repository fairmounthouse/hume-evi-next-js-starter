import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/utils/supabase-client";
import { auth } from "@clerk/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const sessionId = formData.get('sessionId') as string;
    const documentType = formData.get('documentType') as string;
    const alias = formData.get('alias') as string | null;

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

    console.log("📤 Uploading document to user_documents:", {
      userId,
      documentType,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type
    });

    // Create file path - use user-based structure
    const fileExtension = file.name.split('.').pop() || 'pdf';
    const timestamp = Date.now();
    const fileName = `${documentType}_${timestamp}.${fileExtension}`;
    const filePath = `users/${userId}/${fileName}`;

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

    // For text files, we'll save the content as a separate .txt file later if needed

    // Create title for the document
    const title = documentType === 'resume' 
      ? `Resume - ${file.name}` 
      : `Job Description - ${file.name}`;

    // Check if document already exists for this user/session/type
    const { data: existingDoc } = await supabase
      .from('user_documents')
      .select('id')
      .eq('user_id', userId)
      .eq('session_id', sessionId)
      .eq('document_type', documentType)
      .eq('is_active', true)
      .single();

    let documentData;
    if (existingDoc) {
      // Update existing document
      const { data: updatedDoc, error: updateError } = await supabase
        .from('user_documents')
        .update({
          title: title,
          original_filename: file.name,
          file_size_bytes: file.size,
          mime_type: file.type,
          file_path: filePath,
          file_url: publicUrl,
          alias: alias || null,
          uploaded_at: new Date().toISOString(),
          last_used_at: new Date().toISOString()
        })
        .eq('id', existingDoc.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating document metadata:', updateError);
        return NextResponse.json(
          { error: "Failed to update document metadata" },
          { status: 500 }
        );
      }
      documentData = updatedDoc;
    } else {
      // Insert new document
      const { data: newDoc, error: insertError } = await supabase
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
          session_id: sessionId,
          is_active: true,
          alias: alias || null,
          uploaded_at: new Date().toISOString(),
          last_used_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting document metadata:', insertError);
        return NextResponse.json(
          { error: "Failed to store document metadata" },
          { status: 500 }
        );
      }
      documentData = newDoc;
    }

    console.log("✅ Document uploaded successfully:", {
      userId,
      documentType,
      documentId: documentData.id,
      filePath,
      publicUrl
    });

    return NextResponse.json({
      success: true,
      document_id: documentData.id,
      user_id: userId,
      document_type: documentType,
      file_path: filePath,
      file_url: publicUrl,
      original_filename: file.name,
      file_size: file.size,
      title: title
    });

  } catch (error) {
    console.error("Document upload error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
