-- Update Supabase Functions for New Plan Structure
-- This script updates all RPC functions to work with plan_key instead of stripe_price_id

-- Update get_user_subscription_info function
CREATE OR REPLACE FUNCTION public.get_user_subscription_info(p_clerk_id TEXT)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'user_id', u.id,
        'clerk_id', u.clerk_id,
        'email', u.email,
        'plan_name', p.name,
        'plan_key', p.plan_key,
        'plan_price_cents', p.price_cents,
        'subscription_status', us.status,
        'current_period_start', us.current_period_start,
        'current_period_end', us.current_period_end
    ) INTO result
    FROM public.users u
    LEFT JOIN public.user_subscriptions us ON u.id = us.user_id 
        AND us.status = 'active'
        AND us.current_period_start <= NOW() 
        AND us.current_period_end > NOW()
    LEFT JOIN public.plans p ON us.plan_id = p.id
    WHERE u.clerk_id = p_clerk_id
    LIMIT 1;

    IF result IS NULL THEN
        RETURN json_build_object('error', 'User not found');
    END IF;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update check_usage_limit function to work with new plan structure
CREATE OR REPLACE FUNCTION public.check_usage_limit(
    p_clerk_id TEXT,
    p_usage_type TEXT,
    p_amount INTEGER DEFAULT 1
) RETURNS JSON AS $$
DECLARE
    user_uuid UUID;
    current_limit INTEGER;
    current_usage INTEGER;
    period_start TIMESTAMP;
    period_end TIMESTAMP;
    result JSON;
BEGIN
    -- Get user UUID
    SELECT id INTO user_uuid FROM public.users WHERE clerk_id = p_clerk_id;
    
    IF user_uuid IS NULL THEN
        RETURN json_build_object(
            'allowed', false,
            'current_usage', 0,
            'limit_value', 0,
            'remaining', 0,
            'is_unlimited', false,
            'message', 'User not found'
        );
    END IF;

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
    WHERE u.id = user_uuid 
        AND pl.limit_type = p_usage_type
    LIMIT 1;

    -- If no limit found, deny access
    IF current_limit IS NULL THEN
        RETURN json_build_object(
            'allowed', false,
            'current_usage', 0,
            'limit_value', 0,
            'remaining', 0,
            'is_unlimited', false,
            'message', 'No subscription or limit found'
        );
    END IF;

    -- If unlimited (999999), allow
    IF current_limit >= 999999 THEN
        RETURN json_build_object(
            'allowed', true,
            'current_usage', 0,
            'limit_value', -1,
            'remaining', -1,
            'is_unlimited', true
        );
    END IF;

    -- Get current usage in the period
    SELECT COALESCE(SUM(usage_value), 0)
    INTO current_usage
    FROM public.user_usage
    WHERE user_id = user_uuid
        AND usage_type = p_usage_type
        AND period_start <= NOW()
        AND period_end > NOW();

    -- Build result
    result := json_build_object(
        'allowed', (current_usage + p_amount) <= current_limit,
        'current_usage', current_usage,
        'limit_value', current_limit,
        'remaining', GREATEST(0, current_limit - current_usage),
        'is_unlimited', false,
        'percentage_used', CASE 
            WHEN current_limit > 0 THEN (current_usage::DECIMAL / current_limit * 100)
            ELSE 0 
        END
    );

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Update get_user_usage_summary function
CREATE OR REPLACE FUNCTION public.get_user_usage_summary(p_clerk_id TEXT)
RETURNS JSON AS $$
DECLARE
    user_uuid UUID;
    result JSON;
BEGIN
    -- Get user UUID
    SELECT id INTO user_uuid FROM public.users WHERE clerk_id = p_clerk_id;
    
    IF user_uuid IS NULL THEN
        RETURN '[]'::JSON;
    END IF;

    -- Get usage summary for all limit types
    SELECT json_agg(
        json_build_object(
            'limit_type', pl.limit_type,
            'limit_value', CASE 
                WHEN pl.limit_value >= 999999 THEN -1 
                ELSE pl.limit_value 
            END,
            'current_usage', COALESCE(uu.usage_value, 0),
            'remaining', CASE 
                WHEN pl.limit_value >= 999999 THEN -1
                ELSE GREATEST(0, pl.limit_value - COALESCE(uu.usage_value, 0))
            END,
            'percentage_used', CASE 
                WHEN pl.limit_value >= 999999 THEN 0
                WHEN pl.limit_value > 0 THEN (COALESCE(uu.usage_value, 0)::DECIMAL / pl.limit_value * 100)
                ELSE 0 
            END
        )
    ) INTO result
    FROM public.users u
    JOIN public.user_subscriptions us ON u.id = us.user_id 
        AND us.status = 'active'
        AND us.current_period_start <= NOW() 
        AND us.current_period_end > NOW()
    JOIN public.plans p ON us.plan_id = p.id
    JOIN public.plan_limits pl ON p.id = pl.plan_id
    LEFT JOIN (
        SELECT 
            user_id,
            usage_type,
            SUM(usage_value) as usage_value
        FROM public.user_usage 
        WHERE user_id = user_uuid
            AND period_start <= NOW()
            AND period_end > NOW()
        GROUP BY user_id, usage_type
    ) uu ON uu.user_id = u.id AND uu.usage_type = pl.limit_type
    WHERE u.id = user_uuid;

    RETURN COALESCE(result, '[]'::JSON);
END;
$$ LANGUAGE plpgsql;

-- Create helper function to get plan by key
CREATE OR REPLACE FUNCTION public.get_plan_by_key(p_plan_key TEXT)
RETURNS UUID AS $$
DECLARE
    plan_uuid UUID;
BEGIN
    SELECT id INTO plan_uuid FROM public.plans WHERE plan_key = p_plan_key LIMIT 1;
    RETURN plan_uuid;
END;
$$ LANGUAGE plpgsql;

-- Update create_default_subscription to use Free plan
CREATE OR REPLACE FUNCTION public.create_default_subscription(p_clerk_id TEXT)
RETURNS VOID AS $$
DECLARE
    user_uuid UUID;
    free_plan_id UUID;
BEGIN
    -- Get user UUID
    SELECT id INTO user_uuid FROM public.users WHERE clerk_id = p_clerk_id;
    
    IF user_uuid IS NULL THEN
        RAISE EXCEPTION 'User not found: %', p_clerk_id;
    END IF;

    -- Get Free plan ID
    SELECT id INTO free_plan_id FROM public.plans WHERE plan_key = 'free_user' LIMIT 1;
    
    IF free_plan_id IS NULL THEN
        RAISE EXCEPTION 'Free plan not found';
    END IF;
    
    -- Create subscription if none exists
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
END;
$$ LANGUAGE plpgsql;

-- Test the updated functions
SELECT 'Functions updated successfully!' as status;

-- Show current plans with new structure
SELECT 
    name,
    plan_key,
    price_cents,
    (price_cents::DECIMAL / 100) as price_dollars
FROM public.plans 
ORDER BY price_cents;

-- Show plan limits for Free plan (should be 2 minutes, 1 daily interview)
SELECT 
    p.name,
    p.plan_key,
    pl.limit_type,
    pl.limit_value
FROM public.plans p
JOIN public.plan_limits pl ON p.id = pl.plan_id
WHERE p.plan_key = 'free_user'
ORDER BY pl.limit_type;
