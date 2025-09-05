-- ============================================================================
-- ROLLBACK SCRIPT: Revert to Migration 20250902081705
-- ============================================================================
-- This script reverts all changes made after migration 20250902081705
-- Target date: 2025-09-02 08:17:05 (recreate_interviewer_profiles_view_with_descriptions)
--
-- Migrations being rolled back (in reverse order):
-- 20250904083727 - create_automatic_usage_tracking
-- 20250904083706 - create_credit_management_functions  
-- 20250904083641 - create_billing_functions
-- 20250904083618 - create_billing_views
-- 20250904083554 - create_usage_ledger_system
-- 20250904083122 - add_column_comments
-- 20250904083112 - add_billing_analytics_view
-- 20250904083101 - add_cleanup_orphaned_sessions_function
-- 20250904083047 - add_billable_duration_trigger
-- 20250904083038 - add_billable_duration_function
-- 20250904083027 - add_connection_tracking_indexes
-- 20250904083018 - add_connection_tracking
-- ============================================================================

-- Start transaction for safety
BEGIN;

-- ============================================================================
-- STEP 1: DROP UNUSED FUNCTIONS (from create_automatic_usage_tracking)
-- ============================================================================

DROP FUNCTION IF EXISTS public.track_usage(TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.track_interview_session(TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.get_user_usage_summary(TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.get_user_usage_summary_with_plan(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.get_plan_limits(TEXT);
DROP FUNCTION IF EXISTS public.get_user_session_breakdown(TEXT, INTEGER);

-- ============================================================================
-- STEP 2: DROP CREDIT MANAGEMENT FUNCTIONS (from create_credit_management_functions)
-- ============================================================================

DROP FUNCTION IF EXISTS public.grant_credits(TEXT, TEXT, TEXT, INTEGER, TIMESTAMP, TEXT);
DROP FUNCTION IF EXISTS public.consume_credits(TEXT, TEXT, INTEGER, TEXT);
DROP FUNCTION IF EXISTS public.get_user_credits(TEXT);
DROP FUNCTION IF EXISTS public.get_credit_balance(TEXT, TEXT);
DROP FUNCTION IF EXISTS public.expire_old_credits();

-- ============================================================================
-- STEP 3: DROP BILLING FUNCTIONS (from create_billing_functions)
-- ============================================================================

DROP FUNCTION IF EXISTS public.check_usage_limit(TEXT, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.can_use_feature(UUID, TEXT, INTEGER);
DROP FUNCTION IF EXISTS public.get_user_subscription_info(TEXT);
DROP FUNCTION IF EXISTS public.create_default_subscription(TEXT);
DROP FUNCTION IF EXISTS public.get_plan_by_key(TEXT);

-- ============================================================================
-- STEP 4: DROP BILLING VIEWS (from create_billing_views)
-- ============================================================================

DROP VIEW IF EXISTS public.user_current_limits;
DROP VIEW IF EXISTS public.user_credit_summary;
DROP VIEW IF EXISTS public.user_usage_summary;

-- ============================================================================
-- STEP 5: DROP BILLING ANALYTICS VIEW (from add_billing_analytics_view)
-- ============================================================================

DROP VIEW IF EXISTS public.billing_analytics;
DROP VIEW IF EXISTS public.usage_analytics;

-- ============================================================================
-- STEP 6: DROP CLEANUP FUNCTION (from add_cleanup_orphaned_sessions_function)
-- ============================================================================

DROP FUNCTION IF EXISTS public.cleanup_orphaned_sessions();

-- ============================================================================
-- STEP 7: DROP BILLABLE DURATION TRIGGER & FUNCTION (from add_billable_duration_*)
-- ============================================================================

DROP TRIGGER IF EXISTS update_billable_duration_trigger ON public.interview_sessions;
DROP FUNCTION IF EXISTS public.update_billable_duration();
DROP FUNCTION IF EXISTS public.calculate_billable_duration(TIMESTAMP, TIMESTAMP);

-- ============================================================================
-- STEP 8: DROP CONNECTION TRACKING INDEXES (from add_connection_tracking_indexes)
-- ============================================================================

DROP INDEX IF EXISTS public.idx_interview_sessions_hume_status;
DROP INDEX IF EXISTS public.idx_interview_sessions_closure_reason;
DROP INDEX IF EXISTS public.idx_interview_sessions_connection_times;
DROP INDEX IF EXISTS public.idx_interview_sessions_billable_duration;
DROP INDEX IF EXISTS public.idx_interview_sessions_last_activity;

-- ============================================================================
-- STEP 9: REMOVE CONNECTION TRACKING COLUMNS (from add_connection_tracking)
-- ============================================================================

ALTER TABLE public.interview_sessions 
DROP COLUMN IF EXISTS hume_connection_status,
DROP COLUMN IF EXISTS hume_connected_at,
DROP COLUMN IF EXISTS hume_disconnected_at,
DROP COLUMN IF EXISTS closure_reason,
DROP COLUMN IF EXISTS billable_duration_seconds,
DROP COLUMN IF EXISTS last_activity_at;

-- ============================================================================
-- STEP 10: DROP UNUSED TABLES (from create_usage_ledger_system)
-- ============================================================================

-- Drop tables in correct order (foreign keys first)
DROP TABLE IF EXISTS public.credit_ledger CASCADE;
DROP TABLE IF EXISTS public.usage_ledger CASCADE;
DROP TABLE IF EXISTS public.plan_limits CASCADE;
DROP TABLE IF EXISTS public.user_subscriptions CASCADE;

-- ============================================================================
-- STEP 11: CLEAN UP PLANS TABLE (revert to simple structure)
-- ============================================================================

-- Remove columns added by billing system
ALTER TABLE public.plans 
DROP COLUMN IF EXISTS plan_key,
DROP COLUMN IF EXISTS price_dollars,
DROP COLUMN IF EXISTS is_free,
DROP COLUMN IF EXISTS description,
DROP COLUMN IF EXISTS is_popular,
DROP COLUMN IF EXISTS minutes_per_month,
DROP COLUMN IF EXISTS active;

-- Keep only the original simple structure
-- (id, plan_name, price_cents, created_at, updated_at should remain)

-- ============================================================================
-- STEP 12: CLEAN UP USERS TABLE (revert to simple structure)
-- ============================================================================

-- Remove all the extra user columns added by billing system
ALTER TABLE public.users 
DROP COLUMN IF EXISTS first_name,
DROP COLUMN IF EXISTS last_name,
DROP COLUMN IF EXISTS full_name,
DROP COLUMN IF EXISTS username,
DROP COLUMN IF EXISTS image_url,
DROP COLUMN IF EXISTS has_image,
DROP COLUMN IF EXISTS primary_email_address_id,
DROP COLUMN IF EXISTS primary_phone_number_id,
DROP COLUMN IF EXISTS two_factor_enabled,
DROP COLUMN IF EXISTS backup_code_enabled,
DROP COLUMN IF EXISTS totp_enabled,
DROP COLUMN IF EXISTS external_id,
DROP COLUMN IF EXISTS last_sign_in_at,
DROP COLUMN IF EXISTS banned,
DROP COLUMN IF EXISTS locked,
DROP COLUMN IF EXISTS lockout_expires_in_seconds,
DROP COLUMN IF EXISTS verification_attempts_remaining,
DROP COLUMN IF EXISTS profile_image_url,
DROP COLUMN IF EXISTS gender,
DROP COLUMN IF EXISTS birthday,
DROP COLUMN IF EXISTS public_metadata,
DROP COLUMN IF EXISTS private_metadata,
DROP COLUMN IF EXISTS unsafe_metadata;

-- Keep only the original simple structure:
-- (id, clerk_id, email, created_at, updated_at)

-- ============================================================================
-- STEP 13: CLEAN UP USER_USAGE TABLE (revert to simple structure)
-- ============================================================================

-- Remove any complex usage tracking columns
ALTER TABLE public.user_usage 
DROP COLUMN IF EXISTS period_start,
DROP COLUMN IF EXISTS period_end;

-- The user_usage table should only have:
-- (id, user_id, usage_type, usage_value, created_at, updated_at)

-- ============================================================================
-- STEP 14: REMOVE MATERIALIZED VIEWS AND PERFORMANCE OPTIMIZATIONS
-- ============================================================================

-- Drop materialized views that were created for billing
DROP MATERIALIZED VIEW IF EXISTS public.user_dashboard_stats;
DROP MATERIALIZED VIEW IF EXISTS public.user_usage_cache;

-- Drop refresh functions
DROP FUNCTION IF EXISTS public.refresh_dashboard_stats();
DROP FUNCTION IF EXISTS public.refresh_usage_cache();
DROP FUNCTION IF EXISTS public.get_user_quick_stats(TEXT);

-- ============================================================================
-- STEP 15: CLEAN UP ANY REMAINING BILLING-RELATED INDEXES
-- ============================================================================

-- Drop indexes that were created for billing performance
DROP INDEX IF EXISTS public.idx_plans_plan_key;
DROP INDEX IF EXISTS public.idx_user_subscriptions_user_plan;
DROP INDEX IF EXISTS public.idx_user_subscriptions_status;
DROP INDEX IF EXISTS public.idx_credit_ledger_user_type;
DROP INDEX IF EXISTS public.idx_credit_ledger_expiry;
DROP INDEX IF EXISTS public.idx_usage_ledger_user_type;
DROP INDEX IF EXISTS public.idx_usage_ledger_created_at;
DROP INDEX IF EXISTS public.idx_user_usage_cache_clerk_id;
DROP INDEX IF EXISTS public.idx_user_dashboard_stats_clerk_id;

-- ============================================================================
-- STEP 16: VERIFY CLEAN STATE
-- ============================================================================

-- Check that we're back to the expected state after 20250902081705
SELECT 
    'Rollback verification - Tables that should exist:' as check_type,
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'interview_sessions',
        'interview_cases', 
        'interviewer_profiles_new',
        'company_profiles',
        'seniority_profiles',
        'difficulty_profiles',
        'prompts',
        'users',
        'user_documents',
        'session_document_references',
        'user_usage',
        'plans',
        'coaching_config'
    )
ORDER BY tablename;

-- Check that billing tables are gone
SELECT 
    'Rollback verification - Tables that should NOT exist:' as check_type,
    tablename 
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'credit_ledger',
        'usage_ledger',
        'plan_limits',
        'user_subscriptions'
    )
ORDER BY tablename;

-- Check interview_sessions columns (should not have connection tracking)
SELECT 
    'interview_sessions columns after rollback:' as check_type,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'interview_sessions'
    AND column_name IN (
        'hume_connection_status',
        'hume_connected_at', 
        'hume_disconnected_at',
        'closure_reason',
        'billable_duration_seconds',
        'last_activity_at'
    );

-- This should return no rows if rollback was successful

-- ============================================================================
-- FINAL SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✅ ROLLBACK COMPLETE!';
    RAISE NOTICE '📅 Successfully reverted to migration: 20250902081705';
    RAISE NOTICE '🗑️  Removed: Connection tracking, billing system, usage ledger, credit system';
    RAISE NOTICE '🎯 Current state: Clean interview system with basic user management';
    RAISE NOTICE '⚠️  Remember to update your TypeScript code to remove references to deleted tables/columns';
END $$;

-- Commit the transaction
COMMIT;
