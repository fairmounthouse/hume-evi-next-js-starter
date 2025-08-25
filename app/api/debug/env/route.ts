import { NextResponse } from "next/server";

export async function GET() {
  // Check all Clerk environment variables
  const envCheck = {
    hasPublishableKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    hasSecretKey: !!process.env.CLERK_SECRET_KEY,
    hasWebhookSecret: !!process.env.CLERK_WEBHOOK_SECRET,
    publishableKeyPrefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 10) + '...',
    secretKeyPrefix: process.env.CLERK_SECRET_KEY?.substring(0, 10) + '...',
    webhookSecretPrefix: process.env.CLERK_WEBHOOK_SECRET?.substring(0, 10) + '...',
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    timestamp: new Date().toISOString()
  };

  return NextResponse.json(envCheck);
}
