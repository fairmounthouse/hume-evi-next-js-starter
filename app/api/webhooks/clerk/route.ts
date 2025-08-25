import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';
import { syncUserToSupabase, extractClerkUserData } from '@/utils/user-sync';

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  if (!webhookSecret) {
    console.error('Missing CLERK_WEBHOOK_SECRET');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return NextResponse.json({ error: 'Missing svix headers' }, { status: 400 });
  }

  // Get the body
  const payload = await req.text();

  // Create a new Svix instance with your secret.
  const wh = new Webhook(webhookSecret);

  let evt: any;

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as any;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Handle the webhook
  const eventType = evt.type;
  console.log(`🔔 [CLERK WEBHOOK] Received ${eventType} event`);

  try {
    switch (eventType) {
      case 'user.created':
      case 'user.updated': {
        const user = evt.data;
        console.log(`👤 [CLERK SYNC] Syncing user: ${user.id}`);
        
        // Extract comprehensive user data
        const userData = extractClerkUserData(user);
        
        // Sync to Supabase
        await syncUserToSupabase(userData);
        
        console.log(`✅ [CLERK SYNC] Successfully synced user: ${user.id}`);
        break;
      }
      
      case 'user.deleted': {
        const user = evt.data;
        console.log(`🗑️ [CLERK SYNC] User deleted: ${user.id}`);
        
        // Optionally handle user deletion
        // For now, we'll keep the user data but mark as deleted
        // You can implement soft delete logic here if needed
        
        break;
      }
      
      case 'session.created': {
        const session = evt.data;
        console.log(`🔐 [CLERK SYNC] Session created for user: ${session.user_id}`);
        
        // Trigger user sync on session creation to ensure data is fresh
        try {
          const response = await fetch(`${req.nextUrl.origin}/api/billing/init-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clerkId: session.user_id })
          });
          
          if (response.ok) {
            console.log(`✅ [CLERK SYNC] User data refreshed on session creation`);
          }
        } catch (error) {
          console.error('Error refreshing user data on session:', error);
        }
        
        break;
      }

      // Handle Clerk billing/subscription events
      case 'subscription.created':
      case 'subscription.updated': {
        const subscription = evt.data;
        console.log(`💳 [CLERK BILLING] Subscription ${eventType} for user: ${subscription.user_id}`);
        
        try {
          // Extract plan information from Clerk subscription
          const planKey = subscription.plan_id || subscription.price_id; // Depends on Clerk setup
          
          if (planKey) {
            const response = await fetch(`${req.nextUrl.origin}/api/billing/upgrade-plan`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${subscription.user_id}` // Pass user ID for auth
              },
              body: JSON.stringify({
                newPlanKey: planKey,
                periodStart: subscription.current_period_start,
                periodEnd: subscription.current_period_end
                // Usage is always preserved - no reset
              })
            });
            
            if (response.ok) {
              console.log(`✅ [CLERK BILLING] Successfully updated subscription in Supabase`);
            } else {
              console.error(`❌ [CLERK BILLING] Failed to update subscription:`, await response.text());
            }
          }
        } catch (error) {
          console.error('Error handling subscription event:', error);
        }
        
        break;
      }

      case 'subscription.cancelled':
      case 'subscription.deleted': {
        const subscription = evt.data;
        console.log(`💳 [CLERK BILLING] Subscription ${eventType} for user: ${subscription.user_id}`);
        
        try {
          // Downgrade to free plan
          const response = await fetch(`${req.nextUrl.origin}/api/billing/upgrade-plan`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${subscription.user_id}`
            },
            body: JSON.stringify({
              newPlanKey: 'free_user'
              // Usage is always preserved - no reset even on downgrades
            })
          });
          
          if (response.ok) {
            console.log(`✅ [CLERK BILLING] Successfully downgraded to free plan`);
          }
        } catch (error) {
          console.error('Error handling subscription cancellation:', error);
        }
        
        break;
      }
      
      default:
        console.log(`ℹ️ [CLERK WEBHOOK] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ success: true, eventType });
    
  } catch (error) {
    console.error(`❌ [CLERK WEBHOOK] Error processing ${eventType}:`, error);
    return NextResponse.json(
      { error: 'Webhook processing failed', eventType },
      { status: 500 }
    );
  }
}
