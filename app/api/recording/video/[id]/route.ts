import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.CLOUDFLARE_STREAM_API_TOKEN;

    if (!accountId || !apiToken) {
      return NextResponse.json(
        { error: "Cloudflare credentials not configured" },
        { status: 500 }
      );
    }

    // Get video details from Cloudflare Stream
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${params.id}`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Cloudflare API error:", error);
      return NextResponse.json(
        { error: "Failed to get video details" },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (!data.success) {
      console.error("Cloudflare API error:", data.errors);
      return NextResponse.json(
        { error: "Failed to get video details" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      id: data.result.uid,
      playbackUrl: data.result.preview,
      thumbnail: data.result.thumbnail,
      duration: data.result.duration,
      size: data.result.size,
      ready: data.result.readyToStream,
      created: data.result.created,
      modified: data.result.modified,
      meta: data.result.meta,
    });
  } catch (error) {
    console.error("Get video error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}