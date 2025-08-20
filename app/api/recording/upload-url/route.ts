import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN;

    console.log("🔧 Upload URL API called:", {
      hasAccountId: !!accountId,
      hasApiToken: !!apiToken,
      accountIdLength: accountId?.length,
      apiTokenLength: apiToken?.length,
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });

    if (!accountId || !apiToken) {
      console.error("❌ Missing Cloudflare credentials:", {
        hasAccountId: !!accountId,
        hasApiToken: !!apiToken
      });
      return NextResponse.json(
        { error: "Cloudflare credentials not configured" },
        { status: 500 }
      );
    }

    // Request a one-time upload URL from Cloudflare Stream
    const cloudflareUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`;
    console.log("🔧 Requesting upload URL from Cloudflare:", {
      accountId,
      apiTokenLength: apiToken?.length,
      url: cloudflareUrl,
    });

    const requestBody = {
      maxDurationSeconds: 3600, // 1 hour max
      requireSignedURLs: false,
      allowedOrigins: process.env.NODE_ENV === "production" 
        ? [
            process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, '') || "",
            "hume-evi-next-js-starter-gamma.vercel.app",
            "localhost:3000"
          ].filter(Boolean)
        : ["localhost:3000"],
      creator: request.headers.get("x-user-id") || undefined,
      meta: {
        source: "hume-evi-recording",
        timestamp: new Date().toISOString(),
      },
    };

    console.log("🔧 Request body:", requestBody);

    const response = await fetch(cloudflareUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
        "User-Agent": "hume-evi-recorder/1.0",
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(30000), // 30 second timeout
    });

    console.log("🔧 Cloudflare API response:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      url: response.url,
      ok: response.ok
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Cloudflare API error:", {
        status: response.status,
        statusText: response.statusText,
        error,
        accountId,
        apiTokenLength: apiToken?.length,
        requestBody,
        responseHeaders: Object.fromEntries(response.headers.entries())
      });
      return NextResponse.json(
        { error: "Failed to get upload URL from Cloudflare", details: error, status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log("🔧 Cloudflare API response data:", {
      success: data.success,
      hasResult: !!data.result,
      hasUploadURL: !!data.result?.uploadURL,
      hasUID: !!data.result?.uid,
      errors: data.errors
    });

    if (!data.success) {
      console.error("❌ Cloudflare API returned success=false:", {
        errors: data.errors,
        messages: data.messages,
        result: data.result
      });
      return NextResponse.json(
        { error: "Failed to get upload URL", details: data.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({
      uploadURL: data.result.uploadURL,
      uid: data.result.uid,
    }, {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  } catch (error) {
    console.error("Upload URL error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "*",
        },
      }
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
    },
  });
}