-- DIAGNOSTIC SCRIPT
-- Run this to see what is still attached to your auth.users table

SELECT 
    trigger_schema,
    trigger_name,
    event_manipulation,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users';

-- Check Policies on public.users
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'users';

-- Check Schema Permissions
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_usage_grants 
WHERE object_schema = 'public';
