import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN;

    if (!accountId || !apiToken) {
      return NextResponse.json(
        { error: "Cloudflare credentials not configured" },
        { status: 500 }
      );
    }

    // Get Upload-Length and Upload-Metadata from client request
    const uploadLength = request.headers.get("Upload-Length");
    const uploadMetadata = request.headers.get("Upload-Metadata");

    console.log("🔧 Creating TUS upload URL:", {
      accountId,
      uploadLength,
      uploadMetadata,
    });

    // Create TUS upload URL using Cloudflare Stream API
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream?direct_user=true`;
    
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Tus-Resumable": "1.0.0",
        "Upload-Length": uploadLength || "",
        "Upload-Metadata": uploadMetadata || "",
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Cloudflare TUS API error:", {
        status: response.status,
        statusText: response.statusText,
        error,
      });
      return NextResponse.json(
        { error: "Failed to create TUS upload URL" },
        { status: response.status }
      );
    }

    // The upload URL is in the Location header
    const uploadURL = response.headers.get("Location");
    
    if (!uploadURL) {
      console.error("❌ No Location header in TUS response");
      return NextResponse.json(
        { error: "Invalid TUS response - no upload URL" },
        { status: 500 }
      );
    }

    console.log("✅ TUS upload URL created:", uploadURL);

    return new Response(null, {
      status: 201,
      headers: {
        "Access-Control-Expose-Headers": "Location",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Allow-Origin": "*",
        "Location": uploadURL,
      },
    });

  } catch (error) {
    console.error("TUS upload URL error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "*",
      "Access-Control-Expose-Headers": "Location",
    },
  });
}
