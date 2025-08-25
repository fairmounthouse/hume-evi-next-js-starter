-- Fix ensure_user_exists function ambiguity
-- This script removes the old simple version and keeps only the comprehensive version

-- Drop the simple version of ensure_user_exists (2 parameters)
DROP FUNCTION IF EXISTS public.ensure_user_exists(p_clerk_id text, p_email text);

-- Keep only the comprehensive version with all parameters
-- The comprehensive version should handle both cases:
-- 1. When all parameters are provided (full sync)
-- 2. When only basic parameters are provided (nulls for others)

-- Update the comprehensive function to handle null values gracefully
CREATE OR REPLACE FUNCTION public.ensure_user_exists(
  p_clerk_id text,
  p_email text,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_full_name text DEFAULT NULL,
  p_username text DEFAULT NULL,
  p_image_url text DEFAULT NULL,
  p_has_image boolean DEFAULT false,
  p_primary_email_address_id text DEFAULT NULL,
  p_primary_phone_number_id text DEFAULT NULL,
  p_two_factor_enabled boolean DEFAULT false,
  p_backup_code_enabled boolean DEFAULT false,
  p_totp_enabled boolean DEFAULT false,
  p_external_id text DEFAULT NULL,
  p_last_sign_in_at text DEFAULT NULL,
  p_banned boolean DEFAULT false,
  p_locked boolean DEFAULT false,
  p_lockout_expires_in_seconds integer DEFAULT NULL,
  p_verification_attempts_remaining integer DEFAULT NULL,
  p_profile_image_url text DEFAULT NULL,
  p_gender text DEFAULT NULL,
  p_birthday text DEFAULT NULL,
  p_public_metadata jsonb DEFAULT NULL,
  p_private_metadata jsonb DEFAULT NULL,
  p_unsafe_metadata jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_uuid uuid;
  last_sign_in_timestamp timestamptz;
BEGIN
  -- Convert string timestamp to timestamptz if provided
  IF p_last_sign_in_at IS NOT NULL THEN
    BEGIN
      last_sign_in_timestamp := p_last_sign_in_at::timestamptz;
    EXCEPTION WHEN OTHERS THEN
      last_sign_in_timestamp := NULL;
    END;
  END IF;

  -- Insert or update user with comprehensive data
  INSERT INTO users (
    clerk_id,
    email,
    first_name,
    last_name,
    full_name,
    username,
    image_url,
    has_image,
    primary_email_address_id,
    primary_phone_number_id,
    two_factor_enabled,
    backup_code_enabled,
    totp_enabled,
    external_id,
    last_sign_in_at,
    banned,
    locked,
    lockout_expires_in_seconds,
    verification_attempts_remaining,
    profile_image_url,
    gender,
    birthday,
    public_metadata,
    private_metadata,
    unsafe_metadata,
    created_at,
    updated_at
  )
  VALUES (
    p_clerk_id,
    p_email,
    p_first_name,
    p_last_name,
    p_full_name,
    p_username,
    p_image_url,
    COALESCE(p_has_image, false),
    p_primary_email_address_id,
    p_primary_phone_number_id,
    COALESCE(p_two_factor_enabled, false),
    COALESCE(p_backup_code_enabled, false),
    COALESCE(p_totp_enabled, false),
    p_external_id,
    last_sign_in_timestamp,
    COALESCE(p_banned, false),
    COALESCE(p_locked, false),
    p_lockout_expires_in_seconds,
    p_verification_attempts_remaining,
    p_profile_image_url,
    p_gender,
    p_birthday,
    p_public_metadata,
    p_private_metadata,
    p_unsafe_metadata,
    NOW(),
    NOW()
  )
  ON CONFLICT (clerk_id) 
  DO UPDATE SET
    email = EXCLUDED.email,
    first_name = COALESCE(EXCLUDED.first_name, users.first_name),
    last_name = COALESCE(EXCLUDED.last_name, users.last_name),
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    username = COALESCE(EXCLUDED.username, users.username),
    image_url = COALESCE(EXCLUDED.image_url, users.image_url),
    has_image = COALESCE(EXCLUDED.has_image, users.has_image),
    primary_email_address_id = COALESCE(EXCLUDED.primary_email_address_id, users.primary_email_address_id),
    primary_phone_number_id = COALESCE(EXCLUDED.primary_phone_number_id, users.primary_phone_number_id),
    two_factor_enabled = COALESCE(EXCLUDED.two_factor_enabled, users.two_factor_enabled),
    backup_code_enabled = COALESCE(EXCLUDED.backup_code_enabled, users.backup_code_enabled),
    totp_enabled = COALESCE(EXCLUDED.totp_enabled, users.totp_enabled),
    external_id = COALESCE(EXCLUDED.external_id, users.external_id),
    last_sign_in_at = COALESCE(EXCLUDED.last_sign_in_at, users.last_sign_in_at),
    banned = COALESCE(EXCLUDED.banned, users.banned),
    locked = COALESCE(EXCLUDED.locked, users.locked),
    lockout_expires_in_seconds = COALESCE(EXCLUDED.lockout_expires_in_seconds, users.lockout_expires_in_seconds),
    verification_attempts_remaining = COALESCE(EXCLUDED.verification_attempts_remaining, users.verification_attempts_remaining),
    profile_image_url = COALESCE(EXCLUDED.profile_image_url, users.profile_image_url),
    gender = COALESCE(EXCLUDED.gender, users.gender),
    birthday = COALESCE(EXCLUDED.birthday, users.birthday),
    public_metadata = COALESCE(EXCLUDED.public_metadata, users.public_metadata),
    private_metadata = COALESCE(EXCLUDED.private_metadata, users.private_metadata),
    unsafe_metadata = COALESCE(EXCLUDED.unsafe_metadata, users.unsafe_metadata),
    updated_at = NOW()
  RETURNING id INTO user_uuid;

  -- If no user_uuid was returned (shouldn't happen), get it
  IF user_uuid IS NULL THEN
    SELECT id INTO user_uuid FROM users WHERE clerk_id = p_clerk_id;
  END IF;

  RETURN user_uuid;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.ensure_user_exists TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_user_exists TO anon;

-- Add comment
COMMENT ON FUNCTION public.ensure_user_exists IS 'Ensures a user exists with comprehensive Clerk data, handles both basic and full sync scenarios';
