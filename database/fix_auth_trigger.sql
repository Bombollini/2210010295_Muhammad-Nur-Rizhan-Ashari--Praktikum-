-- Remove legacy triggers that might be referencing the deleted 'public.profiles' table

-- 1. Drop the trigger on auth.users (Common names used in Supabase examples)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_user_created ON auth.users;

-- 2. Drop the function associated with the trigger
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.create_profile_for_user();

-- 3. Also check for any other triggers on auth.users
-- (Manual verification might be needed if custom names were used, 
-- but these are the standard ones causing this specific error)
