-- Performance optimization indexes and materialized views
-- Run these commands in your Supabase SQL editor

-- ============================================================================
-- INDEXES FOR FASTER QUERIES
-- ============================================================================

-- 1. Interview Sessions Performance Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_sessions_user_status 
ON interview_sessions (user_id, status) 
WHERE status = 'completed';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_sessions_created_at_desc 
ON interview_sessions (created_at DESC) 
WHERE status = 'completed';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_sessions_monthly 
ON interview_sessions (user_id, created_at) 
WHERE status = 'completed' AND created_at >= date_trunc('month', NOW());

-- 2. Interviewer Profiles Performance Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interviewer_profiles_composite 
ON interviewer_profiles_new (active, user_id, company_profile_id, seniority_profile_id, difficulty_profile_id)
WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interviewer_profiles_user_active 
ON interviewer_profiles_new (user_id, active) 
WHERE active = true;

-- 3. Interview Cases Performance Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_interview_cases_active_type 
ON interview_cases (active, type, difficulty, industry) 
WHERE active = true;

-- 4. Profile Tables Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_company_profiles_active 
ON company_profiles (active, display_name) 
WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_seniority_profiles_active 
ON seniority_profiles (active, display_name) 
WHERE active = true;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_difficulty_profiles_active 
ON difficulty_profiles (active, display_name) 
WHERE active = true;

-- 5. Users Table Indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_clerk_id 
ON users (clerk_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_updated_at 
ON users (updated_at DESC);

-- ============================================================================
-- MATERIALIZED VIEWS FOR DASHBOARD PERFORMANCE
-- ============================================================================

-- 1. User Dashboard Stats (refreshed every hour)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_dashboard_stats AS
SELECT 
  u.clerk_id,
  u.id as user_uuid,
  COUNT(s.session_id) as total_sessions,
  COUNT(CASE WHEN s.created_at >= date_trunc('month', NOW()) THEN 1 END) as monthly_sessions,
  AVG(
    CASE 
      WHEN s.detailed_analysis IS NOT NULL 
      THEN CAST(s.detailed_analysis->>'summary'->>'total_score' AS numeric)
      ELSE NULL 
    END
  ) as average_score,
  -- Calculate improvement percentage (last 30 days vs previous 30 days)
  (
    SELECT 
      CASE 
        WHEN prev_avg > 0 
        THEN ROUND(((curr_avg - prev_avg) / prev_avg * 100)::numeric, 1)
        ELSE NULL 
      END
    FROM (
      SELECT 
        AVG(
          CASE 
            WHEN s2.detailed_analysis IS NOT NULL 
            THEN CAST(s2.detailed_analysis->>'summary'->>'total_score' AS numeric)
            ELSE NULL 
          END
        ) as curr_avg
      FROM interview_sessions s2 
      WHERE s2.user_id = u.id 
        AND s2.status = 'completed'
        AND s2.created_at >= NOW() - INTERVAL '30 days'
    ) curr,
    (
      SELECT 
        AVG(
          CASE 
            WHEN s3.detailed_analysis IS NOT NULL 
            THEN CAST(s3.detailed_analysis->>'summary'->>'total_score' AS numeric)
            ELSE NULL 
          END
        ) as prev_avg
      FROM interview_sessions s3 
      WHERE s3.user_id = u.id 
        AND s3.status = 'completed'
        AND s3.created_at >= NOW() - INTERVAL '60 days'
        AND s3.created_at < NOW() - INTERVAL '30 days'
    ) prev
  ) as improvement_percentage,
  NOW() as last_updated
FROM users u
LEFT JOIN interview_sessions s ON u.id = s.user_id AND s.status = 'completed'
GROUP BY u.clerk_id, u.id;

-- Create unique index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_dashboard_stats_clerk_id 
ON user_dashboard_stats (clerk_id);

-- 2. Usage Summary Cache (refreshed every 15 minutes)
CREATE MATERIALIZED VIEW IF NOT EXISTS user_usage_cache AS
SELECT 
  u.clerk_id,
  u.id as user_uuid,
  -- Monthly minutes calculation
  COALESCE(SUM(s.duration_seconds), 0) / 60.0 as monthly_minutes_used,
  -- Session count
  COUNT(s.session_id) as monthly_sessions_used,
  -- Last updated timestamp
  NOW() as last_updated
FROM users u
LEFT JOIN interview_sessions s ON u.id = s.user_id 
  AND s.status = 'completed'
  AND s.created_at >= date_trunc('month', NOW())
GROUP BY u.clerk_id, u.id;

-- Create unique index on usage cache
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_usage_cache_clerk_id 
ON user_usage_cache (clerk_id);

-- ============================================================================
-- FUNCTIONS TO REFRESH MATERIALIZED VIEWS
-- ============================================================================

-- Function to refresh dashboard stats (call every hour)
CREATE OR REPLACE FUNCTION refresh_dashboard_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_dashboard_stats;
  RAISE NOTICE 'Dashboard stats refreshed at %', NOW();
END;
$$;

-- Function to refresh usage cache (call every 15 minutes)
CREATE OR REPLACE FUNCTION refresh_usage_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY user_usage_cache;
  RAISE NOTICE 'Usage cache refreshed at %', NOW();
END;
$$;

-- ============================================================================
-- OPTIMIZED RPC FUNCTIONS USING MATERIALIZED VIEWS
-- ============================================================================

-- Optimized quick stats function using materialized view
CREATE OR REPLACE FUNCTION get_user_quick_stats(p_clerk_id text)
RETURNS TABLE(
  total_sessions bigint,
  monthly_sessions bigint,
  average_score numeric,
  improvement_percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    uds.total_sessions,
    uds.monthly_sessions,
    ROUND(uds.average_score::numeric, 1) as average_score,
    uds.improvement_percentage
  FROM user_dashboard_stats uds
  WHERE uds.clerk_id = p_clerk_id;
  
  -- If no data found, return zeros
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT 0::bigint, 0::bigint, NULL::numeric, NULL::numeric;
  END IF;
END;
$$;

-- ============================================================================
-- AUTOMATIC REFRESH SCHEDULE (requires pg_cron extension)
-- ============================================================================

-- Enable pg_cron extension (run as superuser)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule automatic refresh of materialized views
-- SELECT cron.schedule('refresh-dashboard-stats', '0 * * * *', 'SELECT refresh_dashboard_stats();');
-- SELECT cron.schedule('refresh-usage-cache', '*/15 * * * *', 'SELECT refresh_usage_cache();');

-- ============================================================================
-- MANUAL REFRESH COMMANDS (run these initially and when needed)
-- ============================================================================

-- Initial population of materialized views
REFRESH MATERIALIZED VIEW user_dashboard_stats;
REFRESH MATERIALIZED VIEW user_usage_cache;

-- ============================================================================
-- PERFORMANCE MONITORING QUERIES
-- ============================================================================

-- Check index usage
-- SELECT 
--   schemaname,
--   tablename,
--   indexname,
--   idx_tup_read,
--   idx_tup_fetch
-- FROM pg_stat_user_indexes 
-- WHERE schemaname = 'public'
-- ORDER BY idx_tup_read DESC;

-- Check materialized view freshness
-- SELECT 
--   'user_dashboard_stats' as view_name,
--   last_updated,
--   NOW() - last_updated as age
-- FROM user_dashboard_stats 
-- LIMIT 1
-- UNION ALL
-- SELECT 
--   'user_usage_cache' as view_name,
--   last_updated,
--   NOW() - last_updated as age
-- FROM user_usage_cache 
-- LIMIT 1;
