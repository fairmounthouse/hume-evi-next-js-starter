import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { Webhook } from 'svix';

// Extended webhook event type to include Clerk Commerce events
interface ExtendedWebhookEvent {
  data: any;
  object: string;
  type: string;
  timestamp?: number;
  instance_id?: string;
}

export async function POST(req: NextRequest) {
  // Get the webhook secret from environment variables
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
  }

  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get('svix-id');
  const svix_timestamp = headerPayload.get('svix-timestamp');
  const svix_signature = headerPayload.get('svix-signature');

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Error occurred -- no svix headers', {
      status: 400
    });
  }

  // Get the body
  const payload = await req.json();
  const body = JSON.stringify(payload);

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: ExtendedWebhookEvent;

  // Verify the payload with the headers
  try {
    evt = wh.verify(body, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    }) as ExtendedWebhookEvent;
  } catch (err) {
    console.error('Error verifying webhook:', err);
    return new Response('Error occurred', {
      status: 400
    });
  }

  // Get the ID and type
  const { id } = evt.data;
  const eventType = evt.type;

  console.log(`🔔 [CLERK WEBHOOK] Received ${eventType} for ID: ${id}`);

  try {
    // Handle different event types
    switch (eventType) {
      case 'user.created': {
        const user = evt.data;
        console.log(`👤 [CLERK WEBHOOK] New user created: ${user.id}`);
        
        try {
          // Sync new user to Supabase (using webhook-safe endpoint)
          const response = await fetch(`${req.nextUrl.origin}/api/billing/webhook-init-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: user.email_addresses[0]?.email_address,
              userData: user
            })
          });

          if (response.ok) {
            console.log(`✅ [CLERK WEBHOOK] Successfully synced new user to Supabase`);
          } else {
            console.error(`❌ [CLERK WEBHOOK] Failed to sync user:`, await response.text());
          }
        } catch (error) {
          console.error('Error syncing new user:', error);
        }
        
        break;
      }

      case 'user.updated': {
        const user = evt.data;
        console.log(`👤 [CLERK WEBHOOK] User updated: ${user.id}`);
        
        try {
          // Re-sync user data to Supabase (using webhook-safe endpoint)
          const response = await fetch(`${req.nextUrl.origin}/api/billing/webhook-force-sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userData: user
            })
          });

          if (response.ok) {
            console.log(`✅ [CLERK WEBHOOK] Successfully synced user update to Supabase`);
          } else {
            console.error(`❌ [CLERK WEBHOOK] Failed to sync user update:`, await response.text());
          }
        } catch (error) {
          console.error('Error syncing user update:', error);
        }
        
        break;
      }

      case 'user.deleted': {
        const user = evt.data;
        console.log(`👤 [CLERK WEBHOOK] User deleted: ${user.id}`);
        
        // Note: You might want to handle user deletion in Supabase here
        // For now, we'll just log it
        
        break;
      }

      case 'session.created': {
        const session = evt.data;
        console.log(`🔐 [CLERK WEBHOOK] Session created for user: ${session.user_id}`);
        
        break;
      }

      case 'session.ended':
      case 'session.removed':
      case 'session.revoked': {
        const session = evt.data;
        console.log(`🔐 [CLERK WEBHOOK] Session ${eventType} for user: ${session.user_id}`);
        
        break;
      }

      // Clerk Commerce/Billing subscription events
      case 'subscription.created':
      case 'subscription.updated': {
        const subscription = evt.data;
        console.log(`💳 [CLERK COMMERCE] Subscription ${eventType}:`, subscription.id);
        
        try {
          if (!subscription.payer) {
            console.log(`⚠️ [CLERK COMMERCE] No payer found in subscription`);
            break;
          }

          const userId = subscription.payer.user_id;
          
          // Handle different subscription item statuses
          // Priority: active > upcoming > others
          const currentActiveItem = subscription.items?.find((item: any) => item.status === 'active');
          const upcomingItem = subscription.items?.find((item: any) => item.status === 'upcoming');
          
          let planToApply = null;
          let isImmediate = true;
          
          if (currentActiveItem) {
            // User has an active plan right now
            planToApply = currentActiveItem;
            console.log(`📋 [CLERK COMMERCE] User ${userId} has ACTIVE plan: ${currentActiveItem.plan.slug}`);
          } else if (upcomingItem) {
            // User has an upcoming plan (downgrades often show as upcoming)
            planToApply = upcomingItem;
            isImmediate = false;
            console.log(`📋 [CLERK COMMERCE] User ${userId} has UPCOMING plan: ${upcomingItem.plan.slug} (starts ${new Date(upcomingItem.period_start)})`);
          }
          
          if (planToApply) {
            const planSlug = planToApply.plan.slug;
            
            // For immediate changes (upgrades, active plans)
            if (isImmediate || currentActiveItem) {
              const response = await fetch(`${req.nextUrl.origin}/api/billing/webhook-upgrade-plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  clerkUserId: userId,
                  newPlanKey: planSlug,
                  subscriptionId: subscription.id,
                  periodStart: planToApply.period_start,
                  periodEnd: planToApply.period_end
                })
              });
              
              if (response.ok) {
                console.log(`✅ [CLERK COMMERCE] Successfully updated plan to ${planSlug} (immediate)`);
              } else {
                console.error(`❌ [CLERK COMMERCE] Failed to update plan:`, await response.text());
              }
            } else {
              // For upcoming changes (downgrades), we might want to schedule them
              // For now, we'll apply them immediately but log the timing
              console.log(`📅 [CLERK COMMERCE] Applying upcoming plan ${planSlug} immediately (normally starts ${new Date(planToApply.period_start)})`);
              
              const response = await fetch(`${req.nextUrl.origin}/api/billing/webhook-upgrade-plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  clerkUserId: userId,
                  newPlanKey: planSlug,
                  subscriptionId: subscription.id,
                  periodStart: planToApply.period_start,
                  periodEnd: planToApply.period_end,
                  isScheduled: true
                })
              });
              
              if (response.ok) {
                console.log(`✅ [CLERK COMMERCE] Successfully scheduled plan change to ${planSlug}`);
              } else {
                console.error(`❌ [CLERK COMMERCE] Failed to schedule plan change:`, await response.text());
              }
            }
          } else {
            console.log(`⚠️ [CLERK COMMERCE] No active or upcoming plan found for user ${userId}`);
          }
        } catch (error) {
          console.error('Error handling subscription event:', error);
        }
        
        break;
      }

      case 'subscription.canceled':
      case 'subscription.ended': {
        const subscription = evt.data;
        console.log(`💳 [CLERK COMMERCE] Subscription ${eventType}:`, subscription.id);
        
        try {
          if (subscription.payer) {
            const userId = subscription.payer.user_id;
            
            // Downgrade to free plan (using webhook-safe endpoint)
            const response = await fetch(`${req.nextUrl.origin}/api/billing/webhook-upgrade-plan`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                clerkUserId: userId,
                newPlanKey: 'free_user',
                subscriptionId: null
              })
            });
            
            if (response.ok) {
              console.log(`✅ [CLERK COMMERCE] Successfully downgraded to free plan`);
            } else {
              console.error(`❌ [CLERK COMMERCE] Failed to downgrade:`, await response.text());
            }
          }
        } catch (error) {
          console.error('Error handling subscription cancellation:', error);
        }
        
        break;
      }

      default: {
        console.log(`⚠️ [CLERK WEBHOOK] Unhandled event type: ${eventType}`);
        break;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully',
      eventType 
    });
    
  } catch (error) {
    console.error('❌ [CLERK WEBHOOK] Error processing webhook:', error);
    return NextResponse.json({ 
      error: 'Webhook processing failed', 
      eventType 
    }, { status: 500 });
  }
}