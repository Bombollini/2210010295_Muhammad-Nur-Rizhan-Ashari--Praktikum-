-- CLEANUP TEST USER
-- Run this to delete 'admin@tes.com' fully so you can recreate it.

BEGIN;

-- 1. Delete from public.users first (due to FK)
DELETE FROM public.users WHERE email = 'admin@tes.com';

-- 2. Delete from auth.users (Cascades to identities)
DELETE FROM auth.users WHERE email = 'admin@tes.com';

COMMIT;
