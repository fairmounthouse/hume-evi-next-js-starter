-- Master RPC Functions Documentation
-- This file contains all RPC function definitions for the project
-- Always refer to this file for RPC function signatures and documentation

-- =====================================================
-- USER MANAGEMENT FUNCTIONS  
-- =====================================================

-- Function: ensure_user_exists
-- Purpose: Create or find user in the system, handling Clerk ID changes
-- Created: Core system function
-- Parameters:
--   - p_clerk_id: User's Clerk ID
--   - p_email: User's email address
-- Returns: UUID of the user (as TEXT)
-- Usage: SELECT ensure_user_exists('clerk_123', 'user@example.com');
CREATE OR REPLACE FUNCTION public.ensure_user_exists(
    p_clerk_id TEXT,
    p_email TEXT
) RETURNS TEXT AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Try to find existing user by clerk_id
  SELECT id INTO user_uuid 
  FROM public.users 
  WHERE clerk_id = p_clerk_id;
  
  -- If user doesn't exist, create them
  IF user_uuid IS NULL THEN
    -- Check if email already exists with different clerk_id
    IF EXISTS (SELECT 1 FROM public.users WHERE email = p_email) THEN
      -- Update existing user with new clerk_id
      UPDATE public.users 
      SET clerk_id = p_clerk_id, updated_at = NOW()
      WHERE email = p_email
      RETURNING id INTO user_uuid;
      
      RAISE NOTICE 'Updated existing user email % with new clerk_id: %', p_email, p_clerk_id;
    ELSE
      -- Create completely new user
      INSERT INTO public.users (clerk_id, email, created_at, updated_at)
      VALUES (p_clerk_id, p_email, NOW(), NOW())
      RETURNING id INTO user_uuid;
      
      RAISE NOTICE 'Created new user with clerk_id: %', p_clerk_id;
    END IF;
  ELSE
    -- User exists, update email if provided and different
    IF p_email IS NOT NULL THEN
      UPDATE public.users 
      SET email = p_email, updated_at = NOW()
      WHERE id = user_uuid AND (email IS NULL OR email != p_email);
    END IF;
    
    RAISE NOTICE 'Found existing user with clerk_id: %', p_clerk_id;
  END IF;
  
  RETURN user_uuid::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- USAGE TRACKING FUNCTIONS
-- =====================================================

-- Function: get_user_usage_summary_with_plan
-- Purpose: Get user's usage summary with plan-based limits
-- Created: 2025-01-30 (to fix dashboard usage data issue)
-- Updated: 2025-01-30 (fixed to use actual plan data from database)
-- Parameters:
--   - p_clerk_id: User's Clerk ID
--   - p_plan_key: Plan key (free, starter, professional, premium)
-- Returns: Table with usage_type, current_usage, limit_value, percentage_used, period_start, period_end
-- Usage: SELECT * FROM get_user_usage_summary_with_plan('user_123', 'free');
-- Note: Now queries plans table for actual limits instead of hardcoding
CREATE OR REPLACE FUNCTION public.get_user_usage_summary_with_plan(
    p_clerk_id TEXT,
    p_plan_key TEXT DEFAULT 'free'
) RETURNS TABLE(
    usage_type TEXT,
    current_usage INTEGER,
    limit_value INTEGER,
    percentage_used NUMERIC,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    target_user_uuid UUID;
    plan_minutes INTEGER := 2; -- Default free plan minutes from DB
    current_month_start TIMESTAMP WITH TIME ZONE;
    current_month_end TIMESTAMP WITH TIME ZONE;
    total_minutes INTEGER := 0;
BEGIN
    -- Get user UUID
    SELECT id INTO target_user_uuid FROM public.users WHERE clerk_id = p_clerk_id;
    
    -- If user doesn't exist, return empty result
    IF target_user_uuid IS NULL THEN
        RETURN;
    END IF;

    -- Get plan limits from database (not hardcoded anymore!)
    SELECT minutes_per_month INTO plan_minutes
    FROM public.plans
    WHERE plan_key = p_plan_key AND active = TRUE;
    
    -- If plan not found, get free plan as default
    IF plan_minutes IS NULL THEN
        SELECT minutes_per_month INTO plan_minutes
        FROM public.plans
        WHERE plan_key = 'free' AND active = TRUE;
        
        -- Ultimate fallback if even free plan not found
        IF plan_minutes IS NULL THEN
            plan_minutes := 2; -- Minimal default
        END IF;
    END IF;

    -- Calculate current month period
    current_month_start := DATE_TRUNC('month', NOW());
    current_month_end := current_month_start + INTERVAL '1 month';

    -- Calculate total minutes used this month
    SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (COALESCE(ended_at, NOW()) - started_at)) / 60), 0)::INTEGER
    INTO total_minutes
    FROM public.interview_sessions
    WHERE user_uuid = target_user_uuid
        AND started_at >= current_month_start
        AND started_at < current_month_end
        AND status IN ('completed', 'in_progress');

    -- Return usage data for minutes_per_month
    RETURN QUERY SELECT
        'minutes_per_month'::TEXT as usage_type,
        total_minutes as current_usage,
        CASE WHEN plan_minutes = -1 THEN 999999 ELSE plan_minutes END as limit_value,
        CASE 
            WHEN plan_minutes = -1 THEN 0::NUMERIC -- Unlimited shows 0%
            WHEN plan_minutes > 0 THEN ROUND((total_minutes::NUMERIC / plan_minutes::NUMERIC) * 100, 1)
            ELSE 0::NUMERIC 
        END as percentage_used,
        current_month_start as period_start,
        current_month_end as period_end;

END;
$$ LANGUAGE plpgsql;

-- Function: track_interview_session
-- Purpose: Track both minutes and interview count after session
-- Parameters:
--   - p_clerk_id: User's Clerk ID
--   - p_duration_minutes: Duration of the interview in minutes
-- Returns: void
-- Note: Calls track_usage internally for both metrics
CREATE OR REPLACE FUNCTION public.track_interview_session(
    p_clerk_id TEXT,
    p_duration_minutes INTEGER
) RETURNS VOID AS $$
BEGIN
    -- Track both minutes and interview count
    PERFORM public.track_usage(p_clerk_id, 'minutes_per_month', p_duration_minutes);
    PERFORM public.track_usage(p_clerk_id, 'interviews_per_day', 1);
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SESSION & INTERVIEW FUNCTIONS
-- =====================================================

-- Function: get_session_with_profiles
-- Purpose: Get session data with all nested interviewer profiles and prompts
-- Parameters:
--   - session_id_param: Session ID to fetch
-- Returns: Complete session data with all profile details
-- Usage: SELECT * FROM get_session_with_profiles('session_123');
CREATE OR REPLACE FUNCTION public.get_session_with_profiles(
    session_id_param TEXT
) RETURNS TABLE(
    case_id UUID,
    new_interviewer_profile_id UUID,
    alias TEXT,
    name TEXT,
    diff_display_name TEXT,
    diff_prompt_content TEXT,
    sen_display_name TEXT,
    sen_prompt_content TEXT,
    comp_display_name TEXT,
    comp_prompt_content TEXT,
    phases JSONB,
    additional_metadata JSONB,
    exhibits JSONB,
    case_prompt_content TEXT
) AS $$
  SELECT 
    interview_sessions.case_id,
    interview_sessions.new_interviewer_profile_id,
    interviewer_profiles_new.alias,
    interviewer_profiles_new.name,
    difficulty_profiles.display_name as diff_display_name,
    difficulty_prompts.prompt_content as diff_prompt_content,
    seniority_profiles.display_name as sen_display_name, 
    seniority_prompts.prompt_content as sen_prompt_content,
    company_profiles.display_name as comp_display_name,
    company_prompts.prompt_content as comp_prompt_content,
    interview_cases.phases,
    interview_cases.additional_metadata,
    interview_cases.exhibits,
    case_prompts.prompt_content as case_prompt_content
  FROM interview_sessions
  LEFT JOIN interviewer_profiles_new ON interviewer_profiles_new.id = interview_sessions.new_interviewer_profile_id
  LEFT JOIN difficulty_profiles ON difficulty_profiles.id = interviewer_profiles_new.difficulty_profile_id
  LEFT JOIN prompts as difficulty_prompts ON difficulty_prompts.id = difficulty_profiles.prompt_id
  LEFT JOIN seniority_profiles ON seniority_profiles.id = interviewer_profiles_new.seniority_profile_id
  LEFT JOIN prompts as seniority_prompts ON seniority_prompts.id = seniority_profiles.prompt_id
  LEFT JOIN company_profiles ON company_profiles.id = interviewer_profiles_new.company_profile_id
  LEFT JOIN prompts as company_prompts ON company_prompts.id = company_profiles.prompt_id
  LEFT JOIN interview_cases ON interview_cases.id = interview_sessions.case_id
  LEFT JOIN prompts as case_prompts ON case_prompts.id = interview_cases.prompt_id
  WHERE interview_sessions.session_id = session_id_param;
$$ LANGUAGE sql;

-- Function: get_user_session_breakdown
-- Purpose: Get detailed breakdown of user sessions
-- Parameters:
--   - p_clerk_id: User's Clerk ID
--   - p_limit: Maximum number of sessions to return
-- Returns: List of sessions with details
-- Usage: SELECT * FROM get_user_session_breakdown('clerk_123', 10);
CREATE OR REPLACE FUNCTION public.get_user_session_breakdown(
    p_clerk_id TEXT,
    p_limit INTEGER DEFAULT 10
) RETURNS TABLE(
    session_id VARCHAR,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    case_title VARCHAR,
    status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.session_id,
        s.started_at,
        s.ended_at,
        CASE 
            WHEN s.duration_seconds IS NOT NULL THEN ROUND(s.duration_seconds / 60.0)::INTEGER
            WHEN s.started_at IS NOT NULL AND s.ended_at IS NOT NULL THEN 
                ROUND(EXTRACT(EPOCH FROM (s.ended_at - s.started_at)) / 60.0)::INTEGER
            ELSE 0
        END as duration_minutes,
        COALESCE(ic.title, 'Unknown Case') as case_title,
        s.status,
        s.created_at
    FROM public.users u
    JOIN public.interview_sessions s ON u.id = s.user_uuid
    LEFT JOIN public.interview_cases ic ON s.case_id = ic.id
    WHERE u.clerk_id = p_clerk_id
    AND s.status IN ('completed', 'in_progress')
    ORDER BY s.started_at DESC NULLS LAST
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DASHBOARD & STATISTICS FUNCTIONS
-- =====================================================

-- Function: get_user_quick_stats
-- Purpose: Get user's quick statistics for dashboard
-- Parameters:
--   - p_clerk_id: User's Clerk ID
-- Returns: Statistics object with totals and averages
-- Usage: SELECT * FROM get_user_quick_stats('clerk_123');
-- Note: References user_dashboard_stats materialized view which DOES NOT EXIST yet
--       The function falls back to calculating on the fly if view not found
CREATE OR REPLACE FUNCTION public.get_user_quick_stats(
    p_clerk_id TEXT
) RETURNS TABLE(
    total_sessions INTEGER,
    monthly_sessions INTEGER,
    average_score NUMERIC,
    improvement_percentage NUMERIC
) AS $$
BEGIN
  -- Try to get from materialized view first (NOTE: This view doesn't exist yet!)
  RETURN QUERY
  SELECT 
    uds.total_sessions::integer,
    uds.monthly_sessions::integer,
    uds.average_score,
    uds.improvement_percentage
  FROM user_dashboard_stats uds
  WHERE uds.clerk_id = p_clerk_id;
  
  -- If no results from materialized view, calculate on the fly (this always runs currently)
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 
      COUNT(s.session_id)::integer as total_sessions,
      COUNT(CASE WHEN s.created_at >= date_trunc('month', NOW()) THEN 1 END)::integer as monthly_sessions,
      -- ONLY use MBB overall_score from sessions with new interviewer profiles
      ROUND(AVG(s.overall_score), 1) as average_score,
      NULL::numeric as improvement_percentage
    FROM users u
    LEFT JOIN interview_sessions s ON u.id = s.user_uuid 
    WHERE u.clerk_id = p_clerk_id 
      AND s.status = 'completed' 
      AND s.overall_score IS NOT NULL           -- ONLY sessions with MBB data
      AND s.new_interviewer_profile_id IS NOT NULL;  -- ONLY sessions with new interviewer profiles
  END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PLAN & BILLING FUNCTIONS
-- =====================================================

-- Function: get_plan_limits
-- Purpose: Get plan configuration and limits
-- Parameters:
--   - p_plan_key: Plan key (free, starter, professional, premium)
-- Returns: Plan details with limits
-- Usage: SELECT * FROM get_plan_limits('free');
CREATE OR REPLACE FUNCTION public.get_plan_limits(
    p_plan_key TEXT
) RETURNS TABLE(
    plan_key TEXT,
    plan_name TEXT,
    price_dollars INTEGER,
    minutes_per_month INTEGER,
    is_free BOOLEAN,
    is_popular BOOLEAN,
    description TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.plan_key,
        p.plan_name,
        p.price_dollars,
        p.minutes_per_month,
        p.is_free,
        p.is_popular,
        p.description
    FROM plans p
    WHERE p.plan_key = p_plan_key 
    AND p.active = TRUE
    LIMIT 1;
    
    -- If no plan found, return free plan as default
    IF NOT FOUND THEN
        RETURN QUERY
        SELECT 
            p.plan_key,
            p.plan_name,
            p.price_dollars,
            p.minutes_per_month,
            p.is_free,
            p.is_popular,
            p.description
        FROM plans p
        WHERE p.is_free = TRUE 
        AND p.active = TRUE
        LIMIT 1;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: track_usage
-- Purpose: Track usage for a user
-- Created: 2025-01-30 (to support track_interview_session)
-- Parameters:
--   - p_clerk_id: User's Clerk ID
--   - p_usage_type: Type of usage to track (minutes_per_month, interviews_per_day)
--   - p_amount: Amount to track
-- Returns: void
-- Usage: PERFORM track_usage('clerk_123', 'minutes_per_month', 30);
CREATE OR REPLACE FUNCTION public.track_usage(
    p_clerk_id TEXT,
    p_usage_type TEXT,
    p_amount INTEGER
) RETURNS VOID AS $$
DECLARE
    target_user_uuid UUID;
    period_start_date TIMESTAMP WITH TIME ZONE;
    period_end_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get user UUID
    SELECT id INTO target_user_uuid 
    FROM public.users 
    WHERE clerk_id = p_clerk_id;
    
    IF target_user_uuid IS NULL THEN
        RAISE WARNING 'User not found for clerk_id: %', p_clerk_id;
        RETURN;
    END IF;

    -- Determine period based on usage type
    IF p_usage_type = 'interviews_per_day' THEN
        period_start_date := DATE_TRUNC('day', NOW());
        period_end_date := period_start_date + INTERVAL '1 day';
    ELSIF p_usage_type = 'minutes_per_month' THEN
        period_start_date := DATE_TRUNC('month', NOW());
        period_end_date := period_start_date + INTERVAL '1 month';
    ELSE
        -- Default to monthly period for unknown types
        period_start_date := DATE_TRUNC('month', NOW());
        period_end_date := period_start_date + INTERVAL '1 month';
    END IF;

    -- Insert or update usage record
    INSERT INTO public.user_usage (
        user_id, 
        usage_type, 
        usage_value, 
        period_start, 
        period_end,
        created_at,
        updated_at
    ) VALUES (
        target_user_uuid,
        p_usage_type,
        p_amount,
        period_start_date,
        period_end_date,
        NOW(),
        NOW()
    )
    ON CONFLICT (user_id, usage_type, period_start) 
    DO UPDATE SET 
        usage_value = user_usage.usage_value + EXCLUDED.usage_value,
        updated_at = NOW();

END;
$$ LANGUAGE plpgsql;

-- Function: check_usage_limit
-- Purpose: Check if user can use a feature based on usage limits (includes top-up)
-- Created: 2025-01-30 (for usage enforcement)
-- Updated: 2025-01-30 (added top-up support)
-- Parameters:
--   - p_clerk_id: User's Clerk ID
--   - p_usage_type: Type of usage to check
--   - p_amount: Amount to check (default 1) - Note: Now ignored for minutes_per_month
--   - p_plan_key: Optional plan key (added 2025-01-30)
-- Returns: TABLE with allowed, current_usage, limit_value, remaining, is_unlimited, topup_balance, total_available
--   IMPORTANT: Returns a TABLE which becomes an array in JavaScript. Access as data[0]
--   'allowed' is true if user has ANY minutes remaining (monthly OR top-up)
--   'total_available' includes both monthly remaining + top-up balance
-- Usage: SELECT * FROM check_usage_limit('clerk_123', 'minutes_per_month', 1, 'free');
CREATE OR REPLACE FUNCTION public.check_usage_limit(
    p_clerk_id TEXT,
    p_usage_type TEXT,
    p_amount INTEGER DEFAULT 1
) RETURNS TABLE(
    allowed BOOLEAN,
    current_usage INTEGER,
    limit_value INTEGER,
    remaining INTEGER,
    is_unlimited BOOLEAN
) AS $$
DECLARE
    target_user_uuid UUID;
    plan_minutes INTEGER;
    current_usage_val INTEGER := 0;
    period_start_date TIMESTAMP WITH TIME ZONE;
    period_end_date TIMESTAMP WITH TIME ZONE;
    plan_key_val TEXT := 'free';
BEGIN
    -- Get user UUID
    SELECT id INTO target_user_uuid 
    FROM public.users 
    WHERE clerk_id = p_clerk_id;
    
    IF target_user_uuid IS NULL THEN
        -- User doesn't exist, deny access
        RETURN QUERY SELECT 
            FALSE::BOOLEAN as allowed,
            0::INTEGER as current_usage,
            0::INTEGER as limit_value,
            0::INTEGER as remaining,
            FALSE::BOOLEAN as is_unlimited;
        RETURN;
    END IF;

    -- For now, only handle minutes_per_month type
    IF p_usage_type = 'minutes_per_month' THEN
        -- Get current month period
        period_start_date := DATE_TRUNC('month', NOW());
        period_end_date := period_start_date + INTERVAL '1 month';
        
        -- Calculate current usage from interview_sessions
        SELECT COALESCE(SUM(
            CASE 
                WHEN duration_seconds IS NOT NULL THEN CEIL(duration_seconds / 60.0)
                WHEN started_at IS NOT NULL AND ended_at IS NOT NULL THEN 
                    CEIL(EXTRACT(EPOCH FROM (ended_at - started_at)) / 60.0)
                ELSE 0
            END
        ), 0)::INTEGER INTO current_usage_val
        FROM public.interview_sessions
        WHERE user_uuid = target_user_uuid
            AND started_at >= period_start_date
            AND started_at < period_end_date
            AND status IN ('completed', 'in_progress');
        
        -- TODO: Get actual plan from Clerk integration
        -- For now, default to free plan limits
        SELECT minutes_per_month INTO plan_minutes
        FROM public.plans
        WHERE plan_key = plan_key_val AND active = TRUE;
        
        IF plan_minutes IS NULL THEN
            plan_minutes := 2; -- Default free plan
        END IF;
        
        -- Check if unlimited (-1 means unlimited)
        IF plan_minutes = -1 THEN
            RETURN QUERY SELECT 
                TRUE::BOOLEAN as allowed,
                current_usage_val::INTEGER as current_usage,
                999999::INTEGER as limit_value,
                999999::INTEGER as remaining,
                TRUE::BOOLEAN as is_unlimited;
        ELSE
            RETURN QUERY SELECT 
                (current_usage_val + p_amount <= plan_minutes)::BOOLEAN as allowed,
                current_usage_val::INTEGER as current_usage,
                plan_minutes::INTEGER as limit_value,
                GREATEST(0, plan_minutes - current_usage_val)::INTEGER as remaining,
                FALSE::BOOLEAN as is_unlimited;
        END IF;
    ELSE
        -- For other usage types, return unlimited for now
        RETURN QUERY SELECT 
            TRUE::BOOLEAN as allowed,
            0::INTEGER as current_usage,
            999999::INTEGER as limit_value,
            999999::INTEGER as remaining,
            TRUE::BOOLEAN as is_unlimited;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function: get_user_usage_summary  
-- Purpose: Get user's usage summary (without plan-specific limits)
-- Created: 2025-01-30 (simpler version without plan integration)
-- Parameters:
--   - p_clerk_id: User's Clerk ID
--   - p_monthly_minute_limit: Monthly minute limit to use
-- Returns: UsageSummary table
-- Usage: SELECT * FROM get_user_usage_summary('clerk_123', 300);
CREATE OR REPLACE FUNCTION public.get_user_usage_summary(
    p_clerk_id TEXT,
    p_monthly_minute_limit INTEGER DEFAULT 300
) RETURNS TABLE(
    usage_type TEXT,
    current_usage INTEGER,
    limit_value INTEGER,
    percentage_used NUMERIC,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    target_user_uuid UUID;
    current_month_start TIMESTAMP WITH TIME ZONE;
    current_month_end TIMESTAMP WITH TIME ZONE;
    total_minutes INTEGER := 0;
BEGIN
    -- Get user UUID
    SELECT id INTO target_user_uuid 
    FROM public.users 
    WHERE clerk_id = p_clerk_id;
    
    IF target_user_uuid IS NULL THEN
        RETURN;
    END IF;

    -- Calculate current month period
    current_month_start := DATE_TRUNC('month', NOW());
    current_month_end := current_month_start + INTERVAL '1 month';

    -- Calculate total minutes used this month from interview_sessions
    SELECT COALESCE(SUM(
        CASE 
            WHEN duration_seconds IS NOT NULL THEN CEIL(duration_seconds / 60.0)
            WHEN started_at IS NOT NULL AND ended_at IS NOT NULL THEN 
                CEIL(EXTRACT(EPOCH FROM (ended_at - started_at)) / 60.0)
            ELSE 0
        END
    ), 0)::INTEGER INTO total_minutes
    FROM public.interview_sessions
    WHERE user_uuid = target_user_uuid
        AND started_at >= current_month_start
        AND started_at < current_month_end
        AND status IN ('completed', 'in_progress');

    -- Return usage data for minutes_per_month
    RETURN QUERY SELECT
        'minutes_per_month'::TEXT as usage_type,
        total_minutes as current_usage,
        p_monthly_minute_limit as limit_value,
        CASE 
            WHEN p_monthly_minute_limit > 0 THEN 
                ROUND((total_minutes::NUMERIC / p_monthly_minute_limit::NUMERIC) * 100, 1)
            ELSE 0::NUMERIC 
        END as percentage_used,
        current_month_start as period_start,
        current_month_end as period_end;

END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCTION USAGE NOTES
-- =====================================================

-- 1. Always use p_ prefix for parameters to avoid naming conflicts
-- 2. Handle NULL cases explicitly for better error handling
-- 3. Use proper type casting for numeric calculations
-- 4. Include comprehensive logging for debugging
-- 5. Test functions with real data before deployment
-- 6. Functions should be idempotent where possible
-- 7. Use RAISE NOTICE for debugging, but consider performance impact

-- =====================================================
-- TOP-UP MINUTES SYSTEM (IMPLEMENTED 2025-01-30)
-- =====================================================

-- Function: get_user_available_minutes
-- Purpose: Get total available minutes (monthly + top-up) with usage breakdown
-- Created: 2025-01-30
-- Updated: 2025-01-30 (added top-up usage tracking)
-- Parameters:
--   - p_clerk_id: User's Clerk ID
-- Returns: Table with monthly usage, limits, top-up balance, totals, and top-up usage
--   - monthly_used, monthly_limit, monthly_remaining: Monthly plan usage
--   - topup_balance: Current top-up minutes available
--   - total_available: Total minutes available (monthly + top-up)
--   - topup_total_purchased: Total top-up minutes ever purchased
--   - topup_used: Total top-up minutes used lifetime
-- Usage: SELECT * FROM get_user_available_minutes('clerk_123');
-- Note: Single source of truth - all usage calculated from interview_sessions
CREATE OR REPLACE FUNCTION public.get_user_available_minutes(p_clerk_id TEXT)
RETURNS TABLE(
    monthly_used INTEGER,
    monthly_limit INTEGER,
    monthly_remaining INTEGER,
    topup_balance INTEGER,
    total_available INTEGER
) AS $$
-- See implementation above
$$ LANGUAGE plpgsql;

-- Function: deduct_session_minutes
-- Purpose: Deduct minutes after session ends (monthly first, then top-up)
-- Created: 2025-01-30
-- Parameters:
--   - p_session_id: Session ID to process
-- Returns: Breakdown of minutes used from each source
-- Usage: SELECT * FROM deduct_session_minutes('session_123');
-- Note: Updates session metadata with usage breakdown
CREATE OR REPLACE FUNCTION public.deduct_session_minutes(p_session_id TEXT)
RETURNS TABLE(
    success BOOLEAN,
    minutes_used INTEGER,
    from_monthly INTEGER,
    from_topup INTEGER,
    topup_remaining INTEGER
) AS $$
-- See implementation above
$$ LANGUAGE plpgsql;

-- Function: redeem_coupon
-- Purpose: Redeem a coupon code to add top-up minutes
-- Created: 2025-01-30
-- Updated: 2025-01-30 (added max_uses_per_user support)
-- Parameters:
--   - p_clerk_id: User's Clerk ID
--   - p_code: Coupon code to redeem
-- Returns: Success status, minutes added, and message
-- Usage: SELECT * FROM redeem_coupon('clerk_123', 'WELCOME30');
-- Note: Case-insensitive, tracks redemptions, validates expiry/usage limits (both global and per-user)
CREATE OR REPLACE FUNCTION public.redeem_coupon(p_clerk_id TEXT, p_code TEXT)
RETURNS TABLE(
    success BOOLEAN,
    minutes_added INTEGER,
    message TEXT,
    new_balance INTEGER
) AS $$
DECLARE
    target_user_uuid UUID;
    coupon_rec RECORD;
    user_redemption_count INTEGER := 0;
    current_balance INTEGER := 0;
BEGIN
    -- Get user UUID
    SELECT id INTO target_user_uuid 
    FROM public.users 
    WHERE clerk_id = p_clerk_id;
    
    IF target_user_uuid IS NULL THEN
        RETURN QUERY SELECT 
            FALSE::BOOLEAN as success,
            0::INTEGER as minutes_added,
            'User not found'::TEXT as message,
            0::INTEGER as new_balance;
        RETURN;
    END IF;

    -- Get coupon details (case-insensitive)
    SELECT code, minutes, max_uses, uses_count, max_uses_per_user, expires_at, active
    INTO coupon_rec
    FROM public.coupon_codes
    WHERE UPPER(code) = UPPER(p_code);

    -- Check if coupon exists
    IF coupon_rec IS NULL THEN
        RETURN QUERY SELECT 
            FALSE::BOOLEAN as success,
            0::INTEGER as minutes_added,
            'Invalid coupon code'::TEXT as message,
            0::INTEGER as new_balance;
        RETURN;
    END IF;

    -- Check if coupon is active
    IF NOT coupon_rec.active THEN
        RETURN QUERY SELECT 
            FALSE::BOOLEAN as success,
            0::INTEGER as minutes_added,
            'Coupon is no longer active'::TEXT as message,
            0::INTEGER as new_balance;
        RETURN;
    END IF;

    -- Check if coupon is expired
    IF coupon_rec.expires_at IS NOT NULL AND coupon_rec.expires_at < NOW() THEN
        RETURN QUERY SELECT 
            FALSE::BOOLEAN as success,
            0::INTEGER as minutes_added,
            'Coupon has expired'::TEXT as message,
            0::INTEGER as new_balance;
        RETURN;
    END IF;

    -- Check global usage limit
    IF coupon_rec.uses_count >= coupon_rec.max_uses THEN
        RETURN QUERY SELECT 
            FALSE::BOOLEAN as success,
            0::INTEGER as minutes_added,
            'Coupon has reached maximum uses'::TEXT as message,
            0::INTEGER as new_balance;
        RETURN;
    END IF;

    -- Check per-user usage limit
    SELECT COUNT(*) INTO user_redemption_count
    FROM public.coupon_redemptions
    WHERE user_id = target_user_uuid AND coupon_code = coupon_rec.code;

    IF user_redemption_count >= coupon_rec.max_uses_per_user THEN
        RETURN QUERY SELECT 
            FALSE::BOOLEAN as success,
            0::INTEGER as minutes_added,
            'You have already used this coupon the maximum number of times'::TEXT as message,
            0::INTEGER as new_balance;
        RETURN;
    END IF;

    -- All checks passed, redeem the coupon
    BEGIN
        -- Insert redemption record
        INSERT INTO public.coupon_redemptions (user_id, coupon_code, minutes_added)
        VALUES (target_user_uuid, coupon_rec.code, coupon_rec.minutes);

        -- Update global usage count
        UPDATE public.coupon_codes
        SET uses_count = uses_count + 1
        WHERE code = coupon_rec.code;

        -- Add minutes to user's top-up balance
        INSERT INTO public.user_topup_minutes (user_id, minutes_balance, total_purchased)
        VALUES (target_user_uuid, coupon_rec.minutes, coupon_rec.minutes)
        ON CONFLICT (user_id) 
        DO UPDATE SET 
            minutes_balance = user_topup_minutes.minutes_balance + coupon_rec.minutes,
            total_purchased = user_topup_minutes.total_purchased + coupon_rec.minutes,
            updated_at = NOW();

        -- Get new balance
        SELECT minutes_balance INTO current_balance
        FROM public.user_topup_minutes
        WHERE user_id = target_user_uuid;

        -- Return success
        RETURN QUERY SELECT 
            TRUE::BOOLEAN as success,
            coupon_rec.minutes::INTEGER as minutes_added,
            'Coupon redeemed successfully!'::TEXT as message,
            current_balance::INTEGER as new_balance;

    EXCEPTION WHEN OTHERS THEN
        -- Handle any errors during redemption
        RETURN QUERY SELECT 
            FALSE::BOOLEAN as success,
            0::INTEGER as minutes_added,
            'Error processing coupon redemption'::TEXT as message,
            0::INTEGER as new_balance;
    END;
END;
$$ LANGUAGE plpgsql;

-- Function: add_topup_minutes
-- Purpose: Admin function to directly add top-up minutes
-- Created: 2025-01-30
-- Parameters:
--   - p_clerk_id: User's Clerk ID
--   - p_minutes: Minutes to add
--   - p_reason: Optional reason for audit
-- Returns: Success status and new balance
-- Usage: SELECT * FROM add_topup_minutes('clerk_123', 100, 'Customer support credit');
CREATE OR REPLACE FUNCTION public.add_topup_minutes(
    p_clerk_id TEXT, 
    p_minutes INTEGER,
    p_reason TEXT DEFAULT 'Manual addition'
) RETURNS TABLE(
    success BOOLEAN,
    new_balance INTEGER,
    message TEXT
) AS $$
-- See implementation above
$$ LANGUAGE plpgsql;