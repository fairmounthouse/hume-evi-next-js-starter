import { auth } from '@clerk/nextjs/server';
import { checkUsageLimit, trackUsage, UsageCheck } from './billing-client';

/**
 * Server-side function to check billing access
 */
export async function checkBillingAccess(
  usageType: string, 
  amount: number = 1
): Promise<UsageCheck> {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('User not authenticated');
  }

  return checkUsageLimit(userId, usageType, amount);
}

/**
 * Server-side function to track billing usage
 */
export async function trackBillingUsage(
  usageType: string, 
  amount: number
): Promise<void> {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('User not authenticated');
  }

  return trackUsage(userId, usageType, amount);
}
