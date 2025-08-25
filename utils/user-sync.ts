import { User } from '@clerk/nextjs/server';
import { createSupabaseClient } from './supabase-client';

export interface ClerkUserData {
  clerkId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  username?: string;
  imageUrl?: string;
  hasImage?: boolean;
  primaryEmailAddressId?: string;
  primaryPhoneNumberId?: string;
  twoFactorEnabled?: boolean;
  backupCodeEnabled?: boolean;
  totpEnabled?: boolean;
  externalId?: string;
  lastSignInAt?: Date;
  banned?: boolean;
  locked?: boolean;
  lockoutExpiresInSeconds?: number;
  verificationAttemptsRemaining?: number;

  publicMetadata?: Record<string, any>;
  privateMetadata?: Record<string, any>;
  unsafeMetadata?: Record<string, any>;
}

/**
 * Extract comprehensive user data from Clerk User object
 */
export function extractClerkUserData(user: User): ClerkUserData {
  return {
    clerkId: user.id,
    email: user.emailAddresses?.[0]?.emailAddress || '',
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
    fullName: user.fullName || undefined,
    username: user.username || undefined,
    imageUrl: user.imageUrl || undefined,
    hasImage: user.hasImage || false,
    primaryEmailAddressId: user.primaryEmailAddressId || undefined,
    primaryPhoneNumberId: user.primaryPhoneNumberId || undefined,
    twoFactorEnabled: user.twoFactorEnabled || false,
    backupCodeEnabled: user.backupCodeEnabled || false,
    totpEnabled: user.totpEnabled || false,
    externalId: user.externalId || undefined,
    lastSignInAt: user.lastSignInAt ? new Date(user.lastSignInAt) : undefined,
    banned: user.banned || false,
    locked: user.locked || false,



    publicMetadata: user.publicMetadata || {},
    privateMetadata: user.privateMetadata || {},
    unsafeMetadata: user.unsafeMetadata || {},
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
    firstName: user.firstName || undefined,
    lastName: user.lastName || undefined,
    fullName: user.fullName || undefined,
    username: user.username || undefined,
    imageUrl: user.imageUrl || undefined,
    hasImage: user.hasImage || false,
    primaryEmailAddressId: user.primaryEmailAddressId || undefined,
    primaryPhoneNumberId: user.primaryPhoneNumberId || undefined,
    twoFactorEnabled: user.twoFactorEnabled || false,
    backupCodeEnabled: user.backupCodeEnabled || false,
    totpEnabled: user.totpEnabled || false,
    externalId: user.externalId || undefined,
    lastSignInAt: user.lastSignInAt ? new Date(user.lastSignInAt) : undefined,
    banned: user.banned || false,
    locked: user.locked || false,



    publicMetadata: user.publicMetadata || {},
    privateMetadata: user.privateMetadata || {},
    unsafeMetadata: user.unsafeMetadata || {},
  };
}

/**
 * Sync comprehensive user data to Supabase
 */
export async function syncUserToSupabase(userData: ClerkUserData): Promise<string> {
  const supabase = createSupabaseClient();

  const { data, error } = await supabase.rpc('ensure_user_exists', {
    p_clerk_id: userData.clerkId,
    p_email: userData.email,
    p_first_name: userData.firstName,
    p_last_name: userData.lastName,
    p_full_name: userData.fullName,
    p_username: userData.username,
    p_image_url: userData.imageUrl,
    p_has_image: userData.hasImage,
    p_primary_email_address_id: userData.primaryEmailAddressId,
    p_primary_phone_number_id: userData.primaryPhoneNumberId,
    p_two_factor_enabled: userData.twoFactorEnabled,
    p_backup_code_enabled: userData.backupCodeEnabled,
    p_totp_enabled: userData.totpEnabled,
    p_external_id: userData.externalId,
    p_last_sign_in_at: userData.lastSignInAt?.toISOString(),
    p_banned: userData.banned,
    p_locked: userData.locked,
    p_lockout_expires_in_seconds: userData.lockoutExpiresInSeconds,
    p_verification_attempts_remaining: userData.verificationAttemptsRemaining,

    p_public_metadata: userData.publicMetadata,
    p_private_metadata: userData.privateMetadata,
    p_unsafe_metadata: userData.unsafeMetadata,
  });

  if (error) {
    console.error('Error syncing user to Supabase:', error);
    throw error;
  }

  return data;
}

/**
 * Get comprehensive user profile from Supabase
 */
export async function getUserProfile(clerkId: string) {
  const supabase = createSupabaseClient();

  // Use the existing get_user_subscription_info function which now returns comprehensive data
  const { data, error } = await supabase.rpc('get_user_subscription_info', {
    p_clerk_id: clerkId,
  });

  if (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }

  return data || null;
}

/**
 * Sync user from client-side (partial data)
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

/**
 * Utility to get display name from user data
 */
export function getDisplayName(userData: Partial<ClerkUserData>): string {
  if (userData.fullName) return userData.fullName;
  if (userData.firstName && userData.lastName) {
    return `${userData.firstName} ${userData.lastName}`;
  }
  if (userData.firstName) return userData.firstName;
  if (userData.username) return userData.username;
  if (userData.email) return userData.email.split('@')[0];
  return 'User';
}

/**
 * Utility to get user avatar URL
 */
export function getUserAvatarUrl(userData: Partial<ClerkUserData>): string | null {
  return userData.imageUrl || null;
}

/**
 * Check if user has enhanced security features
 */
export function hasEnhancedSecurity(userData: Partial<ClerkUserData>): boolean {
  return !!(userData.twoFactorEnabled || userData.totpEnabled || userData.backupCodeEnabled);
}

/**
 * Get user's primary contact info
 */
export function getPrimaryContactInfo(userData: Partial<ClerkUserData>) {
  return {
    email: userData.email,
    hasPhone: !!userData.primaryPhoneNumberId,
    hasImage: userData.hasImage,
    securityEnabled: hasEnhancedSecurity(userData),
  };
}
