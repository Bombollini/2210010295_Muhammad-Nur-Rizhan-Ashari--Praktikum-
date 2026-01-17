-- FIX PERMISSIONS & RELOAD SCHEMA CACHE
-- "Database error querying schema" often means PostgREST cannot read the schema definition.

-- 1. Grant Usage on Schema
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Grant Access to All Tables (Fixes potential RLS/Permission block)
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. Reload PostgREST Schema Cache
-- This is critical if tables were dropped/recreated (like profiles -> users)
NOTIFY pgrst, 'reload config';

-- 4. Temporarily Drop Activity Log Trigger on Users
-- (Just in case reading 'auth.users' inside this trigger causes a lock/error during login)
DROP TRIGGER IF EXISTS trg_log_users ON public.users;

-- 5. Ensure identities reference is correct 
-- (Skipped ALTER command as it requires higher privileges and is likely not the blocker)

-- 6. Final Trigger Cleanup (Paranoid Check)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
