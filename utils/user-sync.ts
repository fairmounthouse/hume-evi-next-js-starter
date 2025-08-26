import { User } from '@clerk/nextjs/server';
import { createSupabaseClient } from './supabase-client';

export interface ClerkUserData {
  clerkId: string;
  email: string;
}

/**
 * Extract minimal user data from Clerk User object
 * Clerk is now the single source of truth for user data
 */
export function extractClerkUserData(user: User): ClerkUserData {
  return {
    clerkId: user.id,
    email: user.emailAddresses?.[0]?.emailAddress || '',
  };
}

/**
 * Extract user data from client-side useUser hook
 */
export function extractClientUserData(user: any): Partial<ClerkUserData> {
  if (!user) return {};

  return {
    clerkId: user.id,
    email: user.emailAddresses?.[0]?.emailAddress || user.primaryEmailAddress?.emailAddress || '',
  };
}

/**
 * Sync minimal user data to Supabase (just linking info)
 */
export async function syncUserToSupabase(userData: ClerkUserData): Promise<string> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase.rpc('ensure_user_exists', {
    p_clerk_id: userData.clerkId,
    p_email: userData.email,
  });

  if (error) {
    console.error('Error syncing user to Supabase:', error);
    throw error;
  }

  return data;
}

/**
 * Sync user from client-side (minimal data)
 */
export async function syncClientUserToSupabase(user: any): Promise<void> {
  if (!user) return;

  const userData = extractClientUserData(user);
  
  // Only sync if we have essential data
  if (!userData.clerkId || !userData.email) {
    console.warn('Insufficient user data for sync');
    return;
  }

  try {
    await syncUserToSupabase(userData as ClerkUserData);
  } catch (error) {
    console.error('Error syncing client user:', error);
  }
}

/**
 * Server-side user sync with full Clerk User object
 */
export async function syncServerUserToSupabase(user: User): Promise<string> {
  const userData = extractClerkUserData(user);
  return await syncUserToSupabase(userData);
}

// =====================================================
// UTILITY FUNCTIONS - Now use Clerk directly via hooks
// =====================================================

/**
 * Utility to get display name - use Clerk user object directly
 * @deprecated Use user.fullName, user.firstName, etc. from Clerk directly
 */
export function getDisplayName(userData: Partial<ClerkUserData>): string {
  // Fallback for legacy code - prefer using Clerk user object directly
  if (userData.email) return userData.email.split('@')[0];
  return 'User';
}

/**
 * @deprecated Use user.imageUrl from Clerk directly
 */
export function getUserAvatarUrl(userData: Partial<ClerkUserData>): string | null {
  return null; // Use Clerk user.imageUrl directly instead
}

/**
 * @deprecated Use user.twoFactorEnabled, etc. from Clerk directly
 */
export function hasEnhancedSecurity(userData: Partial<ClerkUserData>): boolean {
  return false; // Use Clerk user object directly instead
}

/**
 * @deprecated Use Clerk user object directly
 */
export function getPrimaryContactInfo(userData: Partial<ClerkUserData>) {
  return {
    email: userData.email,
    hasPhone: false, // Use Clerk user object directly
    hasImage: false, // Use Clerk user object directly
    securityEnabled: false, // Use Clerk user object directly
  };
}