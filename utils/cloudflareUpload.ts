// Note: TUS upload was causing decoding errors, using direct upload instead

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
  
  const response = await fetch("/api/recording/upload-url", {
    method: "POST",
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Upload URL API error:", {
      status: response.status,
      statusText: response.statusText,
      error: errorText,
    });
    throw new Error(`Failed to get upload URL: ${response.statusText} - ${errorText}`);
  }

  try {
    const data = await response.json();
    console.log("✅ Successfully got upload URL from backend");
    return data;
  } catch (parseError) {
    const text = await response.text();
    console.error("❌ Failed to parse upload URL response as JSON:", {
      parseError,
      responseText: text.substring(0, 200) + (text.length > 200 ? "..." : ""),
    });
    throw new Error(`Invalid JSON response from upload URL API: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`);
  }
}

/**
 * Upload a video blob to Cloudflare Stream using direct FormData upload
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
  console.log("📤 uploadToCloudflare called with blob:", blob.size, "bytes");
  
  try {
    // Get upload URL from backend
    console.log("🔗 Getting upload URL from backend...");
    const { uploadURL, uid } = await getUploadURL();
    console.log("✅ Got upload URL, UID:", uid);

    // Create FormData for direct upload
    const formData = new FormData();
    formData.append("file", blob, metadata.name || `recording-${Date.now()}.webm`);

    console.log("📤 Starting direct upload to Cloudflare...");
    
    const response = await fetch(uploadURL, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    console.log("✅ Upload complete! Video ID:", uid);
    options.onProgress?.(100);
    options.onSuccess?.(uid);
    return uid;
    
  } catch (error) {
    console.error("❌ Upload error:", error);
    options.onError?.(error as Error);
    throw error;
  }
}

/**
 * Get video details from Cloudflare Stream
 */
export async function getVideoDetails(videoId: string) {
  const response = await fetch(`/api/recording/video/${videoId}`);
  
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