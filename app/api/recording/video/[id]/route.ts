import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

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
        { 
          status: 500,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    // Get video details from Cloudflare Stream
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/stream/${params.id}`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'X-Request-ID': crypto.randomUUID(), // Forces unique request
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error("Cloudflare API error:", error);
      return NextResponse.json(
        { error: "Failed to get video details" },
        { 
          status: response.status,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    const data = await response.json();

    if (!data.success) {
      console.error("Cloudflare API error:", data.errors);
      return NextResponse.json(
        { error: "Failed to get video details" },
        { 
          status: 400,
          headers: {
            'Cache-Control': 'no-store, no-cache, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }
      );
    }

    return new Response(JSON.stringify({
      id: data.result.uid,
      playbackUrl: data.result.preview,
      thumbnail: data.result.thumbnail,
      duration: data.result.duration,
      size: data.result.size,
      ready: data.result.readyToStream,
      state: data.result.status?.state || 'unknown',
      pctComplete: data.result.status?.pctComplete || '0',
      errorReasonCode: data.result.status?.errorReasonCode,
      errorReasonText: data.result.status?.errorReasonText,
      created: data.result.created,
      modified: data.result.modified,
      meta: data.result.meta,
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'private, no-cache, no-store, max-age=0, must-revalidate',
        'Expires': '0',
        'Pragma': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    console.error("Get video error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}