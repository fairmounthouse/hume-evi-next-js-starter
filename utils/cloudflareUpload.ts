import * as tus from 'tus-js-client';

export interface UploadOptions {
  onProgress?: (percentage: number) => void;
  onSuccess?: (uploadId: string) => void;
  onError?: (error: Error) => void;
}

export interface CloudflareUploadResponse {
  uploadURL: string;
  uid: string;
}

/**
 * Get a one-time upload URL from Cloudflare Stream
 * This should be called from your backend to keep your API token secure
 */
export async function getUploadURL(): Promise<CloudflareUploadResponse> {
  console.log("🔗 Requesting upload URL from backend API...");
  
  try {
    const response = await fetch("/api/recording/upload-url", {
      method: "POST",
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });

    console.log("🔗 Backend API response:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      url: response.url,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Upload URL API error:", {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
        url: response.url
      });
      throw new Error(`Failed to get upload URL: ${response.statusText} - ${errorText}`);
    }

    try {
      const data = await response.json();
      console.log("✅ Successfully got upload URL from backend:", {
        hasUploadURL: !!data.uploadURL,
        hasUID: !!data.uid,
        uploadURLDomain: data.uploadURL ? new URL(data.uploadURL).hostname : 'unknown'
      });
      return data;
    } catch (parseError) {
      const text = await response.text();
      console.error("❌ Failed to parse upload URL response as JSON:", {
        parseError,
        responseText: text.substring(0, 200) + (text.length > 200 ? "..." : ""),
        responseStatus: response.status,
        responseHeaders: Object.fromEntries(response.headers.entries())
      });
      throw new Error(`Invalid JSON response from upload URL API: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
    }
  } catch (error) {
    console.error("❌ Network error getting upload URL:", {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : 'Unknown'
    });
    throw error;
  }
}

/**
 * Upload a video blob to Cloudflare Stream using optimal method based on size
 * - Under 100MB: Direct FormData upload (faster)
 * - Over 100MB: TUS resumable upload (reliable for large files)
 */
export async function uploadToCloudflare(
  blob: Blob,
  metadata: {
    name?: string;
    requireSignedURLs?: boolean;
    allowedOrigins?: string[];
    thumbnailTimestampPct?: number;
    watermark?: string;
  } = {},
  options: UploadOptions = {}
): Promise<string> {
  const fileSizeMB = blob.size / (1024 * 1024);
  console.log("📤 uploadToCloudflare called with blob:", blob.size, "bytes", `(${fileSizeMB.toFixed(1)}MB)`);
  console.log("📤 Browser info:", {
    userAgent: navigator.userAgent,
    onLine: navigator.onLine,
    connection: (navigator as any).connection?.effectiveType || 'unknown'
  });
  
  try {
    // Use TUS for files over 100MB, direct upload for smaller files
    if (fileSizeMB > 100) {
      console.log("📤 File over 100MB, using TUS resumable upload...");
      return await uploadWithTUS(blob, metadata, options);
    } else {
      console.log("📤 File under 100MB, using direct upload...");
      return await uploadDirect(blob, metadata, options);
    }
  } catch (error) {
    console.error("❌ Primary upload method failed, trying TUS as fallback:", error);
    
    // If direct upload fails, try TUS as fallback
    if (fileSizeMB <= 100) {
      try {
        console.log("📤 Trying TUS upload as fallback...");
        return await uploadWithTUS(blob, metadata, options);
      } catch (tusError) {
        console.error("❌ TUS fallback also failed:", tusError);
        throw new Error(`Both upload methods failed. Direct: ${error instanceof Error ? error.message : 'Unknown'}. TUS: ${tusError instanceof Error ? tusError.message : 'Unknown'}`);
      }
    } else {
      throw error;
    }
  }
}

/**
 * Direct upload for smaller files (under 100MB)
 */
async function uploadDirect(
  blob: Blob,
  metadata: any,
  options: UploadOptions
): Promise<string> {
  try {
    // Get upload URL from backend
    console.log("🔗 Getting direct upload URL from backend...");
    const { uploadURL, uid } = await getUploadURL();
    console.log("✅ Got upload URL, UID:", uid);
    console.log("📤 Upload URL domain:", new URL(uploadURL).hostname);

    // Create FormData for direct upload
    const formData = new FormData();
    formData.append("file", blob, metadata.name || `recording-${Date.now()}.webm`);

    console.log("📤 Starting direct upload to Cloudflare...");
    console.log("📤 Upload URL:", uploadURL);
    console.log("📤 FormData file size:", blob.size, "bytes");
    console.log("📤 Blob type:", blob.type);
    console.log("📤 Metadata:", metadata);
    
    // Test network connectivity first
    try {
      console.log("🌐 Testing network connectivity to Cloudflare...");
      const testResponse = await fetch("https://cloudflare.com", { 
        method: "HEAD", 
        mode: 'no-cors',
        signal: AbortSignal.timeout(5000)
      });
      console.log("✅ Network connectivity test passed");
    } catch (networkError) {
      console.warn("⚠️ Network connectivity test failed:", networkError);
    }
    
    console.log("📤 Attempting upload with detailed config...");
    
    // Try multiple fetch approaches to handle different browser/network issues
    let response: Response;
    
    try {
      // First attempt: Standard CORS request
      console.log("📤 Attempt 1: Standard CORS upload...");
      response = await fetch(uploadURL, {
        method: "POST",
        body: formData,
        mode: 'cors',
        credentials: 'omit',
        signal: AbortSignal.timeout(60000), // 60 second timeout
        headers: {
          'Accept': '*/*',
        },
      });
    } catch (corsError) {
      console.warn("📤 CORS upload failed, trying no-cors mode:", corsError);
      
      try {
        // Second attempt: No-CORS mode (less restrictive)
        console.log("📤 Attempt 2: No-CORS upload...");
        response = await fetch(uploadURL, {
          method: "POST",
          body: formData,
          mode: 'no-cors',
          signal: AbortSignal.timeout(60000),
        });
      } catch (noCorsError) {
        console.error("📤 Both CORS and no-CORS failed:", noCorsError);
        throw new Error(`Network error: Unable to upload to Cloudflare. CORS error: ${corsError instanceof Error ? corsError.message : 'Unknown'}. No-CORS error: ${noCorsError instanceof Error ? noCorsError.message : 'Unknown'}`);
      }
    }

    console.log("📤 Upload response received:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      url: response.url,
      type: response.type,
      ok: response.ok
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Upload failed with details:", {
        status: response.status,
        statusText: response.statusText,
        errorText,
        uploadURL,
        blobSize: blob.size,
        blobType: blob.type
      });
      throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    console.log("✅ Direct upload complete! Video ID:", uid);
    options.onProgress?.(100);
    options.onSuccess?.(uid);
    return uid;
    
  } catch (error) {
    console.error("❌ Direct upload error with full details:", {
      error: error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorName: error instanceof Error ? error.name : 'Unknown',
      stack: error instanceof Error ? error.stack : 'No stack',
      blobSize: blob.size,
      blobType: blob.type,
      metadata
    });
    
    // Try to provide more specific error messages
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      const networkError = new Error('Network error: Unable to connect to Cloudflare. This could be due to network connectivity issues, CORS restrictions, or firewall blocking the request.');
      options.onError?.(networkError);
      throw networkError;
    }
    
    options.onError?.(error as Error);
    throw error;
  }
}

/**
 * TUS resumable upload for larger files (over 100MB)
 */
async function uploadWithTUS(
  blob: Blob,
  metadata: any,
  options: UploadOptions
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Encode metadata for TUS Upload-Metadata header
    const tusMetadata: Record<string, string> = {
      filename: metadata.name || `recording-${Date.now()}.webm`,
      filetype: blob.type || 'video/webm',
    };

    // Add maxDurationSeconds if we want to limit duration (1 hour = 3600 seconds)
    const maxDurationBase64 = btoa('3600');
    const metadataHeader = `filename ${btoa(tusMetadata.filename)},filetype ${btoa(tusMetadata.filetype)},maxDurationSeconds ${maxDurationBase64}`;

    console.log("📤 Starting TUS upload with metadata:", tusMetadata);

    const upload = new tus.Upload(blob, {
      endpoint: '/api/recording/tus-upload-url',
      retryDelays: [0, 3000, 5000, 10000, 20000], // Retry on network issues
      chunkSize: 150 * 1024 * 1024, // 150MB chunks (as recommended by Cloudflare)
      metadata: tusMetadata,
      headers: {
        'Upload-Metadata': metadataHeader,
      },
      onError: (error) => {
        console.error("❌ TUS upload error:", error);
        options.onError?.(error);
        reject(error);
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
        console.log(`📤 TUS upload progress: ${percentage}% (${bytesUploaded}/${bytesTotal} bytes)`);
        options.onProgress?.(percentage);
      },
      onSuccess: () => {
        console.log("✅ TUS upload complete!");
        // Extract video ID from upload URL
        const uploadUrl = upload.url;
        const videoId = uploadUrl?.split('/').pop() || '';
        console.log("✅ TUS Video ID:", videoId);
        options.onSuccess?.(videoId);
        resolve(videoId);
      },
    });

    // Start the upload
    upload.start();
  });
}

/**
 * Get video details from Cloudflare Stream
 */
export async function getVideoDetails(videoId: string) {
  const response = await fetch(`/api/recording/video/${videoId}?_t=${Date.now()}`, {
    cache: 'no-store',
    next: { 
      revalidate: 0,
      tags: [`video-${videoId}`] // Optional: for manual revalidation
    }
  });
  
  if (!response.ok) {
    throw new Error(`Failed to get video details: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Format duration from seconds to human readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}