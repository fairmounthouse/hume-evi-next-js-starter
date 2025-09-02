# Session Creation Error Fix

## Problem Identified

The session creation was failing with these errors:
```
❌ CALL FAILED: {}
❌ Error creating session with billing: {}
❌ Failed to create session: {}
```

## Root Cause

The database has a **foreign key constraint** `interview_sessions_user_uuid_fkey` that requires:
- Column: `user_uuid` (UUID type)
- References: `users.id` table

But our code was only setting:
- `user_id` = Clerk ID (string)
- Missing: `user_uuid` = UUID from users table

## Database Schema Analysis

From the successful session data you showed:
```json
{
  "user_id": "user_31lvXxEv2eWuxmyvWxEKmwa4GQX",  // Clerk ID (string)
  "user_uuid": "e3479a5f-7bbf-4e1d-bef1-cb8fb32c90c9"  // UUID (required FK)
}
```

## Fix Applied

### 1. Updated `createSessionWithBilling()` in `utils/supabase-client.ts`

**Before:**
```typescript
if (clerkId && email) {
  await ensureUserExists(clerkId, email);
  sessionData.user_id = clerkId;  // Only set Clerk ID
}
```

**After:**
```typescript
if (clerkId && email) {
  const userUuid = await ensureUserExists(clerkId, email);  // Get UUID back
  sessionData.user_id = clerkId;     // Keep for backward compatibility
  sessionData.user_uuid = userUuid; // Set required UUID for foreign key
}
```

### 2. Updated `InterviewSession` interface

Added the missing field:
```typescript
// USER ASSOCIATION (for Clerk integration)
user_id?: string; // Clerk user ID for RLS policies
user_uuid?: string; // UUID FK to users table (required for database constraints)
```

## How It Works

1. `ensureUserExists(clerkId, email)` calls the `ensure_user_exists` RPC function
2. This function returns the `user_uuid` (UUID) from the `users` table
3. We now set both:
   - `user_id`: Clerk ID string (for compatibility)
   - `user_uuid`: UUID (for database foreign key constraint)

## Verification

The `ensure_user_exists` RPC function:
- Creates user if doesn't exist
- Returns the UUID from users table
- This UUID satisfies the foreign key constraint

## Result

Session creation should now work properly because:
- ✅ `started_at` is provided (NOT NULL constraint satisfied)
- ✅ `user_uuid` is provided (foreign key constraint satisfied)
- ✅ All other fields are optional or have defaults

## Files Modified

- `utils/supabase-client.ts` - Fixed user UUID handling in session creation
