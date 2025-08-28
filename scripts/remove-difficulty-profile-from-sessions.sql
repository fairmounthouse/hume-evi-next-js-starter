-- Remove difficulty_profile_id from interview_sessions table
-- Since we now use combined interviewer profiles that include difficulty, seniority, and company
-- This migration removes the redundant difficulty_profile_id column

-- Step 1: Remove the foreign key constraint first (if it exists)
DO $$
BEGIN
    -- Check if the foreign key constraint exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'interview_sessions_difficulty_profile_id_fkey'
        AND table_name = 'interview_sessions'
    ) THEN
        ALTER TABLE public.interview_sessions 
        DROP CONSTRAINT interview_sessions_difficulty_profile_id_fkey;
        RAISE NOTICE 'Dropped foreign key constraint: interview_sessions_difficulty_profile_id_fkey';
    END IF;
END $$;

-- Step 2: Remove the difficulty_profile_id column
DO $$
BEGIN
    -- Check if the column exists and drop it
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'interview_sessions' 
        AND column_name = 'difficulty_profile_id'
    ) THEN
        ALTER TABLE public.interview_sessions 
        DROP COLUMN difficulty_profile_id;
        RAISE NOTICE 'Dropped column: difficulty_profile_id from interview_sessions';
    ELSE
        RAISE NOTICE 'Column difficulty_profile_id does not exist in interview_sessions';
    END IF;
END $$;

-- Step 3: Verify the table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'interview_sessions' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Step 4: Verify foreign key constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name = 'interview_sessions'
    AND tc.table_schema = 'public';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Successfully removed difficulty_profile_id from interview_sessions!';
    RAISE NOTICE '🎯 Now using combined interviewer profiles only';
    RAISE NOTICE '📊 Difficulty is now part of the interviewer_profiles_new system';
END $$;
