-- Migration Script: Update Database Schema to Match Clerk Billing Plans
-- This script updates the plans and plan_limits tables to match Clerk billing setup
-- Run this in your Supabase SQL editor

-- Step 1: Remove the stripe_price_id column since we're using Clerk billing
ALTER TABLE public.plans DROP COLUMN IF EXISTS stripe_price_id;

-- Step 2: Add plan_key column to match Clerk plan identifiers
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS plan_key TEXT UNIQUE;

-- Step 3: Clear existing data to start fresh
DELETE FROM public.plan_limits;
DELETE FROM public.plans;

-- Step 4: Insert new plans matching Clerk billing structure
INSERT INTO public.plans (id, name, plan_key, price_cents, created_at) VALUES 
(gen_random_uuid(), 'Free', 'free_user', 0, NOW()),
(gen_random_uuid(), 'Starter', 'starter', 3000, NOW()),        -- $30.00
(gen_random_uuid(), 'Professional', 'professional', 5000, NOW()), -- $50.00
(gen_random_uuid(), 'Premium', 'premium', 9900, NOW());        -- $99.00

-- Step 5: Insert plan limits for each plan
-- FREE PLAN LIMITS (Testing: 2 minutes, 1 daily interview)
INSERT INTO public.plan_limits (plan_id, limit_type, limit_value, created_at)
SELECT 
    p.id,
    unnest(ARRAY['minutes_per_month', 'interviews_per_day', 'detailed_analysis_per_month', 'video_review_per_month', 'advanced_analytics']) as limit_type,
    unnest(ARRAY[2, 1, 0, 0, 0]) as limit_value,
    NOW()
FROM public.plans p WHERE p.plan_key = 'free_user';

-- STARTER PLAN LIMITS
INSERT INTO public.plan_limits (plan_id, limit_type, limit_value, created_at)
SELECT 
    p.id,
    unnest(ARRAY['minutes_per_month', 'interviews_per_day', 'detailed_analysis_per_month', 'video_review_per_month', 'advanced_analytics']) as limit_type,
    unnest(ARRAY[120, 3, 5, 0, 0]) as limit_value,  -- 2 hours, 3 daily, 5 analyses, no video/analytics
    NOW()
FROM public.plans p WHERE p.plan_key = 'starter';

-- PROFESSIONAL PLAN LIMITS  
INSERT INTO public.plan_limits (plan_id, limit_type, limit_value, created_at)
SELECT 
    p.id,
    unnest(ARRAY['minutes_per_month', 'interviews_per_day', 'detailed_analysis_per_month', 'video_review_per_month', 'advanced_analytics']) as limit_type,
    unnest(ARRAY[300, 5, 15, 10, 0]) as limit_value,  -- 5 hours, 5 daily, 15 analyses, 10 video reviews, no analytics
    NOW()
FROM public.plans p WHERE p.plan_key = 'professional';

-- PREMIUM PLAN LIMITS (Unlimited = 999999)
INSERT INTO public.plan_limits (plan_id, limit_type, limit_value, created_at)
SELECT 
    p.id,
    unnest(ARRAY['minutes_per_month', 'interviews_per_day', 'detailed_analysis_per_month', 'video_review_per_month', 'advanced_analytics']) as limit_type,
    unnest(ARRAY[999999, 999999, 999999, 999999, 1]) as limit_value,  -- Unlimited everything + analytics
    NOW()
FROM public.plans p WHERE p.plan_key = 'premium';

-- Step 6: Update the user_current_limits view to use plan_key
DROP VIEW IF EXISTS public.user_current_limits;
CREATE VIEW public.user_current_limits AS
SELECT 
    u.id as user_id,
    u.clerk_id,
    u.email,
    p.name as plan_name,
    p.plan_key,
    p.price_cents,
    us.status as subscription_status,
    us.current_period_start,
    us.current_period_end,
    pl.limit_type,
    pl.limit_value
FROM public.users u
LEFT JOIN public.user_subscriptions us ON u.id = us.user_id 
    AND us.status = 'active'
    AND us.current_period_start <= NOW() 
    AND us.current_period_end > NOW()
LEFT JOIN public.plans p ON us.plan_id = p.id
LEFT JOIN public.plan_limits pl ON p.id = pl.plan_id
WHERE u.id IS NOT NULL;

-- Step 7: Update helper functions to work with plan_key

-- Update ensure_user_exists function to create default subscription with Free plan
CREATE OR REPLACE FUNCTION public.ensure_user_exists(
    p_clerk_id TEXT,
    p_email TEXT,
    p_first_name TEXT DEFAULT NULL,
    p_last_name TEXT DEFAULT NULL,
    p_full_name TEXT DEFAULT NULL,
    p_username TEXT DEFAULT NULL,
    p_image_url TEXT DEFAULT NULL,
    p_has_image BOOLEAN DEFAULT FALSE,
    p_primary_email_address_id TEXT DEFAULT NULL,
    p_primary_phone_number_id TEXT DEFAULT NULL,
    p_two_factor_enabled BOOLEAN DEFAULT FALSE,
    p_backup_code_enabled BOOLEAN DEFAULT FALSE,
    p_totp_enabled BOOLEAN DEFAULT FALSE,
    p_external_id TEXT DEFAULT NULL,
    p_last_sign_in_at TEXT DEFAULT NULL,
    p_banned BOOLEAN DEFAULT FALSE,
    p_locked BOOLEAN DEFAULT FALSE,
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
    user_uuid UUID;
    free_plan_id UUID;
BEGIN
    -- Insert or update user
    INSERT INTO public.users (
        clerk_id, email, first_name, last_name, full_name, username, 
        image_url, has_image, primary_email_address_id, primary_phone_number_id,
        two_factor_enabled, backup_code_enabled, totp_enabled, external_id,
        last_sign_in_at, banned, locked, lockout_expires_in_seconds,
        verification_attempts_remaining, profile_image_url, gender, birthday,
        public_metadata, private_metadata, unsafe_metadata, updated_at
    ) VALUES (
        p_clerk_id, p_email, p_first_name, p_last_name, p_full_name, p_username,
        p_image_url, p_has_image, p_primary_email_address_id, p_primary_phone_number_id,
        p_two_factor_enabled, p_backup_code_enabled, p_totp_enabled, p_external_id,
        CASE WHEN p_last_sign_in_at IS NOT NULL THEN p_last_sign_in_at::TIMESTAMP ELSE NULL END,
        p_banned, p_locked, p_lockout_expires_in_seconds, p_verification_attempts_remaining,
        p_profile_image_url, p_gender, p_birthday, p_public_metadata, p_private_metadata,
        p_unsafe_metadata, NOW()
    )
    ON CONFLICT (clerk_id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        full_name = EXCLUDED.full_name,
        username = EXCLUDED.username,
        image_url = EXCLUDED.image_url,
        has_image = EXCLUDED.has_image,
        primary_email_address_id = EXCLUDED.primary_email_address_id,
        primary_phone_number_id = EXCLUDED.primary_phone_number_id,
        two_factor_enabled = EXCLUDED.two_factor_enabled,
        backup_code_enabled = EXCLUDED.backup_code_enabled,
        totp_enabled = EXCLUDED.totp_enabled,
        external_id = EXCLUDED.external_id,
        last_sign_in_at = EXCLUDED.last_sign_in_at,
        banned = EXCLUDED.banned,
        locked = EXCLUDED.locked,
        lockout_expires_in_seconds = EXCLUDED.lockout_expires_in_seconds,
        verification_attempts_remaining = EXCLUDED.verification_attempts_remaining,
        profile_image_url = EXCLUDED.profile_image_url,
        gender = EXCLUDED.gender,
        birthday = EXCLUDED.birthday,
        public_metadata = EXCLUDED.public_metadata,
        private_metadata = EXCLUDED.private_metadata,
        unsafe_metadata = EXCLUDED.unsafe_metadata,
        updated_at = NOW()
    RETURNING id INTO user_uuid;

    -- Get Free plan ID
    SELECT id INTO free_plan_id FROM public.plans WHERE plan_key = 'free_user' LIMIT 1;
    
    -- Create default subscription if none exists
    IF NOT EXISTS (SELECT 1 FROM public.user_subscriptions WHERE user_id = user_uuid AND status = 'active') THEN
        INSERT INTO public.user_subscriptions (user_id, plan_id, status, current_period_start, current_period_end)
        VALUES (
            user_uuid, 
            free_plan_id, 
            'active', 
            NOW(), 
            NOW() + INTERVAL '1 month'
        );
    END IF;

    RETURN user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Update can_use_feature function to work with plan_key
CREATE OR REPLACE FUNCTION public.can_use_feature(
    p_user_id UUID,
    p_feature_type TEXT,
    p_amount INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
    current_limit INTEGER;
    current_usage INTEGER;
    period_start TIMESTAMP;
    period_end TIMESTAMP;
BEGIN
    -- Get current limit and period for the user
    SELECT 
        pl.limit_value,
        us.current_period_start,
        us.current_period_end
    INTO current_limit, period_start, period_end
    FROM public.users u
    JOIN public.user_subscriptions us ON u.id = us.user_id 
        AND us.status = 'active'
        AND us.current_period_start <= NOW() 
        AND us.current_period_end > NOW()
    JOIN public.plans p ON us.plan_id = p.id
    JOIN public.plan_limits pl ON p.id = pl.plan_id
    WHERE u.id = p_user_id 
        AND pl.limit_type = p_feature_type
    LIMIT 1;

    -- If no limit found, deny access
    IF current_limit IS NULL THEN
        RETURN FALSE;
    END IF;

    -- If unlimited (999999), allow
    IF current_limit >= 999999 THEN
        RETURN TRUE;
    END IF;

    -- Get current usage in the period
    SELECT COALESCE(SUM(usage_value), 0)
    INTO current_usage
    FROM public.user_usage
    WHERE user_id = p_user_id
        AND usage_type = p_feature_type
        AND period_start <= NOW()
        AND period_end > NOW();

    -- Check if usage + requested amount would exceed limit
    RETURN (current_usage + p_amount) <= current_limit;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create index on plan_key for performance
CREATE INDEX IF NOT EXISTS idx_plans_plan_key ON public.plans(plan_key);

-- Step 10: Display final results
SELECT 'Migration completed successfully!' as status;

-- Show updated plans
SELECT 
    name,
    plan_key,
    price_cents,
    price_cents::DECIMAL / 100 as price_dollars
FROM public.plans 
ORDER BY price_cents;

-- Show plan limits
SELECT 
    p.name,
    p.plan_key,
    pl.limit_type,
    pl.limit_value,
    CASE 
        WHEN pl.limit_value >= 999999 THEN 'Unlimited'
        ELSE pl.limit_value::TEXT
    END as display_value
FROM public.plans p
JOIN public.plan_limits pl ON p.id = pl.plan_id
ORDER BY p.price_cents, pl.limit_type;
