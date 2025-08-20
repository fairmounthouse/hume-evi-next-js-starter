import { NextRequest, NextResponse } from "next/server";

// Extend global to include our server-side cache
declare global {
  var documentAnalysisCache: Map<string, {
    data: any;
    timestamp: number;
    ttl: number;
  }> | undefined;
}

export async function POST(request: NextRequest) {
  try {
    const { session_id, resume_url, job_description_url } = await request.json();

    if (!session_id) {
      return NextResponse.json(
        { error: "session_id is required" },
        { status: 400 }
      );
    }

    if (!resume_url && !job_description_url) {
      return NextResponse.json(
        { error: "At least one document URL (resume_url or job_description_url) is required" },
        { status: 400 }
      );
    }

    console.log("📋 Processing documents via external API:", {
      session_id,
      hasResume: !!resume_url,
      hasJobDescription: !!job_description_url
    });

    // Call your external API (same base URL as evaluation)
    const externalApiUrl = 'https://interviewer-backend-183309496023.us-central1.run.app/api/documents/process';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000); // 3 minutes for document processing

    try {
      const response = await fetch(externalApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id,
          resume_url,
          job_description_url
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error('External API error:', response.status, response.statusText);
        return NextResponse.json(
          { error: "Failed to process documents" },
          { status: response.status }
        );
      }

      const result = await response.json();
      
      // Validate response structure
      if (!result.success || !result.analysis) {
        console.error('Invalid response structure from external API:', result);
        return NextResponse.json(
          { error: "Invalid response from document processing service" },
          { status: 502 }
        );
      }

      console.log("✅ Documents processed successfully:", {
        session_id: result.session_id,
        hasAnalysis: !!result.analysis,
        processed_at: result.processed_at
      });

      // Store the analysis in Supabase Storage as JSON file (accessible from anywhere)
      const { supabase } = await import("@/utils/supabase-client");
      
      const analysisData = {
        session_id,
        analysis: result.analysis,
        processed_at: result.processed_at,
        timestamp: Date.now()
      };
      
      // Create JSON as text file to avoid MIME type issues
      const analysisBlob = new Blob([JSON.stringify(analysisData, null, 2)], { 
        type: 'text/plain' 
      });
      
      const analysisPath = `${session_id}/document_analysis.txt`;
      
      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(analysisPath, analysisBlob, {
          cacheControl: 'max-age=3600',
          upsert: true
        });
      
      if (storageError) {
        console.warn("⚠️ Failed to store document analysis in storage:", storageError);
      } else {
        console.log("💾 Document analysis stored in Supabase Storage:", {
          session_id,
          analysisPath,
          analysisKeys: Object.keys(result.analysis || {}),
          storageLocation: "documents/" + analysisPath
        });
      }

      // Return simple success - frontend doesn't need the analysis data
      return NextResponse.json({
        success: true,
        session_id: result.session_id,
        processed_at: result.processed_at,
        message: "Documents processed and ready for interview"
      });

    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: "Request timeout - document processing took too long" },
          { status: 408 }
        );
      }
      
      throw fetchError;
    }

  } catch (error) {
    console.error("Document processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
