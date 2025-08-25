-- Update users table to include comprehensive Clerk user data
-- Run this in Supabase SQL Editor

-- Add new columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS username TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS has_image BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS primary_email_address_id TEXT,
ADD COLUMN IF NOT EXISTS primary_phone_number_id TEXT,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS backup_code_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS external_id TEXT,
ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS locked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lockout_expires_in_seconds INTEGER,
ADD COLUMN IF NOT EXISTS verification_attempts_remaining INTEGER,
ADD COLUMN IF NOT EXISTS profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS birthday TEXT,
ADD COLUMN IF NOT EXISTS public_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS private_metadata JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS unsafe_metadata JSONB DEFAULT '{}';

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(full_name);
CREATE INDEX IF NOT EXISTS idx_users_first_name ON users(first_name);
CREATE INDEX IF NOT EXISTS idx_users_last_name ON users(last_name);
CREATE INDEX IF NOT EXISTS idx_users_external_id ON users(external_id);
CREATE INDEX IF NOT EXISTS idx_users_last_sign_in_at ON users(last_sign_in_at);

-- Update the ensure_user_exists function to handle comprehensive user data
CREATE OR REPLACE FUNCTION ensure_user_exists(
  p_clerk_id TEXT,
  p_email TEXT,
  p_first_name TEXT DEFAULT NULL,
  p_last_name TEXT DEFAULT NULL,
  p_full_name TEXT DEFAULT NULL,
  p_username TEXT DEFAULT NULL,
  p_image_url TEXT DEFAULT NULL,
  p_has_image BOOLEAN DEFAULT false,
  p_primary_email_address_id TEXT DEFAULT NULL,
  p_primary_phone_number_id TEXT DEFAULT NULL,
  p_two_factor_enabled BOOLEAN DEFAULT false,
  p_backup_code_enabled BOOLEAN DEFAULT false,
  p_totp_enabled BOOLEAN DEFAULT false,
  p_external_id TEXT DEFAULT NULL,
  p_last_sign_in_at TIMESTAMP DEFAULT NULL,
  p_banned BOOLEAN DEFAULT false,
  p_locked BOOLEAN DEFAULT false,
  p_lockout_expires_in_seconds INTEGER DEFAULT NULL,
  p_verification_attempts_remaining INTEGER DEFAULT NULL,
  p_profile_image_url TEXT DEFAULT NULL,
  p_gender TEXT DEFAULT NULL,
  p_birthday TEXT DEFAULT NULL,
  p_public_metadata JSONB DEFAULT '{}',
  p_private_metadata JSONB DEFAULT '{}',
  p_unsafe_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Try to find existing user
  SELECT id INTO v_user_id 
  FROM users 
  WHERE clerk_id = p_clerk_id;
  
  IF v_user_id IS NULL THEN
    -- Create new user with comprehensive data
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
    ) VALUES (
      p_clerk_id, 
      p_email, 
      p_first_name,
      p_last_name,
      p_full_name,
      p_username,
      p_image_url,
      p_has_image,
      p_primary_email_address_id,
      p_primary_phone_number_id,
      p_two_factor_enabled,
      p_backup_code_enabled,
      p_totp_enabled,
      p_external_id,
      p_last_sign_in_at,
      p_banned,
      p_locked,
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
    ) RETURNING id INTO v_user_id;
    
    -- Create default subscription for new user
    PERFORM create_default_subscription(p_clerk_id);
  ELSE
    -- Update existing user with latest data
    UPDATE users SET
      email = p_email,
      first_name = COALESCE(p_first_name, first_name),
      last_name = COALESCE(p_last_name, last_name),
      full_name = COALESCE(p_full_name, full_name),
      username = COALESCE(p_username, username),
      image_url = COALESCE(p_image_url, image_url),
      has_image = COALESCE(p_has_image, has_image),
      primary_email_address_id = COALESCE(p_primary_email_address_id, primary_email_address_id),
      primary_phone_number_id = COALESCE(p_primary_phone_number_id, primary_phone_number_id),
      two_factor_enabled = COALESCE(p_two_factor_enabled, two_factor_enabled),
      backup_code_enabled = COALESCE(p_backup_code_enabled, backup_code_enabled),
      totp_enabled = COALESCE(p_totp_enabled, totp_enabled),
      external_id = COALESCE(p_external_id, external_id),
      last_sign_in_at = COALESCE(p_last_sign_in_at, last_sign_in_at),
      banned = COALESCE(p_banned, banned),
      locked = COALESCE(p_locked, locked),
      lockout_expires_in_seconds = COALESCE(p_lockout_expires_in_seconds, lockout_expires_in_seconds),
      verification_attempts_remaining = COALESCE(p_verification_attempts_remaining, verification_attempts_remaining),
      profile_image_url = COALESCE(p_profile_image_url, profile_image_url),
      gender = COALESCE(p_gender, gender),
      birthday = COALESCE(p_birthday, birthday),
      public_metadata = COALESCE(p_public_metadata, public_metadata),
      private_metadata = COALESCE(p_private_metadata, private_metadata),
      unsafe_metadata = COALESCE(p_unsafe_metadata, unsafe_metadata),
      updated_at = NOW()
    WHERE id = v_user_id;
  END IF;
  
  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Create a function to get comprehensive user info
CREATE OR REPLACE FUNCTION get_user_profile(p_clerk_id TEXT)
RETURNS TABLE (
  user_id UUID,
  clerk_id TEXT,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  username TEXT,
  image_url TEXT,
  has_image BOOLEAN,
  primary_email_address_id TEXT,
  primary_phone_number_id TEXT,
  two_factor_enabled BOOLEAN,
  backup_code_enabled BOOLEAN,
  totp_enabled BOOLEAN,
  external_id TEXT,
  last_sign_in_at TIMESTAMP,
  banned BOOLEAN,
  locked BOOLEAN,
  lockout_expires_in_seconds INTEGER,
  verification_attempts_remaining INTEGER,
  profile_image_url TEXT,
  gender TEXT,
  birthday TEXT,
  public_metadata JSONB,
  private_metadata JSONB,
  unsafe_metadata JSONB,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  plan_name TEXT,
  plan_price DECIMAL,
  subscription_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.clerk_id,
    u.email,
    u.first_name,
    u.last_name,
    u.full_name,
    u.username,
    u.image_url,
    u.has_image,
    u.primary_email_address_id,
    u.primary_phone_number_id,
    u.two_factor_enabled,
    u.backup_code_enabled,
    u.totp_enabled,
    u.external_id,
    u.last_sign_in_at,
    u.banned,
    u.locked,
    u.lockout_expires_in_seconds,
    u.verification_attempts_remaining,
    u.profile_image_url,
    u.gender,
    u.birthday,
    u.public_metadata,
    u.private_metadata,
    u.unsafe_metadata,
    u.created_at,
    u.updated_at,
    p.name as plan_name,
    p.price_monthly as plan_price,
    us.status as subscription_status
  FROM users u
  LEFT JOIN user_subscriptions us ON u.id = us.user_id AND us.status = 'active'
  LEFT JOIN plans p ON us.plan_id = p.id
  WHERE u.clerk_id = p_clerk_id;
END;
$$ LANGUAGE plpgsql;
