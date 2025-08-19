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

    // Request a one-time upload URL from Cloudflare Stream
    console.log("🔧 Requesting upload URL from Cloudflare:", {
      accountId,
      apiTokenLength: apiToken?.length,
      url: `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
    });

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/direct_upload`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("❌ Cloudflare API error:", {
        status: response.status,
        statusText: response.statusText,
        error,
        accountId,
        apiTokenLength: apiToken?.length,
      });
      return NextResponse.json(
        { error: "Failed to get upload URL from Cloudflare", details: error },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.success) {
      console.error("Cloudflare API error:", data.errors);
      return NextResponse.json(
        { error: "Failed to get upload URL" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      uploadURL: data.result.uploadURL,
      uid: data.result.uid,
    });
  } catch (error) {
    console.error("Upload URL error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}