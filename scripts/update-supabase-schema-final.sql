-- Final Schema Update: Remove Feature-Based Limits
-- This script removes unused feature limits and keeps only minute/interview limits
-- Run this in your Supabase SQL editor AFTER the previous migrations

-- Step 1: Remove unused feature-based limits from existing plans
DELETE FROM public.plan_limits 
WHERE limit_type IN ('detailed_analysis_per_month', 'video_review_per_month', 'advanced_analytics');

-- Step 2: Verify only minute and interview limits remain
-- This should only show 'minutes_per_month' and 'interviews_per_day' limits
SELECT p.name, p.plan_key, pl.limit_type, pl.limit_value 
FROM public.plans p
JOIN public.plan_limits pl ON p.id = pl.plan_id
ORDER BY p.name, pl.limit_type;

-- Step 3: Update plan limits to reflect current business model
-- FREE PLAN: 2 minutes, 1 daily interview
UPDATE public.plan_limits 
SET limit_value = 2 
WHERE limit_type = 'minutes_per_month' 
AND plan_id = (SELECT id FROM public.plans WHERE plan_key = 'free_user');

UPDATE public.plan_limits 
SET limit_value = 1 
WHERE limit_type = 'interviews_per_day' 
AND plan_id = (SELECT id FROM public.plans WHERE plan_key = 'free_user');

-- STARTER PLAN: 120 minutes (2 hours), 3 daily interviews
UPDATE public.plan_limits 
SET limit_value = 120 
WHERE limit_type = 'minutes_per_month' 
AND plan_id = (SELECT id FROM public.plans WHERE plan_key = 'starter');

UPDATE public.plan_limits 
SET limit_value = 3 
WHERE limit_type = 'interviews_per_day' 
AND plan_id = (SELECT id FROM public.plans WHERE plan_key = 'starter');

-- PROFESSIONAL PLAN: 300 minutes (5 hours), 5 daily interviews
UPDATE public.plan_limits 
SET limit_value = 300 
WHERE limit_type = 'minutes_per_month' 
AND plan_id = (SELECT id FROM public.plans WHERE plan_key = 'professional');

UPDATE public.plan_limits 
SET limit_value = 5 
WHERE limit_type = 'interviews_per_day' 
AND plan_id = (SELECT id FROM public.plans WHERE plan_key = 'professional');

-- PREMIUM PLAN: Unlimited minutes (999999), unlimited daily interviews (999999)
UPDATE public.plan_limits 
SET limit_value = 999999 
WHERE limit_type = 'minutes_per_month' 
AND plan_id = (SELECT id FROM public.plans WHERE plan_key = 'premium');

UPDATE public.plan_limits 
SET limit_value = 999999 
WHERE limit_type = 'interviews_per_day' 
AND plan_id = (SELECT id FROM public.plans WHERE plan_key = 'premium');

-- Step 4: Clean up any orphaned usage records for removed limit types
DELETE FROM public.user_usage 
WHERE usage_type IN ('detailed_analysis_per_month', 'video_review_per_month', 'advanced_analytics');

-- Step 5: Verify final state
SELECT 
    p.name as plan_name,
    p.plan_key,
    p.price_cents / 100.0 as price_dollars,
    pl.limit_type,
    CASE 
        WHEN pl.limit_value = 999999 THEN 'Unlimited'
        ELSE pl.limit_value::TEXT
    END as limit_display
FROM public.plans p
JOIN public.plan_limits pl ON p.id = pl.plan_id
ORDER BY 
    CASE p.plan_key 
        WHEN 'free_user' THEN 1
        WHEN 'starter' THEN 2
        WHEN 'professional' THEN 3
        WHEN 'premium' THEN 4
    END,
    pl.limit_type;

-- Step 6: Update the create_default_subscription function to ensure new users get Free plan
CREATE OR REPLACE FUNCTION public.create_default_subscription(p_clerk_id TEXT)
RETURNS UUID AS $$
DECLARE
    v_user_id UUID;
    v_free_plan_id UUID;
    v_subscription_id UUID;
BEGIN
    -- Get user ID
    SELECT id INTO v_user_id 
    FROM public.users 
    WHERE clerk_id = p_clerk_id;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not found with clerk_id: %', p_clerk_id;
    END IF;
    
    -- Get Free plan ID
    SELECT id INTO v_free_plan_id 
    FROM public.plans 
    WHERE plan_key = 'free_user';
    
    IF v_free_plan_id IS NULL THEN
        RAISE EXCEPTION 'Free plan not found';
    END IF;
    
    -- Check if user already has an active subscription
    SELECT id INTO v_subscription_id
    FROM public.user_subscriptions
    WHERE user_id = v_user_id AND status = 'active';
    
    -- Only create if no active subscription exists
    IF v_subscription_id IS NULL THEN
        INSERT INTO public.user_subscriptions (
            user_id,
            plan_id,
            status,
            current_period_start,
            current_period_end
        ) VALUES (
            v_user_id,
            v_free_plan_id,
            'active',
            NOW(),
            NOW() + INTERVAL '1 year'  -- Free plan never expires
        )
        RETURNING id INTO v_subscription_id;
        
        RAISE NOTICE 'Created default Free subscription for user: %', p_clerk_id;
    ELSE
        RAISE NOTICE 'User % already has active subscription', p_clerk_id;
    END IF;
    
    RETURN v_subscription_id;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Schema updated successfully!';
    RAISE NOTICE '📊 Current model: All features available to everyone';
    RAISE NOTICE '⏱️  Only limits: minutes_per_month + interviews_per_day';
    RAISE NOTICE '🎯 Business model: Plans only affect usage time, not features';
END $$;
